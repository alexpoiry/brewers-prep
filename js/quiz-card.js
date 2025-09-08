
// js/quiz-card.js
// Shared quiz card builder & helpers, modeled after the bjcp-details-quiz layout.
//
// Exports:
//   createQuizCard({ id, title, options, type, correctValues, shuffle=true })
//   evaluateCard(card)
//   resetCard(card)
//   wirePageControls({ form, checkButton, resetButton })
//
// type: "single" for radios; "multi" for checkboxes
// options: Array<{ value: string, label?: string }>
// correctValues: Set<string> | Array<string>
//
// The card DOM structure (using Web Awesome) matches existing styles by using the "gen-card" class.
// <wa-card class="gen-card quiz-card">
//   <div slot="header" class="card-title"></div>
//   <wa-separator></wa-separator>
//   <div class="options"></div>
//   <wa-separator></wa-separator>
//   <div slot="footer" class="quiz-footer">
//     <div class="feedback" aria-live="polite"></div>
//     <div class="footer-actions">
//       <wa-button class="check-btn">
//         <wa-icon slot="start" name="check" variant="solid" label="Check"></wa-icon>
//         Check
//       </wa-button>
//       <!-- wa-progress-ring appended only for multi-select cards -->
//     </div>
//   </div>
// </wa-card>

/** Utility: shallow shuffle (Fisher–Yates) */
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Internal store of card configs */
const _cardConfig = new WeakMap();

/** Heuristic to decide if a card should span 2 columns */
function shouldSpanTwoColumns({ isMulti, options }) {
  const count = options.length;
  const longOption = options.some(o => (o.label ?? o.value ?? "").length > 60);
  if (isMulti && count >= 6) return true;
  if (count >= 8) return true;
  if (longOption) return true;
  return false;
}

/** Create a quiz card */
export function createQuizCard({ id, title, options, type, correctValues, shuffle = true }) {
  if (!id) id = crypto.randomUUID();
  const name = `q_${id}`;

  const correctSet = new Set(Array.isArray(correctValues) ? correctValues : [...correctValues || []]);
  const isMulti = type === "multi";
  const totalCorrect = correctSet.size;

  const card = document.createElement("wa-card");
  card.className = "gen-card quiz-card";
  card.dataset.cardId = id;

  // Header
  const headerSlot = document.createElement('div');
  headerSlot.setAttribute('slot', 'header');
  const header = document.createElement('h3');
  header.textContent = title || "Question";
  headerSlot.appendChild(header);
  card.appendChild(headerSlot);

  // Separator
  card.appendChild(document.createElement("wa-separator"));

  // Options
  const optionsWrap = document.createElement("div");
  optionsWrap.className = "options";

  const opts = shuffle ? shuffleArray(options) : options;
  opts.forEach((opt, idx) => {
    const label = document.createElement("label");
    label.className = "option";
    const input = document.createElement("input");
    input.type = isMulti ? "checkbox" : "radio";
    input.name = name;
    input.value = opt.value;
    const idStr = `${name}_${idx}`;
    input.id = idStr;
    label.htmlFor = idStr;
    label.append(input, document.createTextNode(" " + (opt.label ?? opt.value)));
    optionsWrap.appendChild(label);
  });
  card.appendChild(optionsWrap);

  // Dynamically expand width for dense/long cards
  if (shouldSpanTwoColumns({ isMulti, options: opts })) {
    card.style.gridColumn = "span 2";
  }

  // Separator
  card.appendChild(document.createElement("wa-separator"));

  // Footer
  const footer = document.createElement("div");
  footer.slot = "footer";
  footer.className = "quiz-footer";

  const feedback = document.createElement("div");
  feedback.className = "feedback";
  feedback.setAttribute("aria-live", "polite");

  const actions = document.createElement("div");
  actions.className = "footer-actions";

  const checkBtn = document.createElement("wa-button");
  checkBtn.className = "check-btn";
  // Let site CSS control appearance

  const icon = document.createElement("wa-icon");
  icon.setAttribute("slot", "start");
  icon.setAttribute("name", "check");
  icon.setAttribute("variant", "solid");
  icon.setAttribute("label", "Check");
  checkBtn.appendChild(icon);
  checkBtn.append("Check");

  actions.append(checkBtn);

  // Only multi-select cards use a progress ring
  let ring = null;
  if (isMulti) {
    ring = document.createElement("wa-progress-ring");
    ring.className = "progress";
    ring.style.setProperty('--size','40px');
    ring.style.setProperty('--track-width','6px');
    ring.style.setProperty('--indicator-width','6px');
    ring.value = 0;
    // Initial label "0/X"
    const labelSpan = document.createElement("span");
    labelSpan.textContent = `0/${totalCorrect}`;
    ring.append(labelSpan);
    ring.setAttribute("aria-label", `0 of ${totalCorrect} correct`);
    actions.append(ring);
  }

  footer.append(feedback, actions);
  card.appendChild(footer);

  // Save config
  _cardConfig.set(card, { isMulti, correctSet, totalCorrect, feedback, ring });

  // Attach per-card check
  checkBtn.addEventListener("click", () => {
    evaluateCard(card);
  });

  // Reset visual state when inputs change
  optionsWrap.addEventListener("change", () => {
    clearState(card);
  });

  return card;
}

