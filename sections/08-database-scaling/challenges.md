# Level 08 challenges · Database Scaling

## Recall round (+10 XP each)
Answer out loud or in writing **without notes**. Tick only when you can explain it in under 2 minutes.

1. [ ] Why does a composite index on `(a, b)` help `WHERE a = ?` but not `WHERE b = ?`?
2. [ ] With read replicas, how do you guarantee a user reads their own write right after saving?
3. [ ] Partitioning vs sharding: what is the difference?
4. [ ] How do you pick a shard key? What happens with a celebrity / hot key?
5. [ ] Why do serverless functions exhaust database connections, and how does a pooler fix it?
6. [ ] When would you denormalise or add a materialised view instead of adding an index?

## Boss fight (+50 XP)
> The `orders` table has 2B rows and the 'my orders' page has a p99 of 2 s. Write a step-by-step plan from the cheapest fix to the most expensive, with the metric you check after each step.

Rules: 30–45 minutes, draw it in Excalidraw, save your answer as `boss-fight.md` (and the diagram) in this folder. Then ask Claude: *"Act as a senior interviewer. Here is my design for … Grade it 1–10 and tell me what's missing."*

- [ ] Boss defeated (score ≥ 7/10)
