/** Remove diacritics from a string */
function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Shuffle an array in-place (Fisher-Yates) and return it.
 * Shared by multiple quiz modes.
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Resolve a zone key to its data array */
function getZoneData(zoneKey) {
  const getter = ZONE_MAP[zoneKey];
  return getter ? getter() : countries;
}

/** Get the zone key from a zone display element */
function getZoneKey(elementId) {
  const el = document.getElementById(elementId);
  return el ? (el.getAttribute('data-zone-key') || 'Monde') : 'Monde';
}

/**
 * Pick one random country from `array`, excluding those in `exclude`.
 * Returns [nom, code, capitale] or null if empty.
 */
function getRandomInfos(array, exclude) {
  const excludeCodes = new Set(exclude.map(item => item.code));
  const filtered = array.filter(item => !excludeCodes.has(item.code));
  if (filtered.length === 0) return null;
  const pick = filtered[Math.floor(Math.random() * filtered.length)];
  return [pick.nom, pick.code, pick.capitale];
}

/**
 * Pick `num` random countries from `array`, ensuring no duplicate-flag conflicts.
 * Returns { codes, names, capitals, correct }.
 */
function getRandomCountryDetails(array, num) {
  const FLAG_GROUPS = [
    ['bv', 'no', 'sj'],
    ['fr', 'mf'],
    ['um', 'us'],
    ['au', 'hm']
  ];

  function hasGroupConflict(selected) {
    return FLAG_GROUPS.some(group =>
      selected.filter(c => group.includes(c.code)).length > 1
    );
  }

  let selected;
  do {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    selected = shuffled.slice(0, num);
  } while (hasGroupConflict(selected));

  const correctIndex = Math.floor(Math.random() * num);

  return {
    codes: selected.map(c => c.code),
    names: selected.map(c => c.nom),
    capitals: selected.map(c => c.capitale),
    correct: correctIndex + 1
  };
}

/** Look up a country name by its 2-letter code */
function getCountryNameByCode(code) {
  const lc = code.toLowerCase();
  const entry = countries.find(c => c.code === lc);
  const name = entry ? String(entry.nom ?? '').trim() : '';
  const lowered = name.toLowerCase();
  if (!name || lowered === 'null' || lowered === 'undefined') return code;
  return name;
}

/** Look up full country info by 2-letter code */
function getCountryByCode(code) {
  const lc = String(code || '').toLowerCase();
  return countries.find(c => c.code === lc) || null;
}

/** Look up a département name by its ID code */
function getDeptNameById(id) {
  const normalized = String(id || '').trim().toUpperCase();
  const entry = departements.find(d => String(d.id || '').trim().toUpperCase() === normalized);
  if (entry && entry.nom) return entry.nom;
  return normalized;
}

/** Look up a région name by its SVG ID */
function getRegionNameById(id) {
  const entry = regions.find(r => r.id === id);
  return entry ? entry.nom : id;
}
