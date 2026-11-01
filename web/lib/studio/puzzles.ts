import type { CompType } from "./components";
import type { Anti, Goal, Graph } from "./graph";

export type SolNode = { id: string; type: CompType; x: number; y: number; label?: string };
export type Solution = { nodes: SolNode[]; edges: [string, string][] };

export type Step = {
  title: string;
  story: string;          // the problem, told first
  goals: Goal[];
  antis?: Anti[];         // mistakes specific to this step
  hints: string[];        // revealed one at a time
  explain: string;        // shown when the step is cleared
  solution: Solution;     // cumulative reference design
};

export type Puzzle = {
  id: string;
  title: string;
  blurb: string;
  level: string;           // related level number
  difficulty: "Starter" | "Core" | "Interview";
  steps: Step[];
};

// ---------- small helpers ----------
const N = (id: string, type: CompType, x: number, y: number, label?: string): SolNode => ({ id, type, x, y, label });
const behindLb = (g: Graph): true | string => {
  const apps = g.of("app");
  if (apps.length < 2) return `You have ${apps.length} App server${apps.length === 1 ? "" : "s"}. Add another so there are at least 2.`;
  if (!g.count("lb")) return "Add a Load balancer in front of the servers.";
  const bad = apps.filter((a) => !g.inc(a.id).some((n) => n.type === "lb"));
  return bad.length ? `${bad.map((b) => b.label).join(", ")} ${bad.length > 1 ? "don't" : "doesn't"} get traffic from the load balancer. Draw Load balancer → ${bad[0].label}.` : true;
};
const clientBypassLb: Anti = {
  id: "client-bypass-lb", severity: "error",
  title: "Client skipping the load balancer",
  why: "If clients still call one server directly, the load balancer can't spread the load or route around a dead server. Clients should only know the load balancer's address.",
  when: (g) => (g.count("lb") ? g.of("client").filter((c) => g.out(c.id).some((n) => n.type === "app")) : false),
};

// ---------- puzzles ----------
const growBase = [N("client", "client", 0, 200), N("app1", "app", 440, 110, "App server 1"), N("sql", "sql", 700, 220, "SQL database")];

