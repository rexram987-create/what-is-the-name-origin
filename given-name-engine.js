// Generic given-name etymology engine v0.7.2
// Rule-based: searches the name itself and extracts explicit etymology statements.
(() => {
  const LANG_HE = {Latin:'לטינית', Greek:'יוונית', 'Ancient Greek':'יוונית עתיקה', German:'גרמנית', French:'צרפתית', 'Old French':'צרפתית עתיקה', English:'אנגלית', Hebrew:'עברית', Arabic:'ערבית', Italian:'איטלקית', Spanish:'ספרדית', Germanic:'גרמאנית'};
  const GLOSS_HE = {
    victory:'ניצחון', winner:'מנצח', conqueror:'כובש / מנצח', wisdom:'חוכמה', peace:'שלום', light:'אור', hope:'תקווה', faith:'אמונה', grace:'חסד', love:'אהבה', beloved:'אהוב/ה', strong:'חזק/ה', brave:'אמיץ/ה', noble:'אציל/ה', free:'חופשי/ה', man:'אדם / איש', ruler:'שליט', king:'מלך', queen:'מלכה', god:'אל', gift:'מתנה', life:'חיים', joy:'שמחה', happiness:'אושר', beautiful:'יפה', pure:'טהור/ה', flower:'פרח', star:'כוכב', sea:'ים'
  };
  const clean = s => String(s||'').replace(/\[[^\]]*\]/g,' ').replace(/\s+/g,' ').trim();
  const strip = s => clean(s).replace(/[“”"'‘’]/g,'').trim();

  async function json(url){ const r=await fetch(url,{headers:{Accept:'application/json'}}); if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }

  async function pageExtract(host,title){
    const u=new URL(`https://${host}/w/api.php`);
    u.searchParams.set('action','query'); u.searchParams.set('prop','extracts|info'); u.searchParams.set('inprop','url');
    u.searchParams.set('explaintext','1'); u.searchParams.set('redirects','1'); u.searchParams.set('titles',title);
    u.searchParams.set('format','json'); u.searchParams.set('origin','*');
    const p=Object.values((await json(u)).query?.pages||{})[0];
    return (!p||p.missing!==undefined)?null:{text:clean(p.extract),url:p.fullurl,title:p.title,host};
  }

  async function parsePage(host,title){
    const u=new URL(`https://${host}/w/api.php`);
    u.searchParams.set('action','parse'); u.searchParams.set('page',title); u.searchParams.set('prop','wikitext|sections');
    u.searchParams.set('redirects','1'); u.searchParams.set('format','json'); u.searchParams.set('origin','*');
    return (await json(u)).parse || null;
  }

  async function section(host,title){
    const parsed=await parsePage(host,title); if(!parsed)return '';
    const hit=(parsed.sections||[]).find(x=>/etymolog|origin|meaning|name/i.test((x.line||'').replace(/<[^>]+>/g,'')));
    if(!hit)return '';
    const q=new URL(`https://${host}/w/api.php`); q.searchParams.set('action','parse'); q.searchParams.set('page',title); q.searchParams.set('section',hit.index);
    q.searchParams.set('prop','text'); q.searchParams.set('redirects','1'); q.searchParams.set('format','json'); q.searchParams.set('origin','*');
    const html=(await json(q)).parse?.text?.['*']||'';
    const doc=new DOMParser().parseFromString(html,'text/html');
    doc.querySelectorAll('table,style,script,sup,.mw-editsection').forEach(e=>e.remove());
    return clean(doc.body.textContent);
  }

  function normalizeGloss(g){ return strip(g).toLowerCase().replace(/^(the|a|an)\s+/,'').replace(/[.?!,:;]+$/,'').trim(); }
  function glossHe(g){
    const k=normalizeGloss(g); if(GLOSS_HE[k])return GLOSS_HE[k];
    const simple=k.replace(/^to\s+/,''); if(GLOSS_HE[simple])return GLOSS_HE[simple];
    for(const [en,he] of Object.entries(GLOSS_HE)) if(simple===en || simple.includes(en)) return he;
    return null;
  }

  function evidence(text){
    const t=clean(text).slice(0,16000); if(!t)return null;
    const patterns=[
      /(?:derived|comes|coming|originates)\s+from\s+(?:the\s+)?(?:(Ancient Greek|Old French|Latin|Greek|Germanic|German|French|English|Hebrew|Arabic|Italian|Spanish)\s+)?(?:word\s+)?([\p{L}\p{M}-]{1,80})\s*,?\s*(?:meaning|means)\s+[“"'‘’]?([^”"'‘’.;,()]{1,60})/iu,
      /from\s+(Ancient Greek|Old French|Latin|Greek|Germanic|German|French|English|Hebrew|Arabic|Italian|Spanish)\s+([\p{L}\p{M}-]{1,80})\s*[\(（]\s*[“"'‘’]?([^”"'‘’)）]{1,60})[”"'‘’]?\s*[\)）]/iu,
      /(Ancient Greek|Old French|Latin|Greek|Germanic|German|French|English|Hebrew|Arabic|Italian|Spanish)\s+(?:word\s+)?([\p{L}\p{M}-]{1,80})\s*,?\s*(?:meaning|means)\s+[“"'‘’]?([^”"'‘’.;,()]{1,60})/iu,
      /\b([\p{L}\p{M}-]+)\s+is\s+the\s+(Ancient Greek|Old French|Latin|Greek|Germanic|German|French|English|Hebrew|Arabic|Italian|Spanish)\s+word\s+for\s+[“"'‘’]?([^”"'‘’.;,()]{1,60})/iu,
      /from\s+([\p{L}\p{M}-]{1,80})\s*[\(（]\s*[“"'‘’]?([^”"'‘’)）]{1,60})[”"'‘’]?\s*[\)）]/iu
    ];
    for(let i=0;i<patterns.length;i++){
      const m=t.match(patterns[i]); if(!m)continue;
      let lang='',root='',gloss='';
      if(i<=2){lang=m[1]||'';root=m[2]||'';gloss=m[3]||'';}
      else if(i===3){root=m[1]||'';lang=m[2]||'';gloss=m[3]||'';}
      else {root=m[1]||'';gloss=m[2]||'';const pre=t.slice(Math.max(0,m.index-100),m.index);lang=(pre.match(/Ancient Greek|Old French|Latin|Greek|Germanic|German|French|English|Hebrew|Arabic|Italian|Spanish/i)||[])[0]||'';}
      root=strip(root); gloss=normalizeGloss(gloss); if(root&&gloss)return {lang,root,gloss};
    }
    return null;
  }

  // Generic Wikipedia given-name infobox fallback. Many name pages expose structured
  // fields such as |word/name=Latin victoria and |meaning=Victory even when prose parsing fails.
  function infoboxEvidence(wikitext=''){
    const w=String(wikitext||''); if(!w)return null;
    const field=(names)=>{
      for(const n of names){const r=new RegExp(`^\\|\\s*${n}\\s*=\\s*(.+)$`,'im');const m=w.match(r);if(m)return strip(m[1].replace(/\{\{[^{}]*\}\}/g,' ').replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g,'$2'));}
      return '';
    };
    const meaning=normalizeGloss(field(['meaning']));
    let word=field(['word\\/name','word','name origin']);
    let origin=field(['origin','language']);
    if(!meaning)return null;
    let lang=(word.match(/Ancient Greek|Old French|Latin|Greek|Germanic|German|French|English|Hebrew|Arabic|Italian|Spanish/i)||origin.match(/Ancient Greek|Old French|Latin|Greek|Germanic|German|French|English|Hebrew|Arabic|Italian|Spanish/i)||[])[0]||'';
    let root=word.replace(new RegExp(`^(?:${lang})\\s*`,'i'),'').trim();
    if(!root && origin && !/^[A-Za-z ]+$/.test(origin)) root=origin;
    if(!root) return null;
    return {lang,root:strip(root),gloss:meaning};
  }

  async function research(name){
    const variants=[`${name} (given name)`,`${name} (name)`,name];
    const jobs=[];
    for(const title of variants){ jobs.push(pageExtract('en.wikipedia.org',title)); jobs.push(pageExtract('en.wiktionary.org',title)); }
    const settled=await Promise.allSettled(jobs);
    const pages=settled.filter(x=>x.status==='fulfilled'&&x.value?.text).map(x=>x.value);

    for(const p of pages){
      // 1. Prose/section evidence.
      const texts=[p.text]; try{const s=await section(p.host,p.title);if(s)texts.unshift(s);}catch{}
      for(const text of texts){const ev=evidence(text);if(!ev)continue;const he=glossHe(ev.gloss);if(he)return {ev,he,page:p,pages};}

      // 2. Structured infobox evidence for Wikipedia pages.
      if(p.host==='en.wikipedia.org'){
        try{
          const parsed=await parsePage(p.host,p.title);
          const ev=infoboxEvidence(parsed?.wikitext?.['*']||'');
          const he=ev&&glossHe(ev.gloss);
          if(ev&&he)return {ev,he,page:p,pages};
        }catch{}
      }
    }
    return null;
  }

  async function build(name){
    const r=await research(name); if(!r)return null;
    const lang=LANG_HE[r.ev.lang]||r.ev.lang||'שפת המקור המתועדת';
    const root=strip(r.ev.root); const meaning=r.he;
    return {
      title:name, type:'שם פרטי', subtitle:'שם פרטי — אטימולוגיה שנמצאה ממקור לשוני מפורש', confidence:'medium', confidenceLabel:'רמת ודאות: טובה',
      simpleSummary:`נמצא מקור לשוני מפורש לשם ${name}: ${root} — „${meaning}”.`,
      whatIsIt:`${name} הוא שם פרטי. המנוע חיפש את ערך השם עצמו ולא אנשים, ערים או יצירות שנקראים כך.`,
      meaning:`לפי המקור שנמצא, השם קשור ל־${root}, שפירושו „${meaning}”.`,
      originStory:`המקור הלשוני שנמצא הוא ${lang}: ${root}. במקור הוא מוסבר במשמעות „${r.ev.gloss}”, כלומר בעברית „${meaning}”.`,
      path:[`${root} — ${lang}`,`${name} — שם פרטי`],
      changes:'המנוע מציג כאן רק שלבים שנמצאו במפורש במקור. שלבי ביניים נוספים לא יומצאו.',
      certainty:'נמצאה טענה אטימולוגית מפורשת או שדה מקור מובנה בערך השם. הצלבה עם מקור עצמאי נוסף עדיין יכולה לחזק את התוצאה.',
      plainLanguage:`בקיצור: ${name} קשור למילה ${root}, שמשמעותה „${meaning}”.`,
      sources:[{name:r.page.host.includes('wiktionary')?'Wiktionary — ערך השם':'Wikipedia — ערך השם',url:r.page.url}]
    };
  }

  window.GivenNameEtymology={build,research,evidence,infoboxEvidence};
})();
