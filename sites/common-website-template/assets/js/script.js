async function loadData() {
    // Check for file protocol limitations
    if (window.location.protocol === 'file:') {
        const errorMsg = `
            <div style="text-align: center; padding: 2rem; color: #7f1d1d; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
                <h3>⚠️ Local File Access Restricted</h3>
                <p>Browsers block reading files (like <code>input-data.json</code>) directly from your hard drive for security.</p>
                <p><strong>To fix this, you must run a local server.</strong></p>
                <p>I have started one for you in the background, or you can run:</p>
                <code style="display:block; padding:10px; background:#eee; margin:10px 0;">npx serve .</code>
                <p>Then open <a href="http://localhost:3000">http://localhost:3000</a></p>
            </div>
        `;
        document.getElementById('app').innerHTML = errorMsg;
        throw new Error('CORS limitation: Cannot fetch JSON via file:// protocol.');
    }

    try {
        const response = await fetch('input-data.json');
        if (!response.ok) throw new Error('Failed to load data: ' + response.statusText);
        return await response.json();
    } catch (error) {
        console.error('Error loading blog data:', error);
        document.getElementById('app').innerHTML = `<p>Error loading content: ${error.message}</p>`;
        return null;
    }
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function updateMetaTags(post) {
    if (!post) return;

    document.title = post.title + " | " + (window.siteConfig?.siteName);

    // Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
    }
    metaDesc.content = post.description || post.excerpt || "";

    // Open Graph
    updateOgTag('og:title', post.title);
    updateOgTag('og:description', post.description || post.excerpt);
    updateOgTag('og:url', window.location.href);
    if (post.coverImage) {
        updateOgTag('og:image', post.coverImage);
    }
    updateOgTag('og:type', 'article');

    // Canonical
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.rel = "canonical";
        document.head.appendChild(linkCanonical);
    }
    linkCanonical.href = window.location.href;

    // JSON-LD Structure Data
    const scriptCheck = document.getElementById('json-ld');
    if (scriptCheck) scriptCheck.remove();

    const script = document.createElement('script');
    script.id = 'json-ld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "image": post.coverImage ? [post.coverImage] : [],
        "datePublished": post.date,
        "author": [{
            "@type": "Person",
            "name": post.author
        }]
    });
    document.head.appendChild(script);
}

function updateOgTag(property, content) {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
}

function renderPostList(posts) {
    console.log('renderPostList called with', posts.length, 'posts');
    const app = document.getElementById('app');
    if (!app) {
        console.error('App container not found!');
        return;
    }

    if (posts.length === 0) {
        app.innerHTML = '<p>No posts found.</p>';
        return;
    }

    const html = posts.map(post => {
        return `
        <article class="post-card" data-slug="${post.slug}" style="cursor: pointer;">
            <h2><a href="post?slug=${post.slug}" class="post-link">${post.title}</a></h2>
            <div class="post-meta">
                <span>${formatDate(post.date)}</span> • 
                <span>${post.readTime}</span> • 
                <span>${post.author}</span>
            </div>
            <div class="post-excerpt">
                ${post.excerpt}
            </div>
            <a href="post?slug=${post.slug}" class="read-more">Read more →</a>
        </article>
    `}).join('');

    app.innerHTML = html;
}

function setupDelegatedEvents() {
    const app = document.getElementById('app');
    if (!app) return;

    // Use a single listener for the entire container (Event Delegation)
    app.addEventListener('click', (e) => {
        // 1. Handle "Read More" or Title Links (let them navigate naturally)
        const link = e.target.closest('a');
        if (link) {
            return;
        }

        // 2. Handle Post Card Clicks (if not a link)
        const card = e.target.closest('.post-card');
        if (card) {
            const slug = card.dataset.slug;
            if (slug) {
                const targetUrl = `post?slug=${slug}`;
                window.location.href = targetUrl;
            }
        }
    });
}

function renderSinglePost(post) {
    const app = document.getElementById('app');
    if (!app) return;

    if (!post) {
        app.innerHTML = '<h2>Post not found</h2><p><a href="index.html">Back to all posts</a></p>';
        document.title = "Post Not Found";
        return;
    }

    updateMetaTags(post);

    const tagsHtml = post.tags ? post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('') : '';

    const html = `
        <article class="post-single">
    <header class="post-header">
                <h1 class="post-title">${post.title}</h1>
                <div class="post-meta">
                    <span>${formatDate(post.date)}</span>
                    <span>•</span>
                    <span>${post.readTime}</span>
                    <span>•</span>
                    <span>${post.author}</span>
                </div>
            </header>
            ${post.coverImage ? `<img class="post-feature-image" src="${post.coverImage}" alt="${post.title}" loading="lazy">` : ''}
            <div class="post-content">
                ${post.content}
            </div>
            ${post.tags && post.tags.length > 0 ? `<div class="tags">${tagsHtml}</div>` : ''}
            
            <div>
                <a href="index.html">← Back to all posts</a>
            </div>
        </article>
    `;

    app.innerHTML = html;
}

