/**
 * inject.js — fills a generated site with SEO metadata + Monetag zone.
 *
 * Reads site-config.json from the site folder (and accepts opts overrides)
 * and rewrites the HTML/CSS/SEO files so each cloned site is unique and
 * not "thin content" (the usual AdSense-rejection cause).
 *
 * Safe: only replaces placeholder tokens; never touches unrelated markup.
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_MONETAG = 'YOUR_MONETAG_ZONE_ID';
const DEFAULT_URL = 'https://your-domain.example.com';

function readConfig(sitePath) {
  const cfgPath = path.join(sitePath, 'site-config.json');
  try {
    return JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  } catch (e) {
    return {};
  }
}

function writeIfChanged(filePath, transform) {
  if (!fs.existsSync(filePath)) return false;
  const before = fs.readFileSync(filePath, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(filePath, after);
    return true;
  }
  return false;
}

function injectSite(sitePath, opts = {}) {
  const cfg = readConfig(sitePath);
  const name = opts.name || cfg.siteName || '';
  const description = opts.description || cfg.description || '';
  const url = opts.url || cfg.url || '';
  const monetagZone = opts.monetagZone || cfg.monetagZone || DEFAULT_MONETAG;

  const htmlFiles = ['index.html', 'post.html', 'payment.html'];
  let changed = 0;

  for (const f of htmlFiles) {
    const fp = path.join(sitePath, f);
    changed += writeIfChanged(fp, (s) => {
      if (name) {
        s = s.replace(/<title>\s*<\/title>/, `<title>${name}</title>`);
        s = s.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${name}">`);
      }
      if (description) {
        s = s.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
        s = s.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
      }
      if (url) {
        s = s.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
      }
      // Monetag zone — both the meta tag and the loader script
      s = s.replace(/<meta name="monetag" content="[^"]*">/, `<meta name="monetag" content="${monetagZone}">`);
      s = s.replace(/vemtoutcheeg\.com',\s*[^,)\s]+/, `vemtoutcheeg.com', ${monetagZone}`);
      return s;
    }) ? 1 : 0;
  }

  // robots.txt — point sitemap at the real (or placeholder) domain
  const robotsPath = path.join(sitePath, 'robots.txt');
  changed += writeIfChanged(robotsPath, (s) => {
    const sitemapUrl = url ? `${url.replace(/\/$/, '')}/sitemap.xml` : '/sitemap.xml';
    return s.replace(/Sitemap:.*/, `Sitemap: ${sitemapUrl}`);
  }) ? 1 : 0;

  // sitemap.xml — replace placeholder domain in <loc> entries
  const smPath = path.join(sitePath, 'sitemap.xml');
  const sitemapDomain = url || DEFAULT_URL;
  changed += writeIfChanged(smPath, (s) => {
    return s.replace(/https?:\/\/test\.sproutern\.com/g, sitemapDomain.replace(/\/$/, ''));
  }) ? 1 : 0;

  return changed;
}

module.exports = { injectSite, DEFAULT_MONETAG, DEFAULT_URL };
