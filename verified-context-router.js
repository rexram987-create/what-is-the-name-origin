// Verified Context Router v1.1.0
// Prevents a verified historical/alias QID from being discarded by a second free-text discovery pass.
(() => {
  const clean = value => String(value || '').trim();

  function getRunner() {
    try {
      if (typeof runSearch === 'function') return runSearch;
    } catch {}
    if (typeof window.runSearch === 'function') return window.runSearch;
    return null;
  }

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

      const runner = getRunner();
      if (!runner) {
        // Safe fallback: use the already verified canonical label rather than rediscovering the ambiguous alias.
        // Do not lock a new QID here; the normal engine can resolve the canonical name with far less ambiguity.
        const canonical = clean(ctx.canonicalName);
        if (canonical && canonical !== raw) {
          input.value = canonical;
          window.NameOriginDiagnostics?.warn?.('verified-context.canonical-fallback', {
            original: raw,
            canonical,
            qid: ctx.qid
          });
        }
        return;
      }

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

      Promise.resolve(runner(raw, entityContext)).catch(error => {
        console.error('Verified context routing failed', error);
      });
    }, true);
  }

  window.VerifiedContextRouter = { install, getRunner };
  install();
  window.addEventListener('DOMContentLoaded', install);
})();