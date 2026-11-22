DROP VIEW IF EXISTS v_monthly_performance;
CREATE VIEW v_monthly_performance AS
SELECT
    substr(o.ordered_at, 1, 7) AS month,
    COUNT(DISTINCT o.order_id) AS orders,
    COUNT(DISTINCT o.customer_id) AS customers,
    ROUND(SUM(oi.net_revenue), 2) AS revenue,
    ROUND(SUM(oi.net_revenue - oi.cost), 2) AS profit,
    ROUND(SUM(oi.net_revenue) / NULLIF(COUNT(DISTINCT o.order_id), 0), 2) AS aov
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.status = 'Completed'
GROUP BY substr(o.ordered_at, 1, 7);

DROP VIEW IF EXISTS v_category_performance;
CREATE VIEW v_category_performance AS
SELECT
    p.category,
    ROUND(SUM(oi.net_revenue), 2) AS revenue,
    ROUND(SUM(oi.net_revenue - oi.cost), 2) AS profit,
    ROUND(SUM(oi.quantity), 0) AS units,
    ROUND(100.0 * SUM(oi.net_revenue - oi.cost) / NULLIF(SUM(oi.net_revenue), 0), 1) AS margin_pct
FROM order_items oi
JOIN products p ON p.product_id = oi.product_id
JOIN orders o ON o.order_id = oi.order_id
WHERE o.status = 'Completed'
GROUP BY p.category;

DROP VIEW IF EXISTS v_channel_performance;
CREATE VIEW v_channel_performance AS
SELECT
    c.channel_name,
    COUNT(DISTINCT o.order_id) AS orders,
    COUNT(DISTINCT o.customer_id) AS customers,
    ROUND(SUM(oi.net_revenue), 2) AS revenue,
    ROUND(100.0 * SUM(oi.net_revenue) / NULLIF((SELECT SUM(net_revenue) FROM order_items), 0), 1) AS revenue_share_pct
FROM orders o
JOIN channels c ON c.channel_id = o.channel_id
JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.status = 'Completed'
GROUP BY c.channel_name;

DROP VIEW IF EXISTS v_rfm;
CREATE VIEW v_rfm AS
WITH snapshot AS (
    SELECT date(MAX(ordered_at), '+1 day') AS snapshot_date FROM orders
),
base AS (
    SELECT
        o.customer_id,
        CAST(julianday(snapshot.snapshot_date) - julianday(MAX(o.ordered_at)) AS INTEGER) AS recency,
        COUNT(DISTINCT o.order_id) AS frequency,
        ROUND(SUM(oi.net_revenue), 2) AS monetary
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    CROSS JOIN snapshot
    WHERE o.status = 'Completed'
    GROUP BY o.customer_id
),
scored AS (
    SELECT *,
        NTILE(5) OVER (ORDER BY recency DESC) AS r_score,
        NTILE(5) OVER (ORDER BY frequency) AS f_score,
        NTILE(5) OVER (ORDER BY monetary) AS m_score
    FROM base
)
SELECT *,
    CASE
        WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
        WHEN r_score >= 4 AND f_score >= 3 THEN 'Loyal Customers'
        WHEN r_score >= 3 AND m_score >= 3 THEN 'Potential Loyalists'
        WHEN r_score <= 2 AND f_score >= 3 THEN 'At Risk'
        WHEN r_score <= 2 THEN 'Hibernating'
        ELSE 'Need Attention'
    END AS rfm_segment
FROM scored;
