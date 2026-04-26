import { redirect } from "next/navigation";

/**
 * /settings → premier onglet (utilisateurs). Les droits finaux restent sur chaque page.
 */
export default function SettingsIndexPage() {
  redirect("/settings/users");
}
