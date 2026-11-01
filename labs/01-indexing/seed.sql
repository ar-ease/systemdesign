-- Lab 01 seed: 100k customers, 5M orders, no secondary indexes yet.
CREATE TABLE customers (
  id         bigint PRIMARY KEY,
  email      text NOT NULL,
  country    text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE orders (
  id          bigint PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES customers(id),
  status      text NOT NULL,          -- pending | paid | shipped | delivered | cancelled
  amount      numeric(10,2) NOT NULL,
  created_at  timestamptz NOT NULL
);

INSERT INTO customers
SELECT g,
       'user' || g || '@example.com',
       (ARRAY['IN','US','GB','DE','BR','SG'])[1 + (g % 6)],
       now() - (random() * interval '3 years')
FROM generate_series(1, 100000) g;

-- Status skew is deliberate: only ~2% of orders are 'pending' (good for a partial index).
INSERT INTO orders
SELECT g,
       1 + floor(random() * 100000)::bigint,
       CASE WHEN r < 0.02 THEN 'pending'
            WHEN r < 0.05 THEN 'cancelled'
            WHEN r < 0.15 THEN 'paid'
            WHEN r < 0.30 THEN 'shipped'
            ELSE 'delivered' END,
       round((random() * 500 + 5)::numeric, 2),
       now() - (random() * interval '2 years')
FROM (SELECT g, random() AS r FROM generate_series(1, 5000000) g) s;

ANALYZE;
