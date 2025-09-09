import { setDefaultIconFamily } from 'https://early.webawesome.com/webawesome@3.0.0-beta.4/dist/webawesome.js';
import { renderBJCPDetailsLearn } from './learn-pane.js';
setDefaultIconFamily('classic');

import { createQuizCard, wirePageControls } from './quiz-card.js';

(function () {
  async function init() {
    const params = new URLSearchParams(window.location.search);
    const styleName = params.get('style');
    if (!styleName) {
      document.body.innerHTML = '<p style="color:red">No style specified.</p>';
      return;
    }

    // Page chrome
    document.title = `${styleName} Details`;
    const titleEl = document.getElementById('quiz-title');
    if (titleEl) titleEl.textContent = `${styleName} Details`;

    // ---- Load BJCP details ----
    const resp = await fetch('data/bjcp-details.json');
    const data = await resp.json();

    // Find the style within nested categories
    let details = null;
    let categoryName = "";

    for (const [catName, styles] of Object.entries(data)) {
      if (styles[styleName]) {
        details = styles[styleName];
        categoryName = catName;
        break;
      }
    }

    const learnPanel = document.querySelector('wa-tab-panel[name="learn"]');
    renderBJCPDetailsLearn({ container: learnPanel, styleName, categoryName, details });

    if (!details) {
      document.body.innerHTML = `<p style="color:red">Style “${styleName}” not found.</p>`;
      return;
    }

    // Flatten other styles for distractor pools
    const allStylesFlat = [];
    for (const styles of Object.values(data)) {
      for (const [nm, det] of Object.entries(styles)) {
        allStylesFlat.push({ name: nm, details: det });
      }
    }

    // Helpers
    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
    function uniq(arr) {
      const seen = new Set();
      const out = [];
      for (const v of arr) {
        const s = String(v).trim();
        if (!seen.has(s)) { seen.add(s); out.push(s); }
      }
      return out;
    }
    function sample(arr, n) {
      const a = shuffle(arr);
      return a.slice(0, Math.max(0, n));
    }

    const form = document.getElementById('quiz-form');
    const grid = document.createElement('div');
    grid.className = 'quiz-grid';
    form.appendChild(grid);

    // ---- Narrative sections (multi-select) ----
    const narrativeKeys = [
      'Overall Impression', 'Appearance', 'Aroma', 'Flavor', 'Mouthfeel',
      'Comments', 'History', 'Characteristic Ingredients', 'Style Comparison'
    ];

    narrativeKeys.forEach((key) => {
      const correctList = uniq((details[key] || []).filter(Boolean));
      if (!correctList.length) return; // skip empty sections gracefully

      // Pool from other styles' same section
      const pool = [];
      for (const { name, details: det } of allStylesFlat) {
        if (name === styleName) continue;
        (det[key] || []).forEach(item => pool.push(item));
      }
      const distractorCount = correctList.length; // preserve original behavior: ~50/50 correct/distractors
      const distractors = sample(uniq(pool).filter(x => !correctList.includes(String(x).trim())), distractorCount);

      const options = shuffle(uniq([...correctList, ...distractors])).map(v => ({ value: v }));

      const card = createQuizCard({
        id: key.replace(/\W+/g, '_'),
        title: `${key} (select all that apply)`,
        type: 'multi',
        options,
        correctValues: correctList,
        shuffle: false // we already shuffled options above
      });

      grid.appendChild(card);
    });

    // ---- Vital Stats (single-select) ----
    const statMap = {
      IBU: 'Bitterness (IBU)',
      SRM: 'Color (SRM)',
      OG: 'Original Gravity',
      FG: 'Final Gravity',
      ABV: 'Alcohol (ABV)'
    };
    const stats = details['Vital Statistics'] || {};

    Object.keys(statMap).forEach((key) => {
      const correct = stats[key];
      if (!correct) return;

      const pool = [];
      for (const { name, details: det } of allStylesFlat) {
        if (name === styleName) continue;
        const val = det['Vital Statistics'] && det['Vital Statistics'][key];
        if (val) pool.push(val);
      }
      const distractors = sample(uniq(pool).filter(x => String(x).trim() !== String(correct).trim()), 3);
      const options = shuffle(uniq([String(correct), ...distractors])).map(v => ({ value: v }));

      const card = createQuizCard({
        id: `stat_${key}`,
        title: statMap[key],
        type: 'single',
        options,
        correctValues: [String(correct)],
        shuffle: false
      });

      grid.appendChild(card);
    });

    // ---- Wire global top/bottom controls ----
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

    // ---- Responsive auto-spanning (same behavior used elsewhere) ----
    const MAX_HEIGHT = 260; // px of summed options height before widening
    const MAX_SPAN = 4;

    function computeMinBaseWidth(gridEl) {
      const gridStyles = getComputedStyle(gridEl);
      const template = gridStyles.getPropertyValue('grid-template-columns') || '';
      const m = template.match(/minmax\((\d+)px,\s*1fr\)/);
      return m ? parseInt(m[1], 10) : 280;
    }

    function updateCardSpans() {
      const cards = Array.from(grid.querySelectorAll('.quiz-card'));
      if (!cards.length) return;

      cards.forEach(c => c.classList.remove('span-2', 'span-3', 'span-4'));

      requestAnimationFrame(() => {
        const minBaseWidth = computeMinBaseWidth(grid);
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

    window.addEventListener('load', () => {
      updateCardSpans();
      setTimeout(updateCardSpans, 250);
    });
    window.addEventListener('resize', debouncedUpdate);

    form.addEventListener('change', (e) => {
      const target = e.target;
      if (target && (target.matches('input[type="checkbox"]') || target.matches('input[type="radio"]'))) {
        setTimeout(updateCardSpans, 50);
      }
    });

    // Recalc after per-card check (createQuizCard emits .check-btn)
    form.addEventListener('click', (e) => {
      const target = e.target;
      if (target && target.closest('.check-btn')) {
        setTimeout(updateCardSpans, 50);
      }
    });

    // Recalc after global "Check All"
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (target && (target.id === 'check-button' || target.closest('#check-button'))) {
        setTimeout(updateCardSpans, 50);
      }
    });

    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(debouncedUpdate);
      ro.observe(grid);
    }

    // Expose for debugging
    window.updateCardSpans = updateCardSpans;
  }

  window.addEventListener('DOMContentLoaded', init);
})();
