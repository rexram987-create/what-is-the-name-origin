// Structured etymology orchestration v1.1.2
// Builds a stable schema first; legacy research is optional rather than a hard dependency.
(() => {
  const D=()=>window.NameOriginDiagnostics;
  const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
  const uniq=(arr,key=x=>x)=>{const seen=new Set();return arr.filter(x=>{const k=key(x);if(!k||seen.has(k))return false;seen.add(k);return true;});};
  const LANG_HE={Latin:'לטינית',Greek:'יוונית','Ancient Greek':'יוונית עתיקה',Hebrew:'עברית','Biblical Hebrew':'עברית מקראית',French:'צרפתית','Old French':'צרפתית עתיקה',German:'גרמנית',English:'אנגלית',Italian:'איטלקית',Spanish:'ספרדית'};
  const HE={
    victory:'ניצחון',man:'אדם / איש',men:'אנשים',person:'אדם',people:'אנשים',wisdom:'חוכמה',peace:'שלום',light:'אור',gift:'מתנה',god:'אל',deity:'אל',
    defend:'להגן',protect:'להגן','ward off':'להדוף',repel:'להדוף','turn away':'להדוף / להרחיק',
    'defender of man':'מגן האדם','protector of man':'מגן האדם','defender, protector of man':'מגן האנשים',
    'gift of god':'מתנת האל',"god's gift":'מתנת האל','gift from god':'מתנה מן האל',
    'my god is an oath':'אלי הוא שבועה','god is my oath':'אלוהים הוא שבועתי'
  };
  function heGloss(raw=''){
    const s=clean(raw).toLowerCase().replace(/[“”"'‘’]/g,'').replace(/[.;:,]+$/,'');
    if(HE[s])return HE[s];
    if(/gift/.test(s)&&/(god|deity)/.test(s))return 'מתנת האל';
    if(/defender|protector/.test(s)&&/(man|men|people|mankind|human)/.test(s))return 'מגן האנשים';
    if(/ward off|keep off|turn away|defend|protect|repel/.test(s))return 'להגן / להדוף';
    if(/\bman\b|\bmen\b|person|people|human/.test(s))return 'אדם / איש';
    if(/\bgod\b|deity/.test(s))return 'אל';
    if(/\bgift\b|present/.test(s))return 'מתנה';
    if(/victory/.test(s))return 'ניצחון';
    if(/wisdom/.test(s))return 'חוכמה';
    return '';
  }
  async function json(url){const r=await fetch(url,{headers:{Accept:'application/json'}});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}
  async function page(host,title){
    const u=new URL(`https://${host}/w/api.php`);u.searchParams.set('action','query');u.searchParams.set('prop','extracts|info');u.searchParams.set('inprop','url');u.searchParams.set('explaintext','1');u.searchParams.set('redirects','1');u.searchParams.set('titles',title);u.searchParams.set('format','json');u.searchParams.set('origin','*');
    const p=Object.values((await json(u)).query?.pages||{})[0];return(!p||p.missing!==undefined)?null:{text:clean(p.extract),url:p.fullurl,title:p.title,host};
  }
  async function fallbackResearch(input){
    const canonical=await window.GivenNameEtymology?.canonicalName?.(input)||input;
    const variants=[`${canonical} (given name)`,`${canonical} (name)`,canonical];
    const jobs=[];for(const title of variants){jobs.push(page('en.wikipedia.org',title));jobs.push(page('en.wiktionary.org',title));}
    const settled=await Promise.allSettled(jobs),pages=settled.filter(x=>x.status==='fulfilled'&&x.value?.text).map(x=>x.value);
    if(!pages.length)return null;
    D()?.ok('structured.fallback',{canonical,pages:pages.map(p=>`${p.host}:${p.title}`)});
    return {canonical,pages,chain:[{label:canonical,lang:''}],ev:{root:'',gloss:'',lang:''}};
  }
  function extractComponents(text=''){
    const t=clean(text),out=[];
    const add=(term,gloss,base='')=>{term=clean(term);gloss=clean(gloss);const he=heGloss(gloss);if(term&&he)out.push({term,base:clean(base),gloss,he});};
    let m;
    const simple=/([^\s,.;()]{2,60})\s+(?:meaning|means|meaning literally)\s+[“"'‘’]?([^.;]{1,140})/giu;
    while((m=simple.exec(t))!==null)add(m[1],m[2]);
    const quoted=/([^\s,.;()]{2,60})\s*\([^)]*[“"'‘’]([^”"'‘’]{1,100})[”"'‘’][^)]*\)/giu;
    while((m=quoted.exec(t))!==null)add(m[1],m[2]);
    const inflected=/([^\s,.;()]{2,60})\s*,\s*(?:genitive|accusative|dative|plural|inflected form)\s+of\s+([^\s,.;()]{2,60})\s*,?\s*(?:meaning|means)\s+([^.;]{1,120})/giu;
    while((m=inflected.exec(t))!==null)add(m[1],m[3],m[2]);
    return uniq(out,x=>`${x.term.toLowerCase()}|${x.he}`);
  }
  function extractWhole(text='',research){
    const direct=heGloss(research?.ev?.gloss||'');if(direct)return direct;
    const t=clean(text);
    const phrases=[/meaning\s+[“"'‘’]?([^”"'‘’.;]{2,100})/i,/means\s+[“"'‘’]?([^”"'‘’.;]{2,100})/i,/literally\s+[“"'‘’]?([^”"'‘’.;]{2,100})/i];
    for(const re of phrases){const m=t.match(re);if(m){const he=heGloss(m[1]);if(he)return he;}}
    return '';
  }
  function extractForms(research,input,corpus=''){
    const forms=[];
    for(const x of research?.chain||[])if(x?.label)forms.push({form:clean(x.label),language:clean(x.lang)});
    const root=clean(research?.ev?.root);if(root&&root.length<100)forms.push({form:root,language:clean(research?.ev?.lang)});
    const canonical=clean(research?.canonical);if(canonical)forms.push({form:canonical,language:''});
    const greekMatches=[...clean(corpus).matchAll(/(?:Ancient\s+Greek|Greek)\s+([Α-ωΆ-ώἀ-῾][^\s,.;()]{1,50})/giu)];for(const m of greekMatches.slice(0,3))forms.unshift({form:clean(m[1]),language:'Ancient Greek'});
    if(input)forms.push({form:clean(input),language:''});
    return uniq(forms,x=>x.form.toLowerCase()).filter(x=>x.form);
  }
  function model(input,research){
    const corpus=[research?.ev?.root,research?.ev?.gloss,...(research?.pages||[]).map(p=>p.text)].filter(Boolean).join(' ');
    const components=extractComponents(corpus);
    let whole=extractWhole(corpus,research);
    const roles=components.map(x=>x.he);
    if(roles.some(x=>/להגן|להדוף/.test(x))&&roles.some(x=>/אדם|איש/.test(x)))whole='מגן האנשים';
    if(roles.some(x=>x==='אל')&&roles.some(x=>x==='מתנה'))whole='מתנת האל';
    return {input,canonical:research?.canonical||input,forms:extractForms(research,input,corpus),components,wholeMeaning:whole,sourceGloss:clean(research?.ev?.gloss),sources:uniq((research?.pages||[]).filter(p=>p.url).map(p=>({name:p.host.includes('wiktionary')?`Wiktionary — ${p.title}`:`Wikipedia — ${p.title}`,url:p.url})),x=>x.url)};
  }
  function isUseful(m){return Boolean(m&&(m.wholeMeaning||m.components?.length));}
  function render(m){
    const comp=m.components.slice(0,5),compText=comp.map(c=>`${c.base?`${c.term} / ${c.base}`:c.term} — „${c.he}”`).join('; '),path=[];
    for(const c of comp)path.push(`${c.base?`${c.term} / ${c.base}`:c.term} — ${c.he}`);
    for(const f of m.forms){const lang=LANG_HE[f.language]||f.language,label=lang?`${f.form} — ${lang}`:f.form;if(!path.includes(label))path.push(label);}
    const whole=m.wholeMeaning||'';
    return {title:m.input,type:'שם פרטי',subtitle:`שם פרטי — נותח לפי ${m.canonical}`,confidence:'medium',confidenceLabel:whole?'רמת ודאות: טובה':'רמת ודאות: חלקית',simpleSummary:whole?`משמעות השם בכללותו היא בקירוב „${whole}”.`:`נמצאו צורות ורכיבים אטימולוגיים, אך המשמעות הכוללת עדיין אינה ודאית.`,whatIsIt:`${m.input} הוא שם פרטי. המנוע בונה תחילה מודל של צורות, רכיבים ומשמעויות ורק אחר כך מציג אותו.`,meaning:compText?(whole?`רכיבי השם שנמצאו הם: ${compText}. משמעות השם בכללותו היא בקירוב „${whole}”.`:`רכיבי השם שנמצאו הם: ${compText}.`):(whole?`המשמעות האטימולוגית שנמצאה היא „${whole}”.`:'נמצאו מקורות לשם, אך לא חולצה מהם עדיין משמעות מלאה בביטחון.'),originStory:compText?`המקורות מציגים את הרכיבים הבאים: ${compText}. צורות השם ושלבי הביניים נשמרים בנפרד.`:`המערכת מצאה מקורות וצורות לשם, אך לא זיהתה פירוק ברור לרכיבים.`,path,changes:path.length>2?'השרשרת מציגה רכיבים וצורות ביניים בנפרד.':'לא נמצאו מספיק שלבי ביניים להצגת שרשרת ארוכה.',certainty:whole?'המשמעות נתמכת במידע שנמצא במקורות שנאספו; עדיין מומלץ להצליב במקרה של אטימולוגיה שנויה במחלוקת.':'נמצאו מקורות לשם, אך המשמעות הכוללת לא חולצה ברמת ביטחון מספקת ולכן אינה מוצגת כעובדה.',plainLanguage:compText?(whole?`בקיצור: ${compText}. ביחד מתקבלת בקירוב המשמעות „${whole}”.`:`בקיצור: נמצאו הרכיבים ${compText}, אך עדיין לא נקבעה משמעות כוללת בביטחון.`):(whole?`בקיצור: משמעות השם היא בקירוב „${whole}”.`:'בקיצור: נמצא מקור לשם, אבל עדיין חסר פירוש מלא ובטוח.'),sources:m.sources.slice(0,6)};
  }
  function install(){
    const e=window.GivenNameEtymology;if(!e||e.__structuredWrapped)return;
    e.build=async input=>{
      D()?.push('structured.start','info',{input});

      // Prefer the structured collector. The legacy link follower can mistake
      // ordinary prose words (for example "can" or "the") for name forms.
      const fallback=await fallbackResearch(input);
      if(fallback){
        const firstModel=model(input,fallback);
        if(isUseful(firstModel)){
          D()?.ok('structured.model',{forms:firstModel.forms,components:firstModel.components,wholeMeaning:firstModel.wholeMeaning,route:'structured-first'});
          return render(firstModel);
        }
      }

      let legacy=null;
      try{legacy=await e.research?.(input);}catch(err){D()?.warn('structured.legacy_error',err?.message||String(err));}
      const research=legacy||fallback;
      if(!research)return null;
      const finalModel=model(input,research);
      D()?.ok('structured.model',{forms:finalModel.forms,components:finalModel.components,wholeMeaning:finalModel.wholeMeaning,route:legacy?'legacy':'structured-partial'});
      return render(finalModel);
    };
    e.__structuredWrapped=true;
  }
  install();window.addEventListener('DOMContentLoaded',install);window.StructuredEtymology={model,render,extractComponents,fallbackResearch};
})();
