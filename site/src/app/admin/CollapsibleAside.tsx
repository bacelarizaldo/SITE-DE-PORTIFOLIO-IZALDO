"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "./ui";

const KEY = "ib:menu-recolhido";
const EVENT = "ib:menu-recolhido";

function read() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Barra lateral que recolhe só para os ícones (a escolha fica salva neste computador).
 * Recolhida, ela marca data-collapsed e os textos marcados com group-data-[collapsed]/aside somem.
 */
export default function CollapsibleAside({ children }: { children: React.ReactNode }) {
  const collapsed = useSyncExternalStore(subscribe, read, () => false);

  function toggle() {
    try {
      localStorage.setItem(KEY, collapsed ? "0" : "1");
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <aside
      data-collapsed={collapsed ? "" : undefined}
      className={`group/aside hidden shrink-0 transition-[width] duration-200 lg:block ${collapsed ? "w-[84px]" : "w-[268px]"}`}
    >
      <div className="relative sticky top-0 flex h-screen flex-col overflow-y-auto bg-adm-surface px-4 py-7">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Abrir menu" : "Recolher menu"}
          title={collapsed ? "Abrir menu" : "Recolher menu"}
          aria-expanded={!collapsed}
          className={`absolute grid h-9 w-9 place-items-center rounded-xl text-adm-ink-2 ring-1 ring-adm-line transition hover:bg-adm-soft hover:text-adm-ink ${
            collapsed ? "top-[68px] left-1/2 -translate-x-1/2" : "top-6 right-4"
          }`}
        >
          <Icon name="panel" className="h-[18px] w-[18px]" />
        </button>
        {children}
      </div>
    </aside>
  );
}
