const prompts = require('prompts');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const deployAll = require('./deploy-empire-repos');
const deploySingle = require('./deploy-single-site');
const niches = require('./niches');

// Helper to run script via node
function runScript(scriptName) {
    try {
        console.log(`\nStarting ${scriptName}...`);
        const scriptPath = path.join(__dirname, scriptName);
        execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`❌ Error running ${scriptName}:`, e.message);
    }
}

async function mainMenu() {
    console.clear();
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║             WEBSITE AUTOMATION COMMAND CENTER                ║
╚══════════════════════════════════════════════════════════════╝
    `);

    // Check configuration
    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_USERNAME) {
        console.log('⚠️  WARNING: GitHub credentials not found in .env');
        console.log('   Some deployment features will not work.\n');
    }

    const start = await prompts({
        type: 'select',
        name: 'value',
        message: 'What would you like to do?',
        choices: [
            { title: '🚀 Deploy ALL Sites (Empire)', value: 'deploy-all', description: 'Deploy the entire portfolio of websites' },
            { title: '📦 Deploy Single Site', value: 'deploy-single', description: 'Deploy one specific website folder' },
            { title: '🔧 Check Configuration', value: 'check-config', description: 'Verify .env and dependencies' },
            { title: '❌ Exit', value: 'exit' }
        ]
    });

    switch (start.value) {
        case 'deploy-all':
            const confirm = await prompts({
                type: 'confirm',
                name: 'value',
                message: 'Are you sure you want to deploy ALL sites? This may take time.',
                initial: false
            });
            if (confirm.value) {
                await deployAll();
            }
            break;

        case 'deploy-single':
            // Get list of folders in sites directory
            const sitesDir = process.env.SITES_DIR ? path.resolve(process.env.SITES_DIR) : path.join(__dirname, 'sites');
            let siteFolders = [];
            try {
                if (fs.existsSync(sitesDir)) {
                    siteFolders = fs.readdirSync(sitesDir).filter(f => {
                        return fs.statSync(path.join(sitesDir, f)).isDirectory();
                    }).map(f => ({ title: f, value: f }));
                }
            } catch (e) { console.error("Could not read sites dir", e); }

            if (siteFolders.length === 0) {
                console.log('No sites found in ../sites directory.');
                break;
            }

            const site = await prompts({
                type: 'autocomplete',
                name: 'folder',
                message: 'Select site to deploy:',
                choices: siteFolders
            });

            if (site.folder) {
                const conf = await prompts({
                    type: 'text',
                    name: 'repo',
                    message: `Enter Repo Name (default: ${site.folder}):`,
                    initial: site.folder
                });
                await deploySingle(site.folder, conf.repo);
            }
            break;



        case 'check-config':
            console.log('\n🔍 Configuration Check:');
            console.log(`   GITHUB_USERNAME: ${process.env.GITHUB_USERNAME ? '✅ Set (' + process.env.GITHUB_USERNAME + ')' : '❌ Missing'}`);
            console.log(`   GITHUB_TOKEN:    ${process.env.GITHUB_TOKEN ? '✅ Set (Hidden)' : '❌ Missing'}`);
            console.log(`   SITES_DIR:       ${process.env.SITES_DIR || 'Default (../sites)'}`);
            console.log(`   OLLAMA_MODEL:    ${process.env.OLLAMA_MODEL || 'Default'}`);
            console.log('\nPress any key to return...');
            await new Promise(r => process.stdin.once('data', r));
            break;

        case 'exit':
            console.log('Goodbye! 👋');
            process.exit(0);
    }

    // Menu shows one time only
    if (start.value !== 'exit') {
        console.log('\nTask completed. Exiting...');
    }
}

mainMenu().catch(console.error);
