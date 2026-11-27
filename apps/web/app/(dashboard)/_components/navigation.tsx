"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/beranda", label: "Beranda", icon: "home-inactive", activeIcon: "home" },
  { href: "/pasar", label: "Pasar", icon: "market", activeIcon: "market-active", related: "/saham/" },
  { href: "/portofolio", label: "Portofolio", icon: "portfolio" },
  { href: "/riwayat", label: "Riwayat", icon: "history" },
  { href: "/bantuan", label: "Bantuan", icon: "help" },
  { href: "/pengaturan", label: "Pengaturan", icon: "settings" },
] as const;

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi aplikasi" className="col-span-2 row-start-2 flex min-w-0 flex-wrap gap-1 lg:flex-1 lg:flex-col">
      {navigation.map((item) => {
        const exact = pathname === item.href;
        const active = exact || pathname.startsWith(`${item.href}/`) ||
          ("related" in item && pathname.startsWith(item.related));
        const icon = active && "activeIcon" in item ? item.activeIcon : item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={exact ? "page" : active ? "location" : undefined}
            className="flex min-h-10 items-center gap-1.5 rounded-[9px] px-2 text-[13px] text-landing-muted hover:bg-landing-badge hover:text-white aria-[current]:bg-landing-badge aria-[current]:text-white lg:gap-2.5 lg:px-2.5 lg:text-[15px] lg:last:mt-auto"
          >
            <Image src={`/app-ui/${icon}.svg`} alt="" width={18} height={18} unoptimized className="hidden sm:block" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
