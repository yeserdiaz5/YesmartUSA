-- Diagnóstico del pedido e5e96b0c
-- Este script muestra información detallada sobre el pedido y sus items

-- 1. Información del pedido
SELECT 
  o.id as order_id,
  o.buyer_email,
  o.status,
  o.created_at
FROM orders o
WHERE o.id LIKE 'e5e96b0c%';

-- 2. Items del pedido con información del producto y seller
SELECT 
  oi.id as order_item_id,
  oi.order_id,
  oi.seller_id as order_item_seller_id,
  oi.product_id,
  p.title as product_title,
  p.seller_id as product_seller_id,
  u1.email as order_item_seller_email,
  u2.email as product_seller_email,
  CASE 
    WHEN oi.seller_id = p.seller_id THEN 'CORRECTO ✓'
    ELSE 'INCORRECTO ✗'
  END as seller_id_status
FROM order_items oi
JOIN products p ON oi.product_id = p.id
LEFT JOIN users u1 ON oi.seller_id = u1.id
LEFT JOIN users u2 ON p.seller_id = u2.id
WHERE oi.order_id LIKE 'e5e96b0c%';

-- 3. Verificar quién es el dueño de las pezoneras
SELECT 
  p.id as product_id,
  p.title,
  p.seller_id,
  u.email as seller_email
FROM products p
JOIN users u ON p.seller_id = u.id
WHERE p.title ILIKE '%pezonera%';
