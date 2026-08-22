// Context resolver v0.5.2
// Resolves a user's explicit meaning choice to a concrete Wikidata entity BEFORE the generic safety controller runs.
(() => {
  const form = document.getElementById('searchForm');
  const input = document.getElementById('query');
  const statusSection = document.getElementById('statusSection');
  const status = document.getElementById('status');
  if (!form || !input) return;

  let resolving = false;
  let bypassOnce = false;

  const api = async (url) => {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  };

  const norm = (s='') => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

  function hintFor(ctx, query) {
    const parts = [ctx.canonicalName || query];
    if (ctx.kind === 'given-name') parts.push('given name');
    if (ctx.kind === 'surname') parts.push('surname');
    if (ctx.kind === 'city') parts.push('city');
    if (ctx.kind === 'country') parts.push('country');
    if (ctx.region) parts.push(ctx.region);
    if (ctx.country) parts.push(ctx.country);
    return parts.filter(Boolean).join(' ');
  }

  async function search(query, lang) {
    const u = new URL('https://www.wikidata.org/w/api.php');
    u.searchParams.set('action','wbsearchentities');
    u.searchParams.set('search',query);
    u.searchParams.set('language',lang);
    u.searchParams.set('uselang','en');
    u.searchParams.set('format','json');
    u.searchParams.set('origin','*');
    u.searchParams.set('limit','15');
    return (await api(u)).search || [];
  }

  function score(x, ctx, canonical) {
    const label = norm(x.label || '');
    const desc = norm(x.description || '');
    const name = norm(canonical || '');
    let s = label === name ? 50 : (label.includes(name) || name.includes(label) ? 20 : 0);
    if (ctx.kind === 'city') {
      if (/city|capital|municipality|town/.test(desc)) s += 35;
      if (/given name|surname|song|observatory|region/.test(desc)) s -= 45;
    }
    if (ctx.kind === 'given-name') {
      if (/given name|first name|forename/.test(desc)) s += 35;
      if (/city|capital|region|observatory|song/.test(desc)) s -= 35;
    }
    if (ctx.kind === 'surname') {
      if (/surname|family name/.test(desc)) s += 35;
      if (/city|capital|given name/.test(desc)) s -= 30;
    }
    if (ctx.country && desc.includes(norm(ctx.country))) s += 30;
    if (ctx.region && desc.includes(norm(ctx.region))) s += 30;
    return s;
  }

  async function resolve(ctx, query) {
    const canonical = ctx.canonicalName || query;
    const hint = hintFor(ctx, query);
    const searches = await Promise.allSettled([
      search(hint, 'en'),
      search(canonical, 'en'),
      search(canonical, 'he')
    ]);
    const all = searches.flatMap(x => x.status === 'fulfilled' ? x.value : []);
    const unique = [...new Map(all.map(x => [x.id, x])).values()];
    const ranked = unique.map(x => ({ ...x, _ctxScore: score(x, ctx, canonical) })).sort((a,b) => b._ctxScore - a._ctxScore);
    const best = ranked[0];
    const second = ranked[1];
    if (!best || best._ctxScore < 45) return null;
    if (second && best._ctxScore - second._ctxScore < 8 && best._ctxScore < 85) return null;
    return best;
  }

  form.addEventListener('submit', async (event) => {
    if (bypassOnce) { bypassOnce = false; return; }
    const ctx = window.NAME_ORIGIN_CONTEXT;
    if (!ctx || ctx.qid || resolving) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    resolving = true;
    if (status && statusSection) {
      status.textContent = `מזהים במדויק את „${ctx.original || input.value}” לפי ההקשר שבחרתם…`;
      statusSection.hidden = false;
    }

    try {
      const best = await resolve(ctx, input.value.trim());
      if (best) {
        window.NAME_ORIGIN_CONTEXT = {
          ...ctx,
          qid: best.id,
          canonicalName: best.label || ctx.canonicalName || input.value.trim(),
          selectedDescription: best.description || ''
        };
      } else {
        // Keep the context. The next safety layer may ask, but it must not silently choose a mismatched type.
        window.NAME_ORIGIN_CONTEXT = { ...ctx, resolutionFailed: true };
      }
    } catch (e) {
      console.warn('Context resolution failed', e);
      window.NAME_ORIGIN_CONTEXT = { ...ctx, resolutionFailed: true };
    } finally {
      resolving = false;
      bypassOnce = true;
      form.requestSubmit();
    }
  }, true);
})();
