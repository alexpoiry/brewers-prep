// ---- moved from inline script ----
import { setDefaultIconFamily } from 'https://early.webawesome.com/webawesome@3.0.0-beta.4/dist/webawesome.js';
    setDefaultIconFamily('classic');

// ---- moved from inline script ----
// Utility to shuffle an array
    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    window.addEventListener('DOMContentLoaded', async () => {
      const params = new URLSearchParams(location.search);
      const source = params.get('source') || 'ba';
      const styleName = params.get('style');
      if (!styleName) {
        document.body.innerHTML = '<p style="color:red">No style specified.</p>';
        return;
      }
      document.getElementById('title').textContent = styleName;

      const resp = await fetch('data/details.json');
      const data = await resp.json();

      // Find style in nested JSON
      let styleObj = null;
      let siblingStyles = null;
      for (const family of Object.values(data)) {
        for (const group of Object.values(family)) {
          if (group[styleName]) {
            styleObj = group[styleName];
            siblingStyles = group;
            break;
          }
        }
        if (styleObj) break;
      }
      if (!styleObj) {
        document.body.innerHTML = `<p style="color:red">Style “${styleName}” not found in data.</p>`;
        return;
      }

      const characteristics = [
        'color', 'clarity', 'perceived_malt_aroma_and_flavor',
        'perceived_hop_aroma_and_flavor', 'perceived_bitterness',
        'fermentation_characteristics', 'body',
        'original_gravity', 'final_gravity', 'alcohol',
        'bitterness_ibu', 'color_srm'
      ];

      const form = document.getElementById('quiz-form');
      const correctAnswers = {};

      // Randomize question order
      shuffle(characteristics);


      const grid = document.createElement('div');
      grid.className = 'quiz-grid';
      form.appendChild(grid);

      characteristics.forEach(key => {
        const card = document.createElement('wa-card');
        card.className = 'quiz-card';
        card.id = `card-${key}`;
        card.setAttribute('elevated', '');

        const headerSlot = document.createElement('div');
        headerSlot.setAttribute('slot', 'header');
        const header = document.createElement('h3');
        header.textContent = key.replace(/_/g, ' ');
        headerSlot.appendChild(header);
        card.appendChild(headerSlot);

        const correctValue = styleObj[key] || 'N/A';
        correctAnswers[key] = correctValue;

        // Collect distractors
        const options = new Set([correctValue]);
        const others = Object.entries(siblingStyles)
          .filter(([name, obj]) => name !== styleName && obj[key])
          .map(([_, obj]) => obj[key]);
        shuffle(others);
        for (let i = 0; i < 4 && i < others.length; i++) {
          if (others[i] !== correctValue) options.add(others[i]);
        }

        const opts = shuffle(Array.from(options));
        const optionsWrap = document.createElement('div');
        optionsWrap.className = 'options-wrap';
        opts.forEach(val => {
          const label = document.createElement('label');
          label.className = 'option';
          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = key;
          radio.value = val;
          label.appendChild(radio);
          const span = document.createElement('span');
          span.textContent = ` ${val}`;
          label.appendChild(span);
          optionsWrap.appendChild(label);
        });
        card.appendChild(optionsWrap);

        // Footer with feedback + Check button
        const footer = document.createElement('div');
        footer.setAttribute('slot', 'footer');
        footer.className = 'wa-split';
        const feedbackDiv = document.createElement('div');
        feedbackDiv.id = `fb-${key}`;
        feedbackDiv.className = 'feedback';
        footer.appendChild(feedbackDiv);

        const btn = document.createElement('wa-button');
        btn.setAttribute('variant', 'brand');
        btn.className = 'check-card';
        btn.dataset.key = key;
        btn.textContent = 'Check';
        footer.appendChild(btn);

        card.appendChild(footer);
        grid.appendChild(card);
      });

      // Per-card validation
      form.addEventListener('click', (e) => {
        const target = e.target;
        if (target.matches('wa-button.check-card, wa-button.check-card *')) {
          const btn = target.closest('wa-button.check-card');
          if (!btn) return;
          e.preventDefault();
          const key = btn.dataset.key;
          const selected = document.querySelector(`input[name="${key}"]:checked`);
          const fb = document.getElementById(`fb-${key}`);
          const card = document.getElementById(`card-${key}`);
          const isCorrect = !!(selected && selected.value === correctAnswers[key]);
          if (isCorrect) {
            fb.textContent = 'Correct!';
            card.classList.remove('card-incorrect');
            card.classList.add('card-correct');
          } else {
            fb.textContent = 'Try again!';
            card.classList.remove('card-correct');
            card.classList.add('card-incorrect');
          }
          if (window.updateCardSpans) setTimeout(window.updateCardSpans, 50);
        }
      });


      document.getElementById('check-button').addEventListener('click', e => {
        e.preventDefault();
        characteristics.forEach(key => {
          const selected = document.querySelector(`input[name="${key}"]:checked`);
          const fb = document.getElementById(`fb-${key}`);
          if (selected && selected.value === correctAnswers[key]) {
            fb.textContent = 'Correct!';
          } else {
            fb.textContent = 'Try Again!';
          }
        });
      });
    });

// ---- moved from inline script ----
(function () {
      const MAX_SPAN = 4;
      const MAX_HEIGHT = 150

      function computeMinBaseWidth(cards) {
        let minW = Infinity;
        for (const c of cards) {
          const rect = c.getBoundingClientRect();
          const w = rect.width || c.offsetWidth || 0;
          if (w > 0 && w < minW) minW = w;
        }
        if (!isFinite(minW) || minW <= 0) return 0;
        return minW;
      }

      function updateCardSpans() {
        const cards = Array.from(document.querySelectorAll('.quiz-card'));
        if (!cards.length) return;

        // Reset to baseline so we can measure true base widths
        cards.forEach(c => c.classList.remove('span-2', 'span-3', 'span-4'));

        requestAnimationFrame(() => {
          const minBaseWidth = computeMinBaseWidth(cards);
          if (!minBaseWidth) return;

          cards.forEach(card => {
            const options = card.querySelectorAll('label.option');
            const lineHeight = Array.from(options).reduce((sum, option) => {
              return sum + option.offsetHeight;
            }, 0);
            if (!lineHeight) return;
            let span = Math.ceil(lineHeight / MAX_HEIGHT);
            if (span < 1) span = 1;
            if (span > MAX_SPAN) span = MAX_SPAN;

            if (span > 1) card.classList.add(`span-${span}`);
          });
        });
      }

      window.updateCardSpans = updateCardSpans;

      let t;
      function debouncedUpdate() {
        clearTimeout(t);
        t = setTimeout(updateCardSpans, 120);
      }

      window.addEventListener('load', () => {
        updateCardSpans();
        setTimeout(updateCardSpans, 250);
      });
      window.addEventListener('resize', debouncedUpdate);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(debouncedUpdate).catch(() => { });
      }

      // Update spans after global "Check All" as well
      document.addEventListener('click', (e) => {
        if (e.target && (e.target.id === 'check-button' || e.target.closest('#check-button'))) {
          setTimeout(updateCardSpans, 50);
        }
      });

      const grid = document.querySelector('.quiz-grid');
      if (grid && 'ResizeObserver' in window) {
        const ro = new ResizeObserver(debouncedUpdate);
        ro.observe(grid);
      }
    })();
