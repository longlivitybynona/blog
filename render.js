export const BASE = '/blog/';
export const ORIGIN = 'https://longlivitybynona.github.io';
export const INSTAGRAM = 'https://www.instagram.com/longlivity.bynona/';
export const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const image = (id, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
export function routePath(lang, key = 'home', resources) {
  const r = resources[lang];
  if (key === 'home' || key === 'notFound') return `${BASE}${lang}/`;
  if (r.pages[key]) return `${BASE}${lang}/${r.pages[key].slug}/`;
  const story = r.stories.find(s => s.id === key);
  if (!story) throw new Error(`Unknown page: ${key}`);
  return `${BASE}${lang}/${story.slug}/`;
}
export function resolveRoute(pathname, resources) {
  if (pathname === BASE || pathname === BASE + 'index.html' || pathname === BASE.slice(0,-1)) return { lang: 'de', key: 'home', root: true };
  const parts = pathname.startsWith(BASE) ? pathname.slice(BASE.length).replace(/index\.html$/, '').split('/').filter(Boolean) : [];
  const lang = ['de','en'].includes(parts[0]) ? parts[0] : 'de';
  if (parts.length === 1 && ['de','en'].includes(parts[0])) return { lang, key: 'home' };
  if (parts.length === 2) {
    const page = Object.entries(resources[lang].pages).find(([,p]) => p.slug === parts[1]);
    const story = resources[lang].stories.find(s => s.slug === parts[1]);
    if (page || story) return { lang, key: page ? page[0] : story.id };
  }
  return { lang, key: 'notFound' };
}
export function allRoutes(resources) {
  return ['de','en'].flatMap(lang => ['home', ...Object.keys(resources[lang].pages), ...resources[lang].stories.map(s => s.id)].map(key => ({lang, key})));
}
export function metadata(route, resources) {
  const r = resources[route.lang];
  const item = r.pages[route.key] || r.stories.find(s => s.id === route.key);
  return {
    title: route.key === 'notFound' ? `${r.notFoundTitle} | Longlivity by Nona` : item ? `${item.title} | Longlivity by Nona` : r.siteTitle,
    description: item?.description || (route.key === 'notFound' ? r.notFoundText : r.siteDescription),
    canonical: ORIGIN + routePath(route.lang, route.key, resources),
    alternates: ['de','en'].map(lang => ({lang, href: ORIGIN + routePath(lang, route.key, resources)})),
    defaultURL: ORIGIN + routePath('de', route.key, resources),
    item
  };
}
export function structuredData(route, resources) {
  const { item, canonical } = metadata(route, resources);
  if (!item || !resources[route.lang].stories.includes(item)) return null;
  const base = { '@context': 'https://schema.org', '@type': 'Article', headline: item.title, description: item.description, inLanguage: resources[route.lang].htmlLang, mainEntityOfPage: canonical, image: image(item.photo) };
  if (item.recipe) Object.assign(base, { '@type':'Recipe', name:item.title, recipeYield:String(item.recipe.servings), prepTime:`PT${item.recipe.prep}M`, cookTime:`PT${item.recipe.cook}M`, totalTime:`PT${item.recipe.total}M`, recipeIngredient:item.recipe.ingredients, recipeInstructions:item.recipe.steps.map(text => ({'@type':'HowToStep',text})) });
  return base;
}
export function renderHead(route, resources) {
  const r = resources[route.lang], m = metadata(route, resources), data = structuredData(route, resources);
  return `<title>${escapeHTML(m.title)}</title>
<meta name="description" content="${escapeHTML(m.description)}">
<link rel="canonical" href="${m.canonical}">
${m.alternates.map(a => `<link rel="alternate" hreflang="${a.lang}" href="${a.href}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${m.defaultURL}">
<meta property="og:title" content="${escapeHTML(m.title)}">
<meta property="og:description" content="${escapeHTML(m.description)}">
<meta property="og:url" content="${m.canonical}">
<meta property="og:locale" content="${route.lang === 'de' ? 'de_DE' : 'en_US'}">
<meta property="og:locale:alternate" content="${route.lang === 'de' ? 'en_US' : 'de_DE'}">
<meta property="og:type" content="${m.item?.photo ? 'article' : 'website'}">
<meta property="og:site_name" content="Longlivity by Nona">
<meta property="og:image" content="${image(m.item?.photo || r.stories[0].photo)}">
<meta property="og:image:alt" content="${escapeHTML(m.item?.alt || r.heroAlt)}">
<meta name="robots" content="${route.key === 'notFound' ? 'noindex,follow' : 'index,follow'}">
<script id="structured-data" type="application/ld+json">${JSON.stringify(data || {'@context':'https://schema.org','@type':'WebSite',name:'Longlivity by Nona',url:ORIGIN+BASE,inLanguage:r.htmlLang}).replace(/</g,'\\u003c')}</script>`;
}
export function readingTime(story) {
  const text = [story.body, ...(story.recipe?.ingredients || []), ...(story.recipe?.steps || []), story.recipe?.tip || ''].join(' ').replace(/<[^>]*>/g,' ');
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200));
}
export function filteredStories(resource, category = 'All', query = '') {
  const normalize = text => text.normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase(resource.locale);
  const term = normalize(query.trim());
  return resource.stories.filter(s => (category === 'All' || s.category === category) && normalize([s.title,s.description,resource.categories[s.category],s.body, ...(s.recipe?.ingredients || []), ...(s.recipe?.steps || [])].join(' ').replace(/<[^>]*>/g, ' ')).includes(term));
}
export function renderCards(route, resources, category = 'All', query = '') {
  const r = resources[route.lang];
  return filteredStories(r, category, query).map(s => `<a class="card" data-route href="${routePath(route.lang,s.id,resources)}"><div class="card-image"><img loading="lazy" decoding="async" src="${image(s.photo)}" alt="${escapeHTML(s.alt)}" width="900" height="650"></div><div class="card-meta"><span>${escapeHTML(r.categories[s.category])}</span><span>${readingTime(s)} ${r.minutes}</span></div><h3>${escapeHTML(s.title)}</h3><p>${escapeHTML(s.description)}</p><span class="read-more">${r.readMore} ↗</span></a>`).join('');
}
const external = (text, className='') => `<a class="${className}" href="${INSTAGRAM}" target="_blank" rel="noopener noreferrer">${text} ↗</a>`;
export function renderSite(route, resources, state = {}) {
  const r = resources[route.lang], home = routePath(route.lang,'home',resources);
  const wordmark = `<a class="wordmark" data-route href="${home}" aria-label="${r.homeLabel}">longlivity<span>BY NONA</span></a>`;
  const switcher = `<nav class="language-switcher" aria-label="${r.languageLabel}">${['de','en'].map(lang => `<a data-language="${lang}" href="${routePath(lang,route.key,resources)}" lang="${lang}" hreflang="${lang}" aria-label="${r[lang === 'de' ? 'switchDe' : 'switchEn']}" ${lang === route.lang ? 'aria-current="true"' : ''}>${lang.toUpperCase()}</a>`).join('<span aria-hidden="true">|</span>')}</nav>`;
  return `<a class="skip-link" href="#main-content">${r.skip}</a><div class="announcement">${r.announcement}</div>
<header class="header wrap">${wordmark}<nav class="main-nav" aria-label="${r.navLabel}"><a data-route href="${home}#journal">${r.journal}</a><a data-route href="${routePath(route.lang,'about',resources)}">${r.about}</a>${external(r.instagram)}</nav><div class="header-actions">${switcher}<a class="header-button" data-route href="${home}#journal">${r.inspiration} <span>↗</span></a></div></header>
<main id="main-content" tabindex="-1">${route.key === 'home' ? renderHome(route,resources,state) : renderContent(route,resources)}</main>
<footer class="wrap">${wordmark}<div><p>${r.footerTagline}</p><nav class="legal-links" aria-label="${r.legalNav}"><a data-route href="${routePath(route.lang,'privacy',resources)}">${r.privacy}</a><a data-route href="${routePath(route.lang,'legal',resources)}">${r.legal}</a></nav></div><small>© ${new Date().getFullYear()} Longlivity by Nona<br>${r.disclaimer}</small></footer>`;
}
function renderHome(route,resources,state) {
  const r=resources[route.lang], category=state.category || 'All', query=state.query || '';
  const visible=filteredStories(r,category,query);
  return `<section class="hero wrap"><div class="hero-copy"><p class="eyebrow">${r.heroEyebrow}</p><h1>${r.heroTitle}</h1><p class="intro">${r.heroIntro}</p><a class="button" href="#journal">${r.explore} <span>↗</span></a><div class="hero-note"><span class="little-sun" aria-hidden="true">✳</span><p>${r.heroNote}</p></div></div><div class="hero-image"><img src="${image(r.stories[0].photo,1200)}" srcset="${image(r.stories[0].photo,600)} 600w, ${image(r.stories[0].photo,1200)} 1200w" sizes="(max-width: 650px) 90vw, 45vw" alt="${r.heroAlt}" width="1200" height="1200" fetchpriority="high"><span class="photo-label">${r.photoLabel}</span><div class="image-stamp">${r.stamp}</div></div></section>
<div class="values" aria-label="${r.themesLabel}">${r.values.map(v=>`<span>${v}</span>`).join('<b aria-hidden="true">✳</b>')}</div>
<section class="journal wrap" id="journal" tabindex="-1"><div class="section-heading"><div><p class="eyebrow">${r.journalEyebrow}</p><h2>${r.journalTitle}<span>.</span></h2></div><p>${r.journalIntro}</p></div>
<div class="journal-tools"><div class="filters" role="group" aria-label="${r.filterLabel}">${Object.entries(r.categories).map(([key,label])=>`<button class="${category===key?'active':''}" data-category="${key}" aria-pressed="${category===key}">${label}</button>`).join('')}</div><label class="search"><span class="sr-only">${r.searchLabel}</span><input id="search" type="search" value="${escapeHTML(query)}" placeholder="${r.searchPlaceholder}"><span aria-hidden="true">⌕</span></label></div><p class="draft-note">${r.draftNote}</p><div id="search-results" role="status" aria-live="polite"><div class="article-grid" id="articles">${renderCards(route,resources,category,query)}</div><p id="empty" ${visible.length?'hidden':''}>${r.empty}</p></div></section>
<section class="philosophy" id="philosophy"><div class="wrap philosophy-inner"><div class="philosophy-photo"><img loading="lazy" decoding="async" src="${image('photo-1474979266404-7eaacbcd87c5',1000)}" alt="${r.philosophyAlt}" width="1000" height="850"></div><div class="philosophy-copy"><p class="eyebrow">${r.philosophyEyebrow}</p><h2>${r.philosophyTitle}</h2>${r.philosophyParagraphs.map(p=>`<p>${p}</p>`).join('')}${external(r.followStory,'text-link')}</div></div></section>
<section class="instagram wrap"><p class="eyebrow">${r.contactEyebrow}</p><h2>${r.contactTitle}</h2><p>${r.contactIntro}</p>${external('@longlivity.bynona','button')}</section>`;
}
function renderContent(route,resources) {
  const r=resources[route.lang], story=r.stories.find(s=>s.id===route.key), page=r.pages[route.key];
  if (!story && !page) return `<section class="reading-page wrap"><h1>${r.notFoundTitle}</h1><p>${r.notFoundText}</p><a class="text-link" data-route href="${routePath(route.lang,'home',resources)}">${r.back}</a></section>`;
  const item=story||page;
  return `<article class="reading-page wrap"><a class="text-link" data-route href="${routePath(route.lang,'home',resources)}#journal">← ${r.back}</a>${story?`<p class="eyebrow">${r.categories[story.category]} · ${readingTime(story)} ${r.minutes} · ${r.draft}</p>`:''}<h1>${escapeHTML(item.title)}</h1><p class="article-excerpt">${escapeHTML(item.description)}</p>${story?`<img class="article-photo" src="${image(story.photo,1200)}" alt="${escapeHTML(story.alt)}" width="1200" height="650" decoding="async">`:''}<div class="article-body">${item.body}${story?.recipe?renderRecipe(story.recipe,r):''}</div>${story?`<p class="article-disclaimer">${r.draftDisclaimer}</p>`:''}</article>`;
}
function renderRecipe(recipe,r) {
  const l=r.recipeLabels;
  return `<section class="recipe"><dl class="recipe-facts"><div><dt>${l.servings}</dt><dd>${recipe.servings}</dd></div>${['prep','cook','total'].map(k=>`<div><dt>${l[k]}</dt><dd>${recipe[k]} ${l.minutes}</dd></div>`).join('')}</dl><h2>${l.ingredients}</h2><ul>${recipe.ingredients.map(i=>`<li>${escapeHTML(i)}</li>`).join('')}</ul><h2>${l.steps}</h2><ol>${recipe.steps.map(s=>`<li>${escapeHTML(s)}</li>`).join('')}</ol><h2>${l.tip}</h2><p>${escapeHTML(recipe.tip)}</p></section>`;
}
