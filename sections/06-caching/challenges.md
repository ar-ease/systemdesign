# Level 06 challenges · Caching

## Recall round (+10 XP each)
Answer out loud or in writing **without notes**. Tick only when you can explain it in under 2 minutes.

1. [ ] Cache-aside vs write-through vs write-back: what are the consistency and durability risks of each?
2. [ ] LRU vs LFU: which one survives a one-off scan of the whole catalogue better?
3. [ ] What is a cache stampede, and give 3 ways to prevent it.
4. [ ] Why is cache invalidation hard? Describe a race that leaves stale data in cache-aside.
5. [ ] What should and should not go on a CDN?

## Boss fight (+50 XP)
> A product page takes 100k req/s during a flash sale, and the price and stock must not be wrong. Design the caching layers (CDN, app, Redis, DB) and say exactly what is cached where and for how long.

Rules: 30–45 minutes, draw it in Excalidraw, save your answer as `boss-fight.md` (and the diagram) in this folder. Then ask Claude: *"Act as a senior interviewer. Here is my design for … Grade it 1–10 and tell me what's missing."*

- [ ] Boss defeated (score ≥ 7/10)
