/**
 * Réécrit les liens internes obsolètes dans le contenu d’articles (texte ou HTML léger).
 */
export function rewriteLegacyBlogLinks(content) {
  if (content == null || typeof content !== 'string') return content;

  let out = content;

  out = out.replace(/href=(['"])\/produits-solutions[^'"]*\1/gi, 'href=$1/pompe-a-chaleur$1');
  out = out.replace(/href=(['"])\/landing\/luminaires\/?\1/gi, 'href=$1/$1');
  out = out.replace(/href=(['"])\/produit\/[^'"]+\1/gi, 'href=$1/pompe-a-chaleur$1');

  out = out.replace(/(^|[\s"'(>])\/produits-solutions[^\s"'<)]*/g, '$1/pompe-a-chaleur');
  out = out.replace(/(^|[\s"'(>])\/landing\/luminaires[^\s"'<)]*/g, '$1/');
  out = out.replace(/(^|[\s"'(>])\/produit\/[^\s"'<)]+/g, '$1/pompe-a-chaleur');

  out = out.replace(/https?:\/\/[^\s\])"'<>]+/gi, (url) => {
    try {
      const u = new URL(url);
      if (u.pathname === '/produits-solutions' || u.pathname.startsWith('/produits-solutions/')) {
        u.pathname = '/pompe-a-chaleur';
        u.search = '';
        return u.toString();
      }
      if (u.pathname.startsWith('/landing/luminaires')) {
        u.pathname = '/';
        u.search = '';
        return u.toString();
      }
      if (u.pathname.startsWith('/produit/')) {
        u.pathname = '/pompe-a-chaleur';
        u.search = '';
        return u.toString();
      }
    } catch {
      /* ignore invalid URL */
    }
    return url;
  });

  return out;
}
