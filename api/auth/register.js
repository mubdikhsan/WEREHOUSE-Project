import bcrypt from 'bcrypt';
import { supabase, isAdminId, logUserAction } from '../utils/supabase.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { name, email, password, role, userId } = req.body;

  if (!name || !email || !password || !role || !userId) {
    return res.status(400).json({ status: 'error', message: 'Semua field wajib diisi' });
  }

  if (password.length < 6) {
    return res.status(400).json({ status: 'error', message: 'Password minimal 6 karakter' });
  }

  const validRoles = ['Kepala Dapur', 'Akuntansi', 'Pengawas Gizi', 'Admin Gudang', 'Asisten Lapangan', 'user'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ status: 'error', message: 'Role tidak valid' });
  }

  try {
    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Email sudah terdaftar' });
    }

    // Check if userId already exists
    const { data: existingId } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingId) {
      return res.status(400).json({ status: 'error', message: 'ID User sudah digunakan' });
    }

    // Check if ID matches predefined admin ID for the role
    const isAdmin = isAdminId(userId, role);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          name,
          email,
          password: hashedPassword,
          role,
          is_admin: isAdmin
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Log registration action
    await logUserAction(userId, 'REGISTER', `User ${name} registered with role ${role} as ${isAdmin ? 'admin' : 'user'}`);

    res.status(200).json({ 
      status: 'success', 
      message: 'Registrasi berhasil', 
      data: { id: data.id, name: data.name, email: data.email, role: data.role, is_admin: data.is_admin } 
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
}
