"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Ana sayfa", icon: "home" },
  { href: "/halka-arzlar", label: "Halka arzlar", icon: "list" },
  { href: "/gundem", label: "Gündem", icon: "pulse" },
  { href: "/profil", label: "Takiplerim", icon: "star" }
] as const;

function NavIcon({ name }: { name: (typeof items)[number]["icon"] }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "home") return <svg {...common}><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></svg>;
  if (name === "list") return <svg {...common}><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>;
  if (name === "pulse") return <svg {...common}><path d="M3 12h4l2.2-5 4.2 10 2.2-5H21"/></svg>;
  return <svg {...common}><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  return <nav className="mobileBottomNav" aria-label="Mobil ana menü">
    {items.map((item) => {
      const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
      return <Link href={item.href} key={item.href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
        <NavIcon name={item.icon} />
        <span>{item.label}</span>
      </Link>;
    })}
  </nav>;
}
