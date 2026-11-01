// Database Studio: schema model, rule helpers, SQL generation and global anti-patterns.

export const COL_TYPES = ["bigint", "int", "uuid", "text", "varchar(255)", "boolean", "numeric(10,2)", "float", "timestamptz", "date", "jsonb"] as const;
export type ColType = (typeof COL_TYPES)[number];

export type Column = {
  id: string;
  name: string;
  type: ColType;
  pk: boolean;
  unique: boolean;
  nullable: boolean;
  ref?: { table: string; column: string }; // ids
};
export type Index = { id: string; columns: string[]; unique: boolean }; // column ids, in order
export type Table = { id: string; name: string; x: number; y: number; columns: Column[]; indexes: Index[] };
export type Schema = { tables: Table[] };

export const TYPE_TIPS: Partial<Record<ColType, string>> = {
  bigint: "Whole numbers up to 9 quintillion. The default for IDs and foreign keys.",
  int: "Whole numbers up to ~2.1 billion. Fine for counts and small tables.",
  uuid: "Random 128-bit IDs. Safe to generate anywhere, but bigger and not ordered.",
  text: "Any length string. In Postgres it's as fast as varchar.",
  "numeric(10,2)": "Exact decimals. Use this (or integer cents) for money.",
  float: "Approximate numbers. Fine for measurements; never for money (0.1 + 0.2 ≠ 0.3).",
  timestamptz: "A moment in time with time zone. Use for created_at and starts_at.",
  jsonb: "Flexible JSON. Handy for rarely-queried extras; don't hide relationships in it.",
};

// ---------- helpers for rules ----------
const norm = (s: string) => s.trim().toLowerCase();

export class SchemaView {
  constructor(public s: Schema) {}
  table(re: RegExp) { return this.s.tables.find((t) => re.test(norm(t.name))); }
  tableById(id: string) { return this.s.tables.find((t) => t.id === id); }
  col(t: Table | undefined, re: RegExp) { return t?.columns.find((c) => re.test(norm(c.name))); }
  colById(t: Table, id: string) { return t.columns.find((c) => c.id === id); }
  pkCols(t: Table) { return t.columns.filter((c) => c.pk); }

  /** Is the set of columns guaranteed unique (PK, UNIQUE column or UNIQUE index — order doesn't matter)? */
  uniqueOn(t: Table | undefined, cols: (Column | undefined)[]) {
    if (!t || cols.some((c) => !c)) return false;
    const ids = new Set(cols.map((c) => c!.id));
    const same = (list: string[]) => list.length === ids.size && list.every((x) => ids.has(x));
    const pk = this.pkCols(t).map((c) => c.id);
    if (pk.length && same(pk)) return true;
    if (ids.size === 1 && cols[0]!.unique) return true;
    return t.indexes.some((i) => i.unique && same(i.columns));
  }

  /** Is there an index (or PK) whose leading columns are exactly these, in this order? */
  indexedBy(t: Table | undefined, cols: (Column | undefined)[]) {
    if (!t || cols.some((c) => !c)) return false;
    const want = cols.map((c) => c!.id);
    const leads = (list: string[]) => want.every((id, i) => list[i] === id);
    const pk = this.pkCols(t).map((c) => c.id);
    if (pk.length && leads(pk)) return true;
    if (want.length === 1 && cols[0]!.unique) return true;
    return t.indexes.some((i) => leads(i.columns));
  }

  /** Does column c reference table `to`? */
  refs(c: Column | undefined, to: Table | undefined) {
    return !!(c && to && c.ref?.table === to.id);
  }
}

export type DbGoal = { text: string; check: (v: SchemaView) => true | string };
export type DbAnti = {
  id: string;
  title: string;
  why: string;
  severity: "error" | "warn";
  when: (v: SchemaView) => string[]; // human-readable locations ("courses.student_ids")
};

