// Verified Context Router v1.0.0
// Prevents a verified historical/alias QID from being discarded by a second free-text discovery pass.
(() => {
  const clean = value => String(value || '').trim();

  function install() {
    const form = document.getElementById('searchForm');
    const input = document.getElementById('query');
    if (!form || !input || form.dataset.verifiedContextRouterInstalled === '1') return;
    form.dataset.verifiedContextRouterInstalled = '1';

    form.addEventListener('submit', event => {
      const ctx = window.NAME_ORIGIN_CONTEXT;
      if (!ctx?.identityVerified || !ctx?.qid) return;

      const raw = clean(input.value);
      const expected = clean(ctx.historicalInput || ctx.originalQuery || raw);
      if (expected && raw !== expected) return;
      if (typeof window.runSearch !== 'function') return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const item = {
        id: ctx.qid,
        label: ctx.canonicalName || raw,
        description: ctx.selectedDescription || ctx.label || ''
      };

      const entityContext = {
        ...ctx,
        kind: 'entity',
        item,
        label: ctx.selectedDescription || ctx.label || 'ישות שאומתה לפי שם היסטורי/חלופי'
      };

      window.NameOriginDiagnostics?.ok?.('verified-context.direct-route', {
        input: raw,
        qid: ctx.qid,
        canonicalName: ctx.canonicalName || ''
      });

      Promise.resolve(window.runSearch(raw, entityContext)).catch(error => {
        console.error('Verified context routing failed', error);
      });
    }, true);
  }

  window.VerifiedContextRouter = { install };
  install();
  window.addEventListener('DOMContentLoaded', install);
})();