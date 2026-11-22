// Primary-market workflow, T-30 → T+2, with jurisdiction-specific variants.
import { INVESTORS, PROGRAMME, type IssuerDef, type RegisterModel } from "./scenario";
import { rng } from "../util";

export interface Step {
  id: string;
  t: string;
  date: string;
  title: string;
  actors: string[];
  what: string[];
  onchain?: string[];
  messages?: string[];
  legal: string[];
  artefacts?: string[];
  variant?: Partial<Record<RegisterModel, string>>;
}

export const PRIMARY_STEPS: Step[] = [
  {
    id: "mandate", t: "T-30", date: "2026-11-06", title: "Programme set-up & mandate",
    actors: ["Issuer", "Cecabank (Coordinator)", "RL1 SCE"],
    what: [
      "The issuer mandates Cecabank as arranger and global coordinator of the RL1 ORBIT programme",
      "Programme agreements signed: Dealer Agreement, Agency Agreement (fiscal/paying/calculation agent), Registrar Agreement (Chartered Investment for the RL1 member tranches), Seturion participation agreement",
      "OeKB CSD issuer agreement and DLT-service annex signed by every issuer. OeKB is issuer CSD for all 12 tranches, using the issuer's freedom to choose any EU CSD (CSDR Art. 49)",
      "The issuer is onboarded as an RL1 participant: LEI verified, node access through its own node or the coordinator's node, signing keys generated in HSM/MPC custody",
      "Internal approvals: board resolution authorising the issue, ALCO funding plan",
    ],
    legal: ["mifid2", "dora", "sce-reg", "mar"],
    artefacts: ["Mandate letter", "Board resolution", "RL1 participation agreement", "Key ceremony record"],
    variant: {
      CONTRACTUAL: "With no statutory DLT register, Chartered Investment is appointed contractual registrar. The issuer-level register records OeKB CSD as holder of the whole issue.",
      AT_CSD_DLT: "For Erste and RBI, OeKB CSD is registrar as well as issuer CSD, so no separate registrar is appointed.",
    },
  },
  {
    id: "docs", t: "T-25", date: "2026-11-11", title: "Documentation & disclosure",
    actors: ["Issuer", "Issuer counsel", "Dealer counsel", "Cecabank"],
    what: [
      "Plain vanilla terms for every issuer: fixed coupon, bullet at par, no call, put, step-up or conversion. Terms & Conditions drafted under the issuer's home law, with DLT-specific clauses: form of the security, identity of the registrar, smart-contract address and code hash, network-failure fallback, golden-copy precedence, forced-transfer and freeze powers, key-loss procedure",
      "Wholesale information memorandum for every tranche: qualified investors only, minimum denomination $200,000 / €100,000. No exchange listing (Seturion only), so no approved prospectus is needed",
      "MiFID II product governance: target market is eligible counterparties and professional clients; distribution channel is institutional sales only. No PRIIPs KID, since there is no retail offer",
      "Selling restrictions: Regulation S Category 2 (no US persons; 40-day distribution compliance period), plus EEA, UK, Switzerland and Singapore legends",
    ],
    legal: ["prospectus", "mifid2", "us-regs", "rome1", "brrd"],
    artefacts: ["Information memorandum / base prospectus", "Draft Final Terms", "Subscription agreement"],
    variant: {
      CONTRACTUAL: "English-law (Standard Chartered, NatWest) T&Cs contain a contractual bail-in recognition clause. Dutch-law (ABN AMRO) T&Cs define the on-chain signed instruction as the deed of assignment (BW 3:94).",
      ES_ERIR: "The issuance document must state that the bonds are represented through a DLT registry system and name Cecabank as ERIR (Ley 6/2023 Art. 7–8). The Final Terms name OeKB CSD as issuer CSD.",
      FR_DEEP: "The T&Cs state that the bonds are titres nominatifs inscribed in a DEEP (CMF L.211-3), with CACEIS Corporate Trust (CACEIS) or Chartered Investment (Natixis, BFCM) as teneur de registre.",
      DE_EWPG: "Instead of depositing a certificate, the issuer deposits the Emissionsbedingungen with the registrar before the entry (eWpG §5). The bond is a Kryptowertpapier (§4(3)) with a collective entry (§8) held for OeKB CSD. Chartered Investment is registerführende Stelle.",
    },
  },
  {
    id: "opinions", t: "T-20", date: "2026-11-16", title: "Legal opinions & smart-contract audit",
    actors: ["Issuer counsel", "Dealer counsel", "Independent auditor"],
    what: [
      "Capacity and authority opinion; enforceability under the governing law",
      "DLT opinion: the RL1 entry creates or transfers title under the governing law; conflict-of-laws analysis (SFD Art. 9(2), FCD Art. 9, location of the register)",
      "Insolvency opinion: investors' positions are protected if the registrar, Seturion or a custodian fails",
      "Independent audit of BondToken v2, IdentityRegistry, ComplianceModule and DvPEscrow. The audited bytecode hash is pinned in the Final Terms",
    ],
    legal: ["sfd", "fcd", "crr", "dora"],
    artefacts: ["Legal opinions (per jurisdiction)", "Smart-contract audit report", "Bytecode hash"],
  },
  {
    id: "ids", t: "T-15", date: "2026-11-21", title: "Identifiers & contract deployment",
    actors: ["NNA", "Registrar", "RL1 SCE"],
    what: [
      "OeKB, as Austria's national numbering agency and issuer CSD, allocates an AT ISIN to every tranche (ISO 6166), plus CFI DBFUFR (ISO 10962) and FISN (ISO 18774)",
      "The registrar deploys the bond contract set on RL1 from the allow-listed template: BondToken, IdentityRegistry binding, ComplianceModule rules (Reg S, KYC, investor category, min denomination) and DvPEscrow",
      "Role grants: REGISTRAR_ROLE (registrar multisig), ISSUER_ROLE (corporate actions), SETTLEMENT_ROLE (Seturion), PAYING_AGENT_ROLE (Cecabank), CSD_OPERATOR_ROLE (OeKB CSD, every tranche)",
      "Final Terms PDF hashed (keccak-256) and the hash anchored on-chain as `termsHash`",
    ],
    onchain: ["ContractDeployed(BondToken)", "RoleGranted × 4–5", "TermsAnchored(termsHash)", "IsinSet(isin)"],
    messages: ["ISIN/CFI/FISN record to ANNA Service Bureau", "Reference data → FIRDS (via the trading venue, MiFIR Art. 27)"],
    legal: ["mifir", "es-rd815", "de-ewpg", "csdr"],
    variant: {
      AT_CSD_DLT: "For Erste and RBI, OeKB CSD also deploys the contract and holds REGISTRAR_ROLE itself.",
      DE_EWPG: "The registrar records the register content required by eWpG §17. BaFin will publish the entry (§20).",
      ES_ERIR: "Cecabank, as ERIR, deploys and administers the register. The issue is notified to the CNMV for the ERIR list.",
    },
  },
  {
    id: "admission", t: "T-10", date: "2026-11-26", title: "Venue admission & Pilot Regime checks",
    actors: ["Seturion", "Issuer", "Cecabank"],
    what: [
      "Application to admit the tranche to trading and settlement on the Seturion DLT TSS",
      "Pilot Regime Art. 3 checks: issue size (≈ €92.6m for USD 100m) below €1bn, and Seturion's aggregate market value of DLT instruments within the €6bn cap",
      "Seturion receives SETTLEMENT_ROLE. It is the only venue: there is no exchange listing. Its settlement instructions execute through OeKB CSD's DLT service, so each transfer is also an OeKB book entry. The TSS rulebook and OeKB's rules jointly define moment of entry, irrevocability and finality",
      "Choice of cash-settlement asset recorded: USD tokenised commercial-bank deposit (settlement bank) or USD e-money token; EUR through Pontes",
    ],
    legal: ["dlt-pilot", "sfd", "mifir", "mica"],
  },
  {
    id: "onboard", t: "T-5", date: "2026-12-01", title: "Investor onboarding & whitelisting",
    actors: ["Custodians", "Registrar", "Investors"],
    what: [
      "Each investor's custodian (or the investor directly, for eligible counterparties) passes KYC/AML under the AML framework",
      "Claims issued to the IdentityRegistry: KYC_VALID_UNTIL, INVESTOR_CATEGORY (ECP/Professional), COUNTRY, US_PERSON flag. Only claim hashes go on-chain; personal data stays off-chain (GDPR)",
      "The ComplianceModule rejects any wallet without a valid claim set. Hudson Ridge (US person) and Baltic Credit Union (KYC expired 31 Oct 2026) will fail",
    ],
    onchain: ["IdentityRegistered(wallet, claimHash)", "ClaimAdded(KYC)", "ClaimAdded(US_PERSON=false)"],
    legal: ["amlr", "gdpr", "us-regs", "mifid2"],
  },
  {
    id: "announce", t: "T-1", date: "2026-12-07", title: "Announcement & IPTs",
    actors: ["Cecabank", "Joint bookrunners"],
    what: [
      "Mandate announced on screens. Investor calls after MAR market-sounding procedures",
      "Initial price thoughts (IPTs) released per tranche, e.g. UST + 115bp area for CaixaBank",
    ],
    legal: ["mar"],
  },
  {
    id: "book", t: "T", date: "2026-12-08", title: "Book-building, pricing & allocation",
    actors: ["Cecabank", "Investors", "Issuer"],
    what: [
      "Orders entered with spread limits. Books update and guidance tightens from IPT → guidance → final spread",
      "Pricing: re-offer yield = benchmark + spread. Coupon = yield rounded down to 1/8%. Re-offer price = PV of cash flows at the re-offer yield",
      "Allocation: pro-rata to order, weighted toward real money (pension, insurance, official institutions) over fast money; rounded to $1,000 with a $200,000 minimum. The allocation rationale is recorded (MiFID II allocation policy)",
      "Pricing confirmed and Final Terms signed. termsHash is updated with the priced Final Terms",
    ],
    legal: ["mifid2", "mar", "prospectus"],
    artefacts: ["Order book file", "Allocation file", "Signed Final Terms"],
  },
  {
    id: "presettle", t: "T+1", date: "2026-12-09", title: "Pre-settlement: minting & pre-funding",
    actors: ["Registrar", "Investors' custodians", "Cash settlement agent"],
    what: [
      "Investors pre-fund the cash leg: USD settlement tokens moved into DvPEscrow, or EUR Pontes payment instruction prepared",
      "The registrar verifies conditions precedent (signed Final Terms, legal opinions delivered, closing certificate) and records OeKB CSD as holder of the whole issue (global note or collective entry)",
      "OeKB CSD then mints the investor-level book-entry tokens to DvPEscrow. totalSupply equals the global position exactly (CSDR Art. 37 integrity of the issue)",
    ],
    onchain: ["Issued(escrow, 100,000,000)", "CashLocked(investor, amount)"],
    messages: ["sese.023 settlement instructions (custodian → registrar/venue)", "sese.024 status advice (matched)"],
    legal: ["csdr", "dlt-pilot"],
  },
  {
    id: "settle", t: "T+2", date: "2026-12-10", title: "DvP settlement (issue date)",
    actors: ["Seturion / OeKB CSD", "Registrar", "Investors", "Issuer"],
    what: [
      "For each allocation, one atomic transaction: bond tokens go from DvPEscrow to the investor wallet, and the cash goes from the investor's locked cash to the issuer's account",
      "Finality is reached when the block is committed (BFT consensus, no reorgs) and is protected by the SFD rules of the designated system",
      "The register now shows each investor as holder. The issuer receives net proceeds: re-offer price × nominal minus fees",
    ],
    onchain: ["DvPSettled(tradeId, investor, nominal, cash)", "Transfer(escrow → investor)"],
    messages: ["sese.025 settlement confirmation", "camt.054 cash credit notification", "semt.002 statement of holdings"],
    legal: ["sfd", "dlt-pilot", "csdr"],
    variant: {
      AT_CSD_DLT: "EUR tranche: cash leg in central-bank money through Pontes. The token is locked, a pacs.009 settles in T2, and the confirmation releases the token. Finality comes from T2 plus the OeKB CSD book entry.",
    },
  },
  {
    id: "post", t: "T+2", date: "2026-12-10", title: "Post-issuance filings",
    actors: ["Registrar", "Seturion", "Issuer", "OeKB/OeNB"],
    what: [
      "FIRDS reference data, MiFIR transaction reports by investment firms (Art. 26), venue post-trade publication",
      "ES: the CNMV ERIR list shows Cecabank for the CaixaBank ISIN. DE: BaFin publishes each crypto security (eWpG §20). FR: DEEP register extract",
      "OeKB submits eligibility data to OeNB for every tranche that also meets the non-CSD criteria (EUR, EEA issuer and law). In this configuration those are Erste and RBI, plus any EEA issuer switched to EUR. After assessment the ISINs go into the Eligible Assets Database (EADB)",
    ],
    legal: ["mifir", "es-rd815", "de-ewpg", "ecb-gd", "ecb-dlt-2026"],
  },
];

