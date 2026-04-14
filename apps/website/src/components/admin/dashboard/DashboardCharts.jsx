import React from 'react';
import { LineChart, BarChart3 } from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart as RechartsPieChart, 
  Pie, Cell
} from 'recharts';
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

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
        <p className="font-semibold mb-2 text-slate-900">{payload[0].payload.name}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardCharts = ({
  loading,
  chartData,
  chartView,
  setChartView,
  leadsStatusBreakdown,
  ordersStatusBreakdown
}) => {
  return (
    <div className="mb-6 lg:mb-8">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 lg:mb-6 flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-indigo-500"></div>
        Analyses et graphiques
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 xl:gap-8">
        {/* Main Chart - 2/3 width */}
        <Card className="lg:col-span-2 rounded-2xl border-0 shadow-xl shadow-indigo-500/10 bg-gradient-to-br from-white to-indigo-50/30">
          <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-indigo-100/50 rounded-t-2xl">
            <div className="space-y-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <LineChart className="h-5 w-5 text-white" />
                  </div>
                  Évolution Leads & Commandes
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-2 font-medium">Évolution sur la période sélectionnée</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={chartView === 'daily' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartView('daily')}
                  className={`rounded-lg font-semibold transition-all ${
                    chartView === 'daily' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-lg shadow-indigo-500/30' 
                      : 'border-2 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  Quotidien
                </Button>
                <Button
                  variant={chartView === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartView('weekly')}
                  className={`rounded-lg font-semibold transition-all ${
                    chartView === 'weekly' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-lg shadow-indigo-500/30' 
                      : 'border-2 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  Hebdomadaire
                </Button>
                <Button
                  variant={chartView === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartView('monthly')}
                  className={`rounded-lg font-semibold transition-all ${
                    chartView === 'monthly' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-lg shadow-indigo-500/30' 
                      : 'border-2 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  Mensuel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10B981]"></div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-slate-500">
                <BarChart3 className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-center font-medium">Aucune donnée disponible</p>
              </div>
            ) : (
              <div className="w-full sm:h-[450px] lg:h-[500px]" style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  {(() => {
                    // Calculer les maximums pour chaque série
                    const maxCommandes = Math.max(...chartData.map(d => d.commandes || 0), 0);
                    const maxLeads = Math.max(...chartData.map(d => d.leads || 0), 0);
                    
                    // Calculer les domaines avec une marge de 20% minimum
                    const domainCommandes = maxCommandes === 0 
                      ? [0, 1] 
                      : [0, Math.ceil(maxCommandes * 1.2)];
                    
                    const domainLeads = maxLeads === 0 
                      ? [0, 1] 
                      : [0, Math.ceil(maxLeads * 1.2)];
                    
                    return (
                      <ComposedChart 
                        data={chartData} 
                        margin={{ top: 20, right: 15, bottom: chartData.length > 7 ? 60 : 40, left: -15 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#6B7280"
                          angle={chartData.length > 7 ? -45 : 0}
                          textAnchor={chartData.length > 7 ? "end" : "middle"}
                          height={chartData.length > 7 ? 60 : 40}
                          interval={0}
                          tick={{ fontSize: 11 }}
                          dy={chartData.length > 7 ? 10 : 5}
                        />
                        <YAxis 
                          yAxisId="left" 
                          stroke="#6B7280"
                          domain={domainCommandes}
                          allowDecimals={false}
                          tick={{ fontSize: 11 }}
                          width={30}
                          tickMargin={3}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right" 
                          stroke="#6B7280"
                          domain={domainLeads}
                          allowDecimals={false}
                          tick={{ fontSize: 11 }}
                          width={30}
                          tickMargin={3}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="line"
                          formatter={(value) => (
                            <span style={{ color: value === 'Leads' ? '#10B981' : '#3B82F6', fontWeight: 500 }}>
                              {value}
                            </span>
                          )}
                        />
                        <Bar 
                          yAxisId="left" 
                          dataKey="commandes" 
                          fill="#3B82F6" 
                          name="Commandes"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={chartData.length > 15 ? 50 : 80}
                        />
                        <Line 
                          yAxisId="right" 
                          type="monotone" 
                          dataKey="leads" 
                          stroke="#10B981" 
                          strokeWidth={3} 
                          name="Leads"
                          activeDot={{ r: 6 }}
                          dot={{ r: 3, fill: '#10B981' }}
                          connectNulls={false}
                        />
                      </ComposedChart>
                    );
                  })()}
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Breakdown - 1/3 width */}
        <Card className="rounded-2xl border-0 shadow-xl shadow-purple-500/10 bg-gradient-to-br from-white to-purple-50/30">
          <CardHeader className="pb-4 bg-gradient-to-r from-purple-50/50 to-transparent border-b border-purple-100/50 rounded-t-2xl">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              Répartition par Statut
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-2 font-medium">Distribution Leads & Commandes</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-8">
                <div className="h-[180px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#10B981]"></div>
                </div>
                <div className="h-[180px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#10B981]"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Leads Status */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Leads</h4>
                  {leadsStatusBreakdown.length > 0 ? (
                    <>
                      <div style={{ width: '100%', height: 150 }}>
                        <ResponsiveContainer>
                          <RechartsPieChart>
                            <Pie
                              data={leadsStatusBreakdown}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                              outerRadius={60}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {leadsStatusBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 space-y-1">
                        {leadsStatusBreakdown.map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-slate-600 capitalize">{item.name.replace('_', ' ')}</span>
                            </div>
                            <span className="font-semibold text-slate-900">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-slate-400 text-sm py-8">Aucun lead</p>
                  )}
                </div>

                {/* Orders Status */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Commandes</h4>
                  {ordersStatusBreakdown.length > 0 ? (
                    <>
                      <div style={{ width: '100%', height: 150 }}>
                        <ResponsiveContainer>
                          <RechartsPieChart>
                            <Pie
                              data={ordersStatusBreakdown}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                              outerRadius={60}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {ordersStatusBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 space-y-1">
                        {ordersStatusBreakdown.map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-slate-600 capitalize">{item.name.replace('_', ' ')}</span>
                            </div>
                            <span className="font-semibold text-slate-900">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-slate-400 text-sm py-8">Aucune commande</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

