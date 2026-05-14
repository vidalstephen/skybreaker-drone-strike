import { useCallback, useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function Tabs({ tabs, activeId, onChange, ariaLabel, className = '', size = 'md' }: TabsProps) {
  const baseId = useId();
  const stripRef = useRef<HTMLDivElement | null>(null);

  const sizeClasses = size === 'sm'
    ? 'min-h-8 px-2.5 text-[9px] tracking-[0.14em]'
    : 'min-h-10 px-3 text-[10px] tracking-[0.16em]';

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeId);
    if (currentIndex < 0) return;
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    onChange(tabs[nextIndex].id);
  }, [tabs, activeId, onChange]);

  // Ensure the active tab is scrolled into view when the strip overflows.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const active = strip.querySelector<HTMLButtonElement>(`[data-tab-id="${activeId}"]`);
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeId]);

  return (
    <div
      ref={stripRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {tabs.map(tab => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            id={`${baseId}-tab-${tab.id}`}
            role="tab"
            type="button"
            data-tab-id={tab.id}
            aria-selected={isActive}
            aria-controls={`${baseId}-panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={handleKeyDown}
            className={`shrink-0 snap-start inline-flex items-center justify-center gap-1.5 border font-black uppercase transition-colors ${sizeClasses} ${
              isActive
                ? 'border-orange-500 bg-orange-500 text-black'
                : 'border-white/15 bg-black/35 text-white hover:border-orange-500'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export interface TabPanelProps {
  tabsId?: string;
  tabId: string;
  active: boolean;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ tabId, active, children, className = '' }: TabPanelProps) {
  if (!active) return null;
  return (
    <div
      role="tabpanel"
      data-tab-panel={tabId}
      className={className}
    >
      {children}
    </div>
  );
}
