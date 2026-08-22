const $ = id => document.getElementById(id);
const form = $('searchForm');
const queryInput = $('query');
const statusSection = $('statusSection');
const statusBox = $('status');
const resultSection = $('resultSection');

// Reviewed entries. chain-data.js extends this dictionary after this script loads.
const CURATED = {
  'בואנוס איירס': {
    title:'בואנוס איירס', type:'מקום / עיר', subtitle:'בירת ארגנטינה',
    meaning:'בספרדית Buenos Aires פירושו המילולי „אווירים טובים”, ובמשמעות טבעית יותר: „רוחות טובות” או „אוויר נעים”.',
    originStory:'השם קשור לכינוי נוצרי של מרים, Nuestra Señora del Buen Aire — „גבירתנו של האוויר הטוב”. הכינוי היה קשור למקדש Bonaria שבקליארי שבסרדיניה והיה מוכר למלחים. בשנת 1536 פדרו דה מנדוסה העניק להתיישבות באזור את השם Santa María del Buen Aire; עם הזמן Buenos Aires נעשה השם המקובל של העיר.',
    path:['Bonaria / Buen Aire','Nuestra Señora del Buen Aire','Santa María del Buen Aire','Buenos Aires'],
    changes:'במסמכים מוקדמים מופיעות צורות כגון Buen Ayre ו־Buen Aire. בהמשך התקבעה צורת הרבים Buenos Aires.',
    certainty:'רמת הוודאות גבוהה לגבי הקשר ל־Nuestra Señora del Buen Aire ולמסורת המלחים.',
    plainLanguage:'בקיצור: בואנוס איירס לא נקראה פשוט מפני שהיה שם „אוויר טוב”; השם הגיע ממסורת דתית של מלחים.',
    sources:[{name:'Wikipedia — Buenos Aires (ספרדית), Toponimia',url:'https://es.wikipedia.org/wiki/Buenos_Aires'}]
  },
  'ישראל': {
    title:'ישראל', type:'מדינה / שם מקראי', subtitle:'שם עתיק מן המקרא, שלימים נעשה גם שמה של מדינת ישראל',
    meaning:'השם יִשְׂרָאֵל מופיע במקרא כשמו החדש של יעקב. הפירוש המדויק שנוי במחלוקת, אך הוא כולל את הרכיב „אל”. במסורת המקראית הוא מוסבר באמצעות הפועל שׂרה — מאבק או התמודדות.',
    originStory:'בבראשית לב מתואר שינוי שמו של יעקב לישראל לאחר מאבק לילי. אחר כך „ישראל” נעשה שם לצאצאי יעקב, לעם, לממלכות קדומות ולבסוף למדינה המודרנית.',
    path:['יִשְׂרָאֵל — שם אישי','בני ישראל / עם ישראל','ממלכת ישראל','מדינת ישראל'],
    changes:'צורת השם העברית ישראל נשמרה אלפי שנים. בשפות אחרות נוצרו צורות כמו Israel, Israël ו־Israele.',
    certainty:'רמת הוודאות גבוהה לגבי עתיקות השם והשימוש המקראי בו; המשמעות הלשונית המדויקת של כל רכיבי השם אינה מוסכמת לחלוטין.',
    plainLanguage:'בקיצור: „ישראל” הוא שם עתיק מאוד מן המקרא. ההסבר המקראי ברור, אך האטימולוגיה ההיסטורית המדויקת עדיין נתונה לדיון.',
    sources:[{name:'ויקיפדיה — ישראל',url:'https://he.wikipedia.org/wiki/%D7%99%D7%A9%D7%A8%D7%90%D7%9C'}]
  },
  '__sofia_city': {
    title:'סופיה', type:'מקום / עיר', subtitle:'בירת בולגריה',
    meaning:'השם Sofia מגיע מן היוונית σοφία (sophía), שפירושה „חוכמה”. במקרה של העיר הכוונה היא ל„חוכמת האל” — שמה של בזיליקת סווטה סופיה.',
    originStory:'העיר נשאה בתקופות שונות שמות כגון Serdica ו־Sredets. בסוף המאה ה־14 החל השם Sofia להחליף את השמות הקדומים, על שם בזיליקת סווטה סופיה הסמוכה.',
    path:['Serdica / סרדיקה','Sredets / סרדץ','Sveta Sofia — „חוכמת האל”','Sofia — סופיה'],
    changes:'בסוף המאה ה־14 החל השם Sofia להופיע לצד השמות הקדומים, ובהמשך התקבע כשם העיר.',
    certainty:'רמת הוודאות גבוהה: הקשר בין שם העיר לבזיליקת סווטה סופיה מתועד היטב.',
    plainLanguage:'בקיצור: העיר סופיה נקראת על שם בזיליקת סווטה סופיה. „סופיה” ביוונית פירושה „חוכמה”.',
    sources:[{name:'עיריית סופיה — Historical Summary',url:'https://www.sofia.bg/en/web/sofia-municipality/w/history'}]
  }
};
CURATED['buenos aires']=CURATED['בואנוס איירס'];
CURATED['israel']=CURATED['ישראל'];

