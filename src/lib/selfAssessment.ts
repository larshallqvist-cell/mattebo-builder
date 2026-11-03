/** Self-assessment after each sub-chapter: scale, default questions and summaries. */

/** Three levels, 1–3. Older answers saved on the earlier 0–4 scale are ignored. */
export const SCALE: { value: number; label: string }[] = [
  { value: 1, label: "Nja, kanske med lite hjälp" },
  { value: 2, label: "Ja, jag är ganska säker" },
  { value: 3, label: "Jag känner mig helt säker" },
];

export const isScaleValue = (v: unknown): v is number => SCALE.some((s) => s.value === v);

export const INSTRUCTION =
  "Svara ärligt – dina svar hjälper oss att se vad du behöver öva på.";

type Bank = Record<string, string[][]>; // "grade-chapter" -> per section index

export const DEFAULT_QUESTIONS: Bank = {
  "6-1": [
    ["Jag kan ge exempel på naturliga tal.", "Jag kan visa ett negativt tal på en tallinje.", "Jag kan säga vad varje siffra är värd i ett decimaltal, till exempel 3,25.", "Jag kan placera decimaltal på en tallinje."],
    ["Jag kan räkna addition med decimaltal, till exempel 2,5 + 1,35.", "Jag kan räkna subtraktion med decimaltal, till exempel 5 − 2,35.", "Jag kan skriva 5 som 5,00 och visa att det är samma värde.", "Jag kan räkna ungefär för att kontrollera om mitt svar verkar stämma."],
    ["Jag kan multiplicera ett decimaltal med ett heltal, till exempel 3 · 1,4.", "Jag kan dividera ett decimaltal med ett heltal, till exempel 8,4 ÷ 2.", "Jag kan kontrollera att decimaltecknet hamnat rätt i mitt svar.", "Jag kan förklara varför 8,4 ÷ 2 blir mindre än 8,4."],
    ["Jag kan multiplicera två decimaltal, till exempel 0,2 · 0,3.", "Jag kan förklara hur jag hittar decimaltecknets plats när jag multiplicerar två decimaltal.", "Jag kan multiplicera ett tal med 10, 100 och 1 000.", "Jag kan förklara varför 8 · 0,5 är hälften av 8."],
    ["Jag kan dividera ett tal med 10, 100 och 1 000.", "Jag kan fortsätta en division när svaret behöver decimaler, till exempel 7 ÷ 2.", "Jag kan göra om 4 ÷ 0,5 till 40 ÷ 5 och förklara varför svaret blir samma.", "Jag kan förklara varför 4 ÷ 0,5 blir större än 4."],
    ["Jag kan läsa tal i miljoner och miljarder.", "Jag kan skriva tal i miljoner och miljarder.", "Jag kan förklara vad 10³ och 10⁶ betyder.", "Jag kan avrunda stora tal, till exempel till närmaste tiotusental eller miljon.", "Jag kan räkna ungefär med stora tal för att kontrollera ett svar."],
    ["Jag kan visa att binära tal skrivs med bara 0 och 1.", "Jag kan säga vad platserna i ett binärt tal är värda: 1, 2, 4, 8 och så vidare.", "Jag kan göra om ett binärt tal, till exempel 1011, till ett tal i vårt vanliga talsystem.", "Jag kan skriva ett tal i vårt vanliga talsystem, till exempel 6, som ett binärt tal."],
  ],
  "6-2": [
    ["Jag kan visa vilken del av ett bråk som är täljare och vilken som är nämnare.", "Jag kan förklara vad täljaren och nämnaren berättar, till exempel i 2/5.", "Jag kan addera bråk med samma nämnare, till exempel 2/5 + 1/5.", "Jag kan subtrahera bråk med samma nämnare, till exempel 4/5 − 1/5.", "Jag kan visa med en bild varför 4/4 är en hel."],
    ["Jag kan visa med en bild vad 1 ½ betyder.", "Jag kan skriva 5/2 i blandad form.", "Jag kan avgöra om ett bråk är mindre än, lika med eller större än 1.", "Jag kan skriva 2 ½ som ett bråk."],
    ["Jag kan skriva 1/2, 1/4 och 1/10 som decimaltal.", "Jag kan göra om ett bråk till ett decimaltal genom division.", "Jag kan avgöra vilket som är störst: ett bråk eller ett decimaltal, till exempel 1/2 eller 0,6.", "Jag kan placera bråk och decimaltal på samma tallinje."],
    ["Jag kan räkna ut 1/3 av 18.", "Jag kan räkna ut 2/3 av 18.", "Jag kan visa med en bild hur jag hittar 2/3 av ett antal.", "Jag kan lösa en textuppgift där jag ska räkna ut en del av ett antal."],
    ["Jag kan förklara att procent betyder hundradelar.", "Jag kan visa vad 50 % och 100 % betyder i en bild.", "Jag kan skriva 25 % som bråk och decimaltal.", "Jag kan uppskatta ungefär hur många procent av en figur som är färgad."],
    ["Jag kan ge exempel på något som är omöjligt, något som kan hända och något som är säkert.", "Jag kan skriva chansen att slå en sexa med en vanlig tärning som ett bråk.", "Jag kan visa var en sannolikhet hör hemma mellan 0 och 1.", "Jag kan jämföra två händelser och säga vilken som har störst chans att hända."],
    ["Jag kan räkna ut 10 % av ett tal utan miniräknare.", "Jag kan räkna ut 1 % av ett tal utan miniräknare.", "Jag kan använda 10 % för att räkna ut 20 % och 5 % av ett tal.", "Jag kan räkna ut hur många kronor priset sänks, till exempel vid 20 % rabatt på 200 kr."],
  ],
  "7-1": [
    ["Jag kan ge exempel på naturliga tal.", "Jag kan säga vad varje siffra är värd i ett stort tal, till exempel 40 503.", "Jag kan jämföra och ordna naturliga tal efter storlek.", "Jag kan avgöra om ett tal är delbart med 2, 3, 5 eller 10."],
    ["Jag kan räkna ut 3 + 4 · 2 i rätt ordning.", "Jag kan räkna ut ett uttryck med parenteser, till exempel (3 + 4) · 2.", "Jag kan räkna ut ett uttryck med division, till exempel 20 − 12 ÷ 4.", "Jag kan skriva ett uttryck som passar en enkel textuppgift."],
    ["Jag kan visa negativa tal på en tallinje.", "Jag kan avgöra vilket tal som är störst, till exempel −3 eller −7.", "Jag kan räkna addition och subtraktion med negativa tal, till exempel −2 + 5 och 3 − 8.", "Jag kan använda negativa tal i en vardaglig situation, till exempel temperatur."],
    ["Jag kan ge exempel på tal som kan skrivas som bråk.", "Jag kan placera bråk och decimaltal på en tallinje.", "Jag kan skriva ett bråk som decimaltal, till exempel 3/4.", "Jag kan jämföra två bråk, till exempel 2/3 och 3/5."],
    ["Jag kan förlänga och förkorta ett bråk.", "Jag kan addera bråk med olika nämnare, till exempel 1/2 + 1/3.", "Jag kan subtrahera bråk med olika nämnare, till exempel 3/4 − 1/6.", "Jag kan räkna ut en del av ett antal, till exempel 3/5 av 40."],
    ["Jag kan multiplicera två decimaltal, till exempel 1,2 · 0,3.", "Jag kan dividera ett decimaltal med ett heltal, till exempel 7,5 ÷ 3.", "Jag kan kontrollera att decimaltecknet hamnat rätt i mitt svar.", "Jag kan välja räknesätt i en textuppgift och förklara mitt val."],
    ["Jag kan dividera med 10, 100 och 1 000.", "Jag kan dividera med ett decimaltal, till exempel 6 ÷ 0,2.", "Jag kan förklara varför 6 ÷ 0,2 blir större än 6.", "Jag kan förklara varför 6 ÷ 200 blir mindre än 1."],
    ["Jag kan avrunda ett tal till heltal och till en decimal.", "Jag kan avrunda till närmaste tiotal, hundratal och tusental.", "Jag kan göra ett överslag, till exempel 48 · 21 ≈ 50 · 20.", "Jag kan använda ett överslag för att kontrollera om mitt svar verkar stämma."],
  ],
  "7-2": [
    ["Jag kan förklara vad en variabel är, till exempel x.", "Jag kan skriva ett uttryck för en situation, till exempel ”x kronor plus 5 kronor”.", "Jag kan räkna ut värdet av 3x + 2 när x = 4.", "Jag kan förklara vad uttrycket 2x betyder."],
    ["Jag kan fortsätta ett talmönster eller figurmönster.", "Jag kan beskriva med ord hur ett mönster växer.", "Jag kan skriva ett uttryck för figur nummer n i ett enkelt mönster.", "Jag kan använda mitt uttryck för att räkna ut en figur långt fram, till exempel figur 50."],
    ["Jag kan förenkla ett uttryck som 3x + 2x.", "Jag kan förenkla ett uttryck med både x-termer och tal, till exempel 4x + 3 − x + 5.", "Jag kan ta bort en parentes, till exempel 2(x + 3).", "Jag kan kontrollera en förenkling genom att sätta in ett tal för x."],
    ["Jag kan förklara vad likhetstecknet betyder i en ekvation.", "Jag kan lösa en ekvation som x + 7 = 12.", "Jag kan lösa en ekvation som 3x − 4 = 11.", "Jag kan pröva om mitt svar stämmer genom att sätta in det i ekvationen."],
    ["Jag kan välja vad x ska betyda i en textuppgift.", "Jag kan skriva en ekvation som passar en enkel textuppgift.", "Jag kan lösa ekvationen och svara på frågan i uppgiften.", "Jag kan avgöra om mitt svar är rimligt i situationen."],
    ["Jag kan lösa en ekvation som 5x + 2 = 3x + 10.", "Jag kan förklara varför jag gör samma sak i båda leden.", "Jag kan samla x-termerna i ett led och talen i det andra.", "Jag kan pröva mitt svar i båda leden."],
  ],
  "8-1": [
    ["Jag kan förlänga och förkorta bråk.", "Jag kan skriva ett bråk i blandad form och tvärtom.", "Jag kan jämföra bråk och placera dem på en tallinje.", "Jag kan räkna ut en del av ett antal, till exempel 3/8 av 64."],
    ["Jag kan hitta en gemensam nämnare för två bråk.", "Jag kan addera bråk med olika nämnare, till exempel 2/3 + 1/4.", "Jag kan subtrahera bråk i blandad form, till exempel 2 1/2 − 3/4.", "Jag kan förklara med en bild varför 1/2 + 1/3 inte är 2/5."],
    ["Jag kan multiplicera ett bråk med ett heltal, till exempel 4 · 2/3.", "Jag kan multiplicera två bråk, till exempel 2/3 · 3/5.", "Jag kan förkorta innan jag multiplicerar.", "Jag kan förklara varför 1/2 · 1/3 blir mindre än båda bråken."],
    ["Jag kan dividera ett bråk med ett heltal, till exempel 3/4 ÷ 3.", "Jag kan dividera ett heltal med ett bråk, till exempel 3 ÷ 1/4.", "Jag kan dividera två bråk, till exempel 2/3 ÷ 4/9.", "Jag kan förklara varför 3 ÷ 1/4 blir större än 3."],
    ["Jag kan förklara vad 2⁵ betyder.", "Jag kan räkna ut en potens, till exempel 3⁴.", "Jag kan räkna i rätt ordning när ett uttryck har en potens, till exempel 2 + 3².", "Jag kan förklara skillnaden mellan (−2)² och −2²."],
    ["Jag kan skriva 10 000 som en tiopotens.", "Jag kan multiplicera och dividera med tiopotenser.", "Jag kan skriva ett stort tal i grundpotensform, till exempel 3 400 000.", "Jag kan läsa av och jämföra tal skrivna i grundpotensform."],
  ],
  "8-2": [
    ["Jag kan räkna ut hur stor andel 15 är av 60, i procent.", "Jag kan skriva en andel som bråk, decimaltal och procent.", "Jag kan räkna ut andelen med miniräknare och avrunda svaret rimligt.", "Jag kan förklara vad det hela och delen är i en uppgift."],
    ["Jag kan räkna ut hur många procent ett pris har ökat eller minskat.", "Jag kan skilja på procent och procentenheter.", "Jag kan jämföra två erbjudanden med hjälp av procent.", "Jag kan förklara varför en ökning med 10 % och sedan en minskning med 10 % inte ger samma pris."],
    ["Jag kan räkna ut det hela när jag vet delen och andelen, till exempel 20 % är 30 kr.", "Jag kan använda 1 % eller 10 % som hjälp för att hitta det hela.", "Jag kan räkna ut det ursprungliga priset efter en rabatt.", "Jag kan kontrollera mitt svar genom att räkna tillbaka."],
    ["Jag kan räkna ut delen, till exempel 35 % av 480.", "Jag kan räkna ut ett nytt pris efter en höjning eller sänkning.", "Jag kan använda förändringsfaktor, till exempel 0,8 vid 20 % rabatt.", "Jag kan göra ett överslag för att se om mitt svar är rimligt."],
    ["Jag kan förklara vad ränta är.", "Jag kan räkna ut räntan på ett belopp under ett år.", "Jag kan räkna ut hur mycket pengar det blir efter flera år med ränta på ränta.", "Jag kan jämföra två lån eller sparformer med olika ränta."],
  ],
  "9-1": [
    ["Jag kan räkna i rätt ordning med alla fyra räknesätten och parenteser.", "Jag kan välja räknesätt i en textuppgift.", "Jag kan göra ett överslag för att kontrollera ett svar.", "Jag kan avrunda ett svar rimligt i en vardaglig situation."],
    ["Jag kan addera och subtrahera bråk med olika nämnare.", "Jag kan multiplicera och dividera bråk.", "Jag kan räkna med bråk i blandad form.", "Jag kan lösa en textuppgift där jag räknar med bråk."],
    ["Jag kan addera och subtrahera negativa tal, till exempel −4 − (−6).", "Jag kan multiplicera och dividera negativa tal, till exempel (−3) · (−5).", "Jag kan förklara varför minus gånger minus blir plus.", "Jag kan räkna i rätt ordning i ett uttryck med negativa tal."],
    ["Jag kan förenkla 2³ · 2⁴ med hjälp av potenslagarna.", "Jag kan förenkla 5⁶ ÷ 5² med hjälp av potenslagarna.", "Jag kan förklara vad a⁰ och (a²)³ blir.", "Jag kan räkna ut potenser med negativ bas, till exempel (−2)³."],
    ["Jag kan skriva 0,001 som en tiopotens.", "Jag kan förklara vad 10⁻² betyder.", "Jag kan skriva ett litet tal i grundpotensform, till exempel 0,00045.", "Jag kan jämföra små tal som är skrivna i grundpotensform."],
    ["Jag kan skriva tal i grundpotensform och tillbaka.", "Jag kan multiplicera tal i grundpotensform.", "Jag kan dividera tal i grundpotensform.", "Jag kan använda grundpotensform med miniräknaren."],
    ["Jag kan räkna ut kvadraten av ett tal, till exempel 13².", "Jag kan räkna ut kvadratroten ur ett kvadrattal, till exempel √144.", "Jag kan uppskatta en kvadratrot, till exempel att √50 är lite mer än 7.", "Jag kan förklara sambandet mellan en kvadrats area och dess sida."],
  ],
  "9-2": [
    ["Jag kan räkna ut andelen, delen och det hela i procentuppgifter.", "Jag kan skilja på procent och procentenheter.", "Jag kan räkna ut en procentuell förändring.", "Jag kan lösa en textuppgift med procent och förklara min lösning."],
    ["Jag kan skriva en förändringsfaktor för en ökning eller minskning, till exempel 1,15 eller 0,85.", "Jag kan räkna ut ett nytt värde med förändringsfaktor.", "Jag kan räkna med upprepade förändringar, till exempel 1,05⁴.", "Jag kan räkna ut den procentuella förändringen från en förändringsfaktor."],
    ["Jag kan förklara vad en funktion är med egna ord.", "Jag kan göra en värdetabell från en formel.", "Jag kan läsa av värden i en graf.", "Jag kan beskriva ett samband med en formel, en tabell och en graf."],
    ["Jag kan känna igen en linjär funktion i en graf.", "Jag kan läsa av k-värde och m-värde i y = kx + m.", "Jag kan rita grafen till en linjär funktion.", "Jag kan ta fram formeln för en rät linje från en graf."],
    ["Jag kan beskriva en vardaglig situation med en linjär funktion, till exempel en mobilavgift.", "Jag kan förklara vad k-värdet och m-värdet betyder i situationen.", "Jag kan använda formeln för att räkna ut ett värde.", "Jag kan jämföra två linjära funktioner och avgöra när den ena är bättre."],
  ],
};

