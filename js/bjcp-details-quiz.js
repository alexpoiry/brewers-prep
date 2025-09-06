import { setDefaultIconFamily } from 'https://early.webawesome.com/webawesome@3.0.0-beta.4/dist/webawesome.js';
    setDefaultIconFamily('classic');

(function () {
      async function init() {
        const params = new URLSearchParams(window.location.search);
        const styleName = params.get('style');
        if (!styleName) {
          document.body.innerHTML = '<p style="color:red">No style specified.</p>';
          return;
        }

        const resp = await fetch('data/bjcp-details.json');
        const data = await resp.json();

        // Find the style within nested categories
        let details = null;
        for (const styles of Object.values(data)) {
          if (styles[styleName]) {
            details = styles[styleName];
            break;
          }
        }
        if (!details) {
          document.body.innerHTML = `<p style="color:red">Style "${styleName}" not found.</p>`;
          return;
        }

        document.title = `${styleName} Details Quiz`;
        document.getElementById('quiz-title').textContent = `${styleName} Details Quiz`;

        const form = document.getElementById('quiz-form');

        // Utility helpers
        function shuffle(arr) {
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
          }
        }
        function sample(arr, n) {
          const copy = arr.slice(); shuffle(copy); return copy.slice(0, n);
        }

        const grid = document.createElement('div');
        grid.className = 'quiz-grid';
        form.appendChild(grid);

        // ---- Narrative sections (multi-select) ----
        const narrativeKeys = [
          'Overall Impression', 'Appearance', 'Aroma', 'Flavor', 'Mouthfeel',
          'Comments', 'History', 'Characteristic Ingredients', 'Style Comparison'
        ];

        const allStylesFlat = [];
        for (const styles of Object.values(data)) {
          for (const [nm, det] of Object.entries(styles)) {
            allStylesFlat.push({name: nm, details: det});
          }
        }

        narrativeKeys.forEach(key => {
          const correctList = (details[key] || []).filter(Boolean);
          const count = correctList.length || 2;

          // Build distractor pool from all other styles
          const pool = [];
          for (const {name, details: det} of allStylesFlat) {
            if (name === styleName) continue;
            (det[key] || []).forEach(item => pool.push(item));
          }
          const distractors = sample(pool.filter(x => !correctList.includes(x)), count);
          const options = correctList.concat(distractors);
          shuffle(options);

          const card = document.createElement('wa-card');
          card.className = 'quiz-card';
          card.setAttribute('elevated', '');

          // Header
          const headerSlot = document.createElement('div');
          headerSlot.setAttribute('slot', 'header');
          const header = document.createElement('h3');
          header.textContent = `${key} (select all that apply)`;
          headerSlot.appendChild(header);
          card.appendChild(headerSlot);

          // Options
          const optionsWrap = document.createElement('div');
          optionsWrap.className = 'options';
          options.forEach(text => {
            const id = `${key}-${text}`.replace(/\W+/g, '_');
            const label = document.createElement('label');
            label.className = 'option';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.name = key;
            cb.value = text;
            cb.id = id;
            label.htmlFor = id;
            label.append(text);
            label.prepend(cb);
            optionsWrap.appendChild(label);
          });
          card.appendChild(optionsWrap);

          // Footer with feedback + Check button + progress ring (for multi-select)
          const footer = document.createElement('div');
          footer.setAttribute('slot', 'footer');
          footer.className = 'wa-split';
          const feedbackDiv = document.createElement('div');
          feedbackDiv.id = `fb-${key.replace(/\W+/g,'_')}`;
          feedbackDiv.className = 'feedback';
          footer.appendChild(feedbackDiv);

          const btn = document.createElement('wa-button');
          btn.setAttribute('variant', 'brand');
          btn.className = 'check-card';
          btn.dataset.key = key;
          btn.textContent = 'Check';

          // Right-side controls: Check button + ring
          const actions = document.createElement('div');
          actions.className = 'card-actions';
          actions.style.display = 'inline-flex';
          actions.style.alignItems = 'center';
          actions.style.gap = '.5rem';

          const ring = document.createElement('wa-progress-ring');
          ring.className = 'card-progress';
          ring.value = 0;
          ring.setAttribute('label', `${key} progress`);
          ring.style.setProperty('--size','40px');
          ring.style.setProperty('--track-width','6px');
          ring.style.setProperty('--indicator-width','6px');
          ring.textContent = '0%';

          actions.appendChild(btn);
          actions.appendChild(ring);
          footer.appendChild(actions);

          card.appendChild(footer);
          grid.appendChild(card);
        });

        // ---- Vital statistics (single select) ----
        const statMap = { IBU: 'Bitterness (IBU)', SRM: 'Color (SRM)', OG: 'Original Gravity', FG: 'Final Gravity', ABV: 'Alcohol (ABV)' };
        const stats = details['Vital Statistics'] || {};
        Object.keys(statMap).forEach(key => {
          const correct = stats[key];
          if (!correct) return;

          // Build distractor pool from other styles
          const pool = [];
          for (const {name, details: det} of allStylesFlat) {
            if (name === styleName) continue;
            const val = det['Vital Statistics'] && det['Vital Statistics'][key];
            if (val) pool.push(val);
          }
          const distractors = sample(pool.filter(x => x !== correct), 3);
          const options = [correct].concat(distractors);
          shuffle(options);

          const card = document.createElement('wa-card');
          card.className = 'quiz-card';
          card.setAttribute('elevated', '');

          const headerSlot = document.createElement('div');
          headerSlot.setAttribute('slot', 'header');
          const header = document.createElement('h3');
          header.textContent = statMap[key];
          headerSlot.appendChild(header);
          card.appendChild(headerSlot);

          const optionsWrap = document.createElement('div');
          optionsWrap.className = 'options';
          options.forEach(text => {
            const id = `${key}-${text}`.replace(/\W+/g, '_');
            const label = document.createElement('label');
            label.className = 'option';
            const rb = document.createElement('input');
            rb.type = 'radio';
            rb.name = key;
            rb.value = text;
            rb.id = id;
            label.htmlFor = id;
            label.append(text);
            label.prepend(rb);
            optionsWrap.appendChild(label);
          });
          card.appendChild(optionsWrap);

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

        // ---- Per-card validation ----
        form.addEventListener('click', (e) => {
          const target = e.target;
          if (target.matches('wa-button.check-card, wa-button.check-card *')) {
            const btn = target.closest('wa-button.check-card');
            if (!btn) return;
            e.preventDefault();

            const key = btn.dataset.key;
            const card = btn.closest('.quiz-card');
            const feedback = card.querySelector('.feedback');

            if (narrativeKeys.includes(key)) {
              const correctSet = new Set((details[key] || []).filter(Boolean));
              const checked = Array.from(card.querySelectorAll(`input[name="${CSS.escape(key)}"]:checked`)).map(i => i.value);
              const chosenSet = new Set(checked);
              const correctSelectedCount = checked.filter(v => correctSet.has(v)).length;
              const denom = correctSet.size || 1;
              const pct = Math.round((correctSelectedCount / denom) * 100);
              const ringEl = card.querySelector('wa-progress-ring.card-progress');
              if (ringEl) { ringEl.value = pct; ringEl.textContent = `${correctSelectedCount}/${denom}`; }
              let isCorrect = (chosenSet.size === correctSet.size);
              if (isCorrect) {
                for (const v of correctSet) { if (!chosenSet.has(v)) { isCorrect = false; break; } }
              }
              feedback.textContent = isCorrect ? 'Correct!' : 'Try again!';
              card.classList.toggle('card-correct', isCorrect);
              card.classList.toggle('card-incorrect', !isCorrect);
            } else {
              const statKey = Object.keys(statMap).find(k => k === key);
              const correct = stats[statKey];
              const sel = card.querySelector(`input[name="${statKey}"]:checked`);
              const isCorrect = !!sel && sel.value === correct;
              feedback.textContent = isCorrect ? 'Correct!' : 'Try again!';
              card.classList.toggle('card-correct', isCorrect);
              card.classList.toggle('card-incorrect', !isCorrect);
            }

            if (window.updateCardSpans) setTimeout(window.updateCardSpans, 50);
          }
        });

        
        // ---- Global "Check My Answers" and "Reset" buttons ----
        const globalCheckBtn = document.getElementById('check-button');
        if (globalCheckBtn) {
          globalCheckBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Validate narrative (multi-select) cards
            narrativeKeys.forEach((key) => {
              const fbId = `fb-${key.replace(/\W+/g,'_')}`;
              const feedback = document.getElementById(fbId);
              const card = feedback ? feedback.closest('.quiz-card') : null;
              if (!feedback || !card) return;
              const correctSet = new Set((details[key] || []).filter(Boolean));
              const checked = Array.from(card.querySelectorAll(`input[name="${CSS.escape(key)}"]:checked`)).map(i => i.value);
              const chosenSet = new Set(checked);
              const correctSelectedCount = checked.filter(v => correctSet.has(v)).length;
              const denom = correctSet.size || 1;
              const ringEl = card.querySelector('wa-progress-ring.card-progress');
              if (ringEl) { 
                const pct = Math.round((correctSelectedCount / denom) * 100);
                ringEl.value = pct; 
                ringEl.textContent = `${correctSelectedCount}/${denom}`; 
              }
              let isCorrect = (chosenSet.size === correctSet.size);
              if (isCorrect) {
                for (const v of correctSet) { if (!chosenSet.has(v)) { isCorrect = false; break; } }
              }
              feedback.textContent = isCorrect ? 'Correct!' : 'Try again!';
              card.classList.toggle('card-correct', isCorrect);
              card.classList.toggle('card-incorrect', !isCorrect);
            });
            // Validate stat (single-select) cards
            Object.keys(statMap).forEach((statKey) => {
              const fbId = `fb-${statKey}`;
              const feedback = document.getElementById(fbId);
              const card = feedback ? feedback.closest('.quiz-card') : null;
              if (!feedback || !card) return;
              const correct = stats[statKey];
              const sel = card.querySelector(`input[name="${CSS.escape(statKey)}"]:checked`);
              const isCorrect = !!sel && sel.value === correct;
              feedback.textContent = isCorrect ? 'Correct!' : 'Try again!';
              card.classList.toggle('card-correct', isCorrect);
              card.classList.toggle('card-incorrect', !isCorrect);
            });
            if (window.updateCardSpans) setTimeout(window.updateCardSpans, 50);
          });
        }

        const globalResetBtn = document.getElementById('redo-button');
        if (globalResetBtn) {
          globalResetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Clear all selections
            document.querySelectorAll('.quiz-card input[type="checkbox"], .quiz-card input[type="radio"]').forEach(el => { el.checked = false; });
            // Clear feedback and classes; reset progress rings
            document.querySelectorAll('.quiz-card').forEach(card => {
              card.classList.remove('card-correct','card-incorrect');
              const fb = card.querySelector('.feedback');
              if (fb) fb.textContent = '';
              const ringEl = card.querySelector('wa-progress-ring.card-progress');
              if (ringEl) { ringEl.value = 0; ringEl.textContent = '0%'; }
            });
            if (window.updateCardSpans) setTimeout(window.updateCardSpans, 50);
          });
        }
// ---- Dynamic grid spanning based on content height ----
        const MAX_SPAN = 4;
        const MAX_HEIGHT = 150;

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
              const heightSum = Array.from(options).reduce((sum, option) => sum + option.offsetHeight, 0);
              if (!heightSum) return;
              let span = Math.ceil(heightSum / MAX_HEIGHT);
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

        // Kick initial measurement after first paint
        window.addEventListener('load', () => setTimeout(updateCardSpans, 50));
        window.addEventListener('resize', debouncedUpdate);
        document.addEventListener('waHydrated', () => setTimeout(updateCardSpans, 50));
        form.addEventListener('change', (e) => {
          if ((e.target && (e.target.matches('input[type="checkbox"]') || e.target.matches('input[type="radio"]')))) {
            setTimeout(updateCardSpans, 50);
          }
        });

        const gridEl = document.querySelector('.quiz-grid');
        if (gridEl && 'ResizeObserver' in window) {
          const ro = new ResizeObserver(debouncedUpdate);
          ro.observe(gridEl);
        }
      }

      window.addEventListener('DOMContentLoaded', init);
    })();
