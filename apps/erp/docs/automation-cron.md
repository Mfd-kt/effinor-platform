# Cron Automation — Effinor ERP (Dokploy / HTTP)

Ce document décrit le **job HTTP** qui exécute `runAutomationTick()` : notifications **Slack intelligentes** (alertes cockpit), avec journal dans `automation_logs` et déduplication.

Les **assignations automatiques** (confirmateur / closer) et les **relances IA** ne passent **pas** par ce cron : elles sont déclenchées **à la volée** lors des transitions workflow. Le JSON du cron expose `assignmentsPerformed: 0` et `aiDraftsGenerated: 0` pour la lisibilité ; des jobs batch pourront les enrichir plus tard.

---

## A. Variables d’environnement requises (production)

| Variable | Obligatoire | Rôle |
|----------|-------------|------|
| **`AUTOMATION_CRON_SECRET`** | **Oui** (recommandé) | Secret partagé avec le cron Dokploy (`Bearer`). Prioritaire sur `CRON_SECRET`. |
| `CRON_SECRET` | Non | Fallback si `AUTOMATION_CRON_SECRET` est absent (compatibilité). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Oui** (déjà requis ailleurs) | Le tick utilise `createAdminClient()` pour charger les alertes et écrire `automation_logs`. |
| `APP_URL` ou `NEXT_PUBLIC_APP_URL` | Fortement recommandé | Liens absolus dans les messages Slack. |

### Automatisation métier (comportement du tick)

| Variable | Défaut prod recommandé | Description |
|----------|-------------------------|-------------|
| `AUTOMATION_SLACK_SMART_ENABLED` | `true` (après validation) | Active l’envoi Slack « intelligent ». **`false`** = aucun envoi Slack depuis le tick (skipped côté logique). |
| `AUTOMATION_SLACK_MIN_IMPACT_EUR` | `5000` | Seuil € pour certaines alertes warning. |
| `AUTOMATION_SLACK_DEDUPE_WINDOW_MS` | `14400000` (4 h) | Fenêtre anti-doublon par alerte / jour. |
| `AUTOMATION_AUTO_ASSIGN_CONFIRMATEUR` | `true` | N’affecte **pas** le cron ; uniquement les actions workflow. Documenté pour cohérence env. |
| `AUTOMATION_AUTO_ASSIGN_CLOSER` | `true` | Idem. |
| `AUTOMATION_AI_FOLLOWUP_DRAFT_ONLY` | `true` | Idem (relances IA hors tick par défaut). |
| `AUTOMATION_AI_FOLLOWUP_AUTO_SEND` | **`false`** | Ne pas activer tant que l’envoi email n’est pas validé juridiquement / métier. |

> **Nommage** : les variables réelles sont `AUTOMATION_AUTO_ASSIGN_CONFIRMATEUR` et `AUTOMATION_AUTO_ASSIGN_CLOSER` (pas de suffixe `_ENABLED`).

### Slack (webhooks)

Sans webhooks valides, les envois sont **skipped** (comme le reste de l’app). Voir `.env.local.example` : `SLACK_ENABLED`, `SLACK_DEFAULT_WEBHOOK_URL`, `SLACK_ALERTS_WEBHOOK_URL`, etc.

---

## B. URL du cron

Remplacez par votre domaine public HTTPS :

```text
https://erp.effinor.app/api/cron/automation
```

---

## C. Header HTTP (obligatoire)

```http
Authorization: Bearer <AUTOMATION_CRON_SECRET>
```

La valeur après `Bearer ` doit être **exactement** celle de `AUTOMATION_CRON_SECRET` (ou de `CRON_SECRET` si vous utilisez le fallback).

**Méthodes** : `GET` et `POST` sont supportées (même logique).

---

## D. Fréquence recommandée

| Phase | Intervalle | Remarque |
|-------|------------|----------|
| Démarrage | **15 minutes** | Bon compromis charge / réactivité avec la dédup 4 h. |
| Plus réactif | 5 minutes | Acceptable si volume d’alertes maîtrisé. |
| Éviter | &lt; 2 minutes | Risque de bruit inutile ; la dédup limite les doublons mais augmente quand même le travail serveur. |

---

## E. Exemple de configuration Dokploy (cron / HTTP)

1. **Environment** : définir `AUTOMATION_CRON_SECRET` (ex. `openssl rand -hex 32`) et les variables Slack / Supabase.
2. Créer une tâche planifiée qui appelle l’URL ci-dessus avec la méthode **GET** ou **POST**.
3. Headers : `Authorization: Bearer <la même valeur que AUTOMATION_CRON_SECRET>`.

Exemple de corps de requête si l’UI impose POST sans body : laisser vide ; seul le header compte.

---

## F. Réponses JSON

### Succès (HTTP 200)

Champs utiles :

- `success` : `true` si le chargement des alertes a réussi (même si certains envois Slack ont échoué).
- `executedAt` : horodatage ISO.
- `summary` : synthèse une ligne (métriques + durée).
- `durationMs`
- `slack` : `alertsLoaded`, `eligible`, `sent`, `skipped`, `failed`
- `errorsCount` : erreurs partielles pendant les envois (une alerte ne bloque pas les suivantes).
- `loadError` : `null` si OK.
- `configSnapshot` : booleans **non sensibles** (pas de secrets).

