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
  return searchMediaWiki('https://he.wikipedia.org/w/api.php', query, 'ויקיפדיה העברית');
}

async function searchWiktionary(query) {
  let result = await searchMediaWiki('https://he.wiktionary.org/w/api.php', query, 'ויקימילון העברי');
  if (!result) {
    result = await searchMediaWiki('https://en.wiktionary.org/w/api.php', query, 'Wiktionary באנגלית');
  }
  return result;
}

async function searchMediaWiki(base, query, sourceName) {
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

  return {
    title: page.title,
    extract: cleanText(page.extract || ''),
    url: page.fullurl || null,
    sourceName,
  };
}

function cleanText(text) {
  return text.replace(/\s+/g, ' ').trim();
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
  const hasDictionaryEvidence = dictText.length > 80;
  const hasContext = wikiText.length > 80;

  let confidence = 'low';
  let confidenceLabel = 'רמת ודאות: נמוכה';
  if (hasDictionaryEvidence && hasContext) {
    confidence = 'high';
    confidenceLabel = 'רמת ודאות: טובה';
  } else if (hasDictionaryEvidence || hasContext) {
    confidence = 'medium';
    confidenceLabel = 'רמת ודאות: חלקית';
  }

  const whatIsIt = description
    ? `${wikidata?.label || title} — ${description}.`
    : (hasContext ? shortText(wikiText, 260) : 'עדיין לא נמצא תיאור אמין מספיק של הערך.');

  const meaning = hasDictionaryEvidence
    ? shortText(dictText, 430)
    : 'בגרסה זו עדיין לא נמצאה במקור המילוני הזמין משמעות אטימולוגית ברורה. אנחנו מעדיפים לומר זאת במפורש ולא לנחש.';

  const originStory = hasContext
    ? shortText(wikiText, 620)
    : 'לא נמצא עדיין סיפור היסטורי מספק במקור האנציקלופדי שנבדק.';

  const simpleSummary = hasDictionaryEvidence
    ? `מצאנו חומר מילוני על „${title}”, ולצדו מידע היסטורי${hasContext ? '' : ' חלקי'}. בהמשך נפריד אוטומטית בין מקור לשוני, משמעות והיסטוריה.`
    : `מצאנו מידע על „${title}”, אבל עדיין אין בידינו אטימולוגיה מספקת ממקור מילוני. לכן בשלב זה לא נציג פירוש משוער כאילו הוא עובדה.`;

  const certainty = confidence === 'high'
    ? 'יש כרגע חיזוק גם ממקור מילוני וגם ממקור אנציקלופדי. עדיין חשוב לבדוק את הניסוח האטימולוגי מול מקורות נוספים.'
    : confidence === 'medium'
      ? 'נמצא מידע שימושי, אך חסר כרגע חיזוק ממקור נוסף. יש להתייחס לחלק מהתוצאה כמידע ראשוני.'
      : 'אין כרגע די מידע כדי לקבוע אטימולוגיה בביטחון. זהו מצב שבו היישומון מעדיף לומר „לא ידוע עדיין” ולא להמציא.';

  const path = [];
  if (wiktionary?.title) path.push(wiktionary.title);
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
    subtitle: description || 'תוצאת חיפוש ראשונית ממקורות Wikimedia',
    confidence,
    confidenceLabel,
    simpleSummary,
    whatIsIt,
    meaning,
    originStory,
    path,
    changes: 'גרסה 0.1 עדיין אינה מפיקה אוטומטית ציר זמן של שינויי הכתיב וההגייה. זה אחד השלבים הבאים במערכת.',
    certainty,
    plainLanguage: hasDictionaryEvidence
      ? `בקיצור: על „${title}” נמצא מידע שאפשר להתחיל ממנו, אך אנחנו עדיין מפרידים בזהירות בין מה שמתועד לבין מה שדורש בדיקה נוספת.`
      : `בקיצור: אנחנו יודעים משהו על „${title}”, אבל עדיין לא מספיק כדי לספר סיפור אטימולוגי מלא בביטחון. כשהמידע אינו מספיק — היישומון אומר זאת בגלוי.`,
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
