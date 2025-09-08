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
  document.title = 'Beer Basics Quiz';
  const titleEl = document.getElementById('quiz-title');
  if (titleEl) titleEl.textContent = 'Beer Basics Quiz';

  const form = document.getElementById('quiz-form');
  if (!form) return;

  // Ensure grid classes to match existing layout/styles
  form.classList.add('gen-grid');

  // Load questions
  let data;
  try {
    const resp = await fetch('data/beer-basics-quiz.json');
    data = await resp.json();
  } catch (e) {
    const callout = document.createElement('wa-callout');
    callout.variant = 'danger';
    callout.innerHTML = '<p>Unable to load quiz data.</p>';
    form.replaceWith(callout);
    return;
  }

  const questions = data?.questions || [];
  questions.forEach((q, idx) => {
    const isMulti = Array.isArray(q.correct) || q.type === 'multi';
    const correctValues = isMulti ? (Array.isArray(q.correct) ? q.correct : []) : [q.correct];

    const incorrect = Array.isArray(q.incorrect) ? q.incorrect : [];
    const correctOptions = isMulti ? correctValues.map(v => ({ value: v })) : [{ value: correctValues[0] }];

    const allOptions = shuffle([
      ...correctOptions,
      ...incorrect.map(v => ({ value: v }))
    ]);

    const card = createQuizCard({
      id: q.id || `bb_${idx}`,
      title: q.question || q.term || `Question ${idx + 1}`,
      type: isMulti ? 'multi' : 'single',
      options: allOptions,
      correctValues
    });

    form.appendChild(card);
  });

  // Wire global controls
  const checkButton = document.getElementById('check-button');
  const resetButton = document.getElementById('redo-button');
  wirePageControls({ form, checkButton, resetButton });
});
