import { redirect } from "next/navigation";

/** /rp → home oficial (defiendelima.com = Renovación Popular). */
export default function RenovacionPopularRedirect() {
  redirect("/");
}
