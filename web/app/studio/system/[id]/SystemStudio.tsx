"use client";

import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background, Controls, MarkerType, MiniMap, ReactFlow, ReactFlowProvider, ConnectionMode,
  useEdgesState, useNodesState, useReactFlow, type Connection, type Edge,
} from "@xyflow/react";
import ArchNode, { type ArchNodeT } from "@/components/studio/ArchNode";
import StepPanel from "@/components/studio/StepPanel";
import { COMPONENTS, GROUPS, INFO, type CompType } from "@/lib/studio/components";
import { Graph, evaluate, type Feedback } from "@/lib/studio/graph";
import { puzzleById, type Solution } from "@/lib/studio/puzzles";
import { loadDrawing, useAutosave } from "@/lib/studio/persist";
import { useProgress } from "@/lib/progress";

const nodeTypes = { arch: ArchNode };
const ARROW = { type: MarkerType.ArrowClosed, width: 18, height: 18 };
const edgeDefaults = { markerEnd: ARROW, style: { strokeWidth: 2 } };

type Saved = { step: number; nodes: { id: string; type: CompType; label: string; x: number; y: number }[]; edges: { source: string; target: string; sh?: string | null; th?: string | null }[] };

let counter = 0;
const newId = () => `n${Date.now().toString(36)}${(counter++).toString(36)}`;

/** Pick the sides an arrow should leave/enter from, based on where the two boxes are. */
function sides(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (Math.abs(dx) >= Math.abs(dy) * 1.2) return dx >= 0 ? { sourceHandle: "right", targetHandle: "left" } : { sourceHandle: "left", targetHandle: "right" };
  return dy >= 0 ? { sourceHandle: "bottom", targetHandle: "top" } : { sourceHandle: "top", targetHandle: "bottom" };
}

function toFlow(sol: Solution): { nodes: ArchNodeT[]; edges: Edge[] } {
  const at = Object.fromEntries(sol.nodes.map((n) => [n.id, n]));
  return {
    nodes: sol.nodes.map((n) => ({ id: n.id, type: "arch", position: { x: n.x, y: n.y }, data: { type: n.type, label: n.label ?? INFO[n.type].name } })),
    edges: sol.edges.map(([s, t], i) => ({ id: `s${i}-${s}-${t}`, source: s, target: t, ...sides(at[s], at[t]), ...edgeDefaults })),
  };
}

