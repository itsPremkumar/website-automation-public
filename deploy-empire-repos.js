const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const niches = require('./niches');

const token = process.env.GITHUB_TOKEN;
const username = process.env.GITHUB_USERNAME;
const sitesBaseDir = process.env.SITES_DIR || path.join(__dirname, 'sites');

if (!token || !username) {
    console.error('❌ Error: GITHUB_TOKEN or GITHUB_USERNAME is missing in .env file.');
    console.error('   Please run setup or edit .env file.');
    process.exit(1);
}

const sitesDir = path.resolve(sitesBaseDir);

async function main() {
    console.log(`🚀 Starting Global Deployment for ${niches.length} Sites...`);
    console.log(`   📂 Sites Directory: ${sitesDir}`);
    console.log(`   👤 GitHub User: ${username}`);

    let successCount = 0;
    let failCount = 0;

    for (const niche of niches) {
        const repoName = niche.slug;
        const sitePath = path.join(sitesDir, niche.slug);

        if (!fs.existsSync(sitePath)) {
            console.warn(`   ⚠️  Skipping ${niche.name} (Folder not found: ${sitePath})`);
            continue;
        }

        console.log(`\n🔄 Deploying: ${niche.name} (${niche.slug})...`);

        try {
            const gitFolder = path.join(sitePath, '.git');
            if (fs.existsSync(gitFolder)) {
                try { fs.rmSync(gitFolder, { recursive: true, force: true }); } catch (e) { }
            }

            // Helper for running commands with error capturing
            const runGit = (cmd) => {
                try {
                    execSync(cmd, { cwd: sitePath, stdio: 'pipe' }); // Capture output
                } catch (error) {
                    throw new Error(`Git command failed: ${cmd}\n   ${error.stderr?.toString()?.trim() || error.message}`);
                }
            };

            runGit('git init');
            runGit('git add .');
            runGit(`git commit -m "Professional V3 Upgrade Final"`);
            runGit('git branch -M main');

            // Ensure repo exists
            await createRepo(repoName);

            const remoteUrl = `https://${username}:${token}@github.com/${username}/${repoName}.git`;
            runGit(`git remote add origin "${remoteUrl}"`);
            runGit('git push -u origin main --force');

            // Enable GitHub Pages
            const pagesSuccess = await enablePages(repoName);

            if (pagesSuccess) {
                console.log(`   🔍 Verifying domain settings...`);
                try {
                    // Wait briefly for propagation
                    await new Promise(r => setTimeout(r, 1000));

                    const pagesInfo = await getPagesInfo(repoName);
                    const liveUrl = pagesInfo.html_url || `https://${username}.github.io/${repoName}/`;

                    console.log(`   ✅ Success!`);
                    console.log(`      🔗 URL:    ${liveUrl}`);
                    console.log(`      📡 Status: ${pagesInfo.status || 'deployed'}`);
                    if (pagesInfo.cname) {
                        console.log(`      🌍 CNAME:  ${pagesInfo.cname} (Custom Domain)`);
                    }

                    // Check if URL is actually reachable
                    const isReachable = await checkUrl(liveUrl);
                    console.log(`      ${isReachable ? '🟢' : '🔴'} Health: ${isReachable ? 'Online & Accessible' : 'Not yet accessible (DNS propagation delay)'}`);

                } catch (err) {
                    console.log(`   ⚠️  Deployed, but could not verify status: ${err.message}`);
                    console.log(`      The site is likely live at: https://${username}.github.io/${repoName}/`);
                }
                successCount++;
            } else {
                console.error(`   ⚠️  Deployed code, but GitHub Pages activation failed.`);
                failCount++;
            }

            // Safety delay to prevent rate limits
            await new Promise(r => setTimeout(r, 2000));
        } catch (error) {
            console.error(`   ❌ Failed: ${error.message}`);
            failCount++;
        }
    }

    console.log('\n────────────────────────────────────────');
    console.log(`🎉 Deployment Complete!`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed:     ${failCount}`);
    console.log('────────────────────────────────────────');
}

if (require.main === module) {
    main();
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
                    // console.log(`   ℹ️  Repository ${repoName} already exists.`);
                    resolve(true);
                } else {
                    reject(new Error(`Create Repo Failed (${res.statusCode}): ${body}`));
                }
            });
        });

        req.on('error', (error) => {
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
                    console.warn(`   ⚠️  Could not enable Pages (422). It might already be enabled.`);
                    resolve(true);
                } else {
                    console.error(`   ⚠️  Failed to enable Pages: ${res.statusCode} ${body}`);
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

// Helper to get Pages detailed info (CNAME, Status)
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

// Helper to check if URL is reachable (Follows redirects)
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

module.exports = main;