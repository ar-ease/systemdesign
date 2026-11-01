import { INFO, type CompType } from "./components";

export type GNode = { id: string; type: CompType; label: string };
export type GEdge = { source: string; target: string };

type Types = CompType | CompType[];
const arr = (t: Types) => (Array.isArray(t) ? t : [t]);
const names = (t: Types) => arr(t).map((x) => INFO[x].name).join(" / ");
const an = (t: Types) => `${/^[AEIOU]/.test(names(t)) ? "an" : "a"} ${names(t)}`;

/** Read-only view of the user's drawing with helpers for writing rules. */
export class Graph {
  constructor(public nodes: GNode[], public edges: GEdge[]) {}

  of(t: Types) { const s = arr(t); return this.nodes.filter((n) => s.includes(n.type)); }
  count(t: Types) { return this.of(t).length; }
  byId(id: string) { return this.nodes.find((n) => n.id === id); }
  out(id: string) { return this.edges.filter((e) => e.source === id).map((e) => this.byId(e.target)!).filter(Boolean); }
  inc(id: string) { return this.edges.filter((e) => e.target === id).map((e) => this.byId(e.source)!).filter(Boolean); }

  /** Is there an arrow from any A to any B? */
  has(a: Types, b: Types) {
    const A = arr(a), B = arr(b);
    return this.edges.some((e) => A.includes(this.byId(e.source)?.type as CompType) && B.includes(this.byId(e.target)?.type as CompType));
  }

  /** Goal helper: arrow A → B must exist. Explains reversed arrows instead of just failing. */
  link(a: Types, b: Types, missing?: string): true | string {
    if (this.has(a, b)) return true;
    if (this.has(b, a)) return `You connected ${names(a)} and ${names(b)}, but the arrow points the wrong way. Arrows show who sends the request: ${names(a)} → ${names(b)}. Select the arrow and press “Flip arrow”.`;
    if (!this.count(a)) return `Add ${an(a)} first.`;
    if (!this.count(b)) return `Add ${an(b)} first.`;
    return missing ?? `Draw an arrow from ${names(a)} to ${names(b)}.`;
  }

  /** Every A must have an arrow to some B. */
  every(a: Types, b: Types, missing?: string): true | string {
    const B = arr(b);
    const bad = this.of(a).filter((n) => !this.out(n.id).some((m) => B.includes(m.type)));
    if (!this.count(a)) return `Add ${an(a)} first.`;
    if (!bad.length) return true;
    return missing ?? `${bad.map((n) => n.label).join(", ")} ${bad.length > 1 ? "aren't" : "isn't"} connected to ${an(b)}.`;
  }

  need(t: Types, min = 1, msg?: string): true | string {
    const c = this.count(t);
    return c >= min ? true : msg ?? (min > 1 ? `Add ${min - c} more ${names(t)} (you need ${min}).` : `Add ${an(t)}.`);
  }
}

export type Goal = { text: string; check: (g: Graph) => true | string };
export type Anti = {
  id: string;
  title: string;            // short "Not like this" headline
  why: string;              // the lesson
  severity: "error" | "warn";
  when: (g: Graph) => GNode[] | boolean; // offending nodes (or true)
};

const DATA: CompType[] = ["sql", "replica", "nosql", "cache", "queue", "search", "warehouse"];

/** Mistakes that are wrong in every design. */
export const GLOBAL_ANTIS: Anti[] = [
  {
    id: "client-to-data", severity: "error",
    title: "Client talking directly to a data store",
    why: "Clients must never connect to a database, cache or queue. Anyone could read or delete everything, you can't validate input, and you can't change the schema without breaking every app. Put an app server (your API) in between.",
    when: (g) => g.of("client").filter((c) => g.out(c.id).some((n) => DATA.includes(n.type))),
  },
  {
    id: "client-to-worker", severity: "error",
    title: "Client calling a worker directly",
    why: "Workers do background jobs. They should pull work from a queue, so a spike of users can't overload them and failed jobs can be retried.",
    when: (g) => g.of("worker").filter((w) => g.inc(w.id).some((n) => n.type === "client")),
  },
  {
    id: "queue-writes-db", severity: "error",
    title: "Queue writing to a database by itself",
    why: "A queue only stores messages. Something has to consume them and do the work: add a Worker (queue → worker → database).",
    when: (g) => g.of("queue").filter((q) => g.out(q.id).some((n) => ["sql", "nosql", "replica"].includes(n.type))),
  },
  {
    id: "data-to-client", severity: "error",
    title: "Data store sending to the client",
    why: "Arrows show who starts a request. Responses come back along the same arrow, so you never draw database → client. The client calls your API; your API calls the database.",
    when: (g) => g.nodes.filter((n) => DATA.includes(n.type) && g.out(n.id).some((m) => m.type === "client")),
  },
  {
    id: "replica-no-primary", severity: "error",
    title: "Read replica with no primary",
    why: "A replica is a copy of a primary database. Draw an arrow from the SQL database (primary) to the replica to show replication.",
    when: (g) => g.of("replica").filter((r) => !g.inc(r.id).some((n) => n.type === "sql")),
  },
  {
    id: "write-to-replica", severity: "warn",
    title: "Worker writing to a read replica",
    why: "Replicas are read-only. Writes always go to the primary, which then copies them to replicas.",
    when: (g) => g.of("replica").filter((r) => g.inc(r.id).some((n) => n.type === "worker")),
  },
  {
    id: "lb-single", severity: "warn",
    title: "Load balancer in front of only one server",
    why: "A load balancer is useful when it can spread traffic over 2+ servers and route around a dead one. With one server it adds a hop but no capacity or redundancy.",
    when: (g) => g.of("lb").filter((lb) => g.out(lb.id).filter((n) => n.type === "app" || n.type === "ws").length === 1),
  },
  {
    id: "orphan", severity: "warn",
    title: "Component not connected to anything",
    why: "Every box should have a reason to exist. Connect it, or delete it (select it and press Backspace).",
    when: (g) => g.nodes.filter((n) => !g.edges.some((e) => e.source === n.id || e.target === n.id)),
  },
];

export type Feedback = {
  goals: { text: string; ok: boolean; msg?: string }[];
  antis: { anti: Anti; nodes: GNode[] }[];
  passed: boolean;
};

export function evaluate(g: Graph, goals: Goal[], extra: Anti[] = []): Feedback {
  const gs = goals.map((goal) => {
    const r = goal.check(g);
    return r === true ? { text: goal.text, ok: true } : { text: goal.text, ok: false, msg: r };
  });
  const antis = [...extra, ...GLOBAL_ANTIS]
    .map((anti) => {
      const r = anti.when(g);
      const nodes = Array.isArray(r) ? r : [];
      return { anti, nodes, hit: Array.isArray(r) ? r.length > 0 : r };
    })
    .filter((x) => x.hit)
    .map(({ anti, nodes }) => ({ anti, nodes }));
  const passed = gs.every((x) => x.ok) && !antis.some((a) => a.anti.severity === "error");
  return { goals: gs, antis, passed };
}
