# RL1 ORBIT: multi-issuer DLT bond demo

An interactive Next.js demo of a hypothetical pan-European bond programme on **Regulated Layer One (RL1)**.

- **13 issuers, 6 jurisdictions.** CaixaBank (ES), CACEIS, Natixis and BFCM / Crédit Mutuel Alliance Fédérale (FR), ABN AMRO (NL), DekaBank, DZ BANK, LBBW and Chartered Investment (DE), Standard Chartered and NatWest (GB) each issue **USD 100m**, 3 years, under home-country law. Erste Group and Raiffeisen Bank International (AT) each issue **EUR 100m**.
- **Cecabank** coordinates the programme: arranger, joint book, fiscal and paying agent, ERIR for the Spanish tranche, and contractual registrar for the NL and GB tranches.
- **Seturion DLT TSS** (BaFin, October 2026) runs secondary trading and atomic T+0 DvP settlement.
- **OeKB CSD** is the issuer CSD for the Austrian tranches. It holds the global note, assigns the ISINs and runs a CSD-operated DLT service. That route makes them Eurosystem-eligible under the ECB decision effective 30 March 2026.

## Modules

| Route | What it shows |
|---|---|
| `/` | Programme overview, system map, tranche table |
| `/participants` | Every institution: legal form, supervisor, duties, RACI |
| `/primary` | T-30 → T+2 workflow per jurisdiction, book-building, pricing maths, allocation, DvP |
| `/registrar` | What "registrar" means legally and technically; a live register you can operate |
| `/secondary` | Seturion order book, pre-trade checks, clean/dirty pricing, atomic settlement, MiFIR transparency |
| `/eligibility` | OeKB's role, Eurosystem eligibility checker, ECMS pledge with close-links and own-use checks |
| `/lifecycle` | Coupons, record dates, Pontes payments, redemption, exceptional events |
| `/architecture` | RL1 network, Solidity contract sketches, ISO 20022 map |
| `/legal` | About 35 legal instruments, jurisdiction matrix, conflict of laws, glossary |

Simulation state is shared across pages and saved in `localStorage`. Use "Reset simulation" in the sidebar to start over.

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Every push to `main` builds a static export (`NEXT_PUBLIC_BASE_PATH=/<repo>`) and publishes `out/` to the `gh-pages` branch (`.github/workflows/deploy.yml`).

## Disclaimer

A hypothetical scenario for demonstration only. It is not affiliated with or endorsed by the institutions named. Issuances, spreads, ratings, ISINs, investors and role allocations are illustrative. Nothing here is legal or investment advice.
