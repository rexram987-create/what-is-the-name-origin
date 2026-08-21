const $ = (id) => document.getElementById(id);

const form = $('searchForm');
const queryInput = $('query');
const statusSection = $('statusSection');
const statusBox = $('status');
const resultSection = $('resultSection');

const examples = document.querySelectorAll('[data-example]');
examples.forEach((button) => {
  button.addEventListener('click', () => {
    queryInput.value = button.dataset.example;
    form.requestSubmit();
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = queryInput.value.trim();
  if (!query) return;

  setStatus(`מחפשים את המקור של „${query}”…`);
  resultSection.hidden = true;

  try {
    const [wikidata, wikipedia, wiktionary] = await Promise.all([
      searchWikidata(query),
      searchWikipedia(query),
      searchWiktionary(query),
    ]);

    const result = buildResult(query, wikidata, wikipedia, wiktionary);
    renderResult(result);
    statusSection.hidden = true;
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    console.error(error);
    setStatus('לא הצלחנו להשלים את החיפוש כרגע. ייתכן שאחד ממקורות Wikimedia אינו זמין. נסו שוב בעוד רגע.');
  }
});

function setStatus(message) {
  statusBox.textContent = message;
  statusSection.hidden = false;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function searchWikidata(query) {
  const endpoint = new URL('https://www.wikidata.org/w/api.php');
  endpoint.searchParams.set('action', 'wbsearchentities');
  endpoint.searchParams.set('search', query);
  endpoint.searchParams.set('language', 'he');
  endpoint.searchParams.set('uselang', 'he');
  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('origin', '*');
  endpoint.searchParams.set('limit', '1');

  let data = await fetchJson(endpoint);
  if (!data.search?.length) {
    endpoint.searchParams.set('language', 'en');
    endpoint.searchParams.set('uselang', 'en');
    data = await fetchJson(endpoint);
  }
  return data.search?.[0] || null;
}

async function searchWikipedia(query) {
  let result = await searchMediaWiki('https://he.wikipedia.org/w/api.php', query, 'ויקיפדיה העברית', true);
  if (!result?.etymology) {
    const english = await searchMediaWiki('https://en.wikipedia.org/w/api.php', query, 'Wikipedia באנגלית', true);
    if (!result) result = english;
    else if (english?.etymology) result.etymology = english.etymology;
  }
  return result;
}

async function searchWiktionary(query) {
  let result = await searchMediaWiki('https://he.wiktionary.org/w/api.php', query, 'ויקימילון העברי', true);
  if (!result?.etymology) {
    const english = await searchMediaWiki('https://en.wiktionary.org/w/api.php', query, 'Wiktionary באנגלית', true);
    if (!result) result = english;
    else if (english?.etymology) result.etymology = english.etymology;
  }
  return result;
}

async function searchMediaWiki(base, query, sourceName, includeEtymology = false) {
  const searchUrl = new URL(base);
  searchUrl.searchParams.set('action', 'query');
  searchUrl.searchParams.set('list', 'search');
  searchUrl.searchParams.set('srsearch', query);
  searchUrl.searchParams.set('srlimit', '1');
  searchUrl.searchParams.set('format', 'json');
  searchUrl.searchParams.set('origin', '*');

  const searchData = await fetchJson(searchUrl);
  const hit = searchData.query?.search?.[0];
  if (!hit) return null;

  const pageUrl = new URL(base);
  pageUrl.searchParams.set('action', 'query');
  pageUrl.searchParams.set('prop', 'extracts|info');
  pageUrl.searchParams.set('inprop', 'url');
  pageUrl.searchParams.set('exintro', '1');
  pageUrl.searchParams.set('explaintext', '1');
  pageUrl.searchParams.set('redirects', '1');
  pageUrl.searchParams.set('titles', hit.title);
  pageUrl.searchParams.set('format', 'json');
  pageUrl.searchParams.set('origin', '*');

  const pageData = await fetchJson(pageUrl);
  const page = Object.values(pageData.query?.pages || {})[0];
  if (!page || page.missing !== undefined) return null;

  let etymology = '';
  if (includeEtymology) etymology = await fetchEtymologySection(base, page.title);

  return {
    title: page.title,
    extract: cleanText(page.extract || ''),
    etymology,
    url: page.fullurl || null,
    sourceName,
  };
}

async function fetchEtymologySection(base, title) {
  const sectionsUrl = new URL(base);
  sectionsUrl.searchParams.set('action', 'parse');
  sectionsUrl.searchParams.set('page', title);
  sectionsUrl.searchParams.set('prop', 'sections');
  sectionsUrl.searchParams.set('redirects', '1');
  sectionsUrl.searchParams.set('format', 'json');
  sectionsUrl.searchParams.set('origin', '*');

  try {
    const data = await fetchJson(sectionsUrl);
    const sections = data.parse?.sections || [];
    const patterns = [
      /אטימולוג/i,
      /גיזרון/i,
      /מקור.*שם/i,
      /שם.*מקור/i,
      /מקור השם/i,
      /etymolog/i,
      /name$/i,
      /name and etymology/i,
      /toponym/i,
      /naming/i,
    ];

    const match = sections.find((section) => patterns.some((re) => re.test(stripHtml(section.line || ''))));
    if (!match) return '';

    const sectionUrl = new URL(base);
    sectionUrl.searchParams.set('action', 'parse');
    sectionUrl.searchParams.set('page', title);
    sectionUrl.searchParams.set('section', match.index);
    sectionUrl.searchParams.set('prop', 'text');
    sectionUrl.searchParams.set('redirects', '1');
    sectionUrl.searchParams.set('format', 'json');
    sectionUrl.searchParams.set('origin', '*');

    const sectionData = await fetchJson(sectionUrl);
    return htmlToPlainText(sectionData.parse?.text?.['*'] || '');
  } catch (error) {
    console.warn('Etymology section lookup failed', error);
    return '';
  }
}

function stripHtml(text) {
  const div = document.createElement('div');
  div.innerHTML = text;
  return div.textContent || '';
}

function htmlToPlainText(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('table, style, script, sup.reference, .mw-editsection, .navbox, .infobox').forEach((el) => el.remove());
  return cleanText(doc.body.textContent || '');
}

function cleanText(text) {
  return text.replace(/\[[0-9]+\]/g, '').replace(/\s+/g, ' ').trim();
}

function shortText(text, max = 520) {
  if (!text) return '';
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSentence = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return `${(lastSentence > 180 ? cut.slice(0, lastSentence + 1) : cut).trim()}…`;
}

function detectType(description = '') {
  const d = description.toLowerCase();
  if (/עיר|city|capital|municipality|town/.test(d)) return 'מקום / עיר';
  if (/מדינה|country|state|sovereign/.test(d)) return 'מדינה';
  if (/זמר|זמרת|שחקן|שחקנית|אדם|politician|singer|actor|writer|person/.test(d)) return 'אדם';
  if (/נהר|river/.test(d)) return 'נהר';
  if (/הר|mountain/.test(d)) return 'הר';
  return 'שם או ערך';
}

function buildResult(query, wikidata, wikipedia, wiktionary) {
  const title = wikipedia?.title || wiktionary?.title || wikidata?.label || query;
  const description = wikidata?.description || '';
  const type = detectType(description);

  const wikiText = wikipedia?.extract || '';
  const dictText = wiktionary?.extract || '';
  const etymologyText = wiktionary?.etymology || wikipedia?.etymology || '';
  const hasEtymology = etymologyText.length > 40;
  const hasDictionaryEvidence = dictText.length > 80 || Boolean(wiktionary?.etymology);
  const hasContext = wikiText.length > 80;

  let confidence = 'low';
  let confidenceLabel = 'רמת ודאות: נמוכה';
  if (hasEtymology && hasContext) {
    confidence = 'high';
    confidenceLabel = 'רמת ודאות: טובה';
  } else if (hasEtymology || hasDictionaryEvidence || hasContext) {
    confidence = 'medium';
    confidenceLabel = 'רמת ודאות: חלקית';
  }

  const whatIsIt = description
    ? `${wikidata?.label || title} — ${description}.`
    : (hasContext ? shortText(wikiText, 260) : 'עדיין לא נמצא תיאור אמין מספיק של הערך.');

  const meaning = hasEtymology
    ? shortText(etymologyText, 520)
    : hasDictionaryEvidence
      ? shortText(dictText, 430)
      : 'לא נמצאה עדיין משמעות אטימולוגית ברורה במקורות שבדקנו.';

  const originStory = hasEtymology
    ? shortText(etymologyText, 760)
    : hasContext
      ? shortText(wikiText, 620)
      : 'לא נמצא עדיין סיפור היסטורי מספק במקור האנציקלופדי שנבדק.';

  const simpleSummary = hasEtymology
    ? `מצאנו מידע אטימולוגי ממשי על „${title}”. להלן המקור והסיפור שמאחורי השם, כפי שהם מופיעים במקורות Wikimedia.`
    : `מצאנו מידע על „${title}”, אבל עדיין לא איתרנו סעיף אטימולוגי מפורש. לכן לא נציג פירוש משוער כאילו הוא עובדה.`;

  const certainty = hasEtymology
    ? 'נמצא סעיף אטימולוגי מפורש באחד ממקורות Wikimedia. עדיין ייתכנו מחלוקות בין חוקרים, ולכן בהמשך נוסיף הצלבה עם מקורות נוספים.'
    : confidence === 'medium'
      ? 'נמצא מידע שימושי, אך לא סעיף אטימולוגי מפורש. יש להתייחס לתוצאה כמידע ראשוני.'
      : 'אין כרגע די מידע כדי לקבוע אטימולוגיה בביטחון.';

  const path = [];
  if (wiktionary?.title) path.push(wiktionary.title);
  if (wikipedia?.title && !path.includes(wikipedia.title)) path.push(wikipedia.title);
  if (wikidata?.label && !path.includes(wikidata.label)) path.push(wikidata.label);
  if (!path.length) path.push(query);

  const sources = [];
  if (wikidata) sources.push({ name: 'Wikidata', url: `https://www.wikidata.org/wiki/${wikidata.id}` });
  if (wikipedia?.url) sources.push({ name: wikipedia.sourceName, url: wikipedia.url });
  if (wiktionary?.url) sources.push({ name: wiktionary.sourceName, url: wiktionary.url });

  return {
    query,
    title,
    type,
    subtitle: description || 'תוצאת חיפוש ממקורות Wikimedia',
    confidence,
    confidenceLabel,
    simpleSummary,
    whatIsIt,
    meaning,
    originStory,
    path,
    changes: hasEtymology ? 'בגרסה זו אנו כבר מאתרים סעיפי אטימולוגיה מפורשים. ציר זמן מלא של שינויי כתיב והגייה יתווסף בהמשך.' : 'עדיין לא נמצא מידע מספק על שינויי הכתיב וההגייה לאורך הזמן.',
    certainty,
    plainLanguage: hasEtymology
      ? `בקיצור: ל„${title}” נמצא מקור אטימולוגי מפורש, והיישומון מציג אותו בנפרד מהמידע הכללי על הערך.`
      : `בקיצור: אנחנו יודעים מהו „${title}”, אבל עדיין לא מצאנו מקור אטימולוגי מפורש מספיק.`,
    sources,
  };
}

function renderResult(result) {
  $('resultType').textContent = result.type;
  $('resultTitle').textContent = result.title;
  $('resultSubtitle').textContent = result.subtitle;
  $('simpleSummary').textContent = result.simpleSummary;
  $('whatIsIt').textContent = result.whatIsIt;
  $('meaning').textContent = result.meaning;
  $('originStory').textContent = result.originStory;
  $('changes').textContent = result.changes;
  $('certainty').textContent = result.certainty;
  $('plainLanguage').textContent = result.plainLanguage;

  const badge = $('confidenceBadge');
  badge.textContent = result.confidenceLabel;
  badge.className = `confidence confidence-${result.confidence}`;

  const path = $('etymologyPath');
  path.replaceChildren();
  result.path.forEach((step, index) => {
    const item = document.createElement('span');
    item.className = 'path-step';
    item.textContent = step;
    path.appendChild(item);
    if (index < result.path.length - 1) {
      const arrow = document.createElement('span');
      arrow.className = 'path-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '←';
      path.appendChild(arrow);
    }
  });

  const sourcesList = $('sourcesList');
  sourcesList.replaceChildren();
  if (!result.sources.length) {
    const li = document.createElement('li');
    li.textContent = 'לא נמצאו מקורות זמינים להצגה.';
    sourcesList.appendChild(li);
  } else {
    result.sources.forEach((source) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = source.name;
      li.appendChild(link);
      sourcesList.appendChild(li);
    });
  }
}
