// src/components/admin/visitors/TopPagesCard.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Link as LinkIcon } from 'lucide-react';

export const TopPagesCard = ({ topPages }) => {
  if (!topPages || topPages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pages les plus visitées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-0 shadow-xl shadow-indigo-500/10 bg-gradient-to-br from-white to-indigo-50/30">
      <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-indigo-100/50">
        <CardTitle className="text-xl flex items-center gap-3 text-gray-900 font-bold">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          Pages les plus visitées
        </CardTitle>
        <p className="text-xs text-gray-600 mt-2 font-medium">
          Top {topPages.length} des pages les plus consultées
        </p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          {topPages.map((item, index) => (
            <div
              key={item.page}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/30 transition-all duration-200 border border-transparent hover:border-indigo-200/50 hover:shadow-md group"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shadow-md transition-transform group-hover:scale-110 ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-yellow-500/30' :
                  index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-gray-500/30' :
                  index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-orange-500/30' :
                  'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 shadow-indigo-500/20'
                }`}>
                  {index + 1}
                </div>
                <LinkIcon className="h-4 w-4 text-indigo-400 flex-shrink-0 group-hover:text-indigo-600 transition-colors" />
                <span 
                  className="font-mono text-sm text-gray-800 truncate font-semibold group-hover:text-indigo-900 transition-colors" 
                  title={item.page}
                >
                  {item.page || '/'}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <Badge variant="secondary" className="text-xs font-bold px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-0 shadow-sm">
                  {item.count}
                </Badge>
                <span className="text-xs text-indigo-600 font-bold w-12 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

