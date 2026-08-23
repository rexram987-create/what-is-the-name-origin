// Structured etymology orchestration v1.0.0
// Converts research evidence into a stable schema before rendering.
(() => {
  const D=()=>window.NameOriginDiagnostics;
  const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
  const uniq=(arr,key=x=>x)=>{const seen=new Set();return arr.filter(x=>{const k=key(x);if(!k||seen.has(k))return false;seen.add(k);return true;});};
  const HE={
    victory:'ניצחון', man:'אדם / איש', men:'אנשים', person:'אדם', people:'אנשים', wisdom:'חוכמה', peace:'שלום', light:'אור',
    defend:'להגן', protect:'להגן', 'ward off':'להדוף', repel:'להדוף', 'turn away':'להדוף / להרחיק',
    'defender of man':'מגן האדם', 'protector of man':'מגן האדם', 'defender, protector of man':'מגן האנשים',
    'my god is an oath':'אלי הוא שבועה', 'god is my oath':'אלוהים הוא שבועתי'
  };
  function heGloss(raw=''){
    const s=clean(raw).toLowerCase().replace(/[“”"'‘’]/g,'').replace(/[.;:,]+$/,'');
    if(HE[s])return HE[s];
    if(/defender|protector/.test(s)&&/(man|men|people|mankind|human)/.test(s))return 'מגן האנשים';
    if(/ward off|keep off|turn away|defend|protect|repel/.test(s))return 'להגן / להדוף';
    if(/\bman\b|\bmen\b|person|people|human/.test(s))return 'אדם / איש';
    if(/victory/.test(s))return 'ניצחון';
    return '';
  }
  function extractComponents(text=''){
    const t=clean(text),out=[];
    const add=(term,gloss,base='')=>{term=clean(term);gloss=clean(gloss);const he=heGloss(gloss);if(term&&he)out.push({term,base:clean(base),gloss,he});};
    let m;
    const simple=/([^\s,.;()]{2,60})\s+meaning\s+([^.;]{1,140})/giu;
    while((m=simple.exec(t))!==null)add(m[1],m[2]);
    const inflected=/([^\s,.;()]{2,60})\s*,\s*(?:genitive|accusative|dative|plural|inflected form)\s+of\s+([^\s,.;()]{2,60})\s*,?\s*(?:meaning|means)\s+([^.;]{1,120})/giu;
    while((m=inflected.exec(t))!==null)add(m[1],m[3],m[2]);
    return uniq(out,x=>`${x.term.toLowerCase()}|${x.he}`);
  }
  function extractForms(research,input){
    const forms=[];
    for(const x of research?.chain||[]) if(x?.label) forms.push({form:clean(x.label),language:clean(x.lang)});
    const root=clean(research?.ev?.root);
    if(root && root.length<100) forms.push({form:root,language:clean(research?.ev?.lang)});
    const rootText=clean(research?.ev?.root);
    const greek=(rootText.match(/Greek\s*\(([^)]+)\)/i)||[])[1]; if(greek)forms.push({form:clean(greek),language:'Ancient Greek'});
    const latin=(rootText.match(/Via Latin\s+([^,.;]+)/i)||[])[1]; if(latin)forms.push({form:clean(latin),language:'Latin'});
    if(research?.canonical) forms.push({form:clean(research.canonical),language:''});
    if(input) forms.push({form:clean(input),language:''});
    return uniq(forms,x=>x.form.toLowerCase()).filter(x=>x.form);
  }
  function model(input,research){
    const corpus=[research?.ev?.root,research?.ev?.gloss,...(research?.pages||[]).map(p=>p.text)].filter(Boolean).join(' ');
    const components=extractComponents(corpus);
    const direct=heGloss(research?.ev?.gloss||'');
    let whole=direct;
    const roles=components.map(x=>x.he);
    if(roles.some(x=>/להגן|להדוף/.test(x))&&roles.some(x=>/אדם|איש/.test(x)))whole='מגן האנשים';
    return {input,canonical:research?.canonical||input,forms:extractForms(research,input),components,wholeMeaning:whole,sourceGloss:clean(research?.ev?.gloss),sources:uniq((research?.pages||[]).filter(p=>p.url).map(p=>({name:p.host.includes('wiktionary')?`Wiktionary — ${p.title}`:`Wikipedia — ${p.title}`,url:p.url})),x=>x.url)};
  }
  function render(m){
    const comp=m.components.slice(0,4);
    const compText=comp.map(c=>`${c.base?`${c.term} / ${c.base}`:c.term} — „${c.he}”`).join('; ');
    const path=[];
    for(const c of comp) path.push(`${c.base?`${c.term} / ${c.base}`:c.term} — ${c.he}`);
    for(const f of m.forms){const label=f.language?`${f.form} — ${f.language}`:f.form;if(!path.includes(label))path.push(label);}
    const whole=m.wholeMeaning||'משמעות שנמצאה במקור';
    const meaning=compText?`רכיבי השם שנמצאו הם: ${compText}. משמעות השם בכללותו היא בקירוב „${whole}”.`:`המשמעות האטימולוגית שנמצאה היא „${whole}”.`;
    return {title:m.input,type:'שם פרטי',subtitle:`שם פרטי — נותח לפי ${m.canonical}`,confidence:'medium',confidenceLabel:'רמת ודאות: טובה',simpleSummary:`משמעות השם בכללותו היא בקירוב „${whole}”.`,whatIsIt:`${m.input} הוא שם פרטי. המנוע מפריד בין צורות קדומות, רכיבים ומשמעות כוללת לפני הצגת התוצאה.`,meaning,originStory:compText?`המקורות מציגים את הרכיבים הבאים: ${compText}. לאחר מכן המערכת שומרת גם את צורות השם ושלבי הביניים שנמצאו.`:`נמצא מסלול אטימולוגי לשם, אך המקור לא פורק בבירור לכמה רכיבים.`,path,changes:path.length>2?'השרשרת מציגה רכיבים וצורות ביניים בנפרד, בלי למחוק אחד מהם כאשר נמצאת משמעות כוללת.':'לא נמצאו מספיק שלבי ביניים להצגת שרשרת ארוכה.',certainty:'התוצאה מבוססת על מידע שנמצא במקורות שנאספו. כאשר יש מחלוקת לשונית, יש להעדיף ניסוח מסויג ולהצליב מקורות.',plainLanguage:compText?`בקיצור: ${compText}. ביחד מתקבלת בקירוב המשמעות „${whole}”.`:`בקיצור: משמעות השם היא בקירוב „${whole}”.`,sources:m.sources.slice(0,6)};
  }
  function install(){
    const e=window.GivenNameEtymology;if(!e?.research||e.__structuredWrapped)return;
    e.build=async input=>{D()?.push('structured.start','info',{input});const r=await e.research(input);if(!r)return null;const m=model(input,r);D()?.ok('structured.model',{forms:m.forms,components:m.components,wholeMeaning:m.wholeMeaning});return render(m);};
    e.__structuredWrapped=true;
  }
  install();window.addEventListener('DOMContentLoaded',install);window.StructuredEtymology={model,render,extractComponents};
})();