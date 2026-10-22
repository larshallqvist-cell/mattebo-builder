// GENERATED from protected lab source by build-braklabbet-content.mjs
// Original pilot questions and answer keys supplied by Lasse, 21 October 2026.
export const comparisonExercises = [
 {id:1, prompt:'Vilket är störst: 1/4 eller 3/4?', kind:'choice', options:['1/4','3/4'], key:'3/4', explanation:'Samma nämnare, större täljare.', hint:'När delarna är lika stora: jämför antalet delar.'},
 {id:2, prompt:'Vilket är minst: 2/5 eller 4/5?', kind:'choice', options:['2/5','4/5'], key:'2/5', explanation:'Samma nämnare, mindre täljare.', hint:'När delarna är lika stora: jämför antalet delar.'},
 {id:3, prompt:'Sätt rätt tecken mellan 3/8 och 5/8: <, > eller =.', kind:'relation', key:'<', explanation:'3/8 < 5/8. Samma nämnare, mindre täljare.', hint:'Båda bråken är åttondelar.'},
 {id:4, prompt:'Jämför 2/3 och 2/5.', kind:'relation', key:'>', explanation:'2/3 > 2/5 — med samma täljare är tredjedelar större än femtedelar.', hint:'Jämför hur stor varje del är när täljarna är lika.'},
 {id:5, prompt:'Vilket bråk är närmast 1: 5/6 eller 3/4?', kind:'choice', options:['5/6','3/4'], key:'5/6', explanation:'5/6 — det fattas mindre till 1.', hint:'Jämför delarna som saknas till en hel.'},
 {id:6, prompt:'Sant eller falskt: 4/7 < 6/7.', kind:'choice', options:['Sant','Falskt'], key:'Sant', explanation:'Sant. Samma nämnare, och 4 är mindre än 6.', hint:'Båda helheterna är delade i sju delar.'},
 {id:7, prompt:'Ordna från minst till störst: 1/2, 1/4, 3/4.', kind:'order', key:'1/4, 1/2, 3/4', explanation:'1/4, 1/2, 3/4. En halv är två fjärdedelar.', hint:'Skriv alla bråken som fjärdedelar.'},
 {id:8, prompt:'Jämför 1/2 och 3/5.', kind:'relation', key:'<', explanation:'1/2 < 3/5. Som tiondelar: 5/10 < 6/10.', hint:'Förläng till en gemensam nämnare.'},
 {id:9, prompt:'Jämför 2/3 och 3/4.', kind:'relation', key:'<', explanation:'2/3 < 3/4. Som tolftedelar: 8/12 < 9/12.', hint:'Förläng till en gemensam nämnare.'},
 {id:10, prompt:'Jämför 5/6 och 7/9.', kind:'relation', key:'>', explanation:'5/6 > 7/9. Som artondelar: 15/18 > 14/18.', hint:'Förläng till en gemensam nämnare.'},
 {id:11, prompt:'Jämför 3/8 och 2/5.', kind:'relation', key:'<', explanation:'3/8 < 2/5. Som fyrtiondelar: 15/40 < 16/40.', hint:'Förläng till en gemensam nämnare.'},
 {id:12, prompt:'Vilket bråk är störst: 4/7 eller 5/9?', kind:'choice', options:['4/7','5/9'], key:'4/7', explanation:'4/7 > 5/9. Som sextiotre delar: 36/63 > 35/63.', hint:'Förläng till en gemensam nämnare.'},
 {id:13, prompt:'Ordna från minst till störst: 2/3, 5/8, 3/4.', kind:'order', key:'5/8, 2/3, 3/4', explanation:'5/8 < 2/3 < 3/4. Som tjugofjärdedelar: 15/24 < 16/24 < 18/24.', hint:'Skriv alla bråken med samma nämnare.'},
 {id:14, prompt:'Jämför 7/10 och 5/7.', kind:'relation', key:'<', explanation:'7/10 < 5/7. Som sjuttiondelar: 49/70 < 50/70.', hint:'Förläng till en gemensam nämnare.'},
 {id:15, prompt:'Vilket är störst: 7/8 eller 8/9?', kind:'choice', options:['7/8','8/9'], key:'8/9', explanation:'7/8 < 8/9. Till en hel saknas 1/8 respektive 1/9.', hint:'Jämför delarna som saknas till en hel.'},
 {id:16, prompt:'Sant eller falskt: 5/6 > 7/9. Förklara med en gemensam nämnare eller en annan strategi.', kind:'reason', options:['Sant','Falskt'], key:'Sant', explanation:'Sant: 5/6 = 15/18 och 7/9 = 14/18.', hint:'Vilken nämnare kan både sjättedelar och niondelar förlängas till?'},
 {id:17, prompt:'Hitta ett bråk med nämnaren 12 som ligger mellan 1/2 och 2/3.', kind:'between12', key:'7/12', explanation:'Exempel: 7/12. Gränserna är 6/12 och 8/12, så med nämnaren 12 är 7/12 det enda möjliga svaret.', hint:'Skriv båda gränserna med nämnaren 12.'},
 {id:18, prompt:'Vilket ligger närmast 1/2: 4/9 eller 5/11?', kind:'choice', options:['4/9','5/11'], key:'5/11', explanation:'5/11 ligger närmast 1/2. Avstånden är 1/18 och 1/22; 1/22 är mindre.', hint:'Jämför avståndet från varje bråk till en halv.'},
 {id:19, prompt:'Två elever har 3 av 5 respektive 5 av 8 lika stora delar. Vem har störst andel?', kind:'choice', options:['Eleven med 3 av 5','Eleven med 5 av 8'], key:'Eleven med 5 av 8', explanation:'5/8 är större än 3/5. Som fyrtiondelar: 25/40 > 24/40.', hint:'Skriv andelarna som bråk och jämför med samma nämnare.'},
 {id:20, prompt:'Hitta två olika bråk som båda ligger mellan 2/3 och 3/4.', kind:'between2', key:'17/24, 8/11', explanation:'Exempel: 17/24 och 8/11. Båda är större än 2/3 och mindre än 3/4. Andra par med två olika värden inom gränserna godtas också.', hint:'Förläng gränserna så att det finns fler heltal mellan täljarna.'},
];
export function parseTrainingFraction(text) {
 const m=/^\s*(\d{1,6})\s*\/\s*(\d{1,6})\s*$/.exec(text);
 if(!m) return null;
 const n=Number(m[1]),d=Number(m[2]);
 return d>0?{n,d}:null;
}
const trainingCompare=(a,b)=>Math.sign(a.n*b.d-b.n*a.d);
const trainingList=text=>text.split(/\s*(?:,|;|<|\boch\b)\s*/i).map(parseTrainingFraction);
export function gradeComparison(id,answerText) {
 const exercise=comparisonExercises.find(q=>q.id===id);
 if(!exercise||typeof answerText!=='string'||answerText.length>2000) return {valid:false,error:'Ogiltigt svar.'};
 const text=answerText.trim();
 let correct=false;
 if(exercise.kind==='relation') {
  if(!['<','>','='].includes(text))return {valid:false,error:'Välj ett jämförelsetecken.'};
  correct=text===exercise.key;
 } else if(exercise.kind==='choice') {
  if(!exercise.options.includes(text))return {valid:false,error:'Välj ett svarsalternativ.'};
  correct=text===exercise.key;
 } else if(exercise.kind==='reason') {
  const match=/^(Sant|Falskt)\s*\|\s*([\s\S]+)$/.exec(text);
  if(!match||match[2].trim().length<3)return {valid:false,error:'Välj sant eller falskt och skriv din förklaring.'};
  correct=match[1]===exercise.key;
 } else if(exercise.kind==='between12') {
  const f=parseTrainingFraction(text);
  if(!f)return {valid:false,error:'Skriv ett bråk med täljare och nämnare.'};
  correct=f.d===12&&trainingCompare(f,{n:1,d:2})>0&&trainingCompare(f,{n:2,d:3})<0;
 } else {
  const fractions=trainingList(text),expectedCount=exercise.kind==='between2'?2:3;
  if(fractions.length!==expectedCount||fractions.some(f=>!f))return {valid:false,error:`Skriv ${expectedCount} bråk, åtskilda med komma.`};
  if(exercise.kind==='between2')correct=fractions.every(f=>trainingCompare(f,{n:2,d:3})>0&&trainingCompare(f,{n:3,d:4})<0)&&trainingCompare(fractions[0],fractions[1])!==0;
  else {const expected=trainingList(exercise.key);correct=fractions.every((f,i)=>trainingCompare(f,expected[i])===0)}
 }
 return {valid:true,correct,explanation:exercise.explanation};
}
