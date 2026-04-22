import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardDefault() {
  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Aucun rôle métier reconnu pour votre compte (ou rôle non encore provisionné)."
      />
      <Card className="max-w-xl border-border/80 shadow-sm">
        <CardContent className="pt-6 text-sm text-muted-foreground leading-relaxed">
          Contactez un administrateur pour recevoir un rôle : par exemple{" "}
          <strong className="font-medium text-foreground">technicien</strong>, agent commercial,
          closer, directeur commercial ou super administrateur. Les rôles sont gérés
          dans Supabase via les tables <code className="text-foreground">roles</code> et{" "}
          <code className="text-foreground">user_roles</code> (liaison{" "}
          <code className="text-foreground">user_id</code> → <code className="text-foreground">role_id</code>
          ).
        </CardContent>
      </Card>
    </div>
  );
}
