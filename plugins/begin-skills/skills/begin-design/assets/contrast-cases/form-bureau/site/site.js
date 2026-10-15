(function(){
  'use strict';
  if(document.getElementById('catalogue-grid'))return;
  try{
    const raw=localStorage.getItem(FormShortlist.STORAGE_KEY);
    const state=raw?FormShortlist.restore(JSON.parse(raw)):null;
    document.querySelectorAll('[data-count]').forEach(el=>{el.textContent=state?state.input.ids.length:0;el.setAttribute('aria-label',(state?state.input.ids.length:0)+' objects kept locally');});
  }catch(_error){/* Navigation remains usable if local storage is unavailable. */}
})();
