// Generic canonical-name bridge v0.7.4
// If a given name is entered in Hebrew/Arabic/Cyrillic/etc., resolve the same
// Wikidata entity and pass its English label to the linguistic name engine.
(() => {
  if (!window.GivenNameEtymology?.build) return;

  const originalBuild = window.GivenNameEtymology.build.bind(window.GivenNameEtymology);
  const hasLatin = value => /[A-Za-z]/.test(String(value || ''));

  async function fetchJson(url) {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function resolveCanonicalName(input) {
    const raw = String(input || '').trim();
    if (!raw || hasLatin(raw)) return raw;

    // 1) Search Wikidata in the language/script the user typed.
    const searchUrl = new URL('https://www.wikidata.org/w/api.php');
    searchUrl.searchParams.set('action', 'wbsearchentities');
    searchUrl.searchParams.set('search', raw);
    searchUrl.searchParams.set('language', 'he');
    searchUrl.searchParams.set('uselang', 'he');
    searchUrl.searchParams.set('format', 'json');
    searchUrl.searchParams.set('origin', '*');
    searchUrl.searchParams.set('limit', '12');
    const search = (await fetchJson(searchUrl)).search || [];

    // Prefer entries explicitly described as a given name.
    const nameLike = search.find(item => /שם פרטי|שם נשי|שם גברי|given name|first name|forename/i.test(item.description || '')) || search[0];
    if (!nameLike?.id) return raw;

    // 2) Ask Wikidata for the English label of that exact same entity.
    const entityUrl = new URL('https://www.wikidata.org/w/api.php');
    entityUrl.searchParams.set('action', 'wbgetentities');
    entityUrl.searchParams.set('ids', nameLike.id);
    entityUrl.searchParams.set('props', 'labels|descriptions');
    entityUrl.searchParams.set('languages', 'en|he');
    entityUrl.searchParams.set('format', 'json');
    entityUrl.searchParams.set('origin', '*');
    const entity = (await fetchJson(entityUrl)).entities?.[nameLike.id];
    const english = entity?.labels?.en?.value?.trim();
    return english || raw;
  }

  async function build(input) {
    let canonical = String(input || '').trim();
    try {
      canonical = await resolveCanonicalName(canonical);
    } catch (error) {
      console.warn('Canonical given-name resolution failed; using original spelling.', error);
    }

    // Try canonical label first. If no linguistic evidence is found, fall back to
    // the user's spelling so Latin-script names and unusual cases still work.
    let result = await originalBuild(canonical);
    if (!result && canonical !== input) result = await originalBuild(input);
    if (result && canonical !== input) {
      result.title = String(input || result.title);
      result.whatIsIt = `${input} הוא שם פרטי. לצורך החיפוש הלשוני זוהתה הצורה הבינלאומית ${canonical}.`;
      result.path = (result.path || []).map((step, index, arr) => index === arr.length - 1 ? `${input} / ${canonical} — שם פרטי` : step);
    }
    return result;
  }

  window.GivenNameEtymology.build = build;
  window.GivenNameEtymology.resolveCanonicalName = resolveCanonicalName;
})();
