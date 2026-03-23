/** Toggle difficulty between easy/hard (flag/map games) */
function changeDifficulty() {
  const button = document.getElementById('borders');
  if (!button) return;
  const isEasy = button.classList.contains('easy');
  button.classList.toggle('easy', !isEasy);
  button.classList.toggle('hard', isEasy);
  button.textContent = isEasy ? (texts.buttons?.hard || 'Difficile') : (texts.buttons?.easy || 'Facile');
}

/** Toggle difficulty for a specific difficulty button id. */
function changeDifficultyFor(buttonId) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  const isEasy = button.classList.contains('easy');
  button.classList.toggle('easy', !isEasy);
  button.classList.toggle('hard', isEasy);
  button.textContent = isEasy ? (texts.buttons?.hard || 'Difficile') : (texts.buttons?.easy || 'Facile');
}

/** Toggle mode between countries/capitals (flag/map games) */
function changeMode(button) {
  const isCountries = button.classList.contains('countries');
  button.classList.toggle('countries', !isCountries);
  button.classList.toggle('capitals', isCountries);
  button.textContent = isCountries ? (texts.buttons?.capitals || 'Capitales') : (texts.buttons?.countries || 'Pays');
}

/** Toggle dept quiz mode between name/number */
function changeModeDept(button) {
  const isName = button.classList.contains('deptName');
  button.classList.toggle('deptName', !isName);
  button.classList.toggle('deptNumber', isName);
  button.textContent = isName ? (texts.buttons?.deptNumber || 'Numéro') : (texts.buttons?.deptName || 'Nom');
}

/** Update mode button texts based on current class + language */
function updateModeButtonTexts() {
  const btns = [document.getElementById('modeFlagGame'), document.getElementById('modeMapGame')];
  btns.forEach(btn => {
    if (!btn) return;
    if (btn.classList.contains('countries')) {
      btn.textContent = texts.buttons?.countries || 'Pays';
    } else {
      btn.textContent = texts.buttons?.capitals || 'Capitales';
    }
  });
  const bordersBtn = document.getElementById('borders');
  if (bordersBtn) {
    bordersBtn.textContent = bordersBtn.classList.contains('easy')
      ? (texts.buttons?.easy || 'Facile')
      : (texts.buttons?.hard || 'Difficile');
  }
  const bordersDeptMapBtn = document.getElementById('bordersDeptMap');
  if (bordersDeptMapBtn) {
    bordersDeptMapBtn.textContent = bordersDeptMapBtn.classList.contains('easy')
      ? (texts.buttons?.easy || 'Facile')
      : (texts.buttons?.hard || 'Difficile');
  }
  const modeDeptBtn = document.getElementById('modeDeptGame');
  if (modeDeptBtn) {
    modeDeptBtn.textContent = modeDeptBtn.classList.contains('deptName')
      ? (texts.buttons?.deptName || 'Nom')
      : (texts.buttons?.deptNumber || 'Numéro');
  }

  const modeDeptMapBtn = document.getElementById('modeDeptMapGame');
  if (modeDeptMapBtn) {
    modeDeptMapBtn.textContent = modeDeptMapBtn.classList.contains('deptName')
      ? (texts.buttons?.deptName || 'Nom')
      : (texts.buttons?.deptNumber || 'Numéro');
  }
}

/** Toggle visibility for a control and its parent parameter group. */
function setControlVisibility(controlId, visible, displayMode = 'block') {
  const control = document.getElementById(controlId);
  if (!control) return;

  const group = control.closest('.control-group');
  if (group) {
    group.style.display = visible ? 'flex' : 'none';
  } else {
    control.style.display = visible ? displayMode : 'none';
  }

  if ('pointerEvents' in control.style) {
    control.style.pointerEvents = visible ? 'auto' : 'none';
  }
}

/** Show/hide tiny labels above controls in a game section. */
function setSectionControlLabelsVisible(sectionId, visible) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  section.querySelectorAll('.control-label').forEach(label => {
    label.style.display = visible ? '' : 'none';
  });
}
