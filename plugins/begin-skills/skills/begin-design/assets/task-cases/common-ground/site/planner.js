/* Common Ground's actual programme and state rules, shared by the page and local checks. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CommonGround = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STORAGE_KEY = 'common-ground.visit-plan.v1';
  const workshops = [
    { id: 'clay', title: 'Clay basics', category: 'Making', fee: 48, duration: '2 hours', level: 'Beginner',
      strapline: 'Get your hands into it',
      description: 'Learn to pinch, shape and smooth a small clay bowl. Start with a ball of clay and follow its possibilities, one gentle press at a time.',
      preparation: 'Wear something you can get a little messy. The fictional session includes clay and simple hand tools; no equipment or experience is needed.',
      art: 'art/clay.svg', alt: 'Two hands pinching a terracotta bowl with a wooden tool nearby', caption: 'A small bowl starts with a small gesture.',
      dates: [
        { value: '2026-11-14T10:00', label: 'Saturday 14 November 2026 · 10:00' },
        { value: '2026-11-21T10:00', label: 'Saturday 21 November 2026 · 10:00' }
      ] },
    { id: 'walk', title: 'Walk and notice', category: 'Exploring', fee: 24, duration: '90 minutes', level: 'All levels',
      strapline: 'Let the everyday surprise you',
      description: 'Follow a gentle noticing walk with small prompts for looking closer. Find an overlooked color, a curious shape and a detail you might usually pass by.',
      preparation: 'Wear comfortable shoes and dress for the weather. The fictional session includes a simple paper noticing map. Bring water and your curiosity; no experience is needed.',
      art: 'art/walk.svg', alt: 'A looping dotted route across a folded neighborhood map, passing a tree, flower, house and eye', caption: 'There is always a detail worth a detour.',
      dates: [
        { value: '2026-11-15T09:30', label: 'Sunday 15 November 2026 · 09:30' },
        { value: '2026-11-22T09:30', label: 'Sunday 22 November 2026 · 09:30' }
      ] },
    { id: 'print', title: 'Print a little poster', category: 'Making', fee: 36, duration: '2 hours', level: 'Beginner',
      strapline: 'Give a small idea a bold shape',
      description: 'Cut a simple paper stencil, try a roller and make a little poster of your own. Explore how a shape and a color can turn an everyday idea into something worth keeping.',
      preparation: 'Wear something you can get a little inky. The fictional session includes paper, stencils, rollers and ink. Bring an idea if you like, or find one as you go.',
      art: 'art/print.svg', alt: 'A handmade blue and yellow flower poster beside a paper stencil and printing roller', caption: 'A simple shape can say a surprising amount.',
      dates: [
        { value: '2026-11-14T14:00', label: 'Saturday 14 November 2026 · 14:00' },
        { value: '2026-11-28T14:00', label: 'Saturday 28 November 2026 · 14:00' }
      ] }
  ];
  const findWorkshop = id => workshops.find(workshop => workshop.id === id);
  const dateLabel = (id, value) => findWorkshop(id)?.dates.find(date => date.value === value)?.label || 'Choose a date';
  const money = amount => '$' + amount;
  function quantity(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const number = Number(value);
    return Number.isInteger(number) && number >= 1 && number <= 4 ? number : null;
  }
  const initial = () => ({ workshopId: 'clay', date: '', people: '1', filter: 'All' });
  function validate(choice) {
    const workshop = findWorkshop(choice.workshopId);
    const errors = {};
    if (!workshop || !workshop.dates.some(date => date.value === choice.date)) errors.date = 'Choose an offered date for this workshop.';
    if (quantity(choice.people) === null) errors.people = 'Enter a whole number from 1 to 4 people.';
    return errors;
  }
  function planFromChoice(choice) {
    if (Object.keys(validate(choice)).length) return null;
    return { version: 1, workshopId: choice.workshopId, date: choice.date, people: quantity(choice.people) };
  }
  function parseSaved(raw) {
    if (raw === null || raw === undefined) return null;
    const value = JSON.parse(raw);
    if (!value || value.version !== 1 || typeof value.people !== 'number' || !findWorkshop(value.workshopId) || Object.keys(validate(value)).length) throw new Error('Invalid saved plan');
    return { version: 1, workshopId: value.workshopId, date: value.date, people: value.people };
  }
  function fromSaved(saved) {
    return { workshopId: saved.workshopId, date: saved.date, people: String(saved.people), filter: 'All' };
  }
  function selectWorkshop(choice, id) {
    const workshop = findWorkshop(id);
    if (!workshop) return choice;
    return { ...choice, workshopId: id, date: workshop.dates.some(date => date.value === choice.date) ? choice.date : '' };
  }
  function filterChoice(choice, filter) {
    if (!['All', 'Making', 'Exploring'].includes(filter)) return choice;
    let next = { ...choice, filter };
    const available = workshops.filter(workshop => filter === 'All' || workshop.category === filter);
    if (!available.some(workshop => workshop.id === next.workshopId)) next = selectWorkshop(next, available[0].id);
    return next;
  }
  const matches = (choice, saved) => Boolean(saved && choice.workshopId === saved.workshopId && choice.date === saved.date && quantity(choice.people) === saved.people);
  function summary(choice) {
    const workshop = findWorkshop(choice.workshopId);
    const people = quantity(choice.people);
    return { workshop: workshop.title, date: dateLabel(workshop.id, choice.date), people: people === null ? 'Enter 1–4 people' : people + (people === 1 ? ' person' : ' people'), calculation: people === null ? 'Enter a valid quantity' : money(workshop.fee) + ' × ' + people, total: people === null ? '—' : money(workshop.fee * people) };
  }
  return { workshops, STORAGE_KEY, findWorkshop, dateLabel, money, quantity, initial, validate, planFromChoice, parseSaved, fromSaved, selectWorkshop, filterChoice, matches, summary };
}));
