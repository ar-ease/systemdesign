# Lab 01 · Indexing

**Interview question:** "This query is slow. Why, and which index would you add?"
**Linked level:** [08 · Database Scaling](../../sections/08-database-scaling/) (plan week 5)
**Reading:** [Use The Index, Luke](https://use-the-index-luke.com/) chapters 1–2

## Start
```bash
cd labs/01-indexing
docker compose up -d          # first start seeds 5M orders (~1–2 min)
docker compose logs -f db     # wait for "database system is ready to accept connections"
docker compose exec db psql -U postgres -d lab
```

Inside `psql`, work through `/lab/queries.sql` **one block at a time** (copy-paste); don't run the whole file in one go.

## Missions
| # | Mission | XP |
| --- | --- | --- |
| 1 | Q1: record time with no index, single-column index, composite index. Explain why the composite removes the Sort node. | 30 |
| 2 | Q2: predict the plan **before** running. Explain the leftmost-prefix rule. | 10 |
| 3 | Q3: partial index. Compare its size with a full index on `status`. | 20 |
| 4 | Q4: explain why an index on a 70%-of-rows value is useless. | 10 |
| 5 | Q5: explain why `lower(email)` skips a plain index; fix with an expression index. | 10 |
| 6 | Q6: list index sizes. What do indexes cost on **writes**? (Bonus: time inserting 100k rows with and without the indexes.) | 20 |

Lab cleared (+100 XP) when `RESULTS.md` has every timing filled in and the "interview answer" written.

## Reset
```bash
docker compose down -v
```

## Reading EXPLAIN quickly
- `Seq Scan` = reads the whole table. `Index Scan` / `Index Only Scan` = uses an index. `Bitmap Heap Scan` = an index finds pages, then the heap is read in bulk.
- `Sort` node above a scan = the ORDER BY was not served by an index.
- `Buffers: shared hit/read` = pages from memory / from disk. Fewer is better.
