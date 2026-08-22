(() => {
  const formEl = document.getElementById('searchForm');
  const queryEl = document.getElementById('query');
  const statusSectionEl = document.getElementById('statusSection');
  const statusEl = document.getElementById('status');
  const resultSectionEl = document.getElementById('resultSection');
  if (!formEl || !queryEl) return;

  const COMMON_PARTS = {
    'new': 'חדש / חדשה', 'ניו': 'חדש / חדשה',
    'nova': 'חדשה', 'nuevo': 'חדש', 'nueva': 'חדשה',
    'san': 'הקדוש', 'santa': 'הקדושה', 'saint': 'הקדוש/ה', 'st.': 'הקדוש/ה',
    'buen': 'טוב', 'buena': 'טובה', 'buenos': 'טובים', 'buenas': 'טובות',
    'aire': 'אוויר', 'aires': 'אווירים / רוחות',
    'de': 'של / מ־', 'del': 'של ה־ / מן ה־', 'da': 'מ־ / מן', 'di': 'של / מ־',
    'la': 'ה־', 'las': 'ה־', 'los': 'ה־', 'el': 'ה־', 'al': 'אל ה־ / ה־',
    'mount': 'הר', 'monte': 'הר', 'fort': 'מבצר', 'rio': 'נהר', 'río': 'נהר'
  };

  function setStatus(message) {
    statusEl.textContent = message;
    statusSectionEl.hidden = false;
  }

  function clean(text = '') {
    return text.replace(/\[[0-9]+\]/g, '').replace(/\s+/g, ' ').trim();
  }

  function isMostlyHebrew(text = '') {
    const he = (text.match(/[\u0590-\u05FF]/g) || []).length;
    const latin = (text.match(/[A-Za-zÀ-ÿ]/g) || []).length;
    return he >= Math.max(12, latin * 0.45);
  }

  async function json(url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function searchWikidata(query) {
    const run = async (lang) => {
      const u = new URL('https://www.wikidata.org/w/api.php');
      u.searchParams.set('action', 'wbsearchentities');
      u.searchParams.set('search', query);
      u.searchParams.set('language', lang);
      u.searchParams.set('uselang', 'he');
      u.searchParams.set('format', 'json');
      u.searchParams.set('origin', '*');
      u.searchParams.set('limit', '7');
      return (await json(u)).search || [];
    };
    let results = await run('he');
    if (!results.length) results = await run('en');
    const q = query.toLowerCase();
    return results.sort((a, b) => {
      const score = (x) => {
        const label = (x.label || '').toLowerCase();
        const d = (x.description || '').toLowerCase();
        let s = label === q ? 8 : label.includes(q) ? 3 : 0;
        if (/surname|family name|שם משפחה|given name|שם פרטי/.test(d) && query.trim().split(/\s+/).length === 1) s += 4;
        return s;
      };
      return score(b) - score(a);
    })[0] || null;
  }

  async function sitelinks(id) {
    const u = new URL('https://www.wikidata.org/w/api.php');
    u.searchParams.set('action', 'wbgetentities');
    u.searchParams.set('ids', id);
    u.searchParams.set('props', 'sitelinks');
    u.searchParams.set('sitefilter', 'hewiki|enwiki|eswiki|itwiki|frwiki|dewiki|hewiktionary|enwiktionary');
    u.searchParams.set('format', 'json');
    u.searchParams.set('origin', '*');
    const data = await json(u);
    return data.entities?.[id]?.sitelinks || {};
  }

  async function parseSection(base, title) {
    const sections = new URL(base);
    sections.searchParams.set('action', 'parse');
    sections.searchParams.set('page', title);
    sections.searchParams.set('prop', 'sections');
    sections.searchParams.set('redirects', '1');
    sections.searchParams.set('format', 'json');
    sections.searchParams.set('origin', '*');
    try {
      const data = await json(sections);
      const pats = [/אטימולוג/i,/גיזרון/i,/מקור.*שם/i,/שם.*מקור/i,/etymolog/i,/name.*origin/i,/origin.*name/i,/toponym/i,/toponimia/i,/naming/i,/nome/i,/étymolog/i,/etimolog/i];
      const hit = (data.parse?.sections || []).find(s => pats.some(r => r.test((s.line || '').replace(/<[^>]+>/g, ''))));
      if (!hit) return '';
      const sec = new URL(base);
      sec.searchParams.set('action', 'parse');
      sec.searchParams.set('page', title);
      sec.searchParams.set('section', hit.index);
      sec.searchParams.set('prop', 'text');
      sec.searchParams.set('redirects', '1');
      sec.searchParams.set('format', 'json');
      sec.searchParams.set('origin', '*');
      const html = (await json(sec)).parse?.text?.['*'] || '';
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('table,style,script,sup.reference,.mw-editsection,.navbox,.infobox').forEach(el => el.remove());
      return clean(doc.body.textContent || '');
    } catch { return ''; }
  }

  async function page(base, title, sourceName, lang) {
    const u = new URL(base);
    u.searchParams.set('action', 'query');
    u.searchParams.set('prop', 'extracts|info');
    u.searchParams.set('inprop', 'url');
    u.searchParams.set('exintro', '1');
    u.searchParams.set('explaintext', '1');
    u.searchParams.set('redirects', '1');
    u.searchParams.set('titles', title);
    u.searchParams.set('format', 'json');
    u.searchParams.set('origin', '*');
    try {
      const data = await json(u);
      const p = Object.values(data.query?.pages || {})[0];
      if (!p || p.missing !== undefined) return null;
      return { title: p.title, extract: clean(p.extract || ''), etymology: await parseSection(base, p.title), url: p.fullurl, sourceName, lang };
    } catch { return null; }
  }

  async function pagesFor(query, sl) {
    const specs = [
      ['https://he.wikipedia.org/w/api.php', sl.hewiki?.title || query, 'ויקיפדיה העברית', 'he'],
      ['https://en.wikipedia.org/w/api.php', sl.enwiki?.title || query, 'Wikipedia באנגלית', 'en'],
      ['https://es.wikipedia.org/w/api.php', sl.eswiki?.title || query, 'Wikipedia בספרדית', 'es'],
      ['https://it.wikipedia.org/w/api.php', sl.itwiki?.title || query, 'Wikipedia באיטלקית', 'it'],
      ['https://fr.wikipedia.org/w/api.php', sl.frwiki?.title || query, 'Wikipedia בצרפתית', 'fr'],
      ['https://de.wikipedia.org/w/api.php', sl.dewiki?.title || query, 'Wikipedia בגרמנית', 'de'],
      ['https://he.wiktionary.org/w/api.php', sl.hewiktionary?.title || query, 'ויקימילון העברי', 'he'],
      ['https://en.wiktionary.org/w/api.php', sl.enwiktionary?.title || query, 'Wiktionary באנגלית', 'en']
    ];
    const settled = await Promise.allSettled(specs.map(x => page(...x)));
    return settled.filter(x => x.status === 'fulfilled' && x.value).map(x => x.value);
  }

  function decompose(query) {
    const tokens = query.trim().split(/[\s\-–—]+/).filter(Boolean);
    if (tokens.length < 2) return null;
    const explained = tokens.map(t => ({ token: t, meaning: COMMON_PARTS[t.toLowerCase()] || null }));
    const known = explained.filter(x => x.meaning);
    if (!known.length) return null;
    return { tokens: explained, known };
  }

  function typeFrom(desc = '') {
    const d = desc.toLowerCase();
    if (/surname|family name|שם משפחה/.test(d)) return 'שם משפחה';
    if (/given name|שם פרטי/.test(d)) return 'שם פרטי';
    if (/city|town|capital|עיר|בירה/.test(d)) return 'מקום / עיר';
    if (/country|state|מדינה/.test(d)) return 'מדינה';
    if (/person|singer|actor|writer|politician|אדם|זמר|שחקן/.test(d)) return 'אדם';
    return 'שם או ערך';
  }

  function short(text, n = 600) {
    if (!text) return '';
    return text.length <= n ? text : `${text.slice(0, n).trim()}…`;
  }

  function sourceComparison(pages) {
    const ety = pages.filter(p => p.etymology && p.etymology.length > 35);
    const languages = [...new Set(ety.map(p => p.lang))];
    if (ety.length >= 3) return { level: 'high', label: 'רמת ודאות: טובה', text: `נמצא מידע על מקור השם ב־${ety.length} מקורות וב־${languages.length} שפות. זה מחזק את התוצאה, אך אינו מבטל אפשרות למחלוקת מחקרית.` };
    if (ety.length === 2) return { level: 'medium', label: 'רמת ודאות: בינונית', text: 'נמצאו שני מקורות עצמאיים יחסית העוסקים במקור השם. כדאי עדיין לבדוק אם הם נשענים על אותה מסורת.' };
    if (ety.length === 1) return { level: 'medium', label: 'רמת ודאות: חלקית', text: `נמצא מקור אטימולוגי מפורש אחד (${ety[0].sourceName}). התוצאה שימושית, אך עדיין חסרה הצלבה.` };
    return { level: 'low', label: 'רמת ודאות: נמוכה', text: 'לא נמצא עדיין סעיף אטימולוגי מפורש במקורות שנבדקו, ולכן אין בסיס מספיק לקביעה מלאה.' };
  }

  function build(query, wd, pages) {
    const he = pages.find(p => p.lang === 'he' && p.extract);
    const hebrewEty = pages.find(p => p.lang === 'he' && p.etymology && isMostlyHebrew(p.etymology));
    const anyEty = pages.find(p => p.etymology?.length > 35);
    const cmp = sourceComparison(pages);
    const decomposition = decompose(query);
    const title = he?.title || wd?.label || pages[0]?.title || query;
    const desc = wd?.description || '';

    let meaning = 'לא נמצאה עדיין משמעות אטימולוגית שניתן להציג בעברית בביטחון.';
    let originStory = he?.extract ? short(he.extract, 520) : 'נמצא הערך, אך עדיין חסר הסבר עברי מלא למקור השם.';
    let path = [title];
    let changes = 'לא נמצא עדיין ציר זמן מלא של צורות השם.';

    if (hebrewEty) {
      meaning = short(hebrewEty.etymology, 500);
      originStory = short(hebrewEty.etymology, 800);
    } else if (decomposition) {
      const knownText = decomposition.known.map(x => `„${x.token}” = ${x.meaning}`).join('; ');
      meaning = `השם מורכב מכמה רכיבים. מן הרכיבים שאפשר לזהות בביטחון: ${knownText}.`;
      originStory = `המערכת פירקה את השם לרכיבים ובדקה כל רכיב בנפרד. ${anyEty ? `בנוסף נמצא סעיף אטימולוגי ב־${anyEty.sourceName}, אך איננו מציגים את הטקסט הזר כעברית ללא תרגום מאומת.` : 'עדיין לא נמצא מקור שמסביר את כל השרשרת.'}`;
      path = decomposition.tokens.map(x => x.meaning ? `${x.token} — ${x.meaning}` : x.token);
      changes = 'זהו פירוק מבני של השם. כשנמצא מקור היסטורי לצורה קדומה יותר, היא תתווסף לשרשרת.';
    }

    const etySources = pages.filter(p => p.etymology?.length > 35);
    const sources = [];
    if (wd?.id) sources.push({ name: 'Wikidata', url: `https://www.wikidata.org/wiki/${wd.id}` });
    for (const p of pages) if (p.url) sources.push({ name: p.etymology?.length > 35 ? `${p.sourceName} — כולל מידע על מקור השם` : p.sourceName, url: p.url });

    return {
      title,
      type: typeFrom(desc),
      subtitle: desc || 'תוצאה ממקורות פתוחים',
      confidence: cmp.level,
      confidenceLabel: cmp.label,
      simpleSummary: etySources.length
        ? `נמצאו ${etySources.length} מקורות העוסקים במקור השם. היישומון משווה ביניהם ומציג בעברית רק מידע שאפשר להסביר בביטחון.`
        : decomposition
          ? 'לא נמצא עדיין סעיף אטימולוגי מלא, אבל הצלחנו לפרק את השם לרכיבים בעלי משמעות ולבנות התחלה של שרשרת.'
          : 'מצאנו את הערך, אך עדיין אין מספיק מידע כדי לבנות שרשרת אטימולוגית מלאה.',
      whatIsIt: desc ? `${title} — ${desc}.` : short(he?.extract || '', 260) || 'לא נמצא תיאור עברי מספק.',
      meaning,
      originStory,
      path,
      changes,
      certainty: `${cmp.text} ${etySources.length ? `המקורות שנמצאו: ${etySources.map(p => p.sourceName).join(', ')}.` : ''}`,
      plainLanguage: etySources.length >= 2
        ? `בקיצור: על „${title}” יש יותר ממקור אחד שעוסק במקור השם, ולכן אפשר להתחיל לבנות שרשרת בזהירות ולהבדיל בין מה שמוסכם לבין מה שעדיין דורש בדיקה.`
        : decomposition
          ? `בקיצור: פירקנו את „${title}” לחלקים. זה עדיין לא מחליף אטימולוגיה היסטורית מלאה, אבל הוא עוזר לדעת מה צריך לחקור בשלב הבא.`
          : `בקיצור: אנחנו יודעים מהו „${title}”, אבל עדיין לא יודעים מספיק על גלגול שמו כדי להציג סיפור מלא.`,
      sources
    };
  }

  function render(r) {
    document.getElementById('resultType').textContent = r.type;
    document.getElementById('resultTitle').textContent = r.title;
    document.getElementById('resultSubtitle').textContent = r.subtitle;
    document.getElementById('simpleSummary').textContent = r.simpleSummary;
    document.getElementById('whatIsIt').textContent = r.whatIsIt;
    document.getElementById('meaning').textContent = r.meaning;
    document.getElementById('originStory').textContent = r.originStory;
    document.getElementById('changes').textContent = r.changes;
    document.getElementById('certainty').textContent = r.certainty;
    document.getElementById('plainLanguage').textContent = r.plainLanguage;
    const badge = document.getElementById('confidenceBadge');
    badge.textContent = r.confidenceLabel;
    badge.className = `confidence confidence-${r.confidence}`;

    const p = document.getElementById('etymologyPath');
    p.replaceChildren();
    r.path.forEach((step, i) => {
      const s = document.createElement('span'); s.className = 'path-step'; s.textContent = step; p.appendChild(s);
      if (i < r.path.length - 1) { const a = document.createElement('span'); a.className = 'path-arrow'; a.textContent = '←'; p.appendChild(a); }
    });

    const ul = document.getElementById('sourcesList');
    ul.replaceChildren();
    r.sources.forEach(src => { const li = document.createElement('li'); const a = document.createElement('a'); a.href = src.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = src.name; li.appendChild(a); ul.appendChild(li); });
  }

  formEl.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const query = queryEl.value.trim();
    if (!query) return;

    // Keep the carefully researched entries from the previous engine.
    const curated = typeof CURATED !== 'undefined' ? (CURATED[query.toLowerCase()] || CURATED[query]) : null;
    if (curated) return; // let the established curated path handle these entries through app.js on a normal reload/search.

    setStatus(`בונים שרשרת אטימולוגית עבור „${query}” ומשווים כמה מקורות…`);
    resultSectionEl.hidden = true;
    try {
      const wd = await searchWikidata(query);
      const sl = wd?.id ? await sitelinks(wd.id) : {};
      const pages = await pagesFor(query, sl);
      render(build(query, wd, pages));
      statusSectionEl.hidden = true;
      resultSectionEl.hidden = false;
      resultSectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      console.error(e);
      setStatus('לא הצלחנו להשלים את ההשוואה כרגע. נסו שוב בעוד רגע.');
    }
  }, true);
})();