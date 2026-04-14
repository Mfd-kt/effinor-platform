import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Building2, Receipt, ArrowRight } from 'lucide-react';

const ClientDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Espace client</h1>
        <p className="text-gray-600">Bienvenue dans votre espace client</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Projets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-2">0</p>
            <p className="text-sm text-gray-600">Projets en cours</p>
            <Link
              to="/espace-client/projets"
              className="text-sm text-[var(--secondary-500)] hover:underline mt-4 inline-flex items-center"
            >
              Voir tous les projets <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Devis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-2">0</p>
            <p className="text-sm text-gray-600">Devis récents</p>
            <Link
              to="/espace-client/devis"
              className="text-sm text-[var(--secondary-500)] hover:underline mt-4 inline-flex items-center"
            >
              Voir tous les devis <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-2">0</p>
            <p className="text-sm text-gray-600">Documents disponibles</p>
            <Link
              to="/espace-client/documents"
              className="text-sm text-[var(--secondary-500)] hover:underline mt-4 inline-flex items-center"
            >
              Voir tous les documents <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;














