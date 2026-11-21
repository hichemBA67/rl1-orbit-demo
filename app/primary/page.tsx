"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { BondPicker, Callout, Card, EventLog, LegalRefs, PageHead, Stat, Tabs } from "@/components/ui";
import { CFI, COUNTRY, ISSUERS, PROGRAMME, cfiExplain, investorById, isinOf, issuerById, termsFor } from "@/lib/data/scenario";
import { PRIMARY_STEPS, allocate, generateBook, ipt } from "@/lib/data/primary";
import { eligibleForPrimary, priceBondPure, useStore } from "@/lib/store";
import { couponSchedule, modDuration } from "@/lib/finance";
import { bp, compact, cx, fmtDate, money } from "@/lib/util";

type T = "flow" | "book" | "settle" | "all";

export default function Primary() {
  const { s, price, settle, setCcy, quickIssueAll } = useStore();
  const [id, setId] = useState("caixa");
  const [tab, setTab] = useState<T>("flow");
  const issuer = issuerById(id);
  const b = s.bonds[id];

  return (
    <>
      <PageHead
        eyebrow="02 · Primary market"
        title="From mandate to settled bond"
        actions={<button className="btn" onClick={quickIssueAll}>Price & settle all remaining at fair + 5bp</button>}
      >
        Pick a tranche to see its jurisdiction-specific workflow, run the book, set the final spread, and settle it on RL1 with atomic DvP.
        Every step lists the actors, the legal basis, the on-chain transactions and the messages involved.
      </PageHead>

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <BondPicker value={id} onChange={setId} />
        <div>
          <label className="lbl">Currency</label>
          <div className="flex gap-1">
            {(["USD", "EUR"] as const).map((c) => (
              <button key={c} className={cx("btn btn-sm", b.ccy === c && "btn-primary")} disabled={b.status !== "draft"} onClick={() => setCcy(id, c)}>{c}</button>
            ))}
          </div>
        </div>
        <span className={cx("chip", b.status === "settled" ? "chip-ok" : b.status === "priced" ? "chip-accent" : "chip-warn")}>{b.status}</span>
      </div>

      <TermSheet id={id} />

      <div className="mt-6">
        <Tabs<T> value={tab} onChange={setTab} tabs={[{ id: "flow", label: "Workflow T-30 → T+2" }, { id: "book", label: "Book-building & pricing" }, { id: "settle", label: "DvP settlement" }, { id: "all", label: `All ${ISSUERS.length} tranches` }]} />
        {tab === "flow" && <Workflow model={issuer.registerModel} />}
        {tab === "book" && <Book id={id} onPriced={() => setTab("settle")} price={price} />}
        {tab === "settle" && <Settle id={id} settle={settle} />}
        {tab === "all" && <AllTranches onPick={(x) => { setId(x); setTab("book"); }} />}
      </div>
    </>
  );
}

