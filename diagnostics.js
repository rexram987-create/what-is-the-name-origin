// Diagnostics v0.8.0 — lightweight, user-visible tracing for the etymology pipeline.
(() => {
  const events = [];
  let currentSearch = null;

  function now() { return new Date().toISOString(); }
  function cleanDetail(detail) {
    if (detail == null) return '';
    if (detail instanceof Error) return detail.message || String(detail);
    if (typeof detail === 'string') return detail.slice(0, 600);
    try { return JSON.stringify(detail).slice(0, 900); } catch { return String(detail).slice(0, 600); }
  }

  function push(stage, status = 'info', detail = '') {
    const row = { time: now(), search: currentSearch, stage, status, detail: cleanDetail(detail) };
    events.push(row);
    if (events.length > 250) events.shift();
    if (status === 'error') showPanel();
    render();
    return row;
  }

  function start(search) {
    currentSearch = String(search || '').trim();
    push('search.start', 'info', currentSearch);
  }

  function end(detail = '') { push('search.end', 'ok', detail); }
  function fail(stage, detail = '') { push(stage, 'error', detail); }
  function warn(stage, detail = '') { push(stage, 'warn', detail); }
  function ok(stage, detail = '') { push(stage, 'ok', detail); }

  function ensurePanel() {
    let panel = document.getElementById('diagnosticsPanel');
    if (panel) return panel;
    panel = document.createElement('details');
    panel.id = 'diagnosticsPanel';
    panel.style.cssText = 'max-width:1100px;margin:20px auto;padding:14px;border:1px solid #59655f;border-radius:12px;background:#111615;color:#e8eee9;font:14px/1.5 system-ui;direction:rtl';
    const summary = document.createElement('summary');
    summary.textContent = 'אבחון טכני — מה קרה בחיפוש?';
    summary.style.cssText = 'cursor:pointer;font-weight:700';
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:12px 0';
    const copy = document.createElement('button');
    copy.type = 'button'; copy.textContent = 'העתק דוח אבחון';
    copy.onclick = async () => { try { await navigator.clipboard.writeText(report()); copy.textContent = 'הועתק'; setTimeout(()=>copy.textContent='העתק דוח אבחון',1200); } catch {} };
    const clear = document.createElement('button');
    clear.type = 'button'; clear.textContent = 'נקה דוח'; clear.onclick = () => { events.length = 0; render(); };
    actions.append(copy, clear);
    const pre = document.createElement('pre');
    pre.id = 'diagnosticsOutput';
    pre.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;margin:0;color:#d7e0da';
    panel.append(summary, actions, pre);
    (document.querySelector('main') || document.body).appendChild(panel);
    return panel;
  }

  function showPanel() { const p = ensurePanel(); p.open = true; }
  function render() {
    const out = document.getElementById('diagnosticsOutput');
    if (!out) return;
    const relevant = currentSearch ? events.filter(e => e.search === currentSearch) : events;
    out.textContent = relevant.slice(-40).map(e => `${e.status.toUpperCase()} · ${e.stage}${e.detail ? ` · ${e.detail}` : ''}`).join('\n') || 'עדיין אין אירועי אבחון.';
  }
  function report() {
    return events.map(e => `[${e.time}] ${e.status.toUpperCase()} ${e.stage} search=${e.search || '-'}${e.detail ? ` detail=${e.detail}` : ''}`).join('\n');
  }

  // In explicit diagnostics mode, keep the panel visible from the start.
  if (new URLSearchParams(location.search).get('diagnostics') === '1') {
    window.addEventListener('DOMContentLoaded', () => { ensurePanel().open = true; render(); });
  }

  window.addEventListener('error', e => fail('browser.error', e.error || e.message));
  window.addEventListener('unhandledrejection', e => fail('browser.unhandledrejection', e.reason));

  window.NameOriginDiagnostics = { start, end, push, ok, warn, fail, showPanel, report, get events(){ return [...events]; } };
})();
