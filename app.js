import { resources } from './data.js';
import { BASE, resolveRoute, routePath, metadata, structuredData, renderSite, renderCards, filteredStories } from './render.js';

let route = resolveRoute(location.pathname, resources);
let category = 'All';
let query = '';
function remember(lang) { try { localStorage.setItem('longlivity.language',lang); } catch { /* Storage may be unavailable; explicit URLs still work. */ } }
function remembered() { try { const lang=localStorage.getItem('longlivity.language'); return ['de','en'].includes(lang)?lang:'de'; } catch { return 'de'; } }
function updateHead() {
  const m=metadata(route,resources), r=resources[route.lang];
  document.documentElement.lang=r.htmlLang;
  document.title=m.title;
  const meta=(selector,value)=>document.querySelector(selector)?.setAttribute('content',value);
  meta('meta[name="description"]',m.description);
  meta('meta[name="robots"]',route.key==='notFound'?'noindex,follow':'index,follow');
  meta('meta[property="og:title"]',m.title);meta('meta[property="og:description"]',m.description);meta('meta[property="og:url"]',m.canonical);
  meta('meta[property="og:locale"]',route.lang==='de'?'de_DE':'en_US');
  meta('meta[property="og:locale:alternate"]',route.lang==='de'?'en_US':'de_DE');
  meta('meta[property="og:type"]',m.item?.photo?'article':'website');
  const photo=m.item?.photo || r.stories[0].photo;
  meta('meta[property="og:image"]',`https://images.unsplash.com/${photo}?auto=format&fit=crop&w=900&q=80`);
  meta('meta[property="og:image:alt"]',m.item?.alt||r.heroAlt);
  document.querySelector('link[rel="canonical"]').href=m.canonical;
  for (const a of m.alternates) document.querySelector(`link[hreflang="${a.lang}"]`).href=a.href;
  document.querySelector('link[hreflang="x-default"]').href=m.defaultURL;
  document.querySelector('#structured-data').textContent=JSON.stringify(structuredData(route,resources)||{'@context':'https://schema.org','@type':'WebSite',name:'Longlivity by Nona',url:location.origin+BASE,inLanguage:r.htmlLang});
}
function paint({ focus=false, hash='' }={}) {
  document.querySelector('#site').innerHTML=renderSite(route,resources,{category,query});
  updateHead();
  if (focus) {
    const target=hash?document.getElementById(decodeURIComponent(hash.slice(1))):document.querySelector('#main-content');
    target?.focus({preventScroll:true});
    if(hash) target?.scrollIntoView(); else window.scrollTo(0,0);
  }
}
function navigate(url, {replace=false, language=false}={}) {
  const next=resolveRoute(url.pathname,resources);
  if (language) { remember(next.lang); query=''; }
  else if(next.key!==route.key) { category='All'; query=''; }
  route=next;
  history[replace?'replaceState':'pushState']({},'',url.pathname+url.search+url.hash);
  paint({focus:true,hash:url.hash});
}
document.addEventListener('click',event=>{
  const filter=event.target.closest('[data-category]');
  if(filter) {
    category=filter.dataset.category;
    document.querySelectorAll('[data-category]').forEach(b=>{const active=b===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    refreshResults();return;
  }
  const anchor=event.target.closest('a[data-route],a[data-language]');
  if(!anchor||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||anchor.target==='_blank'||anchor.hasAttribute('download')) return;
  const url=new URL(anchor.href,location.href);
  if(url.origin!==location.origin||!url.pathname.startsWith(BASE)) return;
  event.preventDefault();
  navigate(url,{language:anchor.hasAttribute('data-language')});
});
function refreshResults() {
  document.querySelector('#articles').innerHTML=renderCards(route,resources,category,query);
  document.querySelector('#empty').hidden=filteredStories(resources[route.lang],category,query).length>0;
}
document.addEventListener('input',event=>{if(event.target.id==='search'){query=event.target.value;refreshResults();}});
window.addEventListener('popstate',()=>{route=resolveRoute(location.pathname,resources);category='All';query='';paint({focus:true,hash:location.hash});});
// Only the unprefixed entry point consults a saved preference. Explicit /de/ and /en/ URLs always win.
if(route.root){route={lang:remembered(),key:'home'};history.replaceState({},'',routePath(route.lang,'home',resources)+location.search+location.hash);paint();}
else if(route.key==='notFound'){paint();}
