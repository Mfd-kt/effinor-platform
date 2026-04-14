import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Ancienne section de liens opération / bénéficiaire / site — conservée comme rappel métier minimal. */
export function DocumentRelationsSection() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Référentiel documentaire</CardTitle>
        <CardDescription>
          Les documents sont gérés de façon autonome. Associez-les aux leads ou dossiers via vos processus
          internes.
        </CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
