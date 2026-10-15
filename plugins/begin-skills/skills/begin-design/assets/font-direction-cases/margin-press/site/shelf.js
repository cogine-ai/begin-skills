(function () {
  'use strict';
  const model=window.MarginShelf, $=id=>document.getElementById(id);
  const form=$('shelf-form'), inputs=[...form.querySelectorAll('input[name="books"]')];
  let result=null, keptRaw=null, storageAvailable=true;
  function draft() {return {ids:inputs.filter(input=>input.checked).map(input=>input.value),title:$('shelf-title').value,note:$('shelf-note').value};}
  function isCurrent() {return Boolean(result && model.signature(draft())===model.signature(result.basis));}
  function message(text) {$('action-message').textContent=text;}
  function storageStatus(text) {$('storage-message').hidden=!text;$('storage-message').textContent=text;}
  function update() {
    const sum=model.totals(draft().ids);
    $('selected-count').textContent=sum.count;$('selected-pages').textContent=sum.pages;$('selected-minutes').textContent=sum.minutes;
    inputs.forEach(input=>{input.closest('label').querySelector('.choice-label').textContent=input.checked?'Added':'Add';});
    const current=isCurrent();
    $('keep').disabled=!current || !storageAvailable;
    $('download').disabled=!current;
    $('restore').disabled=!keptRaw || !storageAvailable;
    $('forget').disabled=!keptRaw || !storageAvailable;
    if(result) {
      $('result-state').textContent=current?'Current':'Earlier selection';
      $('result-state').className='state-label '+(current?'current':'stale');
      $('result-hint').hidden=false;
      $('result-hint').textContent=current?'This list matches your open shelf. Keep it or download it below.':'Your open shelf has changed. The earlier list remains here. Prepare again before keeping or downloading.';
    } else {
      $('result-state').textContent='Not prepared';$('result-state').className='state-label';
      $('result-hint').hidden=false;$('result-hint').textContent='Prepare your selection to see the complete reading list here.';
    }
  }
  function display(next,focus) {
    result=next;$('result-content').hidden=false;$('result-title').textContent=next.basis.title;
    const duration=model.duration(next.totals.minutes);
    window.MarginReadingText.render($('result-summary'),`${next.totals.count} ${next.totals.count===1?'book':'books'} · ${next.totals.pages} pages · ${duration}`,duration);
    window.MarginReadingText.render($('result-text'),next.text,`(${duration})`);
    update();
    if(focus){$('prepared-title').focus({preventScroll:true});$('prepared').scrollIntoView({behavior:'auto',block:'start'});}
  }
  function loadSaved() {
    try {keptRaw=localStorage.getItem(model.KEY);
      if(keptRaw){try{model.restore(keptRaw);storageStatus('A kept shelf is available in this browser. Restore kept to open it.');}catch(error){storageStatus('The kept shelf could not be read. You can prepare a new shelf or forget the unreadable version.');}}
    } catch(error) {storageAvailable=false;keptRaw=null;storageStatus('Browser storage is unavailable. You can prepare and download a shelf, but cannot keep it here.');}
  }
  form.addEventListener('input',()=>{$('form-error').hidden=true;$('shelf-title').removeAttribute('aria-invalid');message('');update();});
  form.addEventListener('submit',event=>{
    event.preventDefault();
    try {const next=model.prepare(draft());$('form-error').hidden=true;$('shelf-title').removeAttribute('aria-invalid');message('');display(next,true);}
    catch(error){$('form-error').textContent=error.message;$('form-error').hidden=false;if(!draft().title.trim() || draft().title.length>70){$('shelf-title').setAttribute('aria-invalid','true');$('shelf-title').focus();}else{$('form-error').scrollIntoView({behavior:'auto',block:'center'});}update();}
  });
  $('keep').addEventListener('click',()=>{
    if(!isCurrent() || !storageAvailable)return;
    try {const raw=model.serialize(result);localStorage.setItem(model.KEY,raw);keptRaw=raw;storageStatus('One prepared shelf is kept in this browser. Keeping another replaces it.');message('Shelf kept. Your open shelf remains here.');update();}
    catch(error){message('The browser could not keep this shelf. Download the current list instead.');}
  });
  $('download').addEventListener('click',()=>{
    if(!isCurrent())return;
    const url=URL.createObjectURL(new Blob([result.text],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='margin-press-reading-shelf.txt';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Your current reading list was sent to the browser download.');
  });
  $('restore').addEventListener('click',()=>{
    if(!keptRaw || !storageAvailable)return;
    try {const next=model.restore(keptRaw);inputs.forEach(input=>{input.checked=next.basis.ids.includes(input.value);});$('shelf-title').value=next.basis.title;$('shelf-note').value=next.basis.note;$('form-error').hidden=true;$('shelf-title').removeAttribute('aria-invalid');display(next,true);message('Kept shelf restored. It replaces the open shelf and its prepared list.');}
    catch(error){message('The kept shelf could not be read. Your open shelf has been preserved.');}
  });
  $('forget').addEventListener('click',()=>{
    try {localStorage.removeItem(model.KEY);keptRaw=null;storageStatus('');message('Kept shelf forgotten. Your open shelf and prepared list remain here.');update();}
    catch(error){message('The browser could not forget the kept shelf. Your open shelf has been preserved.');}
  });
  $('reset').addEventListener('click',()=>{
    inputs.forEach(input=>{input.checked=false;});$('shelf-title').value='Summer crossings';$('shelf-note').value='';result=null;$('result-content').hidden=true;$('result-text').textContent='';$('form-error').hidden=true;$('shelf-title').removeAttribute('aria-invalid');update();message('Open shelf reset. A kept shelf, if present, remains available.');
  });
  loadSaved();update();
})();
