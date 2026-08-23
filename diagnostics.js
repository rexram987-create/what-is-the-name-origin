// Diagnostics v0.8.2 — exact tracing + inline user-visible issue card.
(() => {
  const events = [];
  let currentSearch = null;
  const originalFetch = window.fetch.bind(window);
  const IMPORTANT_WARNINGS = /no_evidence|translation_missing|no_pages|no_name_entity|pipeline\.fallback|section\.error|infobox\.error|api\.retry/i;

  function now() { return new Date().toISOString(); }
  function safeUrl(value) {
    try { const u = new URL(String(value), location.href); u.searchParams.delete('origin'); return u.toString(); }
    catch { return String(value || ''); }
  }
  function errorObject(error, extra = {}) {
    const e = error instanceof Error ? error : new Error(String(error || 'Unknown error'));
    return { name:e.name||'Error', message:e.message||String(e), stack:e.stack?String(e.stack).split('\n').slice(0,5).join(' | '):'', ...extra };
  }
  function cleanDetail(detail) {
    if (detail == null) return '';
    if (detail instanceof Error) detail = errorObject(detail);
    if (typeof detail === 'string') return detail.slice(0,1200);
    try { return JSON.stringify(detail).slice(0,2400); } catch { return String(detail).slice(0,1200); }
  }
  function detailObject(detail) {
    if (!detail) return null;
    if (typeof detail === 'object') return detail;
    try { return JSON.parse(detail); } catch { return null; }
  }
  function prettyDetail(detail) {
    if (!detail) return '';
    const obj = detailObject(detail);
    if (!obj) return String(detail);
    const parts=[];
    if(obj.message)parts.push(`מה קרה: ${obj.message}`);
    if(obj.status)parts.push(`HTTP: ${obj.status}${obj.statusText?` ${obj.statusText}`:''}`);
    if(obj.url)parts.push(`מקור: ${obj.url}`);
    if(obj.fallback)parts.push(`מה המערכת עשתה אחר כך: ${obj.fallback}`);
    if(obj.input)parts.push(`קלט: ${obj.input}`);
    if(obj.canonical)parts.push(`שם קנוני: ${obj.canonical}`);
    return parts.length?parts.join('\n'):String(detail);
  }
  function stageHe(stage='') {
    const map={
      'given.build.no_result':'מנוע האטימולוגיה של שמות פרטיים',
      'given.research.no_evidence':'חילוץ האטימולוגיה מהמקורות',
      'given.research.no_pages':'פתיחת דפי המקור',
      'given.gloss.translation_missing':'תרגום המשמעות לעברית',
      'given.canonical.no_name_entity':'זיהוי השם הפרטי ב־Wikidata',
      'given.canonical.error':'זיהוי הצורה הבינלאומית של השם',
      'http.error':'פנייה למקור חיצוני',
      'network.error':'תקשורת עם מקור חיצוני',
      'browser.error':'קוד היישומון',
      'browser.unhandledrejection':'פעולה אסינכרונית ביישומון'
    };
    return map[stage] || stage;
  }

  function ensureInlineIssue() {
    let box=document.getElementById('diagnosticsInlineIssue');
    if(box)return box;
    box=document.createElement('section');box.id='diagnosticsInlineIssue';box.hidden=true;
    box.style.cssText='max-width:1100px;margin:14px auto;padding:14px 16px;border:1px solid #8b5b48;border-radius:12px;background:#241d18;color:#f1e9df;direction:rtl;line-height:1.6';
    const title=document.createElement('strong');title.id='diagnosticsInlineTitle';title.style.cssText='display:block;font-size:17px;margin-bottom:6px';
    const text=document.createElement('div');text.id='diagnosticsInlineText';text.style.cssText='white-space:pre-wrap';
    const button=document.createElement('button');button.type='button';button.textContent='הצג פרטים טכניים';button.style.cssText='margin-top:10px';button.onclick=()=>{showPanel();document.getElementById('diagnosticsPanel')?.scrollIntoView({behavior:'smooth',block:'center'});};
    box.append(title,text,button);
    const anchor=document.getElementById('resultSection')||document.getElementById('statusSection')||document.querySelector('main');
    anchor?.parentNode?.insertBefore(box,anchor);
    return box;
  }
  function showInlineIssue(row) {
    const box=ensureInlineIssue(); if(!box)return;
    const title=document.getElementById('diagnosticsInlineTitle'); const text=document.getElementById('diagnosticsInlineText');
    const severe=row.status==='error';
    title.textContent=severe?'⚠️ נמצאה בעיה בתהליך החיפוש':'ℹ️ נמצאה מגבלה בתהליך החיפוש';
    text.textContent=`שלב: ${stageHe(row.stage)}\n${prettyDetail(row.detail)||'השלב לא הושלם כמצופה.'}`;
    box.style.borderColor=severe?'#9b5555':'#8b6d48';box.style.background=severe?'#281919':'#241d18';box.hidden=false;
  }
  function clearInlineIssue(){const box=document.getElementById('diagnosticsInlineIssue');if(box)box.hidden=true;}

  function push(stage,status='info',detail='') {
    const row={time:now(),search:currentSearch,stage,status,detail:cleanDetail(detail)};events.push(row);if(events.length>350)events.shift();
    if(status==='error'){showPanel();showInlineIssue(row);} else if(status==='warn'&&IMPORTANT_WARNINGS.test(stage)) showInlineIssue(row);
    render();return row;
  }
  function start(search){currentSearch=String(search||'').trim();clearInlineIssue();push('search.start','info',currentSearch);}
  function end(detail=''){push('search.end','ok',detail);}
  function fail(stage,detail=''){push(stage,'error',detail);}
  function warn(stage,detail=''){push(stage,'warn',detail);}
  function ok(stage,detail=''){push(stage,'ok',detail);}
  function fallback(from,to,reason=''){warn('pipeline.fallback',{message:reason||'המסלול הראשי לא החזיר תוצאה',fallback:`${from} → ${to}`});}

  function ensurePanel(){
    let panel=document.getElementById('diagnosticsPanel');if(panel)return panel;
    panel=document.createElement('details');panel.id='diagnosticsPanel';panel.style.cssText='max-width:1100px;margin:20px auto;padding:14px;border:1px solid #59655f;border-radius:12px;background:#111615;color:#e8eee9;font:14px/1.55 system-ui;direction:rtl';
    const summary=document.createElement('summary');summary.textContent='אבחון טכני — מה קרה בחיפוש?';summary.style.cssText='cursor:pointer;font-weight:700;font-size:16px';
    const latest=document.createElement('div');latest.id='diagnosticsLatestError';latest.style.cssText='display:none;margin:12px 0;padding:10px;border:1px solid #8b4b4b;border-radius:9px;background:#281919;white-space:pre-wrap';
    const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:12px 0';
    const copy=document.createElement('button');copy.type='button';copy.textContent='העתק דוח אבחון';copy.onclick=async()=>{try{await navigator.clipboard.writeText(report());copy.textContent='הועתק';setTimeout(()=>copy.textContent='העתק דוח אבחון',1200);}catch(e){fail('diagnostics.copy.error',e);}};
    const clear=document.createElement('button');clear.type='button';clear.textContent='נקה דוח';clear.onclick=()=>{events.length=0;clearInlineIssue();render();};actions.append(copy,clear);
    const pre=document.createElement('pre');pre.id='diagnosticsOutput';pre.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;margin:0;color:#d7e0da;direction:ltr;text-align:left';
    panel.append(summary,latest,actions,pre);(document.querySelector('main')||document.body).appendChild(panel);return panel;
  }
  function showPanel(){const p=ensurePanel();p.open=true;}
  function render(){
    const out=document.getElementById('diagnosticsOutput'),latestBox=document.getElementById('diagnosticsLatestError');if(!out)return;
    const relevant=currentSearch?events.filter(e=>e.search===currentSearch):events;
    out.textContent=relevant.slice(-60).map(e=>`${e.status.toUpperCase()} · ${e.stage}${e.detail?` · ${e.detail}`:''}`).join('\n')||'עדיין אין אירועי אבחון.';
    if(latestBox){const issue=[...relevant].reverse().find(e=>e.status==='error'||(e.status==='warn'&&IMPORTANT_WARNINGS.test(e.stage)));if(issue){latestBox.style.display='block';latestBox.textContent=`הבעיה/המגבלה האחרונה\nשלב: ${stageHe(issue.stage)}\n${prettyDetail(issue.detail)}`;}else{latestBox.style.display='none';latestBox.textContent='';}}
  }
  function report(){return events.map(e=>`[${e.time}] ${e.status.toUpperCase()} ${e.stage} search=${e.search||'-'}${e.detail?` detail=${e.detail}`:''}`).join('\n');}

  window.fetch=async function diagnosedFetch(input,init={}){
    const url=safeUrl(typeof input==='string'||input instanceof URL?input:input?.url),method=String(init?.method||input?.method||'GET').toUpperCase(),started=performance.now();
    try{const response=await originalFetch(input,init);if(!response.ok)fail('http.error',{message:`HTTP ${response.status}`,status:response.status,statusText:response.statusText,method,url,elapsedMs:Math.round(performance.now()-started)});return response;}
    catch(error){fail('network.error',errorObject(error,{method,url,elapsedMs:Math.round(performance.now()-started)}));throw error;}
  };

  function installGivenNameWrapper(){
    const engine=window.GivenNameEtymology;if(!engine?.build||engine.__diagnosticsWrapped)return;const originalBuild=engine.build.bind(engine);
    engine.build=async function(input){push('given.build.start','info',{input:String(input||'')});try{const result=await originalBuild(input);if(!result){fail('given.build.no_result',{message:'מנוע השמות הפרטיים סיים בלי תוצאה אטימולוגית',input:String(input||''),fallback:'היישומון עשוי לעבור למסלול החיפוש הכללי'});}else ok('given.build.result',{input:String(input||''),title:result.title,meaning:result.meaning||''});return result;}catch(error){fail('given.build.exception',errorObject(error,{input:String(input||''),fallback:'היישומון עשוי לעבור למסלול החיפוש הכללי'}));throw error;}};engine.__diagnosticsWrapped=true;
  }

  if(new URLSearchParams(location.search).get('diagnostics')==='1')window.addEventListener('DOMContentLoaded',()=>{ensurePanel().open=true;render();});
  window.addEventListener('DOMContentLoaded',()=>{installGivenNameWrapper();ensureInlineIssue();});setTimeout(installGivenNameWrapper,0);
  window.addEventListener('error',e=>fail('browser.error',errorObject(e.error||e.message,{source:e.filename||'',line:e.lineno||0,column:e.colno||0})));
  window.addEventListener('unhandledrejection',e=>fail('browser.unhandledrejection',errorObject(e.reason)));
  window.NameOriginDiagnostics={start,end,push,ok,warn,fail,fallback,showPanel,showInlineIssue,report,get events(){return[...events];}};
})();
