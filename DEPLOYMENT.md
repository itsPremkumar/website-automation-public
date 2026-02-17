# 🚀 Deployment Varieties & Strategies

This project supports **4 distinct ways** to deploy websites to GitHub Pages, ranging from interactive menus to fully automated bulk operations.

---

## 1. 🖥️ Interactive Menu (Recommended for Beginners)
The most user-friendly way to explore and use deployment tools without remembering commands.

- **Command**: `npm start`
- **Source**: [`menu.js`](file:///c:/one/website-automation/menu.js)
- **Features**:
  - 🚀 **Deploy ALL Sites (Empire)**: Triggers the bulk deployment.
  - 📦 **Deploy Single Site**: detailed below.
  - 🔧 **Check Configuration**: Verifies your GitHub tokens and environment.

---

## 2. 🤖 The "Bot" Deployer (Create & Deploy)
**Best for:** Creating a brand NEW site from the template and deploying it instantly in one command.

- **Command**: `npm run deploy -- <slug> [Name] [Description] [Color] [RepoName]`
- **Source**: [`bot-deploy.js`](file:///c:/one/website-automation/bot-deploy.js)
- **Process**:
  1.  **Clones Template**: Copies `common-website-template` to `sites/<slug>`.
  2.  **Configures**: Updates `site-config.json` with the provided Name, Description, and Color.
  3.  **Deploys**: Immediately pushes to GitHub and enables Pages.

**Example**:
```bash
npm run deploy -- travel-blog "My Travels" "A blog about world travel" "#ff5722"
```

---

## 3. 📦 Single Site Deployment (Manual)
**Best for:** Deploying an existing site folder that you have manually edited or created.

- **Command**: `npm run deploy:one -- <slug> [RepoName]`
- **Source**: [`deploy-single-site.js`](file:///c:/one/website-automation/deploy-single-site.js)
- **Process**:
  - Takes an existing folder from `sites/<slug>`.
  - Initializes a fresh Git repository.
  - Pushes to GitHub.
  - Enables GitHub Pages.

**Example**:
```bash
# Deploys content from sites/my-existing-site to GitHub repo "my-existing-site"
npm run deploy:one -- my-existing-site
```

---

## 4. 👑 Empire Deployment (Bulk)
**Best for:** Managing a massive portfolio of sites. Deploys ALL sites defined in `niches.js`.

- **Command**: `npm run deploy:all`
- **Source**: [`deploy-empire-repos.js`](file:///c:/one/website-automation/deploy-empire-repos.js)
- **Configuration**: controlled by [`niches.js`](file:///c:/one/website-automation/niches.js).
- **Process**:
  - Iterates through every entry in `niches.js`.
  - Checks if the site folder exists.
  - Force-pushes updates to each corresponding GitHub repository.
  - Ensures GitHub Pages is enabled for all of them.

---

## ⚙️ Technical Deployment Workflow (Under the Hood)
All methods above utilize a shared deployment logic found in `deploy-single-site.js` and `deploy-empire-repos.js`.

### 1. Git Initialization (Force Reset)
To ensure a clean state, the scripts usually:
- **Delete** existing `.git` folder in the site directory.
- **Re-init** a fresh git repo (`git init`).
- **Commit** all files (`git commit -m "Deploy..."`).
- **Force Push** (`git push -u origin main --force`) to overwrite history on the remote.

### 2. Repository Creation
- Uses GitHub API (`POST /user/repos`) to create the repository if it doesn't match.
- Handles `422 Unprocessable Entity` gracefully if the repo already exists.

### 3. GitHub Pages Activation
- Uses GitHub API (`POST /repos/{owner}/{repo}/pages`) to enable Pages on the `main` branch.
- Returns the live URL immediately.

### 4. Environment Variables
All scripts require the following in `.env`:
- `GITHUB_USERNAME`: Your GitHub username.
- `GITHUB_TOKEN`: A Personal Access Token with `repo` scope.
