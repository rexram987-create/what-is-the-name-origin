// Disambiguation layer v0.5.3
// Keep the canonical name separate from the chosen meaning/context.
(() => {
  const choices = {
    'סופיה': [
      { label: '👤 סופיה — שם פרטי', name: 'Sophia', context: { kind: 'given-name', label: 'שם פרטי' } },
      { label: '🏙️ סופיה — בירת בולגריה', name: 'Sofia', context: { kind: 'city', country: 'Bulgaria', label: 'בירת בולגריה' } }
    ],
    'sophia': [
      { label: '👤 Sophia — שם פרטי', name: 'Sophia', context: { kind: 'given-name', label: 'שם פרטי' } },
      { label: '🏙️ Sofia — בירת בולגריה', name: 'Sofia', context: { kind: 'city', country: 'Bulgaria', label: 'בירת בולגריה' } }
    ],
    'sofia': [
      { label: '🏙️ Sofia — בירת בולגריה', name: 'Sofia', context: { kind: 'city', country: 'Bulgaria', label: 'בירת בולגריה' } },
      { label: '👤 Sofia — שם פרטי', name: 'Sofia', context: { kind: 'given-name', label: 'שם פרטי' } }
    ],
    'שרלוט': [
      { label: '👤 שרלוט — שם פרטי', name: 'Charlotte', context: { kind: 'given-name', label: 'שם פרטי' } },
      { label: '🏙️ שרלוט — העיר בצפון קרוליינה', name: 'Charlotte', context: { kind: 'city', region: 'North Carolina', country: 'United States', label: 'עיר בצפון קרוליינה' } }
    ],
    'charlotte': [
      { label: '👤 Charlotte — שם פרטי', name: 'Charlotte', context: { kind: 'given-name', label: 'שם פרטי' } },
      { label: '🏙️ Charlotte — צפון קרוליינה', name: 'Charlotte', context: { kind: 'city', region: 'North Carolina', country: 'United States', label: 'עיר בצפון קרוליינה' } }
    ]
  };

  const form = document.getElementById('searchForm');
  const input = document.getElementById('query');
  const statusSection = document.getElementById('statusSection');
  const status = document.getElementById('status');
  if (!form || !input || !statusSection || !status) return;

  let bypass = false;
  window.NAME_ORIGIN_CONTEXT = null;
  function normalize(value) { return value.trim().toLowerCase(); }

  function renderChoices(raw, options) {
    statusSection.hidden = false;
    status.innerHTML = '';
    const title = document.createElement('strong');
    title.textContent = `מצאתי כמה משמעויות ל„${raw}”. למה התכוונת?`;
    status.appendChild(title);
    const wrap = document.createElement('div');
    wrap.className = 'meaning-choices';
    options.forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'meaning-choice';
      button.textContent = option.label;
      button.addEventListener('click', () => {
        window.NAME_ORIGIN_CONTEXT = { original: raw, canonicalName: option.name, ...option.context };
        input.value = option.name;
        // Dispatch a fresh submit event so the context-resolver can intercept it.
        // The old implementation called a saved native requestSubmit(), which skipped
        // the resolver's intended handoff and let the generic picker run immediately.
        bypass = true;
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });
      wrap.appendChild(button);
    });
    status.appendChild(wrap);
  }

  form.addEventListener('submit', event => {
    if (bypass) { bypass = false; return; }
    window.NAME_ORIGIN_CONTEXT = null;
    const raw = input.value.trim();
    const options = choices[normalize(raw)];
    if (!options) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    document.getElementById('resultSection').hidden = true;
    renderChoices(raw, options);
  }, true);
})();
