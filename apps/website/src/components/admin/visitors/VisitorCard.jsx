// src/components/admin/visitors/VisitorCard.jsx
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Monitor,
  Smartphone,
  Tablet,
  User,
  Clock,
  Timer,
  Link as LinkIcon,
  FileText,
  Calendar,
  Globe,
  MapPin,
} from 'lucide-react';
import { formatTimeAgo, formatDuration, parseUserAgent, getSourceLabel, anonymizeIP } from '@/utils/visitorUtils';

const DeviceIcon = ({ device }) => {
  const iconProps = { className: 'h-5 w-5 text-gray-600' };
  switch (device) {
    case 'mobile':
      return <Smartphone {...iconProps} />;
    case 'tablet':
      return <Tablet {...iconProps} />;
    default:
      return <Monitor {...iconProps} />;
  }
};

export const VisitorCard = ({ visitor, anonymizeIPs = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isOnline = visitor.statut === 'active' || visitor.is_online;
  const userAgentInfo = parseUserAgent(visitor.navigateur || visitor.user_agent);
  const source = getSourceLabel(visitor);
  const displayIP = anonymizeIP(visitor.ip_address || visitor.ip, anonymizeIPs);
  const pagesViews = visitor.nombre_pages_vues || 0;
  const os = visitor.os || (userAgentInfo && userAgentInfo.os) || 'N/A';
  const arrivalDate = visitor.created_at 
    ? new Date(visitor.created_at).toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'N/A';
  
  // Extraire l'historique depuis le parcours si disponible
  let pageHistory = [];
  if (visitor.parcours) {
    try {
      const parsed = typeof visitor.parcours === 'string' 
        ? JSON.parse(visitor.parcours) 
        : visitor.parcours;
      if (Array.isArray(parsed)) {
        pageHistory = parsed.map((page, index) => ({
          page,
          timestamp: visitor.created_at, // Approximation, on pourrait améliorer avec visites_events
          index,
        }));
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  // Format heure exacte
  const lastSeenTime = visitor.last_seen || visitor.derniere_activite || visitor.last_seen_at;
  const exactTime = lastSeenTime 
    ? new Date(lastSeenTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'N/A';

  // Durée de session
  const sessionDuration = visitor.created_at 
    ? formatDuration(visitor.created_at, lastSeenTime)
    : null;

  return (
    <Card className="hover:shadow-2xl transition-all duration-300 border-0 shadow-lg shadow-gray-500/10 bg-gradient-to-br from-white to-slate-50/50 overflow-hidden group">
      <CardContent className="p-0">
        <div
          className="p-6 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-300 border-l-4 border-transparent hover:border-indigo-400"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Colonne gauche */}
            <div className="flex-1 space-y-4 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="font-bold text-gray-900 text-lg">{displayIP}</span>
                <Badge 
                  variant={isOnline ? 'success' : 'secondary'} 
                  className={`text-xs font-bold px-3 py-1 shadow-sm ${
                    isOnline 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0' 
                      : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 border-0'
                  }`}
                >
                  {isOnline ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              
              <div className="flex flex-col gap-3 pl-13">
                <div className="text-sm text-gray-700">
                  <span className="font-semibold text-gray-600">Source :</span>{' '}
                  <span className="text-gray-900 font-medium">{source || 'N/A'}</span>
                </div>
                
                <div className="text-sm">
                  <span className="font-semibold text-gray-600">Page :</span>{' '}
                  <span className="font-mono text-gray-900 bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo-200/50 shadow-sm">
                    {visitor.page_actuelle || visitor.page || '/'}
                  </span>
                </div>

                {pagesViews > 0 && (
                  <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold">
                    <FileText className="h-4 w-4" />
                    <span>{pagesViews} page{pagesViews > 1 ? 's' : ''} vue{pagesViews > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Colonne centre */}
            <div className="flex-1 space-y-3 text-sm min-w-0">
              <div className="flex items-center gap-3 text-gray-700 bg-blue-50/50 px-3 py-2 rounded-lg">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-sm">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <span className="truncate">
                  <span className="text-gray-600 font-medium">Dernière vue :</span>{' '}
                  <span className="font-bold text-gray-900">{formatTimeAgo(lastSeenTime)}</span>
                </span>
              </div>
              
              {sessionDuration && (
                <div className="flex items-center gap-3 text-gray-700 bg-purple-50/50 px-3 py-2 rounded-lg">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-sm">
                    <Timer className="h-4 w-4 text-white" />
                  </div>
                  <span>
                    <span className="text-gray-600 font-medium">Temps total :</span>{' '}
                    <span className="font-bold text-gray-900">{sessionDuration}</span>
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-sm">
                  <Calendar className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="truncate">
                  <span className="text-gray-500 font-medium">Arrivée :</span>{' '}
                  <span className="font-semibold text-gray-700">{arrivalDate}</span>
                </span>
              </div>
            </div>

            {/* Colonne droite */}
            <div className="flex-shrink-0 text-right space-y-3 min-w-[140px]">
              <div className="flex items-center justify-end gap-2.5 bg-indigo-50/50 px-3 py-2 rounded-lg">
                <DeviceIcon device={userAgentInfo.device} />
                <span className="text-sm text-gray-800 font-bold">{userAgentInfo.browser}</span>
              </div>
              
              <div className="text-xs text-gray-700 bg-slate-50 px-3 py-2 rounded-lg">
                <div className="flex items-center justify-end gap-2">
                  <MapPin className="h-4 w-4 text-indigo-500" />
                  <span className="font-bold">{os}</span>
                </div>
              </div>
              
              <div className="text-xs text-indigo-700 font-mono bg-gradient-to-r from-indigo-100 to-purple-100 px-3 py-2 rounded-lg font-bold shadow-sm border border-indigo-200/50">
                {exactTime}
              </div>
            </div>
          </div>
        </div>

        {/* Accordéon pour les détails */}
        {pageHistory.length > 0 && (
          <Accordion type="single" collapsible className="border-t">
            <AccordionItem value="history" className="border-0">
              <AccordionTrigger className="px-4 py-2 text-sm text-gray-600">
                Historique des pages ({pageHistory.length})
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {/* Détails UTM si disponibles */}
                  {(visitor.utm_source || visitor.utm_campaign || visitor.utm_medium) && (
                    <div className="bg-blue-50 rounded-md p-3 mb-3">
                      <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Paramètres UTM
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        {visitor.utm_source && (
                          <div><span className="font-medium">Source:</span> {visitor.utm_source}</div>
                        )}
                        {visitor.utm_medium && (
                          <div><span className="font-medium">Medium:</span> {visitor.utm_medium}</div>
                        )}
                        {visitor.utm_campaign && (
                          <div><span className="font-medium">Campagne:</span> {visitor.utm_campaign}</div>
                        )}
                        {visitor.utm_content && (
                          <div><span className="font-medium">Content:</span> {visitor.utm_content}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Historique des pages */}
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Historique des pages ({pageHistory.length})
                    </div>
                    <div className="space-y-2">
                      {pageHistory.map((entry, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm text-gray-600 py-1 border-b border-gray-100 last:border-0"
                        >
                          <LinkIcon className="h-3 w-3 text-gray-400" />
                          <span className="font-mono text-xs">{entry.page}</span>
                          {entry.timestamp && (
                            <span className="text-xs text-gray-400 ml-auto">
                              {new Date(entry.timestamp).toLocaleTimeString('fr-FR')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

