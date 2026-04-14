# 🚀 Guide de Déploiement de l'Edge Function Sirene

## ⚠️ Important : Exécuter depuis le répertoire du projet

Vous devez être dans le répertoire du projet (`ecps-effinor`) pour déployer l'Edge Function.

## 📋 Étapes de déploiement

### 1. Naviguer dans le répertoire du projet

```bash
cd ~/Projects/ecps-effinor
# ou si vous êtes déjà ailleurs
cd /Users/mfd/Projects/ecps-effinor
```

### 2. Vérifier que vous êtes dans le bon répertoire

```bash
pwd
# Devrait afficher : /Users/mfd/Projects/ecps-effinor

ls supabase/functions/fetch-sirene-data/
# Devrait afficher : index.ts
```

### 3. Vérifier que Supabase CLI est installé

```bash
supabase --version
```

### 4. Se connecter à Supabase (si pas déjà fait)

```bash
supabase login
```

### 5. Lier le projet (si pas déjà fait)

```bash
supabase link --project-ref erjgptxkctrfszrzhoxa
```

### 6. Déployer l'Edge Function

```bash
supabase functions deploy fetch-sirene-data
```

## ⚠️ Note sur Docker

Le warning "Docker is not running" n'est **pas un problème** pour le déploiement. Docker n'est nécessaire que pour le développement local, pas pour le déploiement en production.

## ✅ Vérification après déploiement

1. Allez dans votre Supabase Dashboard
2. Naviguez vers **Functions** > **fetch-sirene-data**
3. Vous devriez voir la fonction déployée

## 🔍 Dépannage

### Erreur "Entrypoint path does not exist"
→ Vous n'êtes pas dans le bon répertoire. Utilisez `cd ~/Projects/ecps-effinor` d'abord.

### Erreur "Docker is not running"
→ Ce n'est pas un problème pour le déploiement. Vous pouvez ignorer ce warning.

### Erreur "Project not linked"
→ Exécutez `supabase link --project-ref erjgptxkctrfszrzhoxa` d'abord.

## 📝 Commandes complètes

```bash
# Depuis votre home directory
cd ~/Projects/ecps-effinor

# Vérifier que le fichier existe
ls supabase/functions/fetch-sirene-data/index.ts

# Lier le projet (si pas déjà fait)
supabase link --project-ref erjgptxkctrfszrzhoxa

# Déployer
supabase functions deploy fetch-sirene-data
```