const AMBIGUITIES = {
  'סופיה':[
    {label:'👤 סופיה — שם פרטי',name:'Sophia',context:{kind:'given-name',label:'שם פרטי'}},
    {label:'🏙️ סופיה — בירת בולגריה',name:'Sofia',context:{kind:'city',country:'Bulgaria',label:'בירת בולגריה',curatedKey:'__sofia_city'}}
  ],
  'sophia':[
    {label:'👤 Sophia — שם פרטי',name:'Sophia',context:{kind:'given-name',label:'שם פרטי'}},
    {label:'🏙️ Sofia — בירת בולגריה',name:'Sofia',context:{kind:'city',country:'Bulgaria',label:'בירת בולגריה',curatedKey:'__sofia_city'}}
  ],
  'sofia':[
    {label:'🏙️ Sofia — בירת בולגריה',name:'Sofia',context:{kind:'city',country:'Bulgaria',label:'בירת בולגריה',curatedKey:'__sofia_city'}},
    {label:'👤 Sofia — שם פרטי',name:'Sofia',context:{kind:'given-name',label:'שם פרטי'}}
  ],
  'שרלוט':[
    {label:'👤 שרלוט — שם פרטי',name:'Charlotte',context:{kind:'given-name',label:'שם פרטי'}},
    {label:'🏙️ שרלוט — צפון קרוליינה',name:'Charlotte',context:{kind:'city',region:'North Carolina',country:'United States',label:'עיר בצפון קרוליינה'}}
  ],
  'charlotte':[
    {label:'👤 Charlotte — שם פרטי',name:'Charlotte',context:{kind:'given-name',label:'שם פרטי'}},
    {label:'🏙️ Charlotte — North Carolina',name:'Charlotte',context:{kind:'city',region:'North Carolina',country:'United States',label:'עיר בצפון קרוליינה'}}
  ]
};

for(const button of document.querySelectorAll('[data-example]')) button.addEventListener('click',()=>{queryInput.value=button.dataset.example;form.requestSubmit();});

form.addEventListener('submit',async event=>{
  event.preventDefault();
  const raw=queryInput.value.trim(); if(!raw)return;
  const ambiguity=AMBIGUITIES[raw.toLowerCase()];
  if(ambiguity)return showMeaningPicker(raw,ambiguity);
  await runSearch(raw,null);
});

