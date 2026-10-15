(function(root){
  'use strict';
  const catalogue=typeof module!=='undefined'&&module.exports?require('./catalogue.js'):root.FormCatalogue;
  const STORAGE_KEY='form-bureau.shortlist.v1';
  const clone=input=>({ids:[...input.ids],label:input.label,note:input.note});
  const money=cents=>(cents/100).toFixed(2);
  const initial=()=>({input:{ids:[],label:'My workspace',note:''},revision:0,prepared:null});
  function validInput(input){
    return Boolean(input&&Array.isArray(input.ids)&&input.ids.length<=6&&new Set(input.ids).size===input.ids.length&&input.ids.every(id=>typeof id==='string'&&catalogue.byId(id))&&typeof input.label==='string'&&input.label.length<=60&&typeof input.note==='string'&&input.note.length<=600);
  }
  function validate(input){
    if(!validInput(input))return {ok:false,message:'The shortlist contains an unsupported value. Reload kept work or clear the selections.'};
    if(!input.ids.length)return {ok:false,field:'selection',message:'Select at least one object before preparing a shortlist.'};
    if(!input.label.trim())return {ok:false,field:'label',message:'Give this workspace a name before preparing the shortlist.'};
    return {ok:true};
  }
  function edit(state,field,value){
    if(!['ids','label','note'].includes(field))throw new TypeError('Unknown shortlist field');
    if(JSON.stringify(state.input[field])===JSON.stringify(value))return state;
    return {...state,input:{...state.input,[field]:Array.isArray(value)?[...value]:value},revision:state.revision+1};
  }
  const isCurrent=state=>Boolean(state.prepared&&state.prepared.revision===state.revision&&state.prepared.signature===JSON.stringify(state.input));
  function prepare(state){
    const valid=validate(state.input);
    if(!valid.ok)return {...valid,state};
    return {ok:true,state:{...state,prepared:{input:clone(state.input),revision:state.revision,version:(state.prepared?.version||0)+1,signature:JSON.stringify(state.input)}}};
  }
  function keep(state){
    if(!isCurrent(state))return {ok:false,message:'Prepare the current selection before keeping it.'};
    return {ok:true,record:{schema:1,catalogueRevision:catalogue.revision,input:clone(state.input),revision:state.revision,prepared:{...state.prepared,input:clone(state.prepared.input)}}};
  }
  function restore(record){
    if(!record||record.schema!==1||record.catalogueRevision!==catalogue.revision||!validInput(record.input)||!validate(record.input).ok||!Number.isSafeInteger(record.revision)||record.revision<0)return null;
    const p=record.prepared;
    if(!p||!Number.isSafeInteger(p.version)||p.version<1||p.revision!==record.revision||p.signature!==JSON.stringify(record.input)||JSON.stringify(p.input)!==JSON.stringify(record.input))return null;
    return {input:clone(record.input),revision:record.revision,prepared:{input:clone(record.input),revision:record.revision,version:p.version,signature:JSON.stringify(record.input)}};
  }
  function text(snapshot){
    const rows=snapshot.input.ids.map(id=>catalogue.byId(id));
    return [
      'FORM BUREAU / FICTIONAL OBJECT RESEARCH SHORTLIST',
      'Prepared version: '+String(snapshot.version).padStart(2,'0'),
      'Catalogue revision: '+catalogue.revision,
      'Workspace: '+snapshot.input.label,
      'Objects selected: '+rows.length,
      '',
      ...rows.flatMap((item,index)=>[
        String(index+1).padStart(2,'0')+' / '+item.code+' / '+item.name,
        'Width: '+item.w+' mm | Depth: '+item.d+' mm | Height: '+item.h+' mm',
        'Material: '+item.material,
        'Finish: '+item.finish,
        'Illustrative reference price: USD '+money(item.price),
        'Archive status: '+item.status,
        'Planning note: '+item.use,
        ''
      ]),
      'Workspace note: '+(snapshot.input.note||'None'),
      '',
      'All objects, dimensions, materials, prices and statuses are fictional.',
      'A shortlist is a local research record. It is not an order, quote, reservation or stock check.',
      'No object is offered for purchase. No payment, delivery or real-world suitability has been assessed.',
      ''
    ].join('\n');
  }
  const api={STORAGE_KEY,initial,validate,edit,isCurrent,prepare,keep,restore,text,money};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.FormShortlist=api;
})(typeof window!=='undefined'?window:globalThis);
