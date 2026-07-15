/**
 * improve.js — the "decide + improve" rules engine.
 * Given a measurement, it picks the single weakest signal and patches it
 * (one reversible change, like the Hermes daily loop invariant).
 */
const fs = require('fs');
const path = require('path');

// Each rule: test(m) -> boolean (is this the weak spot?) + apply(sitePath, m) -> message
const RULES = [
  {
    id: 'no-posts',
    test: (m) => m.posts === 0,
    apply: (sitePath) => 'No posts — run content generator (npm run content -- <slug>)',
  },
  {
    id: 'thin-content',
    test: (m) => m.posts > 0 && m.posts < 5,
    apply: (sitePath) => 'Thin content — add 5+ original posts via content generator',
  },
  {
    id: 'empty-title',
    test: (m) => m.emptyTitle,
    apply: (sitePath) => { patchMeta(sitePath, 'title'); return 'Filled empty <title> from site-config.json'; },
  },
  {
    id: 'empty-desc',
    test: (m) => m.emptyDesc,
    apply: (sitePath) => { patchMeta(sitePath, 'description'); return 'Filled empty meta description'; },
  },
  {
    id: 'no-jsonld',
    test: (m) => !m.hasJsonLd,
    apply: (sitePath) => { addJsonLd(sitePath); return 'Added JSON-LD structured data to index.html'; },
  },
  {
    id: 'no-sitemap',
    test: (m) => !m.sitemapValid,
    apply: (sitePath) => { writeSitemap(sitePath); return 'Wrote valid sitemap.xml'; },
  },
  {
    id: 'css-bloat',
    test: (m) => m.cssSizeKb > 30,
    apply: (sitePath) => 'CSS > 30KB — minify assets/css/style.css',
  },
];

function patchMeta(sitePath, which) {
  const cfgPath = path.join(sitePath, 'site-config.json');
  if (!fs.existsSync(cfgPath)) return;
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const idx = path.join(sitePath, 'index.html');
  if (!fs.existsSync(idx)) return;
  let t = fs.readFileSync(idx, 'utf8');
  const val = which === 'title' ? cfg.siteName : cfg.description;
  if (!val) return;
  if (which === 'title') t = t.replace(/<title>\s*<\/title>/, `<title>${val}</title>`);
  else t = t.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${val}">`);
  fs.writeFileSync(idx, t);
}

function addJsonLd(sitePath) {
  const cfgPath = path.join(sitePath, 'site-config.json');
  const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};
  const idx = path.join(sitePath, 'index.html');
  if (!fs.existsSync(idx)) return;
  let t = fs.readFileSync(idx, 'utf8');
  const json = JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: cfg.siteName || '', url: cfg.url || '' });
  if (!t.includes('application/ld+json')) {
    t = t.replace('</head>', `<script type="application/ld+json">${json}</script>\n</head>`);
    fs.writeFileSync(idx, t);
  }
}

function writeSitemap(sitePath) {
  const sm = path.join(sitePath, 'sitemap.xml');
  const cfgPath = path.join(sitePath, 'site-config.json');
  const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};
  const base = (cfg.url || '').replace(/\/$/, '') || '/';
  fs.writeFileSync(sm, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${base}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n</urlset>\n`);
}

/** Decide the single weakest rule and apply it. Returns {rule, message} or null. */
function improveOnce(sitePath, m) {
  for (const r of RULES) {
    try { if (r.test(m)) { const message = r.apply(sitePath); return { rule: r.id, message }; } }
    catch (e) { return { rule: r.id, message: 'FAILED: ' + e.message }; }
  }
  return null; // nothing to improve
}

module.exports = { improveOnce, RULES };
