"use client";
import { useEffect, useState } from "react";
import { BondPicker, Callout, Card, EventLog, Hash, LegalRefs, PageHead, Stat, Tabs } from "@/components/ui";
import { INVESTORS, PROGRAMME, investorById, isinOf, issuerById } from "@/lib/data/scenario";
import { accruedFor, holderName, useStore } from "@/lib/store";
import { yieldFromPrice } from "@/lib/finance";
import { compact, cx, fmtDate, money } from "@/lib/util";

type T = "book" | "rules" | "transparency";

const DATES = ["2026-12-11", "2026-12-18", "2027-01-15", "2027-03-10", "2027-06-09", "2027-06-11", "2027-12-09"];

export default function Secondary() {
  const st = useStore();
  const { s } = st;
  const firstSettled = Object.values(s.bonds).find((b) => b.status === "settled")?.id ?? "caixa";
  const [id, setId] = useState(firstSettled);
  const [tab, setTab] = useState<T>("book");
  const b = s.bonds[id];
  const issuer = issuerById(id);

  useEffect(() => {
    if (b.status === "settled") st.seedBook(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, b.status]);

  return (
    <>
      <PageHead eyebrow="04 · Secondary market" title="Seturion DLT TSS: trade and settle in one step">
        Seturion holds a <b>DLT Trading and Settlement System</b> licence under the EU Pilot Regime (BaFin, October 2026). It runs the order
        book <i>and</i> the settlement. A match calls <span className="mono">settleDvP</span> on RL1, so the bond and the cash change hands in the same
        block: <b>T+0, atomic, final</b>.
      </PageHead>

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <BondPicker value={id} onChange={setId} />
        <div>
          <label className="lbl">Trade date (simulated)</label>
          <select className="select" value={s.tradeDate} onChange={(e) => st.setTradeDate(e.target.value)}>
            {DATES.map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)}
          </select>
        </div>
        <span className="chip">MIC: XSET (illustrative)</span>
        <span className="chip">{isinOf(issuer)}</span>
      </div>

      {b.status !== "settled" ? (
        <Callout tone="warn" title="This tranche is not tradable yet">
          Only settled tranches are admitted to trading.
          <div className="mt-3 flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => { if (b.status === "draft") st.price(id, issuer.fairSpread + 5); st.settle(id); }}>Price & settle {issuer.brand}</button>
            <button className="btn btn-sm" onClick={st.quickIssueAll}>Issue all</button>
          </div>
        </Callout>
      ) : (
        <>
          <Tabs<T> value={tab} onChange={setTab} tabs={[{ id: "book", label: "Order book & ticket" }, { id: "rules", label: "Trade lifecycle on the TSS" }, { id: "transparency", label: "MiFIR transparency & reporting" }]} />
          {tab === "book" && <BookView id={id} />}
          {tab === "rules" && <Lifecycle />}
          {tab === "transparency" && <Transparency id={id} />}
        </>
      )}
    </>
  );
}

