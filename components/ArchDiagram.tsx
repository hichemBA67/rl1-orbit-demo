// System map of RL1 ORBIT: issuers → coordinator → registrars → OeKB CSD (all) → RL1 ledger → venue, fund & Eurosystem.
const C = { box: "rgba(255,255,255,0.04)", line: "rgba(255,255,255,0.18)", fg: "#e8edf7", mut: "rgba(232,237,247,0.6)", acc: "#3b6fff", ok: "#3ccf91", vio: "#a78bfa", warn: "#f5b649" };

function Box({ x, y, w, h, title, sub, stroke = C.line, fill = C.box, tc = C.fg }: { x: number; y: number; w: number; h: number; title: string; sub?: string; stroke?: string; fill?: string; tc?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={fill} stroke={stroke} />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 3 : h / 2 + 4)} textAnchor="middle" fill={tc} fontSize={12.5} fontWeight={600}>{title}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" fill={C.mut} fontSize={10.5}>{sub}</text>}
    </g>
  );
}
const L = ({ d, c = C.line, dash }: { d: string; c?: string; dash?: boolean }) => <path d={d} fill="none" stroke={c} strokeWidth={1.4} strokeDasharray={dash ? "4 4" : undefined} markerEnd="url(#arr)" />;
const Lbl = ({ y, t }: { y: number; t: string }) => <text x={20} y={y} fill={C.mut} fontSize={10} letterSpacing="1.5">{t}</text>;

