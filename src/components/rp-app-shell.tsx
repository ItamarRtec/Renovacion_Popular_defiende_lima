import Image from "next/image";
import Link from "next/link";
import { SidebarIcon } from "@/components/icons/sidebar-icons";
import {
  SidebarNav,
  SidebarNavChips,
  type SidebarNavItem,
} from "@/components/sidebar-nav";
import { BRANDS } from "@/lib/brands";

const rp = BRANDS.renovacion_popular;

export type { SidebarNavItem };

/**
 * App shell with Supabase-style left sidebar.
 * Uses literal hex colors — theme-rp remaps Tailwind `white`/`black`.
 */
export function RpAppShell({
  children,
  navGroups,
  name,
}: {
  children: React.ReactNode;
  navGroups: readonly (readonly SidebarNavItem[])[];
  name?: string | null;
}) {
  return (
    <>
      <style>{`
        html { color-scheme: light; }
        body { background: #f8f9fa !important; color: #1c1c1c; }
      `}</style>
      <div className="theme-rp flex min-h-full flex-1 bg-[#f8f9fa] text-[#1c1c1c]">
        {/* Desktop sidebar — light gray like Supabase */}
        <aside className="sticky top-0 hidden h-svh w-[15.5rem] shrink-0 flex-col border-r border-[#e8e8e8] bg-[#f8f9fa] md:flex">
          <div className="flex h-12 items-center gap-2.5 px-4">
            <Link
              className="inline-flex min-w-0 items-center gap-2.5"
              href={rp.homeHref}
              aria-label={`${rp.name} — inicio`}
            >
              <Image
                src={rp.logoSrc}
                alt={rp.logoAlt}
                width={26}
                height={26}
                className="h-[26px] w-[26px] shrink-0 object-contain"
                priority
              />
              <span className="truncate text-[13px] font-semibold leading-tight tracking-tight text-[#171717]">
                Renovación Popular
                <span className="block text-[11px] font-normal text-[#707070]">
                  Plataforma
                </span>
              </span>
            </Link>
          </div>

          <SidebarNav groups={navGroups} />

          <div className="mt-auto border-t border-[#e8e8e8] p-3">
            {name ? (
              <p className="mb-1.5 truncate px-2.5 text-[11px] text-[#707070]">
                {name}
              </p>
            ) : null}
            <form action="/api/auth/sign-out" method="post">
              <button
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-[#404040] transition hover:bg-[#ebebeb]"
                type="submit"
              >
                <SidebarIcon name="logout" className="opacity-70" />
                Salir
              </button>
            </form>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col bg-[#ffffff]">
          <header className="border-b border-[#e8e8e8] bg-[#ffffff] md:hidden">
            <div className="flex h-12 items-center justify-between gap-3 px-4">
              <Link
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#171717]"
                href={rp.homeHref}
              >
                <Image
                  src={rp.logoSrc}
                  alt={rp.logoAlt}
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                />
                <span>RP Plataforma</span>
              </Link>
              <form action="/api/auth/sign-out" method="post">
                <button
                  className="rounded-md border border-[#d4d4d4] px-3 py-1.5 text-xs text-[#404040]"
                  type="submit"
                >
                  Salir
                </button>
              </form>
            </div>
            <SidebarNavChips groups={navGroups} />
          </header>

          <main className="flex-1 px-4 py-8 sm:px-8 lg:px-10">{children}</main>
        </div>
      </div>
    </>
  );
}
