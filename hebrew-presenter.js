(() => {
  const norm = s => String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');
  const mostlyEnglish = (text='') => { const s=String(text), latin=(s.match(/[A-Za-zÀ-ÿ]/g)||[]).length, heb=(s.match(/[\u0590-\u05FF]/g)||[]).length; return latin > Math.max(18, heb*1.6); };
  const langHe = text => String(text)
    .replace(/Ancient Greek/gi,'יוונית עתיקה').replace(/Biblical Hebrew/gi,'עברית מקראית')
    .replace(/Old French/gi,'צרפתית עתיקה').replace(/Old Occitan/gi,'אוקסיטנית עתיקה')
    .replace(/Latin/gi,'לטינית').replace(/Greek/gi,'יוונית').replace(/Hebrew/gi,'עברית')
    .replace(/Arabic/gi,'ערבית').replace(/Italian/gi,'איטלקית').replace(/Spanish/gi,'ספרדית')
    .replace(/French/gi,'צרפתית').replace(/Germanic/gi,'גרמאנית').replace(/German/gi,'גרמנית').replace(/English/gi,'אנגלית');
  function shortTerm(text=''){
    const s=String(text).replace(/\s+/g,' ').trim(); if(!s) return '';
    if(s.length<=90 && s.split(/\s+/).length<=9) return langHe(s);
    for(const re of [/(?:Greek|Ancient Greek)\s*\(([^)]+)\)/i,/(?:Latin|Greek|Hebrew|Arabic|French|German|Italian|Spanish)\s+([\p{L}\p{M}'’-]{2,50})/iu,/\(([\p{L}\p{M}'’-]{2,50})\)/u]){ const m=s.match(re); if(m?.[1]) return m[1].trim(); }
    return '';
  }
  function cleanPath(path=[],title=''){
    const out=[], seen=new Set();
    for(const step of path||[]){
      let v=String(step||'').replace(/\s+/g,' ').trim(); if(!v) continue;
      if(v.length>120 || (mostlyEnglish(v)&&v.split(/\s+/).length>10)) v=shortTerm(v); else v=langHe(v);
      v=String(v||'').trim(); if(!v) continue;
      const key=norm(v); if(!key||seen.has(key)) continue;
      seen.add(key); out.push(v);
    }
    const titleKey=norm(title);
    if(title && titleKey && !out.some(x=>norm(x)===titleKey)) out.push(title);
    return out.slice(0,8);
  }
  function meaningHe(result={}){
    for(const text of [result.meaning,result.plainLanguage,result.simpleSummary]){
      const s=String(text||'');
      for(const m of s.matchAll(/„([^”]{1,100})”/g)) if((m[1].match(/[\u0590-\u05FF]/g)||[]).length>=2) return m[1];
    }
    return 'משמעות שנמצאה במקור';
  }
  function rewrite(result){
    if(!result||result.type!=='שם פרטי') return result;
    const title=String(result.title||'השם'), meaning=meaningHe(result), path=cleanPath(result.path,title);
    const titleKey=norm(title), useful=path.filter(x=>norm(x)!==titleKey&&!/הצורה שחיפשת/.test(x));
    const earliest=useful[0]||'', chain=path.join(' ← ');
    const r={...result,path};
    r.simpleSummary=earliest?`נמצא מסלול אטימולוגי לשם ${title}. אחת הצורות הקדומות או רכיבי המקור שנמצאו היא ${earliest}, והמשמעות שנמצאה היא „${meaning}”.`:`נמצא מידע אטימולוגי לשם ${title}, והמשמעות היא „${meaning}”.`;
    r.whatIsIt=`${title} הוא שם פרטי. המידע מן המקורות מעובד ומוצג כאן בעברית פשוטה.`;
    r.meaning=`המשמעות האטימולוגית שנמצאה היא „${meaning}”.`;
    r.originStory=chain?`לפי המקורות שנמצאו, השרשרת האטימולוגית היא: ${chain}. צורות המקור נשמרות כפי שהן, וההסבר מסביבן מוצג בעברית.`:'נמצא מקור אטימולוגי לשם, אך לא נמצאו מספיק שלבים כדי להציג שרשרת מלאה.';
    r.changes=path.length>2?'נמצאו כמה צורות או שלבי ביניים. כפילויות זהות מוסרות אוטומטית, והשרשרת מוצגת מן המקורות הקדומים אל הצורה שחיפשת.':'לא נמצאו מספיק שלבי ביניים מתועדים כדי להציג ציר שינוי מלא.';
    r.plainLanguage=earliest?`בקיצור: ${title} התפתח דרך צורות קדומות יותר, ובהן ${earliest}. המשמעות שנמצאה במקורות היא „${meaning}”.`:`בקיצור: נמצאה לשם ${title} משמעות אטימולוגית: „${meaning}”.`;
    for(const key of ['simpleSummary','whatIsIt','meaning','originStory','changes','certainty','plainLanguage']) if(mostlyEnglish(r[key])) r[key]='המידע נמצא במקור והוא מוצג כאן בעברית פשוטה. לפרטים המדויקים אפשר לפתוח את המקור המצורף.';
    return r;
  }
  function install(){ const e=window.GivenNameEtymology; if(!e?.build||e.__hebrewPresenterWrapped)return; const b=e.build.bind(e); e.build=async input=>rewrite(await b(input)); e.__hebrewPresenterWrapped=true; }
  install(); window.addEventListener('DOMContentLoaded',install); window.NameOriginHebrewPresenter={rewrite,cleanPath};
})();