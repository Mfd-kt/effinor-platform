import React from 'react';
import { Trophy, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const DashboardTopPerformers = ({
  loading,
  topSources,
  topClients,
  formatCurrency
}) => {
  return (
    <div className="mb-6 lg:mb-8">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 lg:mb-6 flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-indigo-500"></div>
        Performances
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 xl:gap-8">
        {/* Top Sources */}
        <Card className="rounded-2xl border-0 shadow-xl shadow-emerald-500/10 bg-gradient-to-br from-white to-emerald-50/30">
          <CardHeader className="pb-4 bg-gradient-to-r from-emerald-50/50 to-transparent border-b border-emerald-100/50 rounded-t-2xl">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              Top Sources
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-2 font-medium">5 meilleures sources de leads</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : topSources.length > 0 ? (
              <div className="space-y-3">
                {topSources.map((source, index) => (
                  <div key={source.source} className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50/50 to-transparent rounded-xl border-2 border-transparent hover:border-emerald-200 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md transition-transform group-hover:scale-110 ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white' :
                        'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700'
                      }`}>
                        <span className="text-sm font-bold">#{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{source.source}</p>
                        <p className="text-xs text-gray-600 font-medium">{source.leads} leads • {source.orders} commandes</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <Badge variant="secondary" className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-0 text-xs font-bold px-3 py-1 shadow-sm">
                        {source.conversion.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 text-sm py-8">Aucune source disponible</p>
            )}
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card className="rounded-2xl border-0 shadow-xl shadow-blue-500/10 bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-blue-100/50 rounded-t-2xl">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Users className="h-5 w-5 text-white" />
              </div>
              Top Clients
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-2 font-medium">5 clients avec le plus de CA</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : topClients.length > 0 ? (
              <div className="space-y-3">
                {topClients.map((client, index) => (
                  <div key={client.name} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 to-transparent rounded-xl border-2 border-transparent hover:border-blue-200 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md transition-transform group-hover:scale-110 ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white' :
                        'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700'
                      }`}>
                        <span className="text-sm font-bold">#{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{client.name}</p>
                        <p className="text-xs text-gray-600 font-medium">{client.orders} commande{client.orders > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-bold text-gray-900 text-base bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        {formatCurrency(client.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 text-sm py-8">Aucun client disponible</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

