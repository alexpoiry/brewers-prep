import { setDefaultIconFamily } from 'https://early.webawesome.com/webawesome@3.0.0-beta.4/dist/webawesome.js';
    setDefaultIconFamily('classic');

fetch('data/styles.json')
      .then(r => r.json())
      .then(data => {
        const ul = document.getElementById('ba-list');
        Object.entries(data).forEach(([key, { display }]) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          // Clicking stays inside the iframe by default
          a.href = `list-quiz.html?source=ba&style=${encodeURIComponent(key)}`;
          a.textContent = display;
          li.appendChild(a);
          ul.appendChild(li);
        });
      })
      .catch(err => {
        document.getElementById('ba-list').innerHTML = `<li style="color:red">Failed to load styles.json: ${err}</li>`;
      });