// ---------- mistakes that are wrong in every schema ----------
export const DB_GLOBAL_ANTIS: DbAnti[] = [
  {
    id: "no-pk", severity: "error", title: "Table without a primary key",
    why: "Every row needs a unique identity so you can update, delete and reference exactly one row. Add an id column (bigint) and mark it PK, or a composite key for join tables.",
    when: (v) => v.s.tables.filter((t) => t.columns.length && !t.columns.some((c) => c.pk)).map((t) => t.name || "(unnamed)"),
  },
  {
    id: "list-in-column", severity: "error", title: "A list of IDs stored in one column",
    why: "Storing '3,8,15' in one column (or a JSON array of IDs) breaks first normal form. You can't join on it, index it, or enforce foreign keys, and removing one item means rewriting the whole string. Create a join table with one row per pair instead.",
    when: (v) => v.s.tables.flatMap((t) => t.columns.filter((c) => /(_ids|_list|ids)$/.test(norm(c.name)) || (/^(students|followers|following|members|tags|seats)$/.test(norm(c.name)) && ["text", "jsonb", "varchar(255)"].includes(c.type))).map((c) => `${t.name}.${c.name}`)),
  },
  {
    id: "repeating-group", severity: "error", title: "Repeating columns (phone1, phone2, phone3…)",
    why: "Numbered columns mean a hidden one-to-many relationship. What happens when someone has 4? Move them to their own table with a foreign key back.",
    when: (v) => v.s.tables.flatMap((t) => {
      const bases = t.columns.map((c) => norm(c.name).match(/^(.*?)_?(\d)$/)?.[1]).filter(Boolean) as string[];
      const dup = bases.filter((b, i) => bases.indexOf(b) !== i);
      return [...new Set(dup)].map((b) => `${t.name}.${b}1, ${b}2…`);
    }),
  },
  {
    id: "fk-not-set", severity: "warn", title: "Looks like a foreign key, but isn't one",
    why: "A column like user_id that points at another table should be declared as a foreign key. Then the database rejects orphan rows (a booking for a user that doesn't exist). Set its 'references' to the right table.",
    when: (v) => v.s.tables.flatMap((t) => t.columns.filter((c) => !c.pk && !c.ref && /_id$/.test(norm(c.name)) && v.s.tables.some((o) => o.id !== t.id && norm(o.name).startsWith(norm(c.name).replace(/_id$/, "").slice(0, 4)))).map((c) => `${t.name}.${c.name}`)),
  },
  {
    id: "fk-no-index", severity: "warn", title: "Foreign key without an index",
    why: "Postgres doesn't index foreign keys automatically. 'Get all bookings for this user' then scans the whole table, and deleting a user locks while it checks every row. Add an index that starts with this column.",
    when: (v) => v.s.tables.flatMap((t) => t.columns.filter((c) => c.ref && !v.indexedBy(t, [c])).map((c) => `${t.name}.${c.name}`)),
  },
  {
    id: "float-money", severity: "error", title: "Money stored as float",
    why: "Floats are approximate: 0.1 + 0.2 = 0.30000000000000004. Over millions of payments the totals drift. Use numeric(10,2), or store integer cents in a bigint.",
    when: (v) => v.s.tables.flatMap((t) => t.columns.filter((c) => c.type === "float" && /(price|amount|balance|total|cost|fee)/.test(norm(c.name))).map((c) => `${t.name}.${c.name}`)),
  },
  {
    id: "dup-table", severity: "error", title: "Two tables with the same name",
    why: "Table names must be unique in a schema.",
    when: (v) => { const n = v.s.tables.map((t) => norm(t.name)); return [...new Set(n.filter((x, i) => x && n.indexOf(x) !== i))]; },
  },
];

export type DbFeedback = {
  goals: { text: string; ok: boolean; msg?: string }[];
  antis: { anti: DbAnti; where: string[] }[];
  passed: boolean;
};