// Book-building ---------------------------------------------------------------
export interface Order {
  investorId: string;
  amount: number;
  limitBp: number; // minimum spread the investor accepts
}

export function generateBook(issuer: IssuerDef, ccy: "USD" | "EUR"): Order[] {
  const r = rng("book/" + issuer.id + ccy);
  const orders: Order[] = [];
  for (const inv of INVESTORS) {
    // Member treasuries bid mostly for other members' paper; the RBI treasury buys Erste, etc.
    if (inv.memberOf === issuer.id && inv.memberOf !== "natixis" && inv.memberOf !== "dz") continue;
    const p = inv.memberOf ? 0.55 : 0.85;
    if (r() > p) continue;
    const size = Math.round((4 + r() * 22) * 1_000_000 / 1_000_000) * 1_000_000;
    const limit = Math.round(issuer.fairSpread - 12 + r() * 30);
    orders.push({ investorId: inv.id, amount: size, limitBp: limit });
  }
  // Make the Austrian books show cross-holdings for the ECB demo.
  const cross = issuer.id === "erste" ? "t-rbi" : issuer.id === "rbi" ? "t-erste" : null;
  if (cross) {
    const o = orders.find((x) => x.investorId === cross);
    if (o) o.limitBp = Math.min(o.limitBp, issuer.fairSpread - 5);
    else orders.push({ investorId: cross, amount: 15_000_000, limitBp: issuer.fairSpread - 5 });
  }
  // The Chartered Investment special fund anchors every book (basket strategy).
  const f = orders.find((o) => o.investorId === "ci-fund");
  if (f) { f.amount = 12_000_000; f.limitBp = Math.min(f.limitBp, issuer.fairSpread - 3); }
  else orders.push({ investorId: "ci-fund", amount: 12_000_000, limitBp: issuer.fairSpread - 3 });
  // Ensure the blocked investors appear so compliance rejections are visible.
  if (!orders.find((o) => o.investorId === "hudson")) orders.push({ investorId: "hudson", amount: 10_000_000, limitBp: issuer.fairSpread - 4 });
  if (!orders.find((o) => o.investorId === "baltic")) orders.push({ investorId: "baltic", amount: 5_000_000, limitBp: issuer.fairSpread });
  return orders;
}

