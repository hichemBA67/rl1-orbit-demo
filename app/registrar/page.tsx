"use client";
import { useState } from "react";
import { BondPicker, Callout, Card, EventLog, Hash, LegalRefs, PageHead, Tabs } from "@/components/ui";
import { COUNTRY, INVESTORS, PROGRAMME, investorById, isinOf, issuerById } from "@/lib/data/scenario";
import { JURIS_MATRIX } from "@/lib/data/legal";
import { complianceCheck, holderName, useStore, walletLabel, type TransferCheck } from "@/lib/store";
import { cx, hash32, money } from "@/lib/util";

type T = "concept" | "live" | "roles" | "migrate";

export default function Registrar() {
  const [tab, setTab] = useState<T>("concept");
  return (
    <>
      <PageHead eyebrow="03 · Registrar" title="What “registrar” means, legally and technically">
        The registrar keeps the <b>legal record of who owns the bond</b>. On RL1 that record <i>is</i> the smart-contract state, but the
        legal effect of that state comes from national law (ERIR, DEEP, eWpG, CSD) or from contract. This module takes the role apart layer
        by layer, then lets you operate a live register.
      </PageHead>
      <Tabs<T> value={tab} onChange={setTab} tabs={[{ id: "concept", label: "Concept & layers" }, { id: "live", label: "Live register (operate it)" }, { id: "roles", label: "Keys, roles & powers" }, { id: "migrate", label: "Registrar migration" }]} />
      {tab === "concept" && <Concept />}
      {tab === "live" && <Live />}
      {tab === "roles" && <Roles />}
      {tab === "migrate" && <Migrate />}
    </>
  );
}

