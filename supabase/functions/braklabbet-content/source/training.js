import {comparisonExercises,gradeComparison} from './comparison-exercises.js';
// Independent section: does not alter the existing lab state, models or controls.
const trainingRoot=document.getElementById('training');
const trainingState={level:0,id:1,drafts:{},rows:[],hint:{},feedback:null,pending:null,saveError:false,ready:false,loadError:false};
const trainingEscape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const trainingMath=s=>trainingEscape(s).replace(/(\d+)\/(\d+)/g,(_,n,d)=>`<span class="fraction"><span class="num">${n}</span><span class="den">${d}</span></span>`);
function trainingRender(){
 const q=comparisonExercises.find(q=>q.id===trainingState.id),draft=trainingState.drafts[q.id]||{answer:'',reason:''};
 const bounds=[[1,7],[8,14],[15,20]][trainingState.level];
 const rows=trainingState.rows.filter(r=>r.exercise_id===q.id),done=rows.some(r=>r.is_correct);
 const options=q.kind==='relation'?['<','=','>']:q.options;
 const feedback=trainingState.feedback;
 trainingRoot.innerHTML=`<div class="panel-heading"><div><h2>Träna på att jämföra bråk</h2></div><span class="mission-check">${new Set(trainingState.rows.filter(r=>r.is_correct).map(r=>r.exercise_id)).size} / 20 klara</span></div>
 <div class="training-levels segmented" aria-label="Välj träningsnivå">${['Start','Fortsätt','Utmana'].map((label,i)=>`<button data-training="level" data-value="${i}" aria-pressed="${trainingState.level===i}">${label} · ${[[1,7],[8,14],[15,20]][i].join('–')}</button>`).join('')}</div>
 <nav class="training-numbers" aria-label="Välj uppgift">${comparisonExercises.filter(x=>x.id>=bounds[0]&&x.id<=bounds[1]).map(x=>`<button class="task-button" data-training="question" data-value="${x.id}" aria-current="${x.id===q.id?'step':'false'}" aria-label="Uppgift ${x.id}${trainingState.rows.some(r=>r.exercise_id===x.id&&r.is_correct)?', klar':''}">${x.id}${trainingState.rows.some(r=>r.exercise_id===x.id&&r.is_correct)?' ✓':''}</button>`).join('')}</nav>
 <div class="mission training-question"><div class="mission-head"><span class="visual-label">UPPGIFT ${q.id}</span>${done?'<span class="mission-check">✓ Klart</span>':''}</div><p class="mission-instruction">${trainingMath(q.prompt)}</p>
 ${options?`<div class="mission-options">${options.map(o=>`<button class="mission-option" data-training="answer" data-value="${trainingEscape(o)}" aria-label="Svara ${trainingEscape(o)}" aria-pressed="${draft.answer===o}" ${trainingState.pending?'disabled':''}>${trainingMath(o)}</button>`).join('')}</div>`:`<label class="training-label" for="training-answer">Ditt svar</label><input id="training-answer" class="training-input" maxlength="180" autocomplete="off" value="${trainingEscape(draft.answer)}" placeholder="${q.kind==='between12'?'täljare/nämnare':q.kind==='between2'?'bråk, bråk':'bråk, bråk, bråk'}" ${trainingState.pending?'disabled':''}>`}
 ${q.kind==='reason'?`<label class="training-label" for="training-reason">Din förklaring</label><textarea id="training-reason" class="training-input" maxlength="1700" rows="3" ${trainingState.pending?'disabled':''}>${trainingEscape(draft.reason)}</textarea>`:''}
 <div class="training-actions">${!options||q.kind==='reason'?`<button class="button primary" data-training="submit" ${trainingState.pending||!trainingState.ready?'disabled':''}>Svara</button>`:''}<button class="button quiet" data-training="hint" ${trainingState.pending?'disabled':''}>Ledtråd</button><button class="button quiet" data-training="restart" ${trainingState.pending?'disabled':''}>Börja om</button></div>
 ${trainingState.hint[q.id]?`<p class="hint">${trainingEscape(q.hint)}</p>`:''}
 ${feedback?`<p class="feedback ${feedback.correct?'':'retry'}" role="status">${feedback.valid?(feedback.correct?'Rätt! ':'Inte riktigt. '):''}${trainingMath(feedback.valid?feedback.explanation:feedback.error)}</p>${q.kind==='reason'&&feedback.valid?'<p class="hint">Sant/falskt-svaret rättas automatiskt. Din förklaring sparas för lärarens bedömning.</p>':''}`:''}
 <p class="hint training-save" role="status">${trainingState.loadError?'Sparade resultat kunde inte hämtas.':!trainingState.ready?'Hämtar dina resultat…':trainingState.pending&&!trainingState.saveError?'Sparar ditt svar…':trainingState.saveError?'Svaret har inte sparats. Försök igen.':rows.length?`${rows.length} sparade försök · ${new Date(rows[rows.length-1].answered_at).toLocaleString('sv-SE')}`:''}</p>
 ${trainingState.saveError?'<button class="button secondary" data-training="retry">Försök spara igen</button>':''}${trainingState.loadError?'<button class="button secondary" data-training="reload">Hämta resultat igen</button>':''}
 <div class="training-actions"><button class="button secondary" data-training="previous" ${q.id===1||trainingState.pending?'disabled':''}>← Föregående</button><button class="button secondary" data-training="next" ${q.id===20||trainingState.pending?'disabled':''}>Nästa uppgift →</button></div></div>`;
}
function trainingSubmit(){
 if(trainingState.pending||!trainingState.ready)return;
 const q=comparisonExercises.find(x=>x.id===trainingState.id),draft=trainingState.drafts[q.id]||{answer:'',reason:''};
 const text=q.kind==='reason'?draft.answer+' | '+draft.reason:draft.answer;
 trainingState.feedback=gradeComparison(q.id,text);
 if(trainingState.feedback.valid){trainingState.pending={type:'braklabbet:training-answer',request_id:crypto.randomUUID(),exercise_id:q.id,answer:text,hint_used:!!trainingState.hint[q.id]};trainingState.saveError=false;parent.postMessage(trainingState.pending,'*')}
 trainingRender();
}
trainingRoot.addEventListener('input',e=>{if(!['training-answer','training-reason'].includes(e.target.id))return;const draft=trainingState.drafts[trainingState.id]??={answer:'',reason:''};draft[e.target.id==='training-answer'?'answer':'reason']=e.target.value});
trainingRoot.addEventListener('click',e=>{
 const button=e.target.closest('[data-training]');if(!button||button.disabled)return;
 const action=button.dataset.training;
 if(action==='retry'){trainingState.saveError=false;parent.postMessage(trainingState.pending,'*');trainingRender();return}
 if(action==='reload'){parent.postMessage({type:'braklabbet:training-ready'},'*');return}
 if(trainingState.pending)return;
 if(action==='answer'){const draft=trainingState.drafts[trainingState.id]??={answer:'',reason:''};draft.answer=button.dataset.value;const q=comparisonExercises.find(x=>x.id===trainingState.id);if(q.kind!=='reason'){trainingSubmit();return}}
 if(action==='submit'){trainingSubmit();return}
 if(action==='hint')trainingState.hint[trainingState.id]=true;
 if(action==='restart'){trainingState.drafts[trainingState.id]={answer:'',reason:''};trainingState.feedback=null;trainingState.hint[trainingState.id]=false}
 if(action==='level'||action==='question'||action==='next'||action==='previous'){
  if(action==='level')trainingState.id=[1,8,15][Number(button.dataset.value)];
  else if(action==='question')trainingState.id=Number(button.dataset.value);
  else trainingState.id+=action==='next'?1:-1;
  trainingState.level=trainingState.id<=7?0:trainingState.id<=14?1:2;trainingState.feedback=null;
 }
 trainingRender();
});
window.addEventListener('message',e=>{
 if(e.source!==parent||!e.data||typeof e.data!=='object')return;
 const d=e.data;
 if(d.type==='braklabbet:training-results'&&Array.isArray(d.rows)){
  trainingState.rows=d.rows;trainingState.ready=true;trainingState.loadError=false;
  for(const row of d.rows){trainingState.drafts[row.exercise_id]={answer:row.answer.split(' | ')[0],reason:row.answer.split(' | ').slice(1).join(' | ')};if(row.hint_used)trainingState.hint[row.exercise_id]=true}
  trainingRender();
 }
 if(d.type==='braklabbet:training-load-error'){trainingState.loadError=true;trainingRender()}
 if(d.type==='braklabbet:training-saved'&&d.request_id===trainingState.pending?.request_id){
  trainingState.rows=trainingState.rows.filter(r=>r.id!==d.row.id);trainingState.rows.push(d.row);trainingState.feedback=gradeComparison(d.row.exercise_id,d.row.answer);trainingState.feedback.correct=d.row.is_correct;trainingState.pending=null;trainingState.saveError=false;trainingRender();
 }
 if(d.type==='braklabbet:training-save-error'&&d.request_id===trainingState.pending?.request_id){trainingState.saveError=true;trainingRender()}
});
trainingRender();parent.postMessage({type:'braklabbet:training-ready'},'*');
