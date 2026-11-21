"use client";
// Global simulation state shared by every page: bonds, the on-chain register,
// the Seturion order book, Eurosystem pledges and the RL1 event log.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ISSUERS, PROGRAMME, INVESTORS, investorById, issuerById, isinOf, termsFor, walletOf, type IssuerDef } from "./data/scenario";
import { allocate, generateBook } from "./data/primary";
import { accrued, couponAmount, couponFromYield, priceFromYield, couponSchedule } from "./finance";
import { addressOf, hash32, money } from "./util";
import { checkEligibility, isEligible, pledgeCheck } from "./eligibility";

export type BondStatus = "draft" | "priced" | "settled" | "redeemed";
export interface BondState {
  id: string;
  ccy: "USD" | "EUR";
  status: BondStatus;
  spreadBp?: number;
  yieldPct?: number;
  couponPct?: number;
  price?: number;
  demand?: number;
  allocations?: { investorId: string; amount: number }[];
  registrarName: string;
  contract: string;
  paused: boolean;
  couponsPaid: string[];
}
export interface Holding { bal: number; frozen: number; pledged: number }
export interface Ev {
  n: number;
  block: number;
  ts: string;
  bondId?: string;
  type: string;
  actor: string;
  detail: string;
  tx: string;
  ok: boolean;
}
export interface BookOrder { id: string; bondId: string; side: "BUY" | "SELL"; price: number; qty: number; remaining: number; participant: string; ts: string }
export interface Trade { id: string; bondId: string; price: number; qty: number; buyer: string; seller: string; accrued: number; cash: number; deferred: boolean; ts: string; tx: string; block: number; aggressor: "BUY" | "SELL" }
export interface Pledge { id: string; bondId: string; pledgor: string; nominal: number; haircut: number; price: number; value: number; ts: string }

export interface State {
  v: number;
  bonds: Record<string, BondState>;
  hold: Record<string, Record<string, Holding>>;
  events: Ev[];
  orders: BookOrder[];
  trades: Trade[];
  pledges: Pledge[];
  block: number;
  seq: number;
  tradeDate: string;
}

const VERSION = 5;
const KEY = "rl1-orbit-state-v" + VERSION;

export const ESCROW = "dvp-escrow";
export const ISSUER_ACC = (id: string) => "issuer:" + id;

