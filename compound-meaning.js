// Generic compound-name meaning layer v0.8.8
(() => {
  const MAP = [
    {re:/ward off|keep off|turn away|defend|protect|repel/i, he:'להגן / להדוף', role:'defense'},
    {re:/\bman\b|\bmen\b|person|people|human/i, he:'אדם / איש', role:'person'},
    {re:/rule|ruler|govern/i, he:'לשלוט / שליט', role:'rule'},
    {re:/king|royal/i, he:'מלך / מלכותי', role:'king'},
    {re:/god|deity/i, he:'אל', role:'god'},
    {re:/peace/i, he:'שלום', role:'peace'},
    {re:/love|beloved/i, he:'אהבה / אהוב', role:'love'},
    {re:/strength|strong/i, he:'כוח / חזק', role:'strength'},
    {re:/victory|conquer/i, he:'ניצחון / לכבוש', role:'victory'},
    {re:/wisdom|wise/i, he:'חוכמה / חכם', role:'wisdom'}
  ];
  const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
  const uniqBy=(arr,keyFn)=>{const seen=new Set();return arr.filter(x=>{const k=keyFn(x);if(seen.has(k))return false;seen.add(k);return true;});};
  const WORD="[\\p{L}\\p{M}'’ʼ-]{2,80}";
  function translateGloss(gloss=''){const g=clean(gloss).toLowerCase();const hit=MAP.find(x=>x.re.test(g));return hit?{he:hit.he,role:hit.role,raw:g}:null;}
  function extractComponents(text=''){
    const t=clean(text).slice(0,30000);if(!t)return[];const out=[];
    const patterns=[
      new RegExp('(?:from|of)\\s+(?:the\\s+)?(?:Ancient\\s+)?Greek\\s+('+WORD+')[^.]{0,180}?(?:meaning|means)\\s+[“"\\\'‘’]?([^”"\\\'‘’.;]{1,120})','giu'),
      new RegExp('\\b('+WORD+')\\b[^.]{0,140}?(?:meaning|means)\\s+[“"\\\'‘’]?([^”"\\\'‘’.;]{1,120})','giu')
    ];
    for(const re of patterns){let m;while((m=re.exec(t))!==null){const term=clean(m[1]),gloss=clean(m[2]),tr=translateGloss(gloss);if(term&&tr)out.push({term,gloss,he:tr.he,role:tr.role});if(out.length>=8)break;}}
    // Also parse common "X meaning ... and Y ... meaning ..." constructions explicitly.
    const pair=/([A-Za-zÀ-žΑ-Ωα-ωἂ-῾'’ʼ-]{2,50})\s+meaning\s+([^.;]{1,100}?)\s+and\s+([A-Za-zÀ-žΑ-Ωα-ωἂ-῾'’ʼ-]{2,50})(?:,\s*[^,.;]{0,60})?\s+meaning\s+([^.;]{1,100})/giu;
    let p;while((p=pair.exec(t))!==null){for(const [term,gloss] of [[p[1],p[2]],[p[3],p[4]]]){const tr=translateGloss(gloss);if(tr)out.push({term:clean(term),gloss:clean(gloss),he:tr.he,role:tr.role});}}
    return uniqBy(out,x=>`${x.term.toLowerCase()}|${x.role}`);
  }
  function directWholeMeaning(text=''){const t=clean(text);if(/defender|protector/i.test(t)&&/(?:of\s+)?(?:men|people|mankind|humans?)/i.test(t))return'מגן האנשים';return'';}
  function synthesize(components=[]){const roles=new Set(components.map(x=>x.role));if(roles.has('defense')&&roles.has('person'))return'מגן האנשים';const hes=uniqBy(components,x=>x.role).map(x=>x.he);return hes.length>=2?hes.join(' + '):'';}
  function enrich(result,research){
    if(!result||result.type!=='שם פרטי'||!research)return result;
    const texts=(research.pages||[]).map(p=>[p.text,p.extract,p.sectionText,p.etymology,p.infobox?.root,p.infobox?.meaning].filter(Boolean).join(' ')).filter(Boolean);
    let components=[];for(const t of texts)components.push(...extractComponents(t));components=uniqBy(components,x=>`${x.term.toLowerCase()}|${x.role}`).slice(0,6);
    let whole='';for(const t of texts){whole=directWholeMeaning(t);if(whole)break;}if(!whole)whole=synthesize(components);
    if(!whole)return result;
    const componentText=components.slice(0,4).map(x=>`${x.term} — „${x.he}”`).join('; ');
    const path=[...(result.path||[])];for(const c of components.slice(0,4))if(!path.some(x=>String(x).toLowerCase().includes(c.term.toLowerCase())))path.unshift(`${c.term} — ${c.he}`);
    return {...result,meaning:componentText?`השם מורכב מרכיבים שמשמעותם ${componentText}. משמעות השם בכללותו היא בקירוב „${whole}”.`:`משמעות השם בכללותו היא בקירוב „${whole}”.`,simpleSummary:`משמעות השם בכללותו היא בקירוב „${whole}”.`,plainLanguage:`בקיצור: „${whole}” — ולא רק משמעותו של אחד מרכיבי השם.`,originStory:componentText?`המקורות מציגים כמה רכיבים אטימולוגיים: ${componentText}.`:(result.originStory||''),path};
  }
  async function install(){const e=window.GivenNameEtymology;if(!e?.build||!e?.research||e.__compoundWrapped)return;const build=e.build.bind(e),research=e.research.bind(e);e.build=async input=>{const [result,r]=await Promise.all([build(input),research(input)]);return enrich(result,r);};e.__compoundWrapped=true;}
  install();window.addEventListener('DOMContentLoaded',install);window.NameOriginCompoundMeaning={extractComponents,synthesize,enrich};
})();