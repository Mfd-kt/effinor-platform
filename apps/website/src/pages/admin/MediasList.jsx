import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, Edit, Image as ImageIcon } from 'lucide-react';
import { logger } from '@/utils/logger';

const MediasList = () => {
  const { toast } = useToast();
  const [medias, setMedias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedias();
  }, []);

  const fetchMedias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medias')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedias(data || []);
    } catch (err) {
      logger.error('[MediasList] Error fetching medias:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les médias.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Médias | Effinor Admin</title>
      </Helmet>

      <div className="admin-page p-4 md:p-8">
        <div className="page-header mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🖼️ Médias</h1>
            <p className="text-gray-600 mt-1">
              Gérez votre médiathèque (images, documents)
            </p>
          </div>
          <Button className="btn-primary">
            <Upload className="mr-2 h-4 w-4" /> Uploader
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {medias.map((media) => (
              <div key={media.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {media.mime_type?.startsWith('image/') ? (
                    <img
                      src={media.url}
                      alt={media.alt_text || media.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {media.file_name || 'Sans nom'}
                  </p>
                  {media.alt_text && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {media.alt_text}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MediasList;














