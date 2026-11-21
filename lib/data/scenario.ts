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
  | "Validator";

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
      "The secondary market for all ORBIT bonds and the settlement engine for primary DvP of the non-Austrian tranches. As a DLT TSS it combines what would otherwise be an MTF (multilateral trading) and a CSD-like settlement system in one licence, settling trades atomically on RL1.",
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
      "Programme coordinator of ORBIT: arranger and global coordinator for book-building, fiscal & paying agent for the USD tranches, calculation agent, and ERIR (registry entity) for the Spanish-law CaixaBank bond. It also acts as contractual registrar for the Dutch-law and the two English-law tranches (Standard Chartered, NatWest), which lack a statutory DLT register.",
    duties: [
      "Runs the ORBIT programme documentation set: Dealer Agreement, Agency Agreement, Registrar Agreement and the common Terms & Conditions template",
      "Runs the joint book across all 13 issuers: indications of interest, IPTs, guidance, final pricing, allocation file",
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
      "Keeps the register (teneur de registre) for the three French-law tranches (CACEIS Bank, Natixis, BFCM). Each register is a DEEP — a shared electronic recording device — under Code monétaire et financier Art. L.211-3 and L.211-7, run on RL1.",
    duties: [
      "Records holders in the DEEP. Inscription in the DEEP has the same legal effect as inscription in a securities account",
      "Keeps the identity mapping (address ↔ holder) off-chain, as the R.211-9-7 requirements on owner identification demand",
      "Keeps a business continuity plan and a periodic data copy of the DEEP",
    ],
    legal: ["fr-cmf", "fr-ord2017", "csdr"],
  },
  {
    id: "deka-reg",
    name: "DekaBank — Registry Services",
    country: "DE",
    roles: ["Registrar"],
    legalForm: "German credit institution holding a crypto-securities registry licence (KWG §1(1a) sentence 2 no. 8)",
    supervisor: "BaFin",
    inOrbit:
      "Registrar (registerführende Stelle) of the crypto-securities registers (Kryptowertpapierregister) for the German-law tranches of DZ BANK, LBBW and Chartered Investment. In this scenario a separate registry entity serves DekaBank's own tranche, so Deka does not keep the register for its own debt.",
    duties: [
      "Keeps the crypto-securities register under eWpG §16, with the register content set by eWpG §17",
      "Individual entries (Einzeleintragung): each investor is the registered holder. Collective entries (Sammeleintragung) via a custodian are also possible",
      "BaFin publishes each crypto security in its public list (eWpG §20)",
      "Registrar migration (change of registerführende Stelle) without changing the security, as in the KfW case on RL1",
    ],
    legal: ["de-ewpg", "de-kwg", "csdr"],
  },
  {
    id: "swiat-reg",
    name: "SWIAT eWpG Registry (scenario)",
    country: "DE",
    roles: ["Registrar"],
    legalForm: "BaFin-supervised electronic-securities registry offering in the SWIAT ecosystem (scenario assumption)",
    supervisor: "BaFin",
    inOrbit: "Registrar of the DekaBank tranche, so that the issuer and the registrar are different entities.",
    duties: ["Same eWpG §16–§17 duties as above, for the DekaBank tranche"],
    legal: ["de-ewpg", "de-kwg"],
  },
  {
    id: "oekb",
    name: "OeKB CSD GmbH",
    country: "AT",
    roles: ["CSD", "NNA", "Registrar"],
    legalForm: "Austrian central securities depository authorised under CSDR; part of Oesterreichische Kontrollbank group",
    supervisor: "FMA (CSD authorisation); Oesterreichische Nationalbank (oversight)",
    inOrbit:
      "Issuer CSD for the Erste and Raiffeisen tranches. OeKB is the 'rubber stamp': it holds the global note, assigns the AT ISINs as Austria's national numbering agency, and runs the bond register as a CSD-operated DLT service on RL1. This brings both bonds inside an eligible securities settlement system connected to T2S, the route the Eurosystem has accepted for DLT-based collateral since 30 March 2026.",
    duties: [
      "Holds the global certificate (Sammelurkunde) in collective safe custody (Sammelverwahrung) under the Austrian Depotgesetz. The token balances on RL1 are the CSD's book-entry layer",
      "Assigns ISINs AT0000… as national numbering agency, plus CFI and FISN codes",
      "Integrity of the issue (CSDR Art. 37): daily reconciliation that token totalSupply equals the global-note amount",
      "T2S connectivity: positions can be realigned to Eurosystem accounts for collateral mobilisation via ECMS",
      "Supplies the eligibility file to OeNB so the Eurosystem can assess the bonds and add them to the Eligible Assets Database",
    ],
    legal: ["csdr", "at-depg", "ecb-gd", "ecb-dlt-2026", "sfd", "at-boerseg"],
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
    id: "wbag",
    name: "Wiener Börse AG",
    country: "AT",
    roles: ["Exchange"],
    legalForm: "Austrian exchange operator — regulated market (Amtlicher Handel)",
    supervisor: "FMA",
    inOrbit:
      "Lists the Erste and RBI tranches on the Official Market. A regulated market is an acceptable market for Eurosystem collateral. A DLT MTF such as Seturion has not been assessed as an acceptable non-regulated market. Trading liquidity stays on Seturion.",
    duties: ["Admission to listing (BörseG 2018)", "Prospectus approved by FMA required for regulated-market admission"],
    legal: ["at-boerseg", "prospectus", "at-kmg"],
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
  rl1: "Founding member" | "Member" | "Pending member" | "Non-member issuer";
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
  {
    id: "caixa", issuer: "CaixaBank, S.A.", brand: "CaixaBank", country: "ES", rl1: "Non-member issuer",
    law: "Spanish law", registerModel: "ES_ERIR", registrarId: "cecabank", registrarName: "Cecabank, S.A. (ERIR)",
    nsin: "0ORB26CX1", fairSpread: 95, rating: "A (illustr.)", seniority: "Senior Preferred", defaultCcy: "USD",
    supervisor: "ECB-SSM / Banco de España; CNMV for the issue",
    bailIn: "BRRD as transposed by Ley 11/2015; Spanish-law instrument, so no contractual recognition clause is needed",
    notes: ["Securities represented by DLT entries under Ley 6/2023 Art. 6–8", "CNMV keeps the public list of ERIRs per issue (RD 815/2023)"],
  },
  {
    id: "caceis", issuer: "CACEIS Bank", brand: "CACEIS", country: "FR", rl1: "Non-member issuer",
    law: "French law", registerModel: "FR_DEEP", registrarId: "caceis-ct", registrarName: "CACEIS Corporate Trust (teneur de registre)",
    nsin: "0014ORBC1", fairSpread: 85, rating: "A+ (illustr.)", seniority: "Senior Preferred", defaultCcy: "USD",
    supervisor: "ECB-SSM / ACPR; AMF", bailIn: "BRRD (French transposition, CMF L.613-30-3)",
    notes: ["Registered bonds inscribed in a DEEP (CMF L.211-7)", "Issuer-group registrar: CACEIS Corporate Trust is in the same group, so conflicts are managed by functional separation"],
  },
  {
    id: "natixis", issuer: "Natixis S.A.", brand: "Natixis CIB", country: "FR", rl1: "Founding member",
    law: "French law", registerModel: "FR_DEEP", registrarId: "caceis-ct", registrarName: "CACEIS Corporate Trust (teneur de registre)",
    nsin: "0014ORBN2", fairSpread: 90, rating: "A (illustr.)", seniority: "Senior Preferred", defaultCcy: "USD",
    supervisor: "ECB-SSM / ACPR; AMF", bailIn: "BRRD (French transposition)",
    notes: ["DEEP inscription on RL1", "Also acts as a liquidity provider on Seturion in this scenario"],
  },
  {
    id: "bfcm", issuer: "Banque Fédérative du Crédit Mutuel", brand: "Crédit Mutuel Alliance Fédérale", country: "FR", rl1: "Founding member",
    law: "French law", registerModel: "FR_DEEP", registrarId: "caceis-ct", registrarName: "CACEIS Corporate Trust (teneur de registre)",
    nsin: "0014ORBM3", fairSpread: 85, rating: "A+ (illustr.)", seniority: "Senior Preferred", defaultCcy: "USD",
    supervisor: "ECB-SSM / ACPR; AMF", bailIn: "BRRD (French transposition)",
    notes: ["BFCM is the market-funding entity of Crédit Mutuel Alliance Fédérale"],
  },
  {
    id: "abn", issuer: "ABN AMRO Bank N.V.", brand: "ABN AMRO", country: "NL", rl1: "Founding member",
    law: "Dutch law", registerModel: "CONTRACTUAL", registrarId: "cecabank", registrarName: "Cecabank, S.A. (contractual registrar)",
    nsin: "0ORB26AB4", fairSpread: 80, rating: "A (illustr.)", seniority: "Senior Preferred", defaultCcy: "USD",
    supervisor: "ECB-SSM / DNB; AFM", bailIn: "BRRD (Dutch Wft transposition)",
    notes: [
      "Dutch law has no dedicated DLT-securities statute. Registered notes (op naam) transfer by deed of assignment (BW 3:94). The T&Cs make the on-chain transfer the agreed form of deed, and the registrar's entry is the notice to the issuer",
      "Legal-opinion focus: whether the on-chain record satisfies the deed and notification requirements",
    ],
  },
  {
    id: "deka", issuer: "DekaBank Deutsche Girozentrale", brand: "DekaBank", country: "DE", rl1: "Founding member",
    law: "German law", registerModel: "DE_EWPG", registrarId: "swiat-reg", registrarName: "SWIAT eWpG registry (scenario)",
    nsin: "000ORB1DK", fairSpread: 70, rating: "A+ (illustr.)", seniority: "Senior Preferred", defaultCcy: "USD",
    supervisor: "ECB-SSM / BaFin", bailIn: "BRRD (SAG)",
    notes: ["Crypto security (Kryptowertpapier) under eWpG §4(3)", "A separate registrar avoids self-registration"],
  },
  {
    id: "dz", issuer: "DZ BANK AG", brand: "DZ BANK", country: "DE", rl1: "Founding member",
    law: "German law", registerModel: "DE_EWPG", registrarId: "deka-reg", registrarName: "DekaBank Registry Services",
    nsin: "000ORB1DZ", fairSpread: 65, rating: "AA- (illustr.)", seniority: "Senior Preferred", defaultCcy: "USD",
    supervisor: "ECB-SSM / BaFin", bailIn: "BRRD (SAG)",
    notes: ["Liquidity provider on Seturion in this scenario"],
  },
  {
    id: "lbbw", issuer: "Landesbank Baden-Württemberg", brand: "LBBW", country: "DE", rl1: "Founding member",
    law: "German law", registerModel: "DE_EWPG", registrarId: "deka-reg", registrarName: "DekaBank Registry Services",
    nsin: "000ORB1LB", fairSpread: 80, rating: "A (illustr.)", seniority: "Senior Preferred", defaultCcy: "USD",
    supervisor: "ECB-SSM / BaFin", bailIn: "BRRD (SAG)",
    notes: ["Also runs an RL1 validator node"],
  },
  {
    id: "chartered", issuer: "Chartered Investment (issuing vehicle)", brand: "Chartered Investment", country: "DE", rl1: "Founding member",
    law: "German law", registerModel: "DE_EWPG", registrarId: "deka-reg", registrarName: "DekaBank Registry Services",
    nsin: "000ORB1CI", fairSpread: 180, rating: "BBB (illustr.)", seniority: "Senior Unsecured (non-bank)", defaultCcy: "USD",
    supervisor: "BaFin (prospectus / securities); not an SSM credit institution",
    bailIn: "Not a BRRD institution, so normal insolvency ranking applies",
    notes: ["Non-bank issuer, so there is no MREL or bail-in layer", "Shows that ORBIT is open to non-bank issuers"],
  },
  {
    id: "scb", issuer: "Standard Chartered PLC", brand: "Standard Chartered (SC Ventures)", country: "GB", rl1: "Founding member",
    law: "English law", registerModel: "CONTRACTUAL", registrarId: "cecabank", registrarName: "Cecabank, S.A. (registrar under Agency Agreement)",
    nsin: "00ORB1SC5", fairSpread: 100, rating: "A (illustr.)", seniority: "Senior (HoldCo, MREL-eligible)", defaultCcy: "USD",
    supervisor: "PRA / FCA (UK); EU offering under EU Prospectus Regulation via a chosen home Member State",
    bailIn: "UK Banking Act 2009 bail-in; T&Cs contain contractual bail-in recognition",
    notes: [
      "Third-country (non-EEA) issuer on an EU DLT TSS. The Pilot Regime does not restrict issuer domicile",
      "English law: registered notes with a register kept by the registrar under the Agency Agreement. UK Property (Digital Assets etc) Act 2025 supports proprietary treatment of digital assets",
      "Not Eurosystem-eligible: non-EEA issuer and non-EEA governing law",
    ],
  },
  {
    id: "natwest", issuer: "NatWest Group plc", brand: "NatWest", country: "GB", rl1: "Pending member",
    law: "English law", registerModel: "CONTRACTUAL", registrarId: "cecabank", registrarName: "Cecabank, S.A. (registrar under Agency Agreement)",
    nsin: "00ORB1NW6", fairSpread: 105, rating: "A- (illustr.)", seniority: "Senior (HoldCo, MREL-eligible)", defaultCcy: "USD",
    supervisor: "PRA / FCA (UK); EU offering under EU Prospectus Regulation via a chosen home Member State",
    bailIn: "UK Banking Act 2009 bail-in; T&Cs contain contractual bail-in recognition",
    notes: [
      "RL1 Phase 1 participant, announced as joining the cooperative in the coming weeks",
      "Second English-law tranche, with the same contractual-register structure as Standard Chartered",
      "Not Eurosystem-eligible: non-EEA issuer and non-EEA governing law",
    ],
  },
  {
    id: "erste", issuer: "Erste Group Bank AG", brand: "Erste Group", country: "AT", rl1: "Non-member issuer",
    law: "Austrian law", registerModel: "AT_CSD_DLT", registrarId: "oekb", registrarName: "OeKB CSD GmbH (issuer CSD, DLT service)",
    nsin: "0000ORBE1", fairSpread: 65, rating: "A+ (illustr.)", seniority: "Senior Preferred", defaultCcy: "EUR",
    supervisor: "ECB-SSM / FMA", bailIn: "BRRD (BaSAG)",
    notes: [
      "Global note held by OeKB CSD; the token is the CSD-operated DLT book-entry",
      "Listed on Wiener Börse Official Market, an acceptable market for the Eurosystem",
      "Denominated in EUR so that it can be Eurosystem-eligible (switch to USD on the ECB page to see the check fail)",
    ],
  },
  {
    id: "rbi", issuer: "Raiffeisen Bank International AG", brand: "Raiffeisen Bank International", country: "AT", rl1: "Non-member issuer",
    law: "Austrian law", registerModel: "AT_CSD_DLT", registrarId: "oekb", registrarName: "OeKB CSD GmbH (issuer CSD, DLT service)",
    nsin: "0000ORBR2", fairSpread: 95, rating: "A- (illustr.)", seniority: "Senior Preferred", defaultCcy: "EUR",
    supervisor: "ECB-SSM / FMA", bailIn: "BRRD (BaSAG)",
    notes: ["Same OeKB CSD route as Erste", "Close-links check: Erste and RBI are not closely linked, so each can pledge the other's bond"],
  },
];

export const issuerById = (id: string) => ISSUERS.find((i) => i.id === id)!;
export const isinOf = (i: IssuerDef) => makeIsin(i.country === "GB" ? "GB" : i.country, i.nsin);

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
  | "Hedge fund";

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
  { id: "t-caixa", name: "CaixaBank Treasury", country: "ES", type: "Bank treasury", mifid: "Eligible counterparty", custodian: "Cecabank", usPerson: false, kycValidUntil: "2028-06-30", memberOf: "caixa", weight: 1.0, eurosystemCounterparty: true },
];
export const investorById = (id: string) => INVESTORS.find((i) => i.id === id);
export const walletOf = (holderId: string) => addressOf("holder/" + holderId);

/** Simulated "today" inside the demo. */
export const DEMO_TODAY = "2026-11-21";
