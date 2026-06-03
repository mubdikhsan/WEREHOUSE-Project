import bcrypt from 'bcrypt';
import { supabase, isAdminId, logUserAction } from '../utils/supabase.js';

export default async function handler(req, res) {
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

  const { email, password, role, userId } = req.body;

  if (!email || !password || !role || !userId) {
    return res.status(400).json({ status: 'error', message: 'Semua field wajib diisi' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ status: 'error', message: 'Email atau ID User salah' });
    }

    if (user.role !== role) {
      return res.status(401).json({ status: 'error', message: 'Role tidak sesuai' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ status: 'error', message: 'Password salah' });
    }

    const isActuallyAdmin = String(user.id).startsWith('010');

    await logUserAction(user.id, 'LOGIN', `User ${user.name} logged in as ${isActuallyAdmin ? 'admin' : 'user'}`);

    res.status(200).json({
      status: 'success',
      message: 'Login berhasil',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_admin: isActuallyAdmin
      }
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
}
