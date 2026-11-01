"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { Table } from "@/lib/studio/schema";

export type TableData = { table: Table; bad?: boolean; warn?: boolean; active?: boolean };
export type TableNodeT = Node<TableData, "table">;

export default function TableNode({ data }: NodeProps<TableNodeT>) {
  const t = data.table;
  return (
    <div className={`tbl ${data.active ? "sel" : ""} ${data.bad ? "bad" : data.warn ? "warnn" : ""}`}>
      <Handle id="l" type="source" position={Position.Left} />
      <Handle id="r" type="source" position={Position.Right} />
      <div className="tbl-head">{t.name || "(unnamed)"}</div>
      {t.columns.map((c) => (
        <div key={c.id} className="tbl-row">
          <span className="tbl-key">{c.pk ? "🔑" : c.ref ? "🔗" : c.unique ? "◆" : ""}</span>
          <span className="tbl-name">{c.name || "…"}{c.nullable ? "?" : ""}</span>
          <span className="tbl-type">{c.type}</span>
        </div>
      ))}
      {t.indexes.length > 0 && (
        <div className="tbl-idx">
          {t.indexes.map((i) => (
            <div key={i.id}>{i.unique ? "unique " : ""}idx ({i.columns.map((id) => t.columns.find((c) => c.id === id)?.name ?? "?").join(", ")})</div>
          ))}
        </div>
      )}
    </div>
  );
}
