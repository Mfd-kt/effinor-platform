import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import ActivityItem from './ActivityItem';
import { getLeadTimeline } from '@/lib/api/leads';
import { format, isToday, isYesterday, isSameDay, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/**
 * Timeline moderne avec feed, groupement par jour, scroll virtuel, animations
 */
const Timeline = ({ leadId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedActivities, setGroupedActivities] = useState({});

  // Load timeline
  useEffect(() => {
    const loadTimeline = async () => {
      if (!leadId) return;
      setLoading(true);
      try {
        const result = await getLeadTimeline(leadId);
        if (result.success) {
          setActivities(result.data || []);
        }
      } catch (error) {
        console.error('Error loading timeline:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTimeline();
  }, [leadId]);

  // Group activities by day
  useEffect(() => {
    const grouped = {};
    
    activities.forEach((activity) => {
      const date = new Date(activity.timestamp || activity.created_at);
      let key;
      
      if (isToday(date)) {
        key = 'Aujourd\'hui';
      } else if (isYesterday(date)) {
        key = 'Hier';
      } else if (isSameDay(date, subDays(new Date(), 2))) {
        key = format(date, 'EEEE', { locale: fr });
      } else {
        key = format(date, 'dd MMMM yyyy', { locale: fr });
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(activity);
    });

    setGroupedActivities(grouped);
  }, [activities]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">Aucune activité</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedActivities).map(([dateKey, dayActivities], groupIndex) => (
        <motion.div
          key={dateKey}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIndex * 0.1 }}
        >
          {/* Date Header */}
          <div className="sticky top-0 z-10 bg-white py-2 mb-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 capitalize">
              {dateKey}
            </h3>
          </div>

          {/* Activities */}
          <div className="space-y-1">
            <AnimatePresence>
              {dayActivities.map((activity, index) => (
                <ActivityItem
                  key={activity.id || index}
                  activity={activity}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}

      {/* Load More Button (if needed) */}
      {activities.length >= 20 && (
        <div className="text-center pt-4">
          <button className="text-sm text-sky-500 hover:text-sky-600">
            Charger plus
          </button>
        </div>
      )}
    </div>
  );
};

export default Timeline;



























