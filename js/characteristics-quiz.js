
import { setDefaultIconFamily } from 'https://early.webawesome.com/webawesome@3.0.0-beta.4/dist/webawesome.js';
setDefaultIconFamily('classic');

import { createQuizCard, wirePageControls } from './quiz-card.js';

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

window.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const styleName = params.get('style');
  if (!styleName) {
    document.body.innerHTML = '<p style="color:red">No style specified.</p>';
    return;
  }
  const titleEl = document.getElementById('title');
  if (titleEl) titleEl.textContent = styleName;

  // ---- Load data & find the selected style ----
  const resp = await fetch('data/details.json');
  const data = await resp.json();

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

  // ---- Characteristics we quiz on (single-select) ----
  const characteristics = [
    'color', 'clarity', 'perceived_malt_aroma_and_flavor',
    'perceived_hop_aroma_and_flavor', 'perceived_bitterness',
    'fermentation_characteristics', 'body',
    'original_gravity', 'final_gravity', 'alcohol',
    'bitterness_ibu', 'color_srm'
  ];

  // Randomize question order for variety
  shuffle(characteristics);

  const form = document.getElementById('quiz-form');
  const grid = document.createElement('div');
  grid.className = 'quiz-grid';
  form.appendChild(grid);

  // ---- Build cards using the shared quiz-card.js ----
  characteristics.forEach((key) => {
    const correctValue = styleObj[key] ?? 'N/A';

    // Build distractor pool from sibling styles
    const pool = Object.entries(siblingStyles)
      .filter(([name, obj]) => name !== styleName && obj && obj[key])
      .map(([, obj]) => obj[key]);

    shuffle(pool);

    // Use up to 4 distractors (unique; excluding the correct value)
    const optionSet = new Set([correctValue]);
    for (const val of pool) {
      if (optionSet.size >= 5) break;
      if (val !== correctValue) optionSet.add(val);
    }

    // To Array<{ value, label? }>
    const options = shuffle(Array.from(optionSet)).map(v => ({ value: v }));

    const title = key.replace(/_/g, ' ');

    const card = createQuizCard({
      id: key,
      title,
      type: 'single',
      options,
      correctValues: [correctValue],
      shuffle: false // we already shuffled above to control uniqueness first
    });

    grid.appendChild(card);
  });

  // ---- Wire global controls (top & bottom button groups) ----
  const checkBtns = Array.from(document.querySelectorAll('#check-button'));
  const resetBtns = Array.from(document.querySelectorAll('#redo-button'));
  const n = Math.max(checkBtns.length, resetBtns.length);
  for (let i = 0; i < n; i++) {
    wirePageControls({
      form,
      checkButton: checkBtns[i],
      resetButton: resetBtns[i]
    });
  }

  // ---- Responsive auto-spanning (keep existing advanced behavior) ----
  // This preserves the dynamic 1–4 column span logic based on measured option height,
  // so long descriptions get more width. Works with quiz-card.js markup (.quiz-card, label.option).
  const MAX_HEIGHT = 260; // px of options' total line-height per card before we increase span
  const MAX_SPAN = 4;

  function computeMinBaseWidth(cards) {
    // Use the smallest "min" in minmax(min, 1fr) from the CSS grid to estimate column width.
    // Fallback to 280px if not measurable.
    const gridStyles = getComputedStyle(grid);
    const template = gridStyles.getPropertyValue('grid-template-columns') || '';
    // Try to parse "minmax(280px, 1fr)"
    const m = template.match(/minmax\((\d+)px,\s*1fr\)/);
    return m ? parseInt(m[1], 10) : 280;
  }

  function updateCardSpans() {
    const cards = Array.from(document.querySelectorAll('.quiz-card'));
    if (!cards.length) return;

    // Reset span classes
    cards.forEach(c => c.classList.remove('span-2', 'span-3', 'span-4'));

    requestAnimationFrame(() => {
      const minBaseWidth = computeMinBaseWidth(cards);
      if (!minBaseWidth) return;

      cards.forEach(card => {
        const options = card.querySelectorAll('label.option');
        const totalHeight = Array.from(options).reduce((sum, el) => sum + el.offsetHeight, 0);
        if (!totalHeight) return;

        let span = Math.ceil(totalHeight / MAX_HEIGHT);
        if (span < 1) span = 1;
        if (span > MAX_SPAN) span = MAX_SPAN;

        if (span > 1) card.classList.add(`span-${span}`);
      });
    });
  }

  let t;
  function debouncedUpdate() {
    clearTimeout(t);
    t = setTimeout(updateCardSpans, 120);
  }

  // Initial + delayed reflow
  window.addEventListener('load', () => {
    updateCardSpans();
    setTimeout(updateCardSpans, 250);
  });

  // Recalculate on resize, input changes, and button clicks
  window.addEventListener('resize', debouncedUpdate);

  form.addEventListener('change', (e) => {
    if (e.target && (e.target.matches('input[type="checkbox"]') || e.target.matches('input[type="radio"]'))) {
      setTimeout(updateCardSpans, 50);
    }
  });

  // Recalc after per-card "Check" (from quiz-card.js)
  form.addEventListener('click', (e) => {
    if (e.target && (e.target.closest('.check-btn'))) {
      setTimeout(updateCardSpans, 50);
    }
  });

  // Recalc after global "Check All"
  document.addEventListener('click', (e) => {
    if (e.target && (e.target.id === 'check-button' || e.target.closest('#check-button'))) {
      setTimeout(updateCardSpans, 50);
    }
  });

  // Observe grid size changes
  if (grid && 'ResizeObserver' in window) {
    const ro = new ResizeObserver(debouncedUpdate);
    ro.observe(grid);
  }

  // Expose for debugging if needed
  window.updateCardSpans = updateCardSpans;
});
