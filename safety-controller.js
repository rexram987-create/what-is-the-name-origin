// Safe search controller v0.5.1
// Handles non-curated searches before the legacy engine: entity ranking, ambiguity prompts,
// context consistency, multi-source corroboration and conservative wording.
(() => {
  const form = document.getElementById('searchForm');
  const input = document.getElementById('query');
  const statusSection = document.getElementById('statusSection');
  const status = document.getElementById('status');
  const resultSection = document.getElementById('resultSection');
  if (!form || !input || !window.NameOriginSafety || typeof renderResult !== 'function') return;

  const api = async (url) => {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  };

  const clean = (s='') => s.replace(/\[[0-9]+\]/g,'').replace(/\s+/g,' ').trim();
  const isHebrew = (s='') => (s.match(/[\u0590-\u05FF]/g)||[]).length >= 10;

  function showStatus(text) {
    status.textContent = text;
    statusSection.hidden = false;
  }

  async function searchWD(query, lang) {
    const u = new URL('https://www.wikidata.org/w/api.php');
    u.searchParams.set('action','wbsearchentities');
    u.searchParams.set('search',query);
    u.searchParams.set('language',lang);
    u.searchParams.set('uselang','he');
    u.searchParams.set('format','json');
    u.searchParams.set('origin','*');
    u.searchParams.set('limit','10');
    return (await api(u)).search || [];
  }

  async function candidates(query) {
    const [he,en] = await Promise.allSettled([searchWD(query,'he'), searchWD(query,'en')]);
    const all = [...(he.value||[]), ...(en.value||[])];
    const byId = new Map();
    for (const x of all) if (!byId.has(x.id)) byId.set(x.id,x);
    return [...byId.values()];
  }

  function displayCandidatePicker(query, ranked, message='מצאתי כמה אפשרויות מתאימות. למה התכוונת?') {
    statusSection.hidden = false;
    status.innerHTML = '';
    const h = document.createElement('strong');
    h.textContent = message;
    status.appendChild(h);
    const wrap = document.createElement('div');
    wrap.className = 'meaning-choices';
    ranked.slice(0,5).forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'meaning-choice';
      b.textContent = `${c.label || query}${c.description ? ` — ${c.description}` : ''}`;
      b.addEventListener('click', () => {
        window.NAME_ORIGIN_CONTEXT = { ...(window.NAME_ORIGIN_CONTEXT||{}), canonicalName:c.label||query, qid:c.id, selectedDescription:c.description||'' };
        input.value = c.label || query;
        form.requestSubmit();
      });
      wrap.appendChild(b);
    });
    status.appendChild(wrap);
  }

  async function sitelinks(qid) {
    const u = new URL('https://www.wikidata.org/w/api.php');
    u.searchParams.set('action','wbgetentities');
    u.searchParams.set('ids',qid);
    u.searchParams.set('props','sitelinks|labels|descriptions');
    u.searchParams.set('sitefilter','hewiki|enwiki|eswiki|dewiki|frwiki|itwiki|hewiktionary|enwiktionary');
    u.searchParams.set('languages','he|en');
    u.searchParams.set('format','json');
    u.searchParams.set('origin','*');
    const data = await api(u);
    return data.entities?.[qid] || {};
  }

  async function etymologySection(base,title) {
    try {
      const s = new URL(base);
      s.searchParams.set('action','parse'); s.searchParams.set('page',title); s.searchParams.set('prop','sections');
      s.searchParams.set('redirects','1'); s.searchParams.set('format','json'); s.searchParams.set('origin','*');
      const data = await api(s);
      const pats=[/אטימולוג/i,/גיזרון/i,/מקור.*שם/i,/שם.*מקור/i,/etymolog/i,/name.*origin/i,/origin.*name/i,/toponym/i,/toponimia/i,/naming/i,/etimolog/i,/étymolog/i];
      const hit=(data.parse?.sections||[]).find(x=>pats.some(r=>r.test((x.line||'').replace(/<[^>]+>/g,''))));
      if(!hit) return '';
      const q=new URL(base);
      q.searchParams.set('action','parse'); q.searchParams.set('page',title); q.searchParams.set('section',hit.index);
      q.searchParams.set('prop','text'); q.searchParams.set('redirects','1'); q.searchParams.set('format','json'); q.searchParams.set('origin','*');
      const html=(await api(q)).parse?.text?.['*']||'';
      const doc=new DOMParser().parseFromString(html,'text/html');
      doc.querySelectorAll('table,style,script,sup.reference,.mw-editsection,.navbox,.infobox').forEach(el=>el.remove());
      return clean(doc.body.textContent||'');
    } catch { return ''; }
  }

  async function page(base,title,sourceName,lang) {
    if(!title) return null;
    try {
      const u=new URL(base);
      u.searchParams.set('action','query'); u.searchParams.set('prop','extracts|info'); u.searchParams.set('inprop','url');
      u.searchParams.set('exintro','1'); u.searchParams.set('explaintext','1'); u.searchParams.set('redirects','1');
      u.searchParams.set('titles',title); u.searchParams.set('format','json'); u.searchParams.set('origin','*');
      const d=await api(u); const p=Object.values(d.query?.pages||{})[0];
      if(!p || p.missing!==undefined) return null;
      return {title:p.title,extract:clean(p.extract||''),etymology:await etymologySection(base,p.title),url:p.fullurl,sourceName,lang};
    } catch { return null; }
  }

  async function sourcePages(entity, fallback) {
    const sl=entity.sitelinks||{};
    const specs=[
      ['https://he.wikipedia.org/w/api.php',sl.hewiki?.title,'ויקיפדיה העברית','he'],
      ['https://en.wikipedia.org/w/api.php',sl.enwiki?.title,'Wikipedia באנגלית','en'],
      ['https://es.wikipedia.org/w/api.php',sl.eswiki?.title,'Wikipedia בספרדית','es'],
      ['https://de.wikipedia.org/w/api.php',sl.dewiki?.title,'Wikipedia בגרמנית','de'],
      ['https://fr.wikipedia.org/w/api.php',sl.frwiki?.title,'Wikipedia בצרפתית','fr'],
      ['https://it.wikipedia.org/w/api.php',sl.itwiki?.title,'Wikipedia באיטלקית','it'],
      ['https://he.wiktionary.org/w/api.php',sl.hewiktionary?.title || fallback,'ויקימילון העברי','he'],
      ['https://en.wiktionary.org/w/api.php',sl.enwiktionary?.title || fallback,'Wiktionary באנגלית','en']
    ];
    const out=await Promise.allSettled(specs.map(x=>page(...x)));
    return out.filter(x=>x.status==='fulfilled'&&x.value).map(x=>x.value);
  }

  function typeFrom(desc='',ctx={}) {
    if(ctx.kind==='city') return 'מקום / עיר';
    if(ctx.kind==='given-name') return 'שם פרטי';
    if(ctx.kind==='surname') return 'שם משפחה';
    if(/city|capital|town|עיר|בירה/i.test(desc)) return 'מקום / עיר';
    if(/given name|שם פרטי/i.test(desc)) return 'שם פרטי';
    if(/surname|family name|שם משפחה/i.test(desc)) return 'שם משפחה';
    if(/country|state|מדינה/i.test(desc)) return 'מדינה';
    return 'שם או ערך';
  }

  function buildResultSafe(query, selected, entity, pages, entityConfidence) {
    const ctx=window.NAME_ORIGIN_CONTEXT||{};
    const he=pages.find(p=>p.lang==='he'&&p.extract);
    const heEty=pages.find(p=>p.lang==='he'&&p.etymology&&isHebrew(p.etymology));
    const ety=pages.filter(p=>(p.etymology||'').length>35);
    const corroboration=NameOriginSafety.corroboration(pages);
    const bestForeign=ety[0];
    const title=he?.title || entity.labels?.he?.value || selected.label || query;
    const desc=entity.descriptions?.he?.value || entity.descriptions?.en?.value || selected.description || '';
    let meaning='לא נמצאה עדיין משמעות אטימולוגית שניתן להציג בעברית בביטחון.';
    let origin='נמצא הערך המתאים, אך עדיין לא נמצא הסבר אטימולוגי עברי מספק.';
    if(heEty){ meaning=heEty.etymology.slice(0,520); origin=heEty.etymology.slice(0,850); }
    else if(bestForeign){ origin=`נמצא סעיף אטימולוגי מפורש ב־${bestForeign.sourceName}, אך הטקסט הזר לא מוצג כאילו הוא תרגום עברי מאומת.`; }

    const risky=NameOriginSafety.claimRisk(`${meaning} ${origin}`);
    if(risky.needsCorroboration && !corroboration.safeForStrongClaim){
      origin += ' מאחר שהטענה נמצאה ללא הצלבה מספקת, היישומון מסמן אותה כהשערה ולא כעובדה.';
    }

    let conf='low', label='רמת ודאות: נמוכה';
    if(entityConfidence.level==='high' && corroboration.sourceCount>=2){ conf='high'; label='רמת ודאות: טובה'; }
    else if(entityConfidence.level!=='low' && corroboration.sourceCount>=1){ conf='medium'; label='רמת ודאות: בינונית'; }

    const sources=[];
    if(selected.id) sources.push({name:'Wikidata',url:`https://www.wikidata.org/wiki/${selected.id}`});
    pages.filter(p=>p.url).slice(0,6).forEach(p=>sources.push({name:p.sourceName,url:p.url}));
    const contextNote=ctx.label ? ` ההקשר שנבחר: ${ctx.label}.` : '';
    return {
      query,title,type:typeFrom(desc,ctx),subtitle:desc || ctx.label || '',
      confidence:conf,confidenceLabel:label,
      simpleSummary:`נבחרה הישות המתאימה לפי השם וההקשר.${contextNote} נמצאו ${corroboration.sourceCount} מקורות עם חומר אטימולוגי מפורש.`,
      whatIsIt: desc || 'נמצא ערך מתאים, אך אין עדיין תיאור עברי מלא.',
      meaning,originStory:origin,
      path:[title],
      changes:'היישומון עדיין לא בנה ציר זמן מלא של צורות השם; הוא יציג כזה רק כשיימצאו שלבים מתועדים.',
      certainty:`בדיקת התאמה: ${entityConfidence.reason} נמצאו ${corroboration.sourceCount} מקורות נפרדים עם סעיף אטימולוגי. ${corroboration.safeForStrongClaim ? 'יש הצלבה בסיסית בין מקורות.' : 'עדיין אין מספיק הצלבה לטענות חזקות.'}`,
      plainLanguage: heEty ? `בקיצור: נמצא מקור אטימולוגי עברי מפורש לערך הזה. המערכת עדיין מסמנת בנפרד מה בטוח ומה דורש הצלבה.` : `בקיצור: מצאנו את הישות הנכונה, אבל עדיין אין לנו ניסוח עברי אטימולוגי מלא שאפשר להציג בביטחון. עדיף לומר זאת מאשר לנחש.`,
      sources
    };
  }

  form.addEventListener('submit', async (event) => {
    const query=input.value.trim();
    if(!query) return;
    const curated=(typeof CURATED!=='undefined') && (CURATED[query.toLowerCase()]||CURATED[query]);
    if(curated) return; // curated-guard handles reviewed entries.

    event.preventDefault();
    event.stopImmediatePropagation();
    resultSection.hidden=true;
    showStatus(`בודקים את „${query}” במצב בטוח…`);

    try {
      const ctx=window.NAME_ORIGIN_CONTEXT||{};
      let ranked=[];
      if(ctx.qid){ ranked=[{id:ctx.qid,label:ctx.canonicalName||query,description:ctx.selectedDescription||'',_safetyScore:100}]; }
      else ranked=NameOriginSafety.rank(await candidates(query), query, ctx);
      const cf=NameOriginSafety.confidence(ranked);
      if(!ranked.length){ showStatus('לא נמצאה ישות מתאימה. נסו ניסוח מעט מפורט יותר.'); return; }
      if(cf.level==='ambiguous' || cf.level==='low'){
        displayCandidatePicker(query,ranked,cf.reason+' בחרו את האפשרות המתאימה:'); return;
      }
      const selected=ranked[0];
      const entity=await sitelinks(selected.id);
      const pages=await sourcePages(entity,selected.label||query);
      renderResult(buildResultSafe(query,selected,entity,pages,cf));
      statusSection.hidden=true; resultSection.hidden=false;
      resultSection.scrollIntoView({behavior:'smooth',block:'start'});
    } catch(err){ console.error(err); showStatus('לא הצלחנו להשלים את הבדיקה הבטוחה כרגע. נסו שוב בעוד רגע.'); }
  }, true);
})();