### Échec chargement alertes (HTTP 500)

`success: false`, `loadError` renseigné, détail dans `summary`.

### Non configuré (HTTP 503)

Secret cron absent côté serveur : définir `AUTOMATION_CRON_SECRET` (ou `CRON_SECRET`).

### Non autorisé (HTTP 401)

Header `Authorization` manquant ou ne correspondant pas au secret.

### Erreur serveur inattendue (HTTP 500)

Message générique côté client ; détail dans les **logs serveur** uniquement.

---

## G. Garde-fous (sécurité & exploitation)

| Garde-fou | Comportement |
|-----------|----------------|
| Secret obligatoire | Sans `AUTOMATION_CRON_SECRET` / `CRON_SECRET`, réponse **503** — pas d’exécution anonyme. |
| Bearer obligatoire | Sans header correct, **401** — pas de fuite sur la validité du secret (message unique). |
| Pas de fuite | Les réponses d’erreur ne contiennent pas de stack trace ni de secrets. |
| Idempotence Slack | Déduplication via `automation_logs` + clé `slack-smart:…` (voir code). |
| Échec partiel | Une erreur sur une alerte n’arrête pas le traitement des suivantes ; `errorsCount` incrémenté. |
| Timeout route | `maxDuration = 120` s (Vercel / adapté selon hébergeur). |
| Relance IA auto | Si `AUTOMATION_AI_FOLLOWUP_AUTO_SEND=false`, le code métier n’envoie pas d’email auto (hors scope tick actuel). |
| Spam Slack | Si `AUTOMATION_SLACK_SMART_ENABLED=false`, pas d’envoi depuis les règles du tick. |

---

## H. Test manuel

### 1. Appel curl (GET)

```bash
curl -sS -X GET "https://erp.effinor.app/api/cron/automation" \
  -H "Authorization: Bearer VOTRE_AUTOMATION_CRON_SECRET" \
  -H "Accept: application/json"
```

### 2. Appel curl (POST)

```bash
curl -sS -X POST "https://erp.effinor.app/api/cron/automation" \
  -H "Authorization: Bearer VOTRE_AUTOMATION_CRON_SECRET" \
  -H "Accept: application/json"
```

### 3. Vérifier le JSON

- `success`, `summary`, `durationMs`
- `slack.sent` / `skipped` / `failed`
- `errorsCount` à 0 en nominal

### 4. Logs serveur

Dans Dokploy : logs du conteneur Next.js — préfixe `[automation]` ou `[cron/automation]`.

### 5. Valider Slack

- Canal attendu selon le type d’alerte (ex. `alerts`, `direction`, `commercial`).
- Table Supabase `notification_logs` (provider slack) et `automation_logs` (`automation_type = slack_smart_alert`).

### 6. Valider assignation / relance IA via le cron

**Non applicable** dans l’implémentation actuelle du tick : tester plutôt un envoi agent → confirmateur (assignation auto) ou un flux closer (relance / brouillon selon feature branchée).

---

## I. Cron synchronisation emails leads (Gmail)

Les emails ne sont plus rafraîchis **en boucle** depuis le navigateur sur la fiche lead. Une tâche HTTP dédiée synchronise **en tâche de fond** les leads qui ont une adresse email (les plus récemment mis à jour en premier, jusqu’à une limite configurable).

| Élément | Détail |
|--------|--------|
| **URL** | `https://<votre-domaine-erp>/api/cron/lead-email-sync` |
| **Auth** | Identique au cron automation : `Authorization: Bearer <AUTOMATION_CRON_SECRET>` (ou `CRON_SECRET`). |
| **Prérequis** | `GMAIL_USER` + credentials Gmail déjà utilisés par `syncLeadEmails`. |
| **Variable optionnelle** | `LEAD_EMAIL_SYNC_CRON_MAX_LEADS` — nombre max de leads traités par exécution (défaut **120**, plafonné à **500**). |
| **Fréquence suggérée** |5 à 15 minutes selon volume (chaque lead déclenche un aller-retour IMAP). |
| **Dokploy (commande dans le conteneur)** | Si la planification exécute `curl` via `docker exec` dans l’image ERP, **`curl` est installé** dans `Dockerfile.erp` (stage `runner`). Remplacez tout placeholder du Bearer par la **vraie** valeur du secret. |

Exemple :

```bash
curl -sS -X GET "https://erp.effinor.app/api/cron/lead-email-sync" \
  -H "Authorization: Bearer VOTRE_AUTOMATION_CRON_SECRET"
```

Réponse JSON typique (`success: true`) : `leadsEligible`, `syncOk`, `syncFailed`, `totalNewEmails`, `totalAttachments`, `errors` (échantillon). Sans secret configuré : **503** ; sans `GMAIL_USER` : **503** avec message explicite.

---

## J. Référence code

- Route automation : `app/api/cron/automation/route.ts`
- Route sync emails : `app/api/cron/lead-email-sync/route.ts`
- Tick : `features/automation/actions/run-automation-tick.ts`
- Lot sync emails : `features/leads/services/run-lead-email-sync-cron.ts`
- Secret : `features/automation/domain/cron-auth.ts`

Voir aussi : [Déploiement Dokploy](./deployment-dokploy.md) (variables globales, `APP_URL`, etc.).
