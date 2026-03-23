function initMapZoomPan(containerId) {
  const container = document.getElementById(containerId || 'svg-container');
  if (!container) return;
  const svg = container.querySelector('svg');
  if (!svg) return;

  // Remove any previous listeners
  const ac = new AbortController();
  if (container._zoomAbort) container._zoomAbort.abort();
  container._zoomAbort = ac;
  const sig = { signal: ac.signal };

  // Original viewBox (fallback for SVG files that define only width/height).
  let vb = svg.viewBox?.baseVal ?? null;
  if (!vb || !Number.isFinite(vb.width) || !Number.isFinite(vb.height) || vb.width <= 0 || vb.height <= 0) {
    let fallbackX = 0;
    let fallbackY = 0;
    let fallbackW = 0;
    let fallbackH = 0;

    try {
      const bbox = svg.getBBox();
      if (Number.isFinite(bbox.width) && Number.isFinite(bbox.height) && bbox.width > 0 && bbox.height > 0) {
        fallbackX = bbox.x;
        fallbackY = bbox.y;
        fallbackW = bbox.width;
        fallbackH = bbox.height;
      }
    } catch {
      // getBBox can fail on some SVG states; width/height attributes remain as fallback.
    }

    if (fallbackW <= 0 || fallbackH <= 0) {
      fallbackW = Number.parseFloat(svg.getAttribute('width')) || svg.clientWidth || 1000;
      fallbackH = Number.parseFloat(svg.getAttribute('height')) || svg.clientHeight || 700;
    }

    svg.setAttribute('viewBox', `${fallbackX} ${fallbackY} ${fallbackW} ${fallbackH}`);
    vb = svg.viewBox.baseVal;
  }

  const origX = vb.x;
  const origY = vb.y;
  const origW = vb.width;
  const origH = vb.height;

  // State
  let viewX = origX, viewY = origY, viewW = origW, viewH = origH;
  let isDragging = false;
  let dragStartX, dragStartY, dragViewX, dragViewY;
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 1;

  function applyViewBox() {
    svg.setAttribute('viewBox', `${viewX} ${viewY} ${viewW} ${viewH}`);
  }

  function resetView() {
    viewX = origX; viewY = origY; viewW = origW; viewH = origH;
    applyViewBox();
  }

  function clientToSVG(clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return { x: viewX, y: viewY };
    }
    const sx = viewW / rect.width;
    const sy = viewH / rect.height;
    return {
      x: viewX + (clientX - rect.left) * sx,
      y: viewY + (clientY - rect.top) * sy
    };
  }

  // Wheel zoom
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.08 : 1 / 1.08;
    const newW = Math.max(origW * MIN_ZOOM, Math.min(origW * MAX_ZOOM, viewW * factor));
    const newH = newW * (origH / origW);
    const svgPt = clientToSVG(e.clientX, e.clientY);
    const ratio = newW / viewW;
    viewX = svgPt.x - (svgPt.x - viewX) * ratio;
    viewY = svgPt.y - (svgPt.y - viewY) * ratio;
    viewW = newW;
    viewH = newH;
    applyViewBox();
  }, { passive: false, ...sig });

  // Mouse drag
  container.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    const pt = clientToSVG(e.clientX, e.clientY);
    dragStartX = pt.x; dragStartY = pt.y;
    dragViewX = viewX; dragViewY = viewY;
    container.style.cursor = 'grabbing';
    e.preventDefault();
  }, sig);

  globalThis.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const pt = clientToSVG(e.clientX, e.clientY);
    viewX = dragViewX - (pt.x - dragStartX);
    viewY = dragViewY - (pt.y - dragStartY);
    const pt2 = clientToSVG(e.clientX, e.clientY);
    dragStartX = pt2.x; dragStartY = pt2.y;
    dragViewX = viewX; dragViewY = viewY;
    applyViewBox();
  }, sig);

  globalThis.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      container.style.cursor = 'grab';
    }
  }, sig);

  // Touch support
  let lastTouchDist = 0;
  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      const pt = clientToSVG(e.touches[0].clientX, e.touches[0].clientY);
      dragStartX = pt.x; dragStartY = pt.y;
      dragViewX = viewX; dragViewY = viewY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.hypot(dx, dy);
    }
    e.preventDefault();
  }, { passive: false, ...sig });

  container.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      const pt = clientToSVG(e.touches[0].clientX, e.touches[0].clientY);
      viewX = dragViewX - (pt.x - dragStartX);
      viewY = dragViewY - (pt.y - dragStartY);
      const pt2 = clientToSVG(e.touches[0].clientX, e.touches[0].clientY);
      dragStartX = pt2.x; dragStartY = pt2.y;
      dragViewX = viewX; dragViewY = viewY;
      applyViewBox();
    } else if (e.touches.length === 2 && lastTouchDist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const factor = lastTouchDist / dist;
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const svgPt = clientToSVG(cx, cy);
      const newW = Math.max(origW * MIN_ZOOM, Math.min(origW * MAX_ZOOM, viewW * factor));
      const newH = newW * (origH / origW);
      const ratio = newW / viewW;
      viewX = svgPt.x - (svgPt.x - viewX) * ratio;
      viewY = svgPt.y - (svgPt.y - viewY) * ratio;
      viewW = newW; viewH = newH;
      lastTouchDist = dist;
      applyViewBox();
    }
  }, { passive: false, ...sig });

  container.addEventListener('touchend', () => {
    isDragging = false;
    lastTouchDist = 0;
  }, sig);

  container._resetZoom = resetView;
}
