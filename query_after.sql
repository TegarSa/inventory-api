SELECT p.category,
       SUM(p.stock) AS total_stock,
       SUM(CASE WHEN t.transaction_type = 'IN' THEN t.qty ELSE 0 END) AS total_in,
       SUM(CASE WHEN t.transaction_type = 'OUT' THEN t.qty ELSE 0 END) AS total_out,
       SUM(t.qty * p.price) AS total_value
FROM products p
JOIN transactions t ON p.id = t.product_id
WHERE p.category = 'Elektronik'
  AND t.created_at BETWEEN '2025-01-01' AND '2025-12-31'
GROUP BY p.category;