export const defaultQuestions = (grade: number, chapter: number, sectionIndex: number): string[] =>
  DEFAULT_QUESTIONS[`${grade}-${chapter}`]?.[sectionIndex] ?? [];

/** Teacher edits win; an empty saved list falls back to the default bank. */
export const resolveQuestions = (saved: string[] | null | undefined, fallback: string[]): string[] => {
  const clean = (saved ?? []).map((q) => q.trim()).filter(Boolean);
  return clean.length ? clean : fallback;
};

export const parseQuestions = (text: string): string[] =>
  text.split("\n").map((q) => q.replace(/^\s*[-•*]\s*/, "").trim()).filter(Boolean);

export interface QuestionSummary {
  question: string;
  /** counts[v - 1] = number of students who chose level v (1–3). */
  counts: [number, number, number];
  answered: number;
}

/** Counts per question; a response saved for another question list only counts on matching texts. */
export const summarize = (questions: string[], responses: { questions: string[]; ratings: number[] }[]): QuestionSummary[] =>
  questions.map((question) => {
    const counts: QuestionSummary["counts"] = [0, 0, 0];
    for (const r of responses) {
      const i = r.questions.indexOf(question);
      const v = i >= 0 ? r.ratings[i] : undefined;
      if (isScaleValue(v)) counts[v - 1]++;
    }
    return { question, counts, answered: counts.reduce((a, b) => a + b, 0) };
  });
