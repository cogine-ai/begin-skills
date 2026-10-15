(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  function element(name, attributes) {
    const node = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
    return node;
  }
  function drawPlot(host, parameters, name) {
    const M = window.WavebenchModel;
    const svg = element('svg', { viewBox: '0 0 1000 400', preserveAspectRatio: 'none', role: 'img' });
    const title = element('title', {}); title.textContent = `${name}. One-second sine signal on a fixed −2 to +2 unitless scale.`; svg.append(title);
    for (let i = 0; i <= 16; i++) svg.append(element('line', { x1: i * 62.5, x2: i * 62.5, y1: 0, y2: 400, class: i % 4 === 0 ? 'grid-major' : 'grid-minor' }));
    for (let i = 0; i <= 8; i++) svg.append(element('line', { x1: 0, x2: 1000, y1: i * 50, y2: i * 50, class: i === 4 ? 'grid-zero' : i % 2 === 0 ? 'grid-major' : 'grid-minor' }));
    const baseline = (2 - parameters.offset) * 100;
    svg.append(element('line', { x1: 0, x2: 1000, y1: baseline, y2: baseline, class: 'offset-line' }));
    const points = M.coordinates(parameters);
    svg.append(element('path', { d: points.map((point, i) => `${i ? 'L' : 'M'}${point.x.toFixed(3)},${point.y.toFixed(3)}`).join(' '), class: 'signal-curve' }));
    for (const sample of M.samples(parameters)) svg.append(element('circle', { cx: sample.t * 1000, cy: (2 - sample.y) * 100, r: 4, class: 'sample-dot' }));
    host.replaceChildren(svg);
  }
  window.WavebenchPlot = drawPlot;
  document.querySelectorAll('[data-fixture-plot]').forEach(host => drawPlot(host, WavebenchModel.validate(WavebenchModel.FIXTURE).parameters, WavebenchModel.FIXTURE.title));
})();
