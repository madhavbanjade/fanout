"use client";

import type { ReactNode } from "react";

export interface SectionNavItem {
  key: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
}

export default function SectionNav({
  heading,
  items,
  activeKey,
  onSelect,
}: {
  heading?: string;
  items: SectionNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <nav className="w-full sm:w-52 sm:shrink-0">
      {heading && <p className="section-label px-3 pb-2">{heading}</p>}
      <div className="flex gap-1 overflow-x-auto sm:flex-col sm:overflow-visible">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            disabled={item.disabled}
            onClick={() => onSelect(item.key)}
            className={`flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors ${
              item.key === activeKey ? "nav-item-active" : "nav-item-inactive"
            }`}
            style={{
              fontSize: "var(--text-sm)",
              opacity: item.disabled ? 0.5 : 1,
              cursor: item.disabled ? "default" : "pointer",
            }}
          >
            <span className="grid h-4 w-4 place-items-center">{item.icon}</span>
            {item.label}
            {item.disabled && (
              <span className="section-label ml-auto" style={{ fontSize: "10px" }}>
                Soon
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