function Studio({ id }: { id: string }) {
  const sandbox = id === "sandbox";
  const puzzle = puzzleById(id);
  const steps = puzzle?.steps ?? [];
  const { p, update } = useProgress();
  const [nodes, setNodes, onNodesChange] = useNodesState<ArchNodeT>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [checked, setChecked] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [showSol, setShowSol] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const step = steps[stepIdx];
  const key = `sys-${id}`;

  // ----- load / save -----
  useEffect(() => {
    loadDrawing<Saved>(key).then((s) => {
      if (s) {
        setNodes(s.nodes.map((n) => ({ id: n.id, type: "arch", position: { x: n.x, y: n.y }, data: { type: n.type, label: n.label } })));
        const at = Object.fromEntries(s.nodes.map((n) => [n.id, n]));
        setEdges(s.edges.filter((e) => at[e.source] && at[e.target]).map((e, i) => ({
          id: `e${i}-${e.source}-${e.target}`, source: e.source, target: e.target,
          ...(e.sh && e.th ? { sourceHandle: e.sh, targetHandle: e.th } : sides(at[e.source], at[e.target])),
          ...edgeDefaults,
        })));
        setStepIdx(Math.min(s.step ?? 0, Math.max(0, steps.length - 1)));
        setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
      }
      setLoaded(true);
    });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const saved = useMemo<Saved>(() => ({
    step: stepIdx,
    nodes: nodes.map((n) => ({ id: n.id, type: n.data.type, label: n.data.label, x: Math.round(n.position.x), y: Math.round(n.position.y) })),
    edges: edges.map((e) => ({ source: e.source, target: e.target, sh: e.sourceHandle, th: e.targetHandle })),
  }), [nodes, edges, stepIdx]);
  useAutosave(key, saved, loaded);

  // ----- evaluate live -----
  const graph = useMemo(() => new Graph(nodes.map((n) => ({ id: n.id, type: n.data.type, label: n.data.label })), edges.map((e) => ({ source: e.source, target: e.target }))), [nodes, edges]);
  const fb: Feedback = useMemo(() => evaluate(graph, step?.goals ?? [], step?.antis ?? []), [graph, step]);
  const badIds = useMemo(() => new Set(fb.antis.filter((a) => a.anti.severity === "error").flatMap((a) => a.nodes.map((n) => n.id))), [fb]);
  const warnIds = useMemo(() => new Set(fb.antis.filter((a) => a.anti.severity === "warn" && a.anti.id !== "orphan").flatMap((a) => a.nodes.map((n) => n.id))), [fb]);
  const shown = useMemo(() => nodes.map((n) => ({ ...n, data: { ...n.data, bad: badIds.has(n.id), warn: warnIds.has(n.id) } })), [nodes, badIds, warnIds]);

  // mark the step cleared as soon as a check passes
  const stepKey = `sys:${id}:${stepIdx}`;
  useEffect(() => {
    if (checked && fb.passed && step && !p.studio?.[stepKey]) update((pr) => ({ ...pr, studio: { ...(pr.studio ?? {}), [stepKey]: true } }));
  }, [checked, fb.passed, stepKey, step, p.studio, update]);

  // ----- editing -----
  const addNode = useCallback((type: CompType, at?: { x: number; y: number }) => {
    let pos = at;
    if (!pos) {
      const r = wrap.current?.getBoundingClientRect();
      pos = screenToFlowPosition({ x: (r?.left ?? 0) + (r?.width ?? 600) / 2 + (Math.random() * 120 - 60), y: (r?.top ?? 0) + (r?.height ?? 400) / 2 + (Math.random() * 120 - 60) });
    }
    setNodes((ns) => {
      const same = ns.filter((n) => n.data.type === type).length;
      const label = same ? `${INFO[type].name} ${same + 1}` : INFO[type].name;
      return [...ns.map((n) => ({ ...n, selected: false })), { id: newId(), type: "arch", position: pos!, selected: true, data: { type, label } }];
    });
  }, [screenToFlowPosition, setNodes]);

  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target || c.source === c.target) return;
    setEdges((es) => es.some((e) => e.source === c.source && e.target === c.target)
      ? es
      : [...es, { id: `e${Date.now().toString(36)}`, source: c.source!, target: c.target!, sourceHandle: c.sourceHandle, targetHandle: c.targetHandle, ...edgeDefaults }]);
  }, [setEdges]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("application/sdq") as CompType;
    if (type && INFO[type]) addNode(type, screenToFlowPosition({ x: e.clientX - 70, y: e.clientY - 20 }));
  }, [addNode, screenToFlowPosition]);

  const selNode = nodes.find((n) => n.selected);
  const selEdges = edges.filter((e) => e.selected);
  const flip = () => setEdges((es) => es.map((e) => (e.selected ? { ...e, source: e.target, target: e.source, sourceHandle: e.targetHandle, targetHandle: e.sourceHandle } : e)));
  const delSelected = () => {
    const ids = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
    setNodes((ns) => ns.filter((n) => !n.selected));
    setEdges((es) => es.filter((e) => !e.selected && !ids.has(e.source) && !ids.has(e.target)));
  };
  const load = (sol: Solution) => {
    const f = toFlow(sol);
    setNodes(f.nodes); setEdges(f.edges); setShowSol(false); setChecked(false);
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
  };
  const goStep = (i: number) => { setStepIdx(i); setChecked(false); setHintCount(0); };

  const learnType = selNode?.data.type;
  const learn = learnType ? INFO[learnType] : null;

  return (
    <div className="studio-full stack">
      <div className="row spread">
        <div>
          <Link href="/studio" className="small">← Studio</Link>
          <h1 style={{ margin: "4px 0 0" }}>{sandbox ? "Free canvas" : puzzle!.title}</h1>
          <p className="muted small" style={{ margin: 0 }}>
            Drag components in (or click them), then drag from a dot on one box to another to draw an arrow. <b>Arrows mean “sends requests to”.</b> Select something and press Backspace to delete it.
          </p>
        </div>
      </div>

      <div className="studio">
        {/* palette */}
        <div className="palette" aria-label="Components">
          {GROUPS.map((g) => (
            <div key={g} style={{ display: "contents" }}>
              <h4>{g}</h4>
              {COMPONENTS.filter((c) => c.group === g).map((c) => (
                <button key={c.type} className="pal-item" style={{ "--c": c.color } as React.CSSProperties} draggable
                  onDragStart={(e) => { e.dataTransfer.setData("application/sdq", c.type); e.dataTransfer.effectAllowed = "move"; }}
                  onClick={() => addNode(c.type)} title={`${c.what}\n\nUse when: ${c.when}`}>
                  <span>{c.icon}</span>{c.name}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* canvas */}
        <div className="canvas" ref={wrap} onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }} onDrop={onDrop}>
          <div className="canvas-toolbar">
            {selEdges.length > 0 && <button className="btn sm" onClick={flip}>⇄ Flip arrow</button>}
            {(selEdges.length > 0 || selNode) && <button className="btn sm" onClick={delSelected}>🗑 Delete</button>}
            {nodes.length > 0 && <button className="btn sm ghost" onClick={() => { if (confirm("Clear the whole canvas?")) { setNodes([]); setEdges([]); setChecked(false); } }}>Clear</button>}
            {!sandbox && stepIdx > 0 && <button className="btn sm ghost" onClick={() => load(steps[stepIdx - 1].solution)} title="Replace the canvas with the reference design from the previous step">↺ Start from step {stepIdx} answer</button>}
          </div>
          {loaded && nodes.length === 0 && (
            <div className="canvas-empty">
              <div>
                <div style={{ fontSize: "2rem" }}>🧩</div>
                <p><b>Start with a 📱 Client</b>: drag it in from the left, or click it.</p>
                <p className="small">Then add the next box and drag from the little dot on one box to the other.</p>
              </div>
            </div>
          )}
          <ReactFlow
            nodes={shown}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            defaultEdgeOptions={edgeDefaults}
            colorMode="system"
            deleteKeyCode={["Backspace", "Delete"]}
            fitView
            fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable style={{ width: 140, height: 90 }} />
          </ReactFlow>
        </div>

        {/* coaching */}
        <div className="stack">
          {learn && (
            <div className="card tight learn" style={{ "--c": learn.color } as React.CSSProperties}>
              <div className="row spread">
                <b>{learn.icon} {learn.name}</b>
                <input type="text" aria-label="Label" value={selNode!.data.label} style={{ width: 150, font: "inherit", fontSize: "0.85rem", padding: "3px 6px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                  onChange={(e) => setNodes((ns) => ns.map((n) => (n.id === selNode!.id ? { ...n, data: { ...n.data, label: e.target.value } } : n)))} />
              </div>
              <dl style={{ margin: 0 }}>
                <dt>What it is</dt><dd>{learn.what}</dd>
                <dt>Use it when</dt><dd>{learn.when}</dd>
                <dt>Not like this</dt><dd>{learn.avoid}</dd>
                {learn.number && (<><dt>Number to remember</dt><dd>{learn.number}</dd></>)}
              </dl>
            </div>
          )}

          {sandbox ? (
            <aside className="studio-panel">
              <h2 style={{ margin: 0 }}>Free canvas</h2>
              <p className="small muted" style={{ margin: 0 }}>Draw any system. There are no goals here, but the coach still flags mistakes that are wrong in every design. Click any box to learn what it does.</p>
              {fb.antis.length === 0 ? <div className="win small">No obvious mistakes so far. ✨</div> : fb.antis.map(({ anti, nodes: ns }) => (
                <div key={anti.id} className={`nope ${anti.severity}`}>
                  <div className="nope-title">{anti.severity === "error" ? "✋ Not like this:" : "⚠️ Careful:"} {anti.title}</div>
                  {ns.length > 0 && <div className="nope-where">{ns.map((n) => n.label).join(" · ")}</div>}
                  <div className="small">{anti.why}</div>
                </div>
              ))}
            </aside>
          ) : (
            <StepPanel
              steps={steps.map((s, i) => ({ title: s.title, cleared: !!p.studio?.[`sys:${id}:${i}`] }))}
              stepIdx={stepIdx}
              onStep={goStep}
              title={step.title}
              story={step.story}
              goals={fb.goals}
              problems={fb.antis.map(({ anti, nodes: ns }) => ({ id: anti.id, title: anti.title, why: anti.why, severity: anti.severity, where: ns.map((n) => n.label) }))}
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
          )}
        </div>
      </div>

      {showSol && step && (
        <div className="modal-bg" onClick={() => setShowSol(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Reference solution">
            <div className="row spread">
              <h2 style={{ margin: 0 }}>Reference design · {step.title}</h2>
              <button className="x-btn" onClick={() => setShowSol(false)} aria-label="Close">✕</button>
            </div>
            <p className="small" style={{ margin: 0 }}><b>Why it works:</b> {step.explain}</p>
            <div className="canvas">
              <ReactFlowProvider>
                <SolutionCanvas sol={step.solution} />
              </ReactFlowProvider>
            </div>
            <div className="row">
              <button className="btn primary" onClick={() => load(step.solution)}>Load onto my canvas</button>
              <button className="btn" onClick={() => setShowSol(false)}>Close and try myself</button>
              <span className="muted small">Tip: try it yourself first. You learn more from the coach's feedback than from copying.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SolutionCanvas({ sol }: { sol: Solution }) {
  const f = useMemo(() => toFlow(sol), [sol]);
  return (
    <ReactFlow nodes={f.nodes} edges={f.edges} nodeTypes={nodeTypes} connectionMode={ConnectionMode.Loose} colorMode="system" fitView fitViewOptions={{ padding: 0.2 }}
      nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} proOptions={{ hideAttribution: true }}>
      <Background gap={20} />
    </ReactFlow>
  );
}

export default function SystemStudio({ id }: { id: string }) {
  return (
    <ReactFlowProvider>
      <Studio id={id} />
    </ReactFlowProvider>
  );
}
