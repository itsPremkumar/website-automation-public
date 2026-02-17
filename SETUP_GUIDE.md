# 🛠️ Website Automation - Complete Setup Guide

This guide will walk you through setting up, configuring, and running the website automation suite to deploy your website empire.

---

## 📋 1. Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js**: [Download & Install](https://nodejs.org/) (Version 16 or higher recommended).
2.  **Git**: [Download & Install](https://git-scm.com/).
3.  **GitHub Account**: You need an active GitHub account.

---

## 🔑 2. GitHub Authentication Setup

To allow the scripts to create repositories and deploy code on your behalf, you need a **Personal Access Token (PAT)**.

1.  Log in to GitHub.
2.  Go to **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**.
3.  Click **Generate new token (classic)**.
4.  **Note**: "Website Automation"
5.  **Select Scopes**: Check the following boxes:
    - [x] `repo` (Full control of private repositories)
    - [x] `workflow` (Update GitHub Action workflows)
    - [x] `delete_repo` (Optional, if you plan to delete repos via script)
6.  Click **Generate token**.
7.  **COPY THIS TOKEN**. You won't be able to see it again.

---

## ⚙️ 3. Project Configuration

### Step 3.1: Install Dependencies
Open your terminal in the project folder (`website-automation`) and run:
```bash
npm install
```

### Step 3.2: Configure Environment Variables
1.  Locate the `.env` file in the root directory.
2.  Open it and update with your details:

```env
GITHUB_USERNAME=YourGitHubUsername
GITHUB_TOKEN=ghp_YourCopiedTokenHere123456
SITES_DIR=sites
```
*Note: `SITES_DIR` points to the local folder where your websites are stored.*

### Step 3.3: Define Your Empire (`niches.js`)
This file controls which websites are built and deployed. Open `niches.js` and add your sites:

```javascript
module.exports = [
    {
        name: "My Tech Blog",
        slug: "my-tech-blog",    // Folder name (will be auto-generated)
        topic: "Technology",
        color: "#3b82f6"         // Branding color (Blue)
    },
    {
        name: "Vegan Recipes",
        slug: "vegan-recipes",
        topic: "Cooking",
        color: "#10b981"         // Branding color (Green)
    }
];
```

---

## 🚀 4. Usage Guide

### Option A: The Interactive Menu (Recommended)
The easiest way to use the tool.

```bash
npm start
```
Use the arrow keys to select an option:
1.  **Deploy Empire**: Deploys ALL sites defined in `niches.js`.
2.  **Deploy Single Site**: Deploys just one specific site folder.
3.  **Exit**: Closes the tool.

### Option B: Automatic Site Generation & Deployment
When you run the **Deploy Empire** command (`node deploy-empire-repos.js`):

1.  It reads `niches.js`.
2.  It checks if a folder exists in `sites/` for each slug.
3.  **If the folder is missing**:
    - It **COPIES** the `common-website-template`.
    - It **GENERATES** a `site-config.json` with the name, topic, and color from `niches.js`.
    - It **STYLES** the site automatically based on that config.
4.  It **CREATES** a GitHub repository (if it doesn't exist).
5.  It **PUSHES** the code and enables **GitHub Pages**.

### Option C: Manual Customization
If you want to manually edit a site before deploying:
1.  Let the script generate the folder (or copy `common-website-template` manually).
2.  Open `sites/<your-site-slug>/site-config.json` to change text/colors.
3.  Edit `sites/<your-site-slug>/input-data.json` to change the blog posts.
4.  Run `npm start` -> **Deploy Single Site**.

---

## 📂 5. Directory Structure

- **`sites/`**: Your website folders live here.
- **`sites/common-website-template/`**: The master blueprint. Changes here affect ALL future sites.
- **`.env`**: Credentials configuration.
- **`niches.js`**: List of sites to automation.
- **`deploy-empire-repos.js`**: The bulk deployment engine.
- **`deploy-single-site.js`**: The single site deployment engine.

---

## ❓ Troubleshooting

**Q: "Repository not found" error?**
A: Check your `GITHUB_TOKEN` in `.env`. Ensure it has `repo` scope.

**Q: Site deployment failed?**
A: Ensure you have `git` installed and your user is configured:
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

**Q: Browser tool failed during verification?**
A: Run `npx serve .` inside a site folder and open `http://localhost:3000` manually in your browser to test.
