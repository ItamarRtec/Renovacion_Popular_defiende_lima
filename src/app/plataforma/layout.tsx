import { redirect } from "next/navigation";
import { RpAppShell } from "@/components/rp-app-shell";
import { credencialesVisibles } from "@/lib/credencial-visible";
import { diaDActivo } from "@/lib/dia-d";
import { getSessionRegistro, homePathForRole } from "@/lib/plataforma";
import { isStaffRole } from "@/lib/roles";
import type { SidebarNavItem } from "@/components/sidebar-nav";

export default async function PlataformaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { registro, userId, plataformaRol } = await getSessionRegistro();

  if (!userId) {
    redirect("/entrar");
  }

  if (isStaffRole(plataformaRol)) {
    redirect(homePathForRole(plataformaRol));
  }

  const name = registro
    ? `${registro.nombres} ${registro.apellidos}`.trim()
    : null;

  const [mostrarCredencial, diaD] = await Promise.all([
    credencialesVisibles(),
    diaDActivo(),
  ]);
  const nav: SidebarNavItem[] = diaD
    ? [
        { href: "/plataforma", label: "Día D", icon: "home" },
        { href: "/plataforma/qr", label: "QR", icon: "qr" },
        { href: "/plataforma/credencial", label: "Credencial", icon: "id" },
        { href: "/plataforma/acta", label: "Actas", icon: "image" },
      ]
    : [
        { href: "/plataforma", label: "Inicio", icon: "home" },
        { href: "/plataforma/videos", label: "Videos", icon: "video" },
        { href: "/plataforma/qr", label: "Mi QR", icon: "qr" },
        ...(mostrarCredencial
          ? [{ href: "/plataforma/credencial", label: "Credencial", icon: "id" as const }]
          : []),
        { href: "/plataforma/acta", label: "Actas", icon: "image" },
      ];

  return (
    <RpAppShell name={name} navGroups={[nav]}>
      {children}
    </RpAppShell>
  );
}
