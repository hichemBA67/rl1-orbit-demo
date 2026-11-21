"use client";
import { useState, type ReactNode } from "react";
import { legalById } from "@/lib/data/legal";
import { ISSUERS, COUNTRY, issuerById } from "@/lib/data/scenario";
import { useStore, type Ev } from "@/lib/store";
import { cx, fmtDate, short } from "@/lib/util";
import Link from "next/link";

export function PageHead({ eyebrow, title, children, actions }: { eyebrow: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <div className="eyebrow text-accent">{eyebrow}</div>
        <h1 className="h1 mt-2">{title}</h1>
        {children && <div className="muted mt-3 text-[14.5px] leading-relaxed">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, right, children, className, pad = true }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cx("card", className)}>
      {(title || right) && (
        <div className="card-h">
          <div className="h3">{title}</div>
          {right}
        </div>
      )}
      <div className={pad ? "card-b" : ""}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "ok" | "bad" | "warn" | "accent" }) {
  const c = tone === "ok" ? "text-ok" : tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : tone === "accent" ? "text-accent" : "";
  return (
    <div className="card p-4">
      <div className="eyebrow">{label}</div>
      <div className={cx("mt-1.5 text-[22px] font-semibold num", c)}>{value}</div>
      {sub && <div className="dim mt-0.5 text-[12px]">{sub}</div>}
    </div>
  );
}

export function LegalRefs({ ids, className }: { ids: string[]; className?: string }) {
  return (
    <div className={cx("flex flex-wrap gap-1.5", className)}>
      {ids.map((id) => {
        const l = legalById(id);
        if (!l) return null;
        return (
          <Link key={id} href={`/legal/#${id}`} title={l.citation} className="chip chip-violet hover:brightness-125">
            § {l.short}
          </Link>
        );
      })}
    </div>
  );
}

export function Flag({ cc }: { cc: keyof typeof COUNTRY }) {
  return <span title={COUNTRY[cc].name}>{COUNTRY[cc].flag}</span>;
}

export function BondPicker({ value, onChange, filter, label = "Tranche" }: { value: string; onChange: (id: string) => void; filter?: (id: string) => boolean; label?: string }) {
  const { s } = useStore();
  return (
    <div className="min-w-[260px]">
      <label className="lbl">{label}</label>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {ISSUERS.filter((i) => !filter || filter(i.id)).map((i) => (
          <option key={i.id} value={i.id}>
            {COUNTRY[i.country].flag} {i.brand} · {s.bonds[i.id].ccy} · {s.bonds[i.id].status}
          </option>
        ))}
      </select>
    </div>
  );
}

const EV_TONE: Record<string, string> = {
  DvPSettled: "chip-ok", Issued: "chip-accent", CouponPaid: "chip-ok", Transfer: "chip-ok", ForcedTransfer: "chip-warn",
  TokensFrozen: "chip-warn", TransferRejected: "chip-bad", MatchRejected: "chip-bad", ForcedTransferRejected: "chip-bad",
  ECMSInstruction: "chip-violet", T2SRealignment: "chip-violet", CollateralValued: "chip-violet", PontesLock: "chip-violet",
};

export function EventLog({ bondId, limit = 40, types, title = "RL1 event log" }: { bondId?: string; limit?: number; types?: string[]; title?: string }) {
  const { s } = useStore();
  const [open, setOpen] = useState<number | null>(null);
  const evs = s.events.filter((e) => (!bondId || e.bondId === bondId) && (!types || types.includes(e.type))).slice(0, limit);
  return (
    <Card title={title} right={<span className="dim text-[11px] mono">{evs.length} shown · head #{s.block.toLocaleString()}</span>} pad={false}>
      {evs.length === 0 ? (
        <div className="dim p-5 text-[13px]">No events yet. Actions in this demo emit RL1 transactions here.</div>
      ) : (
        <div className="max-h-[460px] overflow-y-auto">
          {evs.map((e) => (
            <EvRow key={e.n} e={e} open={open === e.n} onClick={() => setOpen(open === e.n ? null : e.n)} />
          ))}
        </div>
      )}
    </Card>
  );
}

function EvRow({ e, open, onClick }: { e: Ev; open: boolean; onClick: () => void }) {
  const tone = e.ok ? EV_TONE[e.type] ?? "" : "chip-bad";
  return (
    <div className="border-b border-line px-4 py-2.5 text-[12.5px] cursor-pointer hover:bg-[var(--bg-card-hover)]" onClick={onClick}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mono dim w-[68px]">#{e.block.toLocaleString()}</span>
        <span className={cx("chip", tone)}>{e.type}</span>
        {e.bondId && <span className="dim">{issuerById(e.bondId).brand}</span>}
        <span className="dim ml-auto mono text-[11px]">{e.ts.slice(0, 10)} {e.ts.slice(11, 16)}</span>
      </div>
      <div className="muted mt-1 pl-[76px]">{e.detail}</div>
      {open && (
        <div className="mono dim mt-2 pl-[76px] text-[11px] break-all">
          tx {e.tx}<br />from {e.actor} · gas 0 (permissioned, fee-less) · status {e.ok ? "0x1 success" : "0x0 reverted"}
        </div>
      )}
    </div>
  );
}

export function Hash({ v, n = 6 }: { v: string; n?: number }) {
  return <span className="mono" title={v}>{short(v, n)}</span>;
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="tabs mb-5">
      {tabs.map((t) => (
        <button key={t.id} className="tab" data-active={value === t.id} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Callout({ tone = "accent", title, children }: { tone?: "accent" | "warn" | "ok" | "bad"; title?: string; children: ReactNode }) {
  const map = { accent: ["var(--accent-soft)", "rgba(59,111,255,0.35)"], warn: ["var(--warn-soft)", "rgba(245,182,73,0.35)"], ok: ["var(--ok-soft)", "rgba(60,207,145,0.35)"], bad: ["var(--bad-soft)", "rgba(255,107,107,0.35)"] }[tone];
  return (
    <div className="rounded-xl p-4 text-[13.5px] leading-relaxed" style={{ background: map[0], border: `1px solid ${map[1]}` }}>
      {title && <div className="mb-1 font-semibold">{title}</div>}
      <div className="muted">{children}</div>
    </div>
  );
}

export const D = fmtDate;
