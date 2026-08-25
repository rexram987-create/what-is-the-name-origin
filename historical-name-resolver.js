// Historical place-name resolver v1.0.0
// Intercepts reviewed historical/variant place names before generic entity discovery.
// The registry is intentionally data-driven so additional historical-name families can be added safely.
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

  function installSubmitInterceptor() {
    const form = document.getElementById('searchForm');
    const input = document.getElementById('query');
    if (!form || !input || form.dataset.historicalResolverInstalled === '1') return;
    form.dataset.historicalResolverInstalled = '1';

    form.addEventListener('submit', event => {
      const match = resolve(input.value.trim());
      if (!match) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      renderHistorical(match);
    }, true);
  }

  window.HistoricalNameResolver = {
    normalize,
    resolve,
    registerFamily,
    families
  };

  installSubmitInterceptor();
  window.addEventListener('DOMContentLoaded', installSubmitInterceptor);
})();
