# Common Website Template

A modern, responsive, and SEO-friendly website template designed for rapid deployment. This template serves as the foundation for the "Empire" automation system but can also be used as a standalone project.

## ✨ Features

- **Responsive Design**: Mobile-first layout using CSS Grid and Flexbox.
- **Dark Mode Support**: Built-in theme toggler with persistent preference.
- **SEO Optimized**: Semantic HTML5, Open Graph meta tags, and structured data ready.
- **Performance Focused**: Minimalist CSS and vanilla JavaScript for blazing fast load times.
- **Configurable**: Easily update site details via `site-config.json`.
- **Language Picker**: UI for multi-language support (Google Translate integration ready).

## 🚀 Getting Started

### Prerequisites
- A modern web browser
- A text editor (VS Code recommended)

### Installation
1.  **Navigate to the template folder**:
    ```bash
    cd sites/common-website-template
    ```
2.  **Open `index.html`** in your browser to preview the site.

## ⚙️ Configuration

The template uses a `site-config.json` file (if you are using a build script) or simple HTML editing for customization.

### Key Files
- **`index.html`**: The main homepage structure.
- **`assets/css/style.css`**: All styling (variables, layout, components).
- **`assets/js/script.js`**: Logic for mobile menu, dark mode, and interactions.
- **`site-config.json`**: Configuration data for automation scripts.

### Customization Guide

#### 1. Changing the Color Scheme
Open `assets/css/style.css` and modify the root variables:
```css
:root {
    --primary: #6366f1; /* Brand Color */
    --primary-hover: #4f46e5;
    /* ... */
}
```

#### 2. Updating Content
- **Logo**: Edit the `.brand-logo` in `index.html`.
- **Navigation**: Modify the `<nav>` links.
- **Footer**: Update the copyright year and links in `<footer class="site-footer">`.

#### 3. Adding Posts
To add a new blog post, duplicate the `post.html` file (if available) or create a new HTML file and link it from the `index.html` main section.

## 🔧 Automation Integration
This template is designed to work with the **Website Automation** suite.
- When running `deploy-single-site.js`, this folder is used as the source.
- Ensure `site-config.json` is present if your scripts rely on it for metadata injection.

## 📱 Mobile Responsiveness
The layout automatically adjusts for:
- **Tablets**: 768px breakpoint
- **Mobile**: 480px breakpoint

## 📄 License
MIT License
