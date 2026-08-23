// Self-tests v0.8.0 — run with ?diagnostics=1 and press the test button in the diagnostics panel.
(() => {
  const TESTS = [
    { input:'Victoria', expectCanonical:/Victoria/i, expectMeaning:/ניצחון/ },
    { input:'ויקטוריה', expectCanonical:/Victoria/i, expectMeaning:/ניצחון/ },
    { input:'Charlotte', expectCanonical:/Charlotte/i },
    { input:'Isabella', expectCanonical:/Isabella/i },
    { input:'Alexander', expectCanonical:/Alexander/i },
    { input:'Sophia', expectCanonical:/Sophia/i, expectMeaning:/חוכמה/ }
  ];

  async function run() {
    const D = window.NameOriginDiagnostics;
    const E = window.GivenNameEtymology;
    if (!D || !E?.build || !E?.canonicalName) return [];
    const results = [];
    D.push('tests.start','info',`${TESTS.length} tests`);
    for (const t of TESTS) {
      try {
        const canonical = await E.canonicalName(t.input);
        const result = await E.build(t.input);
        const canonicalOk = t.expectCanonical ? t.expectCanonical.test(canonical || '') : true;
        const meaningText = [result?.meaning,result?.plainLanguage,result?.simpleSummary].filter(Boolean).join(' ');
        const meaningOk = t.expectMeaning ? t.expectMeaning.test(meaningText) : !!result;
        const pass = canonicalOk && meaningOk;
        results.push({input:t.input,pass,canonical,meaning:result?.meaning||'',hasResult:!!result});
        D.push(`test.${t.input}`, pass?'ok':'error', {canonical,hasResult:!!result,meaning:result?.meaning||''});
      } catch (e) {
        results.push({input:t.input,pass:false,error:e.message});
        D.fail(`test.${t.input}`, e);
      }
    }
    const passed = results.filter(x=>x.pass).length;
    D.push('tests.end', passed===results.length?'ok':'warn', `${passed}/${results.length} passed`);
    D.showPanel();
    return results;
  }

  function addButton() {
    if (new URLSearchParams(location.search).get('diagnostics') !== '1') return;
    const panel = document.getElementById('diagnosticsPanel');
    if (!panel || document.getElementById('runSelfTests')) return;
    const button = document.createElement('button');
    button.id='runSelfTests'; button.type='button'; button.textContent='הרץ בדיקות אוטומטיות';
    button.style.cssText='margin:8px 0';
    button.onclick=run;
    panel.insertBefore(button, document.getElementById('diagnosticsOutput'));
  }

  window.NameOriginSelfTests = { run, tests: TESTS };
  window.addEventListener('DOMContentLoaded', () => setTimeout(addButton, 0));
})();
