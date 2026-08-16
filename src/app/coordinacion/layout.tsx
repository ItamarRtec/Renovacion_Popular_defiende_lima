import { redirect } from "next/navigation";
import { RpAppShell } from "@/components/rp-app-shell";
import type { SidebarNavItem } from "@/components/sidebar-nav";
import { credencialesVisibles } from "@/lib/credencial-visible";
import { getSessionRegistro, homePathForRole } from "@/lib/plataforma";
import { isAdminRole, isStaffRole } from "@/lib/roles";

export default async function CoordinacionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { registro, userId, plataformaRol } = await getSessionRegistro();

  if (!userId) redirect("/entrar");

  if (!isStaffRole(plataformaRol)) {
    redirect(homePathForRole(plataformaRol));
  }

  const name = registro
    ? `${registro.nombres} ${registro.apellidos}`.trim()
    : null;

  const mostrarCredencial =
    !isAdminRole(plataformaRol) && (await credencialesVisibles());

  const coordinacionNav: SidebarNavItem[] = [
    { href: "/coordinacion", label: "Resumen", icon: "chart" },
    {
      href: "/coordinacion/eventos",
      label: "Registrar evento",
      icon: "qr",
    },
    {
      href: "/coordinacion/personeros",
      label: "Personeros",
      icon: "users",
    },
    {
      href: "/coordinacion/actas",
      label: "Colgar otra mesa",
      icon: "image",
    },
    ...(mostrarCredencial
      ? [
          {
            href: "/coordinacion/credencial",
            label: "Credencial",
            icon: "id" as const,
          },
        ]
      : []),
  ];

  const navGroups: readonly (readonly SidebarNavItem[])[] = isAdminRole(
    plataformaRol,
  )
    ? [
        coordinacionNav,
        [{ href: "/admin", label: "Administración", icon: "shield" }],
      ]
    : [coordinacionNav];

  return (
    <RpAppShell name={name} navGroups={navGroups}>
      {children}
    </RpAppShell>
  );
}
