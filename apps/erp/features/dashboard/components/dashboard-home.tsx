import { AlertCircle, ClipboardList, FileSearch, ListTodo } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const placeholderOps = [
  { ref: "OP-2026-0142", client: "Atelier Nord", statut: "En cours", date: "12 mars 2026" },
  { ref: "OP-2026-0138", client: "Logistique Ouest", statut: "Devis signé", date: "10 mars 2026" },
  { ref: "OP-2026-0121", client: "Serre Bio 44", statut: "Étude", date: "4 mars 2026" },
];

const placeholderDocs = [
  { id: "1", lib: "Attestation de conformité", statut: "À vérifier" },
  { id: "2", lib: "Fiche CEE signée", statut: "Conforme" },
];

const placeholderTasks = [
  { id: "1", lib: "Relance devis — OP-2026-0138", echeance: "Aujourd’hui" },
  { id: "2", lib: "Visite technique — Angers", echeance: "Demain" },
];

export function DashboardHome() {
  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue d’ensemble des dossiers CEE, documents et actions prioritaires."
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Opérations actives"
          value="—"
          hint="Données à brancher (Phase 4)"
          icon={<ClipboardList className="size-4" />}
        />
        <StatCard
          title="Documents à valider"
          value="—"
          hint="File de contrôle"
          icon={<FileSearch className="size-4" />}
        />
        <StatCard
          title="Tâches en retard"
          value="—"
          hint="Assignations équipe"
          icon={<AlertCircle className="size-4" />}
        />
        <StatCard
          title="Prime estimée (mois)"
          value="—"
          hint="Synthèse financière"
          icon={<ListTodo className="size-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium">Opérations récentes</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Mise à jour</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placeholderOps.map((row) => (
                  <TableRow key={row.ref}>
                    <TableCell className="font-mono text-xs">{row.ref}</TableCell>
                    <TableCell>{row.client}</TableCell>
                    <TableCell>
                      <StatusBadge variant="neutral">{row.statut}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {row.date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium">Documents à vérifier</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead className="text-right">État</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placeholderDocs.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.lib}</TableCell>
                    <TableCell className="text-right">
                      <StatusBadge
                        variant={row.statut === "Conforme" ? "success" : "warning"}
                      >
                        {row.statut}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">Tâches à échéance</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tâche</TableHead>
                <TableHead className="text-right">Échéance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {placeholderTasks.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.lib}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {row.echeance}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
