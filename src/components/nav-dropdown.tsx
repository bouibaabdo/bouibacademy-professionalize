import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type NavDropdownItem = {
  label: string;
  to: string;
  search?: Record<string, string>;
  description?: string;
};

type Props = {
  label: string;
  to?: string;
  items: NavDropdownItem[];
  footer?: { label: string; to: string; search?: Record<string, string> };
  onLoad?: () => void;
};

export function NavDropdown({ label, to, items, footer, onLoad }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) onLoad?.();
  }, [open, onLoad]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function openNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function closeSoon() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/60"
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 mt-1 min-w-[240px] rounded-xl border border-border bg-popover shadow-elegant p-2 z-50 animate-in fade-in-0 zoom-in-95"
        >
          {to && (
            <Link
              to={to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent"
            >
              {label} — نظرة عامة
            </Link>
          )}
          {to && items.length > 0 && <div className="my-1 h-px bg-border" />}
          <ul className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3 py-2 text-xs text-muted-foreground">لا توجد عناصر بعد</li>
            ) : (
              items.map((it, i) => (
                <li key={i}>
                  <Link
                    to={it.to}
                    search={it.search as never}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <span className="font-medium">{it.label}</span>
                    {it.description && (
                      <span className="block text-xs text-muted-foreground/80 mt-0.5">{it.description}</span>
                    )}
                  </Link>
                </li>
              ))
            )}
          </ul>
          {footer && (
            <>
              <div className="my-1 h-px bg-border" />
              <Link
                to={footer.to}
                search={footer.search as never}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-xs font-semibold text-primary hover:bg-accent"
              >
                {footer.label} ←
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