// ... Google Translate & Theme Init ... (Unchanged)

function initGoogleTranslate() {
    // Check if script already exists
    if (document.getElementById('google-translate-script')) return;

    // Define the callback globally
    window.googleTranslateElementInit = function () {
        const targetElement = document.getElementById('google_translate_element');
        try {
            new google.translate.TranslateElement(
                { pageLanguage: 'en' },
                'google_translate_element'
            );
        } catch (e) {
            console.error('Error initializing Google Translate:', e);
        }
    };

    // Inject the script
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.type = 'text/javascript';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(script);
}

function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const storedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const icon = themeToggle ? themeToggle.querySelector('.toggle-icon') : null;

    function setTheme(theme) {
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            if (icon) icon.textContent = '🌙';
        } else {
            html.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            if (icon) icon.textContent = '☀';
        }
    }

    // Apply initial theme
    if (storedTheme === 'dark' || (!storedTheme && systemDark)) {
        setTheme('dark');
    } else {
        setTheme('light');
    }

    // Toggle listener
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            setTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }
}


function initCustomLanguageSelector() {
    const langToggle = document.getElementById('lang-toggle');
    const langDropdown = document.getElementById('lang-dropdown');
    const langList = document.getElementById('lang-list');
    const langSearch = document.getElementById('lang-search');
    const currentLangSpan = document.getElementById('current-lang');

    if (!langToggle || !langDropdown) return;

    // Standard list of languages
    const languages = [
        { code: 'en', name: 'English', badge: '(Default)' },
        { code: 'es', name: 'Español' },
        { code: 'de', name: 'Deutsch' },
        { code: 'fr', name: 'Français' },
        { code: 'it', name: 'Italiano' },
        { code: 'hi', name: 'हिन्दी' },
        { code: 'zh-CN', name: '中文 (简体)' },
        { code: 'ja', name: '日本語' },
        { code: 'ko', name: '한국어' },
        { code: 'pt', name: 'Português' },
        { code: 'ru', name: 'Русский' },
        { code: 'ar', name: 'العربية' }
    ];

    // Render list
    function renderLanguages(filter = '') {
        langList.innerHTML = '';
        const filtered = languages.filter(l => l.name.toLowerCase().includes(filter.toLowerCase()) || l.code.toLowerCase().includes(filter.toLowerCase()));

        filtered.forEach(lang => {
            const li = document.createElement('li');
            li.className = 'lang-item';
            li.innerHTML = `
                <span class="lang-code">${lang.code.toUpperCase()}</span>
                <span class="lang-name">${lang.name}</span>
                ${lang.badge ? `<span class="lang-badge">${lang.badge}</span>` : ''}
            `;
            li.addEventListener('click', () => changeLanguage(lang.code, lang.name));
            langList.appendChild(li);
        });
    }

    // Toggle Dropdown
    langToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('show');
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!langDropdown.contains(e.target) && !langToggle.contains(e.target)) {
            langDropdown.classList.remove('show');
        }
    });

    // Search
    langSearch.addEventListener('input', (e) => {
        renderLanguages(e.target.value);
    });

    // Bridge to Google Translate
    function changeLanguage(code, name) {
        // Update UI
        currentLangSpan.textContent = name;
        langDropdown.classList.remove('show');

        // Trigger Google Translate
        const googleCombo = document.querySelector('.goog-te-combo');
        if (googleCombo) {
            googleCombo.value = code;
            googleCombo.dispatchEvent(new Event('change'));
            googleCombo.dispatchEvent(new Event('input')); // Some browsers need this
        } else {
            // One-time retry after a short delay
            setTimeout(() => {
                const retryCombo = document.querySelector('.goog-te-combo');
                if (retryCombo) {
                    retryCombo.value = code;
                    retryCombo.dispatchEvent(new Event('change'));
                    retryCombo.dispatchEvent(new Event('input'));
                } else {
                    console.error('Failed to change language. Widget not found.');
                }
            }, 1000);
        }
    }

    // Poll for Google Translate readiness
    let attempts = 0;
    const checkWidget = setInterval(() => {
        const googleCombo = document.querySelector('.goog-te-combo');
        if (googleCombo) {
            clearInterval(checkWidget);
            document.body.classList.add('translate-ready');
        } else {
            attempts++;
            if (attempts > 20) { // Stop polling after 20 seconds
                clearInterval(checkWidget);
            }
        }
    }, 1000);

    renderLanguages();
}
function initSearch(posts) {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    if (!searchInput || !searchResults) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 2) {
            searchResults.classList.remove('active');
            return;
        }

        const filtered = posts.filter(post =>
            post.title.toLowerCase().includes(query) ||
            post.excerpt.toLowerCase().includes(query) ||
            post.content.toLowerCase().includes(query) ||
            (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query)))
        ).slice(0, 5);

        if (filtered.length > 0) {
            searchResults.innerHTML = filtered.map(post => `
                <div class="search-result-item" onclick="window.location.href='post?slug=${post.slug}'">
                    <span class="search-result-title">${post.title}</span>
                    <span class="search-result-excerpt">${post.excerpt.substring(0, 60)}...</span>
                </div>
            `).join('');
            searchResults.classList.add('active');
        } else {
            searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
            searchResults.classList.add('active');
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
}

