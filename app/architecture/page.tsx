"use client";
import { useState } from "react";
import { Callout, Card, Hash, PageHead, Tabs } from "@/components/ui";
import { COUNTRY, ISSUERS, VALIDATORS, isinOf } from "@/lib/data/scenario";
import { useStore } from "@/lib/store";
import { addressOf } from "@/lib/util";

type T = "network" | "contracts" | "messages" | "addresses";

const BOND_SOL = `// SPDX-License-Identifier: UNLICENSED — illustrative ORBIT template, not audited code
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

interface IIdentityRegistry {
    function isVerified(address wallet) external view returns (bool);       // KYC claim valid & not expired
    function investorCountry(address wallet) external view returns (uint16); // ISO 3166 numeric
    function isUSPerson(address wallet) external view returns (bool);        // Reg S Rule 902(k)
}

interface ICompliance {
    function canTransfer(address from, address to, uint256 amount) external view returns (bool, bytes32 reason);
}

contract OrbitBondToken is AccessControl {
    bytes32 public constant REGISTRAR_ROLE     = keccak256("REGISTRAR_ROLE");     // ERIR / teneur de registre / registerführende Stelle
    bytes32 public constant CSD_OPERATOR_ROLE  = keccak256("CSD_OPERATOR_ROLE");  // OeKB CSD (AT tranches)
    bytes32 public constant ISSUER_ROLE        = keccak256("ISSUER_ROLE");
    bytes32 public constant SETTLEMENT_ROLE    = keccak256("SETTLEMENT_ROLE");    // Seturion DLT TSS
    bytes32 public constant PAYING_AGENT_ROLE  = keccak256("PAYING_AGENT_ROLE");  // Cecabank
    bytes32 public constant PAUSER_ROLE        = keccak256("PAUSER_ROLE");

    string  public isin;            // e.g. AT0000ORBE1x
    string  public currency;        // "USD" | "EUR"
    uint256 public immutable issueAmount;      // 100_000_000 (nominal units)
    uint256 public immutable minDenomination;  // 200_000 USD / 100_000 EUR
    uint256 public immutable increment;        // 1_000
    bytes32 public termsHash;       // keccak256 of the signed Final Terms PDF
    bool    public paused;

    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public frozen;      // court order / sanctions
    mapping(address => uint256) public encumbered;  // Eurosystem / repo pledges
    uint256 public totalSupply;

    IIdentityRegistry public identity;
    ICompliance       public compliance;

    event Issued(address indexed to, uint256 amount);
    event Transfer(address indexed from, address indexed to, uint256 amount);
    event ForcedTransfer(address indexed from, address indexed to, uint256 amount, bytes32 legalRef);
    event Frozen(address indexed wallet, uint256 amount, bytes32 legalRef);
    event Encumbered(address indexed wallet, uint256 amount, bytes32 pledgee);
    event TermsAnchored(bytes32 termsHash);
    event Snapshot(uint256 indexed id, uint256 blockNumber);
    event Redeemed(address indexed holder, uint256 amount);

    function free(address w) public view returns (uint256) {
        return balanceOf[w] - frozen[w] - encumbered[w];
    }

    /// Integrity of the issue: can never exceed the amount in the Final Terms.
    function issue(address escrow, uint256 amount) external onlyRegistrarOrCsd {
        require(totalSupply + amount <= issueAmount, "ISSUE_CAP");
        totalSupply += amount; balanceOf[escrow] += amount;
        emit Issued(escrow, amount);
    }

    /// Holder-signed transfer (free of payment). Legal effect follows the governing law.
    function transfer(address to, uint256 amount) external whenNotPaused {
        _checked(msg.sender, to, amount);
    }

    /// Venue settlement leg, called by the DvPEscrow inside the atomic swap.
    function settlementTransfer(address from, address to, uint256 amount)
        external onlyRole(SETTLEMENT_ROLE) whenNotPaused { _checked(from, to, amount); }

    /// Registrar override: lost keys, court order, inheritance, resolution action.
    function forcedTransfer(address from, address to, uint256 amount, bytes32 legalRef)
        external onlyRegistrarOrCsd /* 3-of-5 multisig behind the role */ {
        require(amount % increment == 0 && amount >= minDenomination, "DENOM");
        if (frozen[from] > 0) frozen[from] -= _min(frozen[from], amount);
        _move(from, to, amount);
        emit ForcedTransfer(from, to, amount, legalRef);
    }

    function freeze(address w, uint256 amount, bytes32 legalRef) external onlyRegistrarOrCsd {
        frozen[w] += amount; require(frozen[w] + encumbered[w] <= balanceOf[w], "OVER");
        emit Frozen(w, amount, legalRef);
    }

    function encumber(address w, uint256 amount, bytes32 pledgee) external onlyRole(CSD_OPERATOR_ROLE) {
        require(free(w) >= amount, "FREE"); encumbered[w] += amount;
        emit Encumbered(w, amount, pledgee);
    }

    function snapshot() external onlyRole(PAYING_AGENT_ROLE) returns (uint256 id) { /* checkpoint */ }

    function redeem(address[] calldata holders) external onlyRegistrarOrCsd {
        for (uint i; i < holders.length; i++) {
            uint256 a = balanceOf[holders[i]]; balanceOf[holders[i]] = 0; totalSupply -= a;
            emit Redeemed(holders[i], a);
        }
    }

    function _checked(address from, address to, uint256 amount) internal {
        (bool ok, bytes32 reason) = compliance.canTransfer(from, to, amount);
        require(ok, string(abi.encodePacked(reason)));
        require(free(from) >= amount, "FREE_BALANCE");
        _move(from, to, amount);
    }
    function _move(address f, address t, uint256 a) internal { balanceOf[f] -= a; balanceOf[t] += a; emit Transfer(f, t, a); }
    function _min(uint a, uint b) internal pure returns (uint) { return a < b ? a : b; }
    modifier onlyRegistrarOrCsd() { require(hasRole(REGISTRAR_ROLE, msg.sender) || hasRole(CSD_OPERATOR_ROLE, msg.sender), "ROLE"); _; }
    modifier whenNotPaused() { require(!paused, "PAUSED"); _; }
}`;

