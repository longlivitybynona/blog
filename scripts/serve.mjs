import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { BASE } from '../render.js';
const root = path.resolve('dist');
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.xml':'application/xml; charset=utf-8' };
http.createServer(async (req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname==='/'||pathname===BASE.slice(0,-1)){res.writeHead(302,{Location:BASE}).end();return;}
    if(!pathname.startsWith(BASE)){res.writeHead(404).end('Not found');return;}
    let file=path.resolve(root,pathname.slice(BASE.length));
    if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    const info=await stat(file);
    if(info.isDirectory()) {
      if(!pathname.endsWith('/')){res.writeHead(301,{Location:pathname+'/'}).end();return;}
      file=path.join(file,'index.html');
    }
    const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);
  } catch {
    res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});
    res.end(await readFile(path.join(root,'404.html'),'utf8').catch(()=> 'Not found'));
  }
}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log(`Longlivity: http://localhost:${process.env.PORT||3000}${BASE}`));
