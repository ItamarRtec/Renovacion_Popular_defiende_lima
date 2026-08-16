import { redirect } from "next/navigation";
import { RpAppShell } from "@/components/rp-app-shell";
import { getAdminSession } from "@/lib/admin-session";

const NAV_GROUPS = [
  [
    { href: "/admin", label: "Control", icon: "shield" as const },
    {
      href: "/admin/videos",
      label: "Videos",
      icon: "video" as const,
    },
    {
      href: "/admin/capacitacion",
      label: "Capacitación",
      icon: "users" as const,
    },
    {
      href: "/admin/actas",
      label: "Actas",
      icon: "image" as const,
    },
    {
      href: "/admin/mesas",
      label: "Mesas",
      icon: "chart" as const,
    },
    {
      href: "/admin/asignaciones",
      label: "Asignaciones",
      icon: "link" as const,
    },
    {
      href: "/admin/roles",
      label: "Roles",
      icon: "settings" as const,
    },
    {
      href: "/admin/eventos",
      label: "Eventos",
      icon: "qr" as const,
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
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin1010");

  return (
    <RpAppShell
      name={session.nombre || session.usuario}
      navGroups={NAV_GROUPS}
      signOutAction="/api/admin/logout"
    >
      {children}
    </RpAppShell>
  );
}