const DVP_SOL = `contract DvPEscrow {
    struct Leg { address token; address from; address to; uint256 amount; }

    /// Called by Seturion's matching engine (SETTLEMENT_ROLE). Both legs or neither.
    function settleDvP(bytes32 tradeId, Leg calldata asset, Leg calldata cash) external onlySeturion {
        require(!settled[tradeId], "DUP");
        settled[tradeId] = true;
        IBond(asset.token).settlementTransfer(asset.from, asset.to, asset.amount); // reverts on compliance fail
        IERC20(cash.token).transferFrom(cash.from, cash.to, cash.amount);         // USD settlement token / EMT
        emit DvPSettled(tradeId, asset.to, asset.amount, cash.amount);
    }

    /// EUR leg via Pontes: lock, wait for the T2 confirmation, release.
    function lockForPontes(bytes32 tradeId, Leg calldata asset) external onlySeturionOrCsd { /* escrow asset */ }
    function onPontesConfirmation(bytes32 tradeId, bytes calldata t2Proof) external onlyPontesAdapter { /* release */ }
    function onPontesTimeout(bytes32 tradeId) external { /* return asset to seller */ }
}`;

const COMPLIANCE_SOL = `contract OrbitCompliance is ICompliance {
    function canTransfer(address from, address to, uint256 amount) external view returns (bool, bytes32) {
        if (!identity.isVerified(to))                       return (false, "RECEIVER_NOT_VERIFIED");  // KYC expired / unknown
        if (!identity.isVerified(from) && from != escrow)   return (false, "SENDER_NOT_VERIFIED");
        if (isUSD && identity.isUSPerson(to))               return (false, "REG_S_CAT2");
        if (amount < minDenomination || amount % increment != 0) return (false, "DENOMINATION");
        uint256 rest = bond.balanceOf(from) - amount;
        if (rest != 0 && rest < minDenomination)            return (false, "RESIDUAL_BELOW_MIN");
        if (block.timestamp < distributionComplianceEnd && identity.investorCountry(to) == US) return (false, "DCP_40D");
        return (true, "");
    }
}`;