function BookView({ id }: { id: string }) {
  const st = useStore();
  const { s } = st;
  const b = s.bonds[id];
  const orders = s.orders.filter((o) => o.bondId === id);
  const bids = orders.filter((o) => o.side === "BUY").sort((a, c) => c.price - a.price);
  const asks = orders.filter((o) => o.side === "SELL").sort((a, c) => a.price - c.price);
  const bestBid = bids[0]?.price, bestAsk = asks[0]?.price;
  const ai = accruedFor(b, s.tradeDate);
  const freq = b.ccy === "USD" ? 2 : 1;
  const yrs = Math.max(0.5, 3 - (new Date(s.tradeDate).getTime() - new Date(PROGRAMME.issueDate).getTime()) / (365.25 * 864e5));
  const [participant, setP] = useState("amstel");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [px, setPx] = useState<number>(+(bestAsk ?? b.price ?? 100).toFixed(3));
  const [qty, setQty] = useState(1_000_000);
  const [msg, setMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const trades = s.trades.filter((t) => t.bondId === id);
  const pos = s.hold[id]?.[participant];
  const yld = yieldFromPrice(b.couponPct!, px, freq, Math.round(yrs * freq) / freq);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="Best bid" value={bestBid?.toFixed(3) ?? "—"} tone="ok" />
        <Stat label="Best ask" value={bestAsk?.toFixed(3) ?? "—"} tone="bad" />
        <Stat label="Bid/ask" value={bestBid && bestAsk ? `${((bestAsk - bestBid) * 100).toFixed(1)}c` : "—"} sub="cents per 100" />
        <Stat label="Accrued interest" value={ai.accrued.toFixed(4)} sub={`${ai.days} days / ${b.ccy === "USD" ? "360 (30/360)" : "ACT/ACT"}`} />
        <Stat label="Last trade" value={trades[0]?.price.toFixed(3) ?? "—"} sub={trades[0] ? compact(trades[0].qty, b.ccy) : "no trades"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Card title="Central limit order book · price-time priority" pad={false} right={<span className="dim text-[12px]">clean price, % of nominal</span>}>
          <div className="grid grid-cols-2">
            <div className="border-r border-line">
              <div className="eyebrow px-4 pt-3 text-ok">Bids</div>
              <table className="t"><thead><tr><th>Participant</th><th className="r">Size</th><th className="r">Price</th><th /></tr></thead>
                <tbody>{bids.map((o) => (
                  <tr key={o.id}><td className="text-[12px]">{holderName(o.participant)}</td><td className="r mono">{compact(o.remaining, b.ccy)}</td><td className="r mono text-ok">{o.price.toFixed(3)}</td>
                    <td><button className="btn btn-sm" onClick={() => { setSide("SELL"); setPx(o.price); setQty(o.remaining); }}>hit</button></td></tr>
                ))}</tbody></table>
            </div>
            <div>
              <div className="eyebrow px-4 pt-3 text-bad">Offers</div>
              <table className="t"><thead><tr><th /><th>Price</th><th className="r">Size</th><th>Participant</th></tr></thead>
                <tbody>{asks.map((o) => (
                  <tr key={o.id}><td><button className="btn btn-sm" onClick={() => { setSide("BUY"); setPx(o.price); setQty(o.remaining); }}>lift</button></td><td className="mono text-bad">{o.price.toFixed(3)}</td><td className="r mono">{compact(o.remaining, b.ccy)}</td><td className="text-[12px]">{holderName(o.participant)}</td></tr>
                ))}</tbody></table>
            </div>
          </div>
          <div className="dim border-t border-line px-4 py-2 text-[11.5px]">Participant names are visible here for the demo. On the real venue the book is anonymous and only price and size are public (MiFIR Art. 8).</div>
        </Card>

        <Card title="Order ticket">
          <div className="grid gap-3">
            <div><label className="lbl">Participant (via member)</label>
              <select className="select" value={participant} onChange={(e) => setP(e.target.value)}>{INVESTORS.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
              <div className="dim mt-1 text-[11.5px]">Position: {pos ? money(pos.bal - pos.frozen - pos.pledged, b.ccy) + " free" : "none"} · KYC to {investorById(participant)?.kycValidUntil}</div>
            </div>
            <div className="flex gap-1">
              {(["BUY", "SELL"] as const).map((x) => <button key={x} className={cx("btn btn-sm flex-1", side === x && (x === "BUY" ? "btn-ok" : "btn-bad"))} onClick={() => setSide(x)}>{x}</button>)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="lbl">Limit (clean)</label><input className="input mono" type="number" step={0.005} value={px} onChange={(e) => setPx(+e.target.value)} /></div>
              <div><label className="lbl">Nominal</label><input className="input mono" type="number" step={1000} value={qty} onChange={(e) => setQty(+e.target.value)} /></div>
            </div>
            <div className="rounded-lg border border-line p-3 text-[12.5px] mono">
              <div className="flex justify-between"><span className="dim">Clean</span><span>{px.toFixed(3)}</span></div>
              <div className="flex justify-between"><span className="dim">+ Accrued</span><span>{ai.accrued.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="dim">= Dirty</span><span>{(px + ai.accrued).toFixed(4)}</span></div>
              <div className="flex justify-between border-t border-line mt-1 pt-1"><span className="dim">Cash leg</span><span>{money((qty * (px + ai.accrued)) / 100, b.ccy, 2)}</span></div>
              <div className="flex justify-between"><span className="dim">Yield ≈</span><span>{yld.toFixed(3)}%</span></div>
              <div className="flex justify-between"><span className="dim">Settlement</span><span>T+0 · {b.ccy === "USD" ? "USD token" : "Pontes/T2"}</span></div>
            </div>
            <button className={cx("btn", side === "BUY" ? "btn-ok" : "btn-bad")} onClick={() => setMsg(st.placeOrder({ bondId: id, side, price: px, qty, participant }))}>
              Submit {side} {compact(qty, b.ccy)} @ {px.toFixed(3)}
            </button>
            {msg && <div className={cx("rounded-lg p-2.5 text-[12.5px]", msg.ok ? "bg-[var(--ok-soft)] text-ok" : "bg-[var(--bad-soft)] text-bad")}>{msg.msg}</div>}
            <p className="dim text-[11.5px]">Pre-trade checks: KYC claim, Reg S (USD), free on-chain position for sells (no short selling), denomination. Buy cash is assumed pre-funded in the settlement token.</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Card title="Trades: settled atomically on RL1" pad={false}>
          {trades.length === 0 ? <div className="dim p-5 text-[13px]">No trades yet. Lift an offer or hit a bid.</div> : (
            <div className="scroll-x max-h-[380px]">
              <table className="t">
                <thead><tr><th>ID</th><th>Buyer ← Seller</th><th className="r">Nominal</th><th className="r">Clean</th><th className="r">Cash (dirty)</th><th>Publication</th><th>Block / tx</th></tr></thead>
                <tbody>{trades.map((t) => (
                  <tr key={t.id}>
                    <td className="mono">{t.id}</td>
                    <td className="text-[12px]">{holderName(t.buyer)}<div className="dim">← {holderName(t.seller)}</div></td>
                    <td className="r mono">{compact(t.qty, b.ccy)}</td>
                    <td className="r mono">{t.price.toFixed(3)}</td>
                    <td className="r mono">{money(t.cash, b.ccy, 2)}</td>
                    <td>{t.deferred ? <span className="chip chip-warn">LIS: deferred</span> : <span className="chip chip-ok">real-time</span>}</td>
                    <td className="mono text-[11px]">#{t.block.toLocaleString()}<br /><Hash v={t.tx} n={4} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </Card>
        <EventLog bondId={id} types={["OrderAccepted", "DvPSettled", "MatchRejected", "BookOpened"]} title="Venue & settlement events" limit={30} />
      </div>
    </div>
  );
}

function Lifecycle() {
  const steps = [
    ["Access", "Members are banks and investment firms. Under Pilot Regime Art. 4(2) the NCA can also admit non-intermediaries (e.g. the Nordic Reserve Manager) as direct participants, if they meet fit-and-proper criteria.", ["dlt-pilot", "mifid2"]],
    ["Pre-trade validation", "Each order is checked against RL1 state: the seller's free balance (balance − frozen − pledged − open sells), the buyer's claims (KYC, Reg S) and denomination. Settlement cannot fail, because it was validated before matching.", ["us-regs", "amlr"]],
    ["Matching", "Continuous price-time priority. A trade executes at the price of the resting order. No discretion (MiFID II Art. 18–19 non-discretionary rules).", ["mifid2"]],
    ["Atomic settlement", "The matching engine calls DvPEscrow.settleDvP(tradeId, seller, buyer, nominal, cash) with SETTLEMENT_ROLE. One transaction moves both the bond token and the USD token (or, for EUR, locks the bond and triggers Pontes).", ["dlt-pilot", "csdr"]],
    ["Finality", "Once the block is committed under BFT consensus, the transfer is irrevocable under the TSS rules. As a designated system, insolvency proceedings cannot unwind it (SFD Art. 3 and 5).", ["sfd"]],
    ["Register update", "OeKB CSD is issuer CSD for every tranche, so each RL1 transfer is an OeKB book entry executed through its CSD-operated contract. The registrar's issuer-level register is unchanged: it records OeKB as holder of the whole issue.", ["es-lmvsi", "fr-cmf", "de-ewpg", "at-depg"]],
    ["Post-trade", "Trade published under MiFIR Art. 10 (or deferred under Art. 11). Members file Art. 26 transaction reports. Surveillance runs under MAR.", ["mifir", "mar"]],
  ] as const;
  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
      <div className="space-y-2">
        {steps.map(([t, d, l], k) => (
          <div key={t} className="card flex gap-4 p-4">
            <span className="mono flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[var(--accent-soft)] text-[12px] text-accent">{k + 1}</span>
            <div className="flex-1"><div className="font-semibold">{t}</div><p className="muted mt-1 text-[13.5px] leading-relaxed">{d}</p><LegalRefs ids={[...l]} className="mt-2" /></div>
          </div>
        ))}
      </div>
      <div className="space-y-5">
        <Card title="Seturion TSS vs. a conventional chain">
          <table className="t">
            <thead><tr><th /><th>Conventional</th><th>Seturion TSS on RL1</th></tr></thead>
            <tbody>
              {[
                ["Venues / FMIs", "MTF + CCP + CSD + custodian chain", "One DLT TSS licence"],
                ["Settlement cycle", "T+1 (EU move to T+1 in Oct 2027)", "T+0, at the moment of execution"],
                ["Fail risk", "Settlement fails → CSDR penalties", "None: positions checked pre-trade, atomic"],
                ["Reconciliation", "Between venue, CSD and custodians", "Single shared state"],
                ["Cash", "T2S DvP in central-bank money", "USD token / EMT, or EUR via Pontes"],
                ["Opening hours", "Batch cycles", "Continuous (24/5 in this scenario)"],
              ].map((r) => <tr key={r[0]}><td className="dim">{r[0]}</td><td className="muted">{r[1]}</td><td>{r[2]}</td></tr>)}
            </tbody>
          </table>
        </Card>
        <Callout title="Pilot Regime limits that Seturion monitors">
          Bonds with an issue size below €1bn may be admitted. Each ORBIT tranche is about €92.6m (USD) or €100m (EUR). The aggregate market value of all DLT financial instruments on Seturion must stay ≤ €6bn, and ORBIT uses about €1.13bn of that (10 × €92.6m + 2 × €100m). If the cap is breached, the transition strategy (Art. 7(7)) kicks in.
        </Callout>
      </div>
    </div>
  );
}

function Transparency({ id }: { id: string }) {
  const { s } = useStore();
  const b = s.bonds[id];
  const issuer = issuerById(id);
  const trades = s.trades.filter((t) => t.bondId === id);
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card title="Public post-trade tape (what the market sees)" pad={false}>
        <table className="t">
          <thead><tr><th>Time</th><th>ISIN</th><th className="r">Price</th><th className="r">Quantity</th><th>Flags</th></tr></thead>
          <tbody>
            {trades.length === 0 && <tr><td colSpan={5} className="dim">No trades yet.</td></tr>}
            {trades.map((t) => (
              <tr key={t.id}>
                <td className="mono">{t.ts} 13:00:02</td>
                <td className="mono">{isinOf(issuer)}</td>
                <td className="r mono">{t.price.toFixed(3)}</td>
                <td className="r mono">{t.deferred ? "deferred" : compact(t.qty, b.ccy)}</td>
                <td>{t.deferred ? <span className="chip chip-warn">LRGS (deferred)</span> : <span className="chip">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="dim border-t border-line px-4 py-2 text-[11.5px]">No buyer or seller identities are published. Trades of {money(5_000_000, b.ccy)} or more are treated as large in scale here (illustrative threshold).</div>
      </Card>
      <div className="space-y-5">
        <Card title="Regulatory reporting map">
          <table className="t">
            <tbody>
              {[
                ["Pre-trade quotes", "Seturion → public", "MiFIR Art. 8"],
                ["Post-trade publication", "Seturion → public / APA", "MiFIR Art. 10–11"],
                ["Transaction report", "Members (investment firms) → NCA", "MiFIR Art. 26"],
                ["Instrument reference data", "Seturion → FIRDS (ESMA)", "MiFIR Art. 27"],
                ["Suspicious orders (STOR)", "Seturion / members → NCA", "MAR Art. 16"],
                ["Pilot Regime reporting", "Seturion → BaFin / ESMA", "Reg. 2022/858 Art. 7, 14"],
                ["ICT incidents", "Seturion, registrars → NCA", "DORA Art. 19"],
              ].map((r) => <tr key={r[0]}><td>{r[0]}</td><td className="muted">{r[1]}</td><td className="dim text-[12px]">{r[2]}</td></tr>)}
            </tbody>
          </table>
        </Card>
        <LegalRefs ids={["mifir", "mar", "dlt-pilot", "dora"]} />
      </div>
    </div>
  );
}
