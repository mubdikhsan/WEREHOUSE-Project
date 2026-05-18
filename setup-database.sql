-- Setup Database Tables for Warehouse Management System
-- Run this in Supabase SQL Editor

-- Drop existing tables to recreate with new schema
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS gudang CASCADE;
DROP TABLE IF EXISTS suggestions CASCADE;

-- Create gudang table
CREATE TABLE gudang (
  id VARCHAR(50) PRIMARY KEY,
  nama_gudang VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  css_class VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create items table
CREATE TABLE items (
  id VARCHAR(50) PRIMARY KEY,
  gudang_id VARCHAR(50) REFERENCES gudang(id) ON DELETE CASCADE,
  nama_barang VARCHAR(255) NOT NULL,
  stok_awal INTEGER DEFAULT 0,
  stok_datang INTEGER DEFAULT 0,
  total_stok INTEGER GENERATED ALWAYS AS (stok_awal + stok_datang) STORED,
  satuan VARCHAR(50),
  catatan TEXT,
  photo TEXT,
  signature TEXT,
  location TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create suggestions table
CREATE TABLE suggestions (
  id SERIAL PRIMARY KEY,
  nama_barang VARCHAR(255) UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 1,
  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Kepala Dapur', 'Akuntansi', 'Pengawas Gizi', 'Admin Gudang', 'Asisten Lapangan', 'user')),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predefined admin IDs
-- These IDs are hardcoded and will automatically make users admin when registered with correct role
-- Kepala Dapur: 01001
-- Akuntansi: 01021
-- Pengawas Gizi: 01022
-- Admin Gudang: 01031
-- Asisten Lapangan: 01032

-- Create user_actions table for logging
CREATE TABLE user_actions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  action_details TEXT,
  gudang_id VARCHAR(50),
  item_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample gudang data
INSERT INTO gudang (id, nama_gudang, icon, css_class) VALUES
  ('basah', 'Gudang Basah', '💧', 'card-basah'),
  ('kering', 'Gudang Kering', '📦', 'card-kering'),
  ('dapur', 'Gudang Dapur', '🍳', 'card-dapur'),
  ('kimia', 'Gudang Kimia', '🧪', 'card-kimia')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_gudang_id ON items(gudang_id);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);
CREATE INDEX IF NOT EXISTS idx_suggestions_usage_count ON suggestions(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_suggestions_nama_barang ON suggestions(nama_barang);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_created_at ON user_actions(created_at);

-- Enable Row Level Security (optional - for security)
ALTER TABLE gudang ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - adjust as needed)
CREATE POLICY "Enable all access for gudang" ON gudang FOR ALL USING (true);
CREATE POLICY "Enable all access for items" ON items FOR ALL USING (true);
CREATE POLICY "Enable all access for suggestions" ON suggestions FOR ALL USING (true);
CREATE POLICY "Enable all access for users" ON users FOR ALL USING (true);
CREATE POLICY "Enable all access for user_actions" ON user_actions FOR ALL USING (true);
