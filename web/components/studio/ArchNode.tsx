"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { INFO, type CompType } from "@/lib/studio/components";

export type ArchData = { type: CompType; label: string; bad?: boolean; warn?: boolean };
export type ArchNodeT = Node<ArchData, "arch">;

const SIDES = [Position.Top, Position.Right, Position.Bottom, Position.Left];

export default function ArchNode({ data, selected }: NodeProps<ArchNodeT>) {
  const info = INFO[data.type];
  return (
    <div className={`arch ${selected ? "sel" : ""} ${data.bad ? "bad" : data.warn ? "warnn" : ""}`} style={{ "--c": info.color } as React.CSSProperties}>
      {SIDES.map((p) => <Handle key={p} id={p} type="source" position={p} />)}
      <span className="arch-ico">{info.icon}</span>
      <div>
        <div className="arch-label">{data.label}</div>
        {data.label !== info.name && <div className="arch-type">{info.name}</div>}
      </div>
    </div>
  );
}
