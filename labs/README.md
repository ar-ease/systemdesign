# Labs

Each lab follows the same loop: **build it → put load on it → break it → write down the numbers**. Copy `templates/lab-results.md` into the lab folder as `RESULTS.md`.

Tools: Docker, PostgreSQL, Redis, PgBouncer, Nginx, Redpanda (Kafka-compatible), [k6](https://k6.io/) for load.

| # | Lab | Build | Break / measure | Interview question it answers | Status |
| --- | --- | --- | --- | --- | --- |
| 01 | [Indexing](01-indexing/) | Postgres with 5M fake orders | `EXPLAIN ANALYZE` before/after B-tree, composite, partial indexes | "Why is this query slow? Which index?" | ready |
| 02 | Transactions & isolation | Two `psql` sessions on a bank table | Lost update, non-repeatable read, phantom; fix with `FOR UPDATE` / SERIALIZABLE | "How do you stop double-booking a seat?" | todo |
| 03 | Data modelling | Schema for a Udemy/BookMyShow-style app | Normalise, then denormalise a hot read; add a materialised view | "Design the schema for X" | todo |
| 04 | Connection pooling | App → PgBouncer → Postgres | k6 at 500 VUs with and without the pool | "Why do serverless apps exhaust DB connections?" | todo |
| 05 | Caching | Redis cache-aside in front of Lab 01 | Hit ratio, p99; cause a stampede then fix it | "Cache invalidation and stampede?" | todo |
| 06 | Read replicas | Postgres primary + streaming replica | Read-after-write on replica, measure lag, promote | "Read-your-writes? Failover?" | todo |
| 07 | Partitioning | Range-partition orders by month | Partition pruning; drop old partition instantly | "How do you archive years of data?" | todo |
| 08 | Sharding | 3 Postgres containers, `hash % 3` then consistent hashing | Add a 4th shard, count moved keys | "Pick a shard key. Hot keys?" | todo |
| 09 | Scale out | Nginx LB → 3 stateless app containers, sessions in Redis | Kill one mid-load; round-robin vs least-conn | "Vertical vs horizontal? Sticky sessions?" | todo |
| 10 | Queues & idempotency | Redpanda + worker; Outbox table | Crash worker mid-job, redeliver, prove no double charge | "Exactly-once? Payments that retry?" | todo |

When you reach a new lab, ask Claude to scaffold it in the same style as Lab 01.
