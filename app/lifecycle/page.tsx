"use client";
import { useState } from "react";
import { BondPicker, Callout, Card, EventLog, LegalRefs, PageHead, Stat } from "@/components/ui";
import { PROGRAMME, issuerById, termsFor } from "@/lib/data/scenario";
import { accrued, addDays, couponAmount, couponSchedule } from "@/lib/finance";
import { useStore } from "@/lib/store";
import { cx, fmtDate, money } from "@/lib/util";

const DAYS = Math.round((Date.parse(PROGRAMME.maturityDate) - Date.parse(PROGRAMME.issueDate)) / 864e5);

export default function Lifecycle() {
  const st = useStore();
  const { s } = st;
  const firstSettled = Object.values(s.bonds).find((b) => b.status === "settled" || b.status === "redeemed")?.id ?? "erste";
  const [id, setId] = useState(firstSettled);
  const [day, setDay] = useState(200);
  const b = s.bonds[id];
  const issuer = issuerById(id);
  const date = addDays(PROGRAMME.issueDate, day);
  const live = b.status === "settled" || b.status === "redeemed";
  const t = b.couponPct ? termsFor(b.ccy, b.couponPct) : null;
  const sched = t ? couponSchedule(t) : [];
  const ai = t ? accrued(t, date) : null;
  const outstanding = Object.values(s.hold[id] ?? {}).reduce((a, h) => a + h.bal, 0);
  const holders = Object.values(s.hold[id] ?? {}).filter((h) => h.bal > 0).length;
  const eur = b.ccy === "EUR";

  return (
    <>
      <PageHead eyebrow="06 · Lifecycle & servicing" title="Coupons, record dates, migration, redemption">
        Move through the bond's life from {fmtDate(PROGRAMME.issueDate)} to {fmtDate(PROGRAMME.maturityDate)}. Coupons are paid by Cecabank as paying agent from a record-date
        snapshot of the RL1 register: USD in the settlement token, EUR in central-bank money via Pontes. At maturity the tokens are burned against principal.
      </PageHead>

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <BondPicker value={id} onChange={setId} />
        {!live && (
          <button className="btn btn-primary btn-sm" onClick={() => { if (b.status === "draft") st.price(id, issuer.fairSpread + 5); st.settle(id); }}>Price & settle {issuer.brand}</button>
        )}
      </div>

      {live && t && ai && (
        <>
          <Card title="Life of the bond">
            <input type="range" min={0} max={DAYS} value={day} onChange={(e) => setDay(+e.target.value)} className="w-full accent-[var(--accent)]" />
            <div className="relative mt-1 h-6">
              {sched.map((d) => {
                const x = ((Date.parse(d) - Date.parse(PROGRAMME.issueDate)) / 864e5 / DAYS) * 100;
                return <span key={d} className={cx("absolute top-0 -translate-x-1/2 text-[10px] mono", b.couponsPaid.includes(d) ? "text-ok" : "dim")} style={{ left: `${x}%` }}>▲<br />{d.slice(2, 7)}</span>;
              })}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <Stat label="Valuation date" value={fmtDate(date)} />
              <Stat label="Accrued / 100" value={ai.accrued.toFixed(4)} sub={`${ai.days} days since ${fmtDate(ai.last)}`} />
              <Stat label="Next coupon" value={fmtDate(ai.next)} sub={`${money(couponAmount(t, 1_000_000), b.ccy, 2)} per 1m`} />
              <Stat label="Outstanding" value={money(outstanding, b.ccy)} sub={`${holders} registered holders`} tone={b.status === "redeemed" ? "warn" : undefined} />
              <Stat label="Convention" value={b.ccy === "USD" ? "30/360 s.a." : "ACT/ACT ann."} sub={`${b.couponPct!.toFixed(3)}% fixed`} />
            </div>
          </Card>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_1fr]">
            <div className="space-y-5">
              <Card title="Coupon & redemption schedule" pad={false}>
                <table className="t">
                  <thead><tr><th>#</th><th>Payment date</th><th>Record date</th><th className="r">Per 1m nominal</th><th className="r">Whole issue</th><th>Status</th><th /></tr></thead>
                  <tbody>
                    {sched.map((d, k) => {
                      const last = k === sched.length - 1;
                      const paid = b.couponsPaid.includes(d);
                      const due = date >= d;
                      return (
                        <tr key={d}>
                          <td className="mono">{k + 1}</td>
                          <td className="mono">{fmtDate(d)}</td>
                          <td className="mono dim">{fmtDate(addDays(d, -1))}</td>
                          <td className="r mono">{money(couponAmount(t, 1_000_000), b.ccy, 2)}{last ? " + principal" : ""}</td>
                          <td className="r mono">{money(couponAmount(t, PROGRAMME.size), b.ccy, 2)}</td>
                          <td>{paid ? <span className="chip chip-ok">paid</span> : due ? <span className="chip chip-warn">due</span> : <span className="chip">scheduled</span>}</td>
                          <td>
                            {!last && <button className="btn btn-sm" disabled={!due || paid || b.status !== "settled"} onClick={() => st.payCoupon(id, d)}>pay</button>}
                            {last && <button className="btn btn-sm btn-primary" disabled={!due || b.status !== "settled"} onClick={() => st.redeem(id)}>redeem</button>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="dim border-t border-line px-4 py-2 text-[11.5px]">Move the slider past a date to enable payment. Business-day convention: Following, unadjusted. Record date simplified to payment date − 1 day.</div>
              </Card>
              <Card title="Coupon run: technical sequence">
                <ol className="list-decimal space-y-1.5 pl-5 text-[13px]">
                  <li>D-5: the issuer funds the paying agent ({eur ? "EUR to Cecabank's T2 account / Pontes pool" : "USD settlement tokens to the PAYING_AGENT pool"})</li>
                  <li>Record date (D-1, end of day): <span className="mono">snapshot()</span> freezes balances per address in a block-height checkpoint</li>
                  <li>The paying agent computes amounts off-chain from the snapshot, then sends seev.031 (notification) and seev.036 (movement confirmation) to custodians</li>
                  <li>Payment date: {eur ? "Pontes triggers T2 payments in central-bank money to each holder's cash account" : "batch transfer of USD settlement tokens to each holder wallet"}, then a <span className="mono">CouponPaid</span> event per holder</li>
                  <li>Pledged positions: coupons go to the pledgor under the ECMS / pledge terms. Frozen positions: paid into a blocked sub-account</li>
                  <li>Withholding tax handled off-chain per the issuer's tax regime (out of scope for this demo)</li>
                </ol>
                <LegalRefs ids={["pontes", "es-rd814", "csdr"]} className="mt-3" />
              </Card>
            </div>
            <div className="space-y-5">
              <EventLog bondId={id} types={["RecordDateSnapshot", "CouponPaid", "CouponRunComplete", "Redeemed", "Matured", "RegistrarMigrated", "RoleGranted", "Paused", "Unpaused", "Reconciled", "RegisterSnapshot"]} title="Servicing events" />
              <Card title="Exceptional events and how ORBIT handles them">
                <div className="space-y-3 text-[13px]">
                  {[
                    ["Bail-in of a bank issuer", "The resolution authority's order is hashed as legalRef. The registrar runs a write-down (burn) or a conversion (burn plus mint of the new instrument) pro-rata across all holders in one transaction.", ["brrd"]],
                    ["Registrar insolvency", "Holders' positions are not part of the registrar's estate. The issuer appoints a successor and the REGISTRAR_ROLE migrates, as in the KfW precedent.", ["es-lmvsi", "de-ewpg"]],
                    ["RL1 outage", "Seturion halts trading. The golden copy prevails per the T&Cs. If the outage persists, the contingency plan moves the register to a successor ledger (RD 814/2023).", ["es-rd814", "dora"]],
                    ["Sanctions hit on a holder", "The registrar freezes the tokens and pays coupons into a blocked account; the freeze is lifted only on a competent-authority release.", ["amlr"]],
                    ["Lost investor keys", "The custodian proves identity, the registrar runs forcedTransfer to a new wallet, and the old address is de-registered.", ["gdpr"]],
                  ].map(([h, d, l]) => (
                    <div key={h as string}><div className="font-semibold">{h as string}</div><p className="muted mt-0.5">{d as string}</p><LegalRefs ids={l as string[]} className="mt-1" /></div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
      {!live && <Callout tone="warn" title="Not issued yet">Settle this tranche to service it.</Callout>}
    </>
  );
}
