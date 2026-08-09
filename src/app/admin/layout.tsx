import { redirect } from "next/navigation";
import { RpAppShell } from "@/components/rp-app-shell";
import { getSessionRegistro, homePathForRole } from "@/lib/plataforma";

const NAV_GROUPS = [
  [
    { href: "/admin", label: "Panel", icon: "shield" as const },
    {
      href: "/admin/asignaciones",
      label: "Asignaciones",
      icon: "link" as const,
    },
    {
      href: "/admin/ventana",
      label: "Ventana",
      icon: "settings" as const,
    },
    {
      href: "/admin/dominios",
      label: "Dominios",
      icon: "settings" as const,
    },
  ],
  [
    {
      href: "/coordinacion",
      label: "Coordinación",
      icon: "chart" as const,
    },
  ],
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { registro, userId, plataformaRol } = await getSessionRegistro();

  if (!userId) redirect("/entrar");
  if (plataformaRol !== "administrador") {
    redirect(homePathForRole(plataformaRol));
  }

  const name = registro
    ? `${registro.nombres} ${registro.apellidos}`.trim()
    : null;

  return (
    <RpAppShell name={name} navGroups={NAV_GROUPS}>
      {children}
    </RpAppShell>
  );
}
