// Historical place-name resolver v1.1.0
// Resolves reviewed historical names first, then tries a conservative automatic Wikidata alias route.
(() => {
  const normalize = (value = '') => String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f\u0591-\u05C7]/g, '')
    .replace(/[׳״'"`’‘]/g, '')
    .replace(/[-–—_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const families = [];
  const aliasIndex = new Map();
  const autoCache = new Map();

  function registerFamily(family) {
    if (!family?.id || !family?.result || !Array.isArray(family.aliases)) return;
    families.push(family);
    for (const alias of family.aliases) {
      const key = normalize(alias);
      if (key) aliasIndex.set(key, family);
    }
  }

  registerFamily({
    id: 'istanbul-historical-names',
    canonical: 'איסטנבול',
    aliases: [
      'קונסטנטינופול', 'קונסטנטינופוליס', 'Constantinople', 'Constantinopolis',
      'Κωνσταντινούπολις', 'קושטא', 'קוסטא', 'קושטנדינא', 'קושטאנדינא',
      'קושטנטינא', 'קושטאנטינא', 'קושטנטינה', 'קושטאנטינה',
      'Kostantiniyye', 'Kostantiniye', 'قسطنطینیه'
    ],
    result: {
      title: 'קונסטנטינופול / קושטא',
      type: 'מקום / שם היסטורי',
      subtitle: 'שמות היסטוריים של איסטנבול',
      confidence: 'high',
      confidenceLabel: 'רמת ודאות: גבוהה',
      simpleSummary: '„קונסטנטינופול” פירושו „עירו של קונסטנטינוס”. „קושטא” היא צורה עברית מסורתית של שם העיר, שהתפתחה מצורות דוגמת קושטנדינא / קושטנטינה.',
      whatIsIt: 'אלה שמות היסטוריים של העיר הנקראת כיום איסטנבול. העיר נודעה בעת העתיקה כביזנטיון; בשנת 330 לספירה נעשתה בירתו החדשה של קונסטנטינוס הגדול ונקשרה בשמו.',
      meaning: 'היוונית Κωνσταντινούπολις (Kōnstantinoúpolis) מורכבת משמו של קונסטנטינוס ומ־πόλις (polis), „עיר”: כלומר „עירו של קונסטנטינוס”. הצורה העברית „קושטא” אינה פירוק חדש של השם, אלא שם מסורתי מקוצר שהתפתח מצורות עבריות ארוכות יותר של קונסטנטינופול.',
      originStory: 'לאחר שקונסטנטינוס הגדול הרחיב את ביזנטיון והקדיש אותה כבירתו בשנת 330, העיר נקשרה בשמו ונודעה כ־Κωνσταντινούπολις — „עירו של קונסטנטינוס”. בעולם הערבי והעות׳מאני התקיימו צורות מקבילות כגון al-Qusṭanṭīniyya ו־Kostantiniyye. במקורות ובדפוסים עבריים הופיעו צורות כמו „קושטנדינא” ו„קושטנטינה”, ובהמשך התקצר השם ל„קושטא”. בעברית החדשה השם „איסטנבול” החליף בהדרגה את „קושטא” כשמה הרגיל של העיר.',
      path: [
        'Βυζάντιον / Byzantion — ביזנטיון',
        'Κωνσταντινούπολις — „עירו של קונסטנטינוס”',
        'al-Qusṭanṭīniyya / Kostantiniyye — צורות ערביות־עות׳מאניות',
        'קושטנדינא / קושטנטינה — צורות עבריות היסטוריות',
        'קושטא — הצורה העברית המקוצרת',
        'İstanbul — איסטנבול'
      ],
      changes: 'חשוב להבחין בין שינוי שם רשמי לבין קיום מקביל של שמות בשפות שונות. „קונסטנטינופול”, „Kostantiniyye”, „קושטא” ו„איסטנבול” שימשו בתקופות ובקהילות שונות, ולעיתים במקביל. בעברית „קושטא” נוצרה כצורה מסורתית מקוצרת של שמות ארוכים יותר הקשורים לקונסטנטינופול.',
      certainty: 'המשמעות „עירו של קונסטנטינוס” והקשר בין Constantinople לבין Constantine מתועדים היטב. גם השימוש העברי ב„קושטא” ובצורות כגון „קושטנדינא” מתועד. המסלול המדויק בין כל וריאנט עברי לבין לשונות הביניים אינו תמיד ניתן לשחזור אות־אחר־אות, ולכן אין להציג כל שינוי כתעתיק ישיר ודאי.',
      plainLanguage: 'בקיצור: קונסטנטינופול היא „העיר של קונסטנטינוס”. יהודים דוברי עברית השתמשו במשך דורות בצורות כמו קושטנדינא, ומכאן התקבע הקיצור קושטא. כיום העיר נקראת איסטנבול.',
      sources: [
        { name: 'אוניברסיטת בר־אילן — „התחלפות שם מקום... מקושטא לאיסטנבול”', url: 'https://cris.biu.ac.il/en/publications/%D7%94%D7%AA%D7%97%D7%9C%D7%A4%D7%95%D7%AA-%D7%A9%D7%9D-%D7%9E%D7%A7%D7%95%D7%9D-%D7%91%D7%A8%D7%90%D7%99-%D7%97%D7%A7%D7%A8-%D7%94%D7%AA%D7%A8%D7%92%D7%95%D7%9D-%D7%9E%D7%A7%D7%95%D7%A9%D7%98%D7%90-%D7%9C%D7%90%D7%99%D7%A1%D7%98%D7%A0%D7%91%D7%95%D7%9C/' },
        { name: 'Wiktionary — Ottoman Turkish Kostantiniyye', url: 'https://en.wiktionary.org/wiki/%D9%82%D8%B3%D8%B7%D9%86%D8%B7%DB%8C%D9%86%DB%8C%D9%87' },
        { name: 'Wikipedia — Constantinople: names of the city', url: 'https://en.wikipedia.org/wiki/Constantinople' }
      ]
    }
  });

  function resolve(query) {
    const family = aliasIndex.get(normalize(query));
    if (!family) return null;
    return {
      familyId: family.id,
      canonical: family.canonical,
      matched: query,
      result: { ...family.result, title: String(query).trim() || family.result.title }
    };
  }

  async function json(url) {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function searchWikidata(query, language) {
    const url = new URL('https://www.wikidata.org/w/api.php');
    url.searchParams.set('action', 'wbsearchentities');
    url.searchParams.set('search', query);
    url.searchParams.set('language', language);
    url.searchParams.set('uselang', 'he');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');
    url.searchParams.set('limit', '8');
    return (await json(url)).search || [];
  }

  function looksLikePlace(description = '') {
    return /city|town|capital|municipality|settlement|country|state|province|region|island|river|mountain|עיר|בירה|יישוב|מדינה|מחוז|אי|נהר|הר/i.test(description);
  }

  function looksHistorical(description = '') {
    return /former|historical|old name|former name|previous name|ancient|medieval|renamed|historic|לשעבר|היסטורי|שם קודם|שם ישן|עתיק/i.test(description);
  }

  function scoreAuto(item, query) {
    const q = normalize(query);
    const label = normalize(item.label || '');
    const desc = item.description || '';
    let score = label === q ? 50 : (label.includes(q) || q.includes(label) ? 20 : 0);
    if (looksLikePlace(desc)) score += 25;
    if (looksHistorical(desc)) score += 18;
    if (/human|person|song|album|film|surname|given name|אדם|שיר|אלבום|סרט|שם משפחה|שם פרטי/i.test(desc)) score -= 45;
    return score;
  }

  async function getEntity(id) {
    const url = new URL('https://www.wikidata.org/w/api.php');
    url.searchParams.set('action', 'wbgetentities');
    url.searchParams.set('ids', id);
    url.searchParams.set('props', 'labels|descriptions|aliases|sitelinks');
    url.searchParams.set('languages', 'he|en');
    url.searchParams.set('sitefilter', 'hewiki|enwiki');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');
    return (await json(url)).entities?.[id] || null;
  }

  function entityAliases(entity) {
    return [
      ...(entity?.aliases?.he || []).map(x => x.value),
      ...(entity?.aliases?.en || []).map(x => x.value)
    ].filter(Boolean);
  }

  async function resolveAuto(query) {
    const key = normalize(query);
    if (!key || key.length < 3) return null;
    if (autoCache.has(key)) return autoCache.get(key);

    try {
      const searches = await Promise.allSettled([
        searchWikidata(query, 'he'),
        searchWikidata(query, 'en')
      ]);
      const merged = [...new Map(searches.flatMap(r => r.status === 'fulfilled' ? r.value : []).map(x => [x.id, x])).values()];
      const ranked = merged.map(item => ({ item, score: scoreAuto(item, query) })).sort((a, b) => b.score - a.score);
      const best = ranked[0];
      if (!best || best.score < 45) { autoCache.set(key, null); return null; }

      const entity = await getEntity(best.item.id);
      if (!entity) { autoCache.set(key, null); return null; }

      const aliases = entityAliases(entity).map(normalize);
      const heLabel = entity.labels?.he?.value || '';
      const enLabel = entity.labels?.en?.value || best.item.label || query;
      const canonical = heLabel || enLabel;
      const canonicalKey = normalize(canonical);
      const matchedAsAlias = aliases.includes(key);
      const labelDiffers = canonicalKey && canonicalKey !== key;
      const historicalHint = looksHistorical(best.item.description || '') || looksHistorical(entity.descriptions?.en?.value || '') || looksHistorical(entity.descriptions?.he?.value || '');

      // Conservative gate: only intercept if Wikidata itself treats the query as an alias/alternate label,
      // or if the search result explicitly looks historical and points to a differently named place.
      if (!matchedAsAlias && !(historicalHint && labelDiffers)) {
        autoCache.set(key, null);
        return null;
      }

      const result = {
        mode: 'auto',
        matched: query,
        canonical,
        item: {
          id: best.item.id,
          label: canonical,
          description: entity.descriptions?.he?.value || entity.descriptions?.en?.value || best.item.description || ''
        }
      };
      autoCache.set(key, result);
      return result;
    } catch (error) {
      console.warn('Historical auto resolution failed', error);
      autoCache.set(key, null);
      return null;
    }
  }

  function renderHistorical(match) {
    const statusSection = document.getElementById('statusSection');
    const resultSection = document.getElementById('resultSection');
    if (typeof window.renderResult !== 'function') return false;
    window.renderResult(match.result);
    if (statusSection) statusSection.hidden = true;
    if (resultSection) {
      resultSection.hidden = false;
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    window.NameOriginDiagnostics?.ok?.('historical.resolved', {
      input: match.matched,
      familyId: match.familyId,
      canonical: match.canonical
    });
    return true;
  }

  async function installSubmitInterceptor() {
    const form = document.getElementById('searchForm');
    const input = document.getElementById('query');
    if (!form || !input || form.dataset.historicalResolverInstalled === '1') return;
    form.dataset.historicalResolverInstalled = '1';

    form.addEventListener('submit', async event => {
      const raw = input.value.trim();
      const reviewed = resolve(raw);
      if (reviewed) {
        event.preventDefault();
        event.stopImmediatePropagation();
        renderHistorical(reviewed);
        return;
      }

      // Try the automatic historical-alias route before generic meaning discovery.
      event.preventDefault();
      event.stopImmediatePropagation();
      const statusSection = document.getElementById('statusSection');
      const status = document.getElementById('status');
      if (status && statusSection) {
        status.textContent = `בודקים אם „${raw}” הוא שם היסטורי או חלופי…`;
        statusSection.hidden = false;
      }

      const auto = await resolveAuto(raw);
      if (auto && typeof window.buildFromEntity === 'function') {
        window.NameOriginDiagnostics?.ok?.('historical.auto_resolved', {
          input: raw,
          canonical: auto.canonical,
          qid: auto.item.id
        });
        await window.buildFromEntity(raw, { kind: 'entity', item: auto.item, historicalAlias: true, canonicalName: auto.canonical }, auto.item);
        return;
      }

      // No historical match: hand control back to the normal app without looping through this interceptor.
      form.dataset.historicalBypass = '1';
      form.requestSubmit();
    }, true);

    form.addEventListener('submit', event => {
      if (form.dataset.historicalBypass === '1') {
        delete form.dataset.historicalBypass;
        return;
      }
    }, true);
  }

  window.HistoricalNameResolver = {
    normalize,
    resolve,
    resolveAuto,
    registerFamily,
    families
  };

  installSubmitInterceptor();
  window.addEventListener('DOMContentLoaded', installSubmitInterceptor);
})();