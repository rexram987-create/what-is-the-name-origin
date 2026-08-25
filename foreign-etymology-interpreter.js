// Foreign etymology interpreter v1.0.0
// Enhances results when a foreign-language etymology section was found but the main UI
// could not safely present a Hebrew explanation. It extracts only explicit patterns.
(() => {
  const clean = value => String(value || '').replace(/\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim();
  const FALLBACK_MEANING = 'לא נמצאה עדיין משמעות אטימולוגית שניתן להציג בעברית בביטחון.';
  const cache = new Map();

  const LANGUAGE_HE = {
    Latin: 'לטינית', 'Ancient Greek': 'יוונית עתיקה', Greek: 'יוונית',
    English: 'אנגלית', French: 'צרפתית', 'Old French': 'צרפתית עתיקה',
    German: 'גרמנית', 'Old High German': 'גרמנית עילית עתיקה',
    Spanish: 'ספרדית', Portuguese: 'פורטוגזית', Italian: 'איטלקית',
    Arabic: 'ערבית', Persian: 'פרסית', Hebrew: 'עברית',
    Sanskrit: 'סנסקריט', Turkish: 'טורקית', 'Ottoman Turkish': 'טורקית עות׳מאנית',
    Russian: 'רוסית', Slavic: 'סלאבית', 'Old Norse': 'נורדית עתיקה',
    Celtic: 'קלטית', Gaulish: 'גאלית'
  };

  const GLOSS_HE = {
    city: 'עיר', town: 'עיירה / עיר', village: 'כפר', river: 'נהר', mountain: 'הר',
    new: 'חדש', old: 'ישן / עתיק', north: 'צפון', south: 'דרום', east: 'מזרח', west: 'מערב',
    white: 'לבן', black: 'שחור', red: 'אדום', green: 'ירוק', blue: 'כחול',
    king: 'מלך', queen: 'מלכה', saint: 'קדוש/ה', peace: 'שלום', victory: 'ניצחון',
    good: 'טוב', air: 'אוויר', water: 'מים', sea: 'ים', island: 'אי', fort: 'מבצר',
    bridge: 'גשר', field: 'שדה', forest: 'יער', stone: 'אבן', gold: 'זהב',
    people: 'עם / אנשים', land: 'ארץ', country: 'ארץ / מדינה', place: 'מקום',
    constant: 'יציב / קבוע', 'city of constantine': 'עירו של קונסטנטינוס'
  };

  async function json(url) {
    const key = String(url);
    if (cache.has(key)) return cache.get(key);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      cache.set(key, data);
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  function translateGloss(value = '') {
    const raw = clean(value).replace(/[“”"'‘’]/g, '').replace(/[.;:,]+$/, '').trim();
    const lower = raw.toLowerCase();
    if (GLOSS_HE[lower]) return GLOSS_HE[lower];
    const tokens = lower.split(/\s+/).filter(Boolean);
    if (tokens.length && tokens.length <= 4 && tokens.every(token => GLOSS_HE[token])) {
      return tokens.map(token => GLOSS_HE[token]).join(' ');
    }
    if (/city of constantine/i.test(raw)) return 'עירו של קונסטנטינוס';
    if (/named after .*constantine/i.test(raw)) return 'נקרא על שם קונסטנטינוס';
    return '';
  }

  function stripHtml(html = '') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('table,style,script,sup.reference,.mw-editsection,.navbox,.infobox').forEach(el => el.remove());
    return clean(doc.body.textContent || '');
  }

  async function etymologySection(title) {
    const base = 'https://en.wikipedia.org/w/api.php';
    const sections = new URL(base);
    sections.searchParams.set('action', 'parse');
    sections.searchParams.set('page', title);
    sections.searchParams.set('prop', 'sections');
    sections.searchParams.set('redirects', '1');
    sections.searchParams.set('format', 'json');
    sections.searchParams.set('origin', '*');
    const data = await json(sections);
    const patterns = [/etymolog/i, /name.*origin/i, /origin.*name/i, /toponym/i, /naming/i, /name/i];
    const hit = (data.parse?.sections || []).find(section => patterns.some(re => re.test((section.line || '').replace(/<[^>]+>/g, ''))));
    if (!hit) return null;

    const section = new URL(base);
    section.searchParams.set('action', 'parse');
    section.searchParams.set('page', title);
    section.searchParams.set('section', hit.index);
    section.searchParams.set('prop', 'text');
    section.searchParams.set('redirects', '1');
    section.searchParams.set('format', 'json');
    section.searchParams.set('origin', '*');
    const parsed = await json(section);
    const html = parsed.parse?.text?.['*'] || '';
    return html ? { heading: hit.line || 'Etymology', text: stripHtml(html) } : null;
  }

  function extractEvidence(text = '') {
    const source = clean(text).slice(0, 12000);
    if (!source) return null;

    const namedAfter = source.match(/(?:was\s+)?named\s+(?:directly\s+)?after\s+(?:the\s+)?([^.;]{2,140})/i);
    if (namedAfter) {
      const target = clean(namedAfter[1]).replace(/\s+(?:who|which|where|and)\b.*$/i, '');
      if (target) return {
        kind: 'named-after',
        meaningHe: `השם ניתן על שם ${target}.`,
        originHe: `במקור האנגלי נאמר במפורש שהשם ניתן על שם ${target}.`,
        path: [target]
      };
    }

    const direct = source.match(/(?:derived|derives|comes|coming|originates|borrowed)\s+from\s+(?:the\s+)?(?:(Ancient Greek|Greek|Latin|Old French|French|German|Spanish|Portuguese|Italian|Arabic|Persian|Hebrew|Sanskrit|Turkish|Ottoman Turkish|Russian|Old Norse|Gaulish|Celtic)\s+)?(?:word\s+)?([\p{L}\p{M}À-ÿĀ-žΑ-ωΆ-ώא-תء-ي'’.-]{2,90})(?:\s*,|\s+),?\s*(?:meaning|meaning literally|which means|means)\s+[“"'‘’]?([^”"'‘’.;]{1,120})/iu);
    if (direct) {
      const lang = direct[1] || '';
      const form = clean(direct[2]);
      const gloss = clean(direct[3]);
      const glossHe = translateGloss(gloss);
      if (form && glossHe) {
        const langHe = LANGUAGE_HE[lang] || lang;
        return {
          kind: 'derived-from',
          meaningHe: `השם נגזר מ־${form}${langHe ? ` ב${langHe}` : ''}, שפירושו „${glossHe}”.`,
          originHe: `המקור האנגלי קושר את השם במפורש לצורה ${form}${langHe ? ` ב${langHe}` : ''} ומסביר את משמעותה כ„${glossHe}”.`,
          path: [`${form}${langHe ? ` — ${langHe}` : ''}`, `„${glossHe}”`]
        };
      }
    }

    const parenthetical = source.match(/(?:(Ancient Greek|Greek|Latin|Old French|French|German|Spanish|Italian|Arabic|Persian|Hebrew|Turkish|Ottoman Turkish|Russian)\s+)?([\p{L}\p{M}À-ÿĀ-žΑ-ωΆ-ώא-תء-ي'’.-]{2,90})\s*\([^)]*(?:meaning|means)?\s*[“"'‘’]([^”"'‘’]{1,100})[”"'‘’][^)]*\)/iu);
    if (parenthetical) {
      const lang = parenthetical[1] || '';
      const form = clean(parenthetical[2]);
      const glossHe = translateGloss(parenthetical[3]);
      if (form && glossHe) {
        const langHe = LANGUAGE_HE[lang] || lang;
        return {
          kind: 'parenthetical-gloss',
          meaningHe: `המקור מציג את הצורה ${form}${langHe ? ` ב${langHe}` : ''} במשמעות „${glossHe}”.`,
          originHe: `בסעיף האטימולוגי נמצא פירוש מפורש לצורה ${form}: „${glossHe}”.`,
          path: [`${form}${langHe ? ` — ${langHe}` : ''}`, `„${glossHe}”`]
        };
      }
    }

    const literal = source.match(/(?:literally|literal meaning(?: is)?|meaning)\s+[“"'‘’]([^”"'‘’]{2,100})[”"'‘’]/i);
    if (literal) {
      const glossHe = translateGloss(literal[1]);
      if (glossHe) return {
        kind: 'literal-meaning',
        meaningHe: `המשמעות המילולית המתועדת היא „${glossHe}”.`,
        originHe: `בסעיף האטימולוגי באנגלית מופיעה במפורש המשמעות המילולית „${glossHe}”.`,
        path: [`„${glossHe}”`]
      };
    }

    return null;
  }

  function needsEnhancement(result = {}) {
    const meaning = clean(result.meaning);
    const origin = clean(result.originStory);
    return meaning === FALLBACK_MEANING || /טקסט זר|איננו מציגים|אינו תרגום עברי|סעיף אטימולוגי מפורש.*אנגלית/i.test(origin);
  }

  async function enhance(result) {
    if (!needsEnhancement(result)) return null;
    const candidates = [result.title, result.subtitle]
      .map(clean)
      .filter(value => value && value.length < 160 && !/[֐-׿]/.test(value));

    // If the visible title is Hebrew, try to recover an English Wikipedia title from the sources.
    const sourceUrl = (result.sources || []).map(x => x?.url).find(url => /en\.wikipedia\.org\/wiki\//.test(url || ''));
    if (sourceUrl) {
      try {
        const decoded = decodeURIComponent(new URL(sourceUrl).pathname.replace(/^\/wiki\//, '')).replace(/_/g, ' ');
        if (decoded) candidates.unshift(decoded);
      } catch {}
    }

    for (const title of [...new Set(candidates)]) {
      try {
        const section = await etymologySection(title);
        const evidence = extractEvidence(section?.text || '');
        if (!evidence) continue;
        return {
          ...result,
          meaning: evidence.meaningHe,
          originStory: evidence.originHe,
          path: evidence.path?.length ? evidence.path : result.path,
          confidence: result.confidence === 'low' ? 'medium' : result.confidence,
          confidenceLabel: result.confidence === 'low' ? 'רמת ודאות: חלקית' : (result.confidenceLabel || 'רמת ודאות: חלקית'),
          certainty: `נמצא ניסוח אטימולוגי מפורש בסעיף באנגלית והמערכת חילצה ממנו רק את הקשר והמשמעות שנכתבו במפורש. ${result.certainty || ''}`.trim(),
          plainLanguage: evidence.meaningHe,
          _foreignEtymologyEnhanced: true
        };
      } catch (error) {
        window.NameOriginDiagnostics?.warn?.('foreign-etymology.error', { title, error: error?.message || String(error) });
      }
    }
    return null;
  }

  function install() {
    const original = window.renderResult;
    if (typeof original !== 'function' || original.__foreignEtymologyWrapped) return;

    function wrapped(result) {
      original(result);
      if (!needsEnhancement(result)) return;
      enhance(result).then(enhanced => {
        if (!enhanced) return;
        original(enhanced);
        window.NameOriginDiagnostics?.ok?.('foreign-etymology.enhanced', {
          title: enhanced.title,
          meaning: enhanced.meaning
        });
      }).catch(() => {});
    }
    wrapped.__foreignEtymologyWrapped = true;
    window.renderResult = wrapped;
  }

  window.ForeignEtymologyInterpreter = { enhance, extractEvidence, translateGloss };
  install();
  window.addEventListener('DOMContentLoaded', install);
})();
