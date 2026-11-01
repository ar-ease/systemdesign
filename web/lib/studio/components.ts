// Building blocks for the System Design Studio. Each one teaches itself:
// what it is, when to reach for it, when not to, and a number to remember.

export type CompType =
  | "client" | "dns" | "cdn" | "lb" | "gateway" | "app" | "ws" | "worker"
  | "cache" | "sql" | "replica" | "nosql" | "queue" | "storage" | "search" | "warehouse" | "external";

export type CompInfo = {
  type: CompType;
  name: string;
  icon: string;
  group: "Users & edge" | "Compute" | "Data" | "Async" | "Other";
  color: string; // accent colour for the node border
  what: string;
  when: string;
  avoid: string;
  number?: string;
};

export const COMPONENTS: CompInfo[] = [
  { type: "client", name: "Client", icon: "📱", group: "Users & edge", color: "#64748b",
    what: "The user's browser or mobile app. It starts every request.",
    when: "Every design starts here: who is using the system and from where?",
    avoid: "Never let it talk to a database, cache or queue directly — anyone could read or delete your data.",
    number: "Mobile networks add 50–300 ms per round trip." },
  { type: "dns", name: "DNS", icon: "🧭", group: "Users & edge", color: "#64748b",
    what: "Turns a name like api.example.com into an IP address.",
    when: "Mention it once at the edge; use it for geo-routing between regions.",
    avoid: "Don't rely on it for fast failover — clients cache answers for the TTL.",
    number: "A lookup is ~20–120 ms when not cached." },
  { type: "cdn", name: "CDN", icon: "🌍", group: "Users & edge", color: "#0ea5e9",
    what: "Servers near users that cache static files (images, video, JS) close to them.",
    when: "Any static or media content, or public pages that many users read.",
    avoid: "Personalised or private data, or anything that must be fresh to the second (stock, prices).",
    number: "Cuts latency from ~200 ms (cross-ocean) to ~20 ms." },
  { type: "lb", name: "Load balancer", icon: "⚖️", group: "Users & edge", color: "#8b5cf6",
    what: "Spreads incoming requests across several servers and skips unhealthy ones.",
    when: "As soon as you have 2+ copies of a server — for capacity and for surviving a crash.",
    avoid: "One server behind it gives no benefit. Sticky sessions make it less useful.",
    number: "One L7 LB handles tens of thousands of req/s." },
  { type: "gateway", name: "API gateway", icon: "🚪", group: "Users & edge", color: "#8b5cf6",
    what: "One front door for many services: routing, auth, rate limiting.",
    when: "Several backend services, or you need per-client rate limits/auth in one place.",
    avoid: "Putting business logic in it. For a single service, a load balancer is enough.",
  },
  { type: "app", name: "App server", icon: "🖥️", group: "Compute", color: "#6366f1",
    what: "Your API/business logic. Receives requests, reads/writes data, returns responses.",
    when: "Always. Keep it stateless (no sessions in memory) so you can run many copies.",
    avoid: "Doing slow work (emails, video processing) inside the request — use a queue + worker.",
    number: "A typical server handles ~1–5k simple req/s." },
  { type: "ws", name: "WebSocket server", icon: "🔌", group: "Compute", color: "#6366f1",
    what: "Holds long-lived connections so the server can push messages to clients instantly.",
    when: "Chat, live notifications, multiplayer, live dashboards.",
    avoid: "Plain request/response APIs — normal HTTP is simpler and easier to scale.",
    number: "One server can hold ~50k–1M idle connections." },
  { type: "worker", name: "Worker", icon: "⚙️", group: "Async", color: "#f59e0b",
    what: "A background process that takes jobs from a queue and does the slow work.",
    when: "Emails, image/video processing, payments retries, anything not needed in the response.",
    avoid: "Users calling it directly — it should only pull from a queue.",
  },
  { type: "cache", name: "Cache (Redis)", icon: "⚡", group: "Data", color: "#ef4444",
    what: "In-memory key-value store. Keeps hot data so you skip the slow database.",
    when: "Read-heavy data that many users ask for: profiles, product pages, sessions, counters.",
    avoid: "As the only copy of important data (it can lose it). Data that must always be exact.",
    number: "~0.1–1 ms per read vs ~5–50 ms for a DB query." },
  { type: "sql", name: "SQL database", icon: "🗄️", group: "Data", color: "#10b981",
    what: "Relational DB (Postgres/MySQL): tables, joins, transactions (ACID).",
    when: "Your default. Anything with money, bookings, inventory or relationships between data.",
    avoid: "Massive write-heavy event data (billions of rows per day) — consider NoSQL.",
    number: "One good Postgres box: ~10k writes/s, more reads with indexes." },
  { type: "replica", name: "Read replica", icon: "🪞", group: "Data", color: "#10b981",
    what: "A read-only copy of the primary database, kept up to date by replication.",
    when: "Reads far outnumber writes and the primary is busy. Also a standby for failover.",
    avoid: "Reads that must see a write that just happened (replication lag).",
    number: "Lag is usually ms, but can be seconds under load." },
  { type: "nosql", name: "NoSQL database", icon: "🧱", group: "Data", color: "#14b8a6",
    what: "Key-value / wide-column / document DB (DynamoDB, Cassandra, MongoDB). Scales writes horizontally.",
    when: "Huge volume, simple access by key: messages, events, feeds, IoT readings.",
    avoid: "Complex joins or multi-row transactions like payments and bookings.",
  },
  { type: "queue", name: "Queue / Kafka", icon: "📬", group: "Async", color: "#f59e0b",
    what: "Holds messages until a consumer is ready. Decouples producers from consumers.",
    when: "Slow work, traffic spikes, fan-out to many consumers, retries.",
    avoid: "When the user needs the result in this same request.",
    number: "Kafka: millions of messages/s across a cluster." },
  { type: "storage", name: "Object storage (S3)", icon: "🪣", group: "Data", color: "#0ea5e9",
    what: "Cheap, unlimited storage for files: images, videos, backups.",
    when: "Any file or blob. Store only its URL/key in the database.",
    avoid: "Storing images inside the SQL database — it bloats backups and wastes DB I/O.",
    number: "~$0.02 per GB per month." },
  { type: "search", name: "Search index", icon: "🔎", group: "Data", color: "#14b8a6",
    what: "Elasticsearch/OpenSearch: full-text and fuzzy search over your data.",
    when: "Search boxes, filters on many fields, autocomplete.",
    avoid: "As your source of truth — feed it from the DB (often via a queue/CDC).",
  },
  { type: "warehouse", name: "Analytics store", icon: "📊", group: "Data", color: "#14b8a6",
    what: "Columnar store for analytics (BigQuery, ClickHouse, Snowflake).",
    when: "Dashboards, reports, counting billions of events.",
    avoid: "Serving user-facing requests that need ms latency per row.",
  },
  { type: "external", name: "External API", icon: "🔗", group: "Other", color: "#64748b",
    what: "A third-party service: payment gateway, SMS/email provider, maps.",
    when: "Things you shouldn't build yourself.",
    avoid: "Calling it inside the request without timeouts/retries — it will be slow or down sometimes.",
  },
];

export const INFO: Record<CompType, CompInfo> = Object.fromEntries(COMPONENTS.map((c) => [c.type, c])) as Record<CompType, CompInfo>;
export const GROUPS = ["Users & edge", "Compute", "Data", "Async", "Other"] as const;
