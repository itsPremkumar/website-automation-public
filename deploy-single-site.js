const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const token = process.env.GITHUB_TOKEN;
const username = process.env.GITHUB_USERNAME;
const sitesBaseDir = process.env.SITES_DIR || path.join(__dirname, 'sites');

async function deploySingle(siteSlug, repoName) {
    if (!token || !username) {
        console.error('❌ Error: GITHUB_TOKEN or GITHUB_USERNAME is missing in .env file.');
        return;
    }

    const slug = siteSlug || process.argv[2] || 'website-template';
    const repo = repoName || process.argv[3] || slug;
    const sitePath = path.join(path.resolve(sitesBaseDir), slug);

    if (!fs.existsSync(sitePath)) {
        console.error(`❌ Site folder not found: ${sitePath}`);
        // Only exit if run directly
        if (require.main === module) process.exit(1);
        return;
    }

    try {
        console.log(`🚀 Deploying ${slug} to ${repo}...`);

        const gitFolder = path.join(sitePath, '.git');
        if (fs.existsSync(gitFolder)) {
            try { fs.rmSync(gitFolder, { recursive: true, force: true }); } catch (e) { }
        }

        // Helper for running commands with error capturing
        const runGit = (cmd, stdio = 'pipe') => {
            try {
                execSync(cmd, { cwd: sitePath, stdio });
            } catch (error) {
                // For pipe, we can get stderr. For inherit, the user already saw it.
                const msg = stdio === 'pipe' ? (error.stderr?.toString()?.trim() || error.message) : 'Command failed (see above)';
                throw new Error(`Git command failed: ${cmd}\n   ${msg}`);
            }
        };

        runGit('git init');
        runGit('git add .');
        runGit('git commit -m "Deploy website template"');
        runGit('git branch -M main');


        // Ensure repo exists
        await createRepo(repo);

        const remote = `https://${username}:${token}@github.com/${username}/${repo}.git`;
        runGit(`git remote add origin "${remote}"`);
        // We use inherit here so user sees the progress bar for the push
        runGit('git push -u origin main --force', 'inherit');

        // Enable GitHub Pages
        const pagesSuccess = await enablePages(repo);

        if (pagesSuccess) {
            console.log(`   🔍 Verifying domain settings...`);
            try {
                // Wait briefly for GitHub to propagate
                await new Promise(r => setTimeout(r, 1000));

                const pagesInfo = await getPagesInfo(repo);
                const liveUrl = pagesInfo.html_url || `https://${username}.github.io/${repo}/`;

                console.log(`   ✅ Deployed & Live!`);
                console.log(`      📂 Repo:   https://github.com/${username}/${repo}`);
                console.log(`      🔗 URL:    ${liveUrl}`);
                console.log(`      📡 Status: ${pagesInfo.status || 'deployed'}`);

                if (pagesInfo.cname) {
                    console.log(`      🌍 CNAME:  ${pagesInfo.cname} (Custom Domain)`);
                }

                const isReachable = await checkUrl(liveUrl);
                console.log(`      ${isReachable ? '🟢' : '🔴'} Health: ${isReachable ? 'Online & Accessible' : 'Not yet accessible (DNS propagation delay)'}`);

            } catch (err) {
                console.log(`   ⚠️  Deployed, but could not verify domain details: ${err.message}`);
                console.log(`      The site is likely live at: https://${username}.github.io/${repo}/`);
            }
        } else {
            console.error(`   ⚠️  Code pushed, but GitHub Pages activation failed.`);
            console.error(`      Check repo settings: https://github.com/${username}/${repo}/settings/pages`);
        }

    } catch (error) {
        console.error('   ❌ Deployment failed:', error.message);
        if (require.main === module) process.exit(1);
    }
}

// Helper to create GitHub repo
function createRepo(repoName) {
    return new Promise((resolve, reject) => {
        const https = require('https');
        const data = JSON.stringify({
            name: repoName,
            private: false,
            auto_init: false
        });

        const options = {
            hostname: 'api.github.com',
            path: '/user/repos',
            method: 'POST',
            headers: {
                'User-Agent': 'NodeJS-Automation',
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 201) {
                    console.log(`   ✨ Created new repository: ${repoName}`);
                    resolve(true);
                } else if (res.statusCode === 422) {
                    console.log(`   ℹ️  Repository ${repoName} already exists.`);
                    resolve(true);
                } else {
                    console.error(`   ❌ Failed to create repo: ${res.statusCode} ${body}`);
                    reject(new Error(`GitHub API Error: ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('   ❌ API Request Error:', error);
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

// Helper to enable GitHub Pages
function enablePages(repoName) {
    return new Promise((resolve, reject) => {
        const https = require('https');
        const data = JSON.stringify({
            source: {
                branch: 'main',
                path: '/'
            }
        });

        const options = {
            hostname: 'api.github.com',
            path: `/repos/${username}/${repoName}/pages`,
            method: 'POST',
            headers: {
                'User-Agent': 'NodeJS-Automation',
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                // 201: Created, 409: Already enabled (sometimes), 204: No content
                if (res.statusCode === 201 || res.statusCode === 204) {
                    console.log(`   ✨ GitHub Pages enabled due to successful deployment.`);
                    resolve(true);
                } else if (res.statusCode === 409) {
                    console.log(`   ℹ️  GitHub Pages already enabled or conflict.`);
                    resolve(true);
                } else if (res.statusCode === 422) {
                    // 422 can happen if the branch currently doesn't exist yet (race condition) or already configured
                    // Check body to see if it says "already exists" or similar?
                    // For now, treat as warning but don't fail deployment
                    console.warn(`   ⚠️  Could not enable Pages (422). It might already be enabled.`);
                    resolve(true);
                } else {
                    console.error(`   ⚠️  Failed to enable Pages: ${res.statusCode} ${body}`);
                    // Don't fail the whole script for this, just warn
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.error('   ❌ API Request Error (Pages):', error);
            resolve(false);
        });

        req.write(data);
        req.end();
    });
}

// Helper to get Pages detailed info
function getPagesInfo(repoName) {
    return new Promise((resolve, reject) => {
        const https = require('https');
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${username}/${repoName}/pages`,
            method: 'GET',
            headers: {
                'User-Agent': 'NodeJS-Automation',
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(body));
                } else {
                    reject(new Error(`Status ${res.statusCode}`));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

// Helper to check if URL is reachable
function checkUrl(url) {
    return new Promise((resolve) => {
        const https = require('https');
        const req = https.get(url, { timeout: 5000 }, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
        req.on('error', () => resolve(false));
        req.end();
    });
}

if (require.main === module) {
    deploySingle();
}

module.exports = deploySingle;
