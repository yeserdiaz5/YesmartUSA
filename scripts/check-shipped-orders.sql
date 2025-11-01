-- Check for shipped orders with tracking numbers
SELECT 
  id,
  status,
  tracking_number,
  carrier,
  created_at,
  buyer_email
FROM orders
WHERE status = 'shipped'
  AND tracking_number IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
