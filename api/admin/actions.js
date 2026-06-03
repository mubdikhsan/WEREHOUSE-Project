import { supabase } from '../../utils/supabase.js';

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
      .from('user_actions')
      .select(`
        *,
        users:user_id (name, email, role)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.status(200).json({ status: 'success', data });
  } catch (err) {
    console.error('Error fetching user actions:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
}
