import { mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { BASE, ORIGIN, allRoutes, routePath, renderHead, renderSite } from '../render.js';
const resources = Object.fromEntries(await Promise.all(['de','en'].map(async lang=>[lang,JSON.parse(await readFile(new URL(`../locales/${lang}.json`,import.meta.url),'utf8'))])));
const template=await readFile('index.html','utf8');
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for(const file of ['styles.css','app.js','render.js']) await copyFile(file,`dist/${file}`);
await mkdir('dist/locales',{recursive:true});
for(const lang of ['de','en']) await copyFile(`locales/${lang}.json`,`dist/locales/${lang}.json`);
await writeFile('dist/data.js',`export const resources = ${JSON.stringify(resources).replace(/</g,'\\u003c')};\n`);
const documentFor=route=>template.replace('{{LANG}}',resources[route.lang].htmlLang).replace('{{HEAD}}',()=>renderHead(route,resources)).replace('{{SITE}}',()=>renderSite(route,resources));
for(const route of allRoutes(resources)) {
  const folder='dist/'+routePath(route.lang,route.key,resources).slice(BASE.length);
  await mkdir(folder,{recursive:true});
  await writeFile(folder+'index.html',documentFor(route));
}
await writeFile('dist/index.html',documentFor({lang:'de',key:'home',root:true}));
await writeFile('dist/404.html',documentFor({lang:'de',key:'notFound'}));
await writeFile('dist/.nojekyll','');
const urls=allRoutes(resources).map(route=>`<url><loc>${ORIGIN+routePath(route.lang,route.key,resources)}</loc>${['de','en'].map(lang=>`<xhtml:link rel="alternate" hreflang="${lang}" href="${ORIGIN+routePath(lang,route.key,resources)}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN+routePath('de',route.key,resources)}"/></url>`);
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('\n')}</urlset>\n`);
console.log(`Built ${allRoutes(resources).length} localized pages, German root, 404 page, and sitemap under ${BASE}`);
