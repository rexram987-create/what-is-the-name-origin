// Self-tests v1.0.0 — run with ?diagnostics=1 and press the diagnostics test button.
(() => {
  const GIVEN=[
    {input:'Victoria',canonical:/Victoria/i,meaning:/ניצחון/},
    {input:'ויקטוריה',canonical:/Victoria/i,meaning:/ניצחון/},
    {input:'Sophia',canonical:/Sophia/i,meaning:/חוכמה/}
  ];
  const LOCAL=[
    {name:'historical.kushta',run:()=>{const r=window.HistoricalNameResolver?.resolve?.('קושטא');return !!r&&/איסטנבול/.test(r.canonical||'')&&/קונסטנטינוס/.test(r.result?.meaning||'');}},
    {name:'historical.leningrad',run:()=>{const r=window.HistoricalNameResolver?.resolve?.('לנינגרד');return !!r&&/סנקט פטרבורג/.test(r.canonical||'')&&/לנין/.test(r.result?.meaning||'');}},
    {name:'component.bombay-state',run:()=>window.NameComponentResolver?.resolve?.('Bombay State')?.component==='Bombay'},
    {name:'component.new-york-city',run:()=>window.NameComponentResolver?.resolve?.('New York City')?.component==='New York'},
    {name:'component.he-parenthetical',run:()=>window.NameComponentResolver?.resolve?.('בומביי (מדינה)')?.component==='בומביי'}
  ];
  async function run(){
    const D=window.NameOriginDiagnostics,results=[]; if(!D)return results; D.push('tests.start','info','regression suite');
    for(const t of LOCAL){try{const pass=!!t.run();results.push({test:t.name,pass});D.push(`test.${t.name}`,pass?'ok':'error',pass);}catch(e){results.push({test:t.name,pass:false,error:e.message});D.fail(`test.${t.name}`,e);}}
    const E=window.GivenNameEtymology;
    if(E?.build&&E?.canonicalName)for(const t of GIVEN){try{const canonical=await E.canonicalName(t.input),r=await E.build(t.input),text=[r?.meaning,r?.plainLanguage,r?.simpleSummary].filter(Boolean).join(' '),pass=t.canonical.test(canonical||'')&&t.meaning.test(text);results.push({test:`given.${t.input}`,pass,canonical});D.push(`test.given.${t.input}`,pass?'ok':'error',{canonical,meaning:r?.meaning||''});}catch(e){results.push({test:`given.${t.input}`,pass:false,error:e.message});}}
    // Network regression: a bare historical alias must prefer the modern city, not a similarly named former state/region.
    try{const r=await window.HistoricalNameResolver?.resolveAuto?.('בומביי');const pass=!!r&&/מומבאי|Mumbai/i.test(r.canonical||'');results.push({test:'network.bombay-to-mumbai',pass,canonical:r?.canonical||'',qid:r?.qid||''});D.push('test.network.bombay-to-mumbai',pass?'ok':'error',r||null);}catch(e){results.push({test:'network.bombay-to-mumbai',pass:false,error:e.message});}
    const passed=results.filter(x=>x.pass).length;D.push('tests.end',passed===results.length?'ok':'warn',`${passed}/${results.length} passed`);D.showPanel();return results;
  }
  function addButton(){if(new URLSearchParams(location.search).get('diagnostics')!=='1')return;const panel=document.getElementById('diagnosticsPanel');if(!panel||document.getElementById('runSelfTests'))return;const b=document.createElement('button');b.id='runSelfTests';b.type='button';b.textContent='הרץ בדיקות אוטומטיות';b.style.cssText='margin:8px 0';b.onclick=run;panel.insertBefore(b,document.getElementById('diagnosticsOutput'));}
  window.NameOriginSelfTests={run,local:LOCAL,given:GIVEN};window.addEventListener('DOMContentLoaded',()=>setTimeout(addButton,0));
})();