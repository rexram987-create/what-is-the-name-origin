// v0.7.0 — generic hook: applies to every given-name choice, not named exceptions.
(() => {
  const original = window.runSearch;
  if (typeof original !== 'function' || !window.GivenNameEtymology) return;
  window.runSearch = async function(query, context) {
    if (context?.kind === 'given-name') {
      try {
        if (typeof setStatus === 'function') setStatus(`מחפשים את האטימולוגיה של השם הפרטי „${query}” במקורות לשוניים…`);
        const result = await window.GivenNameEtymology.build(query);
        if (result) {
          renderResult(result);
          statusSection.hidden = true;
          resultSection.hidden = false;
          resultSection.scrollIntoView({behavior:'smooth',block:'start'});
          return;
        }
      } catch (e) { console.warn('Given-name engine fallback', e); }
    }
    return original(query, context);
  };
})();