import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { BASE, ORIGIN, allRoutes, routePath, resolveRoute, renderSite, metadata, renderHead, structuredData, filteredStories } from '../render.js';
const resources=Object.fromEntries(['de','en'].map(lang=>[lang,JSON.parse(readFileSync(new URL(`../locales/${lang}.json`,import.meta.url)))]));
const flattenKeys=(obj,prefix='')=>Object.entries(obj).flatMap(([key,value])=>value&&typeof value==='object'&&!Array.isArray(value)?flattenKeys(value,prefix+key+'.'):[prefix+key]).sort();

test('both resources contain the same UI keys, articles, recipe quantities, and steps',()=>{
  assert.deepEqual(flattenKeys(resources.de),flattenKeys(resources.en));
  assert.deepEqual(resources.de.stories.map(s=>s.id),resources.en.stories.map(s=>s.id));
  for(const [i,de] of resources.de.stories.entries()) {
    const en=resources.en.stories[i];
    assert.equal(de.category,en.category);assert.notEqual(de.title,en.title);assert.notEqual(de.body,en.body);
    assert.match(de.body,/<p>/);assert.match(en.body,/<p>/);
    if(de.recipe) {
      for(const key of ['servings','prep','cook','total']) assert.equal(de.recipe[key],en.recipe[key]);
      assert.equal(de.recipe.ingredients.length,en.recipe.ingredients.length);
      assert.equal(de.recipe.steps.length,en.recipe.steps.length);
      assert.equal(de.recipe.total,de.recipe.prep+de.recipe.cook);
    }
  }
});

test('all stable localized routes resolve and map to their equivalent page',()=>{
  assert.equal(allRoutes(resources).length,20);
  for(const route of allRoutes(resources)) {
    const path=routePath(route.lang,route.key,resources);
    assert.deepEqual(resolveRoute(path,resources),route);
    assert.deepEqual(resolveRoute(path+'index.html',resources),route);
    assert.deepEqual(resolveRoute(path.slice(0,-1),resources),route);
    const other=route.lang==='de'?'en':'de';
    assert.equal(resolveRoute(routePath(other,route.key,resources),resources).key,route.key);
  }
  assert.deepEqual(resolveRoute('/blog/',resources),{lang:'de',key:'home',root:true});
  assert.equal(resolveRoute('/blog/en/not-a-story/',resources).key,'notFound');
  assert.equal(resolveRoute('/blog/de/everyday-bowl/',resources).key,'notFound');
});

test('search matches selected-language content including recipe ingredients, and filters combine with it',()=>{
  assert.equal(filteredStories(resources.de,'All','KICHERERBSEN').length,1);
  assert.equal(filteredStories(resources.en,'All','chickpeas').length,1);
  assert.equal(filteredStories(resources.de,'Food','olive').length,2);
  assert.equal(filteredStories(resources.en,'Nutrition','pantry').length,1);
  assert.equal(filteredStories(resources.de,'All','chickpeas').length,0);
  assert.equal(filteredStories(resources.en,'All','Kichererbsen').length,0);
  assert.equal(filteredStories(resources.de,'Wellness','Kichererbsen').length,0);
  assert.equal(filteredStories(resources.de,'All','a totally absent phrase').length,0);
});

test('each page has translated titles, descriptions, canonical, hreflang, and structured data',()=>{
  for(const route of allRoutes(resources)) {
    const m=metadata(route,resources),head=renderHead(route,resources);
    assert.ok(m.title.includes('Longlivity by Nona'));
    assert.ok(m.description.length>30);
    assert.equal(m.canonical,ORIGIN+routePath(route.lang,route.key,resources));
    for(const lang of ['de','en']) assert.ok(head.includes(`hreflang="${lang}" href="${ORIGIN+routePath(lang,route.key,resources)}"`));
    assert.ok(head.includes(`hreflang="x-default" href="${m.defaultURL}"`));
    const other=metadata({...route,lang:route.lang==='de'?'en':'de'},resources);
    assert.notEqual(m.title,other.title);assert.notEqual(m.description,other.description);
    const structured=structuredData(route,resources);
    if(m.item?.recipe) {assert.equal(structured['@type'],'Recipe');assert.equal(structured.recipeInstructions.length,4);}
  }
});

test('header language switcher and localized legal navigation are present on every page',()=>{
  for(const route of allRoutes(resources)) {
    const html=renderSite(route,resources);
    for(const lang of ['de','en']) assert.ok(html.includes(`data-language="${lang}" href="${routePath(lang,route.key,resources)}"`));
    assert.ok(html.includes(resources[route.lang].searchLabel)||route.key!=='home');
    assert.ok(html.includes(routePath(route.lang,'legal',resources)));
    assert.ok(html.includes(routePath(route.lang,'privacy',resources)));
    assert.ok(html.includes(`aria-label="${resources[route.lang].navLabel}"`));
    assert.ok(!html.includes('undefined'));
  }
});