export function evaluateSchema(s: Schema, goals: DbGoal[], extra: DbAnti[] = []): DbFeedback {
  const v = new SchemaView(s);
  const gs = goals.map((g) => { const r = g.check(v); return r === true ? { text: g.text, ok: true } : { text: g.text, ok: false, msg: r }; });
  const antis = [...extra, ...DB_GLOBAL_ANTIS].map((anti) => ({ anti, where: anti.when(v) })).filter((x) => x.where.length);
  return { goals: gs, antis, passed: gs.every((g) => g.ok) && !antis.some((a) => a.anti.severity === "error") };
}

// ---------- SQL ----------
const ident = (s: string) => (/^[a-z_][a-z0-9_]*$/.test(s) ? s : `"${s.replace(/"/g, '""')}"`);

export function toSQL(s: Schema): string {
  const out: string[] = [];
  for (const t of s.tables) {
    if (!t.name) continue;
    const pks = t.columns.filter((c) => c.pk);
    const lines = t.columns.filter((c) => c.name).map((c) => {
      let l = `  ${ident(c.name)} ${c.type}`;
      if (pks.length === 1 && c.pk) l += c.type === "bigint" ? " GENERATED ALWAYS AS IDENTITY PRIMARY KEY" : " PRIMARY KEY";
      if (!c.pk && !c.nullable) l += " NOT NULL";
      if (c.unique && !c.pk) l += " UNIQUE";
      if (c.ref) {
        const rt = s.tables.find((x) => x.id === c.ref!.table);
        const rc = rt?.columns.find((x) => x.id === c.ref!.column);
        if (rt && rc) l += ` REFERENCES ${ident(rt.name)}(${ident(rc.name)})`;
      }
      return l;
    });
    if (pks.length > 1) lines.push(`  PRIMARY KEY (${pks.map((c) => ident(c.name)).join(", ")})`);
    out.push(`CREATE TABLE ${ident(t.name)} (\n${lines.join(",\n")}\n);`);
    for (const i of t.indexes) {
      const cols = i.columns.map((id) => t.columns.find((c) => c.id === id)?.name).filter(Boolean) as string[];
      if (!cols.length) continue;
      out.push(`CREATE ${i.unique ? "UNIQUE " : ""}INDEX ${ident(`${t.name}_${cols.join("_")}_${i.unique ? "key" : "idx"}`)} ON ${ident(t.name)} (${cols.map(ident).join(", ")});`);
    }
  }
  return out.join("\n\n");
}

// ---------- building solutions compactly ----------
// "users: id bigint pk; email text unique"  →  Table
let seq = 0;
export const uid = (p = "x") => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;

export type TableSpec = { name: string; x: number; y: number; cols: string; idx?: string[] };
/** cols: "id bigint pk; email text unique; user_id bigint ->users.id; bio text null" · idx: ["user_id,created_at", "!a,b" (unique)] */
export function buildSchema(specs: TableSpec[]): Schema {
  const tables: Table[] = specs.map((sp) => ({
    id: `t_${sp.name}`, name: sp.name, x: sp.x, y: sp.y, indexes: [],
    columns: sp.cols.split(";").map((raw) => raw.trim()).filter(Boolean).map((raw) => {
      const [name, type, ...flags] = raw.split(/\s+/);
      return {
        id: `c_${sp.name}_${name}`, name, type: type as ColType,
        pk: flags.includes("pk"), unique: flags.includes("unique"), nullable: flags.includes("null"),
        ref: flags.find((f) => f.startsWith("->")) ? (() => { const [rt, rc] = flags.find((f) => f.startsWith("->"))!.slice(2).split("."); return { table: `t_${rt}`, column: `c_${rt}_${rc}` }; })() : undefined,
      };
    }),
  }));
  specs.forEach((sp, i) => {
    tables[i].indexes = (sp.idx ?? []).map((ix, j) => {
      const unique = ix.startsWith("!");
      return { id: `i_${sp.name}_${j}`, unique, columns: ix.replace("!", "").split(",").map((c) => `c_${sp.name}_${c.trim()}`) };
    });
  });
  return { tables };
}
