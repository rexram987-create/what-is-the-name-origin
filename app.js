const $ = (id) => document.getElementById(id);

const form = $('searchForm');
const queryInput = $('query');
const statusSection = $('statusSection');
const statusBox = $('status');
const resultSection = $('resultSection');

const CURATED = {
  'בואנוס איירס': {
    title: 'בואנוס איירס',
    type: 'מקום / עיר',
    subtitle: 'בירת ארגנטינה',
    meaning: 'בספרדית Buenos Aires פירושו המילולי הוא „אווירים טובים”, ובמשמעות טבעית יותר: „רוחות טובות” או „אוויר נעים”.',
    originStory: 'השם קשור לכינוי נוצרי של מרים, Nuestra Señora del Buen Aire — „גבירתנו של האוויר הטוב”. הכינוי היה קשור למקדש Bonaria שבקליארי שבסרדיניה, והיה מוכר במיוחד למלחים. בשנת 1536 פדרו דה מנדוסה העניק להתיישבות באזור את השם Santa María del Buen Aire. בהתיישבות המחודשת של 1580 נשמר השם בנמל, ובמשך הזמן Buenos Aires נעשה השם המקובל של העיר.',
    path: ['Bonaria / Buen Aire', 'Nuestra Señora del Buen Aire', 'Santa María del Buen Aire', 'Buenos Aires'],
    changes: 'במסמכים מוקדמים מופיעות צורות כגון Buen Ayre ו-Buen Aire. בהמשך התקבעה צורת הרבים Buenos Aires, והיא נעשתה השם הרגיל של העיר.',
    certainty: 'רמת הוודאות גבוהה לגבי הקשר ל-Nuestra Señora del Buen Aire ולמסורת המלחים. קיימים סיפורים עממיים אחרים על מקור השם, אך הם נחשבים חלשים יותר מבחינה היסטורית.',
    plainLanguage: 'בקיצור: בואנוס איירס לא נקראה פשוט מפני שהיה שם „אוויר טוב”. השם הגיע ממסורת דתית של מלחים הקשורה ל„גבירתנו של האוויר הטוב”, ורק אחר כך נעשה שמה המקובל של העיר.',
    sources: [
      { name: 'Wikipedia — Buenos Aires (ספרדית), סעיף Toponimia', url: 'https://es.wikipedia.org/wiki/Buenos_Aires' },
      { name: 'Wikipedia — Nuestra Señora del Buen Aire', url: 'https://es.wikipedia.org/wiki/Nuestra_Se%C3%B1ora_del_Buen_Aire' }
    ]
  },
  'buenos aires': null,
  'ישראל': {
    title: 'ישראל',
    type: 'מדינה / שם מקראי',
    subtitle: 'שם עתיק מן המקרא, שלימים נעשה גם שמה של מדינת ישראל',
    meaning: 'השם יִשְׂרָאֵל מופיע במקרא כשמו החדש של יעקב. הפירוש המדויק של השם שנוי במחלוקת, אך הוא כולל את הרכיב „אל”. במסורת המקראית הוא מוסבר באמצעות הפועל שׂרה — מאבק או התמודדות — בעקבות המשפט „כי שרית עם אלהים ועם אנשים ותוכל”.',
    originStory: 'בראשית לב מתואר שינוי שמו של יעקב לישראל לאחר מאבק לילי. לאחר מכן „ישראל” נעשה גם שם לצאצאי יעקב, לעם, לממלכות קדומות ולבסוף למדינה המודרנית. מבחינה לשונית, חוקרים דנו בכמה ניתוחים אפשריים לשם, ולכן נכון להבדיל בין ההסבר המקראי לבין האטימולוגיה ההיסטורית המדויקת.',
    path: ['יִשְׂרָאֵל — שם אישי', 'בני ישראל / עם ישראל', 'ממלכת ישראל', 'מדינת ישראל'],
    changes: 'צורת השם העברית ישראל נשמרה במשך אלפי שנים. בשפות אחרות נוצרו צורות כמו Israel, Israël ו-Israele על בסיס המסורות היוונית והלטינית.',
    certainty: 'רמת הוודאות גבוהה לגבי עתיקות השם והשימוש המקראי בו. המשמעות הלשונית המדויקת של כל רכיבי השם אינה מוסכמת לחלוטין, ולכן אין להציג פירוש יחיד כהוכחה מוחלטת.',
    plainLanguage: 'בקיצור: „ישראל” הוא קודם כול שם עתיק מאוד מן המקרא. לפי הסיפור המקראי הוא קשור למאבק של יעקב, אבל כששואלים מה הייתה המשמעות הלשונית המקורית המדויקת — יש עדיין מקום למחלוקת.',
    sources: [
      { name: 'ויקיפדיה — ישראל', url: 'https://he.wikipedia.org/wiki/%D7%99%D7%A9%D7%A8%D7%90%D7%9C' },
      { name: 'Wiktionary — Israel', url: 'https://en.wiktionary.org/wiki/Israel' }
    ]
  },
  'israel': null
};
CURATED['buenos aires'] = CURATED['בואנוס איירס'];
CURATED['israel'] = CURATED['ישראל'];

