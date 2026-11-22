// Legal library. Citations name the instrument and, where the provision is
// well-established, the article. This is an educational map, not legal advice;
// every live transaction needs opinions from counsel in each jurisdiction.

export type Juris = "EU" | "Eurosystem" | "ES" | "FR" | "DE" | "AT" | "NL" | "GB" | "LU" | "US";
export type Topic =
  | "DLT"
  | "Market infrastructure"
  | "Trading"
  | "Offering"
  | "Register & title"
  | "Settlement finality"
  | "Collateral"
  | "Resolution"
  | "ICT & data"
  | "AML"
  | "Conflict of laws"
  | "Corporate";

export interface LegalItem {
  id: string;
  short: string;
  title: string;
  citation: string;
  juris: Juris;
  topics: Topic[];
  summary: string;
  orbit: string;
  provisions: string[];
}

export const LEGAL: LegalItem[] = [
  // ------------------------------------------------------------------ EU
  {
    id: "dlt-pilot", short: "DLT Pilot Regime", juris: "EU", topics: ["DLT", "Market infrastructure", "Trading"],
    title: "Regulation on a pilot regime for market infrastructures based on distributed ledger technology",
    citation: "Regulation (EU) 2022/858, applicable since 23 March 2023",
    summary:
      "Creates three kinds of DLT market infrastructure: the DLT MTF, the DLT SS (settlement system) and the DLT TSS (trading and settlement system). Operators get targeted exemptions from MiFID II/MiFIR and CSDR so that DLT-recorded financial instruments can be traded and settled on DLT.",
    orbit:
      "Seturion holds a DLT TSS licence (BaFin, October 2026). That one licence lets it run the secondary order book and the atomic DvP settlement for ORBIT bonds. The Pilot size caps are checked on admission of each tranche.",
    provisions: [
      "Art. 2 — definitions of DLT market infrastructure, DLT MTF, DLT SS and DLT TSS",
      "Art. 3 — limits: bonds and other debt (excluding sovereign debt) with an issue size below €1bn; total market value of DLT financial instruments on a DLT MI ≤ €6bn (with a transition threshold of €9bn)",
      "Art. 4 — requirements and exemptions for DLT MTFs (e.g. admission of natural persons and non-intermediaries as members)",
      "Art. 5 — requirements and exemptions for DLT SSs, including the alternative to book-entry at a CSD. Cash settlement in central-bank money where practical and available; otherwise commercial-bank money or e-money tokens",
      "Art. 6 — DLT TSS: the combined trading and settlement licence",
      "Art. 7 — additional requirements: business plan, rules and legal terms, governance of the DLT, ICT and cyber resilience, safekeeping of clients' funds and instruments, exit strategy",
      "Art. 8–10 — specific permissions, granted by the NCA after consulting ESMA",
    ],
  },
  {
    id: "csdr", short: "CSDR", juris: "EU", topics: ["Market infrastructure", "Register & title", "Settlement finality"],
    title: "Central Securities Depositories Regulation",
    citation: "Regulation (EU) No 909/2014, as amended by Regulation (EU) 2023/2845 (CSDR Refit)",
    summary:
      "Requires transferable securities admitted to trading on a trading venue to be in book-entry form at a CSD, and sets authorisation, prudential and conduct rules for CSDs and settlement discipline.",
    orbit:
      "Governs OeKB CSD's role as issuer CSD for all 12 tranches, including integrity of the issue (Art. 37) and the issuer's freedom to choose an EU CSD in another Member State (Art. 49). Seturion's Pilot Regime licence covers trading and DvP orchestration; final book entries sit at OeKB.",
    provisions: [
      "Art. 3 — book-entry form (immobilisation or direct dematerialised issuance); Art. 3(2) for securities traded on trading venues",
      "Art. 7 — settlement discipline (cash penalties for settlement fails)",
      "Art. 37 — integrity of the issue: reconciliation that the number of securities in the issue equals the sum in the securities accounts",
      "Art. 38 — protection of participants' and their clients' securities (segregation)",
      "Art. 39 — settlement finality; Art. 40 — cash settlement (central-bank money where practical and available)",
      "Art. 49 — the issuer's freedom to choose any EU-authorised CSD",
    ],
  },
  {
    id: "mifid2", short: "MiFID II", juris: "EU", topics: ["Trading", "Offering"],
    title: "Markets in Financial Instruments Directive II",
    citation: "Directive 2014/65/EU",
    summary:
      "Defines financial instruments and transferable securities, licenses investment firms and trading venues, and sets conduct rules (client categorisation, product governance, best execution).",
    orbit:
      "ORBIT bonds are transferable securities whatever their DLT form (the principle of technology neutrality). Target market: eligible counterparties and professional clients only. Seturion's trading function is a MiFID II multilateral system under its DLT TSS licence.",
    provisions: [
      "Art. 4(1)(44) — transferable securities; Annex I Section C — financial instruments",
      "Art. 16(3) and Art. 24(2) — product governance: manufacturer and distributor target market",
      "Art. 18–19 — operating an MTF: non-discretionary rules",
      "Art. 30 — eligible counterparties; Annex II — professional clients",
    ],
  },
  {
    id: "mifir", short: "MiFIR", juris: "EU", topics: ["Trading"],
    title: "Markets in Financial Instruments Regulation",
    citation: "Regulation (EU) No 600/2014, as amended by Regulation (EU) 2024/791",
    summary: "Pre- and post-trade transparency, transaction reporting and instrument reference data.",
    orbit:
      "Seturion publishes quotes and trades in ORBIT bonds. Large-in-scale trades get deferred publication. Investment firms report transactions. Seturion submits reference data for each ISIN to FIRDS.",
    provisions: [
      "Art. 8 — pre-trade transparency for bonds",
      "Art. 10 — post-trade transparency for bonds",
      "Art. 11 — deferred publication (e.g. large-in-scale)",
      "Art. 26 — transaction reporting; Art. 27 — instrument reference data",
    ],
  },
  {
    id: "prospectus", short: "Prospectus Regulation", juris: "EU", topics: ["Offering"],
    title: "Prospectus Regulation",
    citation: "Regulation (EU) 2017/1129, as amended by the Listing Act (Regulation (EU) 2024/2809)",
    summary:
      "A prospectus is required for public offers or for admission to a regulated market, unless an exemption applies.",
    orbit:
      "The USD tranches use the wholesale exemptions: offer only to qualified investors and a minimum denomination of $200,000 (above the €100,000 threshold), with admission to the Seturion DLT TSS rather than a regulated market. The Austrian EUR tranches use the same exemptions (€100,000 denomination). No tranche is listed on an exchange, so no approved prospectus is needed.",
    provisions: [
      "Art. 1(4)(a) — offer addressed solely to qualified investors",
      "Art. 1(4)(c) — denomination per unit of at least €100,000",
      "Art. 3(3) — prospectus needed for admission to a regulated market",
      "Art. 8 — base prospectus and final terms",
      "Art. 2(m)(iii) — choice of home Member State for third-country issuers (relevant for Standard Chartered PLC and NatWest Group plc)",
      "Art. 25 — passporting of an approved prospectus",
    ],
  },
  {
    id: "sfd", short: "Settlement Finality Directive", juris: "EU", topics: ["Settlement finality", "Conflict of laws"],
    title: "Directive on settlement finality in payment and securities settlement systems",
    citation: "Directive 98/26/EC (as amended)",
    summary:
      "Protects transfer orders entered into a designated system from being unwound by participant insolvency, and fixes the governing law for rights in securities recorded in a register or account.",
    orbit:
      "Seturion's rulebook defines when a DvP instruction is entered and when it becomes irrevocable. On RL1 that is the block in which the atomic swap executes. T2/T2S finality covers the EUR legs via Pontes and OeKB CSD.",
    provisions: [
      "Art. 2(a) — 'system': formal arrangement with common rules, designated and notified",
      "Art. 3 — transfer orders and netting are legally enforceable even on insolvency, if entered before the moment of opening of proceedings",
      "Art. 5 — the moment of irrevocability is defined by the system's rules",
      "Art. 9(2) — rights of holders of securities recorded in a register, account or centralised deposit system located in a Member State are governed by that Member State's law",
    ],
  },
  {
    id: "fcd", short: "Financial Collateral Directive", juris: "EU", topics: ["Collateral", "Conflict of laws"],
    title: "Directive on financial collateral arrangements",
    citation: "Directive 2002/47/EC (as amended)",
    summary:
      "Simplifies the creation and enforcement of title-transfer and security financial collateral, including close-out netting.",
    orbit:
      "Underpins pledges of ORBIT bonds: repo between members, and pledges to the Eurosystem of the eligible (EUR, EEA-issuer) tranches. Art. 9 points to the law of the country where the relevant account is maintained (PRIMA).",
    provisions: [
      "Art. 2 — title transfer vs security financial collateral; 'book entry securities collateral'",
      "Art. 4 — enforcement without notice or court approval",
      "Art. 9 — conflict of laws: the law of the country in which the relevant account is maintained",
    ],
  },
  {
    id: "brrd", short: "BRRD", juris: "EU", topics: ["Resolution"],
    title: "Bank Recovery and Resolution Directive",
    citation: "Directive 2014/59/EU, as amended by Directive (EU) 2019/879 (BRRD II)",
    summary: "Resolution tools including bail-in, and the creditor hierarchy for senior preferred vs non-preferred debt.",
    orbit:
      "Bank-issued ORBIT tranches are senior preferred and can be bailed in. A bail-in write-down or conversion is executed by the registrar on-chain (forced burn or conversion) on instruction from the resolution authority, documented by a resolution order reference.",
    provisions: [
      "Art. 43–44 — bail-in tool and its scope",
      "Art. 55 — contractual recognition of bail-in for liabilities governed by third-country law",
      "Art. 108 — ranking: senior preferred above senior non-preferred",
    ],
  },
  {
    id: "crr", short: "CRR / CRR3", juris: "EU", topics: ["Resolution", "Collateral"],
    title: "Capital Requirements Regulation",
    citation: "Regulation (EU) No 575/2013, as amended by Regulation (EU) 2024/1623 (CRR3)",
    summary:
      "Prudential treatment for holders. Tokenised traditional assets that confer the same rights as the conventional asset are treated like it (BCBS SCO60 'Group 1a').",
    orbit:
      "Investor banks treat an ORBIT bond like the equivalent conventional bank bond, provided legal certainty of the DLT record is confirmed by legal opinion. MREL eligibility of issuers' senior debt falls under CRR Art. 72b.",
    provisions: ["Art. 72a–72b — eligible liabilities instruments (MREL)", "Art. 501d — transitional treatment of crypto-asset exposures (CRR3)"],
  },
  {
    id: "mica", short: "MiCA (exclusion)", juris: "EU", topics: ["DLT"],
    title: "Markets in Crypto-Assets Regulation",
    citation: "Regulation (EU) 2023/1114",
    summary: "Regulates crypto-assets that are not otherwise regulated financial instruments.",
    orbit:
      "ORBIT bonds are financial instruments, so MiCA does not apply to them (Art. 2(4)(a)). MiCA does matter for the USD cash leg if an e-money token is used as the settlement asset, which the Pilot Regime allows.",
    provisions: ["Art. 2(4)(a) — excludes financial instruments", "Title IV — e-money tokens (possible USD settlement asset)"],
  },
  {
    id: "mar", short: "MAR", juris: "EU", topics: ["Trading"],
    title: "Market Abuse Regulation",
    citation: "Regulation (EU) No 596/2014",
    summary: "Insider dealing, unlawful disclosure and market manipulation; issuer disclosure of inside information.",
    orbit:
      "Seturion surveils the ORBIT order book and files STORs. Issuers handle pricing-day information under the MAR market-sounding regime.",
    provisions: ["Art. 11 — market soundings (pre-marketing)", "Art. 16 — prevention and detection; STORs", "Art. 17 — public disclosure of inside information"],
  },
  {
    id: "dora", short: "DORA", juris: "EU", topics: ["ICT & data"],
    title: "Digital Operational Resilience Act",
    citation: "Regulation (EU) 2022/2554, applicable since 17 January 2025",
    summary: "ICT risk management, incident reporting, resilience testing and ICT third-party risk for financial entities.",
    orbit:
      "Every regulated ORBIT participant (banks, Seturion, OeKB CSD, registrars) treats RL1 as an ICT third-party service. Contracts include the Art. 30 key provisions: audit, exit and SLAs. Smart-contract code is subject to testing and change management.",
    provisions: ["Art. 5–16 — ICT risk management framework", "Art. 17–23 — ICT incident management and reporting", "Art. 28–30 — ICT third-party risk and key contractual provisions"],
  },
  {
    id: "gdpr", short: "GDPR", juris: "EU", topics: ["ICT & data"],
    title: "General Data Protection Regulation",
    citation: "Regulation (EU) 2016/679",
    summary: "Pseudonymous on-chain addresses become personal data when they can be linked to natural persons.",
    orbit:
      "No personal data goes on RL1. The chain holds only pseudonymous addresses and claim hashes. The registrar keeps the identity mapping off-chain, which keeps erasure and rectification feasible.",
    provisions: ["Art. 4(5) — pseudonymisation", "Art. 17 — right to erasure", "Art. 25 — data protection by design"],
  },
  {
    id: "amlr", short: "AML framework", juris: "EU", topics: ["AML"],
    title: "Anti-Money Laundering Regulation and Directive",
    citation: "Regulation (EU) 2024/1624 (AMLR, applies from July 2027); Directive (EU) 2015/849 as amended (until then)",
    summary: "Customer due diligence, ongoing monitoring and record keeping by obliged entities.",
    orbit:
      "Each investor's custodian or registrar issues a KYC claim to the on-chain IdentityRegistry. An expired claim blocks transfers to and from that wallet, as with Baltic Credit Union in the demo.",
    provisions: ["Customer due diligence and ongoing monitoring obligations", "Record retention (5 years)"],
  },
  {
    id: "rome1", short: "Rome I", juris: "EU", topics: ["Conflict of laws"],
    title: "Regulation on the law applicable to contractual obligations",
    citation: "Regulation (EC) No 593/2008",
    summary: "Freedom of choice of law for contracts. Obligations arising from the negotiable character of negotiable instruments are excluded.",
    orbit:
      "Each issuer chooses its home law for the Terms & Conditions (Spanish, French, Dutch, German, Austrian or English). Proprietary questions follow SFD/FCD and the law of the register, not Rome I.",
    provisions: ["Art. 1(2)(d) — exclusion of negotiable-instrument obligations", "Art. 3 — freedom of choice"],
  },
  {
    id: "sce-reg", short: "SCE Statute", juris: "EU", topics: ["Corporate"],
    title: "Council Regulation on the Statute for a European Cooperative Society",
    citation: "Council Regulation (EC) No 1435/2003",
    summary: "A supranational cooperative form: members, one member one vote (by default), registered office in a Member State.",
    orbit: "RL1 is an SCE seated in Luxembourg. Members govern the network jointly, and the network is neutral towards all issuers and venues.",
    provisions: ["Art. 1 — form and objects", "Art. 59 — voting rights of members"],
  },
  // ------------------------------------------------------------ Eurosystem
  {
    id: "ecb-gd", short: "Eurosystem collateral framework", juris: "Eurosystem", topics: ["Collateral"],
    title: "Guideline on the implementation of the Eurosystem monetary policy framework (General Documentation)",
    citation: "Guideline (EU) 2015/510 (ECB/2014/60), as amended",
    summary:
      "Eligibility criteria for marketable assets. These cover asset type, principal and coupon structure, non-subordination, place of issue and settlement (EEA, eligible SSS), acceptable markets, issuer type and establishment, governing law, euro denomination and credit quality, plus close-links and own-use rules, haircuts and valuation.",
    orbit:
      "The eligibility checker on the ECB page applies these criteria to every ORBIT tranche. OeKB makes every tranche pass the CSD / place-of-issue criterion. The remaining blockers are currency (USD fails) and issuer/law (UK issuers fail). With the defaults, Erste and RBI (EUR) pass, assuming the Eurosystem accepts Seturion as an acceptable non-regulated market, since no tranche is listed on an exchange.",
    provisions: [
      "Marketable debt instrument with a fixed, unconditional principal amount",
      "Coupon structure: fixed, zero or eligible floating",
      "Not subordinated",
      "Issued in the EEA and deposited or settled in an eligible SSS / CSD that complies with CSDR",
      "Admitted to a regulated market or an acceptable non-regulated market",
      "Issuer established in the EEA (non-EEA G10 for certain asset types only)",
      "Governed by the law of an EEA Member State",
      "Denominated in euro",
      "Credit quality step 3 or better (≥ BBB-) via an accepted ECAI",
      "Close links: counterparties may not submit assets of closely linked issuers; own-use is prohibited for unsecured bank bonds",
    ],
  },
  {
    id: "ecb-dlt-2026", short: "ECB — DLT collateral decision", juris: "Eurosystem", topics: ["Collateral", "DLT"],
    title: "ECB paves way for acceptance of DLT-based assets as eligible Eurosystem collateral",
    citation: "ECB press release, 27 January 2026 — applies from 30 March 2026",
    summary:
      "From 30 March 2026 the Eurosystem accepts marketable assets issued in CSD-operated DLT services, provided they meet all standard eligibility criteria and are available in eligible SSSs reachable via T2S. Assets that exist only on DLT outside eligible SSSs remain under study, with a staggered approach.",
    orbit:
      "This is why every ORBIT tranche uses OeKB CSD. Issuance through a CSD-operated DLT service puts all bonds in the 'phase 1' accepted category. Without OeKB, DLT-register-only bonds settled on Seturion would fall into the 'still under study' category.",
    provisions: ["Same eligibility criteria and mobilisation process as for other marketable assets", "Availability in eligible SSSs that comply with CSDR and are reachable via T2S"],
  },
  {
    id: "pontes", short: "Pontes", juris: "Eurosystem", topics: ["Settlement finality", "DLT"],
    title: "Eurosystem Pontes — settlement of DLT transactions in central-bank money",
    citation: "Eurosystem initiative (pilot from 2026); long-term track: Appia",
    summary:
      "Links DLT platforms with TARGET Services so that DLT-based transactions can settle in central-bank money. The DLT side locks the asset, T2 settles the cash, and a confirmation releases the asset.",
    orbit:
      "EUR cash leg for the Erste and RBI primary DvP and for coupons and redemption. USD has no Eurosystem central-bank money, so USD legs use a tokenised commercial-bank deposit or a USD e-money token, as Pilot Regime Art. 5 permits.",
    provisions: ["Lock → T2 payment → confirm/release pattern", "Finality of the cash leg under TARGET rules (SFD-designated)"],
  },
  // ------------------------------------------------------------------ ES
  {
    id: "es-lmvsi", short: "Ley 6/2023 (LMVSI)", juris: "ES", topics: ["DLT", "Register & title"],
    title: "Ley 6/2023, de 17 de marzo, de los Mercados de Valores y de los Servicios de Inversión",
    citation: "BOE-A-2023-7053",
    summary:
      "Spanish securities markets law. Lets securities be represented by distributed-ledger registry systems, alongside book entries, and introduces the ERIR: the entity responsible for administering the inscription and registry of DLT-represented securities.",
    orbit:
      "The CaixaBank tranche is a Spanish-law security represented on RL1. Cecabank is the ERIR named by the issuer, so its RL1 register is the legal record of ownership.",
    provisions: [
      "Art. 6 — forms of representation: book entries, certificates or DLT-based registry systems",
      "Art. 7 — the issuance document must state the form of representation and the registry entity",
      "Art. 8 — the issuer designates one or more ERIRs (CSDs, credit institutions, investment firms or DLT MIs) to keep the DLT registry",
    ],
  },
  {
    id: "es-rd814", short: "RD 814/2023", juris: "ES", topics: ["Register & title", "ICT & data"],
    title: "Real Decreto 814/2023 — financial instruments, admission to trading, registry and market infrastructures",
    citation: "BOE-A-2023-22764",
    summary: "Implementing rules, including the ERIR's obligation to keep a contingency plan for network incidents and registry continuity.",
    orbit: "Cecabank's off-chain golden copy and the procedure to move to a successor network are part of this contingency plan.",
    provisions: ["Contingency plan and business continuity for the DLT registry"],
  },
  {
    id: "es-rd815", short: "RD 815/2023", juris: "ES", topics: ["Register & title"],
    title: "Real Decreto 815/2023 — implementing Ley 6/2023 on official registers",
    citation: "Real Decreto 815/2023 (BOE, Nov 2023)",
    summary: "Includes the CNMV's public official register of the entities administering the inscription and registry for each issuance.",
    orbit: "After issuance the CaixaBank ORBIT bond appears in the CNMV list together with Cecabank as its ERIR.",
    provisions: ["CNMV register of ERIRs per issue"],
  },
  // ------------------------------------------------------------------ FR
  {
    id: "fr-cmf", short: "Code monétaire et financier — DEEP", juris: "FR", topics: ["DLT", "Register & title"],
    title: "Code monétaire et financier, Art. L.211-3, L.211-7, R.211-9-7",
    citation: "As amended by Ordonnance n° 2017-1674 and Décret n° 2018-1226",
    summary:
      "Securities not admitted to a CSD may be inscribed in a shared electronic recording device (DEEP, 'dispositif d'enregistrement électronique partagé'). Inscription there has the same effect as inscription in a securities account.",
    orbit: "The CACEIS, Natixis and BFCM tranches are registered securities inscribed in a DEEP on RL1, with OeKB CSD inscribed as holder. CACEIS Corporate Trust keeps the CACEIS register; Chartered Investment keeps the Natixis and BFCM registers.",
    provisions: [
      "L.211-3 — securities inscribed in an account kept by the issuer or an intermediary, or in a DEEP",
      "L.211-7 — transfer by inscription in the DEEP",
      "R.211-9-7 — DEEP requirements: integrity, owner identification, business continuity plan, periodic copy",
    ],
  },
  {
    id: "fr-ord2017", short: "Ordonnance 2017-1674", juris: "FR", topics: ["DLT"],
    title: "Ordonnance n° 2017-1674 du 8 décembre 2017 relative à l'utilisation d'un dispositif d'enregistrement électronique partagé",
    citation: "JORF 9 Dec 2017; Décret n° 2018-1226 du 24 décembre 2018",
    summary: "Extended DLT inscription to unlisted securities (TCN, bonds, fund units).",
    orbit: "The legal basis for French-law ORBIT bonds existing natively on RL1.",
    provisions: ["Extension of DEEP to securities not admitted to CSD operations"],
  },
  // ------------------------------------------------------------------ DE
  {
    id: "de-ewpg", short: "eWpG", juris: "DE", topics: ["DLT", "Register & title"],
    title: "Gesetz über elektronische Wertpapiere (eWpG)",
    citation: "Electronic Securities Act of 3 June 2021 (BGBl. I p. 1423) and eWpRV",
    summary:
      "Lets bearer bonds (and certain fund units and shares) be issued as electronic securities, with no physical certificate, by entry in a central register or a crypto-securities register (Kryptowertpapierregister).",
    orbit:
      "The DekaBank, DZ BANK and LBBW tranches are crypto securities. Chartered Investment, as registerführende Stelle, keeps the register on RL1 with a collective entry (§8) for OeKB CSD.",
    provisions: [
      "§2 — the electronic security has the same effect as a certificated one",
      "§4(3) — crypto security: entered in a crypto-securities register",
      "§8 — collective entry (Sammeleintragung) vs individual entry (Einzeleintragung)",
      "§16 — crypto-securities register; §16(2) the issuer designates the registrar",
      "§17 — register content: essential content, issue volume, nominal amount, issuer, identifier, type of entry, holder",
      "§20 — publication of the register entry; BaFin keeps a public list",
      "§2(3) — an electronic security counts as a thing (Sache) under §90 BGB",
      "§24–§25 — transfer of ownership requires the holder's instruction and the re-entry to the acquirer",
    ],
  },
  {
    id: "de-kwg", short: "KWG (registry licence)", juris: "DE", topics: ["Register & title"],
    title: "Kreditwesengesetz — crypto-securities registry management as a financial service",
    citation: "KWG §1(1a) sentence 2 no. 8",
    summary: "Running a crypto-securities register is a licensable financial service supervised by BaFin.",
    orbit: "Chartered Investment needs this licence to keep the crypto-securities registers of the German tranches. The scenario assumes it holds it.",
    provisions: ["§1(1a) S.2 Nr. 8 — Kryptowertpapierregisterführung", "§32 — licence requirement"],
  },
  {
    id: "kagb", short: "KAGB (special fund)", juris: "DE", topics: ["Offering", "Register & title"],
    title: "Kapitalanlagegesetzbuch (German Investment Code)",
    citation: "KAGB of 4 July 2013, as amended (incl. Fondsstandortgesetz 2021 and Zukunftsfinanzierungsgesetz 2023)",
    summary:
      "Regulates investment funds and their managers. A Spezial-AIF may only be held by professional and semi-professional investors. Fund units of a German investment fund can be issued as electronic unit certificates under the eWpG, including in a crypto-securities register.",
    orbit:
      "The ORBIT Special Fund, initiated by Chartered Investment, is an open-ended domestic Spezial-AIF with fixed investment conditions. It buys a basket of ORBIT bonds. A licensed KVG manages it, a depositary holds the assets, and Chartered Investment keeps the electronic unit register on RL1.",
    provisions: [
      "§1(6): Spezial-AIF: units held only by professional and semi-professional investors",
      "§20 ff.: licence of the management company (KVG)",
      "§80 ff.: depositary (Verwahrstelle) for AIF",
      "§95: unit certificates, including electronic unit certificates (with the eWpG)",
      "§284: open-ended domestic Spezial-AIF with fixed investment conditions",
    ],
  },
  // ------------------------------------------------------------------ AT
  {
    id: "at-depg", short: "Depotgesetz (DepG)", juris: "AT", topics: ["Register & title"],
    title: "Austrian Securities Deposit Act (Depotgesetz)",
    citation: "BGBl. Nr. 424/1969, as amended",
    summary:
      "Governs custody of securities, including collective custody (Sammelverwahrung) and global certificates (Sammelurkunde) deposited with the CSD. Investors hold co-ownership interests in the collective holding.",
    orbit:
      "OeKB CSD is issuer CSD for every ORBIT tranche, so Austrian custody law governs the CSD layer for all of them. Investors hold co-ownership in OeKB's collective holding; the token balances on RL1 are OeKB's book entries. That is the 'rubber stamp'.",
    provisions: ["Collective custody and global certificate provisions", "Co-ownership of the collective holding; transfer by book entry"],
  },
  {
    id: "at-kmg", short: "KMG 2019", juris: "AT", topics: ["Offering"],
    title: "Kapitalmarktgesetz 2019",
    citation: "BGBl. I Nr. 62/2019",
    summary: "Austrian accompanying rules to the EU Prospectus Regulation; the FMA is the competent authority.",
    orbit: "Not triggered: the Erste and RBI tranches are wholesale (€100,000 denomination, qualified investors only) and are not admitted to a regulated market, so no FMA-approved prospectus is needed.",
    provisions: ["FMA as competent authority for prospectus approval"],
  },
  // ------------------------------------------------------------------ NL
  {
    id: "nl-bw", short: "Dutch Civil Code / Wge", juris: "NL", topics: ["Register & title"],
    title: "Burgerlijk Wetboek Book 3 & Wet giraal effectenverkeer",
    citation: "BW 3:94 (assignment of registered claims); Wge (book-entry securities via Euroclear Nederland)",
    summary:
      "There is no dedicated DLT-securities statute. Registered (op naam) instruments transfer by deed of assignment plus notification. Book-entry securities fall under the Wge regime at Euroclear Nederland.",
    orbit:
      "ABN AMRO's tranche uses a contractual issuer-level register kept by Chartered Investment, in which OeKB CSD is the registered holder of the whole issue. Investors then hold OeKB book entries, so no BW 3:94 deed is needed per investor transfer.",
    provisions: ["BW 3:94 — deed and notification for registered claims"],
  },
  // ------------------------------------------------------------------ GB
  {
    id: "gb-dss", short: "UK Digital Securities Sandbox", juris: "GB", topics: ["DLT", "Market infrastructure"],
    title: "Financial Services and Markets Act 2023 (Digital Securities Sandbox) Regulations 2023",
    citation: "SI 2023/1398 under FSMA 2023 s.13",
    summary: "The UK's sandbox for digital securities infrastructure, the UK counterpart to the EU Pilot Regime.",
    orbit:
      "Shown for comparison. The English-law tranches of Standard Chartered PLC and NatWest Group plc sit in an EU CSD (OeKB) and trade on an EU venue (Seturion), not in the UK DSS. Chartered Investment keeps the contractual register.",
    provisions: ["Digital securities depository and trading venue modifications"],
  },
  {
    id: "gb-pda", short: "Property (Digital Assets etc) Act 2025", juris: "GB", topics: ["Register & title"],
    title: "Property (Digital Assets etc) Act 2025",
    citation: "UK Act of Parliament, 2025",
    summary: "Confirms that a thing, including a digital or electronic thing, can attract personal property rights even if it is neither a thing in possession nor a thing in action.",
    orbit: "Supports proprietary treatment of the on-chain record for the English-law tranche.",
    provisions: ["Third category of personal property"],
  },
  // ------------------------------------------------------------------ LU
  {
    id: "lu-blockchain", short: "Luxembourg Blockchain Laws", juris: "LU", topics: ["DLT", "Register & title"],
    title: "Laws of 1 March 2019, 22 January 2021 and 15 March 2023 (Blockchain I–III), amending the Law of 1 August 2001 on the circulation of securities",
    citation: "Mémorial A",
    summary: "Securities accounts may be held and transfers recorded through secure electronic recording devices, including DLT. Blockchain III adapted Luxembourg law to the Pilot Regime.",
    orbit: "This is the context for RL1's seat in Luxembourg. No ORBIT tranche is Luxembourg-law, but a Luxembourg UCITS (Danube) holds ORBIT bonds via its depositary.",
    provisions: ["DLT-based securities accounts and transfers", "Pilot Regime adaptation (2023)"],
  },
  // ------------------------------------------------------------------ US
  {
    id: "us-regs", short: "Regulation S", juris: "US", topics: ["Offering"],
    title: "US Securities Act of 1933 — Regulation S (Rules 901–905)",
    citation: "17 CFR 230.901–905",
    summary: "Safe harbour for offers and sales outside the United States, which therefore need no SEC registration.",
    orbit:
      "USD tranches are offered under Reg S (Category 2 assumed, conservatively), with a 40-day distribution compliance period. The ComplianceModule enforces this on-chain: wallets flagged as US persons cannot receive tokens, so the Hudson Ridge order is rejected.",
    provisions: ["Rule 903 — offering restrictions; Category 2 distribution compliance period of 40 days for debt", "Rule 902(k) — definition of US person"],
  },
];