export function ArchDiagram() {
  // Issuers: 8 RL1 banks (registrar Chartered Investment) + 4 others.
  const rl1 = [
    { x: 20, w: 110, t: "🇳🇱 ABN AMRO" },
    { x: 136, w: 150, t: "🇫🇷 Natixis · Crédit Mutuel" },
    { x: 292, w: 170, t: "🇩🇪 Deka · DZ BANK · LBBW" },
    { x: 468, w: 170, t: "🇬🇧 NatWest · StanChart" },
  ];
  const others = [
    { x: 660, w: 105, t: "🇪🇸 CaixaBank", reg: 0 },
    { x: 771, w: 90, t: "🇫🇷 CACEIS", reg: 1 },
    { x: 867, w: 133, t: "🇦🇹 Erste · RBI", reg: 3 },
  ];
  return (
    <div className="scroll-x">
      <svg viewBox="0 0 1020 640" className="w-full min-w-[820px]" role="img" aria-label="RL1 ORBIT architecture">
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.line} />
          </marker>
        </defs>

        <Lbl y={14} t="RL1 MEMBER ISSUERS · PLAIN VANILLA USD 100M" />
        <text x={660} y={14} fill={C.mut} fontSize={10} letterSpacing="1.5">OTHER ISSUERS</text>
        {rl1.map((i) => <Box key={i.t} x={i.x} y={22} w={i.w} h={40} title={i.t} stroke={C.acc} />)}
        {others.map((i) => <Box key={i.t} x={i.x} y={22} w={i.w} h={40} title={i.t} />)}

        <Lbl y={92} t="COORDINATION" />
        <Box x={20} y={100} w={980} h={36} title="Cecabank: programme coordinator · joint book · fiscal / paying / calculation agent" stroke={C.warn} />
        {[...rl1, ...others].map((i) => <L key={i.t} d={`M${i.x + i.w / 2},62 L${i.x + i.w / 2},98`} />)}

        <Lbl y={166} t="REGISTRARS: ISSUER-LEVEL REGISTER UNDER EACH HOME LAW" />
        <Box x={20} y={174} w={618} h={48} title="Chartered Investment: registrar for the 8 RL1 tranches" sub="eWpG register (DE) · DEEP (FR) · contractual (NL, GB) · OeKB entered as holder" stroke={C.acc} />
        <Box x={660} y={174} w={105} h={48} title="Cecabank" sub="ERIR (ES)" />
        <Box x={771} y={174} w={90} h={48} title="CACEIS CT" sub="DEEP (FR)" />
        <Box x={867} y={174} w={133} h={48} title="OeKB CSD" sub="registrar (AT)" stroke={C.ok} />
        {[329, 712, 816, 933].map((x) => <L key={x} d={`M${x},136 L${x},172`} />)}

        <Lbl y={252} t="ISSUER CSD FOR EVERY TRANCHE: THE 'RUBBER STAMP'" />
        <rect x={20} y={260} width={980} height={50} rx={12} fill="rgba(60,207,145,0.08)" stroke={C.ok} />
        <text x={510} y={281} textAnchor="middle" fill={C.fg} fontSize={13} fontWeight={600}>OeKB CSD: global positions for all 12 · AT ISINs (NNA) · CSD-operated DLT service · T2S-connected eligible SSS</text>
        <text x={510} y={298} textAnchor="middle" fill={C.mut} fontSize={10.5}>investor holdings = OeKB book entries, represented as RL1 token balances (CSD_OPERATOR_ROLE)</text>
        {[329, 712, 816, 933].map((x) => <L key={x} d={`M${x},222 L${x},258`} c={C.ok} />)}

        <Lbl y={340} t="RL1 · REGULATED LAYER ONE (SCE, LUXEMBOURG) · PERMISSIONED EVM · BFT FINALITY" />
        <rect x={20} y={348} width={980} height={92} rx={12} fill="rgba(59,111,255,0.08)" stroke={C.acc} />
        {[
          ["BondToken × 12", "balances · roles · termsHash"],
          ["IdentityRegistry", "KYC / category / US-person"],
          ["ComplianceModule", "Reg S · denomination · freeze"],
          ["DvPEscrow", "atomic primary + secondary"],
          ["USD settlement token", "tokenised deposit / EMT"],
          ["Fund units", "Chartered special fund"],
        ].map(([t, s], k) => <Box key={k} x={32 + k * 161} y={364} w={150} h={60} title={t} sub={s} fill="rgba(13,17,23,0.7)" />)}
        <L d="M510,310 L510,346" c={C.ok} />

        <Lbl y={470} t="VENUE · INVESTORS · CENTRAL BANK (NO EXCHANGE LISTING)" />
        <Box x={20} y={478} w={330} h={58} title="Seturion DLT TSS: the only venue" sub="order book · transparency · atomic DvP → OeKB book entry" stroke={C.vio} />
        <Box x={365} y={478} w={170} h={58} title="Investors & custodians" sub="whitelisted wallets" />
        <Box x={550} y={478} w={170} h={58} title="ORBIT special fund" sub="Chartered Investment · Spezial-AIF" stroke={C.acc} />
        <Box x={735} y={478} w={265} h={58} title="Eurosystem: T2 · T2S · ECMS · OeNB" sub="Pontes EUR cash leg · collateral" stroke={C.ok} />
        <L d="M185,476 L185,442" c={C.vio} />
        <L d="M450,476 L450,442" />
        <L d="M635,476 L635,442" c={C.acc} />
        <L d="M867,476 L867,442" c={C.ok} />
        <L d="M990,310 C1010,380 1010,440 980,476" c={C.ok} dash />

        <g fontSize={10.5} fill={C.mut}>
          <rect x={20} y={560} width={980} height={66} rx={10} fill="none" stroke={C.line} strokeDasharray="3 4" />
          <circle cx={40} cy={580} r={4} fill={C.acc} /><text x={50} y={584}>RL1 member issuers, registrar Chartered Investment</text>
          <circle cx={370} cy={580} r={4} fill={C.ok} /><text x={380} y={584}>OeKB CSD: issuer CSD for all, eligible-SSS path → T2S → ECMS</text>
          <circle cx={40} cy={604} r={4} fill={C.vio} /><text x={50} y={608}>Seturion holds SETTLEMENT_ROLE (no mint / burn / freeze)</text>
          <circle cx={370} cy={604} r={4} fill={C.warn} /><text x={380} y={608}>Cecabank: books, agency, paying agent</text>
          <text x={700} y={608}>Dashed = T2S realignment</text>
        </g>
      </svg>
    </div>
  );
}