export default function Architecture() {
  const [tab, setTab] = useState<T>("network");
  return (
    <>
      <PageHead eyebrow="07 · Architecture" title="RL1 network, contracts and message flows">
        The technical design behind ORBIT. Network parameters marked “scenario” are assumptions for this demo; RL1's published facts (SCE in
        Luxembourg, permissioned network built from SWIAT's production DLT, its validator set) are taken from RL1's own announcements.
      </PageHead>
      <Tabs<T> value={tab} onChange={setTab} tabs={[{ id: "network", label: "RL1 network" }, { id: "contracts", label: "Smart contracts" }, { id: "messages", label: "ISO 20022 & data flows" }, { id: "addresses", label: "Deployed addresses" }]} />
      {tab === "network" && <Network />}
      {tab === "contracts" && (
        <div className="space-y-5">
          <Callout tone="warn" title="Illustrative code">A readable sketch of the ORBIT contract set, not production code. The roles, invariants and events are the point.</Callout>
          <Card title="OrbitBondToken.sol: one per tranche"><pre className="code">{BOND_SOL}</pre></Card>
          <div className="grid gap-5 xl:grid-cols-2">
            <Card title="DvPEscrow.sol: atomic settlement"><pre className="code">{DVP_SOL}</pre></Card>
            <Card title="OrbitCompliance.sol: transfer rules"><pre className="code">{COMPLIANCE_SOL}</pre></Card>
          </div>
        </div>
      )}
      {tab === "messages" && <Messages />}
      {tab === "addresses" && <Addresses />}
    </>
  );
}

