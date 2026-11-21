"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArchDiagram } from "@/components/ArchDiagram";
import { Callout, Card, PageHead, Stat } from "@/components/ui";
import { COUNTRY, ISSUERS, PROGRAMME, isinOf } from "@/lib/data/scenario";
import { useStore } from "@/lib/store";
import { checkEligibility, isEligible } from "@/lib/eligibility";
import { compact, cx, fmtDate } from "@/lib/util";

const MODEL_LABEL: Record<string, string> = {
  ES_ERIR: "ERIR register (Ley 6/2023)",
  FR_DEEP: "DEEP inscription (CMF)",
  DE_EWPG: "Crypto-securities register (eWpG)",
  AT_CSD_DLT: "CSD-operated DLT (OeKB)",
  CONTRACTUAL: "Contractual register",
};

const MODULES = [
  { href: "/participants/", n: "01", t: "Participants & roles", d: "Every institution, its legal form, its supervisor, and exactly what it does in ORBIT." },
  { href: "/primary/", n: "02", t: "Primary market", d: "Steps from T-30 to T+2 per jurisdiction. Live book-building, pricing maths, allocation and atomic DvP issuance." },
  { href: "/registrar/", n: "03", t: "Registrar, technically", d: "What a 'registrar' means under each law and on-chain: register state, compliance, freezes, forced transfers, migration." },
  { href: "/secondary/", n: "04", t: "Seturion DLT TSS", d: "Order book with price-time priority, pre-trade checks, clean/dirty pricing, T+0 atomic settlement and MiFIR transparency." },
  { href: "/eligibility/", n: "05", t: "OeKB & ECB eligibility", d: "Why Erste and RBI go through OeKB CSD. Eligibility checker, close-links and own-use rules, ECMS pledge." },
  { href: "/lifecycle/", n: "06", t: "Lifecycle & servicing", d: "Coupon schedule, record dates, payments via Pontes or USD tokens, registrar migration, redemption and burn." },
  { href: "/architecture/", n: "07", t: "Architecture & contracts", d: "RL1 network, roles and keys, Solidity interfaces, ISO 20022 message map, data flows." },
  { href: "/legal/", n: "08", t: "Legal basis", d: "About 35 instruments across EU, Eurosystem, ES, FR, DE, AT, NL, GB, LU and US, with a jurisdiction matrix and glossary." },
];

