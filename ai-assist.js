// Lightweight AI-assist layer: runs locally in the browser via Transformers.js.
// Purpose: classify retrieved text and help rank which source snippets are actually about etymology.
// It never replaces sources and never invents an etymology.

(() => {
  const AI = {
    ready: false,
    loading: null,
    classifier: null,
    model: 'Xenova/mobilebert-uncased-mnli',
  };

  const LABELS = [
    'etymology or origin of a name',
    'general history of a place or person',
    'legend or folklore',
    'biographical information',
    'unrelated information'
  ];

  async function loadAI() {
    if (AI.ready) return AI.classifier;
    if (AI.loading) return AI.loading;

    AI.loading = (async () => {
      try {
        const mod = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
        AI.classifier = await mod.pipeline('zero-shot-classification', AI.model, {
          dtype: 'q8'
        });
        AI.ready = true;
        return AI.classifier;
      } catch (error) {
        console.warn('AI assist unavailable; continuing without it.', error);
        return null;
      }
    })();

    return AI.loading;
  }

  async function classifyText(text) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 1800);
    if (!clean) return null;
    const classifier = await loadAI();
    if (!classifier) return null;
    try {
      const result = await classifier(clean, LABELS, { multi_label: true });
      return result;
    } catch (error) {
      console.warn('AI classification failed', error);
      return null;
    }
  }

  async function rankEtymologyCandidates(candidates = []) {
    const usable = candidates
      .filter(x => x && (x.etymology || x.extract))
      .map(x => ({ ...x, text: x.etymology || x.extract }));

    const scored = [];
    for (const item of usable.slice(0, 8)) {
      const result = await classifyText(item.text);
      let etymologyScore = 0;
      let legendScore = 0;
      if (result?.labels && result?.scores) {
        const pairs = result.labels.map((label, i) => [label, result.scores[i]]);
        etymologyScore = pairs.find(([l]) => l === LABELS[0])?.[1] || 0;
        legendScore = pairs.find(([l]) => l === LABELS[2])?.[1] || 0;
      }
      scored.push({ ...item, aiEtymologyScore: etymologyScore, aiLegendScore: legendScore });
    }

    return scored.sort((a, b) => {
      const aBase = (a.etymology ? 0.35 : 0) + (a.aiEtymologyScore || 0) - (a.aiLegendScore || 0) * 0.25;
      const bBase = (b.etymology ? 0.35 : 0) + (b.aiEtymologyScore || 0) - (b.aiLegendScore || 0) * 0.25;
      return bBase - aBase;
    });
  }

  window.EtymologyAI = {
    load: loadAI,
    classifyText,
    rankEtymologyCandidates,
    get status() {
      return { ready: AI.ready, model: AI.model };
    }
  };
})();
