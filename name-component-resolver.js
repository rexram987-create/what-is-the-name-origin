// Name Component Resolver v1.0.0
// Generic layer: separates an entity/classifier suffix from the proper-name component.
// It does not contain a dictionary of individual place names.
(() => {
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
  const norm=v=>clean(v).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f\u0591-\u05c7]/g,'').replace(/[׳״'"`’‘]/g,'').trim();

  // Generic type words only. These are grammatical/entity classifiers, not etymology entries.
  const TYPE_WORDS = new Set([
    'state','city','province','county','district','region','republic','kingdom','territory','municipality','island','river','mountain','lake','sea','bay','gulf','village','town',
    'מדינה','עיר','מחוז','נפה','אזור','רפובליקה','ממלכה','טריטוריה','אי','נהר','הר','אגם','ים','מפרץ','כפר','עיירה'
  ]);

  function stripParenthetical(q){return clean(q).replace(/\s*[\(（][^\)）]{1,80}[\)）]\s*$/u,'').trim();}
  function resolve(query, context={}){
    const original=clean(query); if(!original)return null;
    let base=stripParenthetical(original);
    const words=base.split(/\s+/).filter(Boolean);
    const removed=[];
    // Remove only trailing generic entity classifiers; never remove arbitrary words.
    while(words.length>1 && TYPE_WORDS.has(norm(words[words.length-1]))){removed.unshift(words.pop());}
    base=words.join(' ').trim();
    if(!base || norm(base)===norm(original)) return null;
    return {original,component:base,removed,typeWords:removed,reason:'generic-entity-classifier',context};
  }

  function install(){
    const form=document.getElementById('searchForm'), input=document.getElementById('query');
    if(!form||!input||form.dataset.componentResolverInstalled==='1')return;
    form.dataset.componentResolverInstalled='1';
    form.addEventListener('submit',()=>{
      const found=resolve(input.value,window.NAME_ORIGIN_CONTEXT||{});
      if(found){
        window.NAME_ORIGIN_COMPONENT=found;
        window.NAME_ORIGIN_CONTEXT={...(window.NAME_ORIGIN_CONTEXT||{}),nameComponent:found.component,originalQuery:found.original,entityClassifier:found.typeWords.join(' ')};
        window.NameOriginDiagnostics?.ok?.('name-component.resolved',found);
      } else {
        delete window.NAME_ORIGIN_COMPONENT;
      }
    },true);
  }

  window.NameComponentResolver={resolve,TYPE_WORDS};
  install(); window.addEventListener('DOMContentLoaded',install);
})();