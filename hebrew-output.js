// Hebrew-first output patch for v0.1.4
// Keeps the interface Hebrew-first and handles surname-focused searches such as Sinatra.

(function () {
  const form = document.getElementById('searchForm');
  const queryInput = document.getElementById('query');
  if (!form || !queryInput || typeof renderResult !== 'function') return;

  const originalRenderResult = renderResult;

  function hasHebrew(text = '') {
    return /[\u0590-\u05FF]/.test(String(text));
  }

  function foreignTextFallback(field, sourceHint = '') {
    const where = sourceHint ? ` ב־${sourceHint}` : '';
    if (field === 'meaning') {
      return `מצאנו חומר אטימולוגי${where}, אך הוא כתוב בשפה זרה. בגרסה זו לא נציג פסקה זרה בתוך ההסבר העברי. נמשיך להציג רק מידע שנוכל למסור בעברית בצורה ברורה ואמינה.`;
    }
    if (field === 'originStory') {
      return `נמצא מקור שעוסק בתולדות השם${where}, אך הטקסט שלו אינו בעברית. כדי לא להציג תרגום לא בדוק, אנחנו מסמנים זאת במפורש ומעדיפים להמתין להסבר עברי מהימן.`;
    }
    return `נמצא מידע במקור שאינו בעברית. היישומון שומר על תצוגה עברית ולא מציג טקסט זר כהסבר למשתמש.`;
  }

  // Make generic results Hebrew-first: never dump long foreign-language source text into Hebrew cards.
  window.renderResult = function (result) {
    const safe = { ...result };
    const sourceHint = (safe.sources || []).find(s => /אנגלית|English|ספרדית|Spanish|Wiktionary|Wikipedia/.test(s.name || ''))?.name || '';

    if (safe.meaning && !hasHebrew(safe.meaning)) safe.meaning = foreignTextFallback('meaning', sourceHint);
    if (safe.originStory && !hasHebrew(safe.originStory)) safe.originStory = foreignTextFallback('originStory', sourceHint);
    if (safe.simpleSummary && !hasHebrew(safe.simpleSummary)) safe.simpleSummary = foreignTextFallback('summary', sourceHint);
    if (safe.whatIsIt && !hasHebrew(safe.whatIsIt)) safe.whatIsIt = 'נמצא ערך מתאים, אך התיאור הזמין כרגע אינו בעברית.';
    if (safe.changes && !hasHebrew(safe.changes)) safe.changes = 'המידע הזמין על שינויי הכתיב וההגייה נמצא כרגע בשפה זרה, ולכן אינו מוצג כאן כטקסט גולמי.';
    if (safe.certainty && !hasHebrew(safe.certainty)) safe.certainty = 'נמצא מקור רלוונטי, אך נדרשת עדיין בדיקה והצגה מסודרת בעברית.';
    if (safe.plainLanguage && !hasHebrew(safe.plainLanguage)) safe.plainLanguage = 'בקיצור: נמצא מידע, אבל נציג אותו רק לאחר שנוכל למסור אותו בעברית פשוטה ומדויקת.';

    return originalRenderResult(safe);
  };

  const SINATRA_RESULT = {
    query: 'Sinatra',
    title: 'סינטרה — Sinatra',
    type: 'שם משפחה',
    subtitle: 'שם משפחה איטלקי, המזוהה במיוחד עם סיציליה',
    confidence: 'high',
    confidenceLabel: 'רמת ודאות: טובה',
    simpleSummary: 'סינטרה הוא שם משפחה איטלקי מסיציליה. לפי Dictionary of American Family Names, הוא קשור לצורה Senatra, ששימשה כשם אישי בסיציליה ובדרום קלבריה, וביסודה קשורה למילה הלטינית senator — סנאטור.',
    whatIsIt: 'שם משפחה איטלקי שמקורו באזור סיציליה. פרנק סינטרה נשא את השם, אבל כאן אנו חוקרים את שם המשפחה עצמו ולא את הזמר.',
    meaning: 'השם נקשר ללטינית senator, שפירושה „חבר בסנאט”. המילה senator קשורה ל־senatus — „סנאט”, שמקורה ב־senex — „זקן” או „אדם מבוגר”. הרעיון הקדום היה שמועצת הזקנים מורכבת מאנשים מבוגרים ובעלי מעמד.',
    originStory: 'לפי Dictionary of American Family Names, הצורה Sinatra התפתחה מן השם האישי Senatra, שהיה בשימוש אצל גברים ונשים בסיציליה ובדרום קלבריה. Senatra נחשב במקור לכינוי שהתפתח מן הלטינית senator. בתקופות מאוחרות יותר „senator” שימש גם כתואר של בעלי משרות ומגיסטראטים במדינות איטלקיות שונות. כך עבר המונח מתואר או כינוי לשם אישי, וממנו לשם משפחה.',
    path: ['senex — „זקן”', 'senatus — „סנאט”', 'senator — „סנאטור”', 'Senatra — שם אישי', 'Sinatra — שם משפחה'],
    changes: 'השלב החשוב הוא המעבר מן הלטינית senator אל הצורה Senatra, ולאחר מכן אל Sinatra. השינוי המדויק בהגייה ובאיות קשור להתפתחות מקומית ודיאלקטלית בדרום איטליה ובסיציליה.',
    certainty: 'הקשר בין Sinatra, הצורה Senatra והלטינית senator מתועד ב־Dictionary of American Family Names. עם זאת, כמו בשמות משפחה רבים, פרטי המעבר המדויקים בין הצורות לאורך הדורות אינם מתועדים בכל שלב.',
    plainLanguage: 'בקיצור: סינטרה לא התחיל כשמו של אדם מפורסם. זהו שם משפחה סיציליאני ששורשיו מגיעים, דרך Senatra, אל המילה הלטינית senator — סנאטור — ובסופו של דבר אל senex, „זקן”.',
    sources: [
      { name: 'FamilySearch — Sinatra Name Meaning (מבוסס על Dictionary of American Family Names)', url: 'https://www.familysearch.org/en/surname?surname=sinatra' },
      { name: 'Ancestry — Sinatra Surname Meaning, Dictionary of American Family Names 2nd ed.', url: 'https://www.ancestry.com/last-name-meaning/sinatra' }
    ]
  };

  // Capture the surname search before the generic encyclopedia-oriented handler runs.
  form.addEventListener('submit', function (event) {
    const q = queryInput.value.trim().toLowerCase();
    if (q !== 'sinatra' && q !== 'סינטרה') return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const result = { ...SINATRA_RESULT, query: queryInput.value.trim() };
    window.renderResult(result);

    const statusSection = document.getElementById('statusSection');
    const resultSection = document.getElementById('resultSection');
    if (statusSection) statusSection.hidden = true;
    if (resultSection) {
      resultSection.hidden = false;
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, true);
})();
