import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import bcrypt from 'bcrypt';

const app = express();
const port = 3001;

app.use(cors({
  origin: ['http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean)
}));
app.use(express.json({ limit: '5mb' }));

// Konfigurasi Supabase Client
const supabaseUrl = 'https://nglxaddnwsnhyrbmlvll.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nbHhhZGRud3NuaHlyYm1sdmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4OTgzMTEsImV4cCI6MjA5NDQ3NDMxMX0.O9Za7jkVULVIOqUC0f4qHyHtsG9bZD69epjW99u5CV8';

const supabase = createClient(supabaseUrl, supabaseKey);

// Start server first
const server = app.listen(port, () => {
  console.log(`🚀 Server Backend berjalan di http://localhost:${port}`);
  console.log('Server is listening and will keep running...');
});

// Prevent server from exiting
server.on('close', () => {
  console.log('Server closed unexpectedly');
});

// Keep process alive
process.stdin.resume();

// Test koneksi setelah server start
supabase.from('gudang').select('*').limit(1).then(({ data, error }) => {
  if (error) {
    console.error('❌ Gagal terhubung ke Supabase:', error.message);
  } else {
    console.log('✅ Berhasil terhubung ke Supabase!');
  }
}).catch(err => {
  console.error('Error testing connection:', err);
});

// API endpoint untuk mengetes koneksi database
app.get('/api/test', async (req, res) => {
  try {
    const { data, error } = await supabase.from('gudang').select('*').limit(1);
    if (error) throw error;
    res.json({ status: 'success', data: { message: 'Koneksi Vite dan Supabase Berhasil!' } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET semua gudang
app.get('/api/gudang', async (req, res) => {
  console.log('GET /api/gudang called');
  try {
    const { data, error } = await supabase.from('gudang').select('*');
    if (error) throw error;
    console.log('Gudang data:', data);
    res.json({ status: 'success', data: data });
  } catch (err) {
    console.error('Error fetching gudang:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET items berdasarkan gudang_id
app.get('/api/items/:gudangId', async (req, res) => {
  const { gudangId } = req.params;
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('gudang_id', gudangId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ status: 'success', data: data });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST item baru
app.post('/api/items', async (req, res) => {
  console.log('POST /api/items called');
  const { id, gudang_id, nama_barang, stok_awal, stok_datang, satuan, catatan, photo, signature, location } = req.body;
  
  console.log('Photo length:', photo ? photo.length : 'null');
  console.log('Signature length:', signature ? signature.length : 'null');
  console.log('Inserting item into gudang:', gudang_id, 'with data:', {
    id, nama_barang, stok_awal, stok_datang, satuan
  });
  
  try {
    const { data, error } = await supabase
      .from('items')
      .insert([
        {
          id, gudang_id, nama_barang, stok_awal, stok_datang, satuan, catatan, photo, signature, location
        }
      ]);
    
    if (error) throw error;
    
    console.log('Item inserted successfully into items table');
    
    // Update suggestions (separate table for autocomplete)
    await updateSuggestions(nama_barang);
    
    res.json({ status: 'success', data: { id, gudang_id, nama_barang, stok_awal, stok_datang, satuan, total_stok: stok_awal + stok_datang } });
  } catch (err) {
    console.error('Error inserting item:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// PUT update item
app.put('/api/items/:id', async (req, res) => {
  console.log('PUT /api/items/:id called with body:', req.body);
  const { id } = req.params;
  const { nama_barang, stok_awal, stok_datang, satuan, catatan, photo, signature, location } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('items')
      .update({
        nama_barang, stok_awal, stok_datang, satuan, catatan, photo, signature, location
      })
      .eq('id', id);
    
    if (error) throw error;
    
    console.log('Item updated successfully');
    
    // Update suggestions
    await updateSuggestions(nama_barang);
    
    res.json({ status: 'success', data: { id, ...req.body } });
  } catch (err) {
    console.error('Error updating item:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// DELETE item
app.delete('/api/items/:id', async (req, res) => {
  console.log('DELETE /api/items/:id called with id:', req.params.id);
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    console.log('Item deleted successfully');
    res.json({ status: 'success', message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting item:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET suggestions
app.get('/api/suggestions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('suggestions')
      .select('nama_barang')
      .order('usage_count', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    const suggestions = data.map(r => r.nama_barang);
    res.json({ status: 'success', data: suggestions });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// Helper function untuk update suggestions
async function updateSuggestions(namaBarang) {
  if (!namaBarang) return;

  try {
    // Check if suggestion exists
    const { data: existing } = await supabase
      .from('suggestions')
      .select('*')
      .eq('nama_barang', namaBarang)
      .single();

    if (existing) {
      // Update existing
      await supabase
        .from('suggestions')
        .update({
          usage_count: existing.usage_count + 1,
          last_used: new Date().toISOString()
        })
        .eq('nama_barang', namaBarang);
    } else {
      // Insert new
      await supabase
        .from('suggestions')
        .insert([
          {
            nama_barang: namaBarang,
            usage_count: 1,
            last_used: new Date().toISOString()
          }
        ]);
    }
  } catch (err) {
    console.error('Error updating suggestions:', err);
  }
}

// Helper function untuk generate user ID
function generateUserId(role) {
  // User ID: random string
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Predefined admin IDs mapping
const ADMIN_IDS = {
  '01001': 'Kepala Dapur',
  '01021': 'Akuntansi',
  '01022': 'Pengawas Gizi',
  '01031': 'Admin Gudang',
  '01032': 'Asisten Lapangan'
};

// Helper function untuk check if ID is admin
function isAdminId(userId, role) {
  return String(userId).startsWith('010');
}

// Helper function untuk log user action
async function logUserAction(userId, actionType, actionDetails, gudangId = null, itemId = null) {
  try {
    await supabase.from('user_actions').insert([
      {
        user_id: userId,
        action_type: actionType,
        action_details: actionDetails,
        gudang_id: gudangId,
        item_id: itemId
      }
    ]);
  } catch (err) {
    console.error('Error logging user action:', err);
  }
}

// POST register new user
app.post('/api/auth/register', async (req, res) => {
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

    res.json({ status: 'success', message: 'Registrasi berhasil', data: { id: data.id, name: data.name, email: data.email, role: data.role, is_admin: data.is_admin } });
  } catch (err) {
    console.error('Error registering user:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST login
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role, userId } = req.body;

  if (!email || !password || !role || !userId) {
    return res.status(400).json({ status: 'error', message: 'Semua field wajib diisi' });
  }

  try {
    // Find user by email and userId
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ status: 'error', message: 'Email atau ID User salah' });
    }

    // Check role
    if (user.role !== role) {
      return res.status(401).json({ status: 'error', message: 'Role tidak sesuai' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ status: 'error', message: 'Password salah' });
    }

    const isActuallyAdmin = String(user.id).startsWith('010');

    // Log login action
    await logUserAction(user.id, 'LOGIN', `User ${user.name} logged in as ${isActuallyAdmin ? 'admin' : 'user'}`);

    res.json({
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
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET user actions (for admin)
app.get('/api/admin/actions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_actions')
      .select(`
        *,
        users:user_id (name, email, role)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json({ status: 'success', data });
  } catch (err) {
    console.error('Error fetching user actions:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET all users (for admin)
app.get('/api/admin/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Remove password from response
    const usersWithoutPassword = data.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({ status: 'success', data: usersWithoutPassword });
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ status: 'error', message: err.message });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
