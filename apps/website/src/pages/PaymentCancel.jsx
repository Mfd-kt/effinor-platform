import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const commandeId = searchParams.get('commande_id');
  const navigate = useNavigate();

  const handleBackToCart = () => {
    // Simple : juste revenir au panier
    navigate('/panier');
  };

  return (
    <>
      <Helmet>
        <title>Paiement annulé | EFFINOR</title>
        <meta name="description" content="Le paiement a été annulé. Vous pouvez réessayer ou être rappelé par un expert." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-md p-8 md:p-10">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold text-center text-gray-900 mb-2">
            Votre paiement a été annulé ou n'a pas abouti.
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Aucune somme n'a été débitée. Votre panier est toujours disponible. Vous pouvez réessayer le paiement ou demander à être rappelé par un expert pour finaliser votre commande.
          </p>

          {commandeId && (
            <p className="text-center text-xs text-gray-500 mb-6">
              ID commande provisoire : <span className="font-mono">{commandeId}</span>
            </p>
          )}

          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={handleBackToCart}
              className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              ← Revenir à mon panier
            </button>
            <Link
              to="/contact"
              className="w-full inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
            >
              Être rappelé par un expert
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentCancel;
