# Level 13 challenges · Distributed Transactions

## Recall round (+10 XP each)
Answer out loud or in writing **without notes**. Tick only when you can explain it in under 2 minutes.

1. [ ] Why is 2PC called a blocking protocol? What happens if the coordinator dies?
2. [ ] Saga: orchestration vs choreography — pros and cons.
3. [ ] What is a compensating action? Give one for 'charge card' and one for 'reserve seat'.
4. [ ] What is the dual-write problem, and how does the Outbox pattern solve it?
5. [ ] Why must every saga step be idempotent?

## Boss fight (+50 XP)
> Design checkout across Order, Payment and Inventory services. Show the saga steps, compensations, the outbox, and what the user sees if payment succeeds but inventory fails.

Rules: 30–45 minutes, draw it in Excalidraw, save your answer as `boss-fight.md` (and the diagram) in this folder. Then ask Claude: *"Act as a senior interviewer. Here is my design for … Grade it 1–10 and tell me what's missing."*

- [ ] Boss defeated (score ≥ 7/10)
