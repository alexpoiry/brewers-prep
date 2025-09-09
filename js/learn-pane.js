// js/learn-pane.js
// Renders the "Learn" tab for:
//   1) characteristics-quiz.html  -> data/details.json (per-style sensory & vitals)
//   2) bjcp-details-quiz.html     -> data/bjcp-details.json (BJCP sections & vitals)
//
// No JSON shape changes required. Just import and call the appropriate renderer
// after you've located the selected style in your page script.
//
// Exports:
//   renderCharacteristicsLearn({ container, styleName, familyName, groupName, styleObj })
//   renderBJCPDetailsLearn({ container, styleName, categoryName, details })
//
// Styling: This module injects a tiny bit of CSS to format definition lists nicely
// and to use a responsive grid (similar to your quiz grid). If you prefer to keep
// CSS in files, move the <style> block content into your stylesheet.

(function ensureLearnStyles(){
  const id = "learn-pane-inline-styles";
  if (document.getElementById(id)) return;
  const css = `
    .learn-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--wa-space-400, 1rem);
      grid-auto-flow: dense;
      margin-block: var(--wa-space-400, 1rem);
    }
    wa-card.learn-card::part(body) {
      display: grid;
      gap: var(--wa-space-300, .75rem);
    }
    .learn-card h3 {
      margin: 0;
      font-size: 1.05rem;
      line-height: 1.25rem;
    }
    .learn-card dl {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: .35rem .75rem;
      margin: 0;
    }
    .learn-card dt {
      font-weight: 600;
      white-space: nowrap;
    }
    .learn-card dd {
      margin: 0;
    }
    .pill-row {
      display: flex;
      flex-wrap: wrap;
      gap: .5rem;
    }
    .section-list {
      margin: 0;
      padding-left: 1.1rem;
      display: grid;
      gap: .25rem;
    }
    .learn-subtle {
      opacity: .8;
      font-size: .95em;
    }
  `;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
})();

function makeCard(titleText, bodyEl) {
  const card = document.createElement("wa-card");
  card.className = "gen-card learn-card";

  const headerSlot = document.createElement("div");
  headerSlot.setAttribute("slot", "header");
  const h3 = document.createElement("h3");
  h3.textContent = titleText;
  headerSlot.appendChild(h3);
  card.appendChild(headerSlot);

  card.appendChild(document.createElement("wa-separator"));
  card.appendChild(bodyEl);
  return card;
}

function addBadgesRow(values = []) {
  const row = document.createElement("div");
  row.className = "pill-row";
  values.filter(Boolean).forEach(v => {
    const b = document.createElement("wa-badge");
    b.textContent = v;
    row.appendChild(b);
  });
  return row;
}

// ------------------------------
// 1) Characteristics Learn Pane
// ------------------------------
export async function renderCharacteristicsLearn({ container, styleName, familyName, groupName, styleObj }) {
  if (!container) return;

  // Defensive: If we were passed nothing, explain gracefully.
  if (!styleObj) {
    container.innerHTML = `<wa-alert variant="warning">Style “${styleName || "(unknown)"}” not found.</wa-alert>`;
    return;
  }

  container.innerHTML = "";

  // Header / meta
  const headerCardBody = document.createElement("div");
  const title = document.createElement("h2");
  title.textContent = styleName;
  headerCardBody.appendChild(title);

  if (familyName || groupName) {
    const meta = addBadgesRow([familyName, groupName].filter(Boolean));
    meta.classList.add("learn-subtle");
    headerCardBody.appendChild(meta);
  }
  container.appendChild(makeCard("Overview", headerCardBody));

  // Sensory profile
  const sensoryMap = {
    color: "Color",
    clarity: "Clarity",
    perceived_malt_aroma_and_flavor: "Malt Aroma / Flavor",
    perceived_hop_aroma_and_flavor: "Hop Aroma / Flavor",
    perceived_bitterness: "Perceived Bitterness",
    fermentation_characteristics: "Fermentation Characteristics",
    body: "Body",
    additional_notes: "Notes"
  };

  const dl1 = document.createElement("dl");
  for (const [key, label] of Object.entries(sensoryMap)) {
    const val = styleObj[key];
    if (!val) continue;
    const dt = document.createElement("dt"); dt.textContent = label;
    const dd = document.createElement("dd"); dd.textContent = String(val);
    dl1.append(dt, dd);
  }
  container.appendChild(makeCard("Sensory Profile", dl1));

  // Vital statistics
  const vitalsMap = {
    original_gravity: "Original Gravity (OG)",
    final_gravity: "Final Gravity (FG)",
    alcohol: "Alcohol (ABV)",
    bitterness_ibu: "Bitterness (IBU)",
    color_srm: "Color (SRM)"
  };
  const dl2 = document.createElement("dl");
  for (const [key, label] of Object.entries(vitalsMap)) {
    const val = styleObj[key];
    if (!val) continue;
    const dt = document.createElement("dt"); dt.textContent = label;
    const dd = document.createElement("dd"); dd.textContent = String(val);
    dl2.append(dt, dd);
  }
  container.appendChild(makeCard("Vital Statistics", dl2));
}

