/**
 * measure.js — collect real, observable signals for a deployed site.
 * No secrets needed for public signals; GitHub API uses the token if present
 * (read-only) but degrades gracefully without it.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

function get(url, headers = {}) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'website-automation', ...headers }, timeout: 8000 }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body, ok: res.statusCode >= 200 && res.statusCode < 400 }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: '', ok: false, timeout: true }); });
    req.on('error', () => resolve({ status: 0, body: '', ok: false }));
  });
}

function ghApi(path, token) {
  const h = { 'User-Agent': 'website-automation', Accept: 'application/vnd.github+json' };
  if (token) h['Authorization'] = `token ${token}`;
  return get('https://api.github.com' + path, h);
}

/** Local SEO/content audit from a site folder. */
function auditLocal(sitePath) {
  const out = { posts: 0, emptyTitle: false, emptyDesc: false, hasJsonLd: false, sitemapValid: false, cssSizeKb: 0 };
  try {
    const dataPath = path.join(sitePath, 'input-data.json');
    if (fs.existsSync(dataPath)) {
      const posts = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      out.posts = Array.isArray(posts) ? posts.length : 0;
    }
    const idx = path.join(sitePath, 'index.html');
    if (fs.existsSync(idx)) {
      const t = fs.readFileSync(idx, 'utf8');
      out.emptyTitle = /<title>\s*<\/title>/.test(t);
      out.emptyDesc = /<meta name="description" content="">/.test(t);
      out.hasJsonLd = t.includes('application/ld+json');
    }
    const css = path.join(sitePath, 'assets/css/style.css');
    if (fs.existsSync(css)) out.cssSizeKb = Math.round(fs.statSync(css).size / 1024);
    const sm = path.join(sitePath, 'sitemap.xml');
    if (fs.existsSync(sm)) out.sitemapValid = fs.readFileSync(sm, 'utf8').includes('<urlset');
  } catch (e) { out.error = e.message; }
  return out;
}

/** Public signals: Pages reachability + GitHub stars (optional token). */
async function measureSite({ sitePath, repo, username, token, url }) {
  const local = auditLocal(sitePath);
  const live = url ? await get(url) : { ok: false, status: 0 };
  const gh = (repo && username) ? await ghApi(`/repos/${username}/${repo}`, token) : { ok: false };
  let stars = 0;
  if (gh.ok) { try { stars = JSON.parse(gh.body).stargazers_count || 0; } catch {} }
  return {
    timestamp: new Date().toISOString(),
    live: live.ok,
    liveStatus: live.status,
    stars,
    ...local,
  };
}

module.exports = { measureSite, auditLocal, ghApi, get };
