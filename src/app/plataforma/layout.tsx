import { redirect } from "next/navigation";
import { RpAppShell } from "@/components/rp-app-shell";
import { credencialesVisibles } from "@/lib/credencial-visible";
import { getSessionRegistro, homePathForRole } from "@/lib/plataforma";
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

  if (plataformaRol === "coordinador" || plataformaRol === "administrador") {
    redirect(homePathForRole(plataformaRol));
  }

  const name = registro
    ? `${registro.nombres} ${registro.apellidos}`.trim()
    : null;

  const mostrarCredencial = await credencialesVisibles();
  const nav: SidebarNavItem[] = [
    { href: "/plataforma", label: "Inicio", icon: "home" },
    { href: "/plataforma/videos", label: "Videos", icon: "video" },
    { href: "/plataforma/qr", label: "Mi QR", icon: "qr" },
    ...(mostrarCredencial
      ? [{ href: "/plataforma/credencial", label: "Credencial", icon: "id" as const }]
      : []),
    { href: "/plataforma/acta", label: "Acta", icon: "image" },
  ];

  return (
    <RpAppShell name={name} navGroups={[nav]}>
      {children}
    </RpAppShell>
  );
}
