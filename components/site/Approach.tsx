"use client";

import { ChevronDown } from "lucide-react";
import { useState, useSyncExternalStore, type ReactNode } from "react";

export type ApproachItem = { id: string; icon: ReactNode; title: string; body: ReactNode };

const subscribe = () => () => {};

/** Accordion where exactly one item is open. Server HTML shows every item expanded. */
export function Approach({ items }: { items: ApproachItem[] }) {
  const [open, setOpen] = useState(items[0]?.id);
  // false on the server and during hydration, true afterwards: items only collapse
  // once JavaScript runs, so every answer stays readable without it.
  const interactive = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return (
    <ul className={`icon-list stack${interactive ? " is-interactive" : ""}`}>
      {items.map((item) => {
        const isOpen = !interactive || item.id === open;
        return (
          <li key={item.id} className={item.id === open ? "is-open" : undefined}>
            <button
              type="button"
              className="sheet-toggle"
              aria-expanded={isOpen}
              aria-controls={`approach-${item.id}`}
              onClick={() => setOpen(item.id)}
            >
              {item.icon}
              <span className="title">{item.title}</span>
              {interactive && <ChevronDown className="sheet-chevron" aria-hidden />}
            </button>
            <div className="sheet-body" id={`approach-${item.id}`}>
              <div>{item.body}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
