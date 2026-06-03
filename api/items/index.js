import { supabase, updateSuggestions } from '../utils/supabase.js';

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

  const { id, gudang_id, nama_barang, stok_awal, stok_datang, satuan, catatan, photo, signature, location } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('items')
      .insert([
        {
          id, gudang_id, nama_barang, stok_awal, stok_datang, satuan, catatan, photo, signature, location
        }
      ]);
    
    if (error) throw error;
    
    await updateSuggestions(nama_barang);
    
    res.status(200).json({ status: 'success', data: { id, gudang_id, nama_barang, stok_awal, stok_datang, satuan, total_stok: stok_awal + stok_datang } });
  } catch (err) {
    console.error('Error inserting item:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
}