function Concept() {
  const layers = [
    { n: "L4", t: "Legal layer: the law that gives the record its effect", d: "Ley 6/2023 Art. 8 (ERIR) · CMF L.211-7 (DEEP) · eWpG §16–§17 (crypto-securities register) · Depotgesetz + CSDR (OeKB global note) · contract (NL/GB). It decides whether an entry is title, evidence of title, or only a mirror.", c: "text-violet-300" },
    { n: "L3", t: "Registrar: the accountable legal person", d: "Licensed or designated entity that keeps the register, answers for its accuracy, runs corrections, applies court orders and keeps the off-chain identity mapping. It holds REGISTRAR_ROLE keys in HSM/MPC custody with an m-of-n quorum.", c: "text-accent" },
    { n: "L2", t: "Smart-contract state: the register itself", d: "mapping(address ⇒ balance), frozen, encumbered, totalSupply, termsHash, ISIN. Every transfer updates it atomically. For ES/FR/DE this state is the legal register. For AT it is the CSD's book-entry layer behind the global note.", c: "text-ok" },
    { n: "L1", t: "RL1 ledger: replication & finality", d: "Permissioned EVM network run by the RL1 SCE. Validators order transactions and BFT consensus makes a block final. RL1 does not decide ownership; it guarantees that all nodes hold the same state.", c: "text-warn" },
    { n: "L0", t: "Off-chain: identity & golden copy", d: "KYC files, legal names, LEIs and the address ↔ holder mapping (GDPR: kept off-chain). A golden-copy export is reconciled against the chain each day, which is the contingency required for example by RD 814/2023.", c: "muted" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        {layers.map((l) => (
          <div key={l.n} className="card flex gap-4 p-4">
            <div className={cx("mono w-10 flex-none text-[18px] font-bold", l.c)}>{l.n}</div>
            <div><div className="font-semibold">{l.t}</div><p className="muted mt-1 text-[13.5px] leading-relaxed">{l.d}</p></div>
          </div>
        ))}
      </div>

      <Card title="One word, five legal concepts" pad={false}>
        <div className="scroll-x">
          <table className="t">
            <thead><tr><th>Jurisdiction</th><th>Basis</th><th>Registrar concept</th><th>Securities form</th><th>How title moves</th><th>NNA</th></tr></thead>
            <tbody>
              {JURIS_MATRIX.map((r) => (
                <tr key={r.cc}>
                  <td>{COUNTRY[r.cc].flag} <b>{COUNTRY[r.cc].name}</b><div className="dim text-[11px]">{r.issuers}</div></td>
                  <td><span className={cx("chip", r.statutoryBasis === "Yes" ? "chip-ok" : r.statutoryBasis === "CSD route" ? "chip-accent" : "chip-warn")}>{r.statutoryBasis}</span><div className="dim mt-1 text-[11px]">{r.statute}</div></td>
                  <td>{r.registrarConcept}</td>
                  <td className="muted">{r.form}</td>
                  <td className="muted">{r.transfer}</td>
                  <td className="muted">{r.nna}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="What the registrar does">
          <ul className="list-disc space-y-1.5 pl-5 text-[13.5px]">
            <li><b>Initial entry:</b> records the issue (issue volume, nominal, ISIN, T&Cs hash) and mints exactly the issue amount, which is the integrity-of-issue principle</li>
            <li><b>Eligibility of holders:</b> only identities with valid claims can hold. The registrar (or delegated custodians) issues the claims</li>
            <li><b>Transfers:</b> processes holder-signed transfers and venue settlement, rejecting any that break the T&Cs (Reg S, denomination, KYC)</li>
            <li><b>Encumbrances:</b> records pledges and freezes (court orders, sanctions, insolvency administrator requests)</li>
            <li><b>Corrections:</b> forced transfer after due process: lost keys, error correction, inheritance, resolution action (bail-in)</li>
            <li><b>Corporate actions:</b> record-date snapshot for the paying agent; redemption and burn</li>
            <li><b>Reporting:</b> register extracts to holders and issuer; CNMV (ES) and BaFin (DE) publications; reconciliation with the golden copy</li>
            <li><b>Continuity:</b> contingency plan and migration capability (to a new registrar or a new network)</li>
          </ul>
        </Card>
        <Card title="What the registrar cannot do (by design)">
          <ul className="list-disc space-y-1.5 pl-5 text-[13.5px]">
            <li>Mint beyond the issue amount: <span className="mono">totalSupply ≤ issueAmount</span> is enforced in the contract, so increases need an ISSUER_ROLE tap with new Final Terms</li>
            <li>Move tokens without a logged legal reference: <span className="mono">forcedTransfer(from, to, amt, bytes32 legalRef)</span> requires a 3-of-5 quorum and emits an event</li>
            <li>Settle trades: only Seturion's SETTLEMENT_ROLE can run DvP for venue trades</li>
            <li>See personal data on-chain: there is none; the mapping lives in the registrar's own systems</li>
            <li>Rewrite history: RL1 finality makes every past state auditable</li>
          </ul>
          <div className="mt-4"><LegalRefs ids={["es-lmvsi", "fr-cmf", "de-ewpg", "at-depg", "csdr", "gdpr", "nl-bw"]} /></div>
        </Card>
      </div>
    </div>
  );
}

function Live() {
  const st = useStore();
  const { s } = st;
  const settledIds = Object.values(s.bonds).filter((b) => b.status === "settled").map((b) => b.id);
  const [id, setId] = useState(settledIds[0] ?? "caixa");
  const [view, setView] = useState<"legal" | "chain">("legal");
  const b = s.bonds[id];
  const issuer = issuerById(id);
  const holders = Object.entries(s.hold[id] ?? {}).filter(([, h]) => h.bal > 0).sort((a, c) => c[1].bal - a[1].bal);
  const total = holders.reduce((a, [, h]) => a + h.bal, 0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("lutetia");
  const [amt, setAmt] = useState(1_000_000);
  const [result, setResult] = useState<TransferCheck | null>(null);
  const [ref, setRef] = useState("Court order LG Wien 12 Cg 34/26");
  const fromId = from || holders[0]?.[0] || "";
  const preview = fromId ? complianceCheck(s, id, fromId, to, amt) : null;

  if (b.status !== "settled") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3"><BondPicker value={id} onChange={setId} /></div>
        <Callout tone="warn" title="This tranche has no register yet">
          The register comes into existence when the tranche settles.
          <div className="mt-3 flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => { if (b.status === "draft") st.price(id, issuer.fairSpread + 5); st.settle(id); }}>Price & settle {issuer.brand} now</button>
            <button className="btn btn-sm" onClick={st.quickIssueAll}>Issue all 13</button>
          </div>
        </Callout>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <BondPicker value={id} onChange={(x) => { setId(x); setFrom(""); setResult(null); }} />
        <div>
          <label className="lbl">View</label>
          <div className="flex gap-1">
            <button className={cx("btn btn-sm", view === "legal" && "btn-primary")} onClick={() => setView("legal")}>Registrar's legal view</button>
            <button className={cx("btn btn-sm", view === "chain" && "btn-primary")} onClick={() => setView("chain")}>Public chain view</button>
          </div>
        </div>
        <div className="ml-auto text-right text-[12px]">
          <div className="dim">Registrar</div><div>{b.registrarName}</div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card title={view === "legal" ? `Register of holders · ${isinOf(issuer)}` : `BondToken ${b.contract.slice(0, 10)}… · balanceOf()`} pad={false}
          right={<span className={cx("chip", total === PROGRAMME.size ? "chip-ok" : "chip-warn")}>Σ {money(total, b.ccy)} {total === PROGRAMME.size ? "= issue amount ✓" : ""}</span>}>
          <div className="scroll-x">
            <table className="t">
              <thead>
                <tr>
                  <th>{view === "legal" ? "Holder (off-chain identity)" : "Address"}</th>
                  {view === "legal" && <th>Custody / account</th>}
                  <th className="r">Balance</th><th className="r">Frozen</th><th className="r">Pledged</th><th className="r">%</th>
                </tr>
              </thead>
              <tbody>
                {holders.map(([hid, h]) => {
                  const inv = investorById(hid);
                  return (
                    <tr key={hid} onClick={() => setFrom(hid)} className={cx("cursor-pointer", fromId === hid && "bg-[var(--accent-soft)]")}>
                      <td>
                        {view === "legal" ? <>{inv ? COUNTRY[inv.country].flag : ""} {holderName(hid)}</> : <Hash v={walletLabel(hid)} n={8} />}
                        {view === "chain" && <div className="dim mono text-[10.5px]">claims: KYC✓ CAT✓ {inv?.usPerson ? "US" : "nonUS"}</div>}
                      </td>
                      {view === "legal" && <td className="muted text-[12px]">{inv?.custodian}</td>}
                      <td className="r mono">{money(h.bal, b.ccy)}</td>
                      <td className={cx("r mono", h.frozen ? "text-warn" : "dim")}>{h.frozen ? money(h.frozen, b.ccy) : "—"}</td>
                      <td className={cx("r mono", h.pledged ? "text-violet-300" : "dim")}>{h.pledged ? money(h.pledged, b.ccy) : "—"}</td>
                      <td className="r mono dim">{((h.bal / PROGRAMME.size) * 100).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="dim border-t border-line px-4 py-2 text-[11.5px]">
            {view === "legal" ? "Only the registrar sees names. Click a row to select it as the sender." : "What any RL1 node sees: addresses, balances and claim flags. No names, no personal data."}
          </div>
        </Card>

        <div className="space-y-5">
          <Card title="Operate the register">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="lbl">From (selected holder)</label>
                <select className="select" value={fromId} onChange={(e) => setFrom(e.target.value)}>{holders.map(([h]) => <option key={h} value={h}>{holderName(h)}</option>)}</select></div>
              <div><label className="lbl">To</label>
                <select className="select" value={to} onChange={(e) => setTo(e.target.value)}>{INVESTORS.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
              <div><label className="lbl">Nominal ({b.ccy})</label>
                <input className="input mono" type="number" step={1000} value={amt} onChange={(e) => setAmt(+e.target.value)} /></div>
            </div>
            {preview && (
              <div className="mt-3 rounded-lg border border-line p-3 text-[12px]">
                <div className="eyebrow mb-1.5">ComplianceModule.canTransfer() preview</div>
                {preview.passed.map((p) => <div key={p} className="text-ok">✓ {p}</div>)}
                {preview.reasons.map((p) => <div key={p} className="text-bad">✗ {p}</div>)}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn btn-primary btn-sm" onClick={() => setResult(st.transfer(id, fromId, to, amt))}>transfer() — holder-signed</button>
              <button className="btn btn-sm" onClick={() => st.freeze(id, fromId, amt, "Garnishment order, pending court decision")}>freeze()</button>
              <button className="btn btn-sm" onClick={() => st.unfreeze(id, fromId)}>unfreeze()</button>
              <button className="btn btn-sm" onClick={() => st.setPaused(id, !b.paused)}>{b.paused ? "unpause()" : "pause()"}</button>
            </div>
            <div className="mt-4 border-t border-line pt-3">
              <label className="lbl">Forced transfer legal reference (bytes32 hash on-chain)</label>
              <input className="input" value={ref} onChange={(e) => setRef(e.target.value)} />
              <div className="dim mono mt-1 text-[10.5px]">legalRef = {hash32("legal" + ref).slice(0, 26)}…</div>
              <button className="btn btn-bad btn-sm mt-2" onClick={() => setResult(st.forced(id, fromId, to, amt, ref))}>forcedTransfer(): registrar 3-of-5 quorum</button>
              <p className="dim mt-2 text-[11.5px]">Skips holder signature and receiver claims (e.g. lost keys, inheritance, court order, bail-in) but still respects denomination and balance rules.</p>
            </div>
            {result && (
              <div className={cx("mt-3 rounded-lg p-3 text-[12.5px]", result.ok ? "bg-[var(--ok-soft)] text-ok" : "bg-[var(--bad-soft)] text-bad")}>
                {result.ok ? "Executed and final on RL1." : "Reverted: " + result.reasons.join(" ")}
              </div>
            )}
          </Card>
          <Callout title="Try these">
            Transfer to <b>Hudson Ridge</b> (US person → Reg S revert) or <b>Baltic Credit Union</b> (KYC expired). Send $150,000 (below the minimum denomination).
            Freeze a holder and then try to move more than its free balance. A forced transfer to Baltic succeeds, because the registrar's legal override skips receiver claims.
          </Callout>
        </div>
      </div>
      <EventLog bondId={id} title="Register events" />
    </div>
  );
}

function Roles() {
  const roles = [
    ["DEFAULT_ADMIN_ROLE", "Issuer + registrar joint multisig (2-of-2 entities, each internally m-of-n)", "Grant / revoke roles; replaced only on registrar migration", "T&Cs; Registrar Agreement"],
    ["REGISTRAR_ROLE", "Registrar: 3-of-5 HSM-backed keys, MPC", "mint (≤ issue amount), burn on redemption, freeze, forcedTransfer, identity binding", "Ley 6/2023 Art. 8 · CMF L.211-3 · eWpG §16 · CSDR (AT)"],
    ["CSD_OPERATOR_ROLE", "OeKB CSD (Austrian tranches only)", "Same as registrar, plus T2S realignment hooks and encumbrance for Eurosystem pledges", "CSDR · Depotgesetz"],
    ["ISSUER_ROLE", "Issuer treasury, 2-of-3", "Request tap issues; fund coupons; trigger redemption; anchor new termsHash", "T&Cs"],
    ["SETTLEMENT_ROLE", "Seturion DLT TSS", "settleDvP(tradeId,…) between whitelisted wallets; cannot mint, burn or freeze", "DLT Pilot Regime Art. 5–6; TSS rulebook"],
    ["PAYING_AGENT_ROLE", "Cecabank", "snapshot(recordDate); distribute coupons from the funded pool", "Agency Agreement"],
    ["PAUSER_ROLE", "Registrar + RL1 incident desk", "Pause all transfers (incident, migration cut-off)", "DORA incident procedures"],
    ["CLAIM_ISSUER", "Registrars, custodians", "Add/revoke KYC, category and US-person claims in IdentityRegistry", "AML framework; MiFID II client categorisation"],
  ];
  return (
    <div className="space-y-5">
      <Card title="Role-based access control on each BondToken" pad={false}>
        <div className="scroll-x">
          <table className="t">
            <thead><tr><th>Role</th><th>Held by</th><th>Powers</th><th>Legal anchor</th></tr></thead>
            <tbody>{roles.map((r) => <tr key={r[0]}><td className="mono text-accent">{r[0]}</td><td>{r[1]}</td><td className="muted">{r[2]}</td><td className="dim text-[12px]">{r[3]}</td></tr>)}</tbody>
          </table>
        </div>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Key management">
          <ul className="list-disc space-y-1.5 pl-5 text-[13.5px]">
            <li>Registrar keys sit in FIPS 140-3 Level 3 HSMs or an MPC wallet. Quorum signing (3-of-5) is mandatory for forcedTransfer and burn</li>
            <li>Key ceremony at T-30, witnessed and minuted. Key IDs are bound to the role grants on-chain</li>
            <li>Investor keys are held by custodians (most investors) or directly (eligible counterparties). A lost key triggers the forced-transfer recovery flow to a new wallet</li>
            <li>Rotation: grant the new key, then revoke the old one. Both emit events, so the audit trail is continuous</li>
          </ul>
        </Card>
        <Card title="Reconciliation & integrity">
          <ul className="list-disc space-y-1.5 pl-5 text-[13.5px]">
            <li>Daily (intraday for AT): Σ balanceOf = totalSupply = issue amount − redeemed. Results are signed and archived (CSDR Art. 37 logic)</li>
            <li>Golden copy: an off-chain snapshot with the identity mapping, hash-anchored on-chain each day</li>
            <li>Any divergence pauses transfers and starts an incident (DORA Art. 17–19)</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Migrate() {
  const st = useStore();
  const { s } = st;
  const [id, setId] = useState("dz");
  const [to, setTo] = useState("LBBW Registry Services (scenario)");
  const b = s.bonds[id];
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
      <div className="space-y-5">
        <Callout tone="accent" title="Precedent on RL1">
          For its third DLT bond on RL1, KfW changed its registrar to DekaBank during the bond's life, the first registry migration of a live DLT bond. ORBIT reuses the same pattern:
          the ISIN, contract address and holder positions stay unchanged, and only the REGISTRAR_ROLE and the legal mandate move.
        </Callout>
        <Card title="Run a migration">
          <div className="grid gap-3">
            <BondPicker value={id} onChange={setId} filter={(x) => issuerById(x).registerModel !== "AT_CSD_DLT"} />
            <div><label className="lbl">New registrar</label><input className="input" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            <div className="dim text-[12px]">Current: {b.registrarName}</div>
            <button className="btn btn-primary" disabled={b.status !== "settled"} onClick={() => st.migrate(id, to)}>Execute migration</button>
            {b.status !== "settled" && <span className="chip chip-warn">Settle this tranche first</span>}
          </div>
        </Card>
        <Card title="Legal steps">
          <ol className="list-decimal space-y-1.5 pl-5 text-[13.5px]">
            <li>Issuer appoints the successor (new Registrar Agreement) and gives notice under the T&Cs</li>
            <li>DE: change of registerführende Stelle notified, BaFin list updated (eWpG). ES: new ERIR registered with the CNMV. FR: new teneur de registre for the DEEP</li>
            <li>Cut-off: transfers paused, golden copy exported, hash anchored</li>
            <li>Role swap on-chain: REGISTRAR_ROLE granted to the new registrar and revoked from the old one</li>
            <li>The successor reconciles and confirms, then transfers resume</li>
          </ol>
          <p className="dim mt-3 text-[12px]">Austrian tranches are excluded. Changing the issuer CSD is a CSD-link or migration project, not a registrar swap.</p>
        </Card>
      </div>
      <EventLog bondId={id} title="Migration events" />
    </div>
  );
}
