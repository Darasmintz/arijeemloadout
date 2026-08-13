-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Presellers table
CREATE TABLE IF NOT EXISTS presellers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    order_date TIMESTAMP WITH TIME ZONE NOT NULL,
    preseller_id INTEGER NOT NULL REFERENCES presellers(id),
    payment_method VARCHAR(50) DEFAULT 'transfer',
    cashier_name VARCHAR(255) DEFAULT 'Funmi Arijeem',
    outstanding_balance DECIMAL(10, 2) DEFAULT 0,
    delivery_fee DECIMAL(10, 2) DEFAULT 100,
    subtotal DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order counter table
CREATE TABLE IF NOT EXISTS order_counter (
    id SERIAL PRIMARY KEY,
    current_serial INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial counter row if not exists
INSERT INTO order_counter (current_serial)
SELECT 0
WHERE NOT EXISTS (SELECT 1 FROM order_counter);

-- Function to get and increment the next order serial number
-- SECURITY DEFINER allows anon key to run this with elevated privileges
CREATE OR REPLACE FUNCTION get_next_order_serial()
RETURNS INTEGER AS $$
DECLARE
    next_serial INTEGER;
BEGIN
    UPDATE order_counter
    SET current_serial = current_serial + 1,
        updated_at = NOW()
    WHERE id = 1
    RETURNING current_serial INTO next_serial;
    RETURN next_serial;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_presellers_updated_at ON presellers;
CREATE TRIGGER update_presellers_updated_at
    BEFORE UPDATE ON presellers FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE presellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_counter ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES — Allow anon key (no login required)

-- Products
DROP POLICY IF EXISTS "Allow read access to all users" ON products;
DROP POLICY IF EXISTS "Allow insert to authenticated users" ON products;
DROP POLICY IF EXISTS "Allow update to authenticated users" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT USING (true);
CREATE POLICY "anon_insert_products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_products" ON products FOR UPDATE USING (true);
CREATE POLICY "anon_delete_products" ON products FOR DELETE USING (true);

-- Presellers
DROP POLICY IF EXISTS "Allow read access to all users" ON presellers;
DROP POLICY IF EXISTS "Allow insert to authenticated users" ON presellers;
DROP POLICY IF EXISTS "Allow update to authenticated users" ON presellers;
CREATE POLICY "anon_select_presellers" ON presellers FOR SELECT USING (true);
CREATE POLICY "anon_insert_presellers" ON presellers FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_presellers" ON presellers FOR UPDATE USING (true);
CREATE POLICY "anon_delete_presellers" ON presellers FOR DELETE USING (true);

-- Orders
DROP POLICY IF EXISTS "Allow read access to all users" ON orders;
DROP POLICY IF EXISTS "Allow insert to authenticated users" ON orders;
DROP POLICY IF EXISTS "Allow update to authenticated users" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT USING (true);
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE USING (true);

-- Order Items
DROP POLICY IF EXISTS "Allow read access to all users" ON order_items;
DROP POLICY IF EXISTS "Allow insert to authenticated users" ON order_items;
CREATE POLICY "anon_select_order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT WITH CHECK (true);

-- Order Counter
DROP POLICY IF EXISTS "Allow execute function to authenticated users" ON order_counter;
DROP POLICY IF EXISTS "Allow update to authenticated users" ON order_counter;
CREATE POLICY "anon_select_order_counter" ON order_counter FOR SELECT USING (true);
CREATE POLICY "anon_update_order_counter" ON order_counter FOR UPDATE USING (true);

-- Grant execute on function to anon
GRANT EXECUTE ON FUNCTION get_next_order_serial() TO anon;
GRANT EXECUTE ON FUNCTION get_next_order_serial() TO authenticated;

-- Default Products
INSERT INTO products (name, price, active) VALUES
    ('Pepsi Pet 60cl', 4300, true),
    ('Pepsi RGB 50cl', 5600, true),
    ('7up RGB 35cl', 3100, true),
    ('Kommando 30cl', 3100, true),
    ('Kommando 50cl', 4250, true),
    ('Kommando RGB', 3220, true)
ON CONFLICT DO NOTHING;

-- Default Presellers
INSERT INTO presellers (name, active) VALUES
    ('LOADOUT AYOMIDE', true),
    ('LOADOUT MRS BISI', true),
    ('LOADOUT HELEN', true),
    ('LOADOUT MR SUNDAY', true),
    ('LOADOUT MRS TOLU', true),
    ('LOADOUT MISS WUNMI', true),
    ('LOADOUT MRS BUNMI', true),
    ('LOADOUT HAWAU', true),
    ('LOADOUT FATIMOT', true),
    ('LOADOUT CONFIDENCE', true),
    ('LOADOUT TIMILEYIN', true),
    ('LOADOUT MRS KEMI', true),
    ('LOADOUT OMOLARA', true),
    ('LOADOUT ESTHER', true)
ON CONFLICT (name) DO NOTHING;

