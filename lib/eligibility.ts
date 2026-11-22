// Eurosystem eligibility checks for marketable assets, applied to ORBIT tranches.
// Criteria paraphrase Guideline (EU) 2015/510 and the ECB DLT decision (27 Jan 2026).
import { COUNTRY, type IssuerDef, investorById } from "./data/scenario";

export interface Criterion {
  key: string;
  label: string;
  pass: boolean;
  detail: string;
}

export interface EligInput {
  issuer: IssuerDef;
  ccy: "USD" | "EUR";
  /** Let the user override the settlement route on the ECB page. */
  routeOverride?: "AT_CSD_DLT" | "PILOT_ONLY";
  /** Scenario assumption: the Eurosystem has accepted Seturion as an acceptable non-regulated market. */
  seturionAccepted?: boolean;
  cqsOk?: boolean;
}

export const SETURION_ACCEPTED_ASSUMPTION = true;

export function checkEligibility({ issuer, ccy, routeOverride, seturionAccepted, cqsOk }: EligInput): Criterion[] {
  const csdRoute = routeOverride ? routeOverride === "AT_CSD_DLT" : true; // OeKB CSD is issuer CSD for every tranche
  const regulated = seturionAccepted ?? SETURION_ACCEPTED_ASSUMPTION;
  const eea = COUNTRY[issuer.country].eea;
  const cqs = cqsOk ?? !issuer.rating.startsWith("BB ");
  return [
    { key: "type", label: "Marketable debt instrument, fixed unconditional principal", pass: true, detail: "Bullet bond, redeems at 100% on 10 Dec 2029; no options or conditions on principal." },
    { key: "coupon", label: "Eligible coupon structure", pass: true, detail: "Fixed rate, so the coupon structure is eligible." },
    { key: "subord", label: "Not subordinated", pass: !issuer.seniority.toLowerCase().includes("subordinated"), detail: `${issuer.seniority}. Ranks above subordinated debt.` },
    {
      key: "ccy", label: "Denominated in euro", pass: ccy === "EUR",
      detail: ccy === "EUR" ? "EUR denomination." : "USD denomination. The Eurosystem only accepts marketable assets denominated in euro, so this criterion fails on its own whatever the infrastructure.",
    },
    {
      key: "issuer", label: "Issuer established in the EEA", pass: eea,
      detail: eea ? `${COUNTRY[issuer.country].name} is in the EEA.` : `${COUNTRY[issuer.country].name} is outside the EEA, so unsecured bank bonds of this issuer are not eligible.`,
    },
    {
      key: "law", label: "Governed by the law of an EEA Member State", pass: eea,
      detail: `${issuer.law}. ${eea ? "EEA law." : "Non-EEA governing law."}`,
    },
    {
      key: "sss", label: "Issued via an eligible SSS / CSD (T2S-reachable); DLT accepted only through a CSD-operated DLT service", pass: csdRoute,
      detail: csdRoute
        ? "Issued in OeKB CSD (CSDR-authorised, T2S-connected) through its DLT service. This is covered by the ECB decision of 27 Jan 2026, effective 30 Mar 2026."
        : "Recorded only in a DLT register outside an eligible SSS (Pilot Regime / national DLT register). The Eurosystem is still studying this category; it is not accepted today.",
    },
    {
      key: "market", label: "Admitted to a regulated market or an acceptable non-regulated market", pass: regulated,
      detail: regulated
        ? "Admitted to trading on the Seturion DLT TSS only, with no exchange listing. SCENARIO ASSUMPTION: the Eurosystem has assessed Seturion as an acceptable non-regulated market. This is not confirmed; without it, the criterion fails."
        : "Admitted only to the Seturion DLT TSS, which has not been assessed as an acceptable non-regulated market. With no regulated-market listing, the criterion fails.",
    },
    { key: "cqs", label: "Credit quality ≥ CQS 3 (BBB-) via an accepted ECAI", pass: cqs, detail: `Assumed issuer rating ${issuer.rating}.` },
  ];
}

export const isEligible = (c: Criterion[]) => c.every((x) => x.pass);

/** Close-links / own-use: can `pledgorId` pledge this issuer's bond to its NCB? */
export function pledgeCheck(pledgorId: string, issuer: IssuerDef): { ok: boolean; reason: string } {
  const inv = investorById(pledgorId);
  if (!inv) return { ok: false, reason: "Unknown holder" };
  if (!inv.eurosystemCounterparty) return { ok: false, reason: `${inv.name} is not a Eurosystem monetary-policy counterparty.` };
  if (inv.memberOf === issuer.id) return { ok: false, reason: `Own-use: ${inv.name} belongs to the issuer group. Banks may not pledge their own unsecured bank bonds.` };
  return { ok: true, reason: `${inv.name} has no close links with ${issuer.brand}. The pledge is allowed.` };
}

/** Illustrative haircut: category III (unsecured bank bonds), fixed coupon, 3y residual. */
export const ILLUSTRATIVE_HAIRCUT = 6.0;
