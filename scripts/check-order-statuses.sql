-- Check all unique order statuses and count orders with tracking numbers
SELECT 
  status,
  COUNT(*) as order_count,
  COUNT(tracking_number) as orders_with_tracking
FROM orders
GROUP BY status
ORDER BY order_count DESC;

-- Show sample orders with tracking numbers
SELECT 
  id,
  status,
  tracking_number,
  carrier,
  created_at
FROM orders
WHERE tracking_number IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
