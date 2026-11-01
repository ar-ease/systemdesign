# Level 01 challenges · Core Concepts

## Recall round (+10 XP each)
Answer out loud or in writing **without notes**. Tick only when you can explain it in under 2 minutes.

1. [ ] What is the difference between a *performance* problem and a *scalability* problem?
2. [ ] How much downtime per year do 99.9% and 99.99% availability allow? Why does each extra 9 cost so much?
3. [ ] Name 3 single points of failure in a typical one-server web app and how you would remove each.
4. [ ] Latency vs throughput: give an example where improving one makes the other worse.
5. [ ] Why does `hash(key) % N` hurt when N changes, and how does consistent hashing fix it?
6. [ ] During a network partition, CAP says you must choose. What do you give up in each choice? Give one real system for each.

## Boss fight (+50 XP)
> Your single-server photo app grows from 1k to 1M daily users. Walk through the growth story (scale up → split DB → LB + stateless servers → cache → replicas → shards → queues). For **each step**, name the symptom that forces it and the metric that proves it worked.

Rules: 30–45 minutes, draw it in Excalidraw, save your answer as `boss-fight.md` (and the diagram) in this folder. Then ask Claude: *"Act as a senior interviewer. Here is my design for … Grade it 1–10 and tell me what's missing."*

- [ ] Boss defeated (score ≥ 7/10)
