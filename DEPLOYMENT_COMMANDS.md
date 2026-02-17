# 🚀 Deployment Command Reference

## 🤖 The "One-Command" Deploy
This is the single, simple command to create, configure, and deploy your websites.

**Syntax:**
```bash
npm run deploy -- <slug> [Name] [Description] [ThemeColor] [RepoName]
```

### Examples

**1. Deploy an Existing Site**
If the folder `sites/common-website-template` exists, this just deploys it.
```bash
npm run deploy -- common-website-template
```

**2. Create & Deploy a New Site**
Creates the folder, sets the config, and deploys it.
```bash
npm run deploy -- travel-blog "My Travel Diaries" "Exploring the world" "#f59e0b"
```
