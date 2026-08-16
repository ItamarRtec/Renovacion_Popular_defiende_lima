import { PromoteForm } from "@/components/admin/promote-form";

export default function AdminRolesPage() {
  return (
    <section className="mx-auto max-w-2xl">
      <p className="dl-kicker">Administración</p>
      <h1 className="dl-title mt-3 text-3xl">Promoción de roles</h1>
      <p className="mt-3 text-sm text-muted">
        Asigna el rol por un DNI o carga un CSV. Requiere la clave de servidor
        (ADMIN_PROMOTE_SECRET).
      </p>
      <div className="mt-8">
        <PromoteForm />
      </div>
    </section>
  );
}
