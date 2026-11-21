// Fixed-income maths used by the simulators. Conventions:
//  USD tranches: semi-annual coupon, 30/360 (US bond basis)
//  EUR tranches: annual coupon, ACT/ACT (ICMA)

export type DayCount = "30/360" | "ACT/ACT (ICMA)";

export interface CouponTerms {
  couponPct: number; // e.g. 4.625
  freq: 1 | 2;
  years: number;
  dayCount: DayCount;
  issueDate: string; // ISO yyyy-mm-dd
  maturityDate: string;
}

const D = (iso: string) => new Date(iso + "T00:00:00Z");
const iso = (d: Date) => d.toISOString().slice(0, 10);

export function addMonths(isoDate: string, m: number) {
  const d = D(isoDate);
  d.setUTCMonth(d.getUTCMonth() + m);
  return iso(d);
}
export function addDays(isoDate: string, n: number) {
  const d = D(isoDate);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}

/** Price per 100 nominal for a bullet bond with whole coupon periods remaining. */
export function priceFromYield(couponPct: number, yieldPct: number, freq: number, years: number) {
  const n = Math.round(years * freq);
  const c = couponPct / freq;
  const y = yieldPct / 100 / freq;
  let p = 0;
  for (let k = 1; k <= n; k++) p += c / Math.pow(1 + y, k);
  p += 100 / Math.pow(1 + y, n);
  return p;
}

/** Yield from price via bisection. */
export function yieldFromPrice(couponPct: number, price: number, freq: number, years: number) {
  let lo = -2,
    hi = 25;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (priceFromYield(couponPct, mid, freq, years) > price) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Coupon set at the re-offer yield rounded DOWN to the nearest 1/8 % (market convention). */
export const couponFromYield = (y: number) => Math.floor(y * 8 + 1e-9) / 8;

export function couponSchedule(t: CouponTerms) {
  const step = 12 / t.freq;
  const out: string[] = [];
  for (let k = 1; k <= Math.round(t.years * t.freq); k++) out.push(addMonths(t.issueDate, k * step));
  return out;
}

function days30360(a: string, b: string) {
  const d1 = D(a), d2 = D(b);
  let dd1 = d1.getUTCDate(), dd2 = d2.getUTCDate();
  if (dd1 === 31) dd1 = 30;
  if (dd2 === 31 && dd1 === 30) dd2 = 30;
  return (
    360 * (d2.getUTCFullYear() - d1.getUTCFullYear()) +
    30 * (d2.getUTCMonth() - d1.getUTCMonth()) +
    (dd2 - dd1)
  );
}
const actDays = (a: string, b: string) => Math.round((D(b).getTime() - D(a).getTime()) / 86400000);

/** Accrued interest per 100 nominal on `settle`. */
export function accrued(t: CouponTerms, settle: string) {
  if (settle <= t.issueDate || settle >= t.maturityDate) return { accrued: 0, days: 0, basis: 0, last: t.issueDate, next: t.maturityDate };
  const sched = [t.issueDate, ...couponSchedule(t)];
  let last = t.issueDate,
    next = sched[1];
  for (let i = 0; i < sched.length - 1; i++) {
    if (settle >= sched[i] && settle < sched[i + 1]) {
      last = sched[i];
      next = sched[i + 1];
    }
  }
  if (t.dayCount === "30/360") {
    const days = days30360(last, settle);
    return { accrued: (t.couponPct * days) / 360, days, basis: 360, last, next };
  }
  const days = actDays(last, settle);
  const period = actDays(last, next);
  return { accrued: (t.couponPct / t.freq) * (days / period), days, basis: period * t.freq, last, next };
}

/** Coupon cash amount for a holding of `nominal` on one coupon date. */
export const couponAmount = (t: CouponTerms, nominal: number) => (nominal * t.couponPct) / 100 / t.freq;

/** Modified duration (years) — used for DV01 displays. */
export function modDuration(couponPct: number, yieldPct: number, freq: number, years: number) {
  const n = Math.round(years * freq);
  const y = yieldPct / 100 / freq;
  const c = couponPct / freq;
  let pv = 0, w = 0;
  for (let k = 1; k <= n; k++) {
    const cf = c + (k === n ? 100 : 0);
    const df = cf / Math.pow(1 + y, k);
    pv += df;
    w += (k / freq) * df;
  }
  return w / pv / (1 + y);
}
