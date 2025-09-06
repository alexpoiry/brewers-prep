import { setDefaultIconFamily } from 'https://early.webawesome.com/webawesome@3.0.0-beta.4/dist/webawesome.js';
setDefaultIconFamily('classic');

(function () {
  async function init() {
    const form = document.getElementById('quiz-form');
    if (!form) return;

    document.title = 'Beer Basics Quiz';
    const titleEl = document.getElementById('quiz-title');
    if (titleEl) titleEl.textContent = 'Beer Basics Quiz';

    // Utils
    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    const grid = document.createElement('div');
    grid.className = 'quiz-grid';
    form.appendChild(grid);

    // Load questions
    let questions = [];
    try {
      const resp = await fetch('data/beer-basics-quiz.json', { cache: 'no-store' });
      const data = await resp.json();
      questions = Array.isArray(data.questions) ? data.questions : [];
    } catch (err) {
      const callout = document.createElement('wa-callout');
      callout.setAttribute('variant', 'danger');
      callout.innerHTML = '<p>Unable to load Beer Basics questions.</p>';
      form.appendChild(callout);
      console.error(err);
      return;
    }

    // Build cards
    questions.forEach((q, idx) => {
      const isMulti = Array.isArray(q.correct);
      const name = q.id || `q${idx}`;

      const card = document.createElement('wa-card');
      card.className = 'quiz-card';
      card.dataset.name = name;
      card.dataset.type = isMulti ? 'multi' : 'single';

      // Header
      const header = document.createElement('div');
      header.className = 'card-header';
      const h = document.createElement('h3');
      h.textContent = (q.question || q.term || 'Question') + (isMulti ? ' (select all that apply)' : '');
      header.appendChild(h);
      card.appendChild(header);

      // Options
      const optionsWrap = document.createElement('div');
      optionsWrap.className = 'options';

      if (isMulti) {
        const list = [...(q.correct || []), ...(q.incorrect || [])].filter(Boolean);
        shuffle(list).forEach(opt => {
          const id = `${name}-${String(opt).replace(/\W+/g, '_')}`;
          const label = document.createElement('label');
          label.className = 'option';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.name = name;
          cb.value = opt;
          cb.id = id;
          label.htmlFor = id;
          label.append(opt);
          label.prepend(cb);
          optionsWrap.appendChild(label);
        });
        card.dataset.correctList = JSON.stringify((q.correct || []).filter(Boolean));
      } else {
        const list = [q.correct, ...(q.incorrect || [])].filter(Boolean);
        shuffle(list).forEach(opt => {
          const id = `${name}-${String(opt).replace(/\W+/g, '_')}`;
          const label = document.createElement('label');
          label.className = 'option';
          const rb = document.createElement('input');
          rb.type = 'radio';
          rb.name = name;
          rb.value = opt;
          rb.id = id;
          label.htmlFor = id;
          label.append(opt);
          label.prepend(rb);
          optionsWrap.appendChild(label);
        });
        card.dataset.correct = q.correct || '';
      }
      card.appendChild(optionsWrap);

      // Footer (visible — no slot attr)
      const footer = document.createElement('div');
      footer.className = 'card-footer wa-split';

      // Feedback on the left
      const feedbackDiv = document.createElement('div');
      feedbackDiv.id = `fb-${name}`;
      feedbackDiv.className = 'feedback';
      footer.appendChild(feedbackDiv);

      // Actions on the right
      const actions = document.createElement('div');
      actions.className = 'actions';

      if (isMulti) {
        const ring = document.createElement('wa-progress-ring');
        ring.className = 'card-progress';
        ring.value = 0;
        ring.textContent = '0/0';
        actions.appendChild(ring);
      }

      const checkBtn = document.createElement('wa-button');
      checkBtn.variant = 'brand';
      checkBtn.innerHTML = 'Check';
      checkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        validateCard(card, true);
        if (window.updateCardSpans) setTimeout(window.updateCardSpans, 50);
      });
      actions.appendChild(checkBtn);

      footer.appendChild(actions);
      card.appendChild(footer);

      // Explanation (if provided)
      if (q.explanation) {
        const exp = document.createElement('div');
        exp.className = 'explanation';
        exp.style.display = 'none';
        exp.textContent = q.explanation;
        card.appendChild(exp);
      }

      grid.appendChild(card);
    });

    // ---- Validation helpers ----
    function validateCard(card, revealExplanation = false) {
      const type = card.dataset.type;
      const feedback = card.querySelector('.feedback');

      if (type === 'single') {
        const correct = card.dataset.correct || '';
        const name = card.dataset.name;
        const sel = card.querySelector(`input[name="${CSS.escape(name)}"]:checked`);
        const isCorrect = !!sel && sel.value === correct;

        feedback.textContent = isCorrect ? 'Correct!' : 'Try again!';
        card.classList.toggle('card-correct', isCorrect);
        card.classList.toggle('card-incorrect', !isCorrect);

        const exp = card.querySelector('.explanation');
        if (exp && revealExplanation) exp.style.display = isCorrect ? '' : 'none';
        return isCorrect;
      }

      // multi
      const correctList = JSON.parse(card.dataset.correctList || '[]');
      const name = card.dataset.name;
      const correctSet = new Set(correctList);
      const checked = Array.from(card.querySelectorAll(`input[name="${CSS.escape(name)}"]:checked`)).map(i => i.value);
      const chosenSet = new Set(checked);
      const correctSelectedCount = checked.filter(v => correctSet.has(v)).length;
      const denom = correctSet.size || 1;

      // ring update
      const ringEl = card.querySelector('wa-progress-ring.card-progress');
      if (ringEl) {
        const pct = Math.round((correctSelectedCount / denom) * 100);
        ringEl.value = pct;
        ringEl.textContent = `${correctSelectedCount}/${denom}`;
        ringEl.style.setProperty('--size','40px');
        ringEl.style.setProperty('--track-width','6px');
        ringEl.style.setProperty('--indicator-width','6px');
      }

      let isCorrect = (chosenSet.size === correctSet.size);
      if (isCorrect) {
        for (const v of correctSet) { if (!chosenSet.has(v)) { isCorrect = false; break; } }
      }

      feedback.textContent = isCorrect ? 'Correct!' : 'Try again!';
      card.classList.toggle('card-correct', isCorrect);
      card.classList.toggle('card-incorrect', !isCorrect);

      const exp = card.querySelector('.explanation');
      if (exp && revealExplanation) exp.style.display = isCorrect ? '' : 'none';
      return isCorrect;
    }

    // ---- Global "Check My Answers" & "Reset" ----
    // Bind to ALL instances to tolerate duplicate IDs in the HTML
    document.querySelectorAll('#check-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.quiz-card').forEach(card => validateCard(card, true));
        if (window.updateCardSpans) setTimeout(window.updateCardSpans, 50);
      });
    });

    document.querySelectorAll('#redo-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.quiz-card').forEach(card => {
          card.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(i => { i.checked = false; });
          card.classList.remove('card-correct', 'card-incorrect');
          const fb = card.querySelector('.feedback'); if (fb) fb.textContent = '';
          const ringEl = card.querySelector('wa-progress-ring.card-progress'); if (ringEl) { ringEl.value = 0; ringEl.textContent = '0/0'; }
          const exp = card.querySelector('.explanation'); if (exp) exp.style.display = 'none';
        });
        if (window.updateCardSpans) setTimeout(window.updateCardSpans, 50);
      });
    });

    // ---- Responsive grid spanning (copied to match BJCP details) ----
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

      cards.forEach(c => c.classList.remove('span-2', 'span-3', 'span-4'));

      requestAnimationFrame(() => {
        const minBaseWidth = computeMinBaseWidth(cards);
        if (!minBaseWidth) return;

        cards.forEach(card => {
          const options = card.querySelectorAll('label.option');
          const heightSum = Array.from(options).reduce((sum, option) => sum + option.offsetHeight, 0);
          if (!heightSum) return;
          let span = Math.ceil(heightSum / MAX_HEIGHT);
          if (span > MAX_SPAN) span = MAX_SPAN;
          if (span >= 2) card.classList.add(`span-${span}`);
        });
      });
    }
    window.updateCardSpans = updateCardSpans;

    function debounce(fn, delay = 150) {
      let t = null;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(null, args), delay);
      };
    }
    const debouncedUpdate = debounce(updateCardSpans, 200);

    document.addEventListener('change', (e) => {
      if ((e.target && (e.target.matches('input[type="checkbox"]') || e.target.matches('input[type="radio"]')))) {
        setTimeout(updateCardSpans, 50);
      }
    });

    const gridEl = document.querySelector('.quiz-grid');
    if (gridEl && 'ResizeObserver' in window) {
      const ro = new ResizeObserver(debouncedUpdate);
      ro.observe(gridEl);
    }

    // first layout
    setTimeout(updateCardSpans, 50);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
