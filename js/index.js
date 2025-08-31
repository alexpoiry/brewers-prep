import { setDefaultIconFamily } from 'https://early.webawesome.com/webawesome@3.0.0-beta.4/dist/webawesome.js';
setDefaultIconFamily('classic');

(async function iconSplash() {
  const ICONS = ['fa-glass', 'fa-beer-mug', 'fa-wine-glass', 'fa-glass-half'];
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function sample(arr, n) { const c = [...arr]; for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[c[i], c[j]] = [c[j], c[i]]; } return c.slice(0, n); }

  let hexes = [];
  try {
    const resp = await fetch('data/srm-colors.json');
    const json = await resp.json();
    if (Array.isArray(json)) {
      hexes = json.map(x => x.hex).filter(Boolean);
    } else if (json && typeof json === 'object') {
      // Allow either {values:[...]} or keyed object
      if (Array.isArray(json.values)) hexes = json.values.map(x => x.hex).filter(Boolean);
      else hexes = Object.values(json).map(x => x.hex).filter(Boolean);
    }
  } catch (e) {
    // fallback palette if JSON not found
    hexes = ['#FFE699', '#FAD977', '#F1C453', '#E6B24B', '#D99832', '#C07A23', '#A05A0B', '#7A3E00', '#4E2A14', '#2B1A0F'];
  }

  const wrap = document.getElementById('icon-splash');
  wrap.innerHTML = '';
  const colors = sample(hexes, Math.min(6, hexes.length));
  for (let i = 0; i < 6; i++) {
    const icon = pick(ICONS);
    const color = colors[i % colors.length];
    const el = document.createElement('i');
    el.className = `fa-duotone fa-light ${icon} fa-2xl`;
    el.style.setProperty('--fa-secondary-color', color);
    el.style.setProperty('--fa-secondary-opacity', 1);
    wrap.appendChild(el);
  }
})();

(function () {
  const DEFAULT_PAGE = 'home.html';
  const BRAND = 'Brewers Prep';

  // Ensure FA brand family if the kit loader is present (safe no-op otherwise)
  try {
    if (window.FontAwesomeConfig) {
      window.FontAwesomeConfig.autoA11y = true;
    }
  } catch (_) { }

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
