PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS regions (
    region_id INTEGER PRIMARY KEY,
    region_name TEXT NOT NULL UNIQUE,
    country TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS channels (
    channel_id INTEGER PRIMARY KEY,
    channel_name TEXT NOT NULL UNIQUE,
    channel_type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
    customer_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    signup_date TEXT NOT NULL,
    region_id INTEGER NOT NULL REFERENCES regions(region_id),
    loyalty_member INTEGER NOT NULL CHECK (loyalty_member IN (0, 1)),
    segment_cohort TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    product_id INTEGER PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit_price REAL NOT NULL CHECK (unit_price >= 0),
    unit_cost REAL NOT NULL CHECK (unit_cost >= 0),
    active INTEGER NOT NULL CHECK (active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS orders (
    order_id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
    channel_id INTEGER NOT NULL REFERENCES channels(channel_id),
    region_id INTEGER NOT NULL REFERENCES regions(region_id),
    ordered_at TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Completed', 'Processing', 'Cancelled')),
    gross_revenue REAL NOT NULL CHECK (gross_revenue >= 0),
    discount_amount REAL NOT NULL CHECK (discount_amount >= 0)
);

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id),
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    gross_revenue REAL NOT NULL CHECK (gross_revenue >= 0),
    discount_amount REAL NOT NULL CHECK (discount_amount >= 0),
    net_revenue REAL NOT NULL CHECK (net_revenue >= 0),
    cost REAL NOT NULL CHECK (cost >= 0)
);

CREATE TABLE IF NOT EXISTS returns (
    return_id INTEGER PRIMARY KEY,
    order_item_id INTEGER NOT NULL REFERENCES order_items(order_item_id),
    returned_quantity INTEGER NOT NULL CHECK (returned_quantity > 0),
    refund_amount REAL NOT NULL CHECK (refund_amount >= 0),
    return_reason TEXT NOT NULL,
    returned_date TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(ordered_at);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel_id);
CREATE INDEX IF NOT EXISTS idx_orders_region ON orders(region_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_returns_item ON returns(order_item_id);