function TermSheet({ id }: { id: string }) {
  const { s } = useStore();
  const i = issuerById(id);
  const b = s.bonds[id];
  const ccy = b.ccy;
  const isin = isinOf(i);
  const fisn = `${i.brand.toUpperCase().replace(/[^A-Z ]/g, "").slice(0, 15).trim()}/${b.couponPct ? b.couponPct.toFixed(3) : "x.xxx"} BD ${PROGRAMME.maturityDate.replaceAll("-", "")}`;
  const rows: [string, React.ReactNode][] = [
    ["Issuer", <>{COUNTRY[i.country].flag} {i.issuer}</>],
    ["Status / ranking", i.seniority],
    ["Nominal", money(PROGRAMME.size, ccy)],
    ["Denomination", `${money(PROGRAMME.denomination[ccy], ccy)} + integral multiples of ${money(PROGRAMME.increment[ccy], ccy)}`],
    ["Coupon", b.couponPct ? `${b.couponPct.toFixed(3)}% fixed` : "set at pricing (yield rounded down to ⅛%)"],
    ["Payment / day count", ccy === "USD" ? "Semi-annual, 30/360, Following Unadjusted" : "Annual, ACT/ACT (ICMA), Following Unadjusted"],
    ["Pricing · Issue · Maturity", `${fmtDate(PROGRAMME.pricingDate)} · ${fmtDate(PROGRAMME.issueDate)} (T+2) · ${fmtDate(PROGRAMME.maturityDate)}`],
    ["Benchmark", PROGRAMME.benchmarks[ccy].name + ` @ ${PROGRAMME.benchmarks[ccy].yield.toFixed(2)}%`],
    ["Re-offer", b.price ? `${b.price.toFixed(3)} / ${b.yieldPct!.toFixed(3)}% (${bp(b.spreadBp!)})` : "—"],
    ["Governing law", i.law],
    ["Form & register", i.registrarName],
    ["Venue", i.registerModel === "AT_CSD_DLT" ? "Wiener Börse (Official Market) + Seturion DLT TSS" : "Seturion DLT TSS"],
    ["Selling restrictions", ccy === "USD" ? "Reg S Cat. 2 · EEA/UK QIs only · no PRIIPs KID" : "EEA/UK QIs · Reg S · no PRIIPs KID"],
    ["Smart contract", <span key="c" className="mono">{b.contract}</span>],
  ];
  return (
    <Card title="Indicative term sheet" right={<span className="dim text-[12px]">Illustrative identifiers with valid ISO check digits</span>}>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 text-[13px]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex flex-col"><span className="dim text-[11px] uppercase tracking-wider">{k}</span><span>{v}</span></div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border border-line p-3">
            <div className="eyebrow">ISIN · ISO 6166</div>
            <div className="mono mt-1 text-[18px]">
              <span className="text-accent">{isin.slice(0, 2)}</span>{isin.slice(2, 11)}<span className="text-ok">{isin.slice(11)}</span>
            </div>
            <div className="dim mt-1 text-[11.5px]">Country prefix · 9-char NSIN · Luhn check digit (allocated by {i.country === "AT" ? "OeKB" : i.country === "ES" ? "CNMV" : i.country === "FR" ? "Euroclear France" : i.country === "DE" ? "WM Datenservice" : i.country === "NL" ? "Euroclear NL" : "LSE"})</div>
          </div>
          <div className="rounded-lg border border-line p-3">
            <div className="eyebrow">CFI · ISO 10962</div>
            <div className="mono mt-1 text-[18px]">{CFI}</div>
            <div className="mt-1 grid grid-cols-2 gap-x-2 text-[11.5px]">{cfiExplain.map(([c, t], k) => <div key={k}><span className="mono text-accent">{c}</span> <span className="dim">{t}</span></div>)}</div>
          </div>
          <div className="rounded-lg border border-line p-3">
            <div className="eyebrow">FISN · ISO 18774</div>
            <div className="mono mt-1 text-[13px]">{fisn}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Workflow({ model }: { model: string }) {
  const [open, setOpen] = useState<string | null>("ids");
  return (
    <div className="space-y-2">
      {PRIMARY_STEPS.map((st) => {
        const v = st.variant?.[model as keyof typeof st.variant];
        const isOpen = open === st.id;
        return (
          <div key={st.id} className="card">
            <button className="flex w-full items-center gap-4 px-4 py-3 text-left" onClick={() => setOpen(isOpen ? null : st.id)}>
              <span className="mono w-12 text-accent text-[13px]">{st.t}</span>
              <span className="dim mono hidden w-24 text-[12px] sm:block">{fmtDate(st.date)}</span>
              <span className="flex-1 font-medium">{st.title}</span>
              {v && <span className="chip chip-warn">jurisdiction-specific</span>}
              <span className="dim">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <div className="border-t border-line px-4 py-4">
                <div className="mb-3 flex flex-wrap gap-1.5">{st.actors.map((a) => <span key={a} className="chip">{a}</span>)}</div>
                <ul className="list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed">{st.what.map((w, k) => <li key={k}>{w}</li>)}</ul>
                {v && <div className="mt-3"><Callout tone="warn" title="For this tranche's jurisdiction">{v}</Callout></div>}
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {st.onchain && <div><div className="eyebrow mb-1">On-chain (RL1)</div>{st.onchain.map((o) => <div key={o} className="mono text-[12px] text-ok">{o}</div>)}</div>}
                  {st.messages && <div><div className="eyebrow mb-1">Messages</div>{st.messages.map((o) => <div key={o} className="muted text-[12.5px]">{o}</div>)}</div>}
                  {st.artefacts && <div><div className="eyebrow mb-1">Artefacts</div>{st.artefacts.map((o) => <div key={o} className="muted text-[12.5px]">{o}</div>)}</div>}
                </div>
                <LegalRefs ids={st.legal} className="mt-4" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Book({ id, onPriced, price }: { id: string; onPriced: () => void; price: (id: string, s: number) => void }) {
  const { s } = useStore();
  const issuer = issuerById(id);
  const b = s.bonds[id];
  const orders = useMemo(() => generateBook(issuer, b.ccy), [issuer, b.ccy]);
  const [spread, setSpread] = useState(issuer.fairSpread + 5);
  const elig = (inv: string) => eligibleForPrimary(inv, b.ccy).ok;
  const { allocations, demand } = allocate(orders, spread, PROGRAMME.size, b.ccy, elig);
  const { y, c, price: px } = priceBondPure(s, issuer, spread);
  const freq = b.ccy === "USD" ? 2 : 1;
  const dur = modDuration(c, y, freq, 3);
  const lo = issuer.fairSpread - 15, hi = ipt(issuer) + 5;
  const pts = Array.from({ length: hi - lo + 1 }, (_, k) => lo + k).map((sp) => ({ sp, d: orders.filter((o) => o.limitBp <= sp && elig(o.investorId)).reduce((a, o) => a + o.amount, 0) }));
  const maxD = Math.max(...pts.map((p) => p.d), PROGRAMME.size * 1.2);
  const locked = b.status !== "draft";
  const nic = spread - issuer.fairSpread;
  const cover = demand / PROGRAMME.size;

  return (
    <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
      <div className="space-y-5">
        <Card title="Price discovery" right={<span className="dim text-[12px]">IPT {bp(ipt(issuer))} area → fair value {bp(issuer.fairSpread)} (illustrative)</span>}>
          <label className="lbl">Final spread over {PROGRAMME.benchmarks[b.ccy].name}</label>
          <div className="flex items-center gap-4">
            <input type="range" min={lo} max={hi} value={locked ? b.spreadBp : spread} disabled={locked} onChange={(e) => setSpread(+e.target.value)} className="flex-1 accent-[var(--accent)]" />
            <span className="mono text-[20px] w-20 text-right">{bp(locked ? b.spreadBp! : spread)}</span>
          </div>
          <svg viewBox="0 0 600 180" className="mt-4 w-full">
            {pts.map((p, k) => {
              const w = 600 / pts.length;
              const h = (p.d / maxD) * 150;
              const sel = p.sp === (locked ? b.spreadBp : spread);
              return <rect key={k} x={k * w + 1} y={160 - h} width={w - 2} height={h} rx={2} fill={sel ? "#3b6fff" : p.d >= PROGRAMME.size ? "rgba(60,207,145,0.45)" : "rgba(255,255,255,0.15)"} />;
            })}
            <line x1={0} x2={600} y1={160 - (PROGRAMME.size / maxD) * 150} y2={160 - (PROGRAMME.size / maxD) * 150} stroke="#f5b649" strokeDasharray="4 4" />
            <text x={4} y={156 - (PROGRAMME.size / maxD) * 150} fill="#f5b649" fontSize={11}>issue size {compact(PROGRAMME.size, b.ccy)}</text>
            <text x={0} y={176} fill="rgba(232,237,247,0.5)" fontSize={10}>{bp(lo)}</text>
            <text x={600} y={176} fill="rgba(232,237,247,0.5)" fontSize={10} textAnchor="end">{bp(hi)}</text>
            <text x={300} y={176} fill="rgba(232,237,247,0.5)" fontSize={10} textAnchor="middle">eligible demand at or inside each spread</text>
          </svg>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Book (eligible)" value={compact(demand, b.ccy)} sub={`${cover.toFixed(2)}× covered`} tone={cover >= 1 ? "ok" : "bad"} />
            <Stat label="Re-offer yield" value={`${y.toFixed(3)}%`} sub={`${PROGRAMME.benchmarks[b.ccy].yield.toFixed(2)}% + ${(spread / 100).toFixed(2)}%`} />
            <Stat label="Coupon" value={`${c.toFixed(3)}%`} sub="yield ↓ to nearest ⅛%" />
            <Stat label="Re-offer price" value={px.toFixed(3)} sub={`NIC ${bp(nic)} · ModDur ${dur.toFixed(2)}`} />
          </div>
          <div className="code mt-4 text-[11.5px]">
{`y  = benchmark + spread = ${PROGRAMME.benchmarks[b.ccy].yield.toFixed(3)}% + ${(spread / 100).toFixed(3)}% = ${y.toFixed(3)}%
c  = floor(y × 8) / 8 = ${c.toFixed(3)}%
P  = Σ (c/${freq}) / (1 + y/${freq})^k  +  100 / (1 + y/${freq})^${3 * freq}   (k = 1…${3 * freq})
   = ${px.toFixed(4)}  →  gross proceeds ${money((PROGRAMME.size * px) / 100, b.ccy, 2)}
DV01 ≈ ModDur × P × nominal × 0.0001 = ${money(dur * px * PROGRAMME.size * 1e-6, b.ccy, 0)}`}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button className="btn btn-primary" disabled={locked || cover < 1} onClick={() => { price(id, spread); onPriced(); }}>Price & allocate {issuer.brand}</button>
            {locked && <span className="chip chip-ok">priced at {bp(b.spreadBp!)} · {b.couponPct!.toFixed(3)}% · {b.price!.toFixed(3)}</span>}
            {cover < 1 && !locked && <span className="chip chip-bad">undersubscribed at this spread</span>}
          </div>
        </Card>
      </div>

      <div className="space-y-5">
        <Card title="Order book" pad={false} right={<span className="dim text-[12px]">{orders.length} orders · {compact(orders.reduce((a, o) => a + o.amount, 0), b.ccy)} gross</span>}>
          <div className="max-h-[520px] overflow-y-auto">
            <table className="t">
              <thead><tr><th>Investor</th><th className="r">Order</th><th className="r">Limit</th><th className="r">Alloc.</th></tr></thead>
              <tbody>
                {[...orders].sort((a, b2) => b2.amount - a.amount).map((o) => {
                  const inv = investorById(o.investorId)!;
                  const e = eligibleForPrimary(o.investorId, b.ccy);
                  const alloc = (locked ? b.allocations : allocations)?.find((a) => a.investorId === o.investorId)?.amount ?? 0;
                  const inside = o.limitBp <= (locked ? b.spreadBp! : spread);
                  return (
                    <tr key={o.investorId} className={cx(!e.ok && "opacity-70")}>
                      <td>
                        {COUNTRY[inv.country].flag} {inv.name}
                        <div className="dim text-[11px]">{inv.type}{inv.memberOf ? " · member treasury" : ""}</div>
                        {!e.ok && <span className="chip chip-bad mt-1">rejected: {e.reason}</span>}
                      </td>
                      <td className="r mono">{compact(o.amount, b.ccy)}</td>
                      <td className={cx("r mono", inside ? "text-ok" : "dim")}>{bp(o.limitBp)}</td>
                      <td className="r mono">{alloc ? compact(alloc, b.ccy) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <Callout title="Allocation policy (MiFID II record)">
          Pro-rata to order size, weighted toward real money: official institutions 1.4×, pension funds 1.3×, insurers 1.25×, asset managers 1.2×, banks 1.0×, hedge funds 0.6×.
          Allocations are rounded down to {money(PROGRAMME.increment[b.ccy], b.ccy)}, nothing below the {money(PROGRAMME.denomination[b.ccy], b.ccy)} minimum is allocated, and the rounding remainder goes to the largest tickets.
          Orders whose limit is tighter than the final spread drop out. Non-compliant investors are rejected at whitelisting, before they reach the book.
        </Callout>
      </div>
    </div>
  );
}

function Settle({ id, settle }: { id: string; settle: (id: string) => void }) {
  const { s } = useStore();
  const issuer = issuerById(id);
  const b = s.bonds[id];
  const at = issuer.registerModel === "AT_CSD_DLT";
  const seq = at
    ? [
        ["OeKB CSD", "Sammelurkunde lodged in collective custody (Depotgesetz)"],
        ["OeKB CSD", "mint(escrow, 100,000,000): book-entry layer on RL1. totalSupply = global note"],
        ["Pontes adapter", "lock(investor allocation) and emit a settlement request"],
        ["Investor's bank → T2", "pacs.009 for the cash amount in central-bank money"],
        ["T2 → Pontes", "settlement confirmation (finality under the TARGET rules)"],
        ["Pontes → BondToken", "release(): escrow → investor wallet, DvPSettled event"],
        ["OeKB CSD", "sese.025 confirmation; position visible in T2S for collateral use"],
      ]
    : [
        ["Registrar", "mint(escrow, nominal): totalSupply = issue amount"],
        ["Investor custodian", "approve + lock USD settlement token in DvPEscrow"],
        ["Seturion TSS", "settle(tradeId): one transaction that checks compliance and moves both legs"],
        ["ComplianceModule", "canTransfer(escrow, investor, amount) → KYC, Reg S, denomination"],
        ["BondToken", "Transfer(escrow → investor); USD token Transfer(investor → issuer)"],
        ["RL1 consensus", "block committed with BFT finality. The SFD irrevocability point is reached"],
        ["Registrar", "legal register updated (same state), sese.025 + semt.002 issued"],
      ];
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
      <div className="space-y-5">
        <Card title={`DvP sequence: ${at ? "OeKB CSD + Pontes (EUR, central-bank money)" : "Seturion TSS (USD settlement token)"}`}>
          <ol className="space-y-2.5">
            {seq.map(([who, what], k) => (
              <li key={k} className="flex gap-3 text-[13px]">
                <span className="mono flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[var(--accent-soft)] text-[11px] text-accent">{k + 1}</span>
                <div><b>{who}</b> <span className="muted">· {what}</span></div>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button className="btn btn-primary" disabled={b.status !== "priced"} onClick={() => settle(id)}>Execute DvP settlement on {fmtDate(PROGRAMME.issueDate)}</button>
            {b.status === "draft" && <span className="chip chip-warn">Price the tranche first</span>}
            {b.status === "settled" && <span className="chip chip-ok">Settled · {b.allocations?.length} holders</span>}
          </div>
          {b.status === "settled" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/registrar/" className="btn btn-sm">See the register →</Link>
              <Link href="/secondary/" className="btn btn-sm">Trade on Seturion →</Link>
              {at && <Link href="/eligibility/" className="btn btn-sm">Pledge to OeNB →</Link>}
            </div>
          )}
        </Card>
        <Callout tone="accent" title="Why there is no settlement risk">
          Both legs sit in one RL1 transaction, so it is impossible for the bond to move without the cash, or the cash without the bond.
          Under BFT consensus a committed block is final, which is what lets the Seturion rulebook define a precise SFD irrevocability point.
          The CSDR settlement-fail penalties of Art. 7 cannot arise for a trade that settles at execution.
        </Callout>
        {b.couponPct && (
          <Card title="Cash-flow schedule (per 100 nominal)">
            <table className="t">
              <thead><tr><th>Date</th><th className="r">Coupon</th><th className="r">Principal</th></tr></thead>
              <tbody>
                {couponSchedule(termsFor(b.ccy, b.couponPct)).map((d, k, arr) => (
                  <tr key={d}><td className="mono">{fmtDate(d)}</td><td className="r mono">{(b.couponPct! / (b.ccy === "USD" ? 2 : 1)).toFixed(4)}</td><td className="r mono">{k === arr.length - 1 ? "100.0000" : "—"}</td></tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
      <EventLog bondId={id} title="RL1 events for this tranche" />
    </div>
  );
}

function AllTranches({ onPick }: { onPick: (id: string) => void }) {
  const { s, price, settle } = useStore();
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {ISSUERS.map((i) => {
        const b = s.bonds[i.id];
        return (
          <div key={i.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{COUNTRY[i.country].flag} {i.brand}</div>
              <span className={cx("chip", b.status === "settled" ? "chip-ok" : b.status === "priced" ? "chip-accent" : "chip-warn")}>{b.status}</span>
            </div>
            <div className="dim mt-1 text-[12px]">{i.law} · {b.ccy} 100m · {b.registrarName}</div>
            <div className="mono mt-2 text-[12.5px]">
              {b.couponPct ? `${b.couponPct.toFixed(3)}% · ${b.price!.toFixed(3)} · ${bp(b.spreadBp!)}` : `fair ${bp(i.fairSpread)} (illustr.)`}
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn btn-sm" onClick={() => onPick(i.id)}>Open book</button>
              <button className="btn btn-sm" disabled={b.status !== "draft"} onClick={() => price(i.id, i.fairSpread + 5)}>Price</button>
              <button className="btn btn-sm" disabled={b.status !== "priced"} onClick={() => settle(i.id)}>Settle</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
