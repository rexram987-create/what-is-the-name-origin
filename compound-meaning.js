// Generic compound-name meaning layer v0.8.9
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
  function translateGloss(gloss=''){const g=clean(gloss).toLowerCase();const hit=MAP.find(x=>x.re.test(g));return hit?{he:hit.he,role:hit.role,raw:g}:null;}
  function add(out,term,gloss){const t=clean(term),g=clean(gloss),tr=translateGloss(g);if(t&&tr)out.push({term:t,gloss:g,he:tr.he,role:tr.role});}
  function extractComponents(text=''){
    const t=clean(text).slice(0,30000);if(!t)return[];const out=[];
    // Deliberately use broad Unicode-safe token captures instead of fragile character ranges.
    const patterns=[
      /(?:from|of)\s+(?:the\s+)?(?:Ancient\s+)?Greek\s+([^\s,.;()]{2,80})[^.]{0,180}?(?:meaning|means)\s+[“"'‘’]?([^”"'‘’.;]{1,120})/giu,
      /([^\s,.;()]{2,80})\s+meaning\s+([^.;]{1,120})/giu
    ];
    for(const re of patterns){let m;while((m=re.exec(t))!==null){add(out,m[1],m[2]);if(out.length>=10)break;}}
    // Common construction: "aléxein meaning ... and andrós ... meaning man".
    const pair=/([^\s,.;()]{2,60})\s+meaning\s+([^.;]{1,120}?)\s+and\s+([^\s,.;()]{2,60})(?:,\s*[^.;]{0,80})?\s+meaning\s+([^.;]{1,120})/giu;
    let p;while((p=pair.exec(t))!==null){add(out,p[1],p[2]);add(out,p[3],p[4]);}
    return uniqBy(out,x=>`${x.term.toLowerCase()}|${x.role}`);
  }
  function directWholeMeaning(text=''){
    const t=clean(text);
    if(/defender|protector/i.test(t)&&/(?:of\s+)?(?:man|men|people|mankind|humans?)/i.test(t)) return 'מגן האנשים';
    return '';
  }
  function synthesize(components=[]){const roles=new Set(components.map(x=>x.role));if(roles.has('defense')&&roles.has('person'))return'מגן האנשים';const hes=uniqBy(components,x=>x.role).map(x=>x.he);return hes.length>=2?hes.join(' + '):'';}
  function enrich(result,research){
    if(!result||result.type!=='שם פרטי'||!research)return result;
    const texts=(research.pages||[]).map(p=>[p.text,p.extract,p.etymology].filter(Boolean).join(' ')).filter(Boolean);
    // The engine may already have captured a long infobox root/gloss; include the rendered fields too.
    texts.push([result.originStory,result.meaning,result.simpleSummary].filter(Boolean).join(' '));
    let components=[];for(const t of texts)components.push(...extractComponents(t));components=uniqBy(components,x=>`${x.term.toLowerCase()}|${x.role}`).slice(0,6);
    let whole='';for(const t of texts){whole=directWholeMeaning(t);if(whole)break;}if(!whole)whole=synthesize(components);
    if(!whole)return result;
    const componentText=components.slice(0,4).map(x=>`${x.term} — „${x.he}”`).join('; ');
    const path=[...(result.path||[])];for(const c of components.slice(0,4))if(!path.some(x=>String(x).toLowerCase().includes(c.term.toLowerCase())))path.unshift(`${c.term} — ${c.he}`);
    return {...result,
      meaning:componentText?`השם מורכב מרכיבים שמשמעותם ${componentText}. משמעות השם בכללותו היא בקירוב „${whole}”.`:`משמעות השם בכללותו היא בקירוב „${whole}”.`,
      simpleSummary:`משמעות השם בכללותו היא בקירוב „${whole}”.`,
      plainLanguage:`בקיצור: משמעות השם השלם היא בקירוב „${whole}”, ולא רק „אדם / איש”.`,
      originStory:componentText?`המקורות מציגים יותר מרכיב אטימולוגי אחד: ${componentText}. לכן יש להבחין בין משמעות הרכיבים לבין משמעות השם כולו.`:(result.originStory||''),
      path
    };
  }
  async function install(){const e=window.GivenNameEtymology;if(!e?.build||!e?.research||e.__compoundWrapped)return;const build=e.build.bind(e),research=e.research.bind(e);e.build=async input=>{const [result,r]=await Promise.all([build(input),research(input)]);return enrich(result,r);};e.__compoundWrapped=true;}
  install();window.addEventListener('DOMContentLoaded',install);window.NameOriginCompoundMeaning={extractComponents,synthesize,enrich};
})();