function showMeaningPicker(raw,options){
  resultSection.hidden=true; statusSection.hidden=false; statusBox.replaceChildren();
  const h=document.createElement('strong'); h.textContent=`מצאתי כמה משמעויות ל„${raw}”. למה התכוונת?`; statusBox.appendChild(h);
  const wrap=document.createElement('div'); wrap.className='meaning-choices';
  for(const option of options){
    const b=document.createElement('button'); b.type='button'; b.className='meaning-choice'; b.textContent=option.label;
    b.addEventListener('click',async()=>{queryInput.value=option.name;await runSearch(option.name,option.context);}); wrap.appendChild(b);
  }
  statusBox.appendChild(wrap);
}

async function runSearch(query,context){
  const curated=context?.curatedKey?CURATED[context.curatedKey]:(CURATED[query.toLowerCase()]||CURATED[query]);
  if(curated)return showCurated(curated,query);

  // Native given-name route: this is part of the main engine, not an after-the-fact hook.
  if(context?.kind==='given-name'){
    const done=await tryGivenName(query);
    if(done)return;
  }

  setStatus(`מזהים קודם את „${query}”${context?.label?` כ${context.label}`:''}, ורק אחר כך מחפשים אטימולוגיה…`);
  resultSection.hidden=true;
  try{
    const ranked=await resolveCandidates(query,context);
    if(!ranked.length)return setStatus('לא מצאנו ישות שמתאימה מספיק לשם ולהקשר. עדיף לא לנחש.');
    const first=ranked[0],second=ranked[1];
    if(first.score<35||(second&&first.score-second.score<8&&first.score<75))return showEntityPicker(query,context,ranked.slice(0,6));

    // If Wikidata itself says this is a given name, switch to the linguistic name engine.
    if(isGivenNameDescription(first.item.description)){
      const done=await tryGivenName(first.item.label||query);
      if(done)return;
    }
    await buildFromEntity(query,context,first.item);
  }catch(e){console.error(e);setStatus('לא הצלחנו להשלים את החיפוש כרגע. נסו שוב בעוד רגע.');}
}

async function tryGivenName(name){
  if(!window.GivenNameEtymology?.build)return false;
  setStatus(`מחפשים את האטימולוגיה של השם הפרטי „${name}” במקורות לשוניים…`);
  try{
    const result=await window.GivenNameEtymology.build(name);
    if(!result)return false;
    renderResult(result); statusSection.hidden=true; resultSection.hidden=false;
    resultSection.scrollIntoView({behavior:'smooth',block:'start'}); return true;
  }catch(e){console.warn('Given-name engine failed',e);return false;}
}

function isGivenNameDescription(desc=''){return /given name|first name|forename|female name|male name|feminine given name|masculine given name|שם פרטי|שם נשי|שם גברי/i.test(desc);}

async function resolveCandidates(query,context){
  const searches=await Promise.allSettled([searchWikidata(query,'en'),searchWikidata(query,'he')]);
  const merged=[...new Map(searches.flatMap(x=>x.status==='fulfilled'?x.value:[]).map(x=>[x.id,x])).values()];
  return merged.map(item=>({item,score:scoreCandidate(item,query,context)})).sort((a,b)=>b.score-a.score);
}

function scoreCandidate(item,query,context){
  const label=normalize(item.label),q=normalize(query),desc=normalize(item.description); let s=label===q?45:(label.includes(q)||q.includes(label)?18:0);
  if(!context){if(isGivenNameDescription(item.description))s+=15;else if(/city|capital|country|surname|עיר|בירה|מדינה|שם משפחה/.test(desc))s+=5;return s;}
  if(context.kind==='city'){if(/city|capital|town|municipality|עיר|בירה/.test(desc))s+=35;if(/given name|surname|song|observatory|region|שם פרטי|שם משפחה|שיר/.test(desc))s-=55;}
  if(context.kind==='given-name'){if(isGivenNameDescription(item.description))s+=45;if(/city|capital|region|observatory|song|עיר|בירה|מחוז/.test(desc))s-=55;}
  if(context.kind==='surname'){if(/surname|family name|שם משפחה/.test(desc))s+=35;if(/city|capital|given name|עיר|בירה|שם פרטי/.test(desc))s-=40;}
  if(context.country&&desc.includes(normalize(context.country)))s+=35;if(context.region&&desc.includes(normalize(context.region)))s+=35;return s;
}

