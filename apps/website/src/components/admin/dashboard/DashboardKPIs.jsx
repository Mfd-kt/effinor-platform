import React from 'react';
import { 
  Users, ShoppingCart, CheckCircle2, DollarSign, 
  TrendingUp, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const KPICard = ({ title, value, trend, trendValue, icon: Icon, iconColor = 'bg-gradient-to-br from-green-400 to-emerald-500', loading = false, subtitle, gradientFrom, gradientTo }) => {
  const isPositive = trendValue >= 0;
  
  // Couleurs par défaut basées sur iconColor
  const colorMap = {
    'bg-blue-500': { from: 'from-blue-400', to: 'to-cyan-500', shadow: 'shadow-blue-500/20', text: 'text-blue-600' },
    'bg-green-500': { from: 'from-green-400', to: 'to-emerald-500', shadow: 'shadow-green-500/20', text: 'text-green-600' },
    'bg-purple-500': { from: 'from-purple-400', to: 'to-pink-500', shadow: 'shadow-purple-500/20', text: 'text-purple-600' },
    'bg-emerald-500': { from: 'from-emerald-400', to: 'to-teal-500', shadow: 'shadow-emerald-500/20', text: 'text-emerald-600' },
    'bg-amber-500': { from: 'from-amber-400', to: 'to-orange-500', shadow: 'shadow-amber-500/20', text: 'text-amber-600' },
    'bg-orange-500': { from: 'from-orange-400', to: 'to-red-500', shadow: 'shadow-orange-500/20', text: 'text-orange-600' },
  };
  
  const colors = colorMap[iconColor] || { from: 'from-indigo-400', to: 'to-purple-500', shadow: 'shadow-indigo-500/20', text: 'text-indigo-600' };
  
  if (loading) {
    return (
      <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-20 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={`rounded-xl border-0 shadow-lg ${colors.shadow} hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-${colors.from.split('-')[1]}-50/30 h-full`}>
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 truncate">{title}</p>
            <p className={`text-2xl lg:text-3xl font-bold bg-gradient-to-r ${colors.from} ${colors.to} bg-clip-text text-transparent mb-2`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-600 font-medium truncate mb-2">{subtitle}</p>
            )}
            {trend !== null && trend !== undefined && !isNaN(trendValue) && trendValue !== 0 && (
              <div className={`flex items-center gap-1.5 text-xs mt-2 font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                <span>{Math.abs(trendValue).toFixed(1)}%</span>
                <span className="text-gray-400 font-normal">vs précédent</span>
              </div>
            )}
          </div>
          <div className={`h-12 w-12 lg:h-14 lg:w-14 rounded-xl bg-gradient-to-br ${colors.from} ${colors.to} flex items-center justify-center shadow-lg ${colors.shadow} flex-shrink-0 ml-2 lg:ml-3`}>
            <Icon className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardKPIs = ({
  loading,
  totalLeads,
  leadsTrend,
  qualifiedLeads,
  qualifiedPercentage,
  totalOrders,
  ordersTrend,
  totalRevenue,
  avgBasket,
  conversionRate,
  pendingOrders,
  formatCurrency
}) => {
  return (
    <div className="mb-6 lg:mb-8">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 lg:mb-6 flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-blue-500"></div>
        Indicateurs clés
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4 lg:gap-6">
        <KPICard
          title="Total Leads"
          value={totalLeads.toLocaleString()}
          trend={leadsTrend}
          trendValue={leadsTrend}
          icon={Users}
          iconColor="bg-blue-500"
          loading={loading}
          subtitle={`Période sélectionnée`}
        />
        <KPICard
          title="Leads qualifiés"
          value={qualifiedLeads.toLocaleString()}
          trend={null}
          trendValue={0}
          icon={CheckCircle2}
          iconColor="bg-green-500"
          loading={loading}
          subtitle={`${qualifiedPercentage.toFixed(1)}% des leads`}
        />
        <KPICard
          title="Total Commandes"
          value={totalOrders.toLocaleString()}
          trend={ordersTrend}
          trendValue={ordersTrend}
          icon={ShoppingCart}
          iconColor="bg-purple-500"
          loading={loading}
          subtitle={`Période sélectionnée`}
        />
        <KPICard
          title="CA Commandes (TTC)"
          value={formatCurrency(totalRevenue)}
          trend={null}
          trendValue={0}
          icon={DollarSign}
          iconColor="bg-emerald-500"
          loading={loading}
          subtitle={`Panier moyen : ${formatCurrency(avgBasket)}`}
        />
        <KPICard
          title="Taux de conversion"
          value={conversionRate > 0 ? `${conversionRate.toFixed(1)}%` : '—'}
          trend={null}
          trendValue={0}
          icon={TrendingUp}
          iconColor="bg-amber-500"
          loading={loading}
          subtitle={`Lead → Commande`}
        />
        <KPICard
          title="Commandes en attente"
          value={pendingOrders.toLocaleString()}
          trend={null}
          trendValue={0}
          icon={Clock}
          iconColor="bg-orange-500"
          loading={loading}
          subtitle={`En attente de paiement`}
        />
      </div>
    </div>
  );
};

