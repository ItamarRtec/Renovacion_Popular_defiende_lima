import { redirect } from "next/navigation";
import { RpAppShell } from "@/components/rp-app-shell";
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

  const name = registro
    ? `${registro.nombres} ${registro.apellidos}`.trim()
    : null;

  const navGroups =
    plataformaRol === "administrador"
      ? ([
          [
            { href: "/coordinacion", label: "Resumen", icon: "chart" as const },
            {
              href: "/coordinacion/eventos",
              label: "Registrar evento",
              icon: "qr" as const,
            },
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
              href: "/coordinacion/eventos",
              label: "Registrar evento",
              icon: "qr" as const,
            },
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
