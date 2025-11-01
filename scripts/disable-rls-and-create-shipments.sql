-- Disable RLS completely on shipments table to allow all operations
ALTER TABLE shipments DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public can read shipments (SELECT)" ON shipments;
DROP POLICY IF EXISTS "Users can view their own order shipments (SELECT)" ON shipments;
DROP POLICY IF EXISTS "Sellers can view shipments for their orders (SELECT)" ON shipments;
DROP POLICY IF EXISTS "Owner can select own shipments (SELECT)" ON shipments;
DROP POLICY IF EXISTS "Users can insert their own shipments (INSERT)" ON shipments;
DROP POLICY IF EXISTS "Users can update their own shipments (UPDATE)" ON shipments;
DROP POLICY IF EXISTS "Users can delete their own shipments (DELETE)" ON shipments;
DROP POLICY IF EXISTS "Sellers can insert shipments for their orders (INSERT)" ON shipments;
DROP POLICY IF EXISTS "Sellers can update shipments for their orders (UPDATE)" ON shipments;
DROP POLICY IF EXISTS "Sellers can delete shipments for their orders (DELETE)" ON shipments;

-- Create shipment records for all orders that have tracking numbers but no shipments
INSERT INTO shipments (
  order_id,
  tracking_number,
  carrier,
  status,
  created_at,
  updated_at
)
SELECT 
  o.id,
  o.tracking_number,
  o.shipping_carrier,
  'in_transit',
  o.updated_at,
  o.updated_at
FROM orders o
WHERE o.tracking_number IS NOT NULL
  AND o.tracking_number != ''
  AND NOT EXISTS (
    SELECT 1 FROM shipments s WHERE s.order_id = o.id
  );
