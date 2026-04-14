import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, Calendar, CheckSquare, Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LeadOperationsSection from './LeadOperationsSection';

/**
 * Onglet Activités
 * Gestion des appels, emails, rendez-vous et tâches
 */
const TabActivites = ({ lead }) => {
  if (!lead) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Tabs defaultValue="operations" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Opérations CEE
          </TabsTrigger>
          <TabsTrigger value="appels" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Appels
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="rendez-vous" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Rendez-vous
          </TabsTrigger>
          <TabsTrigger value="taches" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Tâches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="mt-6">
          <LeadOperationsSection leadId={lead?.id} />
        </TabsContent>

        <TabsContent value="appels" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Appels</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Enregistrer un appel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center py-8">
                Fonctionnalités d'appels en cours de développement.
                <br />
                Cette section inclura l'enregistrement d'appels et l'intégration Aircall.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Emails</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Envoyer un email
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center py-8">
                Thread d'emails en cours de développement.
                <br />
                Cette section inclura l'envoi d'emails, le suivi des ouvertures et les templates.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rendez-vous" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Rendez-vous</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Planifier un rendez-vous
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center py-8">
                Calendrier en cours de développement.
                <br />
                Cette section inclura l'intégration calendrier et la gestion des rendez-vous.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taches" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tâches</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une tâche
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center py-8">
                Gestion des tâches en cours de développement.
                <br />
                Cette section inclura la création, l'assignation et le suivi des tâches.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default TabActivites;

