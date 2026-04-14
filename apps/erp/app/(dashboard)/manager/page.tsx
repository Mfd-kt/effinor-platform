import { redirect } from "next/navigation";

/** Ancienne route — conservée pour ne pas casser les favoris / liens. */
export default function ManagerRedirect() {
  redirect("/cockpit");
}
