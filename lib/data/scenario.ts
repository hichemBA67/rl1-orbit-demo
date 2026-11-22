// The RL1 ORBIT scenario: who participates, which bonds are issued, who buys them.
// Everything here is a hypothetical demo scenario. Role allocations, spreads,
// ISINs, ratings and investors are illustrative assumptions, not facts about
// the named institutions.

import { addressOf, makeIsin } from "../util";
import type { CouponTerms } from "../finance";

export type Cc = "ES" | "FR" | "NL" | "DE" | "AT" | "GB" | "LU" | "PT" | "US" | "EE" | "IT" | "FI" | "CH" | "SG" | "EU";
export const COUNTRY: Record<Cc, { name: string; flag: string; eea: boolean; euro: boolean }> = {
  ES: { name: "Spain", flag: "🇪🇸", eea: true, euro: true },
  FR: { name: "France", flag: "🇫🇷", eea: true, euro: true },
  NL: { name: "Netherlands", flag: "🇳🇱", eea: true, euro: true },
  DE: { name: "Germany", flag: "🇩🇪", eea: true, euro: true },
  AT: { name: "Austria", flag: "🇦🇹", eea: true, euro: true },
  GB: { name: "United Kingdom", flag: "🇬🇧", eea: false, euro: false },
  LU: { name: "Luxembourg", flag: "🇱🇺", eea: true, euro: true },
  PT: { name: "Portugal", flag: "🇵🇹", eea: true, euro: true },
  US: { name: "United States", flag: "🇺🇸", eea: false, euro: false },
  EE: { name: "Estonia", flag: "🇪🇪", eea: true, euro: true },
  IT: { name: "Italy", flag: "🇮🇹", eea: true, euro: true },
  FI: { name: "Finland", flag: "🇫🇮", eea: true, euro: true },
  CH: { name: "Switzerland", flag: "🇨🇭", eea: false, euro: false },
  SG: { name: "Singapore", flag: "🇸🇬", eea: false, euro: false },
  EU: { name: "European Union", flag: "🇪🇺", eea: true, euro: true },
};

// ---------------------------------------------------------------------------
// Infrastructure & service providers
// ---------------------------------------------------------------------------
export type InfraRole =
  | "Network"
  | "DLT TSS"
  | "Coordinator"
  | "Registrar"
  | "CSD"
  | "NNA"
  | "Central bank"
  | "Supervisor"
  | "Exchange"
  | "Validator"
  | "Fund";

export interface Infra {
  id: string;
  name: string;
  country: Cc;
  roles: InfraRole[];
  legalForm: string;
  supervisor: string;
  inOrbit: string;
  duties: string[];
  legal: string[]; // ids in legal library
}

