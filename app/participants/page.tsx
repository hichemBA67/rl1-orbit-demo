"use client";
import { useState } from "react";
import { Card, LegalRefs, PageHead, Tabs } from "@/components/ui";
import { COUNTRY, INFRA, INVESTORS, ISSUERS, VALIDATORS, isinOf } from "@/lib/data/scenario";
import { cx } from "@/lib/util";

type T = "infra" | "issuers" | "investors" | "raci";

const RACI: { act: string; cells: Record<string, string> }[] = [
  { act: "Mandate, book-building, allocation", cells: { Issuer: "A", Cecabank: "R", Registrar: "", Seturion: "", "OeKB CSD": "", RL1: "", Eurosystem: "" } },
  { act: "T&Cs under home law", cells: { Issuer: "A/R", Cecabank: "C", Registrar: "C", Seturion: "", "OeKB CSD": "C (AT)", RL1: "", Eurosystem: "" } },
  { act: "ISIN / CFI / FISN", cells: { Issuer: "I", Cecabank: "C", Registrar: "R", Seturion: "I", "OeKB CSD": "R (AT NNA)", RL1: "", Eurosystem: "" } },
  { act: "Deploy contract & grant roles", cells: { Issuer: "A", Cecabank: "I", Registrar: "R", Seturion: "I", "OeKB CSD": "R (AT)", RL1: "C", Eurosystem: "" } },
  { act: "Investor whitelisting (KYC claims)", cells: { Issuer: "", Cecabank: "R (own clients)", Registrar: "A", Seturion: "C", "OeKB CSD": "A (AT)", RL1: "", Eurosystem: "" } },
  { act: "Mint / integrity of issue", cells: { Issuer: "I", Cecabank: "", Registrar: "A/R", Seturion: "", "OeKB CSD": "A/R (AT)", RL1: "", Eurosystem: "" } },
  { act: "Primary DvP", cells: { Issuer: "I", Cecabank: "C", Registrar: "A", Seturion: "R", "OeKB CSD": "R (AT)", RL1: "C", Eurosystem: "R (EUR cash)" } },
  { act: "Secondary trading & settlement", cells: { Issuer: "", Cecabank: "", Registrar: "I", Seturion: "A/R", "OeKB CSD": "C (AT)", RL1: "C", Eurosystem: "" } },
  { act: "Freeze / forced transfer", cells: { Issuer: "C", Cecabank: "", Registrar: "A/R", Seturion: "I", "OeKB CSD": "A/R (AT)", RL1: "", Eurosystem: "" } },
  { act: "Coupons & redemption", cells: { Issuer: "A (funds)", Cecabank: "R (paying agent)", Registrar: "C (snapshot)", Seturion: "", "OeKB CSD": "R (AT)", RL1: "", Eurosystem: "R (EUR via Pontes)" } },
  { act: "Eurosystem eligibility & pledges", cells: { Issuer: "C", Cecabank: "", Registrar: "", Seturion: "", "OeKB CSD": "R", RL1: "", Eurosystem: "A" } },
  { act: "Network operation, finality", cells: { Issuer: "", Cecabank: "", Registrar: "", Seturion: "", "OeKB CSD": "", RL1: "A/R", Eurosystem: "" } },
];

