"use client";

import type { ComponentType } from "react";
import {
  IconConnect,
  IconHome,
  IconMove,
  IconNourish,
} from "@/components/cracker/icons";
import type { CrackerTab } from "@/components/cracker/types";

const ITEMS: {
  key: CrackerTab;
  label: string;
  Icon: ComponentType<{ active?: boolean }>;
}[] = [
  { key: "home", label: "Home", Icon: IconHome },
  { key: "move", label: "Move", Icon: IconMove },
  { key: "nourish", label: "Nourish", Icon: IconNourish },
  { key: "connect", label: "Connect", Icon: IconConnect },
];

type Props = {
  tab: CrackerTab;
  onChange: (tab: CrackerTab) => void;
};

export function CrackerTabBar({ tab, onChange }: Props) {
  return (
    <nav className="cracker-tabbar" aria-label="Christmas Cracker">
      {ITEMS.map(({ key, label, Icon }) => {
        const active = tab === key;
        return (
          <button
            key={key}
            type="button"
            className={active ? "active" : undefined}
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(key)}
          >
            <Icon active={active} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
