(function () {
  'use strict';
  const M = window.LatchModel;
  const $ = id => document.getElementById(id);
  const state = M.createState();
  let kept = null;
  const message = text => { $('task-status').textContent = text; };
  function storage() { return window.localStorage; }
  function readKept() {
    let result;
    try { result = M.recover(storage()); } catch (error) { result = { ok: false, message: 'Browser storage is unavailable. Prepared comparisons can still be exported.' }; }
    if (result.ok) {
      kept = result.record;
      $('kept-text').textContent = kept ? kept.text : '';
      $('kept-text').hidden = !kept;
      $('kept-summary').textContent = kept ? 'Kept separately: ' + kept.dimensions.centres + ' mm centres / ' + kept.dimensions.thickness + ' mm panel. Current inputs do not change this record.' : 'No comparison is kept in this browser.';
      $('recover-kept').disabled = !kept;
      $('export-kept').disabled = !kept || !state.valid;
      $('forget-kept').disabled = !kept;
      $('kept-status').textContent = kept ? 'One comparison is available after reload.' : '';
    } else {
      kept = null;
      $('kept-text').hidden = true; $('recover-kept').disabled = true; $('export-kept').disabled = true;
      $('forget-kept').disabled = false;
      $('kept-summary').textContent = result.message;
    }
  }
  function resultChoices() {
    const host = $('matches'); host.replaceChildren();
    state.matches.forEach(p => {
      const article = document.createElement('article'); article.className = 'match-item';
      const image = document.createElement('img'); image.src = 'assets/art/' + p.id.toLowerCase() + '.svg'; image.alt = ''; image.width = 360; image.height = 180;
      const content = document.createElement('div'); content.className = 'match-content';
      const id = document.createElement('span'); id.className = 'part-id'; id.textContent = p.id;
      const heading = document.createElement('h3'); heading.textContent = p.name;
      const facts = document.createElement('dl'); facts.className = 'facts';
      [['Mounting centres',p.centres + ' mm'],['Panel thickness',p.min + '–' + p.max + ' mm'],['Overall width',p.width + ' mm'],['Projection',p.projection + ' mm']].forEach(([label,value]) => {
        const pair = document.createElement('div'); const dt = document.createElement('dt'); const dd = document.createElement('dd'); dt.textContent=label; dd.textContent=value; pair.append(dt,dd); facts.append(pair);
      });
      const button = document.createElement('button'); button.type = 'button'; button.className = 'choose'; button.dataset.partId=p.id; button.setAttribute('aria-pressed', String(state.selected.includes(p.id)));
      button.textContent = state.selected.includes(p.id) ? 'Selected for comparison −' : 'Add to comparison +'; button.disabled = !state.valid;
      button.addEventListener('click', () => {
        const result = M.select(state,p.id); if (!result.ok) { message(result.message); return; }
        render(); message(state.selected.length + ' of 2 selected. Prepare the comparison when ready.');
        const fresh = [...host.querySelectorAll('button')].find(b => b.dataset.partId === p.id); if(fresh) fresh.focus();
      });
      content.append(id,heading,facts,button); article.append(image,content); host.append(article);
    });
  }
  function preparedComparison() {
    const host = $('prepared-comparison'); host.replaceChildren();
    host.hidden = !state.prepared;
    $('prepared-export').hidden = !state.prepared;
    if (!state.prepared) return;
    const record = state.prepared;
    const requested = document.createElement('dl'); requested.className = 'requested-dimensions';
    [['Requested mounting centres',record.dimensions.centres + ' mm'],['Requested panel thickness',record.dimensions.thickness + ' mm']].forEach(([label,value]) => {
      const pair = document.createElement('div'); const dt = document.createElement('dt'); const dd = document.createElement('dd');
      dt.textContent = label; dd.textContent = value; pair.append(dt,dd); requested.append(pair);
    });
    const rangeNote = document.createElement('p'); rangeNote.className = 'range-note'; rangeNote.textContent = 'Panel thickness ranges include both endpoints.';
    const components = document.createElement('div'); components.className = 'comparison-parts';
    record.ids.forEach(id => {
      const part = M.PARTS.find(p => p.id === id);
      const article = document.createElement('article'); article.className = 'compared-part';
      const identity = document.createElement('span'); identity.className = 'part-id'; identity.textContent = part.id;
      const heading = document.createElement('h3'); heading.textContent = part.name;
      const facts = document.createElement('dl'); facts.className = 'comparison-facts';
      [['Mounting centres',part.centres + ' mm'],['Panel thickness range',part.min + '–' + part.max + ' mm'],['Overall width',part.width + ' mm'],['Projection',part.projection + ' mm']].forEach(([label,value]) => {
        const pair = document.createElement('div'); const dt = document.createElement('dt'); const dd = document.createElement('dd');
        dt.textContent = label; dd.textContent = value; pair.append(dt,dd); facts.append(pair);
      });
      article.append(identity,heading,facts); components.append(article);
    });
    host.append(requested,rangeNote,components);
  }
  function render() {
    ['centres','thickness'].forEach(name => {
      const error = state.errors[name] || ''; $(name+'-error').textContent = error;
      $(name).setAttribute('aria-invalid',String(!!error));
    });
    resultChoices();
    $('matches-heading').textContent = state.dimensions ? (state.valid ? state.matches.length + (state.matches.length === 1 ? ' component fits' : ' components fit') : 'Previous matches · check dimensions') : 'Matching components';
    $('matches-note').textContent = !state.dimensions ? 'Enter both dimensions to see the matching components.' : !state.valid ? 'Invalid input preserves the previous comparison text. Selection, keeping and export are paused until the dimensions are valid.' : !state.matches.length ? 'No matches for ' + state.dimensions.centres + ' mm centres and a ' + state.dimensions.thickness + ' mm panel. Try another measurement; a close centre distance does not count as a fit.' : 'For ' + state.dimensions.centres + ' mm centres and a ' + state.dimensions.thickness + ' mm panel. Select one or two below.';
    $('prepare').disabled = !state.valid || !state.selected.length;
    $('prepare').textContent = 'Prepare comparison' + (state.selected.length ? ' (' + state.selected.length + ')' : '');
    $('prepared-text').textContent = state.prepared ? state.prepared.text : '';
    $('prepared-text').hidden = !state.prepared;
    preparedComparison();
    $('prepared-note').textContent = state.prepared ? (state.valid ? 'Prepared for the requested dimensions below. Keep this comparison or inspect its exact export text.' : 'Previous prepared comparison is preserved. Correct the inputs before keeping or exporting.') : 'Choose at least one matching component, then prepare your record.';
    $('keep').disabled = !M.eligible(state); $('export').disabled = !M.eligible(state);
    $('export-kept').disabled = !kept || !state.valid;
  }
  function dimensionsChanged() {
    const hadPrepared = !!state.prepared;
    const outcome = M.update(state,$('centres').value,$('thickness').value);
    render();
    if (outcome.invalid) message('Check the dimension fields. Previous prepared text is retained; keep and export are paused.');
    else if (outcome.changed && hadPrepared) message('Dimensions changed. The previous current comparison was cleared. A separately kept comparison is unchanged.');
    else if (outcome.changed) message('Valid dimensions. ' + state.matches.length + ' matching components.');
    else message('Measurements checked. ' + state.matches.length + ' matching components.');
  }
  function download(text, name) {
    const blob = new Blob([text], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url; link.download=name; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),1000);
  }
  $('dimensions-form').addEventListener('submit',event => { event.preventDefault(); dimensionsChanged(); });
  ['centres','thickness'].forEach(name => $(name).addEventListener('input',dimensionsChanged));
  $('prepare').addEventListener('click',() => {
    if (!M.prepare(state)) { message('Enter valid dimensions and select one or two matching components.'); return; }
    render(); message('Comparison prepared. It has not been kept yet.');
  });
  $('keep').addEventListener('click',() => {
    let result; try { result=M.keep(state,storage()); } catch(error) { result={ok:false,message:'Browser storage is unavailable. Your prepared text is still here; export it instead.'}; }
    if(result.ok) { readKept(); message('Comparison kept in this browser. Keeping another comparison replaces this one.'); }
    else message(result.message);
  });
  $('export').addEventListener('click',() => {
    if(!M.eligible(state)) { message('Correct the inputs and prepare a current comparison before export.'); return; }
    download(state.prepared.text,'latch-parts-comparison.txt'); message('Exact prepared text exported as latch-parts-comparison.txt.');
  });
  $('recover-kept').addEventListener('click',() => {
    readKept(); if(!kept) return;
    $('centres').value=String(kept.dimensions.centres); $('thickness').value=String(kept.dimensions.thickness);
    M.update(state,$('centres').value,$('thickness').value); state.selected=[...kept.ids]; state.prepared=M.decode(JSON.stringify(kept)); render(); message('Kept comparison recovered into the workbench. Its text is unchanged.');
  });
  $('export-kept').addEventListener('click',() => {
    if(!state.valid || !kept) { message('Valid input is required before exporting. Recover the kept comparison to restore its measurements.'); return; }
    download(kept.text,'latch-parts-kept-comparison.txt'); $('kept-status').textContent='Exact kept text exported as latch-parts-kept-comparison.txt.';
  });
  $('forget-kept').addEventListener('click',() => {
    let result; try { result=M.forget(storage()); } catch(error) { result={ok:false,message:'Browser storage is unavailable; the comparison could not be forgotten.'}; }
    if(result.ok) { readKept(); $('kept-status').textContent='Kept comparison forgotten. Your current prepared text is unchanged.'; } else $('kept-status').textContent=result.message;
  });
  $('check-storage').addEventListener('click',readKept);
  readKept(); render();
})();
