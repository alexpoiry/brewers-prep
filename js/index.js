(function() {
  const DEFAULT_PAGE = 'home.html';
  const BRAND = 'Brewers Prep';

  // Ensure FA brand family if the kit loader is present (safe no-op otherwise)
  try {
    if (window.FontAwesomeConfig) {
      window.FontAwesomeConfig.autoA11y = true;
    }
  } catch (_) {}

  const iframe = document.getElementById('mainframe');
  const nav = document.querySelector('nav[slot="navigation"]');
  const links = nav ? Array.from(nav.querySelectorAll('a[href]')) : [];

  function normalizeHash(h) {
    if (!h) return '';
    return h.replace(/^#/, '').trim();
  }

  function findLinkByPath(path) {
    // Compare by href ending with the path or hash equals path
    const normalized = path.toLowerCase();
    return links.find(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      return href === `#${normalized}` || href.endsWith(`/${normalized}`) || href.endsWith(normalized);
    }) || null;
  }

  function setActiveLink(link) {
    links.forEach(a => {
      a.classList.toggle('active', a === link);
      if (a === link) {
        a.setAttribute('aria-current', 'page');
      } else {
        a.removeAttribute('aria-current');
      }
    });
  }

  function inferTitleFromLink(link) {
    if (!link) return BRAND;
    const txt = link.textContent.trim().replace(/\s+/g, ' ');
    // e.g., "Brewers Prep — Styles"
    return `${BRAND} — ${txt}`;
  }

  function navigateTo(path, pushState = true) {
    const link = findLinkByPath(path);
    const src = path || DEFAULT_PAGE;
    if (iframe && src) {
      // Use hash routing; if link has an href="#page", reflect that, else just set to "#src"
      const newHash = link ? (link.getAttribute('href') || `#${src}`) : `#${src}`;
      if (pushState) {
        window.location.hash = newHash;
      }
      iframe.setAttribute('src', src);
    }
    document.title = inferTitleFromLink(link);
    setActiveLink(link);
  }

  // Intercept nav clicks so we can keep things consistent
  links.forEach(a => {
    a.addEventListener('click', evt => {
      const href = a.getAttribute('href');
      if (href && href.startsWith('#')) {
        evt.preventDefault();
        const target = href.slice(1);
        navigateTo(target, true);
      } else if (href && !/^https?:/i.test(href)) {
        // Local page link without hash
        evt.preventDefault();
        navigateTo(href.replace(/^\//, ''), true);
      }
    });
  });

  // Load on initial hash or default
  const initial = normalizeHash(window.location.hash) || DEFAULT_PAGE;
  navigateTo(initial, false);

  window.addEventListener('hashchange', () => {
    const h = normalizeHash(window.location.hash);
    if (h) navigateTo(h, false);
  });
})();
