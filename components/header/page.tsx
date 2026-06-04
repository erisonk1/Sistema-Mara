"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/",            label: "Criar Comandas",     icon: "📝" },
  { href: "/ver",         label: "Ver Comandas",        icon: "👁️" },
  { href: "/editar",      label: "Editar Cardápio",     icon: "✏️" },
  { href: "/faturamento", label: "Faturamento",         icon: "💰" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* ── Overlay (mobile) ─────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-100 shadow-xl
          flex flex-col z-50 transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo / título */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold">R</span>
            </div>
            <span className="font-bold text-gray-900 text-base tracking-tight">Restaurante</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            aria-label="Fechar menu"
          >
            ×
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">
            Navegação
          </p>
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ href, label, icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                      ${active
                        ? "bg-rose-50 text-rose-600 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                  >
                    <span className="text-base leading-none">{icon}</span>
                    {label}
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-500" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer da sidebar */}
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">v1.0 · Sistema de Comandas</p>
        </div>
      </aside>

      {/* ── Botão hambúrguer ─────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir menu"
        className={`fixed top-3.5 z-50 flex items-center gap-2 bg-rose-500 hover:bg-rose-600
          active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md
          transition-all duration-300`}
        style={{ left: isOpen ? "272px" : "16px" }}
      >
        {/* hamburger / X icon */}
        <span className="w-4 h-4 flex flex-col justify-center gap-[4px] shrink-0">
          {isOpen ? (
            // X
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="14" y2="14" />
              <line x1="14" y1="2" x2="2" y2="14" />
            </svg>
          ) : (
            // Hambúrguer
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="4" x2="15" y2="4" />
              <line x1="1" y1="8" x2="15" y2="8" />
              <line x1="1" y1="12" x2="15" y2="12" />
            </svg>
          )}
        </span>
        <span className="hidden sm:inline">{isOpen ? "Fechar" : "Menu"}</span>
      </button>
    </>
  );
}