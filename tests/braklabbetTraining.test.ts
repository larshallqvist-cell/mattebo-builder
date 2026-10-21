import { test, expect } from "bun:test";
import { gradeComparison } from "../supabase/functions/braklabbet-content/source/comparison-exercises.js";
import { parseTrainingMessage } from "../src/lib/braklabbetTraining";
const keys=['3/4','2/5','<','>','5/6','Sant','1/4, 1/2, 3/4','<','<','>','<','4/7','5/8, 2/3, 3/4','<','8/9','Sant | 5/6 = 15/18 och 7/9 = 14/18','7/12','5/11','Eleven med 5 av 8','17/24, 8/11'];
keys.forEach((answer,i)=>test(`Originalfacit ${i+1}`,()=>expect(gradeComparison(i+1,answer).correct).toBe(true)));
test('17 kräver nämnare 12 och strikta gränser',()=>{
 for(const answer of ['6/12','8/12','14/24','9/12'])expect(gradeComparison(17,answer).correct).toBe(false);
});
test('20 accepterar andra giltiga bråkpar',()=>expect(gradeComparison(20,'11/16, 7/10').correct).toBe(true));
test('20 nekar gränser och samma värde',()=>{
 for(const answer of ['2/3, 7/10','7/10, 3/4','7/10, 14/20','1/2, 7/10'])expect(gradeComparison(20,answer).correct).toBe(false);
});
test('fel svar registreras som fel',()=>expect(gradeComparison(1,'1/4').correct).toBe(false));
test('16 kräver förklaring och nekar falskt',()=>{
 expect(gradeComparison(16,'Sant | ').valid).toBe(false);
 expect(gradeComparison(16,'Falskt | 15/18 < 14/18').correct).toBe(false);
});
test('meddelanden kan inte välja användare eller facit',()=>{
 const d={type:'braklabbet:training-answer',request_id:'12345678-1234-4123-8123-123456789012',exercise_id:20,answer:'11/16, 7/10',hint_used:true};
 expect(parseTrainingMessage(d)).not.toBeNull();
 for(const bad of [{...d,user_id:'another'},{...d,is_correct:true},{...d,exercise_id:21},{...d,hint_used:'true'}])expect(parseTrainingMessage(bad)).toBeNull();
});