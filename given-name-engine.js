// Generic given-name etymology engine v0.8.3
// Multilingual, instrumented and able to follow "form/variant of" etymology links.
(() => {
  const D = () => window.NameOriginDiagnostics;
  const LANG_HE = {Latin:'לטינית', Greek:'יוונית', 'Ancient Greek':'יוונית עתיקה', German:'גרמנית', French:'צרפתית', 'Old French':'צרפתית עתיקה', 'Old Occitan':'אוקסיטנית עתיקה', English:'אנגלית', Hebrew:'עברית', 'Biblical Hebrew':'עברית מקראית', Arabic:'ערבית', Italian:'איטלקית', Spanish:'ספרדית', Germanic:'גרמאנית'};
  const GLOSS_HE = {
    victory:'ניצחון', winner:'מנצח', conqueror:'כובש / מנצח', wisdom:'חוכמה', peace:'שלום', light:'אור', hope:'תקווה', faith:'אמונה', grace:'חסד', love:'אהבה', beloved:'אהוב/ה', strong:'חזק/ה', brave:'אמיץ/ה', noble:'אציל/ה', free:'חופשי/ה', man:'אדם / איש', ruler:'שליט', king:'מלך', queen:'מלכה', god:'אל', gift:'מתנה', life:'חיים', joy:'שמחה', happiness:'אושר', beautiful:'יפה', pure:'טהור/ה', flower:'פרח', star:'כוכב', sea:'ים',
    'my god is an oath':'אלי הוא שבועה', 'god is my oath':'אלוהים הוא שבועתי', 'my god has sworn':'אלי נשבע'
  };
  const GIVEN_NAME_CLASSES = new Set(['Q202444','Q11879590','Q12308941','Q3409032']);
  const cache = new Map();
  const clean = s => String(s||'').replace(/\[[^\]]*\]/g,' ').replace(/\s+/g,' ').trim();
  const strip = s => clean(s).replace(/[“”"'‘’]/g,'').trim();
  const langPattern = 'Ancient Greek|Biblical Hebrew|Old Occitan|Old French|Latin|Greek|Germanic|German|French|English|Hebrew|Arabic|Italian|Spanish';

  async function json(url){
    const key=String(url); if(cache.has(key)) return cache.get(key);
    let lastError;
    for(let attempt=1;attempt<=2;attempt++){
      try{const r=await fetch(url,{headers:{Accept:'application/json'}});if(!r.ok)throw new Error('HTTP '+r.status);const data=await r.json();cache.set(key,data);return data;}
      catch(e){lastError=e;D()?.warn('api.retry',{url:new URL(key).hostname,attempt,error:e.message});}
    }
    throw lastError;
  }

  function looksLatin(name=''){return /[A-Za-zÀ-ÿ]/.test(name)&&!/[\u0590-\u05FF\u0600-\u06FF\u0400-\u04FF]/.test(name);}
  function looksGivenNameDescription(desc=''){return /given name|first name|forename|female given name|male given name|feminine given name|masculine given name|personal name|שם פרטי|שם נשי|שם גברי/i.test(desc);}
  function searchLanguages(name=''){if(/[\u0590-\u05FF]/.test(name))return['he','en'];if(/[\u0600-\u06FF]/.test(name))return['ar','en'];if(/[\u0400-\u04FF]/.test(name))return['ru','bg','uk','en'];if(/[\u0370-\u03FF]/.test(name))return['el','en'];return['en'];}
  function isGivenNameEntity(entity={}){return(entity.claims?.P31||[]).some(c=>GIVEN_NAME_CLASSES.has(c.mainsnak?.datavalue?.value?.id));}

  async function canonicalName(input){
    const original=strip(input);D()?.push('given.canonical.start','info',original);
    if(!original||looksLatin(original)){D()?.ok('given.canonical.ready',original);return original;}
    try{
      const searches=await Promise.allSettled(searchLanguages(original).map(async language=>{const s=new URL('https://www.wikidata.org/w/api.php');s.searchParams.set('action','wbsearchentities');s.searchParams.set('search',original);s.searchParams.set('language',language);s.searchParams.set('uselang','en');s.searchParams.set('format','json');s.searchParams.set('origin','*');s.searchParams.set('limit','12');return(await json(s)).search||[];}));
      const found=[...new Map(searches.flatMap(x=>x.status==='fulfilled'?x.value:[]).map(x=>[x.id,x])).values()];D()?.push('given.canonical.candidates',found.length?'ok':'warn',found.slice(0,6).map(x=>`${x.id}:${x.label}:${x.description||''}`));if(!found.length)return original;
      const ids=found.map(x=>x.id).filter(Boolean).slice(0,12);const q=new URL('https://www.wikidata.org/w/api.php');q.searchParams.set('action','wbgetentities');q.searchParams.set('ids',ids.join('|'));q.searchParams.set('props','labels|descriptions|claims');q.searchParams.set('languages','en|he|ar|ru|bg');q.searchParams.set('format','json');q.searchParams.set('origin','*');const entities=(await json(q)).entities||{};
      for(const id of ids){const e=entities[id]||{},en=e.labels?.en?.value;if(en&&isGivenNameEntity(e)){D()?.ok('given.canonical.entity_class',{id,canonical:en});return en;}}
      for(const id of ids){const e=entities[id]||{},desc=[e.descriptions?.en?.value,e.descriptions?.he?.value,found.find(x=>x.id===id)?.description].filter(Boolean).join(' | '),en=e.labels?.en?.value;if(en&&looksGivenNameDescription(desc)){D()?.ok('given.canonical.description',{id,canonical:en});return en;}}
      D()?.warn('given.canonical.no_name_entity','No candidate was classified as a given name');
    }catch(e){D()?.fail('given.canonical.error',e);}
    return original;
  }

  async function pageExtract(host,title){const u=new URL(`https://${host}/w/api.php`);u.searchParams.set('action','query');u.searchParams.set('prop','extracts|info');u.searchParams.set('inprop','url');u.searchParams.set('explaintext','1');u.searchParams.set('redirects','1');u.searchParams.set('titles',title);u.searchParams.set('format','json');u.searchParams.set('origin','*');const p=Object.values((await json(u)).query?.pages||{})[0];const result=(!p||p.missing!==undefined)?null:{text:clean(p.extract),url:p.fullurl,title:p.title,host};D()?.push('given.page.extract',result?'ok':'warn',`${host} :: ${title}${result?` -> ${result.title}`:' -> missing'}`);return result;}
  async function parsePage(host,title){const u=new URL(`https://${host}/w/api.php`);u.searchParams.set('action','parse');u.searchParams.set('page',title);u.searchParams.set('prop','wikitext|sections');u.searchParams.set('redirects','1');u.searchParams.set('format','json');u.searchParams.set('origin','*');return(await json(u)).parse||null;}
  async function section(host,title){const parsed=await parsePage(host,title);if(!parsed)return'';const hit=(parsed.sections||[]).find(x=>/etymolog|origin|meaning|derivation/i.test((x.line||'').replace(/<[^>]+>/g,'')));if(!hit){D()?.push('given.section','warn',`${host} :: ${title} -> no focused etymology section`);return'';}D()?.ok('given.section',`${host} :: ${title} -> ${hit.line}`);const q=new URL(`https://${host}/w/api.php`);q.searchParams.set('action','parse');q.searchParams.set('page',title);q.searchParams.set('section',hit.index);q.searchParams.set('prop','text');q.searchParams.set('redirects','1');q.searchParams.set('format','json');q.searchParams.set('origin','*');const html=(await json(q)).parse?.text?.['*']||'';const doc=new DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('table,style,script,sup,.mw-editsection').forEach(e=>e.remove());return clean(doc.body.textContent);}

  function normalizeGloss(g){return strip(g).toLowerCase().replace(/^(the|a|an)\s+/,'').replace(/[.?!,:;]+$/,'').trim();}
  function glossHe(g){const k=normalizeGloss(g);if(GLOSS_HE[k])return GLOSS_HE[k];const simple=k.replace(/^to\s+/,'');if(GLOSS_HE[simple])return GLOSS_HE[simple];for(const[en,he]of Object.entries(GLOSS_HE))if(simple===en||simple.includes(en))return he;return null;}

  function evidence(text){
    const t=clean(text).slice(0,20000);if(!t)return null;
    // Strong multi-step pattern: terminal etymon with an explicit gloss, e.g. Hebrew ... (“my God is an oath”).
    const terminal=new RegExp(`(?:from\\s+)?(${langPattern})\\s+([\\p{L}\\p{M}\\u0590-\\u05FF-]{1,80})\\s*\\([^)]*[“\"'‘’]([^”\"'‘’]{1,100})[”\"'‘’][^)]*\\)`,'iu');
    const tm=t.match(terminal);if(tm)return{lang:tm[1]||'',root:strip(tm[2]),gloss:normalizeGloss(tm[3])};
    const patterns=[
      new RegExp(`(?:derived|comes|coming|originates)\\s+from\\s+(?:the\\s+)?(?:(${langPattern})\\s+)?(?:word\\s+)?([\\p{L}\\p{M}-]{1,80})\\s*,?\\s*(?:meaning|means)\\s+[“\"'‘’]?([^”\"'‘’.;,()]{1,80})`,'iu'),
      new RegExp(`from\\s+(${langPattern})\\s+([\\p{L}\\p{M}-]{1,80})\\s*[\\(（]\\s*[“\"'‘’]?([^”\"'‘’)）]{1,80})[”\"'‘’]?\\s*[\\)）]`,'iu'),
      new RegExp(`\\b([\\p{L}\\p{M}-]+)\\s+is\\s+the\\s+(${langPattern})\\s+word\\s+for\\s+[“\"'‘’]?([^”\"'‘’.;,()]{1,80})`,'iu')
    ];
    for(let i=0;i<patterns.length;i++){const m=t.match(patterns[i]);if(!m)continue;return i===2?{root:strip(m[1]),lang:m[2]||'',gloss:normalizeGloss(m[3])}:{lang:m[1]||'',root:strip(m[2]),gloss:normalizeGloss(m[3])};}
    return null;
  }

  function relationEvidence(text,current=''){
    const t=clean(text).slice(0,5000);if(!t)return null;
    const rejected=new Set(['a','an','and','are','as','be','been','being','by','can','for','from','has','have','in','is','it','jan','of','on','or','that','the','this','to','was','were','with']);
    const patterns=[
      /(?:Latinate(?: and Italian)?|Latinized|Italian|French|Spanish|English)?\s*(?:form|variant|alternative form)\s+of\s+([A-Z][A-Za-zÀ-ÿ'’-]{1,50})/i,
      /(?:derived|borrowed)\s+from\s+(?:(?:Old )?[A-Z][A-Za-z ]+\s+)?([A-Z][A-Za-zÀ-ÿ'’-]{1,50})(?:\s|,|\.|$)/i
    ];
    for(const r of patterns){const m=t.match(r),candidate=strip(m?.[1]);if(candidate&&candidate.toLowerCase()!==String(current).toLowerCase()&&!rejected.has(candidate.toLowerCase()))return candidate;}
    return null;
  }

  function chainFromText(text,current=''){
    const t=clean(text).slice(0,12000);const re=new RegExp(`(?:from|borrowed from)\\s+(${langPattern})\\s+([\\p{L}\\p{M}\\u0590-\\u05FFÀ-ÿ'’-]{1,80})`,'giu');const chain=[];let m;
    while((m=re.exec(t))!==null){const label=strip(m[2]);if(label&&!chain.some(x=>x.label===label))chain.push({lang:m[1],label});}
    if(current&&!chain.some(x=>x.label.toLowerCase()===current.toLowerCase()))chain.unshift({lang:'',label:current});
    return chain;
  }

  function infoboxEvidence(wikitext=''){const w=String(wikitext||'');if(!w)return null;const field=names=>{for(const n of names){const r=new RegExp(`^\\|\\s*${n}\\s*=\\s*(.+)$`,'im'),m=w.match(r);if(m)return strip(m[1].replace(/\{\{[^{}]*\}\}/g,' ').replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g,'$2'));}return'';};const meaning=normalizeGloss(field(['meaning'])),word=field(['word\\/name','word','name origin']),origin=field(['origin','language']);if(!meaning)return null;const lang=(word.match(new RegExp(langPattern,'i'))||origin.match(new RegExp(langPattern,'i'))||[])[0]||'';let root=word.replace(new RegExp(`^(?:${lang})\\s*`,'i'),'').trim();if(!root&&origin&&!/^[A-Za-z ]+$/.test(origin))root=origin;if(!root)return null;return{lang,root:strip(root),gloss:meaning};}

  async function pagesFor(name){const variants=[`${name} (given name)`,`${name} (name)`,name];D()?.push('given.research.variants','info',variants);const jobs=[];for(const title of variants){jobs.push(pageExtract('en.wikipedia.org',title));jobs.push(pageExtract('en.wiktionary.org',title));}const settled=await Promise.allSettled(jobs);return settled.filter(x=>x.status==='fulfilled'&&x.value?.text).map(x=>x.value);}

  async function researchName(name,depth=0,visited=new Set()){
    const key=String(name).toLowerCase();if(visited.has(key)||depth>3){D()?.warn('given.follow.stop',{name,depth,reason:'cycle-or-depth'});return null;}visited.add(key);
    const pages=await pagesFor(name);D()?.push('given.research.pages',pages.length?'ok':'error',pages.map(p=>`${p.host}:${p.title}`));if(!pages.length)return null;
    let followTarget=null,followPage=null,followChain=[];
    for(const p of pages){
      const texts=[p.text];try{const s=await section(p.host,p.title);if(s)texts.unshift(s);}catch(e){D()?.warn('given.section.error',e);}
      for(const text of texts){
        const ev=evidence(text);if(ev){D()?.ok('given.evidence.prose',ev);const he=glossHe(ev.gloss);if(he){const chain=chainFromText(text,name);D()?.ok('given.gloss.translated',{gloss:ev.gloss,he});return{ev,he,page:p,pages,canonical:name,chain};}D()?.warn('given.gloss.translation_missing',ev.gloss);}
        if(!followTarget){const target=relationEvidence(text,name);if(target){followTarget=target;followPage=p;followChain=chainFromText(text,name);D()?.ok('given.evidence.follow',{from:name,to:target,depth});}}
      }
      if(p.host==='en.wikipedia.org')try{const parsed=await parsePage(p.host,p.title),ev=infoboxEvidence(parsed?.wikitext?.['*']||'');if(ev){D()?.ok('given.evidence.infobox',ev);const he=glossHe(ev.gloss);if(he)return{ev,he,page:p,pages,canonical:name,chain:[{lang:'',label:name}]};}}catch(e){D()?.warn('given.infobox.error',e);}
    }
    if(followTarget){const nested=await researchName(followTarget,depth+1,visited);if(nested){const prefix=followChain.length?followChain:[{lang:'',label:name},{lang:'',label:followTarget}];const merged=[...prefix,...(nested.chain||[])].filter((x,i,a)=>i===0||x.label!==a[i-1].label);return{...nested,pages:[...pages,...(nested.pages||[])],canonical:name,chain:merged,page:followPage||nested.page};}}
    return null;
  }

  async function research(inputName){D()?.start(inputName);const name=await canonicalName(inputName);D()?.push('given.research.canonical',name===inputName?'warn':'ok',{input:inputName,canonical:name});const result=await researchName(name,0,new Set());if(!result){D()?.fail('given.research.no_evidence',`canonical=${name}`);return null;}result.canonical=name;return result;}

  async function build(inputName){const displayName=strip(inputName),r=await research(inputName);if(!r)return null;const lang=LANG_HE[r.ev.lang]||r.ev.lang||'שפת המקור המתועדת',root=strip(r.ev.root),meaning=r.he;let path=(r.chain||[]).map(x=>x.lang?`${x.label} — ${LANG_HE[x.lang]||x.lang}`:x.label);if(!path.length)path=[`${root} — ${lang}`,r.canonical];if(!path.some(x=>x.includes(root)))path.unshift(`${root} — ${lang}`);if(displayName!==r.canonical)path.push(`${displayName} — הצורה שחיפשת`);path=[...new Set(path)];D()?.end({canonical:r.canonical,root,meaning,path});return{title:displayName,type:'שם פרטי',subtitle:`שם פרטי — המקור הלשוני נבדק לפי הערך ${r.canonical}`,confidence:'medium',confidenceLabel:'רמת ודאות: טובה',simpleSummary:`נמצא מסלול אטימולוגי לשם ${displayName}, עד ${root} — „${meaning}”.`,whatIsIt:`${displayName} הוא שם פרטי. המנוע עקב גם אחרי צורות ביניים כאשר המקור הפנה לשם קדום יותר.`,meaning:`לפי המקורות שנמצאו, השם מגיע בסופו של המסלול ל־${root}, במשמעות „${meaning}”.`,originStory:`המערכת עקבה אחר שרשרת השמות במקום לעצור בהפניה מסוג „צורה של”. המקור הקדום שנמצא הוא ${lang}: ${root}, במשמעות „${r.ev.gloss}” — בעברית „${meaning}”.`,path,changes:'שלבי ביניים מוצגים רק כאשר נמצאה הפניה מפורשת בין צורות השם.',certainty:'נמצאה שרשרת אטימולוגית מפורשת במקור לשוני. עדיין רצוי להצליב מקורות כשמדובר בפירוש קדום שנוי במחלוקת.',plainLanguage:`בקיצור: ${displayName} עבר דרך צורות קודמות של אותו שם, ובסוף השרשרת נמצא ${root} — „${meaning}”.`,sources:[...new Map((r.pages||[]).filter(p=>p.url).map(p=>[p.url,{name:p.host.includes('wiktionary')?`Wiktionary — ${p.title}`:`Wikipedia — ${p.title}`,url:p.url}])).values()].slice(0,5)};}

  window.GivenNameEtymology={build,research,evidence,infoboxEvidence,canonicalName,relationEvidence,chainFromText};
})();
