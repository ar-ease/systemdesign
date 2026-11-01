# Lab 01 results · Indexing

Date: · Machine:

| Query | No index (ms) | After index (ms) | Index used | Plan change |
| --- | --- | --- | --- | --- |
| Q1 my orders | | single: / composite: | | |
| Q2 last day (composite only) | | — | | |
| Q3 pending (partial) | | | | |
| Q4 status = delivered | | | | |
| Q5 lower(email) | | plain: / expression: | | |

| Index | Size |
| --- | --- |
| orders table | |
| idx_orders_customer_created | |
| idx_orders_pending | |
| idx_orders_status | |

## What surprised me

## Interview answer (3 sentences)