function initial(): State {
  const bonds: Record<string, BondState> = {};
  for (const i of ISSUERS) {
    bonds[i.id] = {
      id: i.id,
      ccy: i.defaultCcy,
      status: "draft",
      registrarName: i.registrarName,
      contract: addressOf("bond/" + i.id),
      paused: false,
      couponsPaid: [],
    };
  }
  return { v: VERSION, bonds, hold: {}, events: [], orders: [], trades: [], pledges: [], block: 4_812_330, seq: 0, tradeDate: "2026-12-11" };
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------
export const holderName = (id: string) => {
  if (id === ESCROW) return "DvPEscrow (primary)";
  if (id.startsWith("issuer:")) return issuerById(id.slice(7)).brand + " (issuer)";
  return investorById(id)?.name ?? id;
};

export interface TransferCheck { ok: boolean; reasons: string[]; passed: string[] }

export function complianceCheck(s: State, bondId: string, from: string, to: string, amount: number, opts: { forced?: boolean; asOf?: string } = {}): TransferCheck {
  const b = s.bonds[bondId];
  const ccy = b.ccy;
  const reasons: string[] = [];
  const passed: string[] = [];
  const asOf = opts.asOf ?? s.tradeDate;
  const h = s.hold[bondId]?.[from] ?? { bal: 0, frozen: 0, pledged: 0 };
  const free = h.bal - h.frozen - h.pledged;
  const min = PROGRAMME.denomination[ccy];
  if (b.paused && !opts.forced) reasons.push("Contract paused by registrar (PAUSER_ROLE).");
  else passed.push("Contract not paused");
  if (amount <= 0) reasons.push("Amount must be positive.");
  if (amount > free) reasons.push(`Insufficient free balance: ${money(free, ccy)} free (balance ${money(h.bal, ccy)}, frozen ${money(h.frozen, ccy)}, pledged ${money(h.pledged, ccy)}).`);
  else passed.push("Sender has sufficient unencumbered balance");
  if (amount % PROGRAMME.increment[ccy] !== 0 || amount < min) reasons.push(`Transfers must be ≥ ${money(min, ccy)} and in multiples of ${money(PROGRAMME.increment[ccy], ccy)}.`);
  else passed.push(`Denomination rule (min ${money(min, ccy)})`);
  const remaining = h.bal - amount;
  if (remaining > 0 && remaining < min) reasons.push(`Residual holding ${money(remaining, ccy)} would fall below the minimum denomination.`);
  if (!opts.forced) {
    const inv = investorById(to);
    if (to !== ESCROW && !to.startsWith("issuer:")) {
      if (!inv) reasons.push("Receiver wallet is not registered in the IdentityRegistry.");
      else {
        if (inv.kycValidUntil < asOf) reasons.push(`Receiver KYC claim expired on ${inv.kycValidUntil}.`);
        else passed.push(`Receiver KYC claim valid until ${inv.kycValidUntil}`);
        if (inv.usPerson && ccy === "USD") reasons.push("Receiver flagged US_PERSON: Regulation S restriction (ComplianceModule rule REG_S_CAT2).");
        else passed.push("Regulation S: receiver is not a US person");
        passed.push(`Investor category: ${inv.mifid}`);
      }
    }
    const sender = investorById(from);
    if (sender && sender.kycValidUntil < asOf) reasons.push(`Sender KYC claim expired on ${sender.kycValidUntil}. Outbound transfers blocked.`);
  }
  return { ok: reasons.length === 0, reasons, passed };
}

function applyMove(s: State, bondId: string, from: string, to: string, amt: number) {
  const book = (s.hold[bondId] ??= {});
  const f = (book[from] ??= { bal: 0, frozen: 0, pledged: 0 });
  const t = (book[to] ??= { bal: 0, frozen: 0, pledged: 0 });
  f.bal -= amt;
  t.bal += amt;
  if (f.bal === 0 && f.frozen === 0 && f.pledged === 0) delete book[from];
}

function pushEv(s: State, e: Omit<Ev, "n" | "block" | "tx">, newBlock = true) {
  if (newBlock) s.block += 1;
  s.seq += 1;
  s.events.unshift({ ...e, n: s.seq, block: s.block, tx: hash32(e.type + s.seq + (e.bondId ?? "")) });
  if (s.events.length > 1500) s.events.length = 1500;
}

export function priceBondPure(s: State, issuer: IssuerDef, spreadBp: number) {
  const b = s.bonds[issuer.id];
  const bench = PROGRAMME.benchmarks[b.ccy].yield;
  const y = bench + spreadBp / 100;
  const c = couponFromYield(y);
  const freq = b.ccy === "USD" ? 2 : 1;
  const price = priceFromYield(c, y, freq, PROGRAMME.tenorYears);
  return { y, c, price };
}

export function eligibleForPrimary(investorId: string, ccy: "USD" | "EUR") {
  const inv = investorById(investorId)!;
  if (inv.kycValidUntil < PROGRAMME.issueDate) return { ok: false, reason: `KYC expired ${inv.kycValidUntil}` };
  if (inv.usPerson && ccy === "USD") return { ok: false, reason: "US person: Reg S" };
  return { ok: true, reason: "" };
}

export const accruedFor = (b: BondState, date: string) => (b.couponPct ? accrued(termsFor(b.ccy, b.couponPct), date) : { accrued: 0, days: 0, basis: 0, last: PROGRAMME.issueDate, next: PROGRAMME.issueDate });

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface Api {
  s: State;
  ready: boolean;
  setCcy: (id: string, ccy: "USD" | "EUR") => void;
  price: (id: string, spreadBp: number) => void;
  settle: (id: string) => void;
  quickIssueAll: () => void;
  transfer: (bondId: string, from: string, to: string, amt: number) => TransferCheck;
  freeze: (bondId: string, holder: string, amt: number, reason: string) => void;
  unfreeze: (bondId: string, holder: string) => void;
  forced: (bondId: string, from: string, to: string, amt: number, ref: string) => TransferCheck;
  payCoupon: (bondId: string, date: string) => void;
  migrate: (bondId: string, newName: string) => void;
  setPaused: (bondId: string, p: boolean) => void;
  placeOrder: (o: { bondId: string; side: "BUY" | "SELL"; price: number; qty: number; participant: string }) => { ok: boolean; msg: string };
  cancelOrder: (id: string) => void;
  seedBook: (bondId: string) => void;
  setTradeDate: (d: string) => void;
  pledge: (bondId: string, pledgor: string, nominal: number, haircut: number) => { ok: boolean; msg: string };
  release: (pledgeId: string) => void;
  redeem: (bondId: string) => void;
  reset: () => void;
}

const Ctx = createContext<Api | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  const ref = useRef(s);
  ref.current = s;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        if (parsed.v === VERSION) setS(parsed);
      }
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {}
  }, [s, ready]);

  const mut = useCallback(<T,>(fn: (d: State) => T): T => {
    const d = structuredClone(ref.current);
    const out = fn(d);
    ref.current = d;
    setS(d);
    return out;
  }, []);

  const doPrice = (d: State, id: string, spreadBp: number) => {
    const issuer = issuerById(id);
    const b = d.bonds[id];
    const orders = generateBook(issuer, b.ccy);
    const { y, c, price } = priceBondPure(d, issuer, spreadBp);
    const { allocations, demand } = allocate(orders, spreadBp, PROGRAMME.size, b.ccy, (inv) => eligibleForPrimary(inv, b.ccy).ok);
    Object.assign(b, { status: "priced", spreadBp, yieldPct: y, couponPct: c, price, allocations, demand });
    const ts = PROGRAMME.pricingDate + "T15:30:00Z";
    pushEv(d, { ts, bondId: id, type: "ContractDeployed", actor: b.registrarName, detail: `BondToken ${isinOf(issuer)} deployed at ${b.contract}`, ok: true });
    pushEv(d, { ts, bondId: id, type: "RoleGranted", actor: b.registrarName, detail: `REGISTRAR_ROLE, ISSUER_ROLE, SETTLEMENT_ROLE→${issuer.registerModel === "AT_CSD_DLT" ? "OeKB CSD (CSD_OPERATOR_ROLE)" : "Seturion"}, PAYING_AGENT_ROLE→Cecabank`, ok: true }, false);
    pushEv(d, { ts, bondId: id, type: "TermsAnchored", actor: issuer.brand, detail: `Final Terms priced: coupon ${c.toFixed(3)}%, re-offer ${price.toFixed(3)}, yield ${y.toFixed(3)}%, termsHash ${hash32("terms" + id).slice(0, 18)}…`, ok: true });
  };

  const doSettle = (d: State, id: string) => {
    const issuer = issuerById(id);
    const b = d.bonds[id];
    if (b.status !== "priced" || !b.allocations) return;
    const ts0 = PROGRAMME.issueDate + "T09:00:00Z";
    const at = issuer.registerModel === "AT_CSD_DLT";
    if (at) pushEv(d, { ts: ts0, bondId: id, type: "GlobalNoteLodged", actor: "OeKB CSD", detail: `Sammelurkunde ${b.ccy} ${PROGRAMME.size.toLocaleString()} lodged in collective custody`, ok: true });
    const minted = b.allocations.reduce((a, x) => a + x.amount, 0);
    d.hold[id] = { [ESCROW]: { bal: minted, frozen: 0, pledged: 0 } };
    pushEv(d, { ts: ts0, bondId: id, type: "Issued", actor: b.registrarName, detail: `Minted ${money(minted, b.ccy)} to DvPEscrow; totalSupply = issue amount`, ok: true });
    let k = 0;
    for (const a of b.allocations) {
      k++;
      const cash = (a.amount * (b.price ?? 100)) / 100;
      const ts = `${PROGRAMME.issueDate}T10:${String(k).padStart(2, "0")}:00Z`;
      if (at) pushEv(d, { ts, bondId: id, type: "PontesLock", actor: "OeKB CSD", detail: `Lock ${money(a.amount, b.ccy)} for ${holderName(a.investorId)}; pacs.009 ${money(cash, "EUR", 2)} to T2`, ok: true });
      applyMove(d, id, ESCROW, a.investorId, a.amount);
      pushEv(d, { ts, bondId: id, type: "DvPSettled", actor: at ? "OeKB CSD / Pontes" : "Seturion TSS", detail: `${money(a.amount, b.ccy)} → ${holderName(a.investorId)} vs ${money(cash, b.ccy, 2)} (${b.ccy === "USD" ? "USD settlement token" : "T2 central-bank money"})`, ok: true }, !at);
    }
    b.status = "settled";
    pushEv(d, { ts: PROGRAMME.issueDate + "T11:00:00Z", bondId: id, type: "IssuanceClosed", actor: b.registrarName, detail: `${b.allocations.length} holders registered; proceeds ${money((minted * (b.price ?? 100)) / 100, b.ccy, 2)} to issuer`, ok: true });
  };

  const api = useMemo<Api>(() => ({
    s,
    ready,
    setCcy: (id, ccy) => mut((d) => { if (d.bonds[id].status === "draft") d.bonds[id].ccy = ccy; }),
    price: (id, spread) => mut((d) => doPrice(d, id, spread)),
    settle: (id) => mut((d) => doSettle(d, id)),
    quickIssueAll: () =>
      mut((d) => {
        for (const i of ISSUERS) {
          if (d.bonds[i.id].status === "draft") doPrice(d, i.id, i.fairSpread + 5);
          if (d.bonds[i.id].status === "priced") doSettle(d, i.id);
        }
      }),
    transfer: (bondId, from, to, amt) =>
      mut((d) => {
        const chk = complianceCheck(d, bondId, from, to, amt);
        if (chk.ok) {
          applyMove(d, bondId, from, to, amt);
          pushEv(d, { ts: d.tradeDate + "T12:00:00Z", bondId, type: "Transfer", actor: holderName(from), detail: `${money(amt, d.bonds[bondId].ccy)} ${holderName(from)} → ${holderName(to)} (bilateral, FoP)`, ok: true });
        } else pushEv(d, { ts: d.tradeDate + "T12:00:00Z", bondId, type: "TransferRejected", actor: holderName(from), detail: chk.reasons.join(" "), ok: false });
        return chk;
      }),
    freeze: (bondId, holder, amt, reason) =>
      mut((d) => {
        const h = d.hold[bondId]?.[holder];
        if (!h) return;
        h.frozen = Math.min(h.bal - h.pledged, h.frozen + amt);
        pushEv(d, { ts: d.tradeDate + "T12:00:00Z", bondId, type: "TokensFrozen", actor: d.bonds[bondId].registrarName, detail: `${money(amt, d.bonds[bondId].ccy)} of ${holderName(holder)} frozen. Reason: ${reason}`, ok: true });
      }),
    unfreeze: (bondId, holder) =>
      mut((d) => {
        const h = d.hold[bondId]?.[holder];
        if (!h) return;
        h.frozen = 0;
        pushEv(d, { ts: d.tradeDate + "T12:00:00Z", bondId, type: "TokensUnfrozen", actor: d.bonds[bondId].registrarName, detail: `${holderName(holder)} unfrozen`, ok: true });
      }),
    forced: (bondId, from, to, amt, refNo) =>
      mut((d) => {
        const h = d.hold[bondId]?.[from];
        if (h) h.frozen = Math.max(0, h.frozen - amt);
        const chk = complianceCheck(d, bondId, from, to, amt, { forced: true });
        if (chk.ok) {
          applyMove(d, bondId, from, to, amt);
          pushEv(d, { ts: d.tradeDate + "T12:00:00Z", bondId, type: "ForcedTransfer", actor: d.bonds[bondId].registrarName, detail: `${money(amt, d.bonds[bondId].ccy)} ${holderName(from)} → ${holderName(to)} under ${refNo}`, ok: true });
        } else pushEv(d, { ts: d.tradeDate + "T12:00:00Z", bondId, type: "ForcedTransferRejected", actor: d.bonds[bondId].registrarName, detail: chk.reasons.join(" "), ok: false });
        return chk;
      }),
    payCoupon: (bondId, date) =>
      mut((d) => {
        const b = d.bonds[bondId];
        if (!b.couponPct || b.couponsPaid.includes(date)) return;
        const t = termsFor(b.ccy, b.couponPct);
        const holders = Object.entries(d.hold[bondId] ?? {}).filter(([, h]) => h.bal > 0);
        const rec = date; // record date = payment date - 1 business day (simplified)
        pushEv(d, { ts: rec + "T17:00:00Z", bondId, type: "RecordDateSnapshot", actor: "Cecabank (paying agent)", detail: `Snapshot #${b.couponsPaid.length + 1}: ${holders.length} holders, ${money(holders.reduce((a, [, h]) => a + h.bal, 0), b.ccy)} outstanding`, ok: true });
        let total = 0;
        for (const [id, h] of holders) {
          const amt = couponAmount(t, h.bal);
          total += amt;
          pushEv(d, { ts: date + "T10:00:00Z", bondId, type: "CouponPaid", actor: b.ccy === "EUR" ? "Pontes / T2" : "Cecabank (USD settlement token)", detail: `${holderName(id)}: ${money(amt, b.ccy, 2)} on ${money(h.bal, b.ccy)}${h.pledged ? " (pledged part paid to the pledgor under the ECMS rules)" : ""}`, ok: true }, false);
        }
        d.block += 1;
        b.couponsPaid.push(date);
        pushEv(d, { ts: date + "T10:30:00Z", bondId, type: "CouponRunComplete", actor: "Cecabank (paying agent)", detail: `Coupon ${b.couponPct.toFixed(3)}% ${t.freq === 2 ? "semi-annual" : "annual"} paid: total ${money(total, b.ccy, 2)}`, ok: true });
      }),
    migrate: (bondId, newName) =>
      mut((d) => {
        const b = d.bonds[bondId];
        const old = b.registrarName;
        pushEv(d, { ts: d.tradeDate + "T08:00:00Z", bondId, type: "Paused", actor: old, detail: "Transfers paused for registrar migration (cut-off)", ok: true });
        pushEv(d, { ts: d.tradeDate + "T08:05:00Z", bondId, type: "RegisterSnapshot", actor: old, detail: `Golden copy exported: ${Object.keys(d.hold[bondId] ?? {}).length} positions, hash ${hash32("snap" + bondId + d.seq).slice(0, 18)}…`, ok: true });
        pushEv(d, { ts: d.tradeDate + "T08:10:00Z", bondId, type: "RoleGranted", actor: "Issuer", detail: `REGISTRAR_ROLE → ${newName}`, ok: true });
        pushEv(d, { ts: d.tradeDate + "T08:11:00Z", bondId, type: "RoleRevoked", actor: "Issuer", detail: `REGISTRAR_ROLE ← ${old}`, ok: true }, false);
        pushEv(d, { ts: d.tradeDate + "T08:20:00Z", bondId, type: "Reconciled", actor: newName, detail: "New registrar reconciles on-chain balances against the golden copy: match", ok: true });
        pushEv(d, { ts: d.tradeDate + "T08:30:00Z", bondId, type: "Unpaused", actor: newName, detail: "Transfers resumed under the new registrar. The ISIN, contract address and holders are unchanged", ok: true });
        b.registrarName = newName;
        b.paused = false;
      }),
    setPaused: (bondId, p) =>
      mut((d) => {
        d.bonds[bondId].paused = p;
        pushEv(d, { ts: d.tradeDate + "T12:00:00Z", bondId, type: p ? "Paused" : "Unpaused", actor: d.bonds[bondId].registrarName, detail: p ? "Contract paused (emergency / corporate action)" : "Contract unpaused", ok: true });
      }),
    placeOrder: (o) =>
      mut((d) => {
        const b = d.bonds[o.bondId];
        if (b.status !== "settled") return { ok: false, msg: "Bond not yet issued" };
        if (o.qty < PROGRAMME.denomination[b.ccy] || o.qty % PROGRAMME.increment[b.ccy] !== 0) return { ok: false, msg: `Quantity must be ≥ ${money(PROGRAMME.denomination[b.ccy], b.ccy)} in multiples of ${PROGRAMME.increment[b.ccy]}` };
        const inv = investorById(o.participant);
        if (!inv) return { ok: false, msg: "Unknown participant" };
        if (inv.kycValidUntil < d.tradeDate) return { ok: false, msg: `Pre-trade check failed: KYC expired ${inv.kycValidUntil}` };
        if (o.side === "BUY" && inv.usPerson && b.ccy === "USD") return { ok: false, msg: "Pre-trade check failed: US person (Reg S)" };
        if (o.side === "SELL") {
          const h = d.hold[o.bondId]?.[o.participant];
          const open = d.orders.filter((x) => x.bondId === o.bondId && x.participant === o.participant && x.side === "SELL").reduce((a, x) => a + x.remaining, 0);
          const free = (h?.bal ?? 0) - (h?.frozen ?? 0) - (h?.pledged ?? 0) - open;
          if (o.qty > free) return { ok: false, msg: `Pre-trade check failed: free position ${money(Math.max(0, free), b.ccy)} (no naked short selling; positions are verified on-chain)` };
        }
        const id = "O" + (d.seq + 1);
        const ord: BookOrder = { id, bondId: o.bondId, side: o.side, price: o.price, qty: o.qty, remaining: o.qty, participant: o.participant, ts: d.tradeDate };
        pushEv(d, { ts: d.tradeDate + "T13:00:00Z", bondId: o.bondId, type: "OrderAccepted", actor: "Seturion TSS", detail: `${o.side} ${money(o.qty, b.ccy)} @ ${o.price.toFixed(3)} by ${inv.name} (${id})`, ok: true }, false);
        // match
        const contra = d.orders
          .filter((x) => x.bondId === o.bondId && x.side !== o.side && x.participant !== o.participant && (o.side === "BUY" ? x.price <= o.price : x.price >= o.price))
          .sort((a, c) => (o.side === "BUY" ? a.price - c.price : c.price - a.price) || Number(a.id.slice(1)) - Number(c.id.slice(1)));
        let filled = 0;
        const ai = accruedFor(b, d.tradeDate).accrued;
        for (const c of contra) {
          if (ord.remaining <= 0) break;
          const q = Math.min(c.remaining, ord.remaining);
          const buyer = o.side === "BUY" ? o.participant : c.participant;
          const seller = o.side === "SELL" ? o.participant : c.participant;
          const chk = complianceCheck(d, o.bondId, seller, buyer, q);
          if (!chk.ok) {
            pushEv(d, { ts: d.tradeDate + "T13:00:01Z", bondId: o.bondId, type: "MatchRejected", actor: "ComplianceModule", detail: chk.reasons.join(" "), ok: false }, false);
            continue;
          }
          applyMove(d, o.bondId, seller, buyer, q);
          c.remaining -= q;
          ord.remaining -= q;
          filled += q;
          const cash = (q * (c.price + ai)) / 100;
          const lis = q >= (b.ccy === "USD" ? 5_000_000 : 5_000_000);
          pushEv(d, { ts: d.tradeDate + "T13:00:02Z", bondId: o.bondId, type: "DvPSettled", actor: "Seturion TSS", detail: `${money(q, b.ccy)} ${holderName(seller)} → ${holderName(buyer)} @ ${c.price.toFixed(3)} + AI ${ai.toFixed(4)} = ${money(cash, b.ccy, 2)}`, ok: true });
          d.trades.unshift({ id: "T" + d.seq, bondId: o.bondId, price: c.price, qty: q, buyer, seller, accrued: ai, cash, deferred: lis, ts: d.tradeDate, tx: d.events[0].tx, block: d.block, aggressor: o.side });
        }
        d.orders = d.orders.filter((x) => x.remaining > 0);
        if (ord.remaining > 0) d.orders.push(ord);
        return { ok: true, msg: filled ? `Filled ${money(filled, b.ccy)}${ord.remaining ? `, ${money(ord.remaining, b.ccy)} resting` : ""}. Settled atomically on RL1 block ${d.block}.` : `Order resting in book (${id}).` };
      }),
    cancelOrder: (id) => mut((d) => { d.orders = d.orders.filter((o) => o.id !== id); }),
    seedBook: (bondId) =>
      mut((d) => {
        const b = d.bonds[bondId];
        if (b.status !== "settled" || d.orders.some((o) => o.bondId === bondId)) return;
        const mid = Math.round((b.price ?? 100) * 1000) / 1000 + 0.05;
        const holders = Object.entries(d.hold[bondId] ?? {}).filter(([id, h]) => investorById(id) && h.bal - h.frozen - h.pledged >= 2_000_000);
        const bidders = INVESTORS.filter((i) => !i.usPerson && i.kycValidUntil >= d.tradeDate).slice(0, 8);
        let n = 0;
        holders.slice(0, 4).forEach(([id, h], k) => {
          const q = Math.min(Math.floor((h.bal - h.frozen - h.pledged) / 2 / 1000) * 1000, [1_000_000, 2_500_000, 3_000_000, 5_000_000][k]);
          n++;
          d.orders.push({ id: "O" + ++d.seq, bondId, side: "SELL", price: +(mid + 0.04 + k * 0.03).toFixed(3), qty: q, remaining: q, participant: id, ts: d.tradeDate });
        });
        bidders.slice(0, 4).forEach((inv, k) => {
          const q = [2_000_000, 1_000_000, 4_000_000, 6_000_000][k];
          n++;
          d.orders.push({ id: "O" + ++d.seq, bondId, side: "BUY", price: +(mid - 0.04 - k * 0.03).toFixed(3), qty: q, remaining: q, participant: inv.id, ts: d.tradeDate });
        });
        pushEv(d, { ts: d.tradeDate + "T08:00:00Z", bondId, type: "BookOpened", actor: "Seturion TSS", detail: `Continuous trading opened; ${n} resting orders from liquidity providers and investors`, ok: true }, false);
      }),
    setTradeDate: (dt) => mut((d) => { d.tradeDate = dt; }),
    pledge: (bondId, pledgor, nominal, haircut) =>
      mut((d) => {
        const b = d.bonds[bondId];
        const issuer = issuerById(bondId);
        const crit = checkEligibility({ issuer, ccy: b.ccy });
        if (!isEligible(crit)) return { ok: false, msg: "Asset not Eurosystem-eligible: " + crit.filter((c) => !c.pass).map((c) => c.label).join("; ") };
        const pc = pledgeCheck(pledgor, issuer);
        if (!pc.ok) return { ok: false, msg: pc.reason };
        const h = d.hold[bondId]?.[pledgor];
        const free = (h?.bal ?? 0) - (h?.frozen ?? 0) - (h?.pledged ?? 0);
        if (!h || nominal > free) return { ok: false, msg: `Insufficient free position (${money(Math.max(free, 0), b.ccy)})` };
        const px = b.price ?? 100;
        const ai = accruedFor(b, d.tradeDate).accrued;
        const value = (nominal * (px + ai)) / 100 * (1 - haircut / 100);
        h.pledged += nominal;
        const id = "P" + (d.seq + 1);
        d.pledges.push({ id, bondId, pledgor, nominal, haircut, price: px, value, ts: d.tradeDate });
        pushEv(d, { ts: d.tradeDate + "T09:00:00Z", bondId, type: "ECMSInstruction", actor: holderName(pledgor), detail: `Mobilise ${money(nominal, b.ccy)} to OeNB (pool) via ECMS`, ok: true });
        pushEv(d, { ts: d.tradeDate + "T09:01:00Z", bondId, type: "T2SRealignment", actor: "OeKB CSD", detail: `Position earmarked to OeNB collateral account (T2S). On RL1: encumbrance set on ${holderName(pledgor)} wallet`, ok: true });
        pushEv(d, { ts: d.tradeDate + "T09:02:00Z", bondId, type: "CollateralValued", actor: "OeNB / ECMS", detail: `${money(nominal, b.ccy)} × (${px.toFixed(3)} + AI ${ai.toFixed(4)}) × (1 − ${haircut}%) = ${money(value, b.ccy, 2)} credit capacity`, ok: true });
        return { ok: true, msg: `Pledged. Collateral value ${money(value, b.ccy, 2)} added to ${holderName(pledgor)}'s pool at OeNB.` };
      }),
    release: (pid) =>
      mut((d) => {
        const p = d.pledges.find((x) => x.id === pid);
        if (!p) return;
        const h = d.hold[p.bondId]?.[p.pledgor];
        if (h) h.pledged = Math.max(0, h.pledged - p.nominal);
        d.pledges = d.pledges.filter((x) => x.id !== pid);
        pushEv(d, { ts: d.tradeDate + "T16:00:00Z", bondId: p.bondId, type: "CollateralReleased", actor: "OeNB / ECMS", detail: `${money(p.nominal, d.bonds[p.bondId].ccy)} released to ${holderName(p.pledgor)}`, ok: true });
      }),
    redeem: (bondId) =>
      mut((d) => {
        const b = d.bonds[bondId];
        if (b.status !== "settled") return;
        const t = termsFor(b.ccy, b.couponPct!);
        const last = couponSchedule(t).at(-1)!;
        if (!b.couponsPaid.includes(last)) {
          // final coupon paid together with principal
          b.couponsPaid.push(last);
        }
        d.pledges = d.pledges.filter((p) => p.bondId !== bondId);
        for (const [id, h] of Object.entries(d.hold[bondId] ?? {})) {
          if (h.bal <= 0) continue;
          pushEv(d, { ts: PROGRAMME.maturityDate + "T10:00:00Z", bondId, type: "Redeemed", actor: b.ccy === "EUR" ? "OeKB CSD / Pontes" : "Cecabank (paying agent)", detail: `${holderName(id)}: principal ${money(h.bal, b.ccy)} + final coupon ${money(couponAmount(t, h.bal), b.ccy, 2)}; tokens burned`, ok: true }, false);
        }
        d.block += 1;
        d.hold[bondId] = {};
        b.status = "redeemed";
        d.orders = d.orders.filter((o) => o.bondId !== bondId);
        pushEv(d, { ts: PROGRAMME.maturityDate + "T11:00:00Z", bondId, type: "Matured", actor: b.registrarName, detail: "totalSupply = 0. Contract archived, register closed, delisted from Seturion", ok: true });
      }),
    reset: () => mut((d) => { Object.assign(d, initial()); }),
  }), [s, ready, mut]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
}

export const walletLabel = (id: string) => (id === ESCROW ? addressOf("escrow") : id.startsWith("issuer:") ? addressOf(id) : walletOf(id));
