async function loadPageSections() {
  const sections = [...document.querySelectorAll('[data-include]')];
  for (const slot of sections) {
    const file = slot.dataset.include;
    const response = await fetch(file);
    if (!response.ok) throw new Error(`Could not load ${file}`);
    slot.outerHTML = await response.text();
  }
  const app = document.createElement('script');
  app.src = 'js/app.js';
  document.body.appendChild(app);
}
loadPageSections().catch(error => {
  console.error(error);
  document.body.insertAdjacentHTML('beforeend', `<p class="m-4 rounded-lg bg-red-50 p-4 text-red-700">Could not load the page sections. Open the folder with VS Code Live Server, then open index.html.</p>`);
});
