const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const deploySingle = require('./deploy-single-site');
const { injectSite } = require('./lib/inject');

// 1. Parse Arguments (slug, name, description, color, repoName?, domain?)
const args = process.argv.slice(2);

if (args.length < 1) {
    console.log(`
❌ Usage: npm run deploy -- <slug> [Name] [Description] [Color] [RepoName] [Domain]

Example (Minimal):
  npm run deploy -- my-blog

Example (Full):
  npm run deploy -- tech-news "Tech Daily" "Latest tech news" "#00ff00" "tech-news-repo" "technews.com"
`);
    process.exit(1);
}

const [slug, siteNameArg, descriptionArg, themeColorArg, repoArg, domainArg] = args;
const repoName = repoArg || slug;

const sitesDir = path.join(__dirname, 'sites');
const templateDir = path.join(sitesDir, 'common-website-template');
const targetDir = path.join(sitesDir, slug);

async function run() {
    console.log(`🤖 Bot Deployment Initiated for: ${slug}`);

    // 2. Create Directory (Copy Template)
    if (!fs.existsSync(targetDir)) {
        console.log(`   📂 Creating site folder: ${slug}...`);
        try {
            // Recursive copy using Node.js native method (Cross-platform)
            fs.cpSync(templateDir, targetDir, { recursive: true });

            // Remove checks if git was copied
            const gitDir = path.join(targetDir, '.git');
            if (fs.existsSync(gitDir)) {
                fs.rmSync(gitDir, { recursive: true, force: true });
            }
        } catch (e) {
            console.error('   ❌ Failed to copy template:', e.message);
            process.exit(1);
        }
    } else {
        console.log(`   ℹ️  Folder exists. Using existing configuration.`);
    }

    // 3. Configure Site (site-config.json) - Only if args provided
    const configPath = path.join(targetDir, 'site-config.json');
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            let updated = false;

            // Update fields only if provided
            if (siteNameArg) { config.siteName = siteNameArg; updated = true; }
            if (descriptionArg) { config.description = descriptionArg; updated = true; }
            if (themeColorArg) { config.themeColor = themeColorArg; updated = true; }
            if (domainArg) { config.url = `https://${domainArg}`; updated = true; }

            // Auto-update footer if name changed
            if (siteNameArg) {
                config.footerText = `© ${new Date().getFullYear()} ${config.siteName}. All rights reserved.`;
                updated = true;
            }

            if (updated) {
                fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
                console.log(`   ⚙️  Configuration updated.`);
            }
        } catch (e) {
            console.error('   ❌ Failed to update config:', e.message);
            console.error('   🛑 Aborting deployment to prevent broken site.');
            process.exit(1);
        }
    }

    // 3b. Inject SEO metadata + Monetag zone from config (avoid thin-content / wrong-ad-ID)
    try {
        const changed = injectSite(targetDir, {
            name: siteNameArg,
            description: descriptionArg,
            url: domainArg ? `https://${domainArg}` : undefined,
        });
        console.log(`   🪄 SEO/Monetag injected into ${changed} file(s).`);
    } catch (e) {
        console.warn(`   ⚠️  SEO injection skipped: ${e.message}`);
    }

    // 4. Configure CNAME (Custom Domain)
    const cnamePath = path.join(targetDir, 'CNAME');
    if (domainArg) {
        try {
            fs.writeFileSync(cnamePath, domainArg);
            console.log(`   🌍 Custom domain config created: ${domainArg}`);
        } catch (e) {
            console.error('   ❌ Failed to write CNAME:', e.message);
        }
    } else {
        // If no domain provided, remove the template's dummy CNAME to prevent issues
        if (fs.existsSync(cnamePath)) {
            fs.unlinkSync(cnamePath);
            console.log(`   🗑️  Removed template CNAME (using default GitHub Pages URL).`);
        }
    }

    // 5. Deploy
    console.log(`   🚀 Starting deployment to repo: ${repoName}...`);
    try {
        await deploySingle(slug, repoName);
        console.log(`\n🎉 Bot Deployment Complete!`);
    } catch (e) {
        console.error(`   ❌ Bot Deployment Failed: ${e.message}`);
        process.exit(1);
    }
}

run();