/** Evaluate a card and apply visual feedback. Returns { correct, progress } */
export function evaluateCard(card) {
  const cfg = _cardConfig.get(card);
  if (!cfg) return { correct: false, progress: 0 };
  const { isMulti, correctSet, totalCorrect, feedback, ring } = cfg;

  const inputs = card.querySelectorAll('input[type="checkbox"], input[type="radio"]');
  const chosen = new Set();
  inputs.forEach(i => { if (i.checked) chosen.add(i.value); });

  const correctChosen = [...chosen].filter(v => correctSet.has(v)).length;
  const extraWrong = [...chosen].some(v => !correctSet.has(v));

  let isCorrect;
  let progress = 0;

  if (isMulti) {
    progress = totalCorrect ? Math.round((correctChosen / totalCorrect) * 100) : 0;
    isCorrect = (correctChosen === totalCorrect) && !extraWrong;
    if (ring) {
      ring.value = progress;
      // Update label "n/X"
      const labelSpan = ring.querySelector("span") || document.createElement("span");
      labelSpan.textContent = `${correctChosen}/${totalCorrect}`;
      if (!labelSpan.isConnected) ring.append(labelSpan);
      ring.setAttribute("aria-label", `${correctChosen} of ${totalCorrect} correct`);
    }
  } else {
    isCorrect = (correctChosen === 1) && !extraWrong && (chosen.size === 1);
    progress = isCorrect ? 100 : 0;
  }

  // Visual state
  card.classList.remove("card-correct", "card-incorrect");
  if (isCorrect) {
    card.classList.add("card-correct");
    feedback.textContent = "Correct!";
  } else {
    card.classList.add("card-incorrect");
    feedback.textContent = "Try Again!";
  }

  return { correct: isCorrect, progress };
}

/** Clear selection & visual state for a card */
export function resetCard(card) {
  const cfg = _cardConfig.get(card);
  const inputs = card.querySelectorAll('input[type="checkbox"], input[type="radio"]');
  inputs.forEach(i => { i.checked = false; });
  clearState(card);
  // Reset ring label to 0/X for multis
  if (cfg?.isMulti && cfg.ring) {
    cfg.ring.value = 0;
    const labelSpan = cfg.ring.querySelector("span") || document.createElement("span");
    labelSpan.textContent = `0/${cfg.totalCorrect}`;
    if (!labelSpan.isConnected) cfg.ring.append(labelSpan);
    cfg.ring.setAttribute("aria-label", `0 of ${cfg.totalCorrect} correct`);
  }
}

function clearState(card) {
  const cfg = _cardConfig.get(card);
  if (cfg?.feedback) {
    cfg.feedback.textContent = "";
  }
  card.classList.remove("card-correct", "card-incorrect");
}

/** Wire global page controls */
export function wirePageControls({ form, checkButton, resetButton }) {
  if (checkButton) {
    checkButton.addEventListener("click", () => {
      const cards = form.querySelectorAll(".quiz-card");
      cards.forEach(card => evaluateCard(card));
    });
  }
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      const cards = form.querySelectorAll(".quiz-card");
      cards.forEach(card => resetCard(card));
    });
  }
}