for (const button of document.querySelectorAll('[data-example]')) {
  button.addEventListener('click', () => {
    queryInput.value = button.dataset.example;
    form.requestSubmit();
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = queryInput.value.trim();
  if (!query) return;

  setStatus(`מחפשים את המקור של „${query}”…`);
  resultSection.hidden = true;

  const curated = CURATED[query.toLowerCase()] || CURATED[query];
  if (curated) {
    renderResult({
      ...curated,
      query,
      confidence: 'high',
      confidenceLabel: 'רמת ודאות: טובה',
      simpleSummary: `מצאנו מידע אטימולוגי מפורט על „${curated.title}”, כולל משמעות, גלגול היסטורי ומקורות.`,
      whatIsIt: curated.subtitle
    });
    statusSection.hidden = true;
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  try {
    const wikidata = await searchWikidata(query);
    const sitelinks = wikidata?.id ? await getSitelinks(wikidata.id) : {};
    const pages = await getCandidatePages(query, sitelinks);
    const result = buildResult(query, wikidata, pages);
    renderResult(result);
    statusSection.hidden = true;
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    console.error(error);
    setStatus('לא הצלחנו להשלים את החיפוש כרגע. נסו שוב בעוד רגע.');
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
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.searchParams.set('action', 'wbsearchentities');
  url.searchParams.set('search', query);
  url.searchParams.set('language', 'he');
  url.searchParams.set('uselang', 'he');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
  url.searchParams.set('limit', '1');
  let data = await fetchJson(url);
  if (!data.search?.length) {
    url.searchParams.set('language', 'en');
    url.searchParams.set('uselang', 'en');
    data = await fetchJson(url);
  }
  return data.search?.[0] || null;
}

async function getSitelinks(id) {
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.searchParams.set('action', 'wbgetentities');
  url.searchParams.set('ids', id);
  url.searchParams.set('props', 'sitelinks');
  url.searchParams.set('sitefilter', 'hewiki|enwiki|eswiki|hewiktionary|enwiktionary');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
  const data = await fetchJson(url);
  return data.entities?.[id]?.sitelinks || {};
}

async function getCandidatePages(query, sitelinks) {
  const specs = [
    ['https://he.wikipedia.org/w/api.php', sitelinks.hewiki?.title || query, 'ויקיפדיה העברית'],
    ['https://en.wikipedia.org/w/api.php', sitelinks.enwiki?.title || query, 'Wikipedia באנגלית'],
    ['https://es.wikipedia.org/w/api.php', sitelinks.eswiki?.title || query, 'Wikipedia בספרדית'],
    ['https://he.wiktionary.org/w/api.php', sitelinks.hewiktionary?.title || query, 'ויקימילון העברי'],
    ['https://en.wiktionary.org/w/api.php', sitelinks.enwiktionary?.title || query, 'Wiktionary באנגלית']
  ];
  const settled = await Promise.allSettled(specs.map(([base, title, source]) => fetchPage(base, title, source)));
  return settled.filter(x => x.status === 'fulfilled' && x.value).map(x => x.value);
}

async function fetchPage(base, title, sourceName) {
  const pageUrl = new URL(base);
  pageUrl.searchParams.set('action', 'query');
  pageUrl.searchParams.set('prop', 'extracts|info');
  pageUrl.searchParams.set('inprop', 'url');
  pageUrl.searchParams.set('exintro', '1');
  pageUrl.searchParams.set('explaintext', '1');
  pageUrl.searchParams.set('redirects', '1');
  pageUrl.searchParams.set('titles', title);
  pageUrl.searchParams.set('format', 'json');
  pageUrl.searchParams.set('origin', '*');
  const data = await fetchJson(pageUrl);
  const page = Object.values(data.query?.pages || {})[0];
  if (!page || page.missing !== undefined) return null;
  return {
    title: page.title,
    extract: cleanText(page.extract || ''),
    etymology: await fetchEtymologySection(base, page.title),
    url: page.fullurl || null,
    sourceName
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
    const patterns = [/אטימולוג/i,/גיזרון/i,/מקור.*שם/i,/שם.*מקור/i,/etymolog/i,/name.*origin/i,/origin.*name/i,/toponym/i,/toponimia/i,/naming/i];
    const match = (data.parse?.sections || []).find(s => patterns.some(re => re.test(stripHtml(s.line || ''))));
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
  } catch {
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
  doc.querySelectorAll('table,style,script,sup.reference,.mw-editsection,.navbox,.infobox').forEach(el => el.remove());
  return cleanText(doc.body.textContent || '');
}

function cleanText(text) {
  return text.replace(/\[[0-9]+\]/g, '').replace(/\s+/g, ' ').trim();
}

function shortText(text, max = 650) {
  if (!text) return '';
  return text.length <= max ? text : `${text.slice(0, max).trim()}…`;
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

function buildResult(query, wikidata, pages) {
  const hePage = pages.find(p => p.sourceName === 'ויקיפדיה העברית');
  const bestEtymology = pages.find(p => p.etymology?.length > 40);
  const bestContext = hePage || pages.find(p => p.extract?.length > 80);
  const title = hePage?.title || wikidata?.label || pages[0]?.title || query;
  const description = wikidata?.description || '';
  const hasEtymology = Boolean(bestEtymology);

  const sources = [];
  if (wikidata) sources.push({ name: 'Wikidata', url: `https://www.wikidata.org/wiki/${wikidata.id}` });
  for (const p of pages) if (p.url) sources.push({ name: p.sourceName, url: p.url });

  return {
    query,
    title,
    type: detectType(description),
    subtitle: description || 'תוצאת חיפוש ממקורות Wikimedia',
    confidence: hasEtymology ? 'medium' : 'low',
    confidenceLabel: hasEtymology ? 'רמת ודאות: חלקית' : 'רמת ודאות: נמוכה',
    simpleSummary: hasEtymology
      ? `נמצא סעיף העוסק במקור השם ב־${bestEtymology.sourceName}. אם הוא אינו בעברית, בשלב זה אנו מציגים את נוסח המקור כדי לא להמציא תרגום.`
      : `מצאנו את הערך „${title}”, אך עדיין לא איתרנו סעיף אטימולוגי מפורש במקורות שנבדקו.`,
    whatIsIt: description ? `${title} — ${description}.` : shortText(bestContext?.extract || '', 280) || 'לא נמצא תיאור מספק.',
    meaning: hasEtymology ? shortText(bestEtymology.etymology, 520) : 'לא נמצאה עדיין משמעות אטימולוגית מפורשת.',
    originStory: hasEtymology ? shortText(bestEtymology.etymology, 850) : shortText(bestContext?.extract || '', 650) || 'לא נמצא עדיין סיפור מקור מספק.',
    path: [title],
    changes: 'ציר זמן אוטומטי של שינויי הכתיב וההגייה עדיין בפיתוח.',
    certainty: hasEtymology ? `נמצא סעיף מקור/אטימולוגיה מפורש ב־${bestEtymology.sourceName}, אך עדיין דרושה הצלבה בין מקורות.` : 'אין כרגע די מידע כדי לקבוע אטימולוגיה בביטחון.',
    plainLanguage: hasEtymology ? `בקיצור: נמצא מקור אטימולוגי, אבל אנחנו עדיין עובדים על הפיכתו אוטומטית להסבר עברי פשוט ומדויק.` : `בקיצור: היישומון מזהה את „${title}”, אבל עדיין לא מצא מקור אטימולוגי מספיק.`,
    sources
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
  if (!result.sources?.length) {
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
