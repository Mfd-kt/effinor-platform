# Guide d'utilisation du tracking d'événements

## Vue d'ensemble

Le système de tracking d'événements permet de suivre finement le parcours des visiteurs avec deux tables :
- `visiteurs` : 1 ligne par session (qui, quand, quelle page actuelle, statut…)
- `visites_events` : 1 ligne par événement (vue de page, scroll profond, clic sur CTA, conversion…)

## Fonctions disponibles

### `logVisitEvent(params)`

Log un événement dans la table `visites_events`.

**Paramètres :**
- `event_type` (string, optionnel) : Type d'événement (défaut: 'page_view')
- `page` (string, optionnel) : URL de la page (défaut: window.location.pathname)
- `page_title` (string, optionnel) : Titre de la page (défaut: document.title)
- `referrer` (string, optionnel) : Referrer (défaut: document.referrer)
- `scroll_pct` (number, optionnel) : Pourcentage de scroll (0-100)
- `time_on_page_ms` (number, optionnel) : Temps passé sur la page en millisecondes
- `extra` (object, optionnel) : Données supplémentaires (ex: { cta_id: 'hero_devis' })

### `trackConversion(eventType, eventData)`

Marque une conversion et log un événement de conversion.

**Paramètres :**
- `eventType` (string, optionnel) : Type de conversion (défaut: 'conversion')
- `eventData` (object, optionnel) : Données de la conversion

## Exemples d'utilisation

### 1. Tracking automatique de page_view

Le tracking de `page_view` est automatique via le composant `TrackingWrapper` dans `App.jsx`. Aucune action nécessaire.

### 2. Tracking de scroll profond

Le tracking de scroll profond (75%+) est automatique via le hook `useScrollTracking`. Aucune action nécessaire.

### 3. Tracker un clic sur un CTA

```jsx
import { logVisitEvent } from '@/lib/visitorTracker';

function HeroSection() {
  const handleCTAClick = () => {
    // Logger l'événement
    logVisitEvent({
      event_type: 'click_cta',
      extra: { cta_id: 'hero_demande_devis' },
    });
    
    // Comportement normal (scroll vers formulaire, etc.)
    // ...
  };

  return (
    <Button onClick={handleCTAClick}>
      Obtenir mon estimation gratuite
    </Button>
  );
}
```

### 4. Tracker une soumission de formulaire

```jsx
import { trackConversion } from '@/lib/visitorTracker';

function CEEEligibilityForm() {
  const handleSubmit = async (formData) => {
    // ... validation et soumission ...
    
    // Logger la conversion
    await trackConversion('form_submit', {
      form_type: 'cee_eligibility',
      step: 6,
    });
  };
}
```

### 5. Tracker un téléchargement de document

```jsx
import { logVisitEvent } from '@/lib/visitorTracker';

function RessourcesPage() {
  const handleDownload = (documentId, documentName) => {
    logVisitEvent({
      event_type: 'download',
      extra: {
        document_id: documentId,
        document_name: documentName,
      },
    });
    
    // Télécharger le document
    // ...
  };
}
```

### 6. Tracker un clic sur un lien externe

```jsx
import { logVisitEvent } from '@/lib/visitorTracker';

function ExternalLink({ href, children }) {
  const handleClick = () => {
    logVisitEvent({
      event_type: 'click_external_link',
      extra: {
        url: href,
      },
    });
  };

  return (
    <a href={href} onClick={handleClick} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
```

## Types d'événements recommandés

- `page_view` : Vue de page (automatique)
- `scroll_deep` : Scroll profond 75%+ (automatique)
- `click_cta` : Clic sur un CTA
- `click_button` : Clic sur un bouton spécifique
- `form_start` : Début de remplissage d'un formulaire
- `form_submit` : Soumission d'un formulaire
- `conversion` : Conversion (lead, achat, etc.)
- `download` : Téléchargement de document
- `click_external_link` : Clic sur un lien externe
- `video_play` : Lecture d'une vidéo
- `video_complete` : Vidéo terminée

## Requêtes SQL utiles

### Parcours complet d'un visiteur

```sql
SELECT 
  page,
  event_type,
  created_at,
  scroll_pct,
  extra
FROM visites_events
WHERE visiteur_id = 'uuid-du-visiteur'
ORDER BY created_at ASC;
```

### CTA les plus cliqués

```sql
SELECT 
  extra->>'cta_id' as cta_id,
  COUNT(*) as clicks
FROM visites_events
WHERE event_type = 'click_cta'
GROUP BY extra->>'cta_id'
ORDER BY clicks DESC;
```

### Pages avec le plus de scrolls profonds

```sql
SELECT 
  page,
  COUNT(*) as deep_scrolls
FROM visites_events
WHERE event_type = 'scroll_deep'
GROUP BY page
ORDER BY deep_scrolls DESC;
```

### Taux de conversion par source

```sql
SELECT 
  v.utm_source,
  COUNT(DISTINCT v.id) as visitors,
  COUNT(DISTINCT CASE WHEN v.a_converti THEN v.id END) as conversions,
  ROUND(
    COUNT(DISTINCT CASE WHEN v.a_converti THEN v.id END)::numeric / 
    NULLIF(COUNT(DISTINCT v.id), 0) * 100, 
    2
  ) as conversion_rate
FROM visiteurs v
WHERE v.utm_source IS NOT NULL
GROUP BY v.utm_source
ORDER BY conversion_rate DESC;
```

