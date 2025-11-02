-- Fix order_items seller_id to match the actual product seller_id
-- This ensures sellers only see orders for their own products

UPDATE order_items
SET seller_id = products.seller_id
FROM products
WHERE order_items.product_id = products.id
  AND order_items.seller_id != products.seller_id;

-- Verify the fix
SELECT 
  oi.id as order_item_id,
  oi.order_id,
  oi.product_id,
  oi.seller_id as current_seller_id,
  p.seller_id as product_seller_id,
  p.title as product_title,
  CASE 
    WHEN oi.seller_id = p.seller_id THEN 'CORRECT'
    ELSE 'MISMATCH'
  END as status
FROM order_items oi
JOIN products p ON oi.product_id = p.id
ORDER BY oi.created_at DESC
LIMIT 20;
