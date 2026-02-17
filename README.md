# Website Automation Suite 🚀

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14-green.svg)

A powerful, all-in-one automation suite for building, managing, and deploying a portfolio of websites (an "Empire") to GitHub Pages — from a single master template into many unique, branded, SEO-ready static sites.

> ⚠️ **Security:** Never commit your GitHub token. Copy `.env.example` → `.env` (git-ignored) and fill in your own. See [SECURITY.md](SECURITY.md).

## 🌟 Key Features

### 1. 🏗️ Dynamic Site Generation
- **Template System**: Uses a master `common-website-template`.
- **Auto-Branding**: Automatically generates unique site titles, descriptions, and color themes based on configuration.
- **Instant Scaling**: Add a line to `niches.js`, and the system builds the entire website for you.

### 2. 🚀 Automated Deployment "Empire Mode"
- **One-Click Deploy**: Push fully functional websites to GitHub Pages in seconds.
- **Auto-Repo Management**: Automatically creates private/public repositories.
- **Git Automation**: Handles `git init`, `add`, `commit`, `push`, and `gh-pages` branch creation.

### 3. 🎨 Production-Ready Template
- **SEO Optimized**: Open Graph tags, semantic HTML, and dynamic metadata.
- **High Performance**: Lazy loading, system font fallbacks, and minimal dependencies.
- **Modern UI**: Dark/Light mode, responsive design, and glassmorphism styling.

---

## 🏁 Quick Start

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Environment**:
    Rename `.env.example` (or create `.env`) and add your GitHub credentials (see [Setup Guide](SETUP_GUIDE.md)).

3.  **Run the Menu**:
    ```bash
    npm start
    ```
    Select **"Deploy Empire"** to build and deploy your sites defined in `niches.js`.

---

## 📚 Documentation

- **[> STEP-BY-STEP SETUP GUIDE](SETUP_GUIDE.md)**: Detailed instructions on installation and configuration.
- **[> Template Documentation](sites/common-website-template/README.md)**: How to customize the master template.

---

## 📂 Project Architecture

```text
website-automation/
├── sites/                      # Where your websites live
│   └── common-website-template/ # The MASTER template (Edit this!)
├── deploy-empire-repos.js      # The "Empire Builder" script
├── deploy-single-site.js       # Single site deployer
├── niches.js                   # Configuration: Define your sites here
├── menu.js                     # CLI Menu
└── .env                        # Secrets (GitHub Token)
```

## 📄 License
MIT License — see [LICENSE](LICENSE).