export const PUZZLES: Puzzle[] = [
  {
    id: "grow-app",
    title: "From 1 user to 1 million",
    blurb: "Grow one photo app step by step. Every step starts with something breaking.",
    level: "01",
    difficulty: "Starter",
    steps: [
      {
        title: "Day 1: put your app online",
        story: "You built a photo-sharing app. People open it on their phones, and it needs to save and load their posts.",
        goals: [
          { text: "Users open the app (a Client)", check: (g) => g.need("client") },
          { text: "The client calls your API (App server)", check: (g) => g.link("client", "app") },
          { text: "The API stores data in a SQL database", check: (g) => g.link("app", "sql") },
        ],
        hints: [
          "Every request starts at the Client. Drag one onto the canvas.",
          "The client calls your App server (your API). It never talks to the database directly.",
          "Draw Client → App server → SQL database. Drag from a dot on one box to another box.",
        ],
        explain: "This is the classic three-tier design. Only the app server touches the database, so it can check input, enforce permissions and change the schema without breaking phones that already have the app installed.",
        solution: {
          nodes: [N("client", "client", 0, 200), N("app1", "app", 280, 200, "App server"), N("sql", "sql", 560, 200, "SQL database")],
          edges: [["client", "app1"], ["app1", "sql"]],
        },
      },
      {
        title: "10k users: the server is melting",
        story: "The app went viral. Your one server sits at 100% CPU and requests time out. Every time you deploy, the whole app goes down for a minute.",
        goals: [
          { text: "Run at least 2 App servers", check: (g) => g.need("app", 2) },
          { text: "Clients reach a Load balancer", check: (g) => g.link("client", "lb") },
          { text: "The load balancer sends traffic to every server", check: behindLb },
          { text: "Every server can reach the database", check: (g) => g.every("app", "sql") },
        ],
        antis: [clientBypassLb],
        hints: [
          "One machine has a ceiling. What if you ran two or three identical copies?",
          "Something has to sit in front and spread the traffic: a Load balancer.",
          "Client → Load balancer → App server 1 and App server 2 → SQL database.",
        ],
        explain: "This is horizontal scaling: identical stateless servers behind a load balancer. More users means you add servers. If one dies, or is being deployed, the load balancer stops sending it traffic. It only works if servers keep nothing in memory between requests, so put sessions in Redis or a signed token.",
        solution: {
          nodes: [N("client", "client", 0, 200), N("lb", "lb", 210, 200, "Load balancer"), N("app1", "app", 440, 110, "App server 1"), N("app2", "app", 440, 300, "App server 2"), N("sql", "sql", 700, 200, "SQL database")],
          edges: [["client", "lb"], ["lb", "app1"], ["lb", "app2"], ["app1", "sql"], ["app2", "sql"]],
        },
      },
      {
        title: "100k users: the database is the bottleneck",
        story: "The servers are fine now, but every page load runs the same few queries (get profile, get feed). 90% of database traffic is reads of the same hot data, and p99 latency has reached 800 ms.",
        goals: [
          { text: "Add a Cache", check: (g) => g.need("cache") },
          { text: "Every App server checks the cache", check: (g) => g.every("app", "cache") },
          { text: "On a miss, servers still read the database", check: (g) => g.every("app", "sql") },
        ],
        hints: [
          "Lots of users read the same data again and again. Where could you keep a fast copy?",
          "An in-memory Cache (Redis) answers in under 1 ms.",
          "Draw an arrow from each App server to the Cache, and keep their arrows to the SQL database (this is called cache-aside).",
        ],
        explain: "This is cache-aside. The app checks Redis first. On a miss, it reads the database and stores the result with a TTL. A 90% hit ratio removes 90% of the read load from the database. The trade-off is that cached data can be slightly stale, so cache only data that can tolerate that.",
        solution: {
          nodes: [N("client", "client", 0, 200), N("lb", "lb", 210, 200, "Load balancer"), N("app1", "app", 440, 110, "App server 1"), N("app2", "app", 440, 300, "App server 2"), N("cache", "cache", 700, 40, "Cache"), N("sql", "sql", 700, 260, "SQL database")],
          edges: [["client", "lb"], ["lb", "app1"], ["lb", "app2"], ["app1", "cache"], ["app2", "cache"], ["app1", "sql"], ["app2", "sql"]],
        },
      },
      {
        title: "1M users: reads still overload the primary",
        story: "Cache misses, new posts and admin reports still hammer the one database. Only 10% of traffic is writes, so most of the load is reads.",
        goals: [
          { text: "Add a Read replica", check: (g) => g.need("replica") },
          { text: "The primary replicates to it", check: (g) => g.link("sql", "replica", "Draw SQL database → Read replica to show replication.") },
          { text: "App servers send reads to the replica", check: (g) => g.link("app", "replica") },
          { text: "Writes still go to the primary", check: (g) => g.every("app", "sql") },
        ],
        hints: [
          "Writes are rare and reads are common. Could you have more than one copy of the data just for reading?",
          "A Read replica is a read-only copy that the primary keeps up to date.",
          "SQL database → Read replica (replication), and App servers → Read replica for reads.",
        ],
        explain: "Writes go to the primary, which streams its changes to the replicas, and reads are spread across the replicas. Watch out for replication lag: right after users edit their profile, read it from the primary for a few seconds so they see their own change (this is called read-your-writes). A replica can also be promoted if the primary dies.",
        solution: {
          nodes: [N("client", "client", 0, 200), N("lb", "lb", 210, 200, "Load balancer"), N("app1", "app", 440, 110, "App server 1"), N("app2", "app", 440, 300, "App server 2"), N("cache", "cache", 700, 40, "Cache"), N("sql", "sql", 700, 260, "SQL primary"), N("rep", "replica", 960, 260, "Read replica")],
          edges: [["client", "lb"], ["lb", "app1"], ["lb", "app2"], ["app1", "cache"], ["app2", "cache"], ["app1", "sql"], ["app2", "sql"], ["sql", "rep"], ["app1", "rep"], ["app2", "rep"]],
        },
      },
      {
        title: "Photos load slowly around the world",
        story: "Photos are saved as blobs inside the SQL database. Backups take 6 hours, the database disk keeps filling up, and users in Asia wait 2 seconds for each image.",
        goals: [
          { text: "Store files in Object storage", check: (g) => g.need("storage") },
          { text: "App servers upload files there", check: (g) => g.link("app", "storage") },
          { text: "Clients load images through a CDN", check: (g) => g.link("client", "cdn") },
          { text: "The CDN pulls from object storage", check: (g) => g.link("cdn", "storage") },
        ],
        antis: [{
          id: "cdn-to-app", severity: "warn", title: "CDN pointing at your app servers for images",
          why: "If the CDN's origin is your app, every cache miss still hits your servers and your database. Point the CDN at object storage, so images never touch your app.",
          when: (g) => g.of("cdn").filter((c) => g.out(c.id).some((n) => n.type === "app" || n.type === "lb")),
        }],
        hints: [
          "Databases are for rows, not for multi-MB files. Where do files belong?",
          "Object storage (S3) is cheap and unlimited. The database keeps only the file's URL.",
          "App server → Object storage (upload). Client → CDN → Object storage (download).",
        ],
        explain: "Files belong in object storage, and the database stores only their keys and URLs. A CDN caches images near users, so they load in about 20 ms instead of 2 s. A common extra: give the client a pre-signed URL so it uploads straight to S3, and the file bytes never pass through your servers.",
        solution: {
          nodes: [N("client", "client", 0, 200), N("cdn", "cdn", 210, 20, "CDN"), N("lb", "lb", 210, 260, "Load balancer"), N("app1", "app", 440, 180, "App server 1"), N("app2", "app", 440, 360, "App server 2"), N("st", "storage", 700, -40, "Object storage"), N("cache", "cache", 700, 120, "Cache"), N("sql", "sql", 700, 320, "SQL primary"), N("rep", "replica", 960, 320, "Read replica")],
          edges: [["client", "cdn"], ["cdn", "st"], ["client", "lb"], ["lb", "app1"], ["lb", "app2"], ["app1", "st"], ["app2", "st"], ["app1", "cache"], ["app2", "cache"], ["app1", "sql"], ["app2", "sql"], ["sql", "rep"], ["app1", "rep"], ["app2", "rep"]],
        },
      },
      {
        title: "Sign-up is slow because of emails",
        story: "On sign-up, the app sends a welcome email and resizes the profile photo inside the request. Sign-up takes 4 seconds, and it fails whenever the email provider is down.",
        goals: [
          { text: "App servers put a job on a Queue", check: (g) => g.link("app", "queue") },
          { text: "A Worker takes jobs from the queue", check: (g) => g.link("queue", "worker") },
          { text: "The worker calls the email provider (External API)", check: (g) => g.link("worker", "external") },
        ],
        antis: [{
          id: "app-calls-external", severity: "warn", title: "Calling the email provider inside the request",
          why: "Users wait for a third party they don't care about, and the request fails when that provider is slow or down. Put a job on a queue and respond right away.",
          when: (g) => g.of("app").filter((a) => g.out(a.id).some((n) => n.type === "external")),
        }],
        hints: [
          "Does the user need the email sent before seeing 'Welcome'? No, so do it later.",
          "A Queue holds jobs, and a Worker processes them in the background, with retries.",
          "App server → Queue → Worker → External API (email provider).",
        ],
        explain: "This is asynchronous processing. The app puts a job on the queue and responds immediately. Workers handle jobs at their own pace, retry failures with backoff, and you add more workers when the queue grows. Sign-up no longer depends on a slow third party. Because a job may run twice, make it idempotent so a retry doesn't send two emails.",
        solution: {
          nodes: [N("client", "client", 0, 200), N("cdn", "cdn", 210, 20, "CDN"), N("lb", "lb", 210, 260, "Load balancer"), N("app1", "app", 440, 180, "App server 1"), N("app2", "app", 440, 360, "App server 2"), N("st", "storage", 700, -40, "Object storage"), N("cache", "cache", 700, 120, "Cache"), N("sql", "sql", 700, 320, "SQL primary"), N("rep", "replica", 960, 320, "Read replica"), N("q", "queue", 700, 500, "Queue"), N("w", "worker", 960, 500, "Worker"), N("ext", "external", 1200, 500, "Email provider")],
          edges: [["client", "cdn"], ["cdn", "st"], ["client", "lb"], ["lb", "app1"], ["lb", "app2"], ["app1", "st"], ["app2", "st"], ["app1", "cache"], ["app2", "cache"], ["app1", "sql"], ["app2", "sql"], ["sql", "rep"], ["app1", "rep"], ["app2", "rep"], ["app1", "q"], ["app2", "q"], ["q", "w"], ["w", "ext"]],
        },
      },
    ],
  },
  {
    id: "url-shortener",
    title: "URL shortener (bit.ly)",
    blurb: "100M redirects a day, 1M new links. Reads beat writes 100 to 1.",
    level: "08",
    difficulty: "Core",
    steps: [
      {
        title: "Create and redirect",
        story: "POST a long URL and get back a short code. GET /abc123 redirects to the long URL. You expect 1,200 redirects per second at peak, so a single server won't do.",
        goals: [
          { text: "Client → Load balancer", check: (g) => g.link("client", "lb") },
          { text: "At least 2 App servers behind it", check: behindLb },
          { text: "Links stored in a database", check: (g) => g.every("app", ["sql", "nosql"]) },
        ],
        antis: [clientBypassLb],
        hints: ["Start with the scaled-out three-tier design.", "Client → Load balancer → 2 App servers.", "Each App server → a database (SQL or a key-value NoSQL both work: lookups are by short code)."],
        explain: "Every lookup is by one key (the short code), so either Postgres with a unique index or a key-value store like DynamoDB works. The hard part is generating short codes without collisions: use a counter encoded in base62, or random codes guarded by a unique constraint and a retry.",
        solution: {
          nodes: [N("client", "client", 0, 160), N("lb", "lb", 220, 160, "Load balancer"), N("a1", "app", 460, 70, "App server 1"), N("a2", "app", 460, 250, "App server 2"), N("db", "sql", 720, 160, "Links DB")],
          edges: [["client", "lb"], ["lb", "a1"], ["lb", "a2"], ["a1", "db"], ["a2", "db"]],
        },
      },
      {
        title: "A celebrity tweets a link",
        story: "One link gets 50,000 clicks a minute. Redirects are 100× more common than creates, and the same codes are read again and again.",
        goals: [
          { text: "Add a Cache for code → URL", check: (g) => g.need("cache") },
          { text: "Every App server checks the cache first", check: (g) => g.every("app", "cache") },
        ],
        hints: ["A short link never changes once it's created. That makes it perfect to cache.", "Add a Cache (Redis) and draw an arrow to it from each App server."],
        explain: "Links never change once created, so caching them is safe: there's no invalidation problem. Use a long TTL with LRU eviction, and a 95%+ hit ratio is realistic. You can also return a 301/302 with Cache-Control headers so browsers or a CDN remember the redirect.",
        solution: {
          nodes: [N("client", "client", 0, 160), N("lb", "lb", 220, 160, "Load balancer"), N("a1", "app", 460, 70, "App server 1"), N("a2", "app", 460, 250, "App server 2"), N("cache", "cache", 720, 20, "Cache"), N("db", "sql", 720, 220, "Links DB")],
          edges: [["client", "lb"], ["lb", "a1"], ["lb", "a2"], ["a1", "cache"], ["a2", "cache"], ["a1", "db"], ["a2", "db"]],
        },
      },
      {
        title: "Click analytics",
        story: "Marketing wants click counts per link per day. Writing a row to the main database on every redirect would add 1,200 writes per second and slow every redirect down.",
        goals: [
          { text: "App servers emit click events to a Queue", check: (g) => g.link("app", "queue") },
          { text: "A Worker consumes them", check: (g) => g.link("queue", "worker") },
          { text: "Counts land in an Analytics store", check: (g) => g.link("worker", "warehouse") },
        ],
        antis: [{
          id: "sync-analytics", severity: "warn", title: "Writing analytics inside the redirect",
          why: "The redirect is the hot path. Every extra write there adds latency and load. Send a fire-and-forget event and count clicks elsewhere.",
          when: (g) => g.of("app").filter((a) => g.out(a.id).some((n) => n.type === "warehouse")),
        }],
        hints: ["The user doesn't need the click counted before being redirected.", "Event → Queue → Worker → Analytics store."],
        explain: "Analytics now stays out of the hot path. The redirect publishes an event (to Kafka) and returns at once. Workers batch the events and write aggregates to a columnar store like ClickHouse. Counts can lag by a few seconds, and nobody minds.",
        solution: {
          nodes: [N("client", "client", 0, 160), N("lb", "lb", 220, 160, "Load balancer"), N("a1", "app", 460, 70, "App server 1"), N("a2", "app", 460, 250, "App server 2"), N("cache", "cache", 720, 0, "Cache"), N("db", "sql", 720, 160, "Links DB"), N("q", "queue", 720, 330, "Click events"), N("w", "worker", 960, 330, "Worker"), N("wh", "warehouse", 1200, 330, "Analytics store")],
          edges: [["client", "lb"], ["lb", "a1"], ["lb", "a2"], ["a1", "cache"], ["a2", "cache"], ["a1", "db"], ["a2", "db"], ["a1", "q"], ["a2", "q"], ["q", "w"], ["w", "wh"]],
        },
      },
    ],
  },
  {
    id: "chat",
    title: "Chat app (WhatsApp-lite)",
    blurb: "Real-time messages, users on different servers, and offline delivery.",
    level: "05",
    difficulty: "Interview",
    steps: [
      {
        title: "Messages appear instantly",
        story: "Users must see new messages immediately without refreshing. Polling every second from 10 million phones would melt your servers.",
        goals: [
          { text: "Clients connect through a Load balancer", check: (g) => g.link("client", "lb") },
          { text: "At least 2 WebSocket servers behind it", check: (g) => { const r = g.need("ws", 2); if (r !== true) return r; const bad = g.of("ws").filter((w) => !g.inc(w.id).some((n) => n.type === "lb")); return bad.length ? `Draw Load balancer → ${bad[0].label}.` : true; } },
          { text: "Messages are saved in a database", check: (g) => g.every("ws", ["nosql", "sql"]) },
        ],
        antis: [{
          id: "chat-sql", severity: "warn", title: "SQL for billions of chat messages",
          why: "It works at first, but chat produces billions of small, append-only rows that are always read as 'the latest messages in conversation X'. A wide-column NoSQL store (Cassandra, or DynamoDB with partition = conversation_id, sort = time) scales those writes more easily.",
          when: (g) => g.of("ws").filter((w) => g.out(w.id).some((n) => n.type === "sql")),
        }],
        hints: ["Push needs a connection that stays open: a WebSocket.", "Client → Load balancer → 2 WebSocket servers.", "WebSocket servers → a NoSQL database for messages."],
        explain: "Each phone keeps one WebSocket open, so the server can push a message the moment it arrives. Messages are stored by (conversation_id, timestamp) in a wide-column NoSQL store, which gives fast writes and fast 'latest N messages' reads.",
        solution: {
          nodes: [N("c", "client", 0, 160), N("lb", "lb", 220, 160, "Load balancer"), N("w1", "ws", 460, 70, "WS server 1"), N("w2", "ws", 460, 250, "WS server 2"), N("db", "nosql", 720, 160, "Messages DB")],
          edges: [["c", "lb"], ["lb", "w1"], ["lb", "w2"], ["w1", "db"], ["w2", "db"]],
        },
      },
      {
        title: "Alice and Bob are on different servers",
        story: "Alice is connected to WS server 1 and Bob to WS server 2. Alice sends Bob a message. How does server 1 get it to Bob's connection on server 2?",
        goals: [
          { text: "Servers publish messages to a pub/sub Queue", check: (g) => g.link("ws", "queue") },
          { text: "Servers also subscribe to it", check: (g) => g.link("queue", "ws", "Draw Queue → WebSocket server so servers receive messages for the users they hold.") },
          { text: "A Cache tracks who is online and where", check: (g) => g.link("ws", "cache") },
        ],
        hints: ["Server 1 doesn't hold Bob's connection, so it needs a way to send the message to whichever server does.", "Pub/sub: every server publishes and subscribes.", "WS servers ↔ Queue (both directions), and WS servers → Cache (presence: user → server)."],
        explain: "Each server publishes outgoing messages and subscribes to messages for the users it holds, through Redis pub/sub or Kafka topics. A presence map in Redis (user_id → server, with a TTL refreshed by heartbeats) answers both 'is Bob online?' and 'which server has Bob?'.",
        solution: {
          nodes: [N("c", "client", 0, 160), N("lb", "lb", 220, 160, "Load balancer"), N("w1", "ws", 460, 70, "WS server 1"), N("w2", "ws", 460, 250, "WS server 2"), N("db", "nosql", 720, 160, "Messages DB"), N("ps", "queue", 720, 340, "Pub/sub"), N("pres", "cache", 720, -20, "Presence cache")],
          edges: [["c", "lb"], ["lb", "w1"], ["lb", "w2"], ["w1", "db"], ["w2", "db"], ["w1", "ps"], ["w2", "ps"], ["ps", "w1"], ["ps", "w2"], ["w1", "pres"], ["w2", "pres"]],
        },
      },
      {
        title: "Bob's phone is off",
        story: "Bob is offline. The message must still reach him later, and his phone should get a push notification.",
        goals: [
          { text: "A Worker consumes undelivered messages", check: (g) => g.link("queue", "worker") },
          { text: "It sends a push via an External API (APNs/FCM)", check: (g) => g.link("worker", "external") },
        ],
        hints: ["The message is already saved, so you only need to tell Bob's phone to come and fetch it.", "Queue → Worker → External API (push notification service)."],
        explain: "When presence says Bob is offline, the message goes on a queue. A worker sends a push through APNs/FCM. When Bob reconnects, his phone asks for everything after the last message ID it saw, so nothing is lost. Delivered and read receipts flow back the same way.",
        solution: {
          nodes: [N("c", "client", 0, 160), N("lb", "lb", 220, 160, "Load balancer"), N("w1", "ws", 460, 70, "WS server 1"), N("w2", "ws", 460, 250, "WS server 2"), N("db", "nosql", 720, 160, "Messages DB"), N("ps", "queue", 720, 340, "Pub/sub"), N("pres", "cache", 720, -20, "Presence cache"), N("wk", "worker", 960, 340, "Push worker"), N("ext", "external", 1200, 340, "APNs / FCM")],
          edges: [["c", "lb"], ["lb", "w1"], ["lb", "w2"], ["w1", "db"], ["w2", "db"], ["w1", "ps"], ["w2", "ps"], ["ps", "w1"], ["ps", "w2"], ["w1", "pres"], ["w2", "pres"], ["ps", "wk"], ["wk", "ext"]],
        },
      },
    ],
  },
  {
    id: "booking",
    title: "BookMyShow: never sell a seat twice",
    blurb: "Seat holds, payments that time out, and users who click Pay twice.",
    level: "13",
    difficulty: "Interview",
    steps: [
      {
        title: "Browse and book",
        story: "Users pick a show, choose seats and book them. Two people must never get the same seat.",
        goals: [
          { text: "Client → Load balancer → 2+ App servers", check: (g) => { const a = g.link("client", "lb"); return a === true ? behindLb(g) : a; } },
          { text: "Bookings stored in a SQL database", check: (g) => g.every("app", "sql") },
        ],
        antis: [clientBypassLb, {
          id: "booking-nosql", severity: "warn", title: "NoSQL as the bookings store",
          why: "Booking needs a transaction across several rows (seats + booking) and a hard uniqueness rule (one booking per seat per show). A relational database gives you ACID transactions and UNIQUE(show_id, seat_id) for free.",
          when: (g) => g.of("app").filter((a) => g.out(a.id).some((n) => n.type === "nosql")),
        }],
        hints: ["Same scaled-out start as before.", "This is about money and uniqueness, so which database type gives you transactions?", "App servers → SQL database."],
        explain: "The final guard against double-selling lives in the database: a UNIQUE(show_id, seat_id) constraint on booked seats, inside a transaction. Even if two requests race, one insert fails. Practise the schema in the Database Studio.",
        solution: {
          nodes: [N("c", "client", 0, 160), N("lb", "lb", 220, 160, "Load balancer"), N("a1", "app", 460, 70, "App server 1"), N("a2", "app", 460, 250, "App server 2"), N("db", "sql", 720, 160, "Bookings DB")],
          edges: [["c", "lb"], ["lb", "a1"], ["lb", "a2"], ["a1", "db"], ["a2", "db"]],
        },
      },
      {
        title: "Hold seats while the user pays",
        story: "Users take up to 5 minutes to pay. Their seats must be held, and released automatically if they don't pay.",
        goals: [
          { text: "Add a Cache for seat holds with a TTL", check: (g) => g.need("cache") },
          { text: "App servers place holds in it", check: (g) => g.every("app", "cache") },
        ],
        hints: ["You need a lock that releases itself after 5 minutes.", "Redis: SET hold:show42:A7 user123 NX EX 300 creates the hold atomically and lets it expire on its own."],
        explain: "A seat hold is a Redis key set with NX (only if it doesn't exist yet) and EX 300 (expires in 5 minutes). That's atomic, and abandoned holds release themselves. Redis is the fast first line of defence. The database's unique constraint is still the final truth when the booking is confirmed.",
        solution: {
          nodes: [N("c", "client", 0, 160), N("lb", "lb", 220, 160, "Load balancer"), N("a1", "app", 460, 70, "App server 1"), N("a2", "app", 460, 250, "App server 2"), N("cache", "cache", 720, 20, "Seat holds (Redis)"), N("db", "sql", 720, 230, "Bookings DB")],
          edges: [["c", "lb"], ["lb", "a1"], ["lb", "a2"], ["a1", "cache"], ["a2", "cache"], ["a1", "db"], ["a2", "db"]],
        },
      },
      {
        title: "Payments time out, users click twice",
        story: "The payment gateway sometimes takes 30 seconds or times out, and nervous users click Pay twice. After payment you must email tickets.",
        goals: [
          { text: "App servers call the Payment gateway (External API)", check: (g) => g.link("app", "external") },
          { text: "Confirmed bookings go on a Queue", check: (g) => g.link("app", "queue") },
          { text: "A Worker sends tickets", check: (g) => g.link("queue", "worker") },
        ],
        hints: ["Charging the card has to happen during checkout, but emailing tickets doesn't.", "App → External (payment). App → Queue → Worker for tickets.", "Say this in the interview: every payment call carries an idempotency key, so a double click can't charge twice."],
        explain: "Send an idempotency key (for example the booking ID) with every payment request, so a retry or double click can't charge twice. Treat the gateway's webhook as the source of truth for slow payments. Once a booking is confirmed, a queue and worker send tickets and emails off the critical path. This is a mini saga: if payment fails, release the seat hold.",
        solution: {
          nodes: [N("c", "client", 0, 160), N("lb", "lb", 220, 160, "Load balancer"), N("a1", "app", 460, 70, "App server 1"), N("a2", "app", 460, 250, "App server 2"), N("cache", "cache", 720, -40, "Seat holds (Redis)"), N("db", "sql", 720, 140, "Bookings DB"), N("pay", "external", 720, 320, "Payment gateway"), N("q", "queue", 720, 470, "Booking events"), N("w", "worker", 960, 470, "Ticket worker")],
          edges: [["c", "lb"], ["lb", "a1"], ["lb", "a2"], ["a1", "cache"], ["a2", "cache"], ["a1", "db"], ["a2", "db"], ["a1", "pay"], ["a2", "pay"], ["a1", "q"], ["a2", "q"], ["q", "w"]],
        },
      },
    ],
  },
];

export const puzzleById = (id: string) => PUZZLES.find((p) => p.id === id);
