/* State for Northline's local study explorer. Shared by the page and Node checks. */
(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./studies.js') : root.NorthlineStudies);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NorthlineCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (studies) {
  'use strict';
  const ROLES = ['ambient', 'task', 'accent'];
  const TYPES = ['Hospitality', 'Workplace', 'Home'];
  const STORAGE_KEY = 'northline.prepared-brief.v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const findStudy = id => studies.find(study => study.id === id);
  function initial() {
    return {input:{study:'table',type:'Hospitality',title:'',goal:'',layers:{ambient:true,task:true,accent:true}},revision:0,prepared:null};
  }
  function validInput(input) {
    return input && typeof input === 'object' && Boolean(findStudy(input.study)) && TYPES.includes(input.type) &&
      typeof input.title === 'string' && typeof input.goal === 'string' && input.layers &&
      ROLES.every(role => typeof input.layers[role] === 'boolean');
  }
  function change(state, field, value) {
    const next = clone(state);
    let old;
    if (ROLES.includes(field)) { old = next.input.layers[field]; next.input.layers[field] = value; }
    else if (['study','type','title','goal'].includes(field)) { old = next.input[field]; next.input[field] = value; }
    else throw new Error('Unknown brief field.');
    if (!validInput(next.input)) throw new Error('Invalid brief value.');
    if (old !== value) next.revision++;
    return next;
  }
  function prepare(state) {
    const errors = {};
    if (!state.input.title.trim()) errors.title = 'Enter a project title.';
    if (!state.input.goal.trim()) errors.goal = 'Describe what you want the light to help you do.';
    if (Object.keys(errors).length) return {state:clone(state),errors};
    const next = clone(state);
    next.prepared = {input:clone(next.input),revision:next.revision};
    return {state:next,errors};
  }
  const isCurrent = state => Boolean(state.prepared && state.prepared.revision === state.revision);
  const roleNames = layers => ROLES.filter(role => layers[role]).map(role => role[0].toUpperCase()+role.slice(1));
  function serialize(state) {
    if (!isCurrent(state)) throw new Error('Prepare a current brief before saving.');
    return JSON.stringify({schema:1,input:clone(state.prepared.input)});
  }
  function restore(raw) {
    const saved = JSON.parse(raw);
    if (!saved || saved.schema !== 1 || !validInput(saved.input) || !saved.input.title.trim() || !saved.input.goal.trim()) {
      throw new Error('The saved brief is not valid.');
    }
    // Select only the known fields. No stored markup or object prototype is reused.
    const input={study:saved.input.study,type:saved.input.type,title:saved.input.title,goal:saved.input.goal,
      layers:Object.fromEntries(ROLES.map(role=>[role,saved.input.layers[role]]))};
    return {input,revision:0,prepared:{input:clone(input),revision:0}};
  }
  return {ROLES,TYPES,STORAGE_KEY,initial,change,prepare,isCurrent,roleNames,serialize,restore,findStudy,clone};
});
