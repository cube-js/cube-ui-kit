import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const DIR = join(process.cwd(), 'storybook-static');
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.ico':'image/x-icon'};
const server = createServer((req,res)=>{const u=decodeURIComponent(req.url.split('?')[0]);const p=join(DIR,u==='/'?'index.html':u);if(!existsSync(p)){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':MIME[extname(p)]??'application/octet-stream'});createReadStream(p).pipe(res);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port = server.address().port;

const index = JSON.parse(readFileSync(join(DIR,'index.json'),'utf8'));
// Only stories that have a play function are at risk of a play error.
const src = new Map();
const read = (p) => { const f = join(process.cwd(), p.replace(/^\.\//,'')); if(!src.has(f)) src.set(f, existsSync(f)?readFileSync(f,'utf8'):''); return src.get(f); };
const stories = Object.values(index.entries).filter(e => e.type==='story')
  .filter(e => { const s = read(e.importPath); return new RegExp(`^${e.exportName}\\.play\\s*=`,'m').test(s) || /play\s*:/.test(s.slice(Math.max(0,s.search(new RegExp(`^export const ${e.exportName}\\b`,'m'))), s.search(new RegExp(`^export const ${e.exportName}\\b`,'m'))+2000)); });

console.log(`scanning ${stories.length} stories with play functions`);
const browser = await chromium.launch();
const failures = [];
let i = 0;
async function worker() {
  const ctx = await browser.newContext({viewport:{width:1200,height:900}, reducedMotion:'reduce'});
  await ctx.addInitScript(() => {
    window.__res = null;
    const sub = () => { const c = window.__STORYBOOK_ADDONS_CHANNEL__; if(!c) return false;
      const ser = (e) => { try { return (e && (e.message || e.error?.message || e.reason?.message)) || JSON.stringify(e, Object.getOwnPropertyNames(e || {})); } catch { return String(e); } };
      c.on('storyFinished', (p) => { window.__res = { status: p?.status, reporters: (p?.reporters||[]).map(r=>ser(r)).slice(0,2) }; });
      c.on('playFunctionThrewException', (e) => { window.__res = { status:'error', error: ser(e).slice(0,400) }; });
      return true; };
    if(!sub()){ const t=setInterval(()=>{ if(sub()) clearInterval(t); },10); }
  });
  const page = await ctx.newPage();
  for(;;){
    const s = stories[i++]; if(!s) break;
    await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${encodeURIComponent(s.id)}&viewMode=story`);
    const res = await page.waitForFunction(()=>window.__res, null, {timeout:20000}).then(h=>h.jsonValue()).catch(()=>({status:'timeout'}));
    if (res?.status !== 'success') failures.push({ id:s.id, title:s.title, name:s.name, res });
  }
  await ctx.close();
}
await Promise.all(Array.from({length:8}, worker));
await browser.close(); server.close();
console.log(`\n${failures.length} play functions did not report success:`);
for (const f of failures) console.log(`  ${f.title} / ${f.name}: ${JSON.stringify(f.res).slice(0,220)}`);