export const INFRA: Infra[] = [
  {
    id: "rl1",
    name: "Regulated Layer One SCE (RL1)",
    country: "LU",
    roles: ["Network"],
    legalForm: "European Cooperative Society (SCE), Luxembourg — one member, one vote",
    supervisor: "Not itself a licensed FMI; critical ICT third-party provider to licensed users (DORA)",
    inOrbit:
      "Owns and operates the permissioned, EVM-compatible DLT network on which every ORBIT bond token, identity registry, compliance module and cash-settlement token lives. RL1 does not hold assets or keep any legal register: it provides the shared ledger that registrars, Seturion and OeKB CSD write to.",
    duties: [
      "Network permissioning: admits member nodes and validator nodes under the cooperative's rulebook",
      "Consensus: BFT validator set gives deterministic (immediate) block finality, so a settled transfer cannot be reorganised",
      "Smart-contract allow-listing: only audited contract templates (BondToken v2, IdentityRegistry, ComplianceModule, DvPEscrow) can be deployed by registrar keys",
      "ICT resilience under DORA: incident reporting interfaces, exit plans and audit rights for the regulated users that depend on RL1",
      "Governance: protocol upgrades voted by members; validators operate under service-level agreements",
    ],
    legal: ["sce-reg", "dora", "gdpr", "lu-blockchain"],
  },
  {
    id: "seturion",
    name: "Seturion (Boerse Stuttgart Group)",
    country: "DE",
    roles: ["DLT TSS", "Exchange"],
    legalForm: "DLT Trading and Settlement System operator under Reg. (EU) 2022/858, licensed by BaFin (Oct 2026)",
    supervisor: "BaFin (licence granted in coordination with ESMA and the ECB)",
    inOrbit:
      "The only trading venue for all ORBIT bonds (no exchange listing anywhere) and the DvP engine for primary and secondary settlement. Its settlement instructions execute through OeKB CSD's DLT service, because OeKB is issuer CSD for every tranche. As a DLT TSS it combines what would otherwise be an MTF (multilateral trading) and a CSD-like settlement system in one licence, settling trades atomically on RL1.",
    duties: [
      "Admission of ORBIT bonds to trading; checks the Pilot Regime size caps (bond issue < €1bn; aggregate on the DLT MI ≤ €6bn)",
      "Central limit order book: price-time priority, pre- and post-trade transparency (MiFIR Art. 8 and 10, with deferrals under Art. 11)",
      "Atomic DvP settlement on RL1: the bond leg and the cash leg move in one transaction, or neither moves",
      "Settlement finality: the TSS rulebook defines the moment of entry and irrevocability, as required for a designated system under the Settlement Finality Directive",
      "Market surveillance and STOR reporting under MAR; transaction data to the national competent authority",
      "Holds SETTLEMENT_ROLE on each bond contract, granted by the registrar; cannot mint, burn or freeze",
    ],
    legal: ["dlt-pilot", "mifid2", "mifir", "sfd", "mar", "csdr", "dora"],
  },
  {
    id: "cecabank",
    name: "Cecabank, S.A.",
    country: "ES",
    roles: ["Coordinator", "Registrar"],
    legalForm: "Spanish credit institution (sociedad anónima); securities services and custody",
    supervisor: "Banco de España / ECB-SSM (prudential), CNMV (securities services)",
    inOrbit:
      "Programme coordinator of ORBIT: arranger and global coordinator for book-building, fiscal & paying agent for the USD tranches, calculation agent, and ERIR (registry entity) for the Spanish-law CaixaBank bond. Chartered Investment, not Cecabank, keeps the registers of the eight RL1 member tranches.",
    duties: [
      "Runs the ORBIT programme documentation set: Dealer Agreement, Agency Agreement, Registrar Agreement and the common Terms & Conditions template",
      "Runs the joint book across all 12 issuers: indications of interest, IPTs, guidance, final pricing, allocation file",
      "ERIR under Ley 6/2023 Art. 8 for CaixaBank: keeps the DLT register, which is the legal record of ownership of the Spanish bond",
      "Paying agent: collects coupon cash from issuers, runs record-date snapshots on RL1, and distributes coupons to token holders",
      "Contingency plan for the registry, as required by Real Decreto 814/2023, including an off-chain golden-copy fallback",
    ],
    legal: ["es-lmvsi", "es-rd814", "es-rd815", "csdr", "mifid2", "prospectus"],
  },
  {
    id: "caceis-ct",
    name: "CACEIS Corporate Trust",
    country: "FR",
    roles: ["Registrar"],
    legalForm: "French issuer-services entity of the CACEIS group (Crédit Agricole / Santander)",
    supervisor: "ACPR / AMF",
    inOrbit:
      "Keeps the register (teneur de registre) for the CACEIS Bank tranche. The register is a DEEP — a shared electronic recording device — under Code monétaire et financier Art. L.211-3 and L.211-7, run on RL1.",
    duties: [
      "Records holders in the DEEP. Inscription in the DEEP has the same legal effect as inscription in a securities account",
      "Keeps the identity mapping (address ↔ holder) off-chain, as the R.211-9-7 requirements on owner identification demand",
      "Keeps a business continuity plan and a periodic data copy of the DEEP",
    ],
    legal: ["fr-cmf", "fr-ord2017", "csdr"],
  },
  {
    id: "chartered",
    name: "Chartered Investment",
    country: "DE",
    roles: ["Registrar", "Fund"],
    legalForm: "German infrastructure provider for investment products; RL1 founding member",
    supervisor: "BaFin (registry licence under KWG §1(1a) sentence 2 no. 8 assumed for this scenario)",
    inOrbit:
      "Registrar for all eight RL1 member tranches (ABN AMRO, Crédit Mutuel/BFCM, DekaBank, DZ BANK, LBBW, Natixis, NatWest, Standard Chartered). It keeps the issuer-level register under each tranche's home law, and OeKB CSD is entered as holder of the whole issue. Chartered Investment also initiates the ORBIT special fund, which buys a basket of the bonds, and keeps that fund's unit register on RL1.",
    duties: [
      "DE tranches (Deka, DZ, LBBW): registerführende Stelle of a crypto-securities register (eWpG §16) with a collective entry (eWpG §8) held for OeKB CSD",
      "FR tranches (Natixis, BFCM): keeps the DEEP issuer register as the issuer's mandated agent (CMF L.211-3 / L.211-7)",
      "NL and GB tranches (ABN AMRO, NatWest, Standard Chartered): contractual registrar under the Agency Agreement",
      "Integrity: issuer-level register amount = OeKB global position = token totalSupply, reconciled daily",
      "Fund: registrar of the electronic fund units of the ORBIT special fund (KAGB §95 with eWpG)",
    ],
    legal: ["de-ewpg", "de-kwg", "fr-cmf", "nl-bw", "kagb"],
  },
  {
    id: "oekb",
    name: "OeKB CSD GmbH",
    country: "AT",
    roles: ["CSD", "NNA", "Registrar"],
    legalForm: "Austrian central securities depository authorised under CSDR; part of Oesterreichische Kontrollbank group",
    supervisor: "FMA (CSD authorisation); Oesterreichische Nationalbank (oversight)",
    inOrbit:
      "Issuer CSD for ALL 12 tranches. OeKB is the 'rubber stamp': it holds every global note (or is entered as holder of the collective entry), assigns AT ISINs to every tranche as Austria's national numbering agency, and runs the investor-level book entries as a CSD-operated DLT service on RL1. This puts every bond inside an eligible securities settlement system connected to T2S, the route the Eurosystem has accepted for DLT-based collateral since 30 March 2026.",
    duties: [
      "Holds the global certificate (Sammelurkunde) of each tranche in collective safe custody under the Austrian Depotgesetz, or is entered as holder of the issuer-level register (eWpG collective entry, DEEP, ERIR register, contractual register). The token balances on RL1 are the CSD's book-entry layer",
      "Assigns AT0000… ISINs to all 12 tranches as national numbering agency, plus CFI and FISN codes",
      "Integrity of the issue (CSDR Art. 37): daily reconciliation that token totalSupply equals the global-note amount",
      "T2S connectivity: positions can be realigned to Eurosystem accounts for collateral mobilisation via ECMS",
      "Supplies the eligibility file to OeNB for every tranche that meets the other criteria (EUR, EEA issuer and law) so the Eurosystem can assess the bonds and add them to the Eligible Assets Database",
    ],
    legal: ["csdr", "at-depg", "ecb-gd", "ecb-dlt-2026", "sfd"],
  },
  {
    id: "oenb",
    name: "Oesterreichische Nationalbank (OeNB)",
    country: "AT",
    roles: ["Central bank"],
    legalForm: "National central bank, part of the Eurosystem",
    supervisor: "—",
    inOrbit:
      "Home central bank for the Austrian counterparties. It receives the eligibility request for the Erste and RBI bonds and takes them as collateral via ECMS when another eligible bank pledges them.",
    duties: ["Eligibility assessment, Eligible Assets Database entry", "Collateral receiver in ECMS; applies haircuts and close-links checks"],
    legal: ["ecb-gd", "ecb-dlt-2026"],
  },
  {
    id: "eurosystem",
    name: "Eurosystem — ECMS · T2 · T2S · Pontes",
    country: "EU",
    roles: ["Central bank"],
    legalForm: "ECB + euro-area NCBs",
    supervisor: "—",
    inOrbit:
      "Central-bank money for the EUR cash leg via Pontes, the DLT-to-TARGET bridge. ECMS handles collateral mobilisation of the OeKB-issued tranches.",
    duties: [
      "Pontes: the DLT contract locks the asset, the payment settles in T2 central-bank money, and the confirmation releases the asset (DvP across a DLT platform and T2)",
      "ECMS: single collateral management system (live since June 2025)",
    ],
    legal: ["ecb-gd", "ecb-dlt-2026", "pontes"],
  },
];

