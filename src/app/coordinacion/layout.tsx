import { redirect } from "next/navigation";
import { RpAppShell } from "@/components/rp-app-shell";
import { accesoPublicoAbierto } from "@/lib/acceso";
import { getSessionRegistro, homePathForRole } from "@/lib/plataforma";

export default async function CoordinacionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { registro, userId, plataformaRol } = await getSessionRegistro();

  if (!userId) redirect("/entrar");

  if (plataformaRol === "personero") {
    redirect(homePathForRole("personero"));
  }

  if (plataformaRol !== "coordinador" && plataformaRol !== "administrador") {
    redirect("/plataforma");
  }

  // Fuera de la ventana de acceso, solo administradores entran.
  if (plataformaRol !== "administrador" && !(await accesoPublicoAbierto())) {
    redirect("/entrar?cerrado=1");
  }

  const name = registro
    ? `${registro.nombres} ${registro.apellidos}`.trim()
    : null;

  const navGroups =
    plataformaRol === "administrador"
      ? ([
          [
            { href: "/coordinacion", label: "Resumen", icon: "chart" as const },
            {
              href: "/coordinacion/personeros",
              label: "Personeros",
              icon: "users" as const,
            },
          ],
          [{ href: "/admin", label: "Administración", icon: "shield" as const }],
        ] as const)
      : ([
          [
            { href: "/coordinacion", label: "Resumen", icon: "chart" as const },
            {
              href: "/coordinacion/personeros",
              label: "Personeros",
              icon: "users" as const,
            },
          ],
        ] as const);

  return (
    <RpAppShell name={name} navGroups={navGroups}>
      {children}
    </RpAppShell>
  );
}
