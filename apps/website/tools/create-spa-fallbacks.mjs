/**
 * Create SPA deep-link fallbacks for hosts where we can't rely on rewrites (.htaccess / nginx rules).
 *
 * Problem:
 * - With BrowserRouter, direct hits to /login, /dashboard, /auth/callback, ... need server rewrite to /index.html.
 * - Some FTP/shared hosts ignore/strip dotfiles or don't allow rewrites.
 *
 * Mitigation:
 * - After `vite build`, copy `dist/index.html` into route directories so the server can serve
 *   `/login/index.html`, `/dashboard/index.html`, `/auth/callback/index.html`, etc.
 * - Also create `dist/404.html` (some hosts use it automatically for 404s).
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist');
const distIndexPath = path.join(distDir, 'index.html');

const ROUTE_DIRS = [
  'login',
  'dashboard',
  'signup',
  'reset-password',
  'auth/callback',
];

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(distDir))) {
    throw new Error(`[create-spa-fallbacks] dist/ not found at: ${distDir}`);
  }
  if (!(await exists(distIndexPath))) {
    throw new Error(`[create-spa-fallbacks] dist/index.html not found at: ${distIndexPath}`);
  }

  const indexHtml = await fs.readFile(distIndexPath, 'utf8');

  // 404 fallback (if host supports it by convention)
  await fs.writeFile(path.join(distDir, '404.html'), indexHtml, 'utf8');

  // Deep-link fallbacks
  for (const route of ROUTE_DIRS) {
    const targetDir = path.join(distDir, ...route.split('/'));
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(path.join(targetDir, 'index.html'), indexHtml, 'utf8');
  }

  // eslint-disable-next-line no-console
  console.log(
    `[create-spa-fallbacks] Wrote 404.html + ${ROUTE_DIRS.length} route fallbacks into dist/`
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