export default function Participants() {
  const [tab, setTab] = useState<T>("infra");
  return (
    <>
      <PageHead eyebrow="01 · Who is who" title="Participants, roles & responsibilities">
        Each actor appears with its legal form, its supervisor and its ORBIT duties, and every duty is tied to a legal basis. The
        distinction that matters most: <b>RL1 is the shared ledger, the registrar keeps the legal record, Seturion runs the market</b>.
      </PageHead>
      <Tabs<T> value={tab} onChange={setTab} tabs={[{ id: "infra", label: "Infrastructure & agents" }, { id: "issuers", label: `Issuers (${ISSUERS.length})` }, { id: "investors", label: "Investors" }, { id: "raci", label: "RACI matrix" }]} />

      {tab === "infra" && (
        <div className="grid gap-4 xl:grid-cols-2">
          {INFRA.map((e) => (
            <Card key={e.id} title={<span>{COUNTRY[e.country].flag} {e.name}</span>} right={<div className="flex flex-wrap gap-1">{e.roles.map((r) => <span key={r} className="chip chip-accent">{r}</span>)}</div>}>
              <div className="grid gap-1 text-[12.5px]">
                <div><span className="dim">Legal form · </span>{e.legalForm}</div>
                <div><span className="dim">Supervisor · </span>{e.supervisor}</div>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed">{e.inOrbit}</p>
              <ul className="muted mt-3 list-disc space-y-1 pl-5 text-[13px]">
                {e.duties.map((d, k) => <li key={k}>{d}</li>)}
              </ul>
              {e.id === "rl1" && (
                <div className="mt-3">
                  <div className="eyebrow mb-1.5">Validator set (from RL1 public participant list)</div>
                  <div className="flex flex-wrap gap-1.5">{VALIDATORS.map((v) => <span key={v} className="chip">{v}</span>)}</div>
                </div>
              )}
              <LegalRefs ids={e.legal} className="mt-4" />
            </Card>
          ))}
        </div>
      )}

      {tab === "issuers" && (
        <div className="grid gap-4 xl:grid-cols-2">
          {ISSUERS.map((i) => (
            <Card key={i.id} title={<span>{COUNTRY[i.country].flag} {i.issuer}</span>} right={<span className={cx("chip", i.rl1 === "Non-member issuer" ? "" : i.rl1 === "Pending member" ? "chip-warn" : "chip-accent")}>{i.rl1}</span>}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12.5px]">
                <div><span className="dim">Governing law · </span>{i.law}</div>
                <div><span className="dim">ISIN · </span><span className="mono">{isinOf(i)}</span></div>
                <div><span className="dim">Registrar · </span>{i.registrarName}</div>
                <div><span className="dim">Seniority · </span>{i.seniority}</div>
                <div><span className="dim">Supervisor · </span>{i.supervisor}</div>
                <div><span className="dim">Rating (assumed) · </span>{i.rating}</div>
                <div className="col-span-2"><span className="dim">Resolution · </span>{i.bailIn}</div>
              </div>
              <ul className="muted mt-3 list-disc space-y-1 pl-5 text-[13px]">{i.notes.map((n, k) => <li key={k}>{n}</li>)}</ul>
            </Card>
          ))}
        </div>
      )}

      {tab === "investors" && (
        <Card pad={false} title="Demo investor universe" right={<span className="dim text-[12px]">Generic, fictional names. Two are deliberately non-compliant.</span>}>
          <div className="scroll-x">
            <table className="t">
              <thead><tr><th>Investor</th><th>Type</th><th>MiFID category</th><th>Custody / access</th><th>KYC valid until</th><th>Reg S</th><th>Eurosystem cpty</th></tr></thead>
              <tbody>
                {INVESTORS.map((v) => (
                  <tr key={v.id}>
                    <td>{COUNTRY[v.country].flag} <b>{v.name}</b></td>
                    <td>{v.type}</td>
                    <td>{v.mifid}</td>
                    <td className="muted">{v.custodian}</td>
                    <td className={cx("mono", v.kycValidUntil < "2026-12-10" && "text-bad")}>{v.kycValidUntil}</td>
                    <td>{v.usPerson ? <span className="chip chip-bad">US person: blocked</span> : <span className="chip chip-ok">non-US</span>}</td>
                    <td>{v.eurosystemCounterparty ? "yes" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "raci" && (
        <Card pad={false} title="RACI: Responsible · Accountable · Consulted · Informed">
          <div className="scroll-x">
            <table className="t">
              <thead><tr><th>Activity</th>{Object.keys(RACI[0].cells).map((k) => <th key={k}>{k}</th>)}</tr></thead>
              <tbody>
                {RACI.map((r) => (
                  <tr key={r.act}>
                    <td className="font-medium">{r.act}</td>
                    {Object.values(r.cells).map((c, k) => (
                      <td key={k} className={cx("mono text-[12px]", c.startsWith("A") ? "text-accent" : c.startsWith("R") ? "text-ok" : "muted")}>{c || "·"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
