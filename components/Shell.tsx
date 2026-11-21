"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { cx, compact } from "@/lib/util";

const NAV = [
  { href: "/", label: "Overview", n: "00" },
  { href: "/participants/", label: "Participants & roles", n: "01" },
  { href: "/primary/", label: "Primary market", n: "02" },
  { href: "/registrar/", label: "Registrar (technical)", n: "03" },
  { href: "/secondary/", label: "Seturion TSS — secondary", n: "04" },
  { href: "/eligibility/", label: "OeKB & ECB eligibility", n: "05" },
  { href: "/lifecycle/", label: "Lifecycle & servicing", n: "06" },
  { href: "/architecture/", label: "Architecture & contracts", n: "07" },
  { href: "/legal/", label: "Legal basis", n: "08" },
];

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { s, reset } = useStore();
  const [open, setOpen] = useState(false);
  const issued = Object.values(s.bonds).filter((b) => b.status === "settled" || b.status === "redeemed").length;
  const usd = Object.values(s.bonds).filter((b) => b.status !== "draft" && b.ccy === "USD").length * 100e6;
  const eur = Object.values(s.bonds).filter((b) => b.status !== "draft" && b.ccy === "EUR").length * 100e6;

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((n) => {
        const active = n.href === "/" ? path === "/" : path?.startsWith(n.href.replace(/\/$/, ""));
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            className={cx(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors",
              active ? "bg-[var(--accent-soft)] text-fg" : "text-muted hover:bg-[var(--bg-card-hover)] hover:text-fg"
            )}
          >
            <span className={cx("mono text-[10px]", active ? "text-accent" : "text-dim")}>{n.n}</span>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );

  const status = (
    <div className="card mt-4 p-3 text-[12px]">
      <div className="eyebrow mb-2">Simulation state</div>
      <div className="flex justify-between"><span className="muted">Tranches issued</span><span className="mono">{issued}/{Object.keys(s.bonds).length}</span></div>
      <div className="flex justify-between"><span className="muted">USD priced</span><span className="mono">{compact(usd)}</span></div>
      <div className="flex justify-between"><span className="muted">EUR priced</span><span className="mono">{compact(eur, "EUR")}</span></div>
      <div className="flex justify-between"><span className="muted">RL1 block</span><span className="mono">#{s.block.toLocaleString()}</span></div>
      <div className="flex justify-between"><span className="muted">Seturion trades</span><span className="mono">{s.trades.length}</span></div>
      <button className="btn btn-sm mt-3 w-full" onClick={() => { if (confirm("Reset the whole simulation?")) reset(); }}>Reset simulation</button>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:block w-[260px] flex-none border-r border-line bg-raised sticky top-0 h-screen overflow-y-auto p-4">
        <Brand />
        <div className="mt-6">{nav}</div>
        {status}
        <p className="dim mt-4 text-[10.5px] leading-relaxed">
          Hypothetical scenario for demonstration. Not affiliated with or endorsed by the institutions named. Not legal or investment advice.
        </p>
      </aside>
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-line bg-raised px-4 py-3">
        <Brand />
        <button className="btn btn-sm" onClick={() => setOpen(!open)} aria-label="Menu">{open ? "Close" : "Menu"}</button>
      </header>
      {open && (
        <div className="lg:hidden fixed inset-0 top-[57px] z-20 bg-raised p-4 overflow-y-auto">
          {nav}
          {status}
        </div>
      )}
      <main className="flex-1 min-w-0 px-4 py-6 sm:px-8 lg:px-10 lg:py-8 max-w-[1400px]">{children}</main>
    </div>
  );
}

function Brand() {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <Link href="/" className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${base}/rl1-logo.svg`} alt="" width={30} height={30} />
      <div className="leading-tight">
        <div className="text-[15px] font-bold tracking-tight">RL1 <span className="text-accent">ORBIT</span></div>
        <div className="dim text-[10.5px]">Multi-issuer DLT bond programme</div>
      </div>
    </Link>
  );
}