export default function Home() {
  const { s, quickIssueAll } = useStore();
  const router = useRouter();
  const usdCount = ISSUERS.filter((i) => s.bonds[i.id].ccy === "USD").length;
  const eurCount = ISSUERS.length - usdCount;
  const totalEur = usdCount * (PROGRAMME.size / PROGRAMME.fx) + eurCount * PROGRAMME.size;
  const capPct = (totalEur / PROGRAMME.pilotCaps.dltMiAggregateEUR) * 100;

  return (
    <>
      <PageHead
        eyebrow="Regulated Layer One · Programme demo"
        title="RL1 ORBIT: thirteen issuers, six legal systems, one ledger"
        actions={
          <>
            <button className="btn btn-primary" onClick={() => { quickIssueAll(); router.push("/secondary/"); }}>
              ⚡ Issue all 13 & open Seturion
            </button>
            <Link href="/primary/" className="btn">Walk through primary →</Link>
          </>
        }
      >
        Cecabank coordinates a joint DLT bond programme on RL1. Eleven institutions, including Natixis, Crédit Mutuel Alliance Fédérale (via BFCM) and NatWest, each issue a <b>USD 100m</b> 3-year senior bond
        under the law of their home country. Erste Group and Raiffeisen Bank International issue <b>EUR 100m</b> each through{" "}
        <b>OeKB CSD</b>, which holds the global note, assigns the AT ISINs and runs a CSD-operated DLT service. That route makes
        them <b>Eurosystem-eligible</b>. All tranches trade and settle on the <b>Seturion DLT TSS</b>.
      </PageHead>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="Issuers" value={ISSUERS.length} sub="8 members · 1 pending (NatWest) · 4 non-members" />
        <Stat label="Jurisdictions" value="6" sub="ES · FR · NL · DE · AT · GB" />
        <Stat label="Register models" value="5" sub="ERIR · DEEP · eWpG · CSD · contractual" />
        <Stat label="Programme size" value={`${compact(usdCount * 1e8)} + ${compact(eurCount * 1e8, "EUR")}`} sub={`≈ €${(totalEur / 1e9).toFixed(2)}bn`} tone="accent" />
        <Stat label="Pilot cap used" value={`${capPct.toFixed(1)}%`} sub="of Seturion's €6bn DLT MI limit" tone="ok" />
      </div>

      <div className="mt-6">
        <Callout tone="warn" title="Why the Austrian tranches are in EUR, not USD">
          Eurosystem collateral must be <b>denominated in euro</b>. A USD bond fails that criterion whichever CSD or ledger it sits on.
          So the scenario keeps the USD 100m tranches for the other eleven issuers and gives Erste and RBI EUR 100m each. That way the
          OeKB route makes them eligible. You can switch them to USD on the <Link href="/eligibility/" className="text-accent underline">ECB page</Link> to watch the check fail.
        </Callout>
      </div>

      <Card title="System map" className="mt-6">
        <ArchDiagram />
      </Card>

      <h2 className="h2 mt-10 mb-4">Modules</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {MODULES.map((m) => (
          <Link key={m.href} href={m.href} className="card p-4 transition-colors hover:bg-[var(--bg-card-hover)]">
            <div className="mono text-accent text-[11px]">{m.n}</div>
            <div className="h3 mt-1">{m.t}</div>
            <p className="muted mt-1.5 text-[12.5px] leading-relaxed">{m.d}</p>
          </Link>
        ))}
      </div>

      <Card title="Tranches" className="mt-10" pad={false} right={<span className="dim text-[12px]">Pricing {fmtDate(PROGRAMME.pricingDate)} · Issue {fmtDate(PROGRAMME.issueDate)} · Maturity {fmtDate(PROGRAMME.maturityDate)}</span>}>
        <div className="scroll-x">
          <table className="t">
            <thead>
              <tr>
                <th>Issuer</th><th>Law</th><th>Register model</th><th>Registrar</th><th>ISIN</th><th>Ccy</th><th className="r">Coupon</th><th>Status</th><th>ECB</th>
              </tr>
            </thead>
            <tbody>
              {ISSUERS.map((i) => {
                const b = s.bonds[i.id];
                const el = isEligible(checkEligibility({ issuer: i, ccy: b.ccy }));
                return (
                  <tr key={i.id}>
                    <td><span className="mr-1.5">{COUNTRY[i.country].flag}</span><b>{i.brand}</b><div className="dim text-[11.5px]">{i.issuer}</div></td>
                    <td>{i.law}</td>
                    <td><span className="chip">{MODEL_LABEL[i.registerModel]}</span></td>
                    <td className="muted">{b.registrarName}</td>
                    <td className="mono">{isinOf(i)}</td>
                    <td>{b.ccy}</td>
                    <td className="r mono">{b.couponPct ? b.couponPct.toFixed(3) + "%" : "—"}</td>
                    <td><span className={cx("chip", b.status === "settled" ? "chip-ok" : b.status === "priced" ? "chip-accent" : b.status === "redeemed" ? "" : "chip-warn")}>{b.status}</span></td>
                    <td>{el ? <span className="chip chip-ok">eligible</span> : <span className="chip">no</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="dim mt-6 text-[12px] leading-relaxed">
        Status of facts as of {fmtDate("2026-11-21")}: RL1 operates as an SCE in Luxembourg (launched July 2026). Seturion received its DLT TSS licence from BaFin in October 2026.
        The Eurosystem accepts DLT-based marketable assets issued through CSD-operated DLT services from 30 March 2026. All issuances, spreads, ratings, ISINs, investors and role
        allocations in this demo are hypothetical.
      </p>
    </>
  );
}
