import React from 'react';
import { FileText, MessageSquare, Phone, File, Clock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Barre d'onglets horizontale épurée pour DetailLead
 * Style inspiré de Linear et HubSpot
 */
const LeadTabsHeader = ({ 
  activeTab, 
  onTabChange, 
  counts = {} 
}) => {
  const tabs = [
    {
      id: 'informations',
      label: 'Informations',
      icon: FileText,
      count: null
    },
    {
      id: 'notes',
      label: 'Notes & Historique',
      icon: MessageSquare,
      count: counts.notes || 0
    },
    {
      id: 'activites',
      label: 'Activités',
      icon: Phone,
      count: counts.activities || 0
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: File,
      count: counts.documents || 0
    },
    {
      id: 'historique',
      label: 'Historique',
      icon: Clock,
      count: null
    }
  ];

  return (
    <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="h-12 bg-transparent p-0 w-full justify-start rounded-none border-b-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  'h-12 px-4 py-2 rounded-none border-b-2 border-transparent',
                  'transition-all duration-200 ease-in-out',
                  'data-[state=active]:border-secondary-500 data-[state=active]:bg-transparent',
                  'data-[state=active]:text-secondary-600 data-[state=active]:shadow-none',
                  'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
                  'flex items-center gap-2 font-medium text-sm',
                  isActive && 'text-secondary-600 font-semibold'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      'ml-1 h-5 min-w-[20px] px-1.5 text-xs font-medium',
                      isActive ? 'bg-secondary-100 text-secondary-700' : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {tab.count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default LeadTabsHeader;