export const legalById = (id: string) => LEGAL.find((l) => l.id === id);

// Jurisdiction matrix ---------------------------------------------------------
export interface JurisRow {
  cc: "ES" | "FR" | "DE" | "AT" | "NL" | "GB";
  issuers: string;
  statute: string;
  statutoryBasis: "Yes" | "Partial" | "No (contractual)" | "CSD route";
  registrarConcept: string;
  form: string;
  transfer: string;
  supervisor: string;
  nna: string;
  insolvency: string;
  ecbRoute: string;
}

export const JURIS_MATRIX: JurisRow[] = [
  {
    cc: "ES", issuers: "CaixaBank", statute: "Ley 6/2023 Art. 6–8; RD 814/2023; RD 815/2023", statutoryBasis: "Yes",
    registrarConcept: "ERIR — Entidad Responsable de la administración de la Inscripción y Registro (Cecabank)",
    form: "DLT-represented securities (representación mediante sistemas basados en TRD)",
    transfer: "Inscription in the DLT registry kept by the ERIR",
    supervisor: "CNMV (issue & ERIR), Banco de España / ECB-SSM (issuer)", nna: "CNMV",
    insolvency: "The DLT entry establishes ownership; investors' positions are segregated from the ERIR's estate",
    ecbRoute: "CSD criterion met via OeKB. Fails only on USD; a EUR tranche would be eligible",
  },
  {
    cc: "FR", issuers: "CACEIS Bank, Natixis, BFCM", statute: "CMF L.211-3, L.211-7, R.211-9-7; Ord. 2017-1674", statutoryBasis: "Yes",
    registrarConcept: "Teneur de registre of a DEEP (CACEIS Corporate Trust for CACEIS; Chartered Investment for Natixis, BFCM)",
    form: "Registered securities (titres nominatifs) inscribed in a DEEP",
    transfer: "Inscription in the DEEP. Same effect as a securities-account entry",
    supervisor: "AMF, ACPR / ECB-SSM", nna: "Euroclear France",
    insolvency: "DEEP inscription establishes ownership against third parties",
    ecbRoute: "CSD criterion met via OeKB. Fails only on USD; a EUR tranche would be eligible",
  },
  {
    cc: "DE", issuers: "DekaBank, DZ BANK, LBBW", statute: "eWpG §§4, 8, 16–23; KWG §1(1a) Nr. 8; eWpRV", statutoryBasis: "Yes",
    registrarConcept: "Registerführende Stelle of a Kryptowertpapierregister (Chartered Investment); collective entry for OeKB CSD",
    form: "Electronic bearer bond — crypto security (Kryptowertpapier)",
    transfer: "Instruction by the holder + registry entry (eWpG §24–25). The electronic security counts as a thing (Sache, §2(3))",
    supervisor: "BaFin (registrar & issuer), ECB-SSM (bank issuers)", nna: "WM Datenservice",
    insolvency: "The registered holder is the owner. Segregation is required for collective entries",
    ecbRoute: "CSD criterion met via OeKB. Fails only on USD; a EUR tranche would be eligible",
  },
  {
    cc: "AT", issuers: "Erste Group, Raiffeisen Bank International", statute: "Depotgesetz; CSDR", statutoryBasis: "CSD route",
    registrarConcept: "Issuer CSD (OeKB CSD) operating a DLT service; global note in collective custody",
    form: "Global note (Sammelurkunde) at OeKB CSD; the token balances are the CSD book-entry layer",
    transfer: "Book entry in the CSD system, represented by the RL1 token transfer executed under OeKB's operator role",
    supervisor: "FMA (CSD & prospectus), OeNB (oversight), ECB-SSM (issuers)", nna: "OeKB",
    insolvency: "Co-ownership in the collective holding under DepG; CSDR segregation",
    ecbRoute: "ELIGIBLE under one assumption: EUR, EEA issuer and law, OeKB CSD (eligible SSS via T2S), covered by the ECB decision effective 30 Mar 2026. No exchange listing, so the acceptable-market criterion assumes the Eurosystem accepts Seturion",
  },
  {
    cc: "NL", issuers: "ABN AMRO", statute: "BW 3:94; Wge (for book-entry)", statutoryBasis: "No (contractual)",
    registrarConcept: "Contractual registrar under the Agency Agreement (Chartered Investment); OeKB CSD registered holder",
    form: "Registered notes (op naam) with a contractual DLT register",
    transfer: "Deed of assignment (on-chain signed instruction) plus notice (registrar entry)",
    supervisor: "AFM, DNB / ECB-SSM", nna: "Euroclear Nederland",
    insolvency: "Depends on enforceability of the contractual deed and notice mechanics. Legal opinion is essential",
    ecbRoute: "CSD criterion met via OeKB. Fails only on USD; a EUR tranche would be eligible",
  },
  {
    cc: "GB", issuers: "Standard Chartered PLC, NatWest Group plc", statute: "English common law; Property (Digital Assets etc) Act 2025; Banking Act 2009", statutoryBasis: "Partial",
    registrarConcept: "Registrar under the Agency Agreement (Chartered Investment); OeKB CSD registered holder",
    form: "Registered notes, English law",
    transfer: "Registration of the transferee in the register maintained on RL1",
    supervisor: "PRA / FCA (issuer); EU venue NCA for trading", nna: "London Stock Exchange",
    insolvency: "UK resolution regime; contractual bail-in recognition in the T&Cs",
    ecbRoute: "Not eligible even with OeKB: non-EEA issuer and governing law (and USD)",
  },
];

