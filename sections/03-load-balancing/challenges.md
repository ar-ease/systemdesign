# Level 03 challenges · Load Balancing

## Recall round (+10 XP each)
Answer out loud or in writing **without notes**. Tick only when you can explain it in under 2 minutes.

1. [ ] Round-robin vs least-connections vs IP-hash: when does each one win?
2. [ ] L4 vs L7 load balancing: what can an L7 balancer do that L4 cannot?
3. [ ] How do health checks work, and what goes wrong if they are too aggressive?
4. [ ] Why are sticky sessions a problem, and what do you do instead?
5. [ ] What is anycast, and why do CDNs and DNS providers use it?

## Boss fight (+50 XP)
> Design the load-balancing tier for a 50k req/s API in 2 regions. It must survive the loss of a load balancer and of a whole region. Draw it and state the failover time.

Rules: 30–45 minutes, draw it in Excalidraw, save your answer as `boss-fight.md` (and the diagram) in this folder. Then ask Claude: *"Act as a senior interviewer. Here is my design for … Grade it 1–10 and tell me what's missing."*

- [ ] Boss defeated (score ≥ 7/10)