async function init() {
    // Initialize features that don't depend on data
    initGoogleTranslate();
    initTheme();
    initCustomLanguageSelector();

    // Load Site Config first
    try {
        const configResponse = await fetch('site-config.json');
        if (configResponse.ok) {
            window.siteConfig = await configResponse.json();
            applySiteConfig(window.siteConfig);
        }
    } catch (e) {
        console.warn('Could not load site-config.json, using defaults.');
    }

    const posts = await loadData();

    if (posts) initSearch(posts);

    if (posts === null) return;

    const slug = getQueryParam('slug');

    if (slug) {
        const post = posts.find(p => p.slug === slug);
        renderSinglePost(post);
    } else {
        renderPostList(posts);
    }
}

function applySiteConfig(config) {
    if (!config) return;

    // 1. Branding (Site Name)
    if (config.siteName) {
        if (!getQueryParam('slug')) {
            document.title = config.siteName;
        }
        const brand = document.getElementById('brand-name');
        if (brand) brand.textContent = config.siteName;

        // Update Footer "About" Title
        const footerAboutTitle = document.getElementById('footer-about-title');
        if (footerAboutTitle) footerAboutTitle.textContent = `About ${config.siteName}`;
    }

    // 2. Description
    if (config.description) {
        // Meta Description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.content = config.description;

        // OG Description
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.content = config.description;

        // Footer About Text
        const footerAboutText = document.getElementById('footer-about-text');
        if (footerAboutText) footerAboutText.textContent = config.description;

        // OG Title (fallback if not set per page)
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && !ogTitle.content) ogTitle.content = config.siteName;
    }

    // 3. Footer Text
    if (config.footerText) {
        const footerCopyright = document.getElementById('footer-copyright');
        if (footerCopyright) footerCopyright.textContent = config.footerText;
    }

    // 4. Social Links
    if (config.social) {
        if (config.social.twitter) {
            const twitterLink = document.getElementById('social-twitter');
            if (twitterLink) {
                twitterLink.href = config.social.twitter;
                twitterLink.style.display = 'inline-flex';
            }
        }
        if (config.social.github) {
            const githubLink = document.getElementById('social-github');
            if (githubLink) {
                githubLink.href = config.social.github;
                githubLink.style.display = 'inline-flex';
            }
        }
    }

    // 5. Theming (Color)
    if (config.themeColor) {
        const hsl = hexToHSL(config.themeColor);
        if (hsl) {
            const root = document.documentElement;
            root.style.setProperty('--primary-h', hsl.h);
            root.style.setProperty('--primary-s', `${hsl.s}%`);
            root.style.setProperty('--primary-l', `${hsl.l}%`);
            // Update accent to be complementary or analogous? For now, let's just shift hue for accent
            root.style.setProperty('--accent-h', (hsl.h + 30) % 360);
        }
    }
}

function hexToHSL(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = "0x" + hex[1] + hex[1];
        g = "0x" + hex[2] + hex[2];
        b = "0x" + hex[3] + hex[3];
    } else if (hex.length === 7) {
        r = "0x" + hex[1] + hex[2];
        g = "0x" + hex[3] + hex[4];
        b = "0x" + hex[5] + hex[6];
    }
    r /= 255;
    g /= 255;
    b /= 255;
    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;

    if (delta == 0) h = 0;
    else if (cmax == r) h = ((g - b) / delta) % 6;
    else if (cmax == g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    l = (cmax + cmin) / 2;
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return { h, s, l };
}


document.addEventListener('DOMContentLoaded', () => {
    setupDelegatedEvents();
    init();
});

