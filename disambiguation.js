// Disambiguation layer v0.4.0
// Ask the user when a bare name has more than one important meaning.
(() => {
  const choices = {
    'סופיה': [
      { label: '👤 סופיה — שם פרטי', query: 'השם הפרטי סופיה' },
      { label: '🏙️ סופיה — בירת בולגריה', query: 'סופיה בולגריה' }
    ],
    'sophia': [
      { label: '👤 Sophia — שם פרטי', query: 'Sophia given name' },
      { label: '🏙️ Sofia — בירת בולגריה', query: 'Sofia Bulgaria' }
    ],
    'sofia': [
      { label: '🏙️ Sofia — בירת בולגריה', query: 'Sofia Bulgaria' },
      { label: '👤 Sofia — שם פרטי', query: 'Sofia given name' }
    ],
    'שרלוט': [
      { label: '👤 שרלוט — שם פרטי', query: 'Charlotte given name' },
      { label: '🏙️ שרלוט — העיר בצפון קרוליינה', query: 'Charlotte North Carolina' }
    ],
    'charlotte': [
      { label: '👤 Charlotte — שם פרטי', query: 'Charlotte given name' },
      { label: '🏙️ Charlotte — צפון קרוליינה', query: 'Charlotte North Carolina' }
    ],
    'ג׳ורג׳יה': [
      { label: '🌍 ג׳ורג׳יה — המדינה בארה״ב', query: 'Georgia U.S. state' },
      { label: '🌍 גאורגיה — המדינה בקווקז', query: 'Georgia country' },
      { label: '👤 Georgia — שם פרטי', query: 'Georgia given name' }
    ],
    'גאורגיה': [
      { label: '🌍 גאורגיה — המדינה בקווקז', query: 'Georgia country' },
      { label: '🌍 ג׳ורג׳יה — המדינה בארה״ב', query: 'Georgia U.S. state' },
      { label: '👤 Georgia — שם פרטי', query: 'Georgia given name' }
    ],
    'georgia': [
      { label: '🌍 Georgia — המדינה בקווקז', query: 'Georgia country' },
      { label: '🌍 Georgia — המדינה בארה״ב', query: 'Georgia U.S. state' },
      { label: '👤 Georgia — שם פרטי', query: 'Georgia given name' }
    ]
  };

  const form = document.getElementById('searchForm');
  const input = document.getElementById('query');
  const statusSection = document.getElementById('statusSection');
  const status = document.getElementById('status');
  if (!form || !input || !statusSection || !status) return;

  const originalRequestSubmit = form.requestSubmit.bind(form);
  let bypass = false;

  function normalize(value) {
    return value.trim().toLowerCase().replace(/[״”]/g, '"').replace(/[׳’]/g, "'");
  }

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
        input.value = option.query;
        bypass = true;
        originalRequestSubmit();
      });
      wrap.appendChild(button);
    });
    status.appendChild(wrap);
  }

  // Capture before app.js' submit listener. Bare ambiguous terms pause for a choice.
  form.addEventListener('submit', event => {
    if (bypass) { bypass = false; return; }
    const raw = input.value.trim();
    const options = choices[normalize(raw)];
    if (!options) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    document.getElementById('resultSection').hidden = true;
    renderChoices(raw, options);
  }, true);
})();