function Network() {
  const params = [
    ["Operator", "Regulated Layer One SCE, Luxembourg (cooperative, one member one vote)"],
    ["Heritage", "SWIAT's production DLT network, now owned by the cooperative; 50+ transactions, > EUR 700m volume before launch"],
    ["Access model", "Permissioned: member nodes, validator nodes, read-only supervisor nodes (BaFin, FMA, CNMV, AMF … on request)"],
    ["Execution", "EVM-compatible (scenario: Solidity contracts, account model)"],
    ["Consensus", "BFT validator consensus with immediate finality, no forks (scenario)"],
    ["Block time", "≈ 2 s (scenario)"],
    ["Fees", "No gas market; cost allocated through cooperative membership (scenario)"],
    ["Privacy", "No personal data on-chain; pseudonymous addresses; identity mapping held by registrars and custodians"],
    ["Interoperability", "Pontes adapter (Eurosystem), Seturion matching engine, registrar back-offices via node APIs"],
  ];
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
      <Card title="Network parameters" pad={false}>
        <table className="t"><tbody>{params.map(([k, v]) => <tr key={k}><td className="dim w-40">{k}</td><td>{v}</td></tr>)}</tbody></table>
      </Card>
      <div className="space-y-5">
        <Card title="Validator set">
          <div className="grid grid-cols-2 gap-2">
            {VALIDATORS.map((v, k) => (
              <div key={v} className="rounded-lg border border-line p-2.5 text-[12.5px]">
                <div className="font-medium">{v}</div>
                <div className="mono dim text-[10.5px]">{addressOf("validator" + k).slice(0, 18)}…</div>
              </div>
            ))}
          </div>
          <p className="dim mt-3 text-[11.5px]">With n = 8 validators, BFT tolerates f = 2 faulty nodes (n ≥ 3f + 1). A block needs 6 signatures to commit.</p>
        </Card>
        <Card title="Who runs what">
          <ul className="list-disc space-y-1.5 pl-5 text-[13px]">
            <li><b>Seturion:</b> matching engine (off-chain) + settlement node holding SETTLEMENT_ROLE keys</li>
            <li><b>Registrars:</b> nodes plus a register back-office (identity mapping, golden copy, reconciliation)</li>
            <li><b>OeKB CSD:</b> node connected to its CSD system and T2S</li>
            <li><b>Cecabank:</b> book-building system, agency and paying-agent engine</li>
            <li><b>Custodians:</b> wallet infrastructure (HSM/MPC) for client positions</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Messages() {
  const rows = [
    ["Settlement instruction", "sese.023", "Custodian → venue / registrar", "Primary allocation & secondary trade instruction"],
    ["Settlement status", "sese.024", "Venue → custodian", "Matched / pending / rejected (compliance)"],
    ["Settlement confirmation", "sese.025", "Venue / registrar → custodian", "Emitted when DvPSettled is final"],
    ["Statement of holdings", "semt.002", "Registrar → holder / custodian", "Register extract at a block height"],
    ["FI credit transfer", "pacs.009", "Bank → T2 (via Pontes)", "EUR cash leg, coupons, redemption"],
    ["Debit/credit notification", "camt.054", "Cash agent → participant", "Cash movement booked"],
    ["CA notification", "seev.031", "Paying agent → custodians", "Coupon announcement, record date"],
    ["CA movement confirmation", "seev.036", "Paying agent → custodians", "Coupon paid per position"],
    ["Collateral (ECMS)", "colr.* / sese.023", "Counterparty ↔ ECMS ↔ OeKB", "Mobilisation / demobilisation"],
  ];
  const flow = [
    ["Investor", "Order ticket via member (FIX 4.4 NewOrderSingle or API)"],
    ["Seturion", "Pre-trade checks against RL1 state (eth_call: free(), isVerified())"],
    ["Seturion", "Match at resting price; tradeId = keccak(venue, seq)"],
    ["Seturion → RL1", "settleDvP(tradeId, assetLeg, cashLeg) signed with SETTLEMENT_ROLE key"],
    ["RL1", "Compliance → bond leg → cash leg → DvPSettled event; block committed (BFT)"],
    ["Seturion", "Trade report and post-trade publication (MiFIR); sese.025 to both custodians"],
    ["Registrar", "Indexes the event, updates the identity-resolved register view, golden copy at end of day"],
  ];
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card title="ISO 20022 message map" pad={false}>
        <table className="t"><thead><tr><th>Purpose</th><th>Message</th><th>Direction</th><th>ORBIT use</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r[1] + r[0]}><td>{r[0]}</td><td className="mono text-accent">{r[1]}</td><td className="muted">{r[2]}</td><td className="dim text-[12px]">{r[3]}</td></tr>)}</tbody></table>
      </Card>
      <Card title="Secondary trade: end-to-end">
        <ol className="space-y-2.5">
          {flow.map(([w, d], k) => (
            <li key={k} className="flex gap-3 text-[13px]">
              <span className="mono flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[var(--accent-soft)] text-[11px] text-accent">{k + 1}</span>
              <div><b>{w}</b> <span className="muted">· {d}</span></div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function Addresses() {
  const { s } = useStore();
  return (
    <Card title="Contract registry (deterministic demo addresses)" pad={false}>
      <div className="scroll-x">
        <table className="t">
          <thead><tr><th>Tranche</th><th>ISIN</th><th>BondToken</th><th>Registrar</th><th>Settlement role</th></tr></thead>
          <tbody>
            {ISSUERS.map((i) => (
              <tr key={i.id}>
                <td>{COUNTRY[i.country].flag} {i.brand}</td>
                <td className="mono">{isinOf(i)}</td>
                <td><Hash v={s.bonds[i.id].contract} n={8} /></td>
                <td className="muted">{s.bonds[i.id].registrarName}</td>
                <td className="muted">{i.registerModel === "AT_CSD_DLT" ? "OeKB CSD + Seturion" : "Seturion"}</td>
              </tr>
            ))}
            <tr><td>Shared</td><td>IdentityRegistry</td><td><Hash v={addressOf("identity")} n={8} /></td><td colSpan={2} className="muted">Claim issuers: registrars & custodians</td></tr>
            <tr><td>Shared</td><td>DvPEscrow</td><td><Hash v={addressOf("escrow")} n={8} /></td><td colSpan={2} className="muted">Seturion SETTLEMENT_ROLE</td></tr>
            <tr><td>Shared</td><td>USD settlement token</td><td><Hash v={addressOf("usd-token")} n={8} /></td><td colSpan={2} className="muted">Tokenised commercial-bank deposit / EMT</td></tr>
            <tr><td>Shared</td><td>Pontes adapter</td><td><Hash v={addressOf("pontes")} n={8} /></td><td colSpan={2} className="muted">Eurosystem bridge to T2</td></tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
