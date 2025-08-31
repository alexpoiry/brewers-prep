import { setDefaultIconFamily } from 'https://early.webawesome.com/webawesome@3.0.0-beta.4/dist/webawesome.js';
    setDefaultIconFamily('classic');

async function init() {
      const params = new URLSearchParams(location.search);
      const source = params.get('source') || 'ba';
      const key = params.get('style');
      if (!key) return document.body.innerHTML = '<p style="color:red">No style specified.</p>';

      // Choose JSON based on source param
      const resp = await fetch(source === 'bjcp' ? 'data/bjcp-styles.json' : 'data/styles.json');
      const data = await resp.json();
      const { display, beers } = data[key] || {};
      if (!display) return document.body.innerHTML = `<p style="color:red">Style “${key}” not found.</p>`;

      document.title = `${display} Quiz`;
      document.querySelector('h1').textContent = `${display} Quiz`;      
      const inputEl = document.getElementById('beer-input');
      inputEl.setAttribute('label', `Type the name of a ${display}:`);
      
      const addBtn = document.getElementById('add-button');
      const toggleAllBtn = document.getElementById('toggle-all-button');
      const foundList = document.getElementById('found-list');
      const allList = document.getElementById('all-list');
      const progressBar = document.querySelector('wa-progress-bar');

      // Normalize and map answers
      const normMap = {};
      beers.forEach(orig => {
        const base = orig.toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
        normMap[base] = orig;
        orig.split(/\s+or\s+/i).forEach(part => {
          const pnorm = part.toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
          normMap[pnorm] = orig;
        });
      });
      const found = new Set();
      let allPopulated = false;

      function updateProgress() {
        const percentage = Math.floor((found.size / beers.length) * 100);
        progressBar.setAttribute('value', String(percentage));
      }

      function addBeer() {
        const name = inputEl.value.trim().toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
        inputEl.value = '';
        inputEl.focus();
        const match = normMap[name];
        if (match && !found.has(match)) {
          found.add(match);
          const li = document.createElement('li');
          li.textContent = match;
          foundList.appendChild(li);
          updateProgress();
        }
      }

      function toggleAll() {
        if (allList.style.display === 'none') {
          if (!allPopulated) {
            beers.forEach(orig => {
              const li = document.createElement('li');
              const a = document.createElement('a');
              const quizPage = source === 'bjcp' ? 'bjcp-details-quiz.html' : 'characteristics-quiz.html';
              a.textContent = orig;
              a.href = `${quizPage}?source=${source}&style=${encodeURIComponent(orig)}`;
              li.appendChild(a);
              allList.appendChild(li);
            });
            allPopulated = true;
          }
          allList.style.display = 'block';
          inputEl.disabled = true;
          addBtn.disabled = true;
          toggleAllBtn.textContent = 'Hide All Styles';
        } else {
          allList.style.display = 'none';
          inputEl.disabled = false;
          addBtn.disabled = false;
          toggleAllBtn.textContent = 'Show All Styles';
        }
      }

      addBtn.addEventListener('click', addBeer);
      inputEl.addEventListener('keypress', e => { if (e.key === 'Enter') addBeer(); });
      toggleAllBtn.addEventListener('click', toggleAll);
      
      updateProgress();
    }
    window.addEventListener('DOMContentLoaded', init);
