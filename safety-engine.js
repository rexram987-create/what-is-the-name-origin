// Safety engine v0.5.0 — generic guardrails against wrong entity/unsupported etymology.
(() => {
  const KIND_WORDS = {
    city: /city|town|capital|municipality|עיר|בירה|יישוב/i,
    'given-name': /given name|first name|forename|שם פרטי/i,
    surname: /surname|family name|last name|שם משפחה/i,
    country: /country|sovereign state|מדינה/i,
    person: /person|singer|actor|writer|politician|אדם|זמר|שחקן|סופר/i
  };

  function norm(s='') { return s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu,' ').trim(); }
  function scoreCandidate(candidate, query, context = {}) {
    const label = norm(candidate.label || '');
    const desc = candidate.description || '';
    const q = norm(query);
    let score = 0;
    if (label === q) score += 40;
    else if (label.includes(q) || q.includes(label)) score += 18;
    if (context.kind && KIND_WORDS[context.kind]?.test(desc)) score += 30;
    if (context.kind && !KIND_WORDS[context.kind]?.test(desc) && Object.values(KIND_WORDS).some(r => r.test(desc))) score -= 12;
    for (const key of ['country','region','label']) if (context[key] && norm(desc).includes(norm(context[key]))) score += 18;
    return score;
  }

  function rank(candidates, query, context = window.NAME_ORIGIN_CONTEXT || {}) {
    return [...candidates].map(c => ({...c, _safetyScore: scoreCandidate(c, query, context)})).sort((a,b)=>b._safetyScore-a._safetyScore);
  }

  function confidence(ranked) {
    if (!ranked.length) return { level:'low', reason:'לא נמצאה ישות מתאימה.' };
    const gap = ranked.length > 1 ? ranked[0]._safetyScore-ranked[1]._safetyScore : 99;
    if (ranked[0]._safetyScore < 20) return { level:'low', reason:'ההתאמה בין החיפוש לתוצאה חלשה.' };
    if (gap < 10) return { level:'ambiguous', reason:'נמצאו כמה תוצאות בעלות התאמה דומה.' };
    return { level: ranked[0]._safetyScore >= 55 ? 'high':'medium', reason:'השם וההקשר מתאימים לתוצאה שנבחרה.' };
  }

  function claimRisk(text='') {
    const namedAfter = /named after|name(?:d)? for|נקרא(?:ה)? על שם|קרוי(?:ה)? על שם/i.test(text);
    const uncertainty = /legend|tradition|possibly|perhaps|uncertain|disputed|אגדה|מסורת|ייתכן|אולי|לא ודאי|שנוי במחלוקת/i.test(text);
    return { namedAfter, uncertainty, needsCorroboration: namedAfter || uncertainty };
  }

  function corroboration(pages=[]) {
    const ety = pages.filter(p => (p.etymology||'').length > 35);
    const hosts = new Set(ety.map(p => { try { return new URL(p.url).hostname; } catch { return p.sourceName; } }));
    return { sourceCount: hosts.size, safeForStrongClaim: hosts.size >= 2 };
  }

  window.NameOriginSafety = { rank, confidence, claimRisk, corroboration };
})();
