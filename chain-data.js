// Curated chain entries extend the main CURATED dictionary defined in app.js.
// They are kept in a separate file so we can grow a reviewed etymology layer
// without making the search engine harder to maintain.

function registerChainEntry(keys, entry) {
  for (const key of keys) CURATED[key.toLowerCase()] = entry;
}

const NEW_YORK_ENTRY = {
  title: 'ניו יורק',
  type: 'מקום / עיר',
  subtitle: 'העיר הגדולה במדינת ניו יורק, ארצות הברית',
  meaning: 'השם New York פירושו המילולי „יורק החדשה”. הוא אינו תיאור של המקום עצמו, אלא שם שניתן לכבוד ג׳יימס, דוכס יורק, אחיו של המלך צ׳ארלס השני ולימים המלך ג׳יימס השני.',
  originStory: 'לפני השלטון האנגלי נקראה העיר ההולנדית New Amsterdam — „אמסטרדם החדשה”. בשנת 1664 השתלטו האנגלים על המושבה, והעיר נקראה New York לכבוד ג׳יימס, דוכס יורק. בכך השם מפנה אותנו לעיר יורק שבאנגליה, ולכן כדי להבין את האטימולוגיה לעומק צריך להמשיך גם אל מקור השם York עצמו.',
  path: ['Eboracum — השם הרומי של יורק', 'Eoforwic — הצורה האנגלו־סקסית', 'Jórvík — הצורה הנורדית בתקופה הוויקינגית', 'York — העיר באנגליה', 'James, Duke of York — דוכס יורק', 'New York — ניו יורק'],
  changes: 'השרשרת המרכזית היא: Eboracum בתקופה הרומית → Eoforwic באנגלית עתיקה → Jórvík בתקופה הוויקינגית → York באנגלית → New York ב־1664. העיר עצמה נקראה קודם New Amsterdam, ובשנים 1673–1674, בזמן כיבוש הולנדי קצר, נקראה New Orange; לאחר מכן חזר השם New York.',
  certainty: 'הקשר בין New York לדוכס יורק מתועד היטב. גם הרצף Eboracum → Eoforwic → Jórvík → York מתועד היסטורית. המקור הקדום ביותר של Eboracum אינו ודאי לחלוטין; אחת ההצעות קושרת אותו למילה קלטית הקשורה לעץ הטקסוס, ולכן יש להציג את השלב הזה כהשערה ולא כעובדה מוחלטת.',
  plainLanguage: 'בקיצור: ניו יורק פירושה „יורק החדשה”. האנגלים נתנו לעיר את השם לכבוד דוכס יורק. אבל הסיפור לא נעצר שם: השם York עצמו עבר גלגולים מרומאית, דרך אנגלית עתיקה ונורדית עתיקה, עד שהגיע לצורה שאנחנו מכירים כיום.',
  sources: [
    { name: 'ארכיון עיריית ניו יורק — New Amsterdam records', url: 'https://a860-collectionguides.nyc.gov/repositories/2/resources/25' },
    { name: 'York Historic Environment Record — התקופה האנגלו־סקסית והוויקינגית', url: 'https://her.york.gov.uk/city-walls-history-anglian-and-early-medieval' }
  ]
};

const YORK_ENTRY = {
  title: 'יורק',
  type: 'מקום / עיר',
  subtitle: 'עיר היסטורית בצפון אנגליה',
  meaning: 'השם York הוא התוצאה המודרנית של שרשרת ארוכה של צורות היסטוריות. בתקופה הרומית העיר נקראה Eboracum; באנגלית עתיקה התפתחה הצורה Eoforwic; הוויקינגים התאימו אותה ל־Jórvík; ובהמשך התקבעה הצורה York.',
  originStory: 'הרומאים ייסדו את העיר בשנת 71 לספירה וקראו לה Eboracum. לאחר התקופה הרומית, דוברי אנגלית עתיקה התאימו את השם ל־Eoforwic. כאשר הוויקינגים כבשו את העיר במאה התשיעית, השם השתנה ל־Jórvík. מן הצורה הזאת ומההתפתחויות המאוחרות יותר נוצרה לבסוף York.',
  path: ['Eboracum', 'Eoforwic', 'Jórvík', 'York'],
  changes: 'Eboracum → Eoforwic → Jórvík → York. השינויים משקפים מעבר בין לטינית, אנגלית עתיקה ונורדית עתיקה, לצד התאמות בהגייה ובכתיב.',
  certainty: 'הרצף ההיסטורי בין הצורות מתועד היטב. לעומת זאת, האטימולוגיה הקדומה ביותר של Eboracum אינה מוסכמת לחלוטין. קיימת הצעה הקושרת אותה למילה קלטית שמשמעותה „טקסוס”, אך המקור אינו ודאי.',
  plainLanguage: 'בקיצור: York הוא שם עתיק מאוד שעבר מיד ליד בין הרומאים, האנגלו־סקסים והוויקינגים. בכל תקופה ההגייה והכתיב השתנו מעט, עד שנוצרה הצורה York.',
  sources: [
    { name: 'City of York Council — סקירה היסטורית של העיר', url: 'https://democracy.york.gov.uk/documents/s7381/Appendix%202%20Baseline%20for%20LDF%20Working%20Group%20Final.pdf' },
    { name: 'York Historic Environment Record', url: 'https://her.york.gov.uk/city-walls-history-anglian-and-early-medieval' }
  ]
};

registerChainEntry(['ניו יורק', 'new york', 'new york city', 'ניו-יורק'], NEW_YORK_ENTRY);
registerChainEntry(['יורק', 'york'], YORK_ENTRY);
