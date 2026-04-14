import React from 'react';
import { Users, ShoppingCart, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STATUS_COLORS = {
  'nouveau': '#3B82F6',
  'devis_a_preparer': '#F59E0B',
  'devis_envoye': '#8B5CF6',
  'en_negociation': '#EC4899',
  'gagne': '#10B981',
  'perdu': '#EF4444',
};

const COMMANDE_STATUS_COLORS = {
  'payee': '#10B981',
  'en_attente': '#F59E0B',
  'refusee': '#EF4444',
  'annulee': '#6B7280',
};

const StatusBadge = ({ status, type = 'lead' }) => {
  if (type === 'lead') {
    const color = STATUS_COLORS[status] || '#6B7280';
    return (
      <Badge 
        variant="outline" 
        className="text-xs"
        style={{ borderColor: color, color: color, backgroundColor: `${color}10` }}
      >
        {status.replace('_', ' ')}
      </Badge>
    );
  } else {
    const color = COMMANDE_STATUS_COLORS[status] || '#6B7280';
    return (
      <Badge 
        variant="outline" 
        className="text-xs"
        style={{ borderColor: color, color: color, backgroundColor: `${color}10` }}
      >
        {status.replace('_', ' ')}
      </Badge>
    );
  }
};

export const DashboardRecentActivity = ({
  loading,
  leads,
  orders,
  formatDate,
  formatCurrency
}) => {
  return (
    <div className="mb-6 lg:mb-8">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 lg:mb-6 flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-indigo-500"></div>
        Activité récente
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 xl:gap-8">
        {/* Recent Leads */}
        <Card className="rounded-2xl border-0 shadow-xl shadow-blue-500/10 bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-blue-100/50 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  Leads récents
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-2 font-medium">10 derniers leads</CardDescription>
              </div>
              <Link to="/leads">
                <Button variant="ghost" size="sm" className="rounded-lg font-semibold hover:bg-blue-50">
                  Voir tous <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : leads.slice(0, 10).length > 0 ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-transparent">
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Nom</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Source</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Statut</th>
                      <th className="text-right py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.slice(0, 10).map((lead) => (
                      <tr key={lead.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-colors">
                        <td className="py-3 px-4 text-xs text-gray-600 font-medium">{formatDate(lead.created_at)}</td>
                        <td className="py-3 px-4 text-xs text-gray-900 font-semibold">{lead.nom || lead.societe || '—'}</td>
                        <td className="py-3 px-4 text-xs text-gray-600">{lead.source || '—'}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={lead.statut} type="lead" />
                        </td>
                        <td className="py-3 px-4 text-xs font-bold text-gray-900 text-right">
                          {lead.montant_cee_estime ? formatCurrency(lead.montant_cee_estime) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-slate-400 text-sm py-8">Aucun lead récent</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="rounded-2xl border-0 shadow-xl shadow-purple-500/10 bg-gradient-to-br from-white to-purple-50/30">
          <CardHeader className="pb-4 bg-gradient-to-r from-purple-50/50 to-transparent border-b border-purple-100/50 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                  Commandes récentes
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-2 font-medium">10 dernières commandes</CardDescription>
              </div>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="rounded-lg font-semibold hover:bg-purple-50">
                  Voir toutes <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : orders.slice(0, 10).length > 0 ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-transparent">
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Réf.</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Client</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Statut</th>
                      <th className="text-right py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-transparent transition-colors">
                        <td className="py-3 px-4 text-xs text-gray-600 font-medium">{formatDate(order.date_creation)}</td>
                        <td className="py-3 px-4 text-xs text-gray-900 font-mono font-semibold bg-gray-50 px-2 py-1 rounded">{order.reference || order.id.substring(0, 8)}</td>
                        <td className="py-3 px-4 text-xs text-gray-900 font-semibold">{order.nom_client || order.email || '—'}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={order.paiement_statut || 'en_attente'} type="commande" />
                        </td>
                        <td className="py-3 px-4 text-xs font-bold text-gray-900 text-right">
                          {order.total_ttc || order.total_ht ? formatCurrency(order.total_ttc || order.total_ht) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-slate-400 text-sm py-8">Aucune commande récente</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

