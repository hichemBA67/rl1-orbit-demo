// System map of RL1 ORBIT: issuers → coordinator → registrars → RL1 ledger → venue & Eurosystem.
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

export function ArchDiagram() {
  const issuers = [
    { x: 20, t: "🇪🇸 CaixaBank", s: "Spanish law" },
    { x: 180, t: "🇫🇷 CACEIS · Natixis · BFCM", s: "French law" },
    { x: 380, t: "🇳🇱 ABN AMRO", s: "Dutch law" },
    { x: 520, t: "🇩🇪 Deka · DZ · LBBW · Chartered", s: "German law" },
    { x: 730, t: "🇬🇧 StanChart · NatWest", s: "English law" },
    { x: 880, t: "🇦🇹 Erste · RBI", s: "Austrian law" },
  ];
  const widths = [150, 190, 130, 200, 140, 120];
  return (
    <div className="scroll-x">
      <svg viewBox="0 0 1020 560" className="w-full min-w-[820px]" role="img" aria-label="RL1 ORBIT architecture">
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.line} />
          </marker>
        </defs>
        <text x={20} y={14} fill={C.mut} fontSize={10} letterSpacing="1.5">ISSUERS · 11 × USD 100m + 2 × EUR 100m</text>
        {issuers.map((i, k) => <Box key={k} x={i.x} y={22} w={widths[k]} h={46} title={i.t} sub={i.s} />)}

        <text x={20} y={100} fill={C.mut} fontSize={10} letterSpacing="1.5">COORDINATION</text>
        <Box x={20} y={108} w={980} h={40} title="Cecabank — programme coordinator · global coordinator of the joint book · fiscal / paying / calculation agent" stroke={C.warn} />
        {issuers.map((i, k) => <L key={k} d={`M${i.x + widths[k] / 2},68 L${i.x + widths[k] / 2},106`} />)}

        <text x={20} y={180} fill={C.mut} fontSize={10} letterSpacing="1.5">REGISTRARS — KEEPERS OF THE LEGAL RECORD</text>
        <Box x={20} y={188} w={300} h={50} title="Cecabank — ERIR (ES) + contractual (NL, GB)" sub="Ley 6/2023 Art. 8 · Agency Agreement" stroke={C.acc} />
        <Box x={335} y={188} w={210} h={50} title="CACEIS Corporate Trust" sub="DEEP · CMF L.211-3 / L.211-7" stroke={C.acc} />
        <Box x={560} y={188} w={250} h={50} title="DekaBank Registry · SWIAT registry" sub="Kryptowertpapierregister · eWpG §16" stroke={C.acc} />
        <Box x={825} y={188} w={175} h={50} title="OeKB CSD (issuer CSD)" sub="Global note · DLT service" stroke={C.ok} />
        {[170, 440, 685, 912].map((x, k) => <L key={k} d={`M${x},148 L${x},186`} />)}

        <text x={20} y={272} fill={C.mut} fontSize={10} letterSpacing="1.5">RL1 — REGULATED LAYER ONE (SCE, LUXEMBOURG) · PERMISSIONED EVM · BFT FINALITY</text>
        <rect x={20} y={280} width={980} height={92} rx={12} fill="rgba(59,111,255,0.08)" stroke={C.acc} />
        {[
          ["BondToken × 13", "balances · roles · termsHash"],
          ["IdentityRegistry", "KYC / category / US-person claims"],
          ["ComplianceModule", "Reg S · denomination · freeze"],
          ["DvPEscrow", "atomic swap primary + secondary"],
          ["USD settlement token", "tokenised deposit / EMT"],
          ["Pontes adapter", "lock → T2 → release"],
        ].map(([t, s], k) => <Box key={k} x={32 + k * 161} y={296} w={150} h={60} title={t} sub={s} fill="rgba(13,17,23,0.7)" />)}
        {[170, 440, 685, 912].map((x, k) => <L key={k} d={`M${x},238 L${x},278`} c={k === 3 ? C.ok : C.acc} />)}

        <text x={20} y={404} fill={C.mut} fontSize={10} letterSpacing="1.5">VENUE · CASH · CENTRAL BANK</text>
        <Box x={20} y={412} w={330} h={58} title="Seturion — DLT TSS (BaFin licence, Oct 2026)" sub="order book · pre/post-trade transparency · atomic DvP" stroke={C.vio} />
        <Box x={365} y={412} w={190} h={58} title="Investors & custodians" sub="whitelisted wallets" />
        <Box x={570} y={412} w={140} h={58} title="Wiener Börse" sub="regulated market (AT)" />
        <Box x={725} y={412} w={275} h={58} title="Eurosystem: T2 · T2S · ECMS · OeNB" sub="Pontes cash leg · collateral" stroke={C.ok} />
        <L d="M185,410 L185,374" c={C.vio} />
        <L d="M460,410 L460,374" />
        <L d="M640,410 L640,374" dash />
        <L d="M862,410 L862,374" c={C.ok} />
        <L d="M912,238 C960,320 960,380 930,410" c={C.ok} dash />

        <g fontSize={10.5} fill={C.mut}>
          <rect x={20} y={496} width={980} height={50} rx={10} fill="none" stroke={C.line} strokeDasharray="3 4" />
          <circle cx={40} cy={514} r={4} fill={C.acc} /><text x={50} y={518}>Registrar writes legal record to RL1</text>
          <circle cx={290} cy={514} r={4} fill={C.vio} /><text x={300} y={518}>Seturion holds SETTLEMENT_ROLE (no mint / burn / freeze)</text>
          <circle cx={620} cy={514} r={4} fill={C.ok} /><text x={630} y={518}>Eligible-SSS path (OeKB → T2S → ECMS)</text>
          <circle cx={40} cy={534} r={4} fill={C.warn} /><text x={50} y={538}>Coordinator: books, agency, paying agent</text>
          <text x={290} y={538}>Dashed = listing / realignment, not token movement</text>
        </g>
      </svg>
    </div>
  );
}
