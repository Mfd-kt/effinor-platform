import { loadStripe } from '@stripe/stripe-js';
import { logger } from '@/utils/logger';

// Récupérer la clé publique Stripe depuis les variables d'environnement
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Initialiser Stripe avec la clé publique
// loadStripe retourne une Promise qui se résout avec l'instance Stripe
let stripePromise = null;

if (stripePublicKey) {
  stripePromise = loadStripe(stripePublicKey);
  logger.info('[Stripe Client] Stripe initialisé avec la clé publique');
} else {
  logger.warn('[Stripe Client] VITE_STRIPE_PUBLIC_KEY non définie - Stripe ne sera pas disponible');
  // Créer une Promise qui se résout avec null pour éviter les erreurs
  stripePromise = Promise.resolve(null);
}

export { stripePromise };














