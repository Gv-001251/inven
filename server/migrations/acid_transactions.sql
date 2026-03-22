-- =============================================================================
-- ACID-Compliant Stored Procedures for Inventory Management System
-- Run this SQL in Supabase Dashboard > SQL Editor
-- =============================================================================

-- 1. Process Inventory Scan (for inventory.routes.js — uses 'items' table)
-- Atomically updates stock and logs the transaction
CREATE OR REPLACE FUNCTION process_inventory_scan(
  p_item_id UUID,
  p_new_stock NUMERIC,
  p_item_name TEXT,
  p_barcode TEXT,
  p_action TEXT,
  p_quantity NUMERIC,
  p_reason TEXT,
  p_user_name TEXT DEFAULT 'Admin'
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_transaction JSON;
BEGIN
  -- Step 1: Update the item stock
  UPDATE items
  SET stock = p_new_stock
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item with id % not found', p_item_id;
  END IF;

  -- Step 2: Insert the transaction log
  INSERT INTO transactions (
    item_id,
    item_name,
    action,
    quantity,
    reason,
    "user",
    timestamp
  ) VALUES (
    p_item_id,
    p_item_name,
    p_action,
    p_quantity,
    p_reason,
    p_user_name,
    NOW()
  );

  -- Return success indicator
  RETURN json_build_object('success', true);

  -- If any step fails, the entire function rolls back automatically
END;
$$;


-- 2. Process Legacy Inventory Scan (for index.js — uses 'inventory' table)
-- Atomically updates stock and logs the transaction
CREATE OR REPLACE FUNCTION process_legacy_inventory_scan(
  p_item_id UUID,
  p_new_stock NUMERIC,
  p_item_name TEXT,
  p_barcode TEXT,
  p_action TEXT,
  p_quantity NUMERIC,
  p_user_name TEXT,
  p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Step 1: Update the inventory stock
  UPDATE inventory
  SET stock = p_new_stock
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item with id % not found', p_item_id;
  END IF;

  -- Step 2: Insert the transaction log
  INSERT INTO transactions (
    item_id,
    item_name,
    barcode,
    action,
    quantity,
    "user",
    reason
  ) VALUES (
    p_item_id,
    p_item_name,
    p_barcode,
    p_action,
    p_quantity,
    p_user_name,
    p_reason
  );

  -- If any step fails, the entire function rolls back automatically
END;
$$;


-- 3. Process Finished Product Stock Update
-- Atomically updates finished product stock and logs the transaction
CREATE OR REPLACE FUNCTION process_finished_product_stock(
  p_product_id UUID,
  p_new_stock INTEGER,
  p_product_name TEXT,
  p_action TEXT,
  p_quantity INTEGER,
  p_reason TEXT DEFAULT '',
  p_user_name TEXT DEFAULT 'System'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Step 1: Update the finished product stock
  UPDATE finished_products
  SET stock = p_new_stock
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Finished product with id % not found', p_product_id;
  END IF;

  -- Step 2: Insert the transaction log
  INSERT INTO finished_product_transactions (
    product_id,
    product_name,
    action,
    quantity,
    reason,
    user_name
  ) VALUES (
    p_product_id,
    p_product_name,
    p_action,
    p_quantity,
    p_reason,
    p_user_name
  );

  -- If any step fails, the entire function rolls back automatically
END;
$$;


-- 4. Create Product with Inventory Record
-- Atomically inserts a product and its corresponding inventory record
CREATE OR REPLACE FUNCTION create_product_with_inventory(
  p_product_data JSONB
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_product RECORD;
BEGIN
  -- Step 1: Insert the product
  INSERT INTO products (
    name,
    description,
    price,
    category,
    sku,
    barcode,
    hsn_code,
    unit,
    gst_rate,
    stock,
    threshold
  )
  SELECT
    p_product_data->>'name',
    p_product_data->>'description',
    (p_product_data->>'price')::NUMERIC,
    p_product_data->>'category',
    p_product_data->>'sku',
    p_product_data->>'barcode',
    p_product_data->>'hsn_code',
    p_product_data->>'unit',
    (p_product_data->>'gst_rate')::NUMERIC,
    COALESCE((p_product_data->>'stock')::INTEGER, 0),
    COALESCE((p_product_data->>'threshold')::INTEGER, 0)
  RETURNING * INTO v_product;

  -- Step 2: Create the corresponding inventory record
  INSERT INTO inventory (
    product_id,
    quantity
  ) VALUES (
    v_product.id,
    0
  );

  -- Return the created product as JSON
  RETURN row_to_json(v_product);

  -- If any step fails, the entire function rolls back automatically
END;
$$;


-- 5. Create Employee with Notification
-- Atomically inserts an employee record and a welcome notification
-- (Auth user creation is handled in JS since it uses the Supabase Auth API)
CREATE OR REPLACE FUNCTION create_employee_with_notification(
  p_employee_id UUID,
  p_name TEXT,
  p_role_id UUID,
  p_designation TEXT DEFAULT 'Associate',
  p_department TEXT DEFAULT 'Operations',
  p_email TEXT DEFAULT NULL,
  p_role_name TEXT DEFAULT 'Staff'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Step 1: Insert the employee record
  INSERT INTO employees (
    id,
    name,
    role_id,
    designation,
    department,
    email
  ) VALUES (
    p_employee_id,
    p_name,
    p_role_id,
    p_designation,
    p_department,
    p_email
  );

  -- Step 2: Insert the welcome notification
  INSERT INTO notifications (
    title,
    message,
    severity,
    read,
    meta
  ) VALUES (
    'New employee added',
    p_name || ' joined as ' || p_role_name || '.',
    'success',
    false,
    jsonb_build_object('employeeId', p_employee_id)
  );

  -- If any step fails, the entire function rolls back automatically
END;
$$;
