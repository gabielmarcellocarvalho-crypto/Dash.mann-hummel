"use client";

export interface TabDef {
  id: string;
  label: string;
}

interface TabNavProps {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}

export function TabNav({ tabs, active, onChange }: TabNavProps) {
  return (
    <div className="border-b border-border px-4 py-3 sm:px-6 lg:px-8">
      <div
        role="tablist"
        aria-label="Seções do relatório"
        className="mx-auto flex w-max max-w-full justify-center gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-text-3 hover:text-text-1"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
