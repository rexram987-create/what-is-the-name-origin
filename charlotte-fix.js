// v0.6.1 — reviewed route for Charlotte as a given name.
// Prevents a selected personal-name meaning from falling back to generic Wikidata entity search.
(() => {
  const entry = {
    title: 'שרלוט',
    type: 'שם פרטי',
    subtitle: 'שם פרטי נשי ממקור צרפתי',
    meaning: 'Charlotte היא צורת הנקבה הצרפתית של Charlot, צורת הקטנה של Charles. לכן שרלוט שייכת למשפחת השמות שמקורה בשם Charles.',
    originStory: 'השם Charlotte התפתח בצרפתית מן Charlot, צורת חיבה והקטנה של Charles, בתוספת הסיומת הנשית ‎-ette. השם Charles עצמו ממשיך שם גרמאני קדום הקשור למילה שפירושה בקירוב „אדם חופשי” או „איש”. מכאן התפשט Charlotte לשפות רבות באירופה ומחוצה לה.',
    path: ['גרמאנית קדומה: Karl / Carolus — „איש; אדם חופשי”', 'Charles — הצורה הצרפתית', 'Charlot — צורת הקטנה/חיבה', 'Charlotte — הצורה הנשית', 'שרלוט — התעתיק העברי'],
    changes: 'הבסיס הגרמאני Karl עבר ללטינית של ימי הביניים בצורות כגון Carolus ולצרפתית כ־Charles. מן Charles נוצר Charlot, וממנו Charlotte. בשפות אחרות נשמר בדרך כלל הכתיב Charlotte, אך ההגייה משתנה.',
    certainty: 'רמת הוודאות גבוהה לגבי הקשר Charlotte ← Charlot ← Charles. לגבי המשמעות הקדומה ביותר של השם הגרמאני נהוג לתת משמעויות כגון „איש” או „אדם חופשי”, ולכן עדיף להציג את הניסוח הזה בזהירות ולא כתרגום יחיד ומוחלט.',
    plainLanguage: 'בקיצור: שרלוט היא שם צרפתי שנוצר כצורת נקבה של שם ממשפחת Charles. כלומר, כשמחפשים את השם הפרטי שרלוט אין סיבה לבחור עיר או מקום בשם Charlotte.',
    sources: [
      {name:'Wiktionary — Charlotte', url:'https://en.wiktionary.org/wiki/Charlotte'},
      {name:'Wiktionary — Charles', url:'https://en.wiktionary.org/wiki/Charles'}
    ]
  };

  CURATED['__charlotte_given'] = entry;
  CURATED['charlotte given name'] = entry;

  const given = {label:'👤 שרלוט — שם פרטי', name:'Charlotte', context:{kind:'given-name',label:'שם פרטי',curatedKey:'__charlotte_given'}};
  const city = {label:'🏙️ שרלוט — צפון קרוליינה', name:'Charlotte', context:{kind:'city',region:'North Carolina',country:'United States',label:'עיר בצפון קרוליינה'}};
  AMBIGUITIES['שרלוט'] = [given, city];
  AMBIGUITIES['charlotte'] = [
    {label:'👤 Charlotte — שם פרטי', name:'Charlotte', context:{kind:'given-name',label:'שם פרטי',curatedKey:'__charlotte_given'}},
    {label:'🏙️ Charlotte — North Carolina', name:'Charlotte', context:{kind:'city',region:'North Carolina',country:'United States',label:'עיר בצפון קרוליינה'}}
  ];
})();
