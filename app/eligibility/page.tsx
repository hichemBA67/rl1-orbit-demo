"use client";
import { useState } from "react";
import { BondPicker, Callout, Card, EventLog, LegalRefs, PageHead, Tabs } from "@/components/ui";
import { COUNTRY, ISSUERS, isinOf, issuerById } from "@/lib/data/scenario";
import { ILLUSTRATIVE_HAIRCUT, checkEligibility, isEligible, pledgeCheck } from "@/lib/eligibility";
import { holderName, useStore } from "@/lib/store";
import { cx, money } from "@/lib/util";

type T = "oekb" | "check" | "matrix" | "pledge";

export default function Eligibility() {
  const [tab, setTab] = useState<T>("oekb");
  return (
    <>
      <PageHead eyebrow="05 · OeKB CSD & Eurosystem" title="How OeKB's “rubber stamp” makes Erste and RBI ECB-eligible">
        Since <b>30 March 2026</b> the Eurosystem accepts DLT-based marketable assets <b>issued through CSD-operated DLT services</b>, provided they
        meet every standard criterion and sit in an eligible SSS reachable via T2S (ECB, 27 Jan 2026). Assets that exist only on DLT, outside eligible
        SSSs, are still under study. OeKB CSD is the bridge between those two categories.
      </PageHead>
      <Tabs<T> value={tab} onChange={setTab} tabs={[{ id: "oekb", label: "What OeKB does" }, { id: "check", label: "Eligibility checker (what-if)" }, { id: "matrix", label: "All tranches" }, { id: "pledge", label: "Pledge via ECMS" }]} />
      {tab === "oekb" && <Oekb />}
      {tab === "check" && <Checker />}
      {tab === "matrix" && <Matrix />}
      {tab === "pledge" && <PledgeSim />}
    </>
  );
}

function Oekb() {
  const items = [
    ["Issuer CSD", "Erste and RBI choose OeKB CSD as issuer CSD (CSDR Art. 49). OeKB performs the notary and central-maintenance services for the issue."],
    ["Global note in collective custody", "The signed Sammelurkunde for EUR 100m is deposited with OeKB in collective custody (Depotgesetz). Legal title rests on Austrian custody law, which works without any Austrian DLT-securities statute."],
    ["CSD-operated DLT service", "OeKB deploys and operates the BondToken on RL1 under CSD_OPERATOR_ROLE. Token balances are OeKB's book entries. Transfers settled by Seturion run through OeKB's contract and are CSD book-entry movements."],
    ["ISIN as national numbering agency", "OeKB allocates AT0000ORBE1x and AT0000ORBR2x (illustrative). An AT ISIN at an Austrian CSD signals place of issue in the EEA."],
    ["Integrity of issue", "Intraday reconciliation: Σ token balances = global-note amount (CSDR Art. 37). A mismatch pauses the contract."],
    ["T2S reachability", "Positions can be realigned to Eurosystem collateral accounts via T2S. ECMS sees the asset like any other OeKB-issued bond."],
    ["Eligibility submission", "OeKB/the issuer submits the eligibility request to OeNB. After assessment the ISINs are added to the Eligible Assets Database."],
  ];
  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
      <div className="space-y-2">
        {items.map(([t, d], k) => (
          <div key={t} className="card flex gap-4 p-4">
            <span className="mono flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[var(--ok-soft)] text-[12px] text-ok">{k + 1}</span>
            <div><div className="font-semibold">{t}</div><p className="muted mt-1 text-[13.5px] leading-relaxed">{d}</p></div>
          </div>
        ))}
      </div>
      <div className="space-y-5">
        <Card title="Timeline">
          <ol className="space-y-3 text-[13px]">
            {[
              ["2024", "Eurosystem exploratory work on DLT settlement in central-bank money (Seturion tested with six German banks)"],
              ["Jun 2025", "ECMS goes live, a single collateral management system for the Eurosystem"],
              ["27 Jan 2026", "ECB announces acceptance of DLT-based assets issued in CSD-operated DLT services"],
              ["30 Mar 2026", "Acceptance applies"],
              ["2026", "Pontes pilot: DLT ↔ T2 settlement in central-bank money (used e.g. for KfW coupons on RL1)"],
              ["Oct 2026", "Seturion obtains its DLT TSS licence"],
              ["10 Dec 2026", "ORBIT issue date: Erste and RBI tranches settle through OeKB + Pontes"],
              ["Next", "Phase 2: possible acceptance of DLT-only assets outside eligible SSSs (staggered, under study)"],
            ].map(([d, t]) => (
              <li key={d} className="flex gap-3"><span className="mono w-24 flex-none text-accent">{d}</span><span className="muted">{t}</span></li>
            ))}
          </ol>
        </Card>
        <LegalRefs ids={["ecb-gd", "ecb-dlt-2026", "csdr", "at-depg", "pontes", "at-boerseg"]} />
      </div>
    </div>
  );
}

