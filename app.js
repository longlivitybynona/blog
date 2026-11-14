const image = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;
const stories = [
  { id: 'colorful-bowl', category: 'Food', title: 'The everyday bowl: a little color, a lot of possibility', description: 'A flexible way to bring vegetables, grains, and something delicious together.', photo: 'photo-1512621776951-a57141f2eefd', alt: 'A vibrant vegetable bowl', time: '4 min read', body: '<p>A satisfying bowl starts with ingredients you enjoy. Think of this as a framework to adapt to your appetite, preferences, and what is already in your kitchen.</p><h3>Build your bowl</h3><ul><li>Start with cooked brown rice, quinoa, or another grain you like.</li><li>Add a mix of roasted and fresh vegetables.</li><li>Include beans, lentils, tofu, eggs, or another protein that works for you.</li><li>Finish with olive oil and lemon, or a spoonful of tahini dressing.</li></ul><p>Taste before serving. A squeeze of citrus, a handful of herbs, or a little crunch can bring the whole bowl together.</p>' },
  { id: 'daily-walk', category: 'Longevity', title: 'Make room for a walk, without making it a project', description: 'Finding a comfortable rhythm of movement in the day you already have.', photo: 'photo-1441974231531-c6227db76b6e', alt: 'Sunlight falling through trees along a forest path', time: '3 min read', body: '<p>A walk can be a chance to step away from a screen, notice your surroundings, or spend time with someone you care about. There is no need to turn every outing into a performance.</p><h3>Start where you are</h3><p>Choose an accessible route and a duration that feels comfortable for your abilities. A short outing is a reasonable place to begin. Indoor movement and mobility adaptations can be equally valid ways to make space for activity.</p><p>If you have a health condition or are changing your activity routine, seek advice tailored to you from a qualified professional.</p>' },
  { id: 'pantry', category: 'Nutrition', title: 'A thoughtful pantry for meals that feel effortless', description: 'Everyday ingredients that make cooking a little more inviting.', photo: 'photo-1474979266404-7eaacbcd87c5', alt: 'Olives and olive oil with fresh herbs', time: '4 min read', body: '<p>A useful pantry reflects the food you actually like to cook. Start with a few versatile ingredients rather than a long list of things you feel you should own.</p><h3>A simple starting point</h3><ul><li>Beans or lentils, canned or dried.</li><li>A grain you enjoy and know how to prepare.</li><li>Olive oil, vinegar, and a few favorite seasonings.</li><li>Nuts or seeds, where suitable for your dietary needs.</li><li>Frozen vegetables for days when fresh ingredients run low.</li></ul><p>Check labels for allergens and storage instructions. Choose what fits your budget, culture, and personal needs.</p>' },
  { id: 'quiet-morning', category: 'Wellness', title: 'A quieter beginning to your morning', description: 'Small pockets of calm, before the rest of the day comes calling.', photo: 'photo-1442512595331-e89e73853f31', alt: 'A warm cup of coffee on a table', time: '3 min read', body: '<p>Not every morning has room for an elaborate ritual. Sometimes a small pause is enough: opening a curtain, sitting with a warm drink, or taking a moment before looking at your phone.</p><h3>Choose one small thing</h3><p>Pick something that feels supportive rather than demanding. You might prepare breakfast the evening before, leave a book by your chair, or step outside to notice the weather.</p><p>Let your routine change with your circumstances. A useful ritual should serve your life.</p>' },
  { id: 'seasonal-table', category: 'Food', title: 'Let the season find its way to your table', description: 'A curious, uncomplicated approach to choosing your next meal.', photo: 'photo-1542838132-92c53300491e', alt: 'An assortment of colorful fresh produce', time: '3 min read', body: '<p>Seasonal cooking can begin with one ingredient that catches your eye. Choose something you enjoy, then build a familiar meal around it.</p><h3>Keep it flexible</h3><p>Roast vegetables with olive oil and herbs, fold greens into a grain dish, or serve fruit with yogurt if that suits your diet. Frozen and canned produce can also be practical choices.</p><p>There is no single perfect shopping basket. Availability, cost, taste, and convenience all have a place at the table.</p>' },
  { id: 'shared-table', category: 'Wellness', title: 'The simple pleasure of a shared table', description: 'Making space for connection, one ordinary meal at a time.', photo: 'photo-1414235077428-338989a2e8c0', alt: 'A thoughtfully prepared meal at a dining table', time: '3 min read', body: '<p>A shared meal does not require a special occasion. Soup, leftovers, or a simple plate can be an invitation to pause together.</p><h3>Make it easy to say yes</h3><p>Keep the food uncomplicated, ask about dietary needs, and let people contribute if they would like. Connection can happen over a short lunch as easily as a long dinner.</p><p>When meeting in person is difficult, a phone call while you cook or a recipe exchanged with a friend can offer another way to stay connected.</p>' }
];
const grid = document.querySelector('#articles');
const dialog = document.querySelector('#story-dialog');
let category = 'All';
let lastTrigger;
function render() {
  const query = document.querySelector('#search').value.trim().toLowerCase();
  const visible = stories.filter(s => (category === 'All' || s.category === category) && `${s.title} ${s.description} ${s.category}`.toLowerCase().includes(query));
  grid.innerHTML = visible.map(s => `<button class="card" data-story="${s.id}" aria-haspopup="dialog"><div class="card-image"><img loading="lazy" src="${image(s.photo)}" alt="${s.alt}"></div><div class="card-meta"><span>${s.category}</span><span>${s.time}</span></div><h3>${s.title}</h3><p>${s.description}</p><span class="read-more">Read the story ↗</span></button>`).join('');
  document.querySelector('#empty').hidden = visible.length > 0;
}
document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
  category = button.dataset.category;
  document.querySelectorAll('[data-category]').forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
  render();
}));
document.querySelector('#search').addEventListener('input', render);
grid.addEventListener('click', event => {
  const trigger = event.target.closest('[data-story]');
  if (!trigger) return;
  const story = stories.find(s => s.id === trigger.dataset.story);
  lastTrigger = trigger;
  document.querySelector('#story-content').innerHTML = `<p class="eyebrow">${story.category} · ${story.time} · EDITORIAL DRAFT</p><h2 id="story-title">${story.title}</h2>${story.body}<p><small>Preview content for Nona’s review. General information only; not individualized nutrition or medical advice.</small></p>`;
  dialog.showModal();
});
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
dialog.addEventListener('close', () => lastTrigger?.focus());
document.querySelector('#year').textContent = new Date().getFullYear();
render();
