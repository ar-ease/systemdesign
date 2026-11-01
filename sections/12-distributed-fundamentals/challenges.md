# Level 12 challenges · Distributed System Fundamentals

## Recall round (+10 XP each)
Answer out loud or in writing **without notes**. Tick only when you can explain it in under 2 minutes.

1. [ ] What is split brain and how does a quorum prevent it?
2. [ ] Why can't you trust wall-clock time across machines? Lamport vs vector clocks?
3. [ ] Walk through a Raft leader election: terms, votes, and what happens on a tie.
4. [ ] With N replicas, why does R + W > N give you strong reads?
5. [ ] Why does a distributed lock need fencing tokens? Describe the bug without them.
6. [ ] What is a CRDT and what kind of app needs one?

## Boss fight (+50 XP)
> A nightly billing job must run exactly once even though 3 scheduler instances run for availability. Design the leader election / locking, including what happens when the leader pauses for 30 s (GC) mid-job.

Rules: 30–45 minutes, draw it in Excalidraw, save your answer as `boss-fight.md` (and the diagram) in this folder. Then ask Claude: *"Act as a senior interviewer. Here is my design for … Grade it 1–10 and tell me what's missing."*

- [ ] Boss defeated (score ≥ 7/10)
