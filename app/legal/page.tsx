"use client";
import { useEffect, useMemo, useState } from "react";
import { Callout, Card, PageHead, Tabs } from "@/components/ui";
import { GLOSSARY, JURIS_MATRIX, LEGAL, type Juris, type Topic } from "@/lib/data/legal";
import { COUNTRY } from "@/lib/data/scenario";
import { cx } from "@/lib/util";

type T = "library" | "matrix" | "conflict" | "glossary";
const JURIS: (Juris | "All")[] = ["All", "EU", "Eurosystem", "ES", "FR", "DE", "AT", "NL", "GB", "LU", "US"];
const TOPICS: (Topic | "All")[] = ["All", "DLT", "Market infrastructure", "Trading", "Offering", "Register & title", "Settlement finality", "Collateral", "Resolution", "ICT & data", "AML", "Conflict of laws", "Corporate"];

export default function Legal() {
  const [tab, setTab] = useState<T>("library");
  const [q, setQ] = useState("");
  const [j, setJ] = useState<Juris | "All">("All");
  const [tp, setTp] = useState<Topic | "All">("All");
  const [hl, setHl] = useState<string | null>(null);

  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (h) {
      setHl(h);
      setTimeout(() => document.getElementById(h)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    }
  }, []);

  const list = useMemo(() => {
    const ql = q.toLowerCase();
    return LEGAL.filter((l) => (j === "All" || l.juris === j) && (tp === "All" || l.topics.includes(tp)) && (!ql || [l.short, l.title, l.citation, l.summary, l.orbit, ...l.provisions].join(" ").toLowerCase().includes(ql)));
  }, [q, j, tp]);

  return (
    <>
      <PageHead eyebrow="08 · Legal basis" title="The legal stack behind every step">
        {LEGAL.length} instruments, each with what it does in general and what it does in ORBIT. Article references appear where the provision is
        well-established. This is an educational map, not legal advice: a real issue needs legal opinions in every jurisdiction involved.
      </PageHead>
      <Tabs<T> value={tab} onChange={setTab} tabs={[{ id: "library", label: "Library" }, { id: "matrix", label: "Jurisdiction matrix" }, { id: "conflict", label: "Conflict of laws" }, { id: "glossary", label: "Glossary" }]} />

      {tab === "library" && (
        <>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <input className="input" placeholder="Search: e.g. ERIR, Art. 37, finality, Reg S…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="select md:w-56" value={tp} onChange={(e) => setTp(e.target.value as Topic | "All")}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select>
          </div>
          <div className="mb-5 flex flex-wrap gap-1.5">
            {JURIS.map((x) => <button key={x} className={cx("btn btn-sm", j === x && "btn-primary")} onClick={() => setJ(x)}>{x}</button>)}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {list.map((l) => (
              <section key={l.id} id={l.id} className={cx("card scroll-mt-24", hl === l.id && "ring-2 ring-[var(--accent)]")}>
                <div className="card-h">
                  <div>
                    <div className="h3">{l.short}</div>
                    <div className="dim text-[11.5px]">{l.citation}</div>
                  </div>
                  <span className="chip chip-violet">{l.juris}</span>
                </div>
                <div className="card-b space-y-3 text-[13.5px]">
                  <div className="dim italic">{l.title}</div>
                  <p>{l.summary}</p>
                  <div className="rounded-lg bg-[var(--accent-soft)] p-3"><span className="eyebrow text-accent">In ORBIT · </span>{l.orbit}</div>
                  <ul className="muted list-disc space-y-1 pl-5 text-[12.5px]">{l.provisions.map((p) => <li key={p}>{p}</li>)}</ul>
                  <div className="flex flex-wrap gap-1">{l.topics.map((t) => <span key={t} className="chip">{t}</span>)}</div>
                </div>
              </section>
            ))}
          </div>
          {list.length === 0 && <div className="dim">No matches.</div>}
        </>
      )}

      {tab === "matrix" && (
        <Card pad={false}>
          <div className="scroll-x">
            <table className="t">
              <thead><tr><th>Jurisdiction</th><th>Statutory basis</th><th>Supervisors</th><th>Insolvency / resolution</th><th>Eurosystem route</th></tr></thead>
              <tbody>
                {JURIS_MATRIX.map((r) => (
                  <tr key={r.cc}>
                    <td>{COUNTRY[r.cc].flag} <b>{COUNTRY[r.cc].name}</b><div className="dim text-[11px]">{r.issuers}</div></td>
                    <td><span className={cx("chip", r.statutoryBasis === "Yes" ? "chip-ok" : r.statutoryBasis === "CSD route" ? "chip-accent" : "chip-warn")}>{r.statutoryBasis}</span><div className="muted mt-1 text-[12px]">{r.statute}</div></td>
                    <td className="muted text-[12.5px]">{r.supervisor}</td>
                    <td className="muted text-[12.5px]">{r.insolvency}</td>
                    <td className={cx("text-[12.5px]", r.ecbRoute.startsWith("ELIGIBLE") ? "text-ok" : "muted")}>{r.ecbRoute}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "conflict" && (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card title="Three different questions, three different laws">
            <div className="space-y-4 text-[13.5px]">
              <div><div className="font-semibold">1 · Contract: what does the issuer owe?</div><p className="muted mt-1">Governed by the chosen law of the T&Cs (Rome I Art. 3): Spanish for CaixaBank, French for CACEIS/Natixis/BFCM, Dutch for ABN AMRO, German for Deka/DZ/LBBW/Chartered, Austrian for Erste/RBI, English for Standard Chartered and NatWest.</p></div>
              <div><div className="font-semibold">2 · Property: who owns the bond, and how does it transfer?</div><p className="muted mt-1">For securities recorded in a register or account, the SFD (Art. 9(2)) and the FCD (Art. 9) point to the law of the place where the register or account is maintained. On a distributed ledger that place has to be <i>designated</i>. ORBIT fixes it through the statutory regime (the ERIR's Spain, the DEEP's France, the eWpG register's Germany, OeKB's Austria) and repeats it in the T&Cs and the TSS rulebook.</p></div>
              <div><div className="font-semibold">3 · Finality: when is a transfer irrevocable?</div><p className="muted mt-1">The rules of the designated system: Seturion's rulebook, plus TARGET rules for Pontes legs and OeKB/T2S rules for the Austrian tranches (SFD Art. 3, 5).</p></div>
            </div>
          </Card>
          <div className="space-y-5">
            <Callout tone="warn" title="Hard cases legal opinions must cover">
              <ul className="list-disc space-y-1 pl-5">
                <li>Dutch-law registered notes: does an on-chain signed instruction satisfy the deed of assignment and notification under BW 3:94?</li>
                <li>English-law notes traded on an EU DLT TSS: recognition of the English register in EU insolvency proceedings</li>
                <li>A French DEEP and a German crypto register on the same ledger: each tranche must name its own register location; validators' locations are irrelevant</li>
                <li>Austrian tranche held through Seturion participants: the chain from OeKB's book entry to the investor's custodian account</li>
              </ul>
            </Callout>
            <Callout tone="accent" title="Design rule used in ORBIT">
              One tranche, one registrar, one governing law for property, written into the T&Cs, the Registrar Agreement and the TSS rulebook. The shared ledger is infrastructure; it has no &ldquo;location&rdquo; of its own.
            </Callout>
          </div>
        </div>
      )}

      {tab === "glossary" && (
        <Card pad={false}>
          <table className="t"><tbody>{GLOSSARY.map(([k, v]) => <tr key={k}><td className="w-48 font-semibold">{k}</td><td className="muted">{v}</td></tr>)}</tbody></table>
        </Card>
      )}
    </>
  );
}
