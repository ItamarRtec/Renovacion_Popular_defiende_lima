import { CredencialVista } from "@/components/credencial-vista";
import { getSessionRegistro } from "@/lib/plataforma";

export default async function CoordinacionCredencialPage() {
  const { registro } = await getSessionRegistro();
  return <CredencialVista registro={registro} homeHref="/coordinacion" />;
}