// ------------------------------
// 2) BJCP Details Learn Pane
// ------------------------------
export async function renderBJCPDetailsLearn({ container, styleName, categoryName, details }) {
  if (!container) return;

  if (!details) {
    container.innerHTML = `<wa-alert variant="warning">Style “${styleName || "(unknown)"}” not found.</wa-alert>`;
    return;
  }

  container.innerHTML = "";

  // Header / meta
  const headerCardBody = document.createElement("div");
  const title = document.createElement("h2");
  title.textContent = styleName;
  headerCardBody.appendChild(title);

  if (categoryName) {
    const meta = addBadgesRow([categoryName]);
    meta.classList.add("learn-subtle");
    headerCardBody.appendChild(meta);
  }
  container.appendChild(makeCard("Overview", headerCardBody));

  const grid = document.createElement("div");
  grid.className = "learn-grid";
  container.appendChild(grid);

  // Narrative sections
  const narrativeKeys = [
    "Overall Impression",
    "Appearance",
    "Aroma",
    "Flavor",
    "Mouthfeel",
    "Comments",
    "History",
    "Characteristic Ingredients",
    "Style Comparison"
  ];

  narrativeKeys.forEach((key) => {
    const arr = Array.isArray(details[key]) ? details[key].filter(Boolean) : [];
    if (!arr.length) return;
    const ul = document.createElement("ul");
    ul.className = "section-list";
    arr.forEach(item => {
      const li = document.createElement("li");
      li.textContent = String(item);
      ul.appendChild(li);
    });
    grid.appendChild(makeCard(key, ul));
  });

  // Vital statistics
  const statMap = {
    IBU: "Bitterness (IBU)",
    SRM: "Color (SRM)",
    OG: "Original Gravity (OG)",
    FG: "Final Gravity (FG)",
    ABV: "Alcohol (ABV)"
  };
  const vitals = details["Vital Statistics"] || {};
  const dlStats = document.createElement("dl");
  Object.entries(statMap).forEach(([k, label]) => {
    const v = vitals[k];
    if (!v) return;
    const dt = document.createElement("dt"); dt.textContent = label;
    const dd = document.createElement("dd"); dd.textContent = String(v);
    dlStats.append(dt, dd);
  });
  grid.appendChild(makeCard("Vital Statistics", dlStats));

  // Style attributes / Commercial examples if present
  if (Array.isArray(details["Style Attributes"]) && details["Style Attributes"].length) {
    grid.appendChild(makeCard("Style Attributes", addBadgesRow(details["Style Attributes"])));
  }
  if (Array.isArray(details["Commercial Examples"]) && details["Commercial Examples"].length) {
    grid.appendChild(makeCard("Commercial Examples", addBadgesRow(details["Commercial Examples"])));
  }
}