function Checker() {
  const { s } = useStore();
  const [id, setId] = useState("erste");
  const issuer = issuerById(id);
  const [ccy, setCcy] = useState<"USD" | "EUR">(s.bonds[id].ccy);
  const [route, setRoute] = useState<"AT_CSD_DLT" | "PILOT_ONLY">(issuer.registerModel === "AT_CSD_DLT" ? "AT_CSD_DLT" : "PILOT_ONLY");
  const [reg, setReg] = useState(issuer.registerModel === "AT_CSD_DLT");
  const pick = (x: string) => {
    const i = issuerById(x);
    setId(x);
    setCcy(s.bonds[x].ccy);
    setRoute(i.registerModel === "AT_CSD_DLT" ? "AT_CSD_DLT" : "PILOT_ONLY");
    setReg(i.registerModel === "AT_CSD_DLT");
  };
  const crit = checkEligibility({ issuer, ccy, routeOverride: route, listedRegulated: reg });
  const ok = isEligible(crit);
  return (
    <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
      <Card title="What-if inputs">
        <div className="space-y-4">
          <BondPicker value={id} onChange={pick} />
          <div><label className="lbl">Denomination</label>
            <div className="flex gap-1">{(["EUR", "USD"] as const).map((c) => <button key={c} className={cx("btn btn-sm flex-1", ccy === c && "btn-primary")} onClick={() => setCcy(c)}>{c}</button>)}</div></div>
          <div><label className="lbl">Issuance / settlement route</label>
            <div className="flex flex-col gap-1">
              <button className={cx("btn btn-sm", route === "AT_CSD_DLT" && "btn-primary")} onClick={() => setRoute("AT_CSD_DLT")}>CSD-operated DLT (e.g. OeKB CSD)</button>
              <button className={cx("btn btn-sm", route === "PILOT_ONLY" && "btn-primary")} onClick={() => setRoute("PILOT_ONLY")}>DLT register / Pilot TSS only</button>
            </div></div>
          <div><label className="lbl">Regulated-market listing</label>
            <div className="flex gap-1"><button className={cx("btn btn-sm flex-1", reg && "btn-primary")} onClick={() => setReg(true)}>Yes</button><button className={cx("btn btn-sm flex-1", !reg && "btn-primary")} onClick={() => setReg(false)}>No</button></div></div>
          <p className="dim text-[11.5px]">These toggles are hypothetical. They do not change the simulated tranche. The real currency of a draft tranche is set on the Primary page.</p>
        </div>
      </Card>
      <div className="space-y-4">
        <div className={cx("rounded-xl p-5", ok ? "bg-[var(--ok-soft)]" : "bg-[var(--bad-soft)]")}>
          <div className={cx("text-[22px] font-semibold", ok ? "text-ok" : "text-bad")}>{ok ? "Eligible as Eurosystem collateral" : "Not eligible"}</div>
          <div className="muted mt-1 text-[13px]">{COUNTRY[issuer.country].flag} {issuer.issuer} · {isinOf(issuer)} · {ccy} · {route === "AT_CSD_DLT" ? "CSD-operated DLT" : "DLT-only"}</div>
        </div>
        <Card pad={false}>
          {crit.map((c) => (
            <div key={c.key} className="flex gap-3 border-b border-line px-4 py-3 last:border-0">
              <span className={cx("mono mt-0.5 text-[15px]", c.pass ? "text-ok" : "text-bad")}>{c.pass ? "✓" : "✗"}</span>
              <div><div className="font-medium text-[13.5px]">{c.label}</div><div className="muted text-[12.5px]">{c.detail}</div></div>
            </div>
          ))}
        </Card>
        <LegalRefs ids={["ecb-gd", "ecb-dlt-2026"]} />
      </div>
    </div>
  );
}