export const IPT_OFFSET = 25; // IPTs start ~25bp wide of fair
export const ipt = (i: IssuerDef) => Math.round((i.fairSpread + IPT_OFFSET) / 5) * 5;

export function allocate(orders: Order[], spreadBp: number, size: number, ccy: "USD" | "EUR", eligible: (id: string) => boolean) {
  const min = PROGRAMME.denomination[ccy];
  const inc = PROGRAMME.increment[ccy];
  const live = orders.filter((o) => o.limitBp <= spreadBp && eligible(o.investorId));
  const demand = live.reduce((s, o) => s + o.amount, 0);
  if (demand === 0) return { allocations: [] as { investorId: string; amount: number }[], demand, live };
  const weights = live.map((o) => o.amount * (INVESTORS.find((i) => i.id === o.investorId)?.weight ?? 1));
  const wSum = weights.reduce((a, b) => a + b, 0);
  const fill = Math.min(1, size / demand);
  let allocs = live.map((o, k) => {
    const raw = Math.min(o.amount, demand <= size ? o.amount : (size * weights[k]) / wSum);
    let a = Math.floor(raw / inc) * inc;
    if (a < min) a = 0;
    return { investorId: o.investorId, amount: a };
  });
  // distribute rounding remainder (or shortfall when undersubscribed nothing to do)
  const target = Math.min(size, demand);
  let rem = target - allocs.reduce((s, a) => s + a.amount, 0);
  const sorted = [...allocs].sort((a, b) => b.amount - a.amount);
  let k = 0;
  while (rem >= inc && k < 10000) {
    const a = sorted[k % sorted.length];
    const ord = live.find((o) => o.investorId === a.investorId)!;
    if (a.amount + inc <= ord.amount && a.amount > 0) {
      a.amount += inc;
      rem -= inc;
    }
    k++;
  }
  allocs = allocs.filter((a) => a.amount > 0);
  void fill;
  return { allocations: allocs, demand, live };
}
