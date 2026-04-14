import React from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const RealisationEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  return (
    <>
      <Helmet>
        <title>{isNew ? 'Nouvelle réalisation' : 'Éditer réalisation'} | Effinor Admin</title>
      </Helmet>

      <div className="admin-page p-4 md:p-8">
        <div className="page-header mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/realisations')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNew ? 'Nouvelle réalisation' : 'Éditer réalisation'}
              </h1>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">
            Formulaire d'édition de réalisation - À implémenter
          </p>
        </div>
      </div>
    </>
  );
};

export default RealisationEdit;