export const GLOSSARY: [string, string][] = [
  ["DLT TSS", "DLT Trading and Settlement System: a Pilot Regime licence combining a DLT MTF and a DLT SS (Reg. 2022/858 Art. 2 and 6)."],
  ["ERIR", "Spanish registry entity for DLT-represented securities (Ley 6/2023 Art. 8)."],
  ["DEEP", "French 'shared electronic recording device' in which registered securities can be inscribed (CMF L.211-3)."],
  ["Registerführende Stelle", "Registrar of a German crypto-securities register (eWpG §16)."],
  ["Sammelurkunde", "Global certificate representing the whole issue, held by the CSD in collective custody."],
  ["Issuer CSD", "The CSD where the issue is initially recorded and centrally maintained (CSDR Annex Section A)."],
  ["NNA", "National numbering agency that allocates ISINs (ISO 6166): CNMV (ES), Euroclear France (FR), WM Datenservice (DE), OeKB (AT), Euroclear NL (NL), LSE (GB)."],
  ["CFI", "Classification of Financial Instruments (ISO 10962). ORBIT bonds: DBFUFR."],
  ["FISN", "Financial Instrument Short Name (ISO 18774), e.g. ERSTE GRP BK/2.875 BD 20291210."],
  ["DvP", "Delivery versus payment: the securities and cash legs settle together or not at all."],
  ["Atomic swap", "Both legs execute in one ledger transaction, so a partial outcome is impossible."],
  ["Pontes", "Eurosystem bridge from DLT platforms to T2 central-bank money settlement."],
  ["ECMS", "Eurosystem Collateral Management System (live June 2025)."],
  ["EADB", "Eurosystem Eligible Assets Database: the public list of eligible marketable assets."],
  ["Close links", "Control or ≥20% capital link between counterparty and issuer. Such assets cannot be pledged by that counterparty."],
  ["Own-use", "A bank pledging its own unsecured bonds to the Eurosystem. Not allowed."],
  ["Record date", "Date on which the register is snapshotted to decide who receives the coupon."],
  ["Golden copy", "The authoritative off-chain copy of the register, reconciled against chain state."],
  ["Forced transfer", "A registrar-only transfer without the holder's signature (lost keys, court order, resolution action)."],
  ["LIS", "Large in scale: trade size that qualifies for deferred post-trade publication."],
];