export const VALIDATORS = [
  "SWIAT GmbH",
  "adesso SE",
  "NTT DATA Deutschland SE",
  "Sopra Steria SE",
  "GFT Technologies SE",
  "DekaBank",
  "LBBW",
  "SC Ventures",
];

// ---------------------------------------------------------------------------
// Issuers & bonds
// ---------------------------------------------------------------------------
export type RegisterModel = "ES_ERIR" | "FR_DEEP" | "DE_EWPG" | "AT_CSD_DLT" | "CONTRACTUAL";

export interface IssuerDef {
  id: string;
  issuer: string; // legal entity
  brand: string;
  country: Cc;
  rl1: "Founding member" | "Member" | "Pending member" | "Supporter" | "Non-member issuer";
  guarantee?: string;
  cfi?: string;
  law: string;
  registerModel: RegisterModel;
  registrarId: string;
  registrarName: string;
  nsin: string; // 9 chars
  fairSpread: number; // bp over benchmark (illustrative)
  rating: string; // illustrative composite
  seniority: string;
  defaultCcy: "USD" | "EUR";
  notes: string[];
  supervisor: string;
  bailIn: string;
}

export const ISSUERS: IssuerDef[] = [
  // ---- RL1 member institutions: plain vanilla USD 100m, registrar Chartered Investment, issuer CSD OeKB
  {
    id: "abn", issuer: "ABN AMRO Bank N.V.", brand: "ABN AMRO", country: "NL", rl1: "Founding member",
    law: "Dutch law", registerModel: "CONTRACTUAL", registrarId: "chartered", registrarName: "Chartered Investment (registrar)",
    nsin: "0000ORBAB", fairSpread: 80, rating: "A (illustr.)", seniority: "Senior Preferred", defaultCcy: "USD",
    supervisor: "ECB-SSM / DNB; AFM", bailIn: "BRRD (Dutch Wft transposition)",
    notes: [
      "Dutch law has no dedicated DLT-securities statute. The issue is a global note deposited with OeKB CSD; investors hold CSD book entries. Chartered Investment keeps the issuer-level register under the Agency Agreement",
    ],
  },
  {
    id: "bfcm", issuer: "Banque Fédérative du Crédit Mutuel", brand: "Crédit Mutuel Alliance Fédérale", country: "FR", rl1: "Founding member",
    law: "French law", registerModel: "FR_DEEP", registrarId: "chartered", registrarName: "Chartered Investment (registrar, mandated by issuer)",
    nsin: "0000ORBCM", fairSpread: 85, rating: "A+ (illustr.)", seniority: "Senior Preferred", defaultCcy: "USD",
    supervisor: "ECB-SSM / ACPR; AMF", bailIn: "BRRD (French transposition)",
    notes: ["BFCM is the market-funding entity of Crédit Mutuel Alliance Fédérale", "French-law issuer register (DEEP, CMF L.211-7) kept by Chartered Investment as the issuer's mandated agent; OeKB CSD entered as holder of the issue"],
  },
  {
    id: "deka", issuer: "DekaBank Deutsche Girozentrale", brand: "DekaBank", country: "DE", rl1: "Founding member",
    law: "German law", registerModel: "DE_EWPG", registrarId: "chartered", registrarName: "Chartered Investment (registerführende Stelle)",
    nsin: "0000ORBDK", fairSpread: 70, rating: "A+ (illustr.)", seniority: "Senior Preferred", defaultCcy: "USD",
    supervisor: "ECB-SSM / BaFin", bailIn: "BRRD (SAG)",
    notes: ["Electronic security (eWpG) with a collective entry (Sammeleintragung, eWpG §8) held for OeKB CSD; investors hold OeKB book entries"],
  },
  {
    id: "dz", issuer: "DZ BANK AG", brand: "DZ BANK", country: "DE", rl1: "Founding member",
    law: "German law", registerModel: "DE_EWPG", registrarId: "chartered", registrarName: "Chartered Investment (registerführende Stelle)",
    nsin: "0000ORBDZ", fairSpread: 65, rating: "AA- (illustr.)", seniority: "Senior Preferred", defaultCcy: "USD",
    supervisor: "ECB-SSM / BaFin", bailIn: "BRRD (SAG)",
    notes: ["Liquidity provider on Seturion in this scenario"],
  },
  {
    id: "lbbw", issuer: "Landesbank Baden-Württemberg", brand: "LBBW", country: "DE", rl1: "Founding member",
    law: "German law", registerModel: "DE_EWPG", registrarId: "chartered", registrarName: "Chartered Investment (registerführende Stelle)",
    nsin: "0000ORBLB", fairSpread: 80, rating: "A (illustr.)", seniority: "Senior Preferred", defaultCcy: "USD",
    supervisor: "ECB-SSM / BaFin", bailIn: "BRRD (SAG)",
    notes: ["Also runs an RL1 validator node"],
  },
  {
    id: "natixis", issuer: "Natixis S.A.", brand: "Natixis CIB", country: "FR", rl1: "Founding member",
    law: "French law", registerModel: "FR_DEEP", registrarId: "chartered", registrarName: "Chartered Investment (registrar, mandated by issuer)",
    nsin: "0000ORBNX", fairSpread: 90, rating: "A (illustr.)", seniority: "Senior Preferred", defaultCcy: "USD",
    supervisor: "ECB-SSM / ACPR; AMF", bailIn: "BRRD (French transposition)",
    notes: ["Also a liquidity provider on Seturion in this scenario"],
  },
  {
    id: "natwest", issuer: "NatWest Group plc", brand: "NatWest", country: "GB", rl1: "Pending member",
    law: "English law", registerModel: "CONTRACTUAL", registrarId: "chartered", registrarName: "Chartered Investment (registrar under Agency Agreement)",
    nsin: "0000ORBNW", fairSpread: 105, rating: "A- (illustr.)", seniority: "Senior unsecured", defaultCcy: "USD",
    supervisor: "PRA / FCA (UK); EU offering under the EU Prospectus Regulation via a chosen home Member State",
    bailIn: "UK Banking Act 2009 bail-in; T&Cs contain contractual bail-in recognition",
    notes: ["RL1 Phase 1 participant, announced as joining the cooperative", "English-law notes deposited with an EU CSD (OeKB)", "Not Eurosystem-eligible even with OeKB: non-EEA issuer and non-EEA governing law"],
  },
  {
    id: "scb", issuer: "Standard Chartered PLC", brand: "Standard Chartered (SC Ventures)", country: "GB", rl1: "Founding member",
    law: "English law", registerModel: "CONTRACTUAL", registrarId: "chartered", registrarName: "Chartered Investment (registrar under Agency Agreement)",
    nsin: "0000ORBSC", fairSpread: 100, rating: "A (illustr.)", seniority: "Senior unsecured", defaultCcy: "USD",
    supervisor: "PRA / FCA (UK); EU offering under the EU Prospectus Regulation via a chosen home Member State",
    bailIn: "UK Banking Act 2009 bail-in; T&Cs contain contractual bail-in recognition",
    notes: ["Third-country issuer on an EU DLT TSS: the Pilot Regime does not restrict issuer domicile", "Not Eurosystem-eligible even with OeKB: non-EEA issuer and non-EEA governing law"],
  },
  // ---- Non-member issuers from the original brief
  {
    id: "caixa", issuer: "CaixaBank, S.A.", brand: "CaixaBank", country: "ES", rl1: "Non-member issuer",
    law: "Spanish law", registerModel: "ES_ERIR", registrarId: "cecabank", registrarName: "Cecabank, S.A. (ERIR)",
    nsin: "0000ORBCX", fairSpread: 95, rating: "A (illustr.)", seniority: "Senior Preferred", defaultCcy: "USD",
    supervisor: "ECB-SSM / Banco de España; CNMV for the issue",
    bailIn: "BRRD as transposed by Ley 11/2015",
    notes: ["Spanish-law DLT representation (Ley 6/2023 Art. 6–8) with Cecabank as ERIR; OeKB CSD is the holder of record of the issue"],
  },
  {
    id: "caceis", issuer: "CACEIS Bank", brand: "CACEIS", country: "FR", rl1: "Non-member issuer",
    law: "French law", registerModel: "FR_DEEP", registrarId: "caceis-ct", registrarName: "CACEIS Corporate Trust (teneur de registre)",
    nsin: "0000ORBCA", fairSpread: 85, rating: "A+ (illustr.)", seniority: "Senior Preferred", defaultCcy: "USD",
    supervisor: "ECB-SSM / ACPR; AMF", bailIn: "BRRD (French transposition)",
    notes: ["Own-group registrar (CACEIS Corporate Trust) with functional separation"],
  },
  {
    id: "erste", issuer: "Erste Group Bank AG", brand: "Erste Group", country: "AT", rl1: "Non-member issuer",
    law: "Austrian law", registerModel: "AT_CSD_DLT", registrarId: "oekb", registrarName: "OeKB CSD GmbH (issuer CSD and registrar)",
    nsin: "0000ORBE1", fairSpread: 65, rating: "A+ (illustr.)", seniority: "Senior Preferred", defaultCcy: "EUR",
    supervisor: "ECB-SSM / FMA", bailIn: "BRRD (BaSAG)",
    notes: ["EUR denomination, so Eurosystem-eligible through the OeKB route", "No exchange listing: Seturion only"],
  },
  {
    id: "rbi", issuer: "Raiffeisen Bank International AG", brand: "Raiffeisen Bank International", country: "AT", rl1: "Non-member issuer",
    law: "Austrian law", registerModel: "AT_CSD_DLT", registrarId: "oekb", registrarName: "OeKB CSD GmbH (issuer CSD and registrar)",
    nsin: "0000ORBR2", fairSpread: 95, rating: "A- (illustr.)", seniority: "Senior Preferred", defaultCcy: "EUR",
    supervisor: "ECB-SSM / FMA", bailIn: "BRRD (BaSAG)",
    notes: ["Close-links check: Erste and RBI are not closely linked, so each can pledge the other's bond"],
  },
];

