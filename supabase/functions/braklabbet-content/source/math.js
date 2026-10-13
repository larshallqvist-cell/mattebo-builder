export const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a||1};
export const lcm=(a,b)=>a*b/gcd(a,b);
export const simplify=({n,d})=>{if(d===0)throw new RangeError('Nämnaren kan inte vara noll');const g=gcd(n,d);return {n:n/g*(d<0?-1:1),d:Math.abs(d)/g}};
export function calculate(a,b,op){switch(op){case 'add':return simplify({n:a.n*b.d+b.n*a.d,d:a.d*b.d});case 'sub':return simplify({n:a.n*b.d-b.n*a.d,d:a.d*b.d});case 'mul':return simplify({n:a.n*b.n,d:a.d*b.d});case 'div':if(b.n===0)return null;return simplify({n:a.n*b.d,d:a.d*b.n});default:throw new RangeError('Okänt räknesätt')}}
export const compare=(a,b)=>Math.sign(a.n*b.d-b.n*a.d);
export const mixed=({n,d})=>({sign:n<0?-1:1,whole:Math.floor(Math.abs(n)/d),remainder:Math.abs(n)%d,d});
export const formatNumber=(n,max=3)=>new Intl.NumberFormat('sv-SE',{maximumFractionDigits:max}).format(n);
