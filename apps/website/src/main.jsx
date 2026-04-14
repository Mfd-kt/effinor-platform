import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { BannerProvider } from '@/contexts/BannerContext';
import AuthErrorBoundary from '@/components/admin/AuthErrorBoundary';
import '@/index.css';
import { bootstrapEffinorAnalyticsListeners } from '@/lib/effinorAnalytics';

bootstrapEffinorAnalyticsListeners();

// Wrapper component to pass user from AuthContext to UserProvider
const AppWithUser = () => {
  const { user } = useAuth();
  return (
    <AuthErrorBoundary>
      <UserProvider user={user}>
        <NotificationsProvider>
          <CartProvider>
            <BannerProvider>
              <App />
            </BannerProvider>
          </CartProvider>
        </NotificationsProvider>
      </UserProvider>
    </AuthErrorBoundary>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <BrowserRouter>
      <AuthProvider>
        <AppWithUser />
      </AuthProvider>
    </BrowserRouter>
  </>
);