export const issuerById = (id: string) => ISSUERS.find((i) => i.id === id)!;
/** OeKB CSD is issuer CSD for every tranche, so OeKB (Austria's NNA) allocates AT ISINs for all. */
export const isinOf = (i: IssuerDef) => makeIsin("AT", i.nsin);
export const ISSUER_CSD = "OeKB CSD GmbH";

// Programme-wide terms --------------------------------------------------------
export const PROGRAMME = {
  name: "RL1 ORBIT",
  pricingDate: "2026-12-08",
  issueDate: "2026-12-10",
  maturityDate: "2029-12-10",
  tenorYears: 3,
  size: 100_000_000,
  fx: 1.08, // USD per EUR, illustrative
  benchmarks: {
    USD: { name: "3y US Treasury (UST 3.75% 11/29)", yield: 3.85 },
    EUR: { name: "3y EUR mid-swap (vs 6m EURIBOR)", yield: 2.35 },
  },
  denomination: { USD: 200_000, EUR: 100_000 },
  increment: { USD: 1_000, EUR: 1_000 },
  pilotCaps: { bondIssueEUR: 1_000_000_000, dltMiAggregateEUR: 6_000_000_000 },
};

export function termsFor(ccy: "USD" | "EUR", couponPct: number): CouponTerms {
  return {
    couponPct,
    freq: ccy === "USD" ? 2 : 1,
    years: PROGRAMME.tenorYears,
    dayCount: ccy === "USD" ? "30/360" : "ACT/ACT (ICMA)",
    issueDate: PROGRAMME.issueDate,
    maturityDate: PROGRAMME.maturityDate,
  };
}

