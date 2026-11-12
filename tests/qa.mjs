import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url'; import path from 'node:path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch();
const res = []; const ok=(n,c,x='')=>res.push(`${c?'PASS':'FAIL'}  ${n}${x?'  ('+x+')':''}`);
const p = await b.newPage({ viewport:{width:1400,height:1000} });
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+dir+'/out/test.html#R3-B3'); await p.waitForTimeout(300);
ok('loads with totals', /LN2 Freezer · [\d,]+ vials · 11 boxes/.test(await p.textContent('#totals')), await p.textContent('#totals'));
ok('opens box from link', (await p.textContent('#main h2')).includes('Rack 3 · Box 3'));
ok('pos 71 shows empty', await p.$('.cell.empty[data-pos="71"]')!==null);
// remove pos 1
const name1 = await p.textContent('.cell[data-pos="1"] .nm');
await p.click('.cell[data-pos="1"]'); await p.click('#doRemove'); await p.fill('#rmReason','QA test'); await p.click('#rmForm button[type=submit]'); await p.waitForTimeout(100);
ok('remove frees position', await p.$('.cell.empty[data-pos="1"]')!==null, name1);
let st = await p.evaluate(()=>({s:window.__store.boxes['R3-B3'].slots['1'], log:Object.values(window.__store.log)}));
ok('remove logged with reason + user', st.s===null && st.log.some(l=>l.act==='remove'&&l.pos===1&&l.note==='QA test'&&l.who==='u_test'));
// undo
await p.click('#logBtn'); await p.waitForTimeout(100);
ok('activity shows names', (await p.textContent('#main')).includes('Test User'));
ok('undo button present', (await p.$$('[data-restore]')).length>=1);
await p.click(`tr:has-text("QA test") [data-restore]`); await p.waitForTimeout(100);
st = await p.evaluate(()=>window.__store.boxes['R3-B3'].slots['1']);
ok('undo restores vial', st && st.n===name1);
await p.click('#closeLog');
// add 3 starting at 71
await p.click('.cell[data-pos="71"]'); await p.click('#doAdd'); await p.fill('#f_n','QA line'); await p.fill('#f_p','P3'); await p.fill('#f_qty','3'); await p.click('#vf button[type=submit]'); await p.waitForTimeout(100);
st = await p.evaluate(()=>{const s=window.__store.boxes['R3-B3'].slots; return [71,72,73,74,75,76,77,78,79,80,81].map(k=>s[k]?.n||null)});
ok('add x3 fills next empty positions', st.filter(x=>x==='QA line').length===3, JSON.stringify(st));
// edit
const p71 = await p.$('.cell[data-pos="71"]'); await p71.click(); await p.click('#doEdit'); await p.fill('#f_p','P9'); await p.fill('#f_m',''); await p.click('#vf button[type=submit]'); await p.waitForTimeout(100);
st = await p.evaluate(()=>window.__store.boxes['R3-B3'].slots['71']);
ok('edit saves', st.p==='P9');
// duplicate: within this box and into another box
await p.click('.cell[data-pos="1"]'); await p.waitForTimeout(50);
const srcName = (await p.textContent('.cell[data-pos="1"] .nm')).trim();
await p.click('#doDup');
const empt = await p.$$eval('.cell.empty', els=>els.slice(0,2).map(e=>+e.dataset.pos));
for (const k of empt) await p.click(`.cell[data-pos="${k}"]`);
await p.click('.cell[data-pos="2"]'); // filled: must not be selected
await p.click('.boxbtn[data-box="R1-B1"]'); await p.waitForTimeout(50);
ok('duplicate: mode survives switching box', !!(await p.$('#dupForm')));
await p.fill('#dupN','2'); await p.click('#dupFill button[type=submit]');
ok('duplicate: 4 copies selected across 2 boxes', /4\s*copies selected/.test(await p.textContent('#detail')), (await p.textContent('#detail')).slice(0,160));
await p.click('#dupForm button[type=submit]'); await p.waitForTimeout(150);
const dr = await p.evaluate(([e,src])=>{ const a=window.__store.boxes['R3-B3'].slots;
  return { inA:e.filter(k=>a[k]&&a[k].n===src).length,
           logs:Object.values(window.__store.log).filter(l=>l.act==='add'&&/^Copy of Rack 3 · Box 3 · position 1$/.test(l.note)).length }; }, [empt, srcName]);
ok('duplicate: copies written and logged', dr.inA===2 && dr.logs===4, JSON.stringify(dr));
ok('duplicate: mode ends after confirm', !(await p.$('#dupForm')));
await p.click('.boxbtn[data-box="R3-B3"]'); await p.waitForTimeout(50);
// multi remove
await p.click('#multiStart'); for (const k of [2,3]) await p.click(`.cell[data-pos="${k}"]`);
await p.click('#multiForm button[type=submit]'); await p.waitForTimeout(100);
st = await p.evaluate(()=>[window.__store.boxes['R3-B3'].slots['2'],window.__store.boxes['R3-B3'].slots['3']]);
ok('remove several', st[0]===null&&st[1]===null);
// search
await p.fill('#q','hela'); await p.waitForTimeout(300);
const h=await p.textContent('#main h2'); ok('search finds HeLa vials', /^\d+ vials? match/.test(h)&&!h.startsWith('0 '), h);
await p.click('.res'); await p.waitForTimeout(100);
ok('search result opens box + position', (await p.$('.cell.sel'))!==null);
// add box + duplicate
await p.fill('#nbR','4'); await p.fill('#nbB','3'); await p.click('#newbox button'); await p.waitForTimeout(100);
ok('new box created', (await p.textContent('#main h2')).includes('Rack 4 · Box 3'));
// export
await p.click('#exportBtn'); await p.waitForTimeout(100);
const sv = await p.evaluate(()=>window.__saved);
ok('CSV export', sv && sv.filename.endsWith('.csv') && sv.data.split('\r\n').length>100, sv&&sv.filename+' '+(sv.data.split('\r\n').length-1)+' rows');
const real=errs.filter(e=>!/ERR_|Failed to load resource/.test(e)); ok('no script errors', real.length===0, real.join(' | '));
await p.screenshot({path:dir+'/out/desk.png'});
// phone + dark
const m = await b.newPage({ viewport:{width:390,height:844}, colorScheme:'dark' });
await m.goto('file://'+dir+'/out/test.html#R1-B4'); await m.waitForTimeout(300);
const ov = await m.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
ok('phone: no sideways page scroll', ov<=0, 'overflow '+ov+'px');
const gw=await m.evaluate(()=>{const g=document.querySelector('.gridscroll');return g.scrollWidth-g.clientWidth}); ok('phone: whole 9x9 box fits on screen', gw<=0, gw+'px');
await m.click('.cell[data-pos="3"]'); await m.waitForTimeout(400);
await m.screenshot({path:dir+'/out/phone.png', fullPage:false});
// read-only
const r = await b.newPage(); await r.goto('file://'+dir+'/out/test_ro.html#R1-B1'); await r.waitForTimeout(300);
await r.click('.cell[data-pos="1"]');
ok('read-only: banner shown, no remove/add', !(await r.isHidden('#ro')) && !(await r.$('#doRemove')) && !(await r.$('#newbox')));
console.log(res.join('\n')); await b.close();
