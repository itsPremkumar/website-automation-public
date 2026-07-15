/**
 * self-improve.js — the autonomous daily loop (Hermes-style).
 * For each site in niches.js:
 *   measure -> decide (weakest rule) -> improve (one change) ->
 *   deploy -> verify -> append IMPROVEMENT_LOG.md
 * Invariant: exactly ONE reversible change per run.
 *
 * Run: node self-improve.js   (or via cron: 0 3 * * *)
 */
const fs = require('fs');
const path = require('path');
const { measureSite } = require('./lib/measure');
const { improveOnce } = require('./lib/improve');
const deploySingle = require('./deploy-single-site');
const niches = require('./niches');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const token = process.env.GITHUB_TOKEN;
const username = process.env.GITHUB_USERNAME;
const sitesDir = path.resolve(process.env.SITES_DIR || path.join(__dirname, 'sites'));

async function runSite(niche) {
  const sitePath = path.join(sitesDir, niche.slug);
  if (!fs.existsSync(sitePath)) {
    console.warn(`⚠️  skip ${niche.slug} (no folder)`); return;
  }
  console.log(`\n🔍 ${niche.name} (${niche.slug})`);

  const repo = niche.repo || niche.slug;
  const cfgPath = path.join(sitePath, 'site-config.json');
  const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};
  const url = cfg.url || `https://${username}.github.io/${repo}/`;

  const m = await measureSite({ sitePath, repo, username, token, url });
  console.log(`   live:${m.live ? '🟢' : '🔴'} posts:${m.posts} title:${m.emptyTitle ? 'empty' : 'ok'} desc:${m.emptyDesc ? 'empty' : 'ok'} jsonld:${m.hasJsonLd ? 'yes' : 'no'} sitemap:${m.sitemapValid ? 'yes' : 'no'}`);

  const change = improveOnce(sitePath, m);
  if (!change) { console.log('   ✨ nothing to improve — already healthy'); return; }

  console.log(`   🛠️  [${change.rule}] ${change.message}`);
  try {
    if (!token || !username) {
      console.log('   ⏭️  deploy skipped (no GITHUB_TOKEN in .env) — change applied locally');
    } else {
      await deploySingle(niche.slug, repo);
    }
    appendLog(niche.slug, change, m);
    console.log('   ✓ change applied + logged');
  } catch (e) {
    console.error('   ❌ deploy failed:', e.message);
  }
}

function appendLog(slug, change, m) {
  const logPath = path.join(sitesDir, slug, 'IMPROVEMENT_LOG.md');
  const line = `- ${new Date().toISOString()} | ${change.rule} | ${change.message} | live:${m.live}\n`;
  fs.appendFileSync(logPath, line);
}

async function main() {
  console.log(`🤖 Self-improve loop — ${niches.length} site(s)`);
  for (const n of niches) {
    try { await runSite(n); } catch (e) { console.error(`❌ ${n.slug}:`, e.message); }
  }
  console.log('\n✅ Loop complete.');
}

if (require.main === module) main();
module.exports = { main, runSite };