export const CFI = "DBFUFR"; // Debt · Bond · Fixed rate · Unsecured · Fixed maturity · Registered
export const cfiOf = (i: IssuerDef) => i.cfi ?? CFI;
export const PLAIN_VANILLA = "Plain vanilla: fixed coupon, bullet repayment at 100% on maturity, no call, put, step-up, conversion or other embedded options";
export const cfiExplain = [
  ["D", "Debt instrument"],
  ["B", "Bond"],
  ["F", "Fixed-rate interest"],
  ["U", "Unsecured / unguaranteed"],
  ["F", "Fixed maturity redemption"],
  ["R", "Registered form"],
];

// ---------------------------------------------------------------------------
// Investors / holders
// ---------------------------------------------------------------------------
export type InvestorType =
  | "Asset manager"
  | "Insurer"
  | "Pension fund"
  | "Bank treasury"
  | "Official institution"
  | "UCITS MMF"
  | "Private bank"
  | "Hedge fund"
  | "Special AIF";

export interface Investor {
  id: string;
  name: string;
  country: Cc;
  type: InvestorType;
  mifid: "Eligible counterparty" | "Professional client";
  custodian: string;
  usPerson: boolean;
  kycValidUntil: string;
  memberOf?: string; // issuer id if this is a member's treasury
  weight: number; // allocation preference (real-money > fast-money)
  eurosystemCounterparty?: boolean;
}

