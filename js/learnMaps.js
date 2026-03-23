// Learn page map interactions are kept in a dedicated file to keep data.js focused on data/i18n.

function applyLearnMapTitles() {
  if (!globalThis.location.pathname.includes('apprendre')) return;

  const mapObjects = document.querySelectorAll('object.map');
  const inlineMaps = document.querySelectorAll('svg.learn-inline-map');
  if (mapObjects.length === 0 && inlineMaps.length === 0) return;

  const countryByCode = new Map(countries.map(c => [String(c.code).toUpperCase(), c.nom]));
  const deptById = new Map(departements.map(d => [String(d.id).toUpperCase(), d.nom]));
  const regionById = new Map(regions.map(r => [String(r.id).toUpperCase(), r.nom]));

  const continentKeyById = {
    africa: 'Afrique',
    asia: 'Asie',
    australia: 'Océanie',
    europe: 'Europe',
    south_america: 'Amérique du Sud',
    north_america: 'Amérique du Nord'
  };

  const deptIdPattern = /^(2A|2B|0[1-9]|[1-8][0-9]|9[0-5]|97[1-6]|98[4678])$/;

  const normalizeDeptId = (value) => {
    const raw = String(value || '').trim().toUpperCase();
    if (!raw) return '';
    const head = raw.split(/\s|-/)[0];
    if (deptIdPattern.test(head)) return head;
    return deptIdPattern.test(raw) ? raw : '';
  };

  const formatLabelForMap = (label, dataPath) => {
    const safeLabel = String(label || '').trim();
    if (!safeLabel) return '';
    if (!String(dataPath || '').includes('map_FR_dep.svg')) return safeLabel;

    // Keep existing rich department labels when they already contain a name.
    if (safeLabel.includes(' - ') && /[A-Za-zÀ-ÿ]/.test(safeLabel.split(' - ').slice(1).join(' - '))) {
      return safeLabel;
    }

    const deptId = normalizeDeptId(safeLabel);
    if (!deptId) return safeLabel;

    const deptName = deptById.get(deptId);
    return deptName ? `${deptId} - ${deptName}` : deptId;
  };

  const getMapType = (dataPath) => {
    const src = String(dataPath || '');
    if (src.includes('map_world.svg')) return 'world';
    if (src.includes('map_FR_dep.svg')) return 'departments';
    if (src.includes('map_FR_reg.svg')) return 'regions';
    if (src.includes('map_continents.svg')) return 'continents';
    return 'other';
  };

  const getNodeRawLabel = (node) => {
    const mapTitle = String(node.getAttribute?.('data-map-title') || '').trim();
    if (mapTitle) return mapTitle;

    const attrTitle = String(node.getAttribute?.('title') || '').trim();
    if (attrTitle) return attrTitle;

    const nestedTitle = Array.from(node.children || []).find(
      child => child.tagName === 'title'
    );
    const nestedTitleText = String(nestedTitle?.textContent || '').trim();
    if (nestedTitleText) return nestedTitleText;

    return '';
  };

  const isPathLikeLabel = (value) => {
    const text = String(value || '').trim();
    if (!text) return true;
    if (text.includes('/') || text.includes('\\')) return true;
    if (/\.(svg|png|jpg|jpeg|webp|gif)$/i.test(text)) return true;
    return false;
  };

  const resolveInteractiveLabel = (node, dataPath) => {
    const mapType = getMapType(dataPath);
    const idValue = String(node.getAttribute?.('id') || '').trim().toUpperCase();

    if (mapType === 'world') {
      // Prefer canonical code -> country mapping, but keep embedded SVG titles as fallback.
      const mapped = countryByCode.get(idValue);
      if (mapped) return mapped;

      const existing = getNodeRawLabel(node);
      if (existing && !isPathLikeLabel(existing)) return existing;

      // Never fallback to raw SVG ids on world map.
      return '';
    }

    if (mapType === 'continents') {
      const rawId = String(node.getAttribute?.('id') || '').trim();
      const continentKey = continentKeyById[rawId];
      if (continentKey) {
        const translated = texts.zones?.[continentKey] || continentKey;
        if (translated && !isPathLikeLabel(translated)) return translated;
      }

      const existing = getNodeRawLabel(node);
      if (existing && !isPathLikeLabel(existing)) return existing;

      return '';
    }

    if (mapType === 'departments') {
      const deptId = normalizeDeptId(idValue || getNodeRawLabel(node));
      if (deptId) {
        const deptName = deptById.get(deptId);
        if (deptName) return `${deptId} - ${deptName}`;
      }

      const existing = formatLabelForMap(getNodeRawLabel(node), dataPath);
      return existing || (deptId || '');
    }

    const existing = formatLabelForMap(getNodeRawLabel(node), dataPath);
    if (existing) return existing;

    return String(node.getAttribute?.('id') || '').trim();
  };

  const getObjectSvgDocument = (obj) => {
    if (!obj) return null;
    return obj.contentDocument || (typeof obj.getSVGDocument === 'function' ? obj.getSVGDocument() : null);
  };

  const getBundledLearnSvg = (dataPath) => {
    if (!dataPath) return null;
    if (dataPath.includes('map_world.svg')) return globalThis.__geoSvgMapWorld || null;
    if (dataPath.includes('map_continents.svg')) return globalThis.__geoSvgMapContinents || null;
    if (dataPath.includes('map_FR_reg.svg')) return globalThis.__geoSvgMapFrReg || null;
    if (dataPath.includes('map_FR_dep.svg')) return globalThis.__geoSvgMapFrDep || null;
    return null;
  };

  const ensureInlineMapFromBundle = (obj) => {
    if (!obj) return null;
    const dataPath = obj.getAttribute('data') || '';
    if (!dataPath) return null;

    const existing = obj.nextElementSibling;
    if (existing && existing.matches && existing.matches('svg.learn-inline-map')) {
      return existing;
    }

    const bundled = getBundledLearnSvg(dataPath);
    if (typeof bundled !== 'string' || !bundled.trim()) return null;

    const parsed = new DOMParser().parseFromString(bundled, 'image/svg+xml');
    const svg = parsed.querySelector('svg');
    if (!svg) return null;

    svg.classList.add('map', 'learn-inline-map');
    svg.setAttribute('data-map-source', dataPath);
    if (obj.getAttribute('width')) svg.setAttribute('width', obj.getAttribute('width'));
    if (obj.getAttribute('height')) svg.setAttribute('height', obj.getAttribute('height'));

    obj.style.display = 'none';
    obj.insertAdjacentElement('afterend', svg);
    return svg;
  };

  function ensureLearnMapTooltip() {
    let tooltip = document.getElementById('learn-map-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'learn-map-tooltip';
      tooltip.className = 'learn-map-tooltip';
      document.body.appendChild(tooltip);
    }
    return tooltip;
  }

  function setMapTitle(node, text) {
    const generatedTitles = () => Array.from(node.children || []).filter(
      child => child.tagName === 'title' && child.getAttribute('data-generated-map-title') === '1'
    );

    const safe = String(text ?? '').trim();
    if (!safe || safe.toLowerCase() === 'null' || safe.toLowerCase() === 'undefined') {
      node.removeAttribute('data-map-title');
      node.removeAttribute('title');
      generatedTitles().forEach(t => t.remove());
      return;
    }

    // Keep a native tooltip fallback in addition to the custom tooltip.
    node.setAttribute('data-map-title', safe);
    node.setAttribute('title', safe);

    let nativeTitle = generatedTitles()[0] || null;
    if (!nativeTitle) {
      nativeTitle = node.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'title');
      nativeTitle.setAttribute('data-generated-map-title', '1');
      node.insertBefore(nativeTitle, node.firstChild);
    }
    nativeTitle.textContent = safe;
  }

  function applyContinentTitles(root) {
    root.querySelectorAll('g[id]').forEach(group => {
      const mapKey = continentKeyById[group.getAttribute('id')];
      if (!mapKey) return;
      const translated = texts.zones?.[mapKey] || mapKey;
      setMapTitle(group, translated);
    });
  }

  function applyTitlesById(root, translateById, formatter) {
    root.querySelectorAll('[id]').forEach(node => {
      const id = String(node.getAttribute('id') || '').toUpperCase();
      const translated = translateById(id);
      const formatted = formatter ? formatter(id, translated) : translated;
      if (!formatted) return;
      setMapTitle(node, formatted);
    });
  }

  function bindObjectTooltip(obj) {
    if (obj.dataset.mapTooltipBound) return;
    const svgDoc = getObjectSvgDocument(obj);
    if (!svgDoc) return;

    const tooltip = ensureLearnMapTooltip();
    const hideTooltip = () => {
      tooltip.style.opacity = '0';
    };

    const moveTooltip = (event, label) => {
      tooltip.textContent = label;
      tooltip.style.opacity = '1';

      const pad = 12;
      const offset = 12;
      const objRect = obj.getBoundingClientRect();
      const localX = Number(event.clientX) || 0;
      const localY = Number(event.clientY) || 0;
      // In object-embedded SVGs, client coords are typically local to the object viewport.
      // Some engines report viewport coords directly, so keep both cases safe.
      const pointerX = localX > objRect.width + 5 ? localX : objRect.left + localX;
      const pointerY = localY > objRect.height + 5 ? localY : objRect.top + localY;
      let left = pointerX + offset;
      let top = pointerY + offset;

      const width = tooltip.offsetWidth;
      const height = tooltip.offsetHeight;

      if (left + width > globalThis.innerWidth - pad) {
        left = pointerX - width - offset;
      }
      if (left < pad) left = pad;

      if (top + height > globalThis.innerHeight - pad) {
        top = globalThis.innerHeight - height - pad;
      }
      if (top < pad) top = pad;

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    };

    const getNodeLabel = (node) => {
      const dataPath = obj.getAttribute('data') || '';
      let current = node && node.nodeType === 1 ? node : node?.parentElement;
      while (current && current !== svgDoc) {
        const label = resolveInteractiveLabel(current, dataPath);
        if (label) return label;

        current = current.parentElement;
      }
      return '';
    };

    const bindNodeTooltip = (node) => {
      node.addEventListener('mouseenter', (event) => {
        const label = getNodeLabel(event.target);
        if (!label) {
          hideTooltip();
          return;
        }
        moveTooltip(event, label);
      });

      node.addEventListener('mousemove', (event) => {
        const label = getNodeLabel(event.target);
        if (!label) {
          hideTooltip();
          return;
        }
        moveTooltip(event, label);
      });

      node.addEventListener('mouseleave', hideTooltip);
    };

    // Prefer direct node-level bindings to avoid browser-specific event target quirks.
    const candidates = new Set([
      ...Array.from(svgDoc.querySelectorAll('[data-map-title]')),
      ...Array.from(svgDoc.querySelectorAll('[title]'))
    ]);

    candidates.forEach(bindNodeTooltip);

    svgDoc.addEventListener('mousemove', (event) => {
      const label = getNodeLabel(event.target);
      if (!label) {
        hideTooltip();
        return;
      }
      moveTooltip(event, label);
    });

    svgDoc.addEventListener('mouseleave', hideTooltip);
    obj.addEventListener('mouseleave', hideTooltip);
    obj.dataset.mapTooltipBound = '1';
  }

  function bindObjectZoomPan(obj) {
    if (obj.dataset.mapZoomBound) return;
    const svgDoc = getObjectSvgDocument(obj);
    if (!svgDoc) return;
    const svg = svgDoc.querySelector('svg');
    if (!svg) return;

    // Ensure a valid viewBox exists before enabling zoom/pan.
    let vb = svg.viewBox?.baseVal ?? null;
    if (!vb || !vb.width || !vb.height) {
      let w = Number.parseFloat(svg.getAttribute('width')) || 1000;
      let h = Number.parseFloat(svg.getAttribute('height')) || 700;
      try {
        const bbox = svg.getBBox();
        if (bbox.width > 0 && bbox.height > 0) {
          svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
        } else {
          svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        }
      } catch {
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }
      vb = svg.viewBox.baseVal;
    }

    const origX = vb.x;
    const origY = vb.y;
    const origW = vb.width;
    const origH = vb.height;

    let viewX = origX;
    let viewY = origY;
    let viewW = origW;
    let viewH = origH;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragViewX = 0;
    let dragViewY = 0;
    const MIN_ZOOM = 0.25;
    const MAX_ZOOM = 1;

    const applyViewBox = () => {
      svg.setAttribute('viewBox', `${viewX} ${viewY} ${viewW} ${viewH}`);
    };

    const clientToSVG = (clientX, clientY) => {
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return { x: viewX, y: viewY };
      const sx = viewW / rect.width;
      const sy = viewH / rect.height;
      return {
        x: viewX + (clientX - rect.left) * sx,
        y: viewY + (clientY - rect.top) * sy
      };
    };

    svgDoc.addEventListener('wheel', (event) => {
      event.preventDefault();
      const factor = event.deltaY > 0 ? 1.08 : 1 / 1.08;
      const newW = Math.max(origW * MIN_ZOOM, Math.min(origW * MAX_ZOOM, viewW * factor));
      const newH = newW * (origH / origW);
      const svgPt = clientToSVG(event.clientX, event.clientY);
      const ratio = newW / viewW;

      viewX = svgPt.x - (svgPt.x - viewX) * ratio;
      viewY = svgPt.y - (svgPt.y - viewY) * ratio;
      viewW = newW;
      viewH = newH;
      applyViewBox();
    }, { passive: false });

    svgDoc.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;
      isDragging = true;
      const pt = clientToSVG(event.clientX, event.clientY);
      dragStartX = pt.x;
      dragStartY = pt.y;
      dragViewX = viewX;
      dragViewY = viewY;
      svg.style.cursor = 'grabbing';
      event.preventDefault();
    });

    svgDoc.addEventListener('mousemove', (event) => {
      if (!isDragging) return;
      const pt = clientToSVG(event.clientX, event.clientY);
      viewX = dragViewX - (pt.x - dragStartX);
      viewY = dragViewY - (pt.y - dragStartY);

      const pt2 = clientToSVG(event.clientX, event.clientY);
      dragStartX = pt2.x;
      dragStartY = pt2.y;
      dragViewX = viewX;
      dragViewY = viewY;
      applyViewBox();
    });

    const stopDrag = () => {
      isDragging = false;
      svg.style.cursor = 'grab';
    };

    svgDoc.addEventListener('mouseup', stopDrag);
    svgDoc.addEventListener('mouseleave', stopDrag);

    svg.style.cursor = 'grab';
    obj.dataset.mapZoomBound = '1';
  }

  function bindInlineTooltip(svg) {
    if (svg.dataset.mapTooltipBound) return;

    const tooltip = ensureLearnMapTooltip();
    const hideTooltip = () => {
      tooltip.style.opacity = '0';
    };

    const moveTooltip = (event, label) => {
      tooltip.textContent = label;
      tooltip.style.opacity = '1';

      const pad = 12;
      const offset = 12;
      const pointerX = Number(event.clientX) || 0;
      const pointerY = Number(event.clientY) || 0;
      let left = pointerX + offset;
      let top = pointerY + offset;

      const width = tooltip.offsetWidth;
      const height = tooltip.offsetHeight;

      if (left + width > globalThis.innerWidth - pad) {
        left = pointerX - width - offset;
      }
      if (left < pad) left = pad;

      if (top + height > globalThis.innerHeight - pad) {
        top = globalThis.innerHeight - height - pad;
      }
      if (top < pad) top = pad;

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    };

    const getNodeLabel = (node) => {
      const dataPath = svg.getAttribute('data-map-source') || '';
      let current = node && node.nodeType === 1 ? node : node?.parentElement;
      while (current && current !== svg.parentElement) {
        const label = resolveInteractiveLabel(current, dataPath);
        if (label) return label;

        current = current.parentElement;
      }
      return '';
    };

    const candidates = new Set([
      ...Array.from(svg.querySelectorAll('[data-map-title]')),
      ...Array.from(svg.querySelectorAll('[title]'))
    ]);

    candidates.forEach(node => {
      node.addEventListener('mouseenter', (event) => {
        const label = getNodeLabel(event.target);
        if (!label) {
          hideTooltip();
          return;
        }
        moveTooltip(event, label);
      });
      node.addEventListener('mousemove', (event) => {
        const label = getNodeLabel(event.target);
        if (!label) {
          hideTooltip();
          return;
        }
        moveTooltip(event, label);
      });
      node.addEventListener('mouseleave', hideTooltip);
    });

    svg.addEventListener('mouseleave', hideTooltip);
    svg.dataset.mapTooltipBound = '1';
  }

  function bindInlineZoomPan(svg) {
    if (svg.dataset.mapZoomBound) return;

    let vb = svg.viewBox?.baseVal ?? null;
    if (!vb || !vb.width || !vb.height) {
      const w = Number.parseFloat(svg.getAttribute('width')) || 1000;
      const h = Number.parseFloat(svg.getAttribute('height')) || 700;
      try {
        const bbox = svg.getBBox();
        if (bbox.width > 0 && bbox.height > 0) {
          svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
        } else {
          svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        }
      } catch {
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }
      vb = svg.viewBox.baseVal;
    }

    const origX = vb.x;
    const origY = vb.y;
    const origW = vb.width;
    const origH = vb.height;

    let viewX = origX;
    let viewY = origY;
    let viewW = origW;
    let viewH = origH;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragViewX = 0;
    let dragViewY = 0;
    const MIN_ZOOM = 0.25;
    const MAX_ZOOM = 1;

    const applyViewBox = () => {
      svg.setAttribute('viewBox', `${viewX} ${viewY} ${viewW} ${viewH}`);
    };

    const clientToSVG = (clientX, clientY) => {
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return { x: viewX, y: viewY };
      const sx = viewW / rect.width;
      const sy = viewH / rect.height;
      return {
        x: viewX + (clientX - rect.left) * sx,
        y: viewY + (clientY - rect.top) * sy
      };
    };

    svg.addEventListener('wheel', (event) => {
      event.preventDefault();
      const factor = event.deltaY > 0 ? 1.08 : 1 / 1.08;
      const newW = Math.max(origW * MIN_ZOOM, Math.min(origW * MAX_ZOOM, viewW * factor));
      const newH = newW * (origH / origW);
      const svgPt = clientToSVG(event.clientX, event.clientY);
      const ratio = newW / viewW;

      viewX = svgPt.x - (svgPt.x - viewX) * ratio;
      viewY = svgPt.y - (svgPt.y - viewY) * ratio;
      viewW = newW;
      viewH = newH;
      applyViewBox();
    }, { passive: false });

    svg.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;
      isDragging = true;
      const pt = clientToSVG(event.clientX, event.clientY);
      dragStartX = pt.x;
      dragStartY = pt.y;
      dragViewX = viewX;
      dragViewY = viewY;
      svg.style.cursor = 'grabbing';
      event.preventDefault();
    });

    const moveHandler = (event) => {
      if (!isDragging) return;
      const pt = clientToSVG(event.clientX, event.clientY);
      viewX = dragViewX - (pt.x - dragStartX);
      viewY = dragViewY - (pt.y - dragStartY);

      const pt2 = clientToSVG(event.clientX, event.clientY);
      dragStartX = pt2.x;
      dragStartY = pt2.y;
      dragViewX = viewX;
      dragViewY = viewY;
      applyViewBox();
    };

    const stopDrag = () => {
      isDragging = false;
      svg.style.cursor = 'grab';
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', stopDrag);
    svg.addEventListener('mouseleave', stopDrag);

    svg.style.cursor = 'grab';
    svg.dataset.mapZoomBound = '1';
  }

  function applyInlineTranslations(svg) {
    const dataPath = svg.getAttribute('data-map-source') || '';
    if (!dataPath) return;

    if (dataPath.includes('map_world.svg')) {
      applyTitlesById(svg, id => countryByCode.get(id));
      return;
    }

    if (dataPath.includes('map_continents.svg')) {
      applyContinentTitles(svg);
      return;
    }

    if (dataPath.includes('map_FR_reg.svg')) {
      applyTitlesById(svg, id => regionById.get(id));
      return;
    }

    if (dataPath.includes('map_FR_dep.svg')) {
      applyTitlesById(svg, id => deptById.get(id), (id, translated) => translated ? `${id} - ${translated}` : '');
    }
  }

  function applyObjectTranslations(obj) {
    const dataPath = obj.getAttribute('data') || '';
    const svgDoc = getObjectSvgDocument(obj);
    if (!svgDoc) return;

    // Learn SVG files include legacy inline scripts that create an extra hover label.
    // Remove those scripts and strip attached listeners by cloning nodes once.
    if (!obj.dataset.legacyHoverDisabled) {
      svgDoc.querySelectorAll('script').forEach(node => node.remove());
      svgDoc.querySelectorAll('[id]').forEach(node => {
        const clone = node.cloneNode(true);
        node.replaceWith(clone);
      });
      svgDoc.querySelectorAll('text').forEach(node => node.remove());
      obj.dataset.legacyHoverDisabled = '1';
    }

    // Safety net for previously injected invalid map-title values.
    svgDoc.querySelectorAll('[data-map-title]').forEach(node => {
      const raw = String(node.getAttribute('data-map-title') ?? '').trim().toLowerCase();
      if (!raw || raw === 'null' || raw === 'undefined') {
        node.removeAttribute('data-map-title');
      }
    });

    if (dataPath.includes('map_world.svg')) {
      applyTitlesById(svgDoc, id => countryByCode.get(id));
      return;
    }

    if (dataPath.includes('map_continents.svg')) {
      applyContinentTitles(svgDoc);
      return;
    }

    if (dataPath.includes('map_FR_reg.svg')) {
      applyTitlesById(svgDoc, id => regionById.get(id));
      return;
    }

    if (dataPath.includes('map_FR_dep.svg')) {
      applyTitlesById(svgDoc, id => deptById.get(id), (id, translated) => translated ? `${id} - ${translated}` : '');
    }
  }

  mapObjects.forEach(obj => {
    const attemptApplyLearnMap = (retriesLeft = 30) => {
      const hasSvgDoc = !!getObjectSvgDocument(obj);
      if (hasSvgDoc) {
        applyObjectTranslations(obj);
        bindObjectTooltip(obj);
        bindObjectZoomPan(obj);
        return;
      }

      if (globalThis.location.protocol === 'file:') {
        const inlineSvg = ensureInlineMapFromBundle(obj);
        if (inlineSvg) {
          applyInlineTranslations(inlineSvg);
          bindInlineTooltip(inlineSvg);
          bindInlineZoomPan(inlineSvg);
          return;
        }
      }

      if (retriesLeft > 0) {
        setTimeout(() => attemptApplyLearnMap(retriesLeft - 1), 150);
      }
    };

    if (!obj.dataset.i18nBound) {
      obj.addEventListener('load', () => {
        attemptApplyLearnMap(40);
      });
      obj.dataset.i18nBound = '1';
    }
    attemptApplyLearnMap(20);
  });

  document.querySelectorAll('svg.learn-inline-map').forEach(svg => {
    applyInlineTranslations(svg);
    bindInlineTooltip(svg);
    bindInlineZoomPan(svg);
  });
}

function bootstrapLearnMapInteractions() {
  if (!globalThis.location.pathname.includes('apprendre')) return;

  let attempts = 0;
  const maxAttempts = 60;
  const retryMs = 250;

  const tryBind = () => {
    attempts += 1;
    applyLearnMapTitles();

    const objects = Array.from(document.querySelectorAll('object.map'));
    if (objects.length === 0) return;

    const allBound = objects.every(obj =>
      obj.dataset.mapTooltipBound === '1' && obj.dataset.mapZoomBound === '1'
    );

    if (!allBound && attempts < maxAttempts) {
      setTimeout(tryBind, retryMs);
      return;
    }

    if (!allBound && attempts >= maxAttempts) return;
  };

  tryBind();
  globalThis.addEventListener('load', tryBind, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapLearnMapInteractions);
} else {
  bootstrapLearnMapInteractions();
}
