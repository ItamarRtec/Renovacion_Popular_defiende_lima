import Link from "next/link";

const LINKS = [
  {
    href: "/admin/asignaciones",
    title: "Asignaciones",
    description: "Vincula personeros a coordinadores de forma manual.",
  },
  {
    href: "/admin/ventana",
    title: "Ventana de acceso",
    description: "Abre o cierra el ingreso público del evento.",
  },
  {
    href: "/admin/dominios",
    title: "Dominios",
    description: "Gestiona dominios de correo permitidos.",
  },
] as const;

export default function AdminPage() {
  return (
    <section className="mx-auto max-w-2xl">
      <p className="dl-kicker">Administración</p>
      <h1 className="dl-title mt-3 text-3xl">Panel</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Asignaciones, ventana de acceso y dominios. La promoción de roles se
        hace por el canal ops secreto.
      </p>
      <ul className="mt-8 space-y-3">
        {LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-lg border border-[rgb(16_119_161_/_0.16)] bg-white px-4 py-3 transition hover:border-[rgb(16_119_161_/_0.35)] hover:bg-[rgb(16_119_161_/_0.04)]"
            >
              <span className="font-medium text-[#0b2a36]">{item.title}</span>
              <span className="mt-0.5 block text-sm text-muted">
                {item.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
