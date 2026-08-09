"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarIcon,
  type SidebarIconName,
} from "@/components/icons/sidebar-icons";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: SidebarIconName;
};

function isActive(pathname: string, href: string) {
  if (href === "/plataforma" || href === "/coordinacion" || href === "/admin") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  groups,
}: {
  groups: readonly (readonly SidebarNavItem[])[];
}) {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2"
      aria-label="Principal"
    >
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="flex flex-col gap-0.5">
          {groupIndex > 0 ? (
            <div className="my-2 border-t border-[#e8e8e8]" aria-hidden />
          ) : null}
          {group.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition",
                  active
                    ? "bg-[#ebebeb] font-medium text-[#171717]"
                    : "text-[#404040] hover:bg-[#f0f0f0]",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <SidebarIcon
                  name={item.icon}
                  className="shrink-0 opacity-70"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function SidebarNavChips({
  groups,
}: {
  groups: readonly (readonly SidebarNavItem[])[];
}) {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 overflow-x-auto px-3 pb-3">
      {groups.flat().map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "shrink-0 rounded-md px-3 py-1.5 text-xs transition",
              active
                ? "bg-[#ebebeb] font-medium text-[#171717]"
                : "text-[#404040] hover:bg-[#f0f0f0]",
            ].join(" ")}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
