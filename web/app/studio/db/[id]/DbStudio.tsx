"use client";

import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background, Controls, ConnectionMode, MarkerType, ReactFlow, ReactFlowProvider, useReactFlow,
  type Edge, type NodeChange,
} from "@xyflow/react";
import TableNode, { type TableNodeT } from "@/components/studio/TableNode";
import StepPanel from "@/components/studio/StepPanel";
import {
  COL_TYPES, TYPE_TIPS, evaluateSchema, toSQL, uid,
  type ColType, type Column, type Schema, type Table,
} from "@/lib/studio/schema";
import { dbPuzzleById } from "@/lib/studio/dbPuzzles";
import { loadDrawing, useAutosave } from "@/lib/studio/persist";
import { useProgress } from "@/lib/progress";

const nodeTypes = { table: TableNode };
type Saved = { step: number; schema: Schema };

function flowFor(s: Schema, active: string | null, bad: Set<string>, warn: Set<string>) {
  const nodes: TableNodeT[] = s.tables.map((t) => ({
    id: t.id, type: "table", position: { x: t.x, y: t.y },
    data: { table: t, active: t.id === active, bad: bad.has(t.name), warn: warn.has(t.name) },
  }));
  const edges: Edge[] = s.tables.flatMap((t) => t.columns.filter((c) => c.ref && s.tables.some((x) => x.id === c.ref!.table)).map((c) => {
    const target = s.tables.find((x) => x.id === c.ref!.table)!;
    const leftToRight = t.x <= target.x;
    return {
      id: `${t.id}-${c.id}`, source: t.id, target: target.id,
      sourceHandle: leftToRight ? "r" : "l", targetHandle: leftToRight ? "l" : "r",
      label: c.name, type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed }, style: { strokeWidth: 1.6 },
    } satisfies Edge;
  }));
  return { nodes, edges };
}

const newTable = (n: number, x: number, y: number): Table => ({
  id: uid("t"), name: "", x, y, indexes: [],
  columns: [{ id: uid("c"), name: "id", type: "bigint", pk: true, unique: false, nullable: false }],
});