function Matrix() {
  const { s } = useStore();
  const keys = checkEligibility({ issuer: ISSUERS[0], ccy: "USD" }).map((c) => c.key);
  const short: Record<string, string> = { type: "Type", coupon: "Coupon", subord: "Non-sub", ccy: "EUR", issuer: "EEA issuer", law: "EEA law", sss: "Eligible SSS", market: "Accept. market", cqs: "CQS ≤3" };
  return (
    <Card pad={false} title="Eligibility matrix: current tranche configuration">
      <div className="scroll-x">
        <table className="t">
          <thead><tr><th>Tranche</th>{keys.map((k) => <th key={k} className="text-center">{short[k]}</th>)}<th>Verdict</th></tr></thead>
          <tbody>
            {ISSUERS.map((i) => {
              const c = checkEligibility({ issuer: i, ccy: s.bonds[i.id].ccy });
              return (
                <tr key={i.id}>
                  <td>{COUNTRY[i.country].flag} {i.brand} <span className="dim">· {s.bonds[i.id].ccy}</span></td>
                  {c.map((x) => <td key={x.key} className={cx("text-center mono", x.pass ? "text-ok" : "text-bad")}>{x.pass ? "✓" : "✗"}</td>)}
                  <td>{isEligible(c) ? <span className="chip chip-ok">eligible</span> : <span className="chip chip-bad">not eligible</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PledgeSim() {
  const st = useStore();
  const { s } = st;
  const [id, setId] = useState("erste");
  const issuer = issuerById(id);
  const b = s.bonds[id];
  const holders = Object.entries(s.hold[id] ?? {}).filter(([, h]) => h.bal > 0);
  const [pledgor, setPledgor] = useState("t-rbi");
  const [nominal, setNominal] = useState(10_000_000);
  const [hc, setHc] = useState(ILLUSTRATIVE_HAIRCUT);
  const [msg, setMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const pledgorEff = holders.some(([h]) => h === pledgor)
    ? pledgor
    : holders.find(([h]) => pledgeCheck(h, issuer).ok)?.[0] ?? holders[0]?.[0] ?? "";
  const pc = pledgeCheck(pledgorEff, issuer);
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
      <div className="space-y-5">
        <Card title="Mobilise collateral to OeNB">
          {b.status !== "settled" ? (
            <div className="space-y-3">
              <Callout tone="warn">The {issuer.brand} tranche must be issued first.</Callout>
              <button className="btn btn-primary btn-sm" onClick={() => { if (b.status === "draft") st.price(id, issuer.fairSpread + 5); st.settle(id); }}>Price & settle {issuer.brand}</button>
            </div>
          ) : (
            <div className="grid gap-3">
              <BondPicker value={id} onChange={setId} filter={(x) => issuerById(x).registerModel === "AT_CSD_DLT"} />
              <div><label className="lbl">Pledgor (holder)</label>
                <select className="select" value={pledgorEff} onChange={(e) => setPledgor(e.target.value)}>
                  {holders.map(([h, v]) => <option key={h} value={h}>{holderName(h)} · {money(v.bal - v.pledged - v.frozen, b.ccy)} free</option>)}
                </select>
                <div className={cx("mt-1 text-[12px]", pc.ok ? "text-ok" : "text-bad")}>{pc.reason}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="lbl">Nominal (EUR)</label><input className="input mono" type="number" step={100000} value={nominal} onChange={(e) => setNominal(+e.target.value)} /></div>
                <div><label className="lbl">Haircut % (illustrative)</label><input className="input mono" type="number" step={0.5} value={hc} onChange={(e) => setHc(+e.target.value)} /></div>
              </div>
              <button className="btn btn-primary" onClick={() => setMsg(st.pledge(id, pledgorEff, nominal, hc))}>Instruct ECMS pledge</button>
              {msg && <div className={cx("rounded-lg p-2.5 text-[12.5px]", msg.ok ? "bg-[var(--ok-soft)] text-ok" : "bg-[var(--bad-soft)] text-bad")}>{msg.msg}</div>}
              <p className="dim text-[11.5px]">Try a pension fund or asset manager as pledgor: it is rejected because it is not a Eurosystem counterparty. Own-use (a bank pledging its own unsecured bonds) and close links are rejected the same way. Haircut: category III (unsecured bank bonds), fixed coupon, about 3y residual. The number here is illustrative; use the current ECB haircut schedule.</p>
            </div>
          )}
        </Card>
        <Card title="Active pledges" pad={false}>
          <table className="t">
            <thead><tr><th>Pledgor</th><th>Bond</th><th className="r">Nominal</th><th className="r">Value after haircut</th><th /></tr></thead>
            <tbody>
              {s.pledges.length === 0 && <tr><td colSpan={5} className="dim">None</td></tr>}
              {s.pledges.map((p) => (
                <tr key={p.id}><td>{holderName(p.pledgor)}</td><td>{issuerById(p.bondId).brand}</td><td className="r mono">{money(p.nominal, "EUR")}</td><td className="r mono text-ok">{money(p.value, "EUR", 2)}</td>
                  <td><button className="btn btn-sm" onClick={() => st.release(p.id)}>release</button></td></tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Mobilisation flow">
          <ol className="list-decimal space-y-1.5 pl-5 text-[13px]">
            <li>Counterparty sends the mobilisation instruction to ECMS (OeNB as home NCB)</li>
            <li>ECMS checks eligibility (EADB), close links and own-use, then values the asset (price + accrued) and applies the haircut</li>
            <li>ECMS instructs OeKB CSD via T2S. OeKB realigns the position to OeNB's collateral account</li>
            <li>On RL1, OeKB sets an encumbrance on the pledgor's tokens: <span className="mono">encumber(wallet, amount, NCB_POOL)</span>. They cannot be transferred, but coupons still flow under the pledge terms</li>
            <li>Credit capacity grows in the counterparty's pool and can back MRO/LTRO or intraday credit in T2</li>
          </ol>
        </Card>
      </div>
      <EventLog types={["ECMSInstruction", "T2SRealignment", "CollateralValued", "CollateralReleased", "PontesLock"]} title="Eurosystem events" />
    </div>
  );
}
