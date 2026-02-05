-- ========================================
-- PRODUCT DELETION RAW SQL QUERIES
-- ========================================

-- A) CHECK IF PRODUCT IS LINKED TO ANY ORDER ITEMS
SELECT
  p.id AS product_id,
  COUNT(DISTINCT oi.id) AS order_items_count,
  COUNT(DISTINCT coi.id) AS custom_order_items_count
FROM products p
LEFT JOIN product_variants pv ON pv.product_id = p.id
LEFT JOIN order_items oi ON oi.variant_id = pv.id
LEFT JOIN custom_order_items coi ON coi.variant_id = pv.id
WHERE p.id = :product_id
GROUP BY p.id;

-- B) LIST RELATED ORDER STATUSES (NORMAL + CUSTOM)
-- Normal orders linked to product
SELECT DISTINCT o.id, o.order_number, o.status
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN product_variants pv ON pv.id = oi.variant_id
WHERE pv.product_id = :product_id;

-- Custom orders linked to product
SELECT DISTINCT co.id, co.order_number, co.status
FROM custom_orders co
JOIN custom_order_items coi ON coi.custom_order_id = co.id
JOIN product_variants pv ON pv.id = coi.variant_id
WHERE pv.product_id = :product_id;

-- C) MOVE TO TRASH (SOFT DELETE)
BEGIN;

UPDATE products
SET is_deleted = TRUE,
    is_active = FALSE,
    deleted_at = NOW(),
    deleted_by = :admin_id
WHERE id = :product_id;

INSERT INTO product_deletion_requests (id, product_id, created_at, created_by, reason, status)
VALUES (gen_random_uuid(), :product_id, NOW(), :admin_id, :reason, 'PENDING')
ON CONFLICT (product_id) DO UPDATE
SET status='PENDING', created_at=NOW(), created_by=:admin_id, reason=:reason;

COMMIT;

-- D) HARD DELETE PRODUCT (PERMANENT DELETE)
BEGIN;

-- Remove cart items
DELETE FROM cart_items
WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = :product_id);

-- Remove stock movements
DELETE FROM stock_movements
WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = :product_id);

-- Remove return_items referencing order_items/custom_order_items of this product
DELETE FROM return_items
WHERE order_item_id IN (
  SELECT oi.id
  FROM order_items oi
  JOIN product_variants pv ON pv.id = oi.variant_id
  WHERE pv.product_id = :product_id
)
OR custom_order_item_id IN (
  SELECT coi.id
  FROM custom_order_items coi
  JOIN product_variants pv ON pv.id = coi.variant_id
  WHERE pv.product_id = :product_id
);

-- ONLY for "permanent-with-orders" option:
DELETE FROM order_items
WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = :product_id);

DELETE FROM custom_order_items
WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = :product_id);

-- Remove product images
DELETE FROM product_images WHERE product_id = :product_id;

-- Remove variants
DELETE FROM product_variants WHERE product_id = :product_id;

-- Remove deletion request
DELETE FROM product_deletion_requests WHERE product_id = :product_id;

-- Remove product
DELETE FROM products WHERE id = :product_id;

COMMIT;

-- E) MARK REQUEST AS DELETED
UPDATE product_deletion_requests
SET status='DELETED'
WHERE product_id = :product_id;

-- F) RESTORE FROM TRASH
BEGIN;

UPDATE products
SET is_deleted = FALSE,
    is_active = TRUE,
    deleted_at = NULL,
    deleted_by = NULL
WHERE id = :product_id;

UPDATE product_deletion_requests
SET status='RESTORED'
WHERE product_id = :product_id;

COMMIT;