function showEntityPicker(query,context,ranked){
  statusSection.hidden=false;resultSection.hidden=true;statusBox.replaceChildren();
  const h=document.createElement('strong');h.textContent='נמצאו כמה ישויות אפשריות. בחרו את המתאימה:';statusBox.appendChild(h);
  const wrap=document.createElement('div');wrap.className='meaning-choices';
  ranked.forEach(({item})=>{const b=document.createElement('button');b.type='button';b.className='meaning-choice';b.textContent=`${item.label||query}${item.description?` — ${item.description}`:''}`;
    b.addEventListener('click',async()=>{if(isGivenNameDescription(item.description)){const done=await tryGivenName(item.label||query);if(done)return;}await buildFromEntity(query,context,item);});wrap.appendChild(b);});
  statusBox.appendChild(wrap);
}

async function searchWikidata(query,language){const u=new URL('https://www.wikidata.org/w/api.php');u.searchParams.set('action','wbsearchentities');u.searchParams.set('search',query);u.searchParams.set('language',language);u.searchParams.set('uselang',language);u.searchParams.set('format','json');u.searchParams.set('origin','*');u.searchParams.set('limit','12');return(await fetchJson(u)).search||[];}
async function getEntity(id){const u=new URL('https://www.wikidata.org/w/api.php');u.searchParams.set('action','wbgetentities');u.searchParams.set('ids',id);u.searchParams.set('props','sitelinks|labels|descriptions');u.searchParams.set('sitefilter','hewiki|enwiki|eswiki|dewiki|frwiki|itwiki|hewiktionary|enwiktionary');u.searchParams.set('languages','he|en');u.searchParams.set('format','json');u.searchParams.set('origin','*');return(await fetchJson(u)).entities?.[id]||{};}

async function buildFromEntity(query,context,item){setStatus(`נבחרה הישות „${item.label||query}”. עכשיו בודקים מקורות אטימולוגיים…`);const entity=await getEntity(item.id);const pages=await getPages(entity,item.label||query);const result=await buildResult(query,context,item,entity,pages);renderResult(result);statusSection.hidden=true;resultSection.hidden=false;resultSection.scrollIntoView({behavior:'smooth',block:'start'});}
async function getPages(entity,fallback){const sl=entity.sitelinks||{};const specs=[['https://he.wikipedia.org/w/api.php',sl.hewiki?.title,'ויקיפדיה העברית','he'],['https://en.wikipedia.org/w/api.php',sl.enwiki?.title,'Wikipedia באנגלית','en'],['https://es.wikipedia.org/w/api.php',sl.eswiki?.title,'Wikipedia בספרדית','es'],['https://de.wikipedia.org/w/api.php',sl.dewiki?.title,'Wikipedia בגרמנית','de'],['https://fr.wikipedia.org/w/api.php',sl.frwiki?.title,'Wikipedia בצרפתית','fr'],['https://it.wikipedia.org/w/api.php',sl.itwiki?.title,'Wikipedia באיטלקית','it'],['https://en.wiktionary.org/w/api.php',sl.enwiktionary?.title||fallback,'Wiktionary באנגלית','en']].filter(x=>x[1]);const settled=await Promise.allSettled(specs.map(x=>fetchPage(...x)));return settled.filter(x=>x.status==='fulfilled'&&x.value).map(x=>x.value);}
async function fetchPage(base,title,sourceName,lang){const u=new URL(base);u.searchParams.set('action','query');u.searchParams.set('prop','extracts|info');u.searchParams.set('inprop','url');u.searchParams.set('exintro','1');u.searchParams.set('explaintext','1');u.searchParams.set('redirects','1');u.searchParams.set('titles',title);u.searchParams.set('format','json');u.searchParams.set('origin','*');const data=await fetchJson(u);const p=Object.values(data.query?.pages||{})[0];if(!p||p.missing!==undefined)return null;return{title:p.title,extract:clean(p.extract||''),etymology:await fetchEtymologySection(base,p.title),url:p.fullurl,sourceName,lang};}
async function fetchEtymologySection(base,title){try{const s=new URL(base);s.searchParams.set('action','parse');s.searchParams.set('page',title);s.searchParams.set('prop','sections');s.searchParams.set('redirects','1');s.searchParams.set('format','json');s.searchParams.set('origin','*');const data=await fetchJson(s);const pats=[/אטימולוג/i,/גיזרון/i,/מקור.*שם/i,/שם.*מקור/i,/etymolog/i,/name.*origin/i,/origin.*name/i,/toponym/i,/naming/i,/étymolog/i,/etimolog/i];const hit=(data.parse?.sections||[]).find(x=>pats.some(r=>r.test((x.line||'').replace(/<[^>]+>/g,''))));if(!hit)return'';const q=new URL(base);q.searchParams.set('action','parse');q.searchParams.set('page',title);q.searchParams.set('section',hit.index);q.searchParams.set('prop','text');q.searchParams.set('redirects','1');q.searchParams.set('format','json');q.searchParams.set('origin','*');const html=(await fetchJson(q)).parse?.text?.['*']||'';const doc=new DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('table,style,script,sup.reference,.mw-editsection,.navbox,.infobox').forEach(el=>el.remove());return clean(doc.body.textContent||'');}catch{return'';}}