function Studio({ id }: { id: string }) {
  const puzzle = dbPuzzleById(id)!;
  const steps = puzzle.steps;
  const { p, update } = useProgress();
  const [schema, setSchema] = useState<Schema>({ tables: [] });
  const [active, setActive] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [checked, setChecked] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [showSol, setShowSol] = useState(false);
  const [view, setView] = useState<"diagram" | "sql">("diagram");
  const [loaded, setLoaded] = useState(false);
  const { fitView } = useReactFlow();
  const step = steps[stepIdx];
  const key = `db-${id}`;

  useEffect(() => {
    loadDrawing<Saved>(key).then((s) => {
      if (s?.schema) {
        setSchema(s.schema);
        setStepIdx(Math.min(s.step ?? 0, steps.length - 1));
        setActive(s.schema.tables[0]?.id ?? null);
        setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
      }
      setLoaded(true);
    });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const saved = useMemo<Saved>(() => ({ step: stepIdx, schema }), [stepIdx, schema]);
  useAutosave(key, saved, loaded);

  // ----- feedback -----
  const fb = useMemo(() => evaluateSchema(schema, step.goals, step.antis), [schema, step]);
  const tableOf = (w: string) => w.split(/[.,]/)[0].trim();
  const bad = useMemo(() => new Set(fb.antis.filter((a) => a.anti.severity === "error").flatMap((a) => a.where.map(tableOf))), [fb]);
  const warn = useMemo(() => new Set(fb.antis.filter((a) => a.anti.severity === "warn").flatMap((a) => a.where.map(tableOf))), [fb]);
  const flow = useMemo(() => flowFor(schema, active, bad, warn), [schema, active, bad, warn]);

  const stepKey = `db:${id}:${stepIdx}`;
  useEffect(() => {
    if (checked && fb.passed && !p.studio?.[stepKey]) update((pr) => ({ ...pr, studio: { ...(pr.studio ?? {}), [stepKey]: true } }));
  }, [checked, fb.passed, stepKey, p.studio, update]);

  // ----- editing helpers -----
  const setTable = (tid: string, fn: (t: Table) => Table) => setSchema((s) => ({ tables: s.tables.map((t) => (t.id === tid ? fn(t) : t)) }));
  const setCol = (tid: string, cid: string, patch: Partial<Column>) =>
    setTable(tid, (t) => ({ ...t, columns: t.columns.map((c) => (c.id === cid ? { ...c, ...patch } : c)) }));

  const addTable = () => {
    const n = schema.tables.length;
    const t = newTable(n, (n % 3) * 320, Math.floor(n / 3) * 240);
    setSchema((s) => ({ tables: [...s.tables, t] }));
    setActive(t.id);
    setTimeout(() => { (document.getElementById("table-name") as HTMLInputElement | null)?.focus(); fitView({ padding: 0.3, maxZoom: 1, duration: 250 }); }, 30);
  };
  const delTable = (tid: string) => {
    setSchema((s) => ({
      tables: s.tables.filter((t) => t.id !== tid).map((t) => ({ ...t, columns: t.columns.map((c) => (c.ref?.table === tid ? { ...c, ref: undefined } : c)) })),
    }));
    setActive(null);
  };
  const delCol = (tid: string, cid: string) => setSchema((s) => ({
    tables: s.tables.map((t) => ({
      ...t,
      columns: t.id === tid ? t.columns.filter((c) => c.id !== cid) : t.columns.map((c) => (c.ref?.column === cid ? { ...c, ref: undefined } : c)),
      indexes: t.id === tid ? t.indexes.map((i) => ({ ...i, columns: i.columns.filter((x) => x !== cid) })).filter((i) => i.columns.length) : t.indexes,
    })),
  }));

  const onNodesChange = useCallback((changes: NodeChange<TableNodeT>[]) => {
    for (const c of changes) {
      if (c.type === "position" && c.position) {
        const pos = c.position;
        setSchema((s) => ({ tables: s.tables.map((t) => (t.id === c.id ? { ...t, x: Math.round(pos.x), y: Math.round(pos.y) } : t)) }));
      }
      if (c.type === "select" && c.selected) setActive(c.id);
    }
  }, []);

  const loadSol = () => {
    setSchema(structuredClone(step.solution));
    setActive(step.solution.tables[0]?.id ?? null);
    setShowSol(false); setChecked(false);
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
  };
  const goStep = (i: number) => { setStepIdx(i); setChecked(false); setHintCount(0); };

  const t = schema.tables.find((x) => x.id === active);
  const refOptions = schema.tables.flatMap((rt) => rt.columns.filter((c) => c.pk || c.unique).map((c) => ({ value: `${rt.id}|${c.id}`, label: `${rt.name || "(unnamed)"}.${c.name}` })));
  const sql = useMemo(() => toSQL(schema), [schema]);

  return (
    <div className="studio-full stack">
      <div>
        <Link href="/studio" className="small">← Studio</Link>
        <h1 style={{ margin: "4px 0 0" }}>{puzzle.title}</h1>
        <p className="muted small" style={{ margin: 0 }}>Build tables on the left, and the diagram draws itself. 🔑 primary key · 🔗 foreign key · ◆ unique · <code>?</code> nullable. Arrows point from the “many” side to the “one” side.</p>
      </div>

      <div className="studio db">
        {/* editor */}
        <div className="editor-panel">
          <div className="row spread">
            <b>Tables</b>
            <button className="btn sm primary" onClick={addTable}>+ Table</button>
          </div>
          {schema.tables.length ? (
            <div className="tbl-tabs">
              {schema.tables.map((x) => <button key={x.id} className={x.id === active ? "active" : ""} onClick={() => setActive(x.id)}>{x.name || "(unnamed)"}</button>)}
            </div>
          ) : <p className="muted small" style={{ margin: 0 }}>No tables yet. Click <b>+ Table</b> to start.</p>}

          {t && (
            <div className="stack" style={{ gap: 10 }}>
              <div className="row">
                <input id="table-name" type="text" placeholder="table name (e.g. users)" value={t.name} style={{ flex: 1 }}
                  onChange={(e) => setTable(t.id, (x) => ({ ...x, name: e.target.value.toLowerCase().replace(/\s+/g, "_") }))} />
                <button className="x-btn" title="Delete table" onClick={() => delTable(t.id)}>🗑</button>
              </div>

              {t.columns.map((c) => (
                <div key={c.id} className="col-row">
                  <input type="text" placeholder="column name" value={c.name} onChange={(e) => setCol(t.id, c.id, { name: e.target.value.toLowerCase().replace(/\s+/g, "_") })} />
                  <select value={c.type} title={TYPE_TIPS[c.type] ?? ""} onChange={(e) => setCol(t.id, c.id, { type: e.target.value as ColType })}>
                    {COL_TYPES.map((ty) => <option key={ty} value={ty}>{ty}</option>)}
                  </select>
                  <div className="col-flags">
                    <label title="Primary key: uniquely identifies each row"><input type="checkbox" checked={c.pk} onChange={(e) => setCol(t.id, c.id, { pk: e.target.checked, nullable: e.target.checked ? false : c.nullable })} />PK</label>
                    <label title="No two rows may share this value (also creates an index)"><input type="checkbox" checked={c.unique} onChange={(e) => setCol(t.id, c.id, { unique: e.target.checked })} />unique</label>
                    <label title="Allow empty (NULL) values"><input type="checkbox" checked={c.nullable} disabled={c.pk} onChange={(e) => setCol(t.id, c.id, { nullable: e.target.checked })} />null</label>
                    <select aria-label="references" value={c.ref ? `${c.ref.table}|${c.ref.column}` : ""} style={{ maxWidth: 150 }}
                      title="Foreign key: this column points at a row in another table"
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v) return setCol(t.id, c.id, { ref: undefined });
                        const [table, column] = v.split("|");
                        setCol(t.id, c.id, { ref: { table, column }, type: c.type === "text" ? "bigint" : c.type });
                      }}>
                      <option value="">references…</option>
                      {refOptions.filter((o) => o.value.split("|")[1] !== c.id).map((o) => <option key={o.value} value={o.value}>→ {o.label}</option>)}
                    </select>
                    <button className="x-btn" style={{ marginLeft: "auto" }} title="Delete column" onClick={() => delCol(t.id, c.id)}>✕</button>
                  </div>
                </div>
              ))}
              <button className="btn sm" onClick={() => setTable(t.id, (x) => ({ ...x, columns: [...x.columns, { id: uid("c"), name: "", type: "text", pk: false, unique: false, nullable: false }] }))}>+ Column</button>

              <div>
                <div className="row spread"><b className="small">Indexes</b>
                  <button className="btn sm" onClick={() => setTable(t.id, (x) => ({ ...x, indexes: [...x.indexes, { id: uid("i"), columns: [], unique: false }] }))}>+ Index</button>
                </div>
                <p className="muted small" style={{ margin: "4px 0" }}>Order matters: an index on (a, b) helps <code>WHERE a = ?</code> but not <code>WHERE b = ?</code>.</p>
                {t.indexes.map((ix) => (
                  <div key={ix.id} className="col-row" style={{ marginTop: 6 }}>
                    <div className="row" style={{ gap: 4, gridColumn: "1 / -1" }}>
                      {ix.columns.length === 0 && <span className="muted small">pick columns →</span>}
                      {ix.columns.map((cid, k) => (
                        <span key={cid} className="chip">{k + 1}. {t.columns.find((c) => c.id === cid)?.name || "?"}
                          <button aria-label="remove" onClick={() => setTable(t.id, (x) => ({ ...x, indexes: x.indexes.map((i) => (i.id === ix.id ? { ...i, columns: i.columns.filter((y) => y !== cid) } : i)) }))}>×</button>
                        </span>
                      ))}
                    </div>
                    <div className="col-flags">
                      <select value="" onChange={(e) => { const v = e.target.value; if (v) setTable(t.id, (x) => ({ ...x, indexes: x.indexes.map((i) => (i.id === ix.id ? { ...i, columns: [...i.columns, v] } : i)) })); }}>
                        <option value="">+ add column</option>
                        {t.columns.filter((c) => !ix.columns.includes(c.id)).map((c) => <option key={c.id} value={c.id}>{c.name || "(unnamed)"}</option>)}
                      </select>
                      <label><input type="checkbox" checked={ix.unique} onChange={(e) => setTable(t.id, (x) => ({ ...x, indexes: x.indexes.map((i) => (i.id === ix.id ? { ...i, unique: e.target.checked } : i)) }))} />unique</label>
                      <button className="x-btn" style={{ marginLeft: "auto" }} onClick={() => setTable(t.id, (x) => ({ ...x, indexes: x.indexes.filter((i) => i.id !== ix.id) }))}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* diagram / sql */}
        <div className="canvas">
          <div className="canvas-toolbar">
            <div className="tabs" style={{ background: "var(--surface)", borderRadius: 10, padding: 2, border: "1px solid var(--border)" }}>
              <button className={view === "diagram" ? "active" : ""} onClick={() => setView("diagram")}>ER diagram</button>
              <button className={view === "sql" ? "active" : ""} onClick={() => setView("sql")}>SQL</button>
            </div>
            {stepIdx > 0 && <button className="btn sm ghost" onClick={() => { setSchema(structuredClone(steps[stepIdx - 1].solution)); setChecked(false); setTimeout(() => fitView({ padding: 0.2 }), 50); }}>↺ Start from step {stepIdx} answer</button>}
          </div>
          {view === "sql" ? (
            <div style={{ padding: "56px 12px 12px", height: "100%" }}>
              <pre className="sql">{sql || "-- add a table to see its SQL"}</pre>
            </div>
          ) : (
            <>
              {loaded && schema.tables.length === 0 && (
                <div className="canvas-empty"><div><div style={{ fontSize: "2rem" }}>🗄️</div><p><b>Click “+ Table”</b> on the left to start.</p><p className="small">Each table starts with an <code>id</code> primary key.</p></div></div>
              )}
              <ReactFlow
                nodes={flow.nodes}
                edges={flow.edges}
                onNodesChange={onNodesChange}
                nodeTypes={nodeTypes} connectionMode={ConnectionMode.Loose}
                nodesConnectable={false}
                colorMode="system"
                deleteKeyCode={null}
                fitView
                fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
                proOptions={{ hideAttribution: true }}
              >
                <Background gap={20} />
                <Controls showInteractive={false} />
              </ReactFlow>
            </>
          )}
        </div>

        <StepPanel
          steps={steps.map((s, i) => ({ title: s.title, cleared: !!p.studio?.[`db:${id}:${i}`] }))}
          stepIdx={stepIdx}
          onStep={goStep}
          title={step.title}
          story={step.story}
          goals={fb.goals}
          problems={fb.antis.map(({ anti, where }) => ({ id: anti.id, title: anti.title, why: anti.why, severity: anti.severity, where }))}
          checked={checked}
          passed={fb.passed}
          onCheck={() => setChecked(true)}
          explain={step.explain}
          hints={step.hints}
          hintCount={hintCount}
          onHint={() => setHintCount((h) => Math.min(h + 1, step.hints.length))}
          onSolution={() => setShowSol(true)}
          onNext={stepIdx < steps.length - 1 ? () => goStep(stepIdx + 1) : undefined}
        />
      </div>

      {showSol && (
        <div className="modal-bg" onClick={() => setShowSol(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Reference schema">
            <div className="row spread">
              <h2 style={{ margin: 0 }}>Reference schema · {step.title}</h2>
              <button className="x-btn" onClick={() => setShowSol(false)} aria-label="Close">✕</button>
            </div>
            <p className="small" style={{ margin: 0 }}><b>Why it works:</b> {step.explain}</p>
            <div className="grid g2">
              <div className="canvas" style={{ height: "48vh" }}>
                <ReactFlowProvider><SolutionDiagram schema={step.solution} /></ReactFlowProvider>
              </div>
              <pre className="sql" style={{ maxHeight: "48vh" }}>{toSQL(step.solution)}</pre>
            </div>
            <div className="row">
              <button className="btn primary" onClick={loadSol}>Load into my editor</button>
              <button className="btn" onClick={() => setShowSol(false)}>Close and try myself</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SolutionDiagram({ schema }: { schema: Schema }) {
  const f = useMemo(() => flowFor(schema, null, new Set(), new Set()), [schema]);
  return (
    <ReactFlow nodes={f.nodes} edges={f.edges} nodeTypes={nodeTypes} connectionMode={ConnectionMode.Loose} colorMode="system" fitView fitViewOptions={{ padding: 0.15 }}
      nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} proOptions={{ hideAttribution: true }}>
      <Background gap={20} />
    </ReactFlow>
  );
}

export default function DbStudio({ id }: { id: string }) {
  return (
    <ReactFlowProvider>
      <Studio id={id} />
    </ReactFlowProvider>
  );
}
