"use client";
import { useState } from "react";
import { Callout, Card, EventLog, LegalRefs, PageHead, Stat, Tabs } from "@/components/ui";
import { COUNTRY, INVESTORS, ISSUERS, PROGRAMME, issuerById } from "@/lib/data/scenario";
import { FUND_FEES, FUND_ID, FUND_LAUNCH_PRICE, fundValuation } from "@/lib/fund";
import { holderName, useStore } from "@/lib/store";
import { addressOf, compact, cx, money } from "@/lib/util";

type T = "overview" | "units" | "trade" | "structure";

export default function Fund() {
  const st = useStore();
  const { s } = st;
  const [tab, setTab] = useState<T>("overview");
  const v = fundValuation(s);
  const settled = ISSUERS.filter((i) => s.bonds[i.id].status === "settled").length;

  return (
    <>
      <PageHead
        eyebrow="09 · Chartered Investment"
        title="ORBIT Special Fund: one unit, the whole RL1 basket"
        actions={settled === 0 ? <button className="btn btn-primary" onClick={st.quickIssueAll}>Issue all tranches first</button> : undefined}
      >
        Chartered Investment, the registrar of the RL1 tranches, initiates a <b>German Spezial-AIF</b> that buys the ORBIT bonds in the primary
        books and on Seturion. Its units are <b>electronic fund units on RL1</b>, and Chartered Investment keeps the unit register. A pension fund
        that buys one unit gets diversified exposure to all twelve issuers, with T+0 settlement on both sides.
      </PageHead>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="NAV" value={compact(v.nav)} sub={`${v.positions.length} bond positions`} tone="accent" />
        <Stat label="NAV per unit" value={v.navPerUnit.toFixed(4)} sub={`launched at ${FUND_LAUNCH_PRICE.toFixed(2)} USD`} tone={v.navPerUnit >= FUND_LAUNCH_PRICE ? "ok" : "warn"} />
        <Stat label="Units outstanding" value={v.units.toLocaleString("en-US", { maximumFractionDigits: 0 })} sub={`${Object.keys(s.fund.units).length} unitholders`} />
        <Stat label="Invested" value={compact(v.invested)} sub={`${v.nav ? ((v.invested / v.nav) * 100).toFixed(1) : "0"}% of NAV`} />
        <Stat label="Cash" value={compact(v.cash)} sub="USD settlement token / EUR at depositary" />
      </div>

      <div className="mt-6">
        <Tabs<T> value={tab} onChange={setTab} tabs={[{ id: "overview", label: "Portfolio & NAV" }, { id: "units", label: "Unit register & subscriptions" }, { id: "trade", label: "Buy on Seturion" }, { id: "structure", label: "Structure & legal basis" }]} />
        {tab === "overview" && <Portfolio v={v} />}
        {tab === "units" && <Units v={v} />}
        {tab === "trade" && <Trade v={v} />}
        {tab === "structure" && <Structure />}
      </div>
    </>
  );
}

type V = ReturnType<typeof fundValuation>;

function Portfolio({ v }: { v: V }) {
  const { s } = useStore();
  return (
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <Card title="Holdings (from the RL1 / OeKB register)" pad={false}>
        {v.positions.length === 0 ? <div className="dim p-5 text-[13px]">No positions yet. Settle tranches first; the fund bids $12m in every primary book.</div> : (
          <div className="scroll-x">
            <table className="t">
              <thead><tr><th>Issuer</th><th className="r">Nominal</th><th className="r">Mark</th><th className="r">AI</th><th className="r">Value (USD)</th><th className="r">Weight</th></tr></thead>
              <tbody>
                {v.positions.map((p) => {
                  const i = issuerById(p.bondId);
                  return (
                    <tr key={p.bondId}>
                      <td>{COUNTRY[i.country].flag} {p.brand}</td>
                      <td className="r mono">{money(p.nominal, p.ccy)}</td>
                      <td className="r mono">{p.mark.toFixed(3)}</td>
                      <td className="r mono">{p.ai.toFixed(4)}</td>
                      <td className="r mono">{money(p.valueUsd, "USD")}</td>
                      <td className="r mono">{((p.valueUsd / v.nav) * 100).toFixed(2)}%</td>
                    </tr>
                  );
                })}
                <tr><td className="dim">Cash</td><td colSpan={3} /><td className="r mono">{money(v.cash, "USD")}</td><td className="r mono">{((v.cash / v.nav) * 100).toFixed(2)}%</td></tr>
              </tbody>
            </table>
          </div>
        )}
        <div className="dim border-t border-line px-4 py-2 text-[11.5px]">Marks: last Seturion trade, else re-offer price. EUR positions converted at {PROGRAMME.fx} USD/EUR (illustrative). Valuation date {s.tradeDate}.</div>
      </Card>
      <div className="space-y-5">
        <Card title="NAV build-up">
          <table className="t">
            <tbody>
              {[
                ["Seed subscriptions (3 anchor investors)", v.seedCash],
                ["+ Later subscriptions − redemptions", s.fund.netSubs],
                ["− Primary purchases", -v.primaryCost],
                ["− Seturion buys / + sells", -v.secBuys + v.secSells],
                ["+ Coupons received", v.coupons],
                ["= Cash", v.cash],
                ["+ Bonds at mark incl. accrued", v.invested],
                ["= NAV", v.nav],
              ].map(([k, x]) => <tr key={k as string}><td className={cx((k as string).startsWith("=") && "font-semibold")}>{k}</td><td className="r mono">{money(x as number, "USD")}</td></tr>)}
            </tbody>
          </table>
          <p className="dim mt-2 text-[11.5px]">Fees ({FUND_FEES.mgmtPctPa}% p.a. management, {FUND_FEES.depositaryPctPa}% p.a. depositary) accrue daily in a real fund. They are left out here so the arithmetic stays visible.</p>
        </Card>
        <Callout title="Investment conditions (summary)">
          Only ORBIT bonds of RL1 member banks plus the non-member tranches. Max 15% per issuer, min 80% invested, cash in EUR/USD at the depositary. Every bond must be issued through OeKB CSD.
          USD exposure may be hedged with FX forwards (not modelled).
        </Callout>
      </div>
    </div>
  );
}

