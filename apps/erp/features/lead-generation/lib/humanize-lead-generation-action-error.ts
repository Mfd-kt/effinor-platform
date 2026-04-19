/**
 * Messages utilisateur pour les actions lead-generation (serveur + client).
 * Évite d’exposer SQL, RPC ou détails techniques bruts.
 */
export function humanizeLeadGenerationActionError(raw: string): string {
  const t = raw.trim();
  if (!t) {
    return "Une erreur inattendue s’est produite. Réessayez dans un instant.";
  }
  const lower = t.toLowerCase();

  if (t.includes("Accès réservé")) {
    return "Vous n’avez pas les droits pour cette action. Contactez un administrateur.";
  }

  if (
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("failed to fetch") ||
    lower.includes("econnrefused") ||
    lower.includes("networkerror") ||
    lower.includes("load failed")
  ) {
    return "Problème de connexion, réessayez.";
  }
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("deadline")) {
    return "Le traitement a pris trop de temps, réessayez.";
  }
  if (lower.includes("jwt") || lower.includes("session") || lower.includes("auth")) {
    return "Session expirée ou invalide. Reconnectez-vous puis réessayez.";
  }
  if (
    lower.includes("rpc") ||
    lower.includes("postgres") ||
    lower.includes("sql") ||
    lower.includes("supabase") ||
    lower.includes("pgrst")
  ) {
    return "Le service de données est momentanément indisponible. Réessayez plus tard.";
  }

  if (/^[a-f0-9-]{36}$/i.test(t) || /exception|stack trace|undefined is not/i.test(lower)) {
    return "Une erreur technique s’est produite. Si le problème persiste, contactez l’administrateur.";
  }

  if (
    lower.includes("rent a paid actor") ||
    lower.includes("free trial has expired") ||
    lower.includes("must rent") ||
    (lower.includes("apify") && lower.includes("403") && (lower.includes("rent") || lower.includes("paid")))
  ) {
    return (
      "Apify refuse de lancer l’actor (403) : essai gratuit terminé ou actor non payé sur votre compte. " +
      "Le mot anglais « rent » signifie ici **souscrire / louer l’actor** (facturation Apify), pas un filtre « lieu » ou « ville » sur la carte. " +
      "Ouvrez https://console.apify.com et vérifiez l’abonnement à cet actor."
    );
  }

  if (
    lower.includes("bad gateway") ||
    lower.includes("502") ||
    (lower.includes("apify") && (lower.includes("503") || lower.includes("504")))
  ) {
    return (
      "Apify est momentanément indisponible (502/503) ou a mis trop de temps à répondre (504). " +
      "Réessayez dans quelques minutes ; si cela continue, vérifiez le statut sur status.apify.com."
    );
  }

  if (lower.includes("<html") || lower.includes("<!doctype")) {
    return "Réponse serveur invalide (page HTML). Réessayez dans un instant ou contactez l’administrateur.";
  }

  if (t.length > 220) {
    return "Une erreur s’est produite. Réessayez ou contactez l’administrateur si cela continue.";
  }

  return t;
}
