import { supabase } from './utils/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { data, error } = await supabase
      .from('suggestions')
      .select('nama_barang')
      .order('usage_count', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    const suggestions = data.map(r => r.nama_barang);
    res.status(200).json({ status: 'success', data: suggestions });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
