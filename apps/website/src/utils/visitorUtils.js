// src/utils/visitorUtils.js

/**
 * Formate une durée en format humain "il y a X secondes/minutes/heures"
 */
export function formatTimeAgo(timestamp) {
  if (!timestamp) return 'N/A';
  
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  
  if (diffSeconds < 60) {
    return `il y a ${diffSeconds} s`;
  } else if (diffMinutes < 60) {
    return `il y a ${diffMinutes} min`;
  } else if (diffHours < 24) {
    return `il y a ${diffHours} h`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `il y a ${diffDays} j`;
  }
}

/**
 * Formate une durée totale en minutes/heures
 */
export function formatDuration(startTimestamp, endTimestamp = null) {
  if (!startTimestamp) return 'N/A';
  
  const start = new Date(startTimestamp);
  const end = endTimestamp ? new Date(endTimestamp) : new Date();
  const diffMs = end - start;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  
  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  } else {
    const remainingMinutes = diffMinutes % 60;
    return `${diffHours}h ${remainingMinutes}min`;
  }
}

/**
 * Parse le user_agent pour extraire device et navigateur
 */
export function parseUserAgent(userAgent) {
  if (!userAgent) {
    return {
      device: 'desktop',
      deviceIcon: 'Monitor',
      browser: 'N/A',
      browserIcon: 'Globe',
      os: 'Unknown',
    };
  }

  const ua = userAgent.toLowerCase();
  
  // Device detection
  let device = 'desktop';
  let deviceIcon = 'Monitor';
  
  if (ua.includes('mobile') || ua.includes('android') || ua.match(/iphone|ipod/)) {
    device = 'mobile';
    deviceIcon = 'Smartphone';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    device = 'tablet';
    deviceIcon = 'Tablet';
  }
  
  // Browser detection
  let browser = 'Unknown';
  let browserIcon = 'Globe'; // lucide-react n'a pas d'icônes spécifiques par navigateur
  
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
  }
  
  // OS detection
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os x') || ua.includes('macintosh')) os = 'macOS';
  else if (ua.includes('linux') && !ua.includes('android')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.match(/iphone|ipad|ipod/)) os = 'iOS';
  
  return {
    device,
    deviceIcon,
    browser,
    browserIcon,
    os,
  };
}

/**
 * Détermine la source de trafic à partir des colonnes UTM et referrer
 */
export function getSourceLabel(visitor) {
  if (visitor.utm_source) {
    const source = visitor.utm_source.toLowerCase();
    if (source.includes('google')) return 'Google Ads';
    if (source.includes('meta') || source.includes('facebook')) return 'Meta Ads';
    if (source.includes('linkedin')) return 'LinkedIn';
    if (source.includes('email')) return 'Email';
    return visitor.utm_source;
  }
  
  if (visitor.referrer_url) {
    try {
      const url = new URL(visitor.referrer_url);
      const hostname = url.hostname.toLowerCase();
      
      if (hostname.includes('google')) return 'Google';
      if (hostname.includes('facebook') || hostname.includes('meta')) return 'Meta';
      if (hostname.includes('linkedin')) return 'LinkedIn';
      if (hostname.includes('twitter') || hostname.includes('x.com')) return 'Twitter/X';
      
      return hostname.replace('www.', '');
    } catch (e) {
      return visitor.referrer_url;
    }
  }
  
  return 'Accès direct';
}

/**
 * Anonymise une IP (optionnel)
 */
export function anonymizeIP(ip, shouldAnonymize = false) {
  if (!ip) return 'Visiteur anonyme';
  if (!shouldAnonymize) return ip;
  
  // Masquer les 2 derniers octets
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  return 'Visiteur anonyme';
}

/**
 * Calcule les statistiques à partir de la liste de visiteurs
 */
export function calculateStats(visitors) {
  const online = visitors.filter(v => v.statut === 'active' || v.is_online).length;
  
  // Pages uniques
  const uniquePages = new Set(visitors.map(v => v.page_actuelle).filter(Boolean));
  
  // Moyenne temps depuis dernière vue
  const now = new Date();
  const timesAgo = visitors
    .map(v => v.last_seen || v.derniere_activite)
    .filter(Boolean)
    .map(ts => (now - new Date(ts)) / 1000); // en secondes
  
  const avgTimeAgo = timesAgo.length > 0
    ? Math.round(timesAgo.reduce((a, b) => a + b, 0) / timesAgo.length)
    : 0;
  
  // Répartition des sources
  const sources = {};
  visitors.forEach(v => {
    const source = getSourceLabel(v);
    sources[source] = (sources[source] || 0) + 1;
  });
  
  const total = visitors.length;
  const sourceDistribution = Object.entries(sources)
    .map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
  
  // Pages les plus visitées
  const pageCounts = {};
  visitors.forEach(v => {
    const page = v.page_actuelle || v.page || '/';
    pageCounts[page] = (pageCounts[page] || 0) + 1;
  });
  
  const topPages = Object.entries(pageCounts)
    .map(([page, count]) => ({
      page,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10

  return {
    online,
    uniquePages: uniquePages.size,
    avgTimeAgo,
    sourceDistribution,
    topPages,
  };
}
