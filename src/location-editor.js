const string=(value,max,label)=>{const text=String(value??'').trim();if(text.length>max)throw new Error(`${label} is too long.`);return text;};
export function locationChanges(values){
  const name=string(values.name,120,'Name'),category=string(values.category,60,'Category');
  if(!name||!category)throw new Error('Name and category are required.');
  const list=(value,label)=>{const items=String(value??'').split('\n').map(s=>s.trim()).filter(Boolean);if(items.length>30||items.some(s=>s.length>120))throw new Error(`${label}: use at most 30 entries, each under 120 characters.`);return [...new Set(items)];};
  return {name,category,floor:string(values.floor,100,'Floor'),description:string(values.description,2000,'Description'),opening_hours:string(values.opening_hours,200,'Opening hours'),room:string(values.room,100,'Room'),facilities:list(values.facilities,'Facilities'),aliases:list(values.aliases,'Search names')};
}
