// src/components/admin/visitors/VisitorsHeaderStats.jsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, FileText, Clock, Globe } from 'lucide-react';
import { calculateStats } from '@/utils/visitorUtils';
import { TopPagesCard } from './TopPagesCard';

export const VisitorsHeaderStats = ({ visitors }) => {
  const stats = calculateStats(visitors);
  
  const formatAvgTime = (seconds) => {
    if (seconds < 60) return `${seconds} s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    return `${Math.floor(seconds / 3600)} h`;
  };

  return (
    <div className="space-y-8">
      {/* Header avec titre et badge en ligne */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gradient-to-r from-gray-100 to-transparent">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Suivi des Visiteurs en Temps Réel
          </h1>
          <p className="text-sm text-gray-600 mt-2 font-medium">
            Suivi en temps réel de l'activité des visiteurs sur votre site
          </p>
        </div>
        <Badge variant="success" className="text-base px-5 py-2.5 w-fit shadow-lg shadow-green-500/20 border-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold">
          <Activity className="h-4 w-4 mr-2 animate-pulse" />
          {stats.online} en ligne
        </Badge>
      </div>

      {/* Grille de KPI */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-blue-500"></div>
          Vue d'ensemble
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Visiteurs en ligne */}
        <Card className="border-0 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 bg-gradient-to-br from-white to-green-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Visiteurs en ligne</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.online}</p>
              </div>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Activity className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pages différentes */}
        <Card className="border-0 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 bg-gradient-to-br from-white to-blue-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pages différentes</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{stats.uniquePages}</p>
              </div>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <FileText className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Moyenne temps depuis dernière vue */}
        <Card className="border-0 shadow-lg shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 bg-gradient-to-br from-white to-purple-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Moyenne dernière vue</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {formatAvgTime(stats.avgTimeAgo)}
                </p>
              </div>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Clock className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Répartition des sources */}
        <Card className="border-0 shadow-lg shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 bg-gradient-to-br from-white to-orange-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Répartition sources</p>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Globe className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.sourceDistribution.slice(0, 3).map((source) => (
                <Badge key={source.name} variant="secondary" className="text-xs font-semibold px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200 text-gray-700 shadow-sm">
                  {source.name} {source.percentage}%
                </Badge>
              ))}
              {stats.sourceDistribution.length > 3 && (
                <Badge variant="outline" className="text-xs font-semibold px-3 py-1 border-gray-300 text-gray-600">
                  +{stats.sourceDistribution.length - 3}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Section Pages les plus visitées */}
      <div className="pt-8 border-t border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-indigo-500"></div>
          Analyse du trafic
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopPagesCard topPages={stats.topPages} />
        </div>
      </div>
    </div>
  );
};

