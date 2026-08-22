(() => {
  const form = document.getElementById('searchForm');
  const input = document.getElementById('query');
  if (!form || !input || typeof CURATED === 'undefined' || typeof renderResult !== 'function') return;

  form.addEventListener('submit', (event) => {
    const query = input.value.trim();
    const curated = CURATED[query.toLowerCase()] || CURATED[query];
    if (!curated) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    renderResult({
      ...curated,
      query,
      confidence: 'high',
      confidenceLabel: 'רמת ודאות: טובה',
      simpleSummary: `זהו ערך שנבדק ידנית. מצאנו מידע אטימולוגי מפורט על „${curated.title}”, כולל משמעות, שרשרת היסטורית ומקורות.`,
      whatIsIt: curated.subtitle
    });
    document.getElementById('statusSection').hidden = true;
    const result = document.getElementById('resultSection');
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, true);
})();