# System Design Quest

A self-study repo that works like a game: **18 levels** (from the AlgoMaster syllabus), **10 Docker labs** (database and infra work you run on your laptop), and **9 boss systems** (timed full designs).

## Play it in the browser (recommended)
```bash
cd web
npm install        # first time only
npm run dev
```
Open http://localhost:3000.

| Page | What you do there |
| --- | --- |
| **Dashboard** | Today's quest, XP and rank, streak, activity heatmap, 12-week plan, level map |
| **Levels → a level** | Tick topics, write notes, play the flashcard recall round, fight the boss (45-min timer) |
| **Studio** | Learn by drawing. **System design**: drag in load balancers, caches, queues and so on, and connect them; the coach checks your design live and explains wrong approaches (“✋ Not like this”). **Database design**: build tables, keys and indexes; the ER diagram and SQL update as you type. Hints and reference solutions included |
| **Review** | Spaced recall across every level you've started (`space` reveal · `1` again · `2` got it) |
| **Labs** | Lab instructions + a `RESULTS.md` editor; unbuilt labs give you a prompt to ask Claude to set them up |
| **Systems** | Timed system-design interviews with a mock-interviewer prompt and score |

**Everything the app saves is a normal file in this repo**, so `git commit` still saves your progress:
- `progress.json` stores XP, streak, ticks and scores
- `sections/<level>/notes/<topic>.md` holds your concept notes
- `sections/<level>/boss-fight.md` holds your boss-fight answers
- `systems/<name>.md` holds your full designs
- `labs/<lab>/RESULTS.md` holds your lab numbers
- `studio/*.json` holds your Studio drawings and schemas

The app is meant to run locally. If you deploy it somewhere read-only (like Vercel), it still works but saves to your browser instead of the repo.

**XP:** note 20 · flashcard known 10 · Studio step 30 · boss ≥ 7/10 50 · lab 100 · system ≥ 7/10 150. **Ranks:** Intern → Junior (500) → Mid (1500) → Senior (3000) → Staff (5000).

You can also skip the app and edit the Markdown directly. `PROGRESS.md` is the manual tracker for that.

## How it works
The learning loop is the same for every topic:

> **what breaks → the idea that fixes it → I design it → I put it under load → I fix what breaks → I write down the numbers**

| Thing | Where | What you do |
| --- | --- | --- |
| Level map, XP, streak | the app, or [`PROGRESS.md`](PROGRESS.md) by hand | Tick boxes and log XP at the end of each session |
| Levels | [`sections/`](sections/) | Read lessons, write notes in `notes/`, then do `challenges.md` |
| Labs | [`labs/`](labs/) | Run with Docker, break things, fill in `RESULTS.md` |
| Boss systems | [`systems/`](systems/) | 45-minute timed designs using `templates/system-design.md` |
| Templates | [`templates/`](templates/) | Copy them for new concept notes, designs and lab results |

## Daily routine (~1.5 h)
1. **10 min warm-up:** answer 3 random recall questions from a level you have already cleared.
2. **40 min learn:** read one or two lessons for this week's level.
3. **20 min write:** fill a concept note from memory using `templates/concept.md`.
4. **20 min do:** either a lab step or a boss-fight attempt.
5. **Commit:** `git add -A && git commit -m "day N: <topic>" && git push`

## Using Claude as your tutor
- **Explainer:** "Teach me read replicas as a story of one app growing. Problem first, then the fix, then a trade-offs table, then 5 quiz questions."
- **Grader:** "Here is my note on X. What's wrong or missing for an interview at a product company?"
- **Interviewer:** "Act as a senior interviewer. Ask me to design BookMyShow. Push on double-booking and payments. Grade me at the end."
- **Lab coach:** "Give me a docker-compose for a Postgres primary plus a replica and a script to measure replication lag."

## Rules
- Use one main resource per topic. Opening more tabs doesn't count as learning.
- Never write "it got faster". Write the throughput, p50, p99 and error rate before and after.
- Once you have about 20 solid notes, publish them as a site (Quartz or Astro). Don't build the site before that.

Start here: **[Level 01 · Core Concepts](sections/01-core-concepts/)**
