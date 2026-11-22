# RL1 ORBIT: multi-issuer DLT bond demo

An interactive Next.js demo of a hypothetical pan-European bond programme on **Regulated Layer One (RL1)**.

- **Plain vanilla bonds from the RL1 banks.** ABN AMRO, Crédit Mutuel Alliance Fédérale (BFCM), DekaBank, DZ BANK, LBBW, Natixis, NatWest and Standard Chartered each issue USD 100m: a 3-year fixed-rate bullet with no options, under home-country law. CaixaBank and CACEIS issue alongside them. Erste Group and Raiffeisen Bank International issue EUR 100m.
- **Cecabank** coordinates the programme: arranger, joint book, fiscal and paying agent, and ERIR for the CaixaBank tranche.
- **Chartered Investment** keeps the register for the eight RL1 tranches (eWpG register, DEEP, contractual registers) and runs the **ORBIT Special Fund**, a German Spezial-AIF with electronic units on RL1.
- **OeKB CSD** rubber-stamps every tranche. It is issuer CSD for all 12: it holds the global positions, allocates AT ISINs and runs a CSD-operated DLT service, so every tranche meets the Eurosystem CSD criterion. Eligibility also needs EUR and an EEA issuer and law. A one-click switch shows 10 of 12 eligible in EUR.
- **Seturion DLT TSS** (BaFin, October 2026) is the only trading venue. There is no exchange listing.

## Modules

| Route | What it shows |
|---|---|
| `/` | Programme overview, system map, tranche table, EUR switch |
| `/participants` | Every institution: legal form, supervisor, duties, RACI |
| `/primary` | T-30 → T+2 workflow per jurisdiction, book-building, pricing maths, allocation, DvP |
| `/registrar` | What "registrar" means legally and technically; a live register you can operate |
| `/secondary` | Seturion order book, pre-trade checks, clean/dirty pricing, atomic settlement, MiFIR transparency |
| `/eligibility` | OeKB as issuer CSD for all, Eurosystem eligibility checker, ECMS pledge |
| `/lifecycle` | Coupons, record dates, Pontes payments, redemption, exceptional events |
| `/architecture` | RL1 network, Solidity contract sketches, ISO 20022 map |
| `/legal` | About 35 legal instruments, jurisdiction matrix, conflict of laws, glossary |
| `/fund` | Chartered Investment ORBIT Special Fund: portfolio, NAV, unit register, subscriptions |

Simulation state is shared across pages and saved in `localStorage`. Use "Reset simulation" in the sidebar to start over.

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Every push to `main` builds a static export (`NEXT_PUBLIC_BASE_PATH=/<repo>`) and publishes `out/` to the `gh-pages` branch (`.github/workflows/deploy.yml`).

## Disclaimer

A hypothetical scenario for demonstration only. It is not affiliated with or endorsed by the institutions named. Issuances, spreads, ratings, ISINs, investors, fund terms and role allocations are illustrative. Nothing here is legal or investment advice.