// Exercise the browser controller against deterministic DOM/history/storage doubles.
function client(start='/blog/',saved,blocked=false) {
  const nodes=new Map(),listeners={},windowEvents={};
  const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',hidden:false,attributes:{},setAttribute(k,v){this.attributes[k]=v;},focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;}});return nodes.get(selector);};
  const location=new URL(start,ORIGIN),document={documentElement:{lang:'de-DE'},title:'',querySelector:node,querySelectorAll:()=>[],getElementById:id=>node('#'+id),addEventListener:(name,fn)=>{listeners[name]=fn;}};
  const calls=[];let savedValue=saved;
  const history=Object.fromEntries(['pushState','replaceState'].map(key=>[key,(_,__,path)=>{calls.push([key,path]);location.href=new URL(path,location).href;}]));
  const localStorage={getItem(){if(blocked)throw Error('blocked');return savedValue;},setItem(_,value){if(blocked)throw Error('blocked');savedValue=value;}};
  const controller=readFileSync(new URL('../app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
  const context={resources,BASE,resolveRoute,routePath,metadata,structuredData,renderSite,renderCards:()=>'<p>results</p>',filteredStories,location,document,history,localStorage,URL,window:{addEventListener:(key,fn)=>{windowEvents[key]=fn;},scrollTo(){} }};
  vm.runInNewContext(controller,context);
  function clickLanguage(lang,options={}) {
    const current=resolveRoute(location.pathname,resources);
    const anchor={href:ORIGIN+routePath(lang,current.key,resources),hasAttribute:key=>key==='data-language'};
    const event={target:{closest:selector=>selector==='[data-category]'?null:anchor},button:0,preventDefault(){this.prevented=true;},...options};
    listeners.click(event);return event;
  }
  return {location,document,nodes,node,calls,clickLanguage,listeners,windowEvents,saved:()=>savedValue};
}

test('root defaults to German; stored English is honored only on root and blocked storage is safe',()=>{
  assert.equal(client().location.pathname,'/blog/de/');
  assert.equal(client('/blog/','en').location.pathname,'/blog/en/');
  assert.equal(client('/blog/','xx').location.pathname,'/blog/de/');
  assert.equal(client('/blog/','en',true).location.pathname,'/blog/de/');
  const explicit=client('/blog/de/bunte-bowl/','en');
  assert.equal(explicit.location.pathname,'/blog/de/bunte-bowl/');assert.equal(explicit.calls.length,0);
});

test('language switches keep the same article, translate document/SEO/accessibility, remember selection, and support back',()=>{
  const c=client('/blog/de/bunte-bowl/');
  assert.equal(c.clickLanguage('en').prevented,true);
  assert.equal(c.location.pathname,'/blog/en/everyday-bowl/');
  assert.equal(c.saved(),'en');assert.equal(c.document.documentElement.lang,'en');
  assert.match(c.document.title,/chickpea/);
  assert.match(c.node('#site').innerHTML,/Ingredients/);
  assert.match(c.node('#site').innerHTML,/aria-label="Main navigation"/);
  assert.equal(c.node('link[hreflang="de"]').href,ORIGIN+'/blog/de/bunte-bowl/');
  c.clickLanguage('de');assert.match(c.node('#site').innerHTML,/Zutaten/);
  assert.equal(c.document.documentElement.lang,'de-DE');
  c.location.pathname='/blog/en/everyday-bowl/';c.windowEvents.popstate();
  assert.equal(c.document.documentElement.lang,'en');
  const modified=client('/blog/de/');modified.clickLanguage('en',{ctrlKey:true});assert.equal(modified.calls.length,0);
  assert.doesNotThrow(()=>client('/blog/de/',undefined,true).clickLanguage('en'));
});

test('search input and empty states update in the active language without navigating',()=>{
  const c=client('/blog/');c.clickLanguage('en');
  c.listeners.input({target:{id:'search',value:'chickpeas'}});assert.equal(c.node('#empty').hidden,true);
  c.listeners.input({target:{id:'search',value:'Kichererbsen'}});assert.equal(c.node('#empty').hidden,false);
  assert.equal(c.location.pathname,'/blog/en/');
});

test('unknown English routes translate the 404, and mobile rules keep language and legal navigation visible',()=>{
  const c=client('/blog/en/missing/');
  assert.equal(c.document.documentElement.lang,'en');
  assert.match(c.node('#site').innerHTML,/This page could not be found/);
  assert.equal(c.node('meta[name="robots"]').attributes.content,'noindex,follow');
  const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
  assert.match(css,/@media\(max-width:650px\)/);
  assert.match(css,/\.header-actions\{grid-column:2;grid-row:1\}/);
  assert.match(css,/\.header \.main-nav\{grid-column:1\/-1/);
  assert.doesNotMatch(css,/nav a:nth-child\(2\)\{display:none\}/);
});

test('production output has real HTML for all routes and no broken internal links or fragment targets under /blog/',async()=>{
  await import('../scripts/build.mjs');
  const paths=['/blog/',...allRoutes(resources).map(r=>routePath(r.lang,r.key,resources))];
  for(const pathname of paths) {
    const file='dist/'+pathname.slice(BASE.length)+'index.html',html=readFileSync(file,'utf8');
    assert.ok(!/\{\{(?:LANG|HEAD|SITE)\}\}/.test(html));
    const resolved=resolveRoute(pathname,resources);
    assert.ok(html.includes(`<html lang="${resources[resolved.lang].htmlLang}">`));
    assert.match(html,/<h1>/);
    for(const match of html.matchAll(/(?:href|src)="([^"<>]+)"/g)) {
      const url=new URL(match[1],ORIGIN+pathname);
      if(url.origin!==ORIGIN)continue;
      assert.ok(url.pathname.startsWith(BASE),`Wrong base: ${url.href}`);
      const target='dist/'+url.pathname.slice(BASE.length)+(url.pathname.endsWith('/')?'index.html':'');
      assert.ok(existsSync(target),`Missing target: ${url.href}`);
      if(url.hash)assert.ok(readFileSync(target,'utf8').includes(`id="${url.hash.slice(1)}"`),`Missing fragment: ${url.href}`);
    }
  }
  assert.ok(existsSync('dist/data.js'));assert.ok(existsSync('dist/.nojekyll'));
  const sitemap=readFileSync('dist/sitemap.xml','utf8');
  assert.equal((sitemap.match(/<loc>/g)||[]).length,20);
  assert.equal((sitemap.match(/hreflang="x-default"/g)||[]).length,20);
  assert.match(readFileSync('dist/404.html','utf8'),/noindex,follow/);
});
