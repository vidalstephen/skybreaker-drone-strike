import { ArrowLeft, CheckCircle, Lock, RotateCcw, Zap } from 'lucide-react';
import { allUpgradeNodes, UPGRADE_TREES, canPurchaseUpgrade } from '../../config/upgrades';
import type { CampaignProgress, UpgradeCoreId } from '../../types/game';
import { MenuButton } from './MenuButton';
import { ShellPanel } from './ShellPanel';

export interface UpgradeScreenProps {
  progress: CampaignProgress;
  onPurchaseUpgrade: (nodeId: string) => void;
  onRespecUpgrades?: () => void;
  onBack: () => void;
}

const CORE_COLORS: Record<UpgradeCoreId, string> = {
  flight:  'text-sky-400',
  weapons: 'text-orange-400',
  defense: 'text-emerald-400',
  sensor:  'text-violet-400',
  payload: 'text-red-400',
};

const CORE_BORDER: Record<UpgradeCoreId, string> = {
  flight:  'border-sky-400/30',
  weapons: 'border-orange-400/30',
  defense: 'border-emerald-400/30',
  sensor:  'border-violet-400/30',
  payload: 'border-red-400/30',
};

export function UpgradeScreen({ progress, onPurchaseUpgrade, onRespecUpgrades, onBack }: UpgradeScreenProps) {
  const inventory = progress.inventory;
  const upgradeLevels = inventory?.upgradeLevels ?? {};
  const parts = inventory?.parts ?? 0;

  const ownedNodes = allUpgradeNodes().filter(n => (upgradeLevels[n.id] ?? 0) >= 1);
  const hasOwned = ownedNodes.length > 0;
  const respecRefund = ownedNodes.reduce((sum, n) => sum + n.costParts, 0);

  return (
    <ShellPanel
      eyebrow="Aircraft Bay"
      title="UPGRADE CORES"
      side={
        <div className="border border-white/10 bg-black/45 p-4 font-mono backdrop-blur-md sm:p-5">
          <div className="text-[10px] uppercase tracking-[0.28em] text-white/45">Inventory</div>
          <div className="mt-3 border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[9px] uppercase tracking-[0.22em] text-white/35">Spare Parts</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl text-white">{parts}</span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/45">pts</span>
            </div>
          </div>
          <p className="mt-4 text-[10px] leading-relaxed text-white/45 uppercase tracking-[0.10em]">
            Purchase upgrades to improve flight, weapons, and survival. Parts are earned from mission completion.
          </p>
          <div className="mt-5">
            <MenuButton icon={<ArrowLeft size={18} />} onClick={onBack}>Hangar</MenuButton>
          </div>
          {hasOwned && onRespecUpgrades && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onRespecUpgrades}
                className="flex w-full items-center justify-center gap-2 border border-amber-500/40 bg-amber-500/10 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-amber-400 transition-colors hover:bg-amber-500/20"
              >
                <RotateCcw size={11} />
                Respec All +{respecRefund} pts
              </button>
            </div>
          )}
        </div>
      }
    >
      <div className="grid max-w-3xl gap-4" data-menu="upgrades">
        {UPGRADE_TREES.map(tree => {
          const ownedCount = tree.nodes.filter(node => (upgradeLevels[node.id] ?? 0) >= 1).length;
          return (
            <div key={tree.coreId} className={`border ${CORE_BORDER[tree.coreId]} bg-black/35 p-4 sm:p-5`}>
              {/* Tree header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`text-[10px] font-mono uppercase tracking-[0.28em] ${CORE_COLORS[tree.coreId]}`}>
                    {tree.coreId.toUpperCase()} CORE
                  </div>
                  <div className="mt-1 font-mono text-sm uppercase tracking-[0.14em] text-white">
                    {tree.label}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">
                  <Zap size={11} className={CORE_COLORS[tree.coreId]} />
                  {ownedCount}/{tree.nodes.length} installed
                </div>
              </div>

              <p className="mt-2 text-[11px] leading-relaxed text-white/50">{tree.description}</p>

              {/* Nodes */}
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {tree.nodes.map(node => {
                  const owned = (upgradeLevels[node.id] ?? 0) >= 1;
                  const prereqMet = !node.requires || (upgradeLevels[node.requires] ?? 0) >= 1;
                  const affordable = (inventory?.parts ?? 0) >= node.costParts;
                  const canBuy = !owned && prereqMet && affordable && !!inventory;
                  const available = !owned && prereqMet;

                  return (
                    <div
                      key={node.id}
                      className={[
                        'border p-3 font-mono',
                        owned
                          ? `${CORE_BORDER[tree.coreId]} bg-white/[0.06]`
                          : available
                            ? 'border-white/10 bg-black/25'
                            : 'border-white/5 bg-black/15 opacity-60',
                      ].join(' ')}
                    >
                      {/* Node header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-white">{node.label}</div>
                        {owned ? (
                          <CheckCircle size={12} className={`shrink-0 ${CORE_COLORS[tree.coreId]}`} />
                        ) : !prereqMet ? (
                          <Lock size={12} className="shrink-0 text-white/25" />
                        ) : null}
                      </div>

                      {/* Description */}
                      <p className="mt-1.5 text-[10px] leading-relaxed text-white/55">{node.description}</p>

                      {/* Prereq hint */}
                      {!owned && !prereqMet && node.requires && (
                        <div className="mt-2 text-[9px] uppercase tracking-[0.14em] text-white/30">
                          Requires: {UPGRADE_TREES.flatMap(t => t.nodes).find(n => n.id === node.requires)?.label ?? node.requires}
                        </div>
                      )}

                      {/* Cost + purchase */}
                      {!owned && (
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className={`text-[10px] uppercase tracking-[0.12em] ${affordable && prereqMet ? 'text-white' : 'text-white/35'}`}>
                            {node.costParts} pts
                          </span>
                          <button
                            type="button"
                            disabled={!canBuy}
                            onClick={() => canBuy && onPurchaseUpgrade(node.id)}
                            className={[
                              'border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] transition-colors',
                              canBuy
                                ? `${CORE_BORDER[tree.coreId]} ${CORE_COLORS[tree.coreId]} cursor-pointer hover:bg-white/10`
                                : 'cursor-default border-white/10 text-white/25',
                            ].join(' ')}
                          >
                            {canBuy ? 'Install' : available ? 'Insufficient' : 'Locked'}
                          </button>
                        </div>
                      )}

                      {owned && (
                        <div className={`mt-3 text-[9px] uppercase tracking-[0.18em] ${CORE_COLORS[tree.coreId]}`}>
                          Installed
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </ShellPanel>
  );
}
