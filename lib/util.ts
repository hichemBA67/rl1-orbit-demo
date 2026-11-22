// Small deterministic helpers: hashing, formatting, identifiers.

/** FNV-1a 32-bit hash, deterministic across runs (used to derive demo addresses / tx hashes). */
export function fnv(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic hex string of `len` chars derived from a seed. */
export function hexFrom(seed: string, len: number): string {
  let out = "";
  let i = 0;
  while (out.length < len) {
    out += fnv(seed + ":" + i).toString(16).padStart(8, "0");
    i++;
  }
  return out.slice(0, len);
}

/** EVM-style address (20 bytes). */
export const addressOf = (seed: string) => "0x" + hexFrom("addr/" + seed, 40);
/** 32-byte transaction / document hash. */
export const hash32 = (seed: string) => "0x" + hexFrom("tx/" + seed, 64);
export const short = (h: string, n = 6) => (h.length > 2 * n + 2 ? `${h.slice(0, n + 2)}…${h.slice(-n)}` : h);

/** Seeded PRNG (mulberry32). */
export function rng(seed: string) {
  let a = fnv(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * ISO 6166 ISIN check digit: letters → numbers (A=10 … Z=35), then Luhn
 * (double every second digit starting from the right-most).
 */
export function isinCheckDigit(body11: string): string {
  const digits = body11
    .toUpperCase()
    .split("")
    .map((c) => (/[0-9]/.test(c) ? c : String(c.charCodeAt(0) - 55)))
    .join("");
  let sum = 0;
  let dbl = true;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return String((10 - (sum % 10)) % 10);
}
export const makeIsin = (country: string, nsin9: string) => {
  const body = (country + nsin9).toUpperCase();
  return body + isinCheckDigit(body);
};

export const ccySymbol = (c: string) => (c === "USD" ? "$" : c === "EUR" ? "€" : c + " ");
export function money(v: number, ccy = "USD", digits = 0) {
  return (
    (v < 0 ? "−" : "") +
    ccySymbol(ccy) +
    Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
  );
}
export function compact(v: number, ccy = "USD") {
  const s = ccySymbol(ccy);
  if (Math.abs(v) >= 1e9) return `${s}${(v / 1e9).toFixed(2)}bn`;
  if (Math.abs(v) >= 1e6) return `${s}${(v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1)}m`;
  if (Math.abs(v) >= 1e3) return `${s}${(v / 1e3).toFixed(0)}k`;
  return `${s}${v.toFixed(0)}`;
}
export const pct = (v: number, d = 3) => `${v.toFixed(d)}%`;
export const bp = (v: number) => `${v >= 0 ? "+" : ""}${Math.round(v)}bp`;

export function fmtDate(iso: string) {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