async function buildResult(query,context,item,entity,pages){let rankedPages=pages;if(window.EtymologyAI?.rankEtymologyCandidates){try{const aiRanked=await Promise.race([window.EtymologyAI.rankEtymologyCandidates(pages),timeout(3500)]);if(Array.isArray(aiRanked)&&aiRanked.length)rankedPages=aiRanked;}catch{}}
  const he=pages.find(p=>p.lang==='he'&&p.extract),heEty=rankedPages.find(p=>p.lang==='he'&&p.etymology&&isMostlyHebrew(p.etymology)),foreignEty=rankedPages.find(p=>p.etymology?.length>35);const etySources=pages.filter(p=>p.etymology?.length>35);const hosts=new Set(etySources.map(p=>{try{return new URL(p.url).hostname}catch{return p.sourceName}}));const desc=entity.descriptions?.he?.value||entity.descriptions?.en?.value||item.description||context?.label||'';const title=he?.title||entity.labels?.he?.value||item.label||query;let meaning='לא נמצאה עדיין משמעות אטימולוגית שניתן להציג בעברית בביטחון.';let originStory=he?.extract?short(he.extract,560):'נמצאה הישות המתאימה, אך עדיין חסר הסבר עברי מלא למקור השם.';if(heEty){meaning=short(heEty.etymology,520);originStory=short(heEty.etymology,850);}else if(foreignEty)originStory=`נמצא סעיף אטימולוגי מפורש ב־${foreignEty.sourceName}, אך איננו מציגים טקסט זר כאילו הוא תרגום עברי מאומת.`;const count=hosts.size,conf=count>=2?'high':count===1?'medium':'low';const sources=[{name:'Wikidata',url:`https://www.wikidata.org/wiki/${item.id}`}];pages.filter(p=>p.url).slice(0,6).forEach(p=>sources.push({name:p.sourceName,url:p.url}));return{title,type:typeFrom(desc,context),subtitle:desc,confidence:conf,confidenceLabel:conf==='high'?'רמת ודאות: טובה':conf==='medium'?'רמת ודאות: חלקית':'רמת ודאות: נמוכה',simpleSummary:`זוהתה הישות המתאימה${context?.label?` (${context.label})`:''}. נמצאו ${count} מקורות נפרדים עם סעיף אטימולוגי מפורש.`,whatIsIt:desc||'נמצאה ישות מתאימה.',meaning,originStory,path:[title],changes:'ציר זמן של צורות השם יוצג רק כאשר נמצאו שלבים היסטוריים מתועדים.',certainty:count>=2?'נמצאה הצלבה בין לפחות שני מקורות נפרדים.':count===1?'נמצא מקור אטימולוגי מפורש אחד; עדיין דרושה הצלבה.':'לא נמצא סעיף אטימולוגי מפורש, ולכן המערכת נמנעת מקביעה.',plainLanguage:heEty?'בקיצור: נמצא הסבר אטימולוגי בעברית, והוא מוצג לצד המקורות.':'בקיצור: זיהינו את הדבר הנכון, אבל עדיין אין מספיק חומר אטימולוגי בעברית כדי לנסח תשובה מלאה בלי לנחש.',sources};}

