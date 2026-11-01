// Single source of truth for the curriculum shown in the app.
// Markdown files under sections/ mirror this for offline reading.

export type Topic = { id: string; title: string };
export type Question = { q: string; a: string };
export type Level = {
  num: string;
  slug: string;
  title: string;
  phase: Phase;
  week: string;
  covers: string;
  topics: Topic[];
  labs: string[];
  questions: Question[];
  boss: string;
};
export type Phase = "Foundations" | "Databases" | "Distributed" | "Beyond";

const t = (...titles: string[]): Topic[] =>
  titles.map((title) => ({
    id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    title,
  }));

export const READING = [
  { label: "AlgoMaster (syllabus)", url: "https://algomaster.io/learn/system-design/scalability" },
  { label: "Hello Interview: System Design in a Hurry", url: "https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction" },
  { label: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer" },
];

export const LEVELS: Level[] = [
  {
    num: "01", slug: "01-core-concepts", title: "Core Concepts", phase: "Foundations", week: "1",
    covers: "Scalability, availability, reliability, SPOF, latency vs throughput, consistent hashing, CAP",
    topics: t("Scalability", "Availability", "Reliability", "Single Point of Failure", "Latency vs Throughput", "Consistent Hashing", "CAP Theorem", "Failure Modes and Fault Tolerance"),
    labs: [],
    questions: [
      { q: "What is the difference between a performance problem and a scalability problem?", a: "Performance problem: the system is slow even for a single user. Scalability problem: it's fast for one user but slows down or fails as load grows. Fixing one doesn't fix the other." },
      { q: "How much downtime per year do 99.9% and 99.99% allow? Why does each extra 9 cost so much?", a: "99.9% ≈ 8.8 hours/year; 99.99% ≈ 53 minutes/year. Each 9 needs redundancy at every layer, automated failover (humans are too slow), multi-AZ/region deploys and safer releases — cost grows roughly exponentially." },
      { q: "Name 3 single points of failure in a one-server web app and how to remove each.", a: "1) The app server → run several behind a load balancer. 2) The database → primary + replica with automatic failover. 3) The load balancer / DNS → redundant LBs (active-passive with a floating IP) or a managed LB. Also: single AZ → multi-AZ." },
      { q: "Latency vs throughput: give an example where improving one hurts the other.", a: "Batching (e.g. Kafka producer linger, DB group commit) raises throughput because each I/O carries more work, but each item waits for the batch, so latency goes up. Conversely, flushing every request lowers latency but cuts throughput." },
      { q: "Why does hash(key) % N hurt when N changes, and how does consistent hashing fix it?", a: "Changing N remaps almost every key (~(N-1)/N of them), so caches go cold and shards must move most data. Consistent hashing puts nodes and keys on a ring; a key goes to the next node clockwise, so adding/removing a node only moves ~1/N of keys. Virtual nodes even out the load." },
      { q: "During a network partition, CAP says you must choose. What do you give up in each choice?", a: "CP: refuse some requests (lose availability) to never return stale/conflicting data — e.g. etcd, ZooKeeper, HBase. AP: keep answering on both sides and reconcile later (lose consistency) — e.g. Cassandra, DynamoDB default. Without a partition you trade latency vs consistency (PACELC)." },
    ],
    boss: "Your single-server photo app grows from 1k to 1M daily users. Walk through the growth story (scale up → split DB → LB + stateless servers → cache → replicas → shards → queues). For each step, name the symptom that forces it and the metric that proves it worked.",
  },
  {
    num: "02", slug: "02-networking", title: "Networking", phase: "Foundations", week: "2",
    covers: "OSI, IP, TCP/UDP, HTTP/S, DNS, proxy vs reverse proxy, checksums",
    topics: t("OSI Model", "IP Addresses", "TCP vs UDP", "HTTP and HTTPS", "DNS", "Proxy vs Reverse Proxy", "Checksums", "HTTP/2 and HTTP/3"),
    labs: ["09"],
    questions: [
      { q: "TCP vs UDP: when would you choose UDP for a real feature?", a: "When late data is useless and you'd rather drop than wait: live video/voice calls, multiplayer game state, DNS lookups, metrics (StatsD). QUIC/HTTP3 also builds its own reliability on top of UDP to avoid TCP head-of-line blocking." },
      { q: "What happens step by step when you type https://example.com and press Enter?", a: "Browser cache → DNS lookup (resolver, root → TLD → authoritative) → TCP 3-way handshake → TLS handshake (certificate check, key exchange) → HTTP request → server/CDN processes and responds → browser parses HTML, fetches CSS/JS/images (more requests), renders." },
      { q: "How does DNS resolution work, and what's the trade-off of long vs short TTL?", a: "Recursive resolver asks root servers, then the TLD (.com) servers, then the domain's authoritative server, caching each answer for its TTL. Long TTL: fewer lookups, faster, but slow failover/migration. Short TTL: fast changes, more DNS traffic and latency." },
      { q: "Forward proxy vs reverse proxy: who does each one protect or hide?", a: "Forward proxy sits in front of clients and hides/controls them (corporate proxy, VPN). Reverse proxy sits in front of servers and hides them from clients (Nginx, Cloudflare): TLS termination, load balancing, caching, protection." },
      { q: "What did HTTP/2 and HTTP/3 fix over HTTP/1.1?", a: "HTTP/2: multiplexes many requests on one TCP connection, binary framing, header compression — fixes HTTP-level head-of-line blocking. HTTP/3: runs over QUIC (UDP) so one lost packet doesn't block all streams, faster handshakes (0-RTT), survives network changes." },
    ],
    boss: "Trace a request that loads a video thumbnail on a phone in India from a server in the US. Mark every hop (DNS, TCP, TLS, CDN, origin) and estimate where the milliseconds go. Then cut total latency in half.",
  },
  {
    num: "03", slug: "03-load-balancing", title: "Load Balancing", phase: "Foundations", week: "2",
    covers: "LB algorithms, L4 vs L7, health checks, DNS LB, anycast",
    topics: t("Load Balancer Basics", "Load Balancing Algorithms", "L4 vs L7 Load Balancing", "DNS Load Balancing", "Anycast"),
    labs: ["09"],
    questions: [
      { q: "Round-robin vs least-connections vs IP-hash: when does each win?", a: "Round-robin: similar servers and short, uniform requests. Least-connections: requests of very different duration (uploads, websockets). IP-hash / consistent hash: you need the same client or key on the same server (local cache, sessions)." },
      { q: "L4 vs L7 load balancing: what can L7 do that L4 cannot?", a: "L4 routes on IP/port only — very fast, protocol-agnostic. L7 understands HTTP: route by path/host/header/cookie, TLS termination, retries, rewrite headers, rate limit, A/B and canary routing." },
      { q: "How do health checks work, and what goes wrong if they are too aggressive?", a: "The LB periodically probes each server (TCP connect or HTTP /health) and removes it after N failures, re-adds after M successes. Too aggressive: a brief GC pause or slow dependency removes healthy servers, load shifts to the rest, they also fail — a cascade (flapping)." },
      { q: "Why are sticky sessions a problem, and what do you do instead?", a: "Load gets uneven, a server dying logs users out, and you can't freely scale down or deploy. Make servers stateless: keep sessions in Redis or a signed cookie/JWT so any server can handle any request." },
      { q: "What is anycast, and why do CDNs and DNS providers use it?", a: "The same IP is announced from many locations; BGP routes each user to the nearest one. Gives low latency, automatic failover and spreads DDoS traffic across all sites." },
    ],
    boss: "Design the load-balancing tier for a 50k req/s API in 2 regions. It must survive the loss of a load balancer and of a whole region. Draw it and state the failover time.",
  },
  {
    num: "04", slug: "04-api-fundamentals", title: "API Fundamentals", phase: "Foundations", week: "3",
    covers: "REST, GraphQL, gRPC, idempotency, rate limiting, auth, JWT, OAuth, SSO",
    topics: t("REST", "GraphQL", "gRPC", "API Design and Versioning", "Pagination", "Idempotency", "Rate Limiting", "Rate Limiting Algorithms", "Authentication vs Authorization", "JWT", "OAuth 2.0", "SSO", "API Gateway", "Webhooks vs Polling"),
    labs: [],
    questions: [
      { q: "Which HTTP methods are idempotent, and how does an idempotency key make POST safe to retry?", a: "GET, PUT, DELETE, HEAD, OPTIONS are idempotent; POST and PATCH are not. The client sends a unique Idempotency-Key; the server stores key → result (with a unique constraint). A retry with the same key returns the stored result instead of creating a second charge." },
      { q: "Token bucket vs sliding-window rate limiting: how does each behave under a burst?", a: "Token bucket: allows a burst up to bucket size, then a steady refill rate — burst-friendly. Sliding window (log or counter): enforces the limit over any rolling window, so no burst at window edges, but more memory/compute. Fixed window allows 2× bursts at the boundary." },
      { q: "JWT vs server-side sessions: how do you revoke a JWT before it expires?", a: "Sessions are revoked by deleting them server-side. JWTs are stateless, so: short-lived access tokens + refresh tokens you can revoke, a denylist of token IDs (jti) in Redis, or rotating the signing key (logs everyone out)." },
      { q: "OAuth 2.0 vs SSO vs OIDC: what problem does each solve?", a: "OAuth 2.0 = delegated authorization (let an app access your Google Drive without your password). OIDC = an identity layer on OAuth that tells the app who you are (ID token). SSO = log in once, access many apps; implemented with OIDC or SAML." },
      { q: "REST vs gRPC vs GraphQL: pick one for a public API, internal service calls, and a mobile app with many screens.", a: "Public API: REST (universal, cacheable, easy docs). Internal service-to-service: gRPC (fast binary protobuf, typed contracts, streaming). Mobile app with varied screens: GraphQL (client fetches exactly the fields it needs in one round trip)." },
      { q: "Offset vs cursor pagination: why does offset break on large, changing tables?", a: "OFFSET 100000 makes the DB read and throw away 100k rows (slow), and inserts/deletes shift rows so pages duplicate or skip items. A cursor (WHERE id < last_seen ORDER BY id LIMIT 20) uses an index and is stable." },
    ],
    boss: "Design a public payments API (create charge, refund, list transactions). Cover endpoints, the idempotency-key flow, pagination, rate limits per merchant, and auth.",
  },
  {
    num: "05", slug: "05-communication-patterns", title: "Communication Patterns", phase: "Distributed", week: "8",
    covers: "Long polling, SSE, WebSockets, webhooks, queues, pub/sub, delivery semantics, DLQs",
    topics: t("Synchronous vs Asynchronous", "Long Polling", "Server-Sent Events", "WebSockets", "Webhooks", "Message Queues", "Pub/Sub", "Delivery Semantics", "Dead Letter Queues", "Backpressure", "Event Ordering"),
    labs: ["10"],
    questions: [
      { q: "Long polling vs SSE vs WebSockets: which for a live score feed, which for chat?", a: "Live scores: SSE — one-way server→client over plain HTTP, auto-reconnect. Chat: WebSockets — full-duplex, low overhead per message. Long polling is the fallback when neither is available." },
      { q: "At-most-once, at-least-once, exactly-once: which can you really get, and how do you fake the last one?", a: "At-most-once and at-least-once are real. End-to-end exactly-once over a network isn't; you get exactly-once *effect* with at-least-once delivery + idempotent consumers (dedupe by message/idempotency key, or transactional offset + write)." },
      { q: "Message queue vs pub/sub: who gets each message?", a: "Queue: each message goes to one consumer among competing workers (work distribution). Pub/sub: each message goes to every subscriber/consumer group (fan-out). Kafka does both: one consumer per partition per group, many groups." },
      { q: "What is a dead-letter queue and when should a message land there?", a: "A side queue for messages that keep failing (after N retries, or are malformed/poison). It stops one bad message from blocking the queue or retrying forever, and lets humans inspect and replay later." },
      { q: "How do you make webhooks reliable?", a: "Retry with exponential backoff + jitter, sign payloads (HMAC) so receivers can verify, include an event ID so receivers dedupe, don't rely on ordering (include timestamps/versions), offer an events API for reconciliation, and send to a DLQ / disable after persistent failure." },
    ],
    boss: "Design live notifications for 10M users (likes, comments, messages). Choose the transport, how servers know which connection a user is on, and what happens when the user is offline.",
  },
  {
    num: "06", slug: "06-caching", title: "Caching", phase: "Foundations", week: "3",
    covers: "Strategies, eviction, invalidation, CDN, distributed cache, stampede, warming",
    topics: t("Caching Basics", "Caching Strategies", "Cache Eviction Policies", "Cache Invalidation", "CDN", "Distributed Caching", "Cache Stampede", "Cache Warming", "Redis Deep Dive"),
    labs: ["05"],
    questions: [
      { q: "Cache-aside vs write-through vs write-back: consistency and durability risks?", a: "Cache-aside: app reads cache, on miss loads DB and fills cache — can serve stale data after updates. Write-through: write cache and DB together — consistent but slower writes. Write-back: write cache, flush to DB later — fastest but data lost if cache dies before flush." },
      { q: "LRU vs LFU: which survives a one-off scan of the whole catalogue better?", a: "LFU. A full scan touches every item once, which flushes an LRU cache of its hot items. LFU keeps items with high access counts, so the hot set survives (Redis has allkeys-lfu)." },
      { q: "What is a cache stampede, and give 3 ways to prevent it.", a: "A hot key expires and thousands of requests miss at once and all hit the DB. Fixes: a lock / single-flight so one request rebuilds; jittered TTLs so keys don't expire together; early (probabilistic) refresh or serve-stale-while-revalidate." },
      { q: "Describe a race that leaves stale data in cache-aside.", a: "Reader A misses and reads old value from DB. Writer B updates DB and deletes the cache key. A then writes the old value into cache — stale until TTL. Mitigate with short TTLs, delayed double delete, or versioned values." },
      { q: "What should and should not go on a CDN?", a: "Should: static assets, images, video segments, public pages/API responses with cache headers. Should not: personalised or private responses (unless keyed carefully), rapidly changing data like stock/price, anything with auth unless using signed URLs." },
    ],
    boss: "A product page takes 100k req/s during a flash sale, and price and stock must not be wrong. Design the caching layers (CDN, app, Redis, DB) and say exactly what is cached where and for how long.",
  },
  {
    num: "07", slug: "07-databases", title: "Databases", phase: "Databases", week: "4",
    covers: "SQL vs NoSQL, ACID, B+ trees, LSM trees, database types incl. vector DBs",
    topics: t("SQL vs NoSQL", "ACID Transactions", "Isolation Levels", "B+ Trees", "LSM Trees", "Relational Databases", "Key-Value Stores", "Document Databases", "Wide-Column Databases", "Graph Databases", "Time-Series Databases", "Search Engines", "Vector Databases", "Choosing a Database"),
    labs: ["02"],
    questions: [
      { q: "Explain each letter of ACID with a bank-transfer example.", a: "Atomicity: debit and credit both happen or neither. Consistency: constraints hold (no negative balance). Isolation: concurrent transfers don't see each other's half-done state. Durability: once committed, it survives a crash (WAL on disk)." },
      { q: "B+ tree vs LSM tree: which is better for write-heavy workloads, and why?", a: "LSM: writes go to an in-memory memtable and are flushed as sequential sorted files (SSTables), then compacted — very fast writes, reads may check several files (Bloom filters help). B+ tree updates pages in place — fast, predictable reads, slower random writes. Cassandra/RocksDB = LSM; Postgres/MySQL = B+ tree." },
      { q: "Name the anomalies and which isolation level stops each.", a: "Dirty read → stopped by Read Committed. Non-repeatable read → Repeatable Read. Phantom → Serializable (Postgres RR also prevents phantoms). Lost update → Repeatable Read in Postgres, or SELECT … FOR UPDATE / atomic UPDATE in any level." },
      { q: "When is a document, key-value, wide-column or graph DB a better fit than Postgres?", a: "Document (MongoDB): flexible nested records like product catalogs. Key-value (Redis/DynamoDB): sessions, carts, simple lookups at huge scale. Wide-column (Cassandra): massive write-heavy time-ordered data like messages/IoT. Graph (Neo4j): many-hop relationship queries like friend-of-friend, fraud rings." },
      { q: "What is a vector database and what query does it make fast?", a: "Stores embeddings (vectors of floats) and answers approximate nearest-neighbour search — 'find the 10 most similar items' — using indexes like HNSW or IVF. Used for semantic search, RAG, recommendations. pgvector adds it to Postgres." },
    ],
    boss: "Choose the databases for a ride-hailing app: users, trips, driver live locations, payments, trip-history analytics. Justify each choice with the access pattern and consistency need.",
  },
  {
    num: "08", slug: "08-database-scaling", title: "Database Scaling", phase: "Databases", week: "5–7",
    covers: "Indexing, partitioning, replication, sharding, query optimisation, denormalisation, materialised views, connection pooling",
    topics: t("Database Indexing", "Query Optimisation", "Replication", "Partitioning", "Sharding", "Denormalisation", "Materialised Views", "Connection Pooling", "Scaling Reads vs Writes"),
    labs: ["01", "03", "04", "06", "07", "08"],
    questions: [
      { q: "Why does a composite index on (a, b) help WHERE a = ? but not WHERE b = ?", a: "The index is sorted by a first, then by b within each a — like a phone book sorted by last name then first name. You can jump to a given a, but rows with a given b are scattered across all a values (leftmost-prefix rule)." },
      { q: "With read replicas, how do you guarantee a user reads their own write?", a: "Route that user's reads to the primary for a short window after they write; or track the write's LSN/timestamp and only read from a replica that has caught up to it; or read critical pages (e.g. 'my profile') from the primary always." },
      { q: "Partitioning vs sharding: what's the difference?", a: "Partitioning splits a table into pieces inside one database server (e.g. by month) — helps pruning and archiving. Sharding spreads data across multiple database servers — helps when one machine can't handle the writes or storage." },
      { q: "How do you pick a shard key? What happens with a celebrity / hot key?", a: "Pick a key with high cardinality, even distribution, and that most queries include (so they hit one shard) — e.g. user_id. A hot key overloads one shard: split it (key + random suffix), cache it, or give it a dedicated shard." },
      { q: "Why do serverless functions exhaust DB connections, and how does a pooler fix it?", a: "Each function instance opens its own connection; a traffic spike creates thousands of instances, exceeding max_connections (each Postgres connection is a process with MBs of RAM). PgBouncer/RDS Proxy keeps a small pool of real connections and multiplexes many clients onto them." },
      { q: "When would you denormalise or add a materialised view instead of an index?", a: "When the slow part is joins/aggregations, not finding rows — e.g. a feed or dashboard that joins 5 tables or sums millions of rows. Precompute the result (denormalised column or materialised view) and accept extra write cost and staleness." },
    ],
    boss: "The orders table has 2B rows and the 'my orders' page has a p99 of 2 s. Write a step-by-step plan from the cheapest fix to the most expensive, with the metric you check after each step.",
  },
  {
    num: "09", slug: "09-storage-systems", title: "Storage Systems", phase: "Beyond", week: "13+",
    covers: "Block, file, object storage, distributed file systems, erasure coding",
    topics: t("Block Storage", "File Storage", "Object Storage", "Distributed File Systems", "Erasure Coding"),
    labs: [],
    questions: [
      { q: "Block vs file vs object storage: one real use case for each.", a: "Block (EBS): a database's disk — low-latency random I/O. File (EFS/NFS): shared directory mounted by many servers. Object (S3): images, videos, backups, data lake files — cheap, huge, accessed over HTTP." },
      { q: "Why store images in object storage instead of the database?", a: "Blobs bloat the DB, slow backups and replication, and waste expensive DB I/O. Object storage is far cheaper per GB, scales without limit, and serves directly or via CDN. Store only the URL/key and metadata in the DB." },
      { q: "Erasure coding vs 3× replication: what do you save and what do you pay?", a: "Erasure coding (e.g. 10 data + 4 parity chunks) survives similar failures with ~1.4× storage instead of 3×. You pay CPU to encode/decode and slower reads/rebuilds, so it suits cold data." },
      { q: "What are pre-signed URLs and why do they take load off your servers?", a: "A time-limited URL signed with your credentials that lets a client upload/download one object directly to/from S3. File bytes never pass through your app servers — they only issue the URL." },
      { q: "How does a distributed file system (HDFS/GFS) split and place a large file?", a: "It splits the file into large blocks (64–128 MB), stores each block on 3 data nodes (often across racks), and a master/NameNode keeps the metadata: which blocks make up the file and where each lives." },
    ],
    boss: "Design file storage for a Dropbox-like app: large-file uploads, chunking, dedup, metadata DB, sync across devices.",
  },
  {
    num: "10", slug: "10-architectural-patterns", title: "Architectural Patterns", phase: "Beyond", week: "13+",
    covers: "Monolith, microservices, serverless, event-driven, hexagonal, CQRS, event sourcing",
    topics: t("Client-Server", "Monolith", "Microservices", "Serverless", "Event-Driven Architecture", "Peer-to-Peer", "Hexagonal Architecture", "CQRS", "Event Sourcing"),
    labs: [],
    questions: [
      { q: "When is a monolith the right answer? What signals tell you to split it?", a: "Right for small teams and new products: simpler deploys, debugging and transactions. Split when teams block each other on deploys, parts need very different scaling, or one module's failures take down everything." },
      { q: "What is CQRS, and what new problem does it create?", a: "Separate write model (commands) from read models (queries) so each can be optimised and scaled independently. New problem: read models are updated asynchronously, so reads are eventually consistent, plus more moving parts." },
      { q: "Event sourcing: how do you get current state, and how do you handle schema changes in old events?", a: "Replay the event log for the entity (speed up with periodic snapshots). Events are immutable, so version them and use upcasters that transform old event shapes into the new one when reading." },
      { q: "Event-driven architecture: what gets easier and what gets harder?", a: "Easier: loose coupling, adding new consumers without touching producers, absorbing spikes. Harder: tracing a flow end-to-end, ordering, duplicate handling, and reasoning about eventual consistency." },
      { q: "Serverless: what are cold starts and when do they matter?", a: "The delay when the platform must start a new instance (load runtime and code) before handling a request — 100 ms to seconds. Matters for latency-sensitive user-facing APIs with spiky traffic; mitigate with provisioned concurrency or smaller bundles." },
    ],
    boss: "You own an e-commerce monolith with 40 engineers stepping on each other. Propose which services to extract first, in what order, and how they communicate.",
  },
  {
    num: "11", slug: "11-microservices-patterns", title: "Microservices Patterns", phase: "Beyond", week: "13+",
    covers: "Service discovery, API gateway, BFF, sidecar, circuit breaker, bulkhead, service mesh",
    topics: t("Service Discovery", "API Gateway", "Backend for Frontend", "Sidecar Pattern", "Circuit Breaker", "Bulkhead", "Retries with Backoff", "Strangler Fig", "Service Mesh"),
    labs: [],
    questions: [
      { q: "Client-side vs server-side service discovery?", a: "Client-side: the client queries a registry (Consul, Eureka) and picks an instance itself. Server-side: the client calls a load balancer/DNS name that queries the registry for it (Kubernetes Services, AWS ALB)." },
      { q: "API gateway vs BFF: why would a mobile app get its own backend?", a: "A gateway is one shared entry point for routing, auth and rate limits. A BFF is a backend tailored to one client type: mobile gets smaller payloads, aggregated calls and its own release pace without bloating the web API." },
      { q: "What are the 3 states of a circuit breaker and what moves it between them?", a: "Closed: calls pass; failures counted. Open (after failure rate passes a threshold): calls fail fast without hitting the dependency. Half-open (after a cool-down): a few trial calls — success closes it, failure re-opens it." },
      { q: "What is the bulkhead pattern, and what failure does it contain?", a: "Separate resource pools (threads, connections) per dependency or feature, like ship compartments. If one dependency hangs, it only exhausts its own pool instead of all threads, so the rest of the service keeps working." },
      { q: "What does a service-mesh sidecar do so your code doesn't have to?", a: "A proxy (Envoy) next to each service handles mTLS, retries, timeouts, circuit breaking, load balancing, traffic splitting and metrics/traces — consistently across languages, configured centrally." },
    ],
    boss: "The payment service becomes slow, and within 2 minutes checkout, cart and search are all timing out. Explain the cascade and redesign so only payments degrade.",
  },
  {
    num: "12", slug: "12-distributed-fundamentals", title: "Distributed System Fundamentals", phase: "Distributed", week: "9",
    covers: "Partitions, split brain, clocks, Lamport/vector clocks, Paxos, Raft, leader election, locks, gossip, CRDTs",
    topics: t("Network Partitions", "Split Brain", "Physical Clocks and Skew", "Lamport Clocks", "Vector Clocks", "Quorum", "Consensus", "Paxos", "Raft", "Leader Election", "Distributed Locks", "Fencing Tokens", "Gossip Protocol", "Heartbeats and Failure Detection", "CRDTs", "Consistency Models", "Hinted Handoff", "Read Repair", "Anti-Entropy"),
    labs: [],
    questions: [
      { q: "What is split brain and how does a quorum prevent it?", a: "A partition makes two sides each think they're the leader and accept conflicting writes. A quorum requires a majority (e.g. 2 of 3) to act; only one side can have a majority, so the minority side stops." },
      { q: "Why can't you trust wall-clock time across machines? Lamport vs vector clocks?", a: "Clocks drift and NTP jumps them, so timestamps can reorder events. Lamport clocks give a total order consistent with causality but can't tell if two events are concurrent. Vector clocks (one counter per node) can detect concurrency/conflicts." },
      { q: "Walk through a Raft leader election.", a: "Followers expect heartbeats; on timeout (randomised) one becomes candidate, increments the term, votes for itself and requests votes. A node votes once per term, only for a candidate whose log is at least as up to date. Majority → leader. Split vote → timeout and retry; randomised timeouts make ties rare." },
      { q: "With N replicas, why does R + W > N give you strong reads?", a: "Any read set of R nodes must overlap any write set of W nodes by at least one node, so a read always reaches a node with the latest write (then pick the newest version). E.g. N=3, W=2, R=2." },
      { q: "Why does a distributed lock need fencing tokens?", a: "Client A gets the lock, pauses (GC) past the lease, client B gets the lock and writes, then A wakes and writes too — corruption. With fencing, each lock grant has an increasing token; storage rejects writes with a token older than the latest seen." },
      { q: "What is a CRDT and what kind of app needs one?", a: "A data type whose replicas can be updated independently and always merge to the same state without coordination (counters, sets, sequences). Used for collaborative editing, offline-first apps, multi-region counters." },
    ],
    boss: "A nightly billing job must run exactly once even though 3 scheduler instances run for availability. Design the leader election / locking, including what happens when the leader pauses for 30 s (GC) mid-job.",
  },
  {
    num: "13", slug: "13-distributed-transactions", title: "Distributed Transactions", phase: "Distributed", week: "10",
    covers: "2PC, 3PC, Saga, Outbox",
    topics: t("Why Distributed Transactions Are Hard", "Two-Phase Commit", "Three-Phase Commit", "Saga Pattern", "Outbox Pattern", "Idempotent Consumers"),
    labs: ["10"],
    questions: [
      { q: "Why is 2PC called blocking? What happens if the coordinator dies?", a: "After voting YES, participants hold locks and must wait for the coordinator's decision. If it dies after prepare, they can't commit or abort on their own — they block, holding locks, until it recovers." },
      { q: "Saga: orchestration vs choreography — pros and cons.", a: "Orchestration: a central coordinator calls each step and compensations — easy to see and change the flow, but a central component. Choreography: services react to each other's events — loosely coupled, but the flow is implicit and hard to trace as it grows." },
      { q: "What is a compensating action? Give one for 'charge card' and 'reserve seat'.", a: "A business-level undo for a completed step (not a rollback). Charge card → issue a refund. Reserve seat → release the seat hold." },
      { q: "What is the dual-write problem, and how does the Outbox pattern solve it?", a: "Writing to the DB and publishing to Kafka are two systems; a crash between them leaves them inconsistent. Outbox: write the business row and an event row in the same DB transaction; a relay (poller or CDC like Debezium) publishes outbox rows to the broker, at-least-once." },
      { q: "Why must every saga step be idempotent?", a: "Messages are delivered at-least-once and steps get retried after timeouts, so the same step may run twice. Without idempotency you double-charge or double-reserve." },
    ],
    boss: "Design checkout across Order, Payment and Inventory services. Show the saga steps, compensations, the outbox, and what the user sees if payment succeeds but inventory fails.",
  },
  {
    num: "14", slug: "14-data-structures-for-scale", title: "Data Structures for Scale", phase: "Beyond", week: "13+",
    covers: "Geohash, quad trees, Bloom filters, HyperLogLog, Count-Min sketch, Merkle trees",
    topics: t("Geohash", "Quad Trees", "R-Trees", "Bloom Filters", "Cuckoo Filters", "HyperLogLog", "Count-Min Sketch", "Merkle Trees", "Skip Lists", "Tries", "Consistent Hashing Ring", "Inverted Index"),
    labs: [],
    questions: [
      { q: "How does a geohash turn 'nearby' into a prefix query? What is the edge problem?", a: "It interleaves latitude/longitude bits into a string; points sharing a longer prefix are in the same, smaller cell, so 'nearby' ≈ same prefix (indexable). Edge problem: two close points across a cell border share no prefix — so also query the 8 neighbouring cells." },
      { q: "Quad tree vs geohash for a map with very uneven density?", a: "Quad tree: splits a cell only when it has too many points, so dense cities get small cells and deserts big ones — adapts to density. Geohash has fixed cell sizes per precision, so dense cells get overloaded or sparse areas need many lookups." },
      { q: "Bloom filter: false positives, false negatives, or both? Where is it used in databases?", a: "Only false positives ('maybe present'); never false negatives ('definitely not present'). LSM databases (Cassandra, RocksDB) use one per SSTable to skip files that can't contain the key." },
      { q: "How does HyperLogLog count 1B unique visitors in ~12 KB?", a: "Hash each item; the longest run of leading zeros seen hints at how many distinct items exist. It keeps many registers (buckets) and averages them, giving ~0.8% error in fixed tiny memory (Redis PFADD/PFCOUNT)." },
      { q: "What does a Merkle tree make cheap when two replicas compare data?", a: "Each node is a hash of its children. Compare root hashes; if equal, done. If not, descend only into differing branches — find the few differing keys by exchanging O(log n) hashes instead of all data (Cassandra anti-entropy, Git)." },
    ],
    boss: "Design 'find the nearest available delivery partners' for a Swiggy-like app with 300k partners sending location every 5 s.",
  },
  {
    num: "15", slug: "15-big-data", title: "Big Data Processing", phase: "Beyond", week: "13+",
    covers: "Batch vs stream, CDC, MapReduce, ETL, lakes, warehouses, Lambda/Kappa",
    topics: t("Batch vs Stream Processing", "MapReduce", "ETL vs ELT", "Change Data Capture", "Data Lakes", "Data Warehouses", "Lakehouse", "Lambda Architecture", "Kappa Architecture", "Windowing in Streams", "Exactly-Once Streaming"),
    labs: [],
    questions: [
      { q: "Batch vs stream processing: what decides which one you need?", a: "How fresh the result must be. Batch (hours/daily) is simpler, cheaper and easy to reprocess — reports, billing. Stream (seconds) for fraud detection, live dashboards, alerts — more complex (state, late events, ordering)." },
      { q: "What is CDC and why is it better than polling or dual writes?", a: "Change Data Capture reads the DB's commit log (WAL/binlog) and emits every insert/update/delete as an event (Debezium). It catches every change in order, adds no query load, and avoids the dual-write inconsistency." },
      { q: "Lambda vs Kappa architecture: why did Kappa appear?", a: "Lambda runs a batch layer (accurate) and a speed layer (fast) and merges them — two codebases for the same logic. Kappa uses only a stream processor over a replayable log; to reprocess, replay the log. Simpler, one codebase." },
      { q: "Data lake vs data warehouse: who uses each and what format?", a: "Lake: raw files of any type in object storage (Parquet, JSON) — cheap, for data scientists/ML, schema-on-read. Warehouse: cleaned, structured tables optimised for SQL analytics (Snowflake, BigQuery) — for analysts and BI, schema-on-write." },
      { q: "Explain MapReduce with word count.", a: "Map: each worker reads a chunk of text and emits (word, 1). Shuffle: pairs are grouped by word across the cluster. Reduce: each reducer sums the counts for its words and writes (word, total)." },
    ],
    boss: "Build a real-time dashboard of clicks per ad per minute for 1M events/s, plus exact daily totals for billing. Which parts are stream, which batch, and how do you reconcile them?",
  },
  {
    num: "16", slug: "16-deployment-patterns", title: "Deployment Patterns", phase: "Beyond", week: "13+",
    covers: "CI/CD, rolling, blue-green, canary, feature flags, schema migrations",
    topics: t("CI/CD", "Rolling Deployment", "Blue-Green Deployment", "Canary Releases", "Feature Flags", "A/B Testing", "Schema Migrations", "Expand-Contract Pattern", "Rollbacks", "Infrastructure as Code"),
    labs: [],
    questions: [
      { q: "Rolling vs blue-green vs canary: rollback speed and cost?", a: "Rolling: replace instances gradually — no extra capacity, slow rollback (roll forward again). Blue-green: full second environment, switch traffic — instant rollback, 2× cost during deploy. Canary: send a small % to the new version, watch metrics — limited blast radius, needs good metrics and routing." },
      { q: "How do feature flags decouple deploy from release?", a: "Code ships to production turned off. You release by flipping the flag — for staff, 1% of users, a region — and turn it off instantly without a deploy if something breaks." },
      { q: "What is the expand-contract migration pattern?", a: "Expand: add the new column/table (backward compatible), write to both, backfill. Migrate: switch reads to the new one. Contract: once nothing uses the old one, stop writing it and drop it. Each step is a separate safe deploy." },
      { q: "Why must old and new app versions both work against the same schema during deploy?", a: "During a rolling or canary deploy both versions run at once, and you may roll back. A schema change that breaks the old version (e.g. dropping a column) causes errors mid-deploy or makes rollback impossible." },
      { q: "What metrics would make a canary auto-rollback?", a: "Compared to the baseline: higher error rate (5xx), higher p99 latency, crash/restart count, saturation (CPU/memory), and key business metrics (checkout success, sign-ups)." },
    ],
    boss: "Rename a column on a 500M-row table used by 3 services, with zero downtime. List every deploy step in order.",
  },
  {
    num: "17", slug: "17-observability", title: "Observability", phase: "Beyond", week: "13+",
    covers: "Logs, metrics, tracing, alerting, runbooks, SLOs",
    topics: t("Logging", "Metrics", "Distributed Tracing", "RED and USE Methods", "Percentiles", "Alerting", "SLIs, SLOs and Error Budgets", "Runbooks and Incident Response"),
    labs: [],
    questions: [
      { q: "Logs vs metrics vs traces: which question does each answer best?", a: "Metrics: is something wrong, and how much? (cheap aggregates over time). Traces: where in the request path is it slow/failing? Logs: what exactly happened in this event (details, errors, context)?" },
      { q: "RED vs USE method: which for a service, which for a machine?", a: "RED (Rate, Errors, Duration) for request-driven services. USE (Utilisation, Saturation, Errors) for resources like CPU, disk, network, connection pools." },
      { q: "Why is average latency misleading? What do p50, p95, p99 tell you?", a: "A few very slow requests hide in the average, and averages hide bimodal behaviour. p50 is the typical user; p99 means 1 in 100 requests is slower — and a page making 100 calls hits it on almost every load." },
      { q: "Why alert on symptoms rather than causes?", a: "Users feel symptoms (errors, latency); high CPU may be harmless and causes are endless, producing noisy alerts and fatigue. Page on SLO burn; use cause metrics on dashboards to debug." },
      { q: "What is an SLO and an error budget, and how does it change release decisions?", a: "SLO: target like 99.9% of requests succeed under 300 ms over 30 days. Error budget: the 0.1% allowed to fail. Budget left → ship faster; budget burned → freeze risky releases and fix reliability." },
    ],
    boss: "At 2 a.m. checkout p99 jumps from 300 ms to 4 s. Write the investigation runbook: which dashboards, which traces, which hypotheses, in what order.",
  },
  {
    num: "18", slug: "18-security", title: "Advanced Security", phase: "Beyond", week: "13+",
    covers: "TLS, encryption at rest, secrets, RBAC, SAML",
    topics: t("TLS and mTLS", "Encryption at Rest", "Secrets Management", "RBAC vs ABAC", "SAML", "OWASP Top 10 for APIs", "Multi-Tenant Isolation"),
    labs: [],
    questions: [
      { q: "What happens in a TLS handshake, in plain words?", a: "Client says hello with supported ciphers; server sends its certificate; client verifies it chains to a trusted CA and matches the domain; both do a key exchange (ECDHE) to derive shared session keys; everything after is symmetrically encrypted. TLS 1.3 does this in 1 round trip." },
      { q: "Encryption at rest: where does the key live, and what is envelope encryption?", a: "Keys live in a KMS/HSM, not next to the data. Envelope encryption: each object is encrypted with a data key; the data key is encrypted by a master key in KMS. Rotating the master key only re-wraps data keys, not all data." },
      { q: "How should services get secrets instead of env files in git?", a: "From a secrets manager (Vault, AWS Secrets Manager) at runtime using the service's identity (IAM role, k8s service account), with short-lived/dynamic credentials, automatic rotation and audit logs." },
      { q: "RBAC vs ABAC: one example where RBAC is not enough.", a: "RBAC grants by role (editor can edit docs). ABAC uses attributes of user, resource and context. 'Doctors may only view records of patients in their own department during their shift' needs ABAC (or role explosion in RBAC)." },
      { q: "SAML vs OIDC: which would an enterprise customer ask for, and why?", a: "Enterprises often ask for SAML because older IdPs and corporate SSO (Okta, ADFS) standardised on it. OIDC is newer, JSON/JWT-based, better for mobile and SPAs. A B2B SaaS usually supports both." },
    ],
    boss: "Design security for a multi-tenant B2B SaaS: tenant isolation in the DB, auth/SSO for enterprise customers, secrets, audit logs.",
  },
];

// Study order from the 12-week plan (databases get the biggest block).
export const STUDY_ORDER = ["01", "02", "03", "04", "06", "07", "08", "05", "12", "13", "09", "10", "11", "14", "15", "16", "17", "18"];

export type Lab = { id: string; slug: string; title: string; build: string; measure: string; question: string; week: string; ready: boolean };
export const LABS: Lab[] = [
  { id: "01", slug: "01-indexing", title: "Indexing", build: "Postgres with 5M fake orders", measure: "EXPLAIN ANALYZE before/after B-tree, composite and partial indexes", question: "Why is this query slow? Which index?", week: "5", ready: true },
  { id: "02", slug: "02-isolation", title: "Transactions & Isolation", build: "Two psql sessions on one bank table", measure: "Reproduce lost update, non-repeatable read, phantom; fix with FOR UPDATE and SERIALIZABLE", question: "How do you stop double-booking a seat?", week: "4", ready: false },
  { id: "03", slug: "03-data-modelling", title: "Data Modelling", build: "Schema for a Udemy/BookMyShow-style app", measure: "Normalise, then denormalise one hot read; add a materialised view", question: "Design the schema for X", week: "5", ready: false },
  { id: "04", slug: "04-connection-pooling", title: "Connection Pooling", build: "App → PgBouncer → Postgres", measure: "k6 at 500 VUs with and without the pool; watch max_connections errors", question: "Why do serverless apps exhaust DB connections?", week: "6", ready: false },
  { id: "05", slug: "05-caching", title: "Caching & Stampede", build: "Redis cache-aside in front of Lab 01", measure: "Hit ratio, p99; expire a hot key under load, then fix with a lock or jittered TTL", question: "Cache invalidation and stampede?", week: "3", ready: false },
  { id: "06", slug: "06-read-replicas", title: "Read Replicas", build: "Postgres primary + 1 streaming replica", measure: "Read-after-write on replica, measure lag, promote the replica", question: "Read-your-writes? Failover?", week: "6", ready: false },
  { id: "07", slug: "07-partitioning", title: "Partitioning", build: "Range-partition orders by month", measure: "Partition pruning in plans; drop an old partition instantly", question: "How do you archive years of data?", week: "7", ready: false },
  { id: "08", slug: "08-sharding", title: "Sharding", build: "3 Postgres containers, hash % 3 then consistent hashing", measure: "Add a 4th shard and count moved keys in each scheme", question: "Pick a shard key. What about hot keys?", week: "7", ready: false },
  { id: "09", slug: "09-scale-out", title: "Scale Out", build: "Nginx LB → 3 stateless app containers, sessions in Redis", measure: "Kill one container mid-load; round-robin vs least-connections", question: "Vertical vs horizontal? Sticky sessions?", week: "2", ready: false },
  { id: "10", slug: "10-queues-idempotency", title: "Queues & Idempotency", build: "Redpanda + worker; Outbox table in Postgres", measure: "Crash the worker mid-job, redeliver, prove no duplicate charge", question: "Exactly-once? Payments that retry?", week: "8 & 10", ready: false },
];

export type SystemDesign = { slug: string; title: string; hard: string; unlock: string[]; interviewer: string };
export const SYSTEMS: SystemDesign[] = [
  { slug: "url-shortener", title: "URL Shortener", hard: "Unique short IDs at scale; read-heavy redirects", unlock: ["08"], interviewer: "ID generation, collisions, caching redirects, analytics" },
  { slug: "rate-limiter", title: "Distributed Rate Limiter", hard: "Counting accurately under bursts across many servers", unlock: ["04", "06"], interviewer: "algorithm choice, Redis atomicity, multi-region" },
  { slug: "instagram-feed", title: "Instagram Feed", hard: "Celebrity fan-out (push vs pull)", unlock: ["08", "05"], interviewer: "fan-out on write vs read, celebrities, feed ranking, media storage" },
  { slug: "whatsapp", title: "WhatsApp", hard: "Delivery and ordering to offline users", unlock: ["05", "12"], interviewer: "connection routing, offline delivery, receipts, group messages" },
  { slug: "bookmyshow", title: "BookMyShow", hard: "Never sell a seat twice", unlock: ["07", "13"], interviewer: "seat locking, hold expiry, payments, flash-sale traffic" },
  { slug: "razorpay-payments", title: "Razorpay-style Payments", hard: "Money moves exactly once", unlock: ["13"], interviewer: "idempotency, ledger, reconciliation, bank timeouts" },
  { slug: "swiggy-dispatch", title: "Swiggy Dispatch", hard: "Nearest available partner from live locations", unlock: ["14"], interviewer: "geo-indexing, location ingestion, assignment races" },
  { slug: "youtube", title: "YouTube", hard: "Upload → transcode pipeline; video delivery", unlock: ["09", "06"], interviewer: "chunked upload, transcoding queue, adaptive bitrate, CDN" },
  { slug: "google-docs", title: "Google Docs", hard: "Concurrent edits (OT / CRDT)", unlock: ["12"], interviewer: "conflict resolution, presence, offline edits, history" },
];

export const WEEKS = [
  "Core concepts (scalability → CAP); sys0 free module 1",
  "Networking + load balancing; Lab 09",
  "APIs (REST, idempotency, rate limiting, auth) + caching; Lab 05",
  "SQL vs NoSQL, ACID, B+ vs LSM trees; PostgreSQL Exercises; Lab 02",
  "Indexing + query optimisation; Use The Index, Luke; Labs 01 and 03; sys0 Udemy DB lab",
  "Replication + connection pooling; Labs 06 and 04",
  "Partitioning, sharding, consistent hashing; Labs 07 and 08; sys0 Bitly lab",
  "Queues, pub/sub, delivery semantics, DLQs; Lab 10 part 1",
  "Clocks, consensus, Raft (Secret Lives of Data → RaftScope), distributed locks",
  "2PC, Saga, Outbox; Lab 10 part 2 (idempotent payment)",
  "Timed 45-min designs: URL shortener, Instagram feed, WhatsApp; AI mock interview",
  "BookMyShow, Razorpay-style payments, Swiggy dispatch; publish your notes",
];

export const XP = { topic: 20, recall: 10, boss: 50, lab: 100, system: 150 };
export const RANKS = [
  { name: "Intern", min: 0 },
  { name: "Junior", min: 500 },
  { name: "Mid", min: 1500 },
  { name: "Senior", min: 3000 },
  { name: "Staff", min: 5000 },
];

export const levelByNum = (n: string) => LEVELS.find((l) => l.num === n)!;
export const levelBySlug = (s: string) => LEVELS.find((l) => l.slug === s);