function Units({ v }: { v: V }) {
  const st = useStore();
  const { s } = st;
  const [inv, setInv] = useState("tagus");
  const [amt, setAmt] = useState(5_000_000);
  const [msg, setMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const holders = Object.entries(s.fund.units).sort((a, b) => b[1] - a[1]);
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
      <Card title="Unit register: electronic fund units on RL1" pad={false} right={<span className="mono dim text-[11px]">{addressOf("fund-units").slice(0, 14)}…</span>}>
        <table className="t">
          <thead><tr><th>Unitholder</th><th>Wallet</th><th className="r">Units</th><th className="r">Value</th><th /></tr></thead>
          <tbody>
            {holders.map(([id, u]) => (
              <tr key={id}>
                <td>{holderName(id)}</td>
                <td className="mono dim text-[11px]">{addressOf("holder/" + id).slice(0, 12)}…</td>
                <td className="r mono">{u.toLocaleString("en-US", { maximumFractionDigits: 4 })}</td>
                <td className="r mono">{money(u * v.navPerUnit, "USD")}</td>
                <td><button className="btn btn-sm" onClick={() => setMsg(st.fundRedeem(id, Math.min(u, 100_000)))}>redeem 100k</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="dim border-t border-line px-4 py-2 text-[11.5px]">Registrar: Chartered Investment. Units are transferable only between wallets with a professional or semi-professional investor claim (KAGB §1(6)).</div>
      </Card>
      <div className="space-y-5">
        <Card title="Subscribe at NAV">
          <div className="grid gap-3">
            <div><label className="lbl">Investor</label>
              <select className="select" value={inv} onChange={(e) => setInv(e.target.value)}>
                {INVESTORS.filter((i) => i.id !== FUND_ID).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select></div>
            <div><label className="lbl">Amount (USD)</label><input className="input mono" type="number" step={100000} value={amt} onChange={(e) => setAmt(+e.target.value)} /></div>
            <div className="mono text-[12.5px] dim">≈ {(amt / v.navPerUnit).toFixed(4)} units at NAV {v.navPerUnit.toFixed(4)}</div>
            <button className="btn btn-primary" onClick={() => setMsg(st.fundSubscribe(inv, amt))}>Subscribe (cash vs. units, T+0)</button>
            {msg && <div className={cx("rounded-lg p-2.5 text-[12.5px]", msg.ok ? "bg-[var(--ok-soft)] text-ok" : "bg-[var(--bad-soft)] text-bad")}>{msg.msg}</div>}
            <p className="dim text-[11.5px]">Try Hudson Ridge (US person) or Baltic Credit Union (KYC expired). In this demo, subscription and redemption settle atomically: units are minted or burned against the USD settlement token.</p>
          </div>
        </Card>
        <EventLog types={["FundUnitsIssued", "FundUnitsRedeemed"]} title="Unit register events" limit={20} />
      </div>
    </div>
  );
}

function Trade({ v }: { v: V }) {
  const st = useStore();
  const { s } = st;
  const settledIds = ISSUERS.filter((i) => s.bonds[i.id].status === "settled").map((i) => i.id);
  const [id, setId] = useState(settledIds[0] ?? "abn");
  const [qty, setQty] = useState(2_000_000);
  const [msg, setMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const b = s.bonds[id];
  const asks = s.orders.filter((o) => o.bondId === id && o.side === "SELL").sort((a, c) => a.price - c.price);
  const best = asks[0];
  const cost = best ? ((qty * best.price) / 100) * (b.ccy === "EUR" ? PROGRAMME.fx : 1) : 0;
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
      <Card title="Fund buys on Seturion">
        <div className="grid gap-3">
          <div><label className="lbl">Tranche</label>
            <select className="select" value={id} onChange={(e) => { setId(e.target.value); st.seedBook(e.target.value); }}>
              {settledIds.map((x) => <option key={x} value={x}>{issuerById(x).brand} · {s.bonds[x].ccy}</option>)}
            </select></div>
          <button className="btn btn-sm" onClick={() => st.seedBook(id)}>Open / refresh the Seturion book</button>
          <div className="text-[13px]">Best offer: {best ? <span className="mono">{best.price.toFixed(3)} for {compact(best.remaining, b.ccy)} ({holderName(best.participant)})</span> : <span className="dim">none yet. Open the book.</span>}</div>
          <div><label className="lbl">Nominal</label><input className="input mono" type="number" step={1000} value={qty} onChange={(e) => setQty(+e.target.value)} /></div>
          <div className="dim text-[12px]">Clean cost ≈ {money(cost, "USD")} · fund cash {money(v.cash, "USD")}</div>
          <button className="btn btn-ok" disabled={!best || cost > v.cash} onClick={() => setMsg(st.placeOrder({ bondId: id, side: "BUY", price: best!.price, qty, participant: FUND_ID }))}>Buy for the fund (lift offer)</button>
          {msg && <div className={cx("rounded-lg p-2.5 text-[12.5px]", msg.ok ? "bg-[var(--ok-soft)] text-ok" : "bg-[var(--bad-soft)] text-bad")}>{msg.msg}</div>}
          <p className="dim text-[11.5px]">The KVG places the order through a Seturion member. Settlement is atomic DvP and the purchased bonds land in the fund wallet, which the depositary controls.</p>
        </div>
      </Card>
      <EventLog bondId={id} types={["DvPSettled", "OrderAccepted", "BookOpened"]} title="Seturion events for this tranche" limit={25} />
    </div>
  );
}

function Structure() {
  const roles = [
    ["Initiator & unit registrar", "Chartered Investment", "Designs the strategy, distributes to professional investors, keeps the electronic unit register on RL1"],
    ["Management company (KVG)", "Licensed German KVG (partner, scenario)", "Portfolio and risk management, NAV calculation, liquidity management (KAGB §20, §30)"],
    ["Depositary (Verwahrstelle)", "DZ BANK (scenario)", "Safekeeping of the fund's bond tokens and cash, control functions (KAGB §80 ff.)"],
    ["Issuer CSD of the assets", "OeKB CSD", "All bonds held are OeKB book entries, so the fund's holdings are Eurosystem-ready wherever the tranche itself is eligible"],
    ["Trading venue", "Seturion DLT TSS", "Secondary purchases and sales; T+0 atomic DvP"],
    ["Investors", "Professional / semi-professional only", "Insurers, pension funds, bank treasuries (Spezial-AIF, KAGB §1(6))"],
  ];
  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
      <Card title="Who does what" pad={false}>
        <table className="t"><thead><tr><th>Role</th><th>Entity</th><th>Function</th></tr></thead>
          <tbody>{roles.map((r) => <tr key={r[0]}><td className="font-medium">{r[0]}</td><td>{r[1]}</td><td className="muted">{r[2]}</td></tr>)}</tbody></table>
      </Card>
      <div className="space-y-5">
        <Card title="Fund terms (illustrative)">
          <table className="t"><tbody>
            {[
              ["Legal form", "Open-ended domestic Spezial-AIF with fixed investment conditions (KAGB §284)"],
              ["Base currency", "USD (EUR positions converted, optional FX hedge)"],
              ["Units", "Electronic unit certificates on RL1 (KAGB §95 with eWpG)"],
              ["Dealing", "Daily NAV; subscription and redemption T+0 against the settlement token"],
              ["Minimum", "EUR 200,000 for semi-professional investors"],
              ["Fees", `${FUND_FEES.mgmtPctPa}% management, ${FUND_FEES.depositaryPctPa}% depositary p.a.`],
              ["Distribution policy", "Coupons accumulate; annual distribution optional"],
            ].map(([k, x]) => <tr key={k}><td className="dim w-36">{k}</td><td>{x}</td></tr>)}
          </tbody></table>
        </Card>
        <LegalRefs ids={["kagb", "de-ewpg", "de-kwg", "mifid2", "us-regs"]} />
      </div>
    </div>
  );
}