function showCurated(entry,query){renderResult({...entry,query,confidence:'high',confidenceLabel:'רמת ודאות: טובה',simpleSummary:`מצאנו מידע אטימולוגי מפורט על „${entry.title}”, כולל משמעות, גלגול היסטורי ומקורות.`,whatIsIt:entry.subtitle});statusSection.hidden=true;resultSection.hidden=false;resultSection.scrollIntoView({behavior:'smooth',block:'start'});}
function typeFrom(desc='',context={}){if(context?.kind==='city')return'מקום / עיר';if(context?.kind==='given-name')return'שם פרטי';if(context?.kind==='surname')return'שם משפחה';if(/city|capital|town|עיר|בירה/i.test(desc))return'מקום / עיר';if(isGivenNameDescription(desc))return'שם פרטי';if(/surname|family name|שם משפחה/i.test(desc))return'שם משפחה';if(/country|state|מדינה/i.test(desc))return'מדינה';return'שם או ערך';}
function normalize(s=''){return s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu,' ').trim();}function clean(s=''){return s.replace(/\[[0-9]+\]/g,'').replace(/\s+/g,' ').trim();}function short(s='',n=600){return s.length<=n?s:`${s.slice(0,n).trim()}…`;}function isMostlyHebrew(s=''){const he=(s.match(/[\u0590-\u05FF]/g)||[]).length,latin=(s.match(/[A-Za-zÀ-ÿ]/g)||[]).length;return he>=Math.max(12,latin*.45);}function timeout(ms){return new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),ms));}function setStatus(message){statusBox.textContent=message;statusSection.hidden=false;}async function fetchJson(url){const r=await fetch(url,{headers:{Accept:'application/json'}});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}
function renderResult(result){$('resultType').textContent=result.type;$('resultTitle').textContent=result.title;$('resultSubtitle').textContent=result.subtitle||'';$('simpleSummary').textContent=result.simpleSummary;$('whatIsIt').textContent=result.whatIsIt;$('meaning').textContent=result.meaning;$('originStory').textContent=result.originStory;$('changes').textContent=result.changes;$('certainty').textContent=result.certainty;$('plainLanguage').textContent=result.plainLanguage;const badge=$('confidenceBadge');badge.textContent=result.confidenceLabel;badge.className=`confidence confidence-${result.confidence}`;const path=$('etymologyPath');path.replaceChildren();(result.path||[]).forEach((step,index)=>{const item=document.createElement('span');item.className='path-step';item.textContent=step;path.appendChild(item);if(index<result.path.length-1){const arrow=document.createElement('span');arrow.className='path-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='←';path.appendChild(arrow);}});const list=$('sourcesList');list.replaceChildren();if(!result.sources?.length){const li=document.createElement('li');li.textContent='לא נמצאו מקורות זמינים להצגה.';list.appendChild(li);}else result.sources.forEach(source=>{const li=document.createElement('li'),a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=source.name;li.appendChild(a);list.appendChild(li);});}
