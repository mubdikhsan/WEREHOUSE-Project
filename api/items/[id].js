import { supabase, updateSuggestions } from '../utils/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  if (req.method === 'PUT') {
    const { nama_barang, stok_awal, stok_datang, satuan, catatan, photo, signature, location } = req.body;
    
    try {
      const { data, error } = await supabase
        .from('items')
        .update({
          nama_barang, stok_awal, stok_datang, satuan, catatan, photo, signature, location
        })
        .eq('id', id);
      
      if (error) throw error;
      
      await updateSuggestions(nama_barang);
      
      res.status(200).json({ status: 'success', data: { id, ...req.body } });
    } catch (err) {
      console.error('Error updating item:', err);
      res.status(500).json({ status: 'error', message: err.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { data, error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      res.status(200).json({ status: 'success', message: 'Item deleted successfully' });
    } catch (err) {
      console.error('Error deleting item:', err);
      res.status(500).json({ status: 'error', message: err.message });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
