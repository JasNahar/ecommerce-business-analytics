-- Monthly revenue, profit, and AOV
SELECT substr(o.ordered_at, 1, 7) AS month,
       ROUND(SUM(oi.net_revenue), 2) AS revenue,
       ROUND(SUM(oi.net_revenue - oi.cost), 2) AS profit,
       ROUND(SUM(oi.net_revenue) / COUNT(DISTINCT o.order_id), 2) AS aov
FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.status = 'Completed'
GROUP BY month ORDER BY month;

-- Repeat purchase rate
WITH customer_orders AS (
    SELECT customer_id, COUNT(DISTINCT order_id) AS orders
    FROM orders WHERE status = 'Completed' GROUP BY customer_id
)
SELECT ROUND(100.0 * SUM(CASE WHEN orders > 1 THEN 1 ELSE 0 END) / COUNT(*), 2) AS repeat_purchase_pct
FROM customer_orders;

-- Regional/category performance
SELECT r.region_name, p.category,
       ROUND(SUM(oi.net_revenue), 2) AS revenue,
       ROUND(SUM(oi.net_revenue - oi.cost), 2) AS profit
FROM orders o
JOIN regions r ON r.region_id = o.region_id
JOIN order_items oi ON oi.order_id = o.order_id
JOIN products p ON p.product_id = oi.product_id
WHERE o.status = 'Completed'
GROUP BY r.region_name, p.category
ORDER BY revenue DESC;

-- Channel attribution
SELECT c.channel_name,
       COUNT(DISTINCT o.order_id) AS orders,
       ROUND(SUM(oi.net_revenue), 2) AS revenue,
       ROUND(100.0 * SUM(oi.net_revenue) /
             (SELECT SUM(net_revenue) FROM order_items), 2) AS revenue_share_pct
FROM orders o JOIN channels c ON c.channel_id = o.channel_id
JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.status = 'Completed'
GROUP BY c.channel_name ORDER BY revenue DESC;

-- Return rate
SELECT ROUND(100.0 * COUNT(DISTINCT r.return_id) /
       NULLIF(COUNT(DISTINCT oi.order_item_id), 0), 2) AS return_rate_pct
FROM order_items oi
LEFT JOIN returns r ON r.order_item_id = oi.order_item_id;
