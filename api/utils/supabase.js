import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://nglxaddnwsnhyrbmlvll.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nbHhhZGRud3NuaHlyYm1sdmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4OTgzMTEsImV4cCI6MjA5NDQ3NDMxMX0.O9Za7jkVULVIOqUC0f4qHyHtsG9bZD69epjW99u5CV8';

export const supabase = createClient(supabaseUrl, supabaseKey);

export function isAdminId(userId) {
  return String(userId).startsWith('010');
}

export function generateUserId(role) {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export async function logUserAction(userId, actionType, actionDetails, gudangId = null, itemId = null) {
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

export async function updateSuggestions(namaBarang) {
  if (!namaBarang) return;

  try {
    const { data: existing } = await supabase
      .from('suggestions')
      .select('*')
      .eq('nama_barang', namaBarang)
      .single();

    if (existing) {
      await supabase
        .from('suggestions')
        .update({
          usage_count: existing.usage_count + 1,
          last_used: new Date().toISOString()
        })
        .eq('nama_barang', namaBarang);
    } else {
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
