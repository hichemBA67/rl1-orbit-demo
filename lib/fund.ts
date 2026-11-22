// ORBIT Special Fund (Chartered Investment): valuation helpers.
// A hypothetical open-ended Spezial-AIF (KAGB §284) holding a basket of ORBIT bonds.
// Base currency USD; EUR positions are converted at PROGRAMME.fx.
import { ISSUERS, PROGRAMME, termsFor } from "./data/scenario";
import { couponAmount, accrued } from "./finance";
import type { State } from "./store";

export const FUND_ID = "ci-fund";
export const FUND_LAUNCH_PRICE = 100; // USD per unit at launch
export const FUND_SEED: Record<string, number> = { iberia: 500_000, amstel: 600_000, rhein: 400_000 }; // units
export const FUND_FEES = { mgmtPctPa: 0.15, depositaryPctPa: 0.02 };

export interface FundState {
  units: Record<string, number>;
  netSubs: number; // USD subscribed after launch minus redemptions paid
}

export const initialFund = (): FundState => ({ units: { ...FUND_SEED }, netSubs: 0 });

const toUsd = (v: number, ccy: "USD" | "EUR") => (ccy === "EUR" ? v * PROGRAMME.fx : v);

/** Mark price per bond: last Seturion trade, else re-offer price. */
export function markOf(s: State, bondId: string) {
  const t = s.trades.find((x) => x.bondId === bondId);
  return t?.price ?? s.bonds[bondId].price ?? 100;
}

export function fundValuation(s: State) {
  const seedCash = Object.values(FUND_SEED).reduce((a, u) => a + u, 0) * FUND_LAUNCH_PRICE;
  let primaryCost = 0, secBuys = 0, secSells = 0, coupons = 0, redemptions = 0;
  const positions: { bondId: string; brand: string; ccy: "USD" | "EUR"; nominal: number; mark: number; ai: number; valueUsd: number }[] = [];
  for (const i of ISSUERS) {
    const b = s.bonds[i.id];
    const alloc = b.allocations?.find((a) => a.investorId === FUND_ID)?.amount ?? 0;
    if (b.status === "settled" || b.status === "redeemed") primaryCost += toUsd((alloc * (b.price ?? 100)) / 100, b.ccy);
    const nominal = s.hold[i.id]?.[FUND_ID]?.bal ?? 0;
    if (b.couponPct) {
      const t = termsFor(b.ccy, b.couponPct);
      coupons += toUsd(b.couponsPaid.length * couponAmount(t, nominal || (b.status === "redeemed" ? alloc : 0)), b.ccy);
      if (b.status === "redeemed") redemptions += toUsd(alloc, b.ccy);
    }
    if (nominal > 0) {
      const mark = markOf(s, i.id);
      const ai = b.couponPct ? accrued(termsFor(b.ccy, b.couponPct), s.tradeDate).accrued : 0;
      positions.push({ bondId: i.id, brand: i.brand, ccy: b.ccy, nominal, mark, ai, valueUsd: toUsd((nominal * (mark + ai)) / 100, b.ccy) });
    }
  }
  for (const t of s.trades) {
    const ccy = s.bonds[t.bondId].ccy;
    if (t.buyer === FUND_ID) secBuys += toUsd(t.cash, ccy);
    if (t.seller === FUND_ID) secSells += toUsd(t.cash, ccy);
  }
  const cash = seedCash + s.fund.netSubs - primaryCost - secBuys + secSells + coupons + redemptions;
  const invested = positions.reduce((a, p) => a + p.valueUsd, 0);
  const nav = invested + cash;
  const units = Object.values(s.fund.units).reduce((a, u) => a + u, 0);
  return { positions, cash, invested, nav, units, navPerUnit: units ? nav / units : FUND_LAUNCH_PRICE, seedCash, primaryCost, secBuys, secSells, coupons };
}
