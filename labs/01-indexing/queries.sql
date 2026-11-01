-- Lab 01 experiments. Run each EXPLAIN, record "Execution Time" in RESULTS.md,
-- then create the index in the next step and run it again.
\timing on

-- ===== Q1: "My orders" page — one customer's latest orders =====
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, status, amount, created_at
FROM orders
WHERE customer_id = 4242
ORDER BY created_at DESC
LIMIT 20;

-- Step 1a: single-column index. Better, but still sorts.
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id);
-- (re-run Q1)

-- Step 1b: composite index matching WHERE + ORDER BY. No sort node any more.
CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON orders (customer_id, created_at DESC);
-- (re-run Q1)

-- ===== Q2: leftmost-prefix rule — does the composite index help this? =====
EXPLAIN (ANALYZE)
SELECT count(*) FROM orders
WHERE created_at > now() - interval '1 day';
-- Predict before running: Seq Scan or Index Scan? Why?

-- ===== Q3: Ops dashboard — pending orders (only ~2% of rows) =====
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, customer_id, created_at
FROM orders
WHERE status = 'pending'
ORDER BY created_at
LIMIT 50;

-- Step 3: partial index — only indexes the 2% of rows we care about.
CREATE INDEX IF NOT EXISTS idx_orders_pending ON orders (created_at) WHERE status = 'pending';
-- (re-run Q3)

-- ===== Q4: low-selectivity filter — will Postgres use an index? =====
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
EXPLAIN (ANALYZE)
SELECT count(*) FROM orders WHERE status = 'delivered';   -- ~70% of rows
-- Explain why the planner ignores (or barely uses) the index here.

-- ===== Q5: function on the column kills the index =====
EXPLAIN (ANALYZE)
SELECT * FROM customers WHERE lower(email) = 'user77@example.com';
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);
-- (re-run: still a Seq Scan — why?)
CREATE INDEX IF NOT EXISTS idx_customers_lower_email ON customers (lower(email));
-- (re-run)

-- ===== Q6: what do indexes cost? =====
SELECT indexrelname AS index, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes ORDER BY pg_relation_size(indexrelid) DESC;
SELECT pg_size_pretty(pg_relation_size('orders')) AS orders_table_size;