export const INVESTORS: Investor[] = [
  { id: "alpine", name: "Alpine Asset Management", country: "AT", type: "Asset manager", mifid: "Professional client", custodian: "Erste Group (OeKB participant)", usPerson: false, kycValidUntil: "2027-09-30", weight: 1.2 },
  { id: "iberia", name: "Iberia Seguros", country: "ES", type: "Insurer", mifid: "Professional client", custodian: "Cecabank", usPerson: false, kycValidUntil: "2027-06-30", weight: 1.25 },
  { id: "rhein", name: "Rhein Sparkassen Treasury", country: "DE", type: "Bank treasury", mifid: "Eligible counterparty", custodian: "Direct RL1 wallet", usPerson: false, kycValidUntil: "2027-12-31", weight: 1.0, eurosystemCounterparty: true },
  { id: "lutetia", name: "Lutetia Gestion", country: "FR", type: "Asset manager", mifid: "Professional client", custodian: "CACEIS Bank", usPerson: false, kycValidUntil: "2027-03-31", weight: 1.2 },
  { id: "amstel", name: "Amstel Pensioenfonds", country: "NL", type: "Pension fund", mifid: "Professional client", custodian: "CACEIS Bank (NL branch)", usPerson: false, kycValidUntil: "2027-08-31", weight: 1.3 },
  { id: "nordic", name: "Nordic Reserve Manager", country: "FI", type: "Official institution", mifid: "Eligible counterparty", custodian: "Direct RL1 wallet", usPerson: false, kycValidUntil: "2028-01-31", weight: 1.4 },
  { id: "danube", name: "Danube Liquidity Fund (UCITS)", country: "LU", type: "UCITS MMF", mifid: "Professional client", custodian: "CACEIS Bank (LU branch)", usPerson: false, kycValidUntil: "2027-05-31", weight: 1.1 },
  { id: "tagus", name: "Tagus Banco Tesouraria", country: "PT", type: "Bank treasury", mifid: "Eligible counterparty", custodian: "Cecabank", usPerson: false, kycValidUntil: "2027-10-31", weight: 1.0, eurosystemCounterparty: true },
  { id: "limmat", name: "Limmat Private Bank", country: "CH", type: "Private bank", mifid: "Professional client", custodian: "Direct RL1 wallet", usPerson: false, kycValidUntil: "2027-04-30", weight: 0.9 },
  { id: "adriatic", name: "Adriatic Macro Fund", country: "IT", type: "Hedge fund", mifid: "Professional client", custodian: "Natixis (prime)", usPerson: false, kycValidUntil: "2027-02-28", weight: 0.6 },
  { id: "hudson", name: "Hudson Ridge Capital LLC", country: "US", type: "Hedge fund", mifid: "Professional client", custodian: "Direct RL1 wallet", usPerson: true, kycValidUntil: "2027-07-31", weight: 0.6 },
  { id: "baltic", name: "Baltic Credit Union", country: "EE", type: "Bank treasury", mifid: "Eligible counterparty", custodian: "Direct RL1 wallet", usPerson: false, kycValidUntil: "2026-10-31", weight: 0.9 },
  { id: "t-rbi", name: "RBI Group Treasury", country: "AT", type: "Bank treasury", mifid: "Eligible counterparty", custodian: "OeKB CSD (direct participant)", usPerson: false, kycValidUntil: "2028-06-30", memberOf: "rbi", weight: 1.0, eurosystemCounterparty: true },
  { id: "t-erste", name: "Erste Group Treasury", country: "AT", type: "Bank treasury", mifid: "Eligible counterparty", custodian: "OeKB CSD (direct participant)", usPerson: false, kycValidUntil: "2028-06-30", memberOf: "erste", weight: 1.0, eurosystemCounterparty: true },
  { id: "t-dz", name: "DZ BANK Treasury (LP)", country: "DE", type: "Bank treasury", mifid: "Eligible counterparty", custodian: "Direct RL1 wallet", usPerson: false, kycValidUntil: "2028-06-30", memberOf: "dz", weight: 1.0, eurosystemCounterparty: true },
  { id: "t-natixis", name: "Natixis Treasury (LP)", country: "FR", type: "Bank treasury", mifid: "Eligible counterparty", custodian: "Direct RL1 wallet", usPerson: false, kycValidUntil: "2028-06-30", memberOf: "natixis", weight: 1.0, eurosystemCounterparty: true },
  { id: "ci-fund", name: "ORBIT Special Fund (Chartered Investment)", country: "DE", type: "Special AIF", mifid: "Professional client", custodian: "Depositary: DZ BANK (scenario)", usPerson: false, kycValidUntil: "2028-12-31", weight: 1.3 },
  { id: "t-caixa", name: "CaixaBank Treasury", country: "ES", type: "Bank treasury", mifid: "Eligible counterparty", custodian: "Cecabank", usPerson: false, kycValidUntil: "2028-06-30", memberOf: "caixa", weight: 1.0, eurosystemCounterparty: true },
];
export const investorById = (id: string) => INVESTORS.find((i) => i.id === id);
export const walletOf = (holderId: string) => addressOf("holder/" + holderId);

/** Simulated "today" inside the demo. */
export const DEMO_TODAY = "2026-11-21";
