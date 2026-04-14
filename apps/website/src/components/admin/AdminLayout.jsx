import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Layout admin avec protection d'authentification
 * 
 * Vérifie que l'utilisateur est authentifié avant d'afficher le layout.
 * Redirige vers /login si non authentifié.
 */
const AdminLayout = ({ children }) => {
  const { isAuthenticated, loading } = useRequireAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Vérification de votre session...</p>
        </div>
      </div>
    );
  }

  // Rediriger vers login si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-x-hidden w-full lg:ml-64">
        {/* Header avec notifications */}
        <header className="bg-gray-900 border-b border-gray-700 pl-0 pr-4 md:pr-6 py-4 flex items-center sticky top-0 z-20">
          {/* Bouton menu mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-white hover:bg-gray-800 mr-auto"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="ml-auto">
            <AdminHeader />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto lg:pl-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;