import { redirect } from "next/navigation";
import { RpAppShell } from "@/components/rp-app-shell";
import { accesoPublicoAbierto } from "@/lib/acceso";
import { getSessionRegistro, homePathForRole } from "@/lib/plataforma";

const NAV_GROUPS = [
  [
    { href: "/plataforma", label: "Inicio", icon: "home" as const },
    { href: "/plataforma/videos", label: "Videos", icon: "video" as const },
    { href: "/plataforma/acta", label: "Acta", icon: "image" as const },
  ],
] as const;

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

  // Fuera de la ventana de acceso, la plataforma queda cerrada para no-admins.
  if (!(await accesoPublicoAbierto())) {
    redirect("/entrar?cerrado=1");
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
