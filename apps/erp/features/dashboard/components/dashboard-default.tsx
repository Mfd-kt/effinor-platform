import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardDefault() {
  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Aucun rôle métier n’est encore assigné à votre compte."
      />
      <Card className="max-w-xl border-border/80 shadow-sm">
        <CardContent className="pt-6 text-sm text-muted-foreground leading-relaxed">
          Contactez un administrateur pour recevoir un rôle (agent commercial, confirmateur, closer,
          directeur commercial ou super administrateur). Les rôles sont gérés dans Supabase via les
          tables <code className="text-foreground">roles</code> et{" "}
          <code className="text-foreground">user_roles</code>.
        </CardContent>
      </Card>
    </div>
  );
}
