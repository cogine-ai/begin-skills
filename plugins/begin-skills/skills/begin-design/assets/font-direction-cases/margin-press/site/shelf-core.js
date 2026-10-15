(function (root) {
  'use strict';
  const BOOKS = Object.freeze([
    {id:'mp01',title:'The Other Side of the Weather',author:'Inès Valette',translator:'Mara Ellis',language:'French',pages:144,minutes:105},
    {id:'mp02',title:'Instructions for Leaving the Island',author:'Tomás Leal',translator:'Rowan Bell',language:'Portuguese',pages:192,minutes:145},
    {id:'mp03',title:'A Room Full of Borrowed Names',author:'Emi Arakawa',translator:'Hana Price',language:'Japanese',pages:128,minutes:95},
    {id:'mp04',title:'What the River Kept',author:'Luka Marin',translator:'Nina Cole',language:'Croatian',pages:160,minutes:120},
    {id:'mp05',title:'No One Calls After Midnight',author:'Sofia Ranta',translator:'Leah North',language:'Finnish',pages:112,minutes:80}
  ].map(Object.freeze));
  const KEY = 'begin-margin-press-reading-shelf-v1';
  function validate(input) {
    if (!input || typeof input !== 'object' || !Array.isArray(input.ids)) throw new Error('Choose at least one book.');
    if (!input.ids.length) throw new Error('Choose at least one book.');
    if (input.ids.length > BOOKS.length || new Set(input.ids).size !== input.ids.length || input.ids.some(id => !BOOKS.some(book => book.id === id))) throw new Error('The selection contains an unknown or repeated book.');
    if (typeof input.title !== 'string' || !input.title.trim() || input.title.length > 70) throw new Error('Give your shelf a name of 1 to 70 characters.');
    if (typeof input.note !== 'string' || input.note.length > 240) throw new Error('Keep your note to 240 characters or fewer.');
    return {ids:BOOKS.filter(book => input.ids.includes(book.id)).map(book => book.id),title:input.title.trim(),note:input.note.trim()};
  }
  function selected(ids) {return BOOKS.filter(book => ids.includes(book.id));}
  function totals(ids) {return selected(ids).reduce((sum, book) => ({count:sum.count+1,pages:sum.pages+book.pages,minutes:sum.minutes+book.minutes}),{count:0,pages:0,minutes:0});}
  function duration(minutes) {const hours=Math.floor(minutes/60), rest=minutes%60;return hours ? `${hours} h${rest ? ` ${rest} min` : ''}` : `${rest} min`;}
  function signature(input) {return JSON.stringify({ids:BOOKS.filter(book=>input.ids.includes(book.id)).map(book=>book.id),title:input.title.trim(),note:input.note.trim()});}
  function prepare(input) {
    const basis=validate(input), sum=totals(basis.ids);
    const lines=['MARGIN PRESS',basis.title,'Reading shelf','',`${sum.count} ${sum.count===1?'book':'books'} · ${sum.pages} pages · ${sum.minutes} reading minutes (${duration(sum.minutes)})`,''];
    selected(basis.ids).forEach((book,index)=>{
      lines.push(`${index+1}. ${book.title}`,`   ${book.author}`,`   Translated from ${book.language} by ${book.translator}`,`   ${book.pages} pages · ${book.minutes} reading minutes`,'');
    });
    if(basis.note) lines.push('Note',basis.note,'');
    lines.push('Fictional catalogue. Reading times are illustrative estimates.');
    return {basis,totals:sum,text:lines.join('\n')+'\n'};
  }
  function serialize(result) {return JSON.stringify({version:1,basis:result.basis,text:result.text});}
  function restore(raw) {
    const saved=JSON.parse(raw);
    if(!saved || saved.version!==1 || typeof saved.text!=='string') throw new Error('The kept shelf could not be read.');
    const result=prepare(saved.basis);
    if(result.text!==saved.text) throw new Error('The kept shelf does not match this catalogue.');
    return result;
  }
  const api=Object.freeze({BOOKS,KEY,validate,selected,totals,duration,signature,prepare,serialize,restore});
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.MarginShelf=api;
})(typeof window!=='undefined'?window:globalThis);
