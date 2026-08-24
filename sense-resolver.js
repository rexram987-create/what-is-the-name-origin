// Lexical sense discovery v1.1.0
// Finds dictionary meanings before etymology research, so the user can choose the intended sense.
(() => {
  const HOSTS = [
    { host: 'he.wiktionary.org', sourceName: 'ויקימילון העברי' },
    { host: 'en.wiktionary.org', sourceName: 'Wiktionary באנגלית' }
  ];

  const POS = [
    { re: /^(noun|proper noun|שם עצם|שם פרטי)$/i, label: 'שם עצם' },
    { re: /^(verb|פועל)$/i, label: 'פועל' },
    { re: /^(adjective|שם תואר)$/i, label: 'שם תואר' },
    { re: /^(adverb|תואר הפועל)$/i, label: 'תואר הפועל' },
    { re: /^(interjection|מילת קריאה)$/i, label: 'מילת קריאה' },
    { re: /^(preposition|מילת יחס)$/i, label: 'מילת יחס' },
    { re: /^(pronoun|כינוי)$/i, label: 'כינוי' }
  ];

  const clean = value => String(value || '').replace(/\[[0-9]+\]/g, '').replace(/\s+/g, ' ').trim();
  const searchKey = value => clean(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f\u0591-\u05C7]/g, '').replace(/[^\p{L}\p{N}]+/gu, '');
  const short = (value, length = 150) => value.length <= length ? value : `${value.slice(0, length).trim()}…`;
  const headingText = heading => clean(heading.textContent).replace(/\[edit\]|עריכה$/gi, '').trim();
  const headingElement = node => /^H[2-6]$/.test(node?.tagName || '') ? node : node?.querySelector?.(':scope > h2,:scope > h3,:scope > h4,:scope > h5,:scope > h6');
  const headingLevel = node => {
    const heading = headingElement(node);
    return heading ? Number(heading.tagName.slice(1)) : 99;
  };
  const headingContainer = heading => heading.parentElement?.classList?.contains('mw-heading') ? heading.parentElement : heading;
  const posInfo = title => POS.find(item => item.re.test(title));
  const isEtymology = title => /etymolog|אטימולוג|גיזרון|מקור המילה/i.test(title);

  async function json(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function sectionNodes(heading) {
    const level = headingLevel(heading), nodes = [], anchor = headingContainer(heading);
    for (let node = anchor.nextElementSibling; node; node = node.nextElementSibling) {
      if (headingLevel(node) <= level) break;
      nodes.push(node);
    }
    return nodes;
  }

  function leadNodes(heading) {
    const nodes = [], anchor = headingContainer(heading);
    for (let node = anchor.nextElementSibling; node; node = node.nextElementSibling) {
      if (headingLevel(node) < 99) break;
      nodes.push(node);
    }
    return nodes;
  }

  function textFromNodes(nodes) {
    const clone = document.createElement('div');
    nodes.forEach(node => clone.appendChild(node.cloneNode(true)));
    clone.querySelectorAll('table,style,script,sup,.mw-editsection,.navbox,.infobox,.etytree,.NavFrame,ol,ul').forEach(node => node.remove());
    return clean(clone.textContent);
  }

  function focusedEtymology(text) {
    const value = clean(text), marker = value.search(/\b(?:inherited|borrowed|derived)\s+from\b/i);
    return marker > 0 ? value.slice(marker) : value;
  }

  function definitionsFromNodes(nodes) {
    const wrapper = document.createElement('div');
    nodes.forEach(node => wrapper.appendChild(node.cloneNode(true)));
    const definitions = [];
    for (const li of wrapper.querySelectorAll('ol > li')) {
      const copy = li.cloneNode(true);
      copy.querySelectorAll('ol,ul,dl,table,sup,.reference').forEach(node => node.remove());
      const definition = clean(copy.textContent);
      if (definition.length >= 3 && !definitions.includes(definition)) definitions.push(definition);
      if (definitions.length >= 4) break;
    }
    return definitions;
  }

  function parsePage(query, config, parsed) {
    const html = parsed?.text?.['*'] || '';
    if (!html) return [];
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const root = doc.querySelector('.mw-parser-output') || doc.body;
    const headings = [...root.querySelectorAll('h2,h3,h4,h5')];
    const results = [];
    let language = '', etymology = '', etymologyGroup = 0;

    for (const heading of headings) {
      const title = headingText(heading);
      if (heading.tagName === 'H2') {
        language = title;
        etymology = '';
      }
      if (isEtymology(title)) {
        etymologyGroup += 1;
        etymology = focusedEtymology(textFromNodes(leadNodes(heading)));
        continue;
      }
      const pos = posInfo(title);
      if (!pos) continue;
      const definitions = definitionsFromNodes(sectionNodes(heading));
      for (const definition of definitions) {
        results.push({
          kind: 'lexical-sense',
          query,
          title: parsed.title || query,
          language: language || 'שפת הערך',
          partOfSpeech: pos.label,
          partOfSpeechRaw: title,
          definition: short(definition.replace(/^\([^)]{1,90}\)\s*/, ''), 260),
          etymology: short(etymology, 1200),
          etymologyGroup: `${config.host}|${language}|${etymologyGroup}`,
          sourceName: config.sourceName,
          host: config.host,
          url: `https://${config.host}/wiki/${encodeURIComponent(String(parsed.title || query).replace(/ /g, '_'))}`
        });
      }
    }
    return results;
  }

  async function parseTitle(title, config) {
    const url = new URL(`https://${config.host}/w/api.php`);
    url.searchParams.set('action', 'parse');
    url.searchParams.set('page', title);
    url.searchParams.set('prop', 'text|sections');
    url.searchParams.set('redirects', '1');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');
    return json(url);
  }

  async function findDictionaryTitle(query, config) {
    const url = new URL(`https://${config.host}/w/api.php`);
    url.searchParams.set('action', 'query');
    url.searchParams.set('list', 'search');
    url.searchParams.set('srsearch', query);
    url.searchParams.set('srnamespace', '0');
    url.searchParams.set('srlimit', '6');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');
    const data = await json(url), key = searchKey(query);
    const results = data?.query?.search || [];
    return results.find(result => searchKey(result.title) === key)?.title || null;
  }

  async function page(query, config) {
    let data = await parseTitle(query, config);
    if (!data?.parse) {
      const resolvedTitle = await findDictionaryTitle(query, config);
      if (!resolvedTitle) return [];
      data = await parseTitle(resolvedTitle, config);
    }
    return data?.parse ? parsePage(query, config, data.parse) : [];
  }

  function senseKey(sense) {
    return `${sense.language}|${sense.partOfSpeech}|${clean(sense.definition).toLowerCase()}`;
  }

  function preferredLanguage(query, language) {
    if (/[\u0590-\u05FF]/.test(query)) return /^(Hebrew|עברית)$/i.test(language);
    if (/[\u0400-\u04FF]/.test(query)) return /^(Russian|רוסית)$/i.test(language);
    if (/[\u0370-\u03FF]/.test(query)) return /^(Greek|Ancient Greek|יוונית)$/i.test(language);
    if (/[A-Za-z]/.test(query)) return /^(English|אנגלית)$/i.test(language);
    return false;
  }

  async function discover(query) {
    const settled = await Promise.allSettled(HOSTS.map(config => page(query, config)));
    const found = settled.flatMap(result => result.status === 'fulfilled' ? result.value : []);
    const unique = [...new Map(found.map(sense => [senseKey(sense), sense])).values()];
    const preferred = unique.filter(sense => preferredLanguage(query, sense.language));
    const pool = preferred.length ? preferred : unique;
    const selected = [], perGroup = new Map();
    for (const sense of pool) {
      const count = perGroup.get(sense.etymologyGroup) || 0;
      if (count >= 2) continue;
      selected.push(sense); perGroup.set(sense.etymologyGroup, count + 1);
      if (selected.length >= 6) break;
    }
    return selected;
  }

  function buildResult(sense) {
    const hasEtymology = Boolean(clean(sense.etymology));
    const sourceLanguageIsHebrew = /[֐-׿]/.test(sense.etymology || '');
    const origin = hasEtymology
      ? sourceLanguageIsHebrew
        ? sense.etymology
        : `במקור המילוני נמצא הסבר אטימולוגי למשמעות שנבחרה. הטקסט נשמר בשפת המקור כדי לא להציג תרגום לא מאומת: ${sense.etymology}`
      : 'למשמעות שנבחרה לא נמצא סעיף אטימולוגי מפורש במקור שנבדק.';
    return {
      title: sense.query,
      type: `מילה / ${sense.partOfSpeech}`,
      subtitle: `המשמעות שנבחרה: ${sense.definition}`,
      confidence: hasEtymology ? 'medium' : 'low',
      confidenceLabel: hasEtymology ? 'רמת ודאות: חלקית' : 'רמת ודאות: נמוכה',
      simpleSummary: `החיפוש מתייחס למשמעות ״${sense.definition}״ ב־${sense.language==='English'?'אנגלית':sense.language}.`,
      whatIsIt: `${sense.query} משמשת כאן כ${sense.partOfSpeech} במשמעות ״${sense.definition}״.`,
      meaning: sense.definition,
      originStory: origin,
      path: [sense.query],
      changes: 'שלבים היסטוריים יוצגו רק אם המקור מקשר אותם מפורשות למשמעות שנבחרה.',
      certainty: hasEtymology ? 'נמצא סעיף אטימולוגי במקור מילוני אחד; רצויה הצלבה.' : 'נמצאה המשמעות, אך לא נמצא מקור אטימולוגי מספיק.',
      plainLanguage: `בקיצור: בחרת במשמעות ״${sense.definition}״, והמחקר מוגבל כעת למשמעות הזאת.`,
      sources: [{ name: `${sense.sourceName} — ${sense.title}`, url: sense.url }]
    };
  }

  window.LexicalSenseResolver = { discover, buildResult, parsePage };
})();
