import { setDefaultIconFamily } from 'https://early.webawesome.com/webawesome@3.0.0-beta.4/dist/webawesome.js';
    setDefaultIconFamily('classic');

fetch('data/bjcp-styles.json')
      .then(r => r.json())
      .then(data => {
        const ul = document.getElementById('bjcp-list');
        Object.entries(data).forEach(([key, { display }]) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = `list-quiz.html?source=bjcp&style=${encodeURIComponent(key)}`;
          a.textContent = display;
          li.appendChild(a);
          ul.appendChild(li);
        });
      })
      .catch(err => {
        document.getElementById('bjcp-list').innerHTML = `<li style="color:red">Failed to load bjcp-styles.json: ${err}</li>`;
      });