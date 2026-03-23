/**
 * Pick `count` random wrong choices from `pool`, excluding `correctItem`.
 */
function pickWrongChoices(pool, correctItem, count) {
  const filtered = pool.filter(d => d.id !== correctItem.id);
  shuffleArray(filtered);
  return filtered.slice(0, count);
}

/**
 * Main département quiz game loop.
 * Mode: "deptName" → question shows number, answers are names
 *       "deptNumber" → question shows name, answers are numbers
 * Zone: "all" or a region code (e.g. "FR-AR")
 * Choices: 2, 4, or 8
 */
async function deptGame() {
  try {
    if (departements.length === 0) await loadDepartements();

    const zoneDeptEl = document.getElementById('zoneDept');
    const selectedRegion = zoneDeptEl ? (zoneDeptEl.getAttribute('data-region') || 'all') : 'all';
    const choicesEl = document.getElementById('choicesDept');
    const numChoices = Number.parseInt(choicesEl ? choicesEl.getAttribute('data-choices') : '4', 10);
    const modeDeptBtn = document.getElementById('modeDeptGame');
    const isNameMode = modeDeptBtn ? modeDeptBtn.classList.contains('deptName') : true;

    const filteredDepts = selectedRegion === 'all'
      ? departements
      : departements.filter(d => d.region === selectedRegion);

    if (filteredDepts.length === 0) return;

    const correctDept = filteredDepts[Math.floor(Math.random() * filteredDepts.length)];

    const wrongChoices = pickWrongChoices(departements, correctDept, numChoices - 1);
    const allChoices = shuffleArray([correctDept, ...wrongChoices]);

    let questionHTML;
    if (isNameMode) {
      questionHTML = (texts.deptGame?.whatName || 'Quel est le nom du département ')
        + '<strong>' + correctDept.id + '</strong> ?';
    } else {
      questionHTML = (texts.deptGame?.whatNumber || 'Quel est le numéro du département ')
        + '<strong>' + correctDept.nom + '</strong> ?';
    }

    const questionEl = document.getElementById('deptQuestion');
    questionEl.innerHTML = questionHTML;

    setControlVisibility('playButtonDept', false, 'flex');

    setControlVisibility('modeDeptGame', false, 'block');
    setControlVisibility('zoneDeptGame', false, 'block');
    setControlVisibility('choicesDeptGame', false, 'block');
    setSectionControlLabelsVisible('deptGame', false);

    document.getElementById('scoreDeptGame').textContent =
      (texts.score || 'Score') + ' : ' + scoreDeptGame;

    const answersContainer = document.getElementById('dept-quiz-answers');
    answersContainer.innerHTML = '';
    answersContainer.style.display = 'grid';

    let answered = false;

    allChoices.forEach(dept => {
      const btn = document.createElement('button');
      btn.className = 'quiz-answer-btn';
      btn.setAttribute('data-dept-id', dept.id);

      if (isNameMode) {
        btn.textContent = dept.nom;
      } else {
        btn.textContent = dept.id;
      }

      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;

        if (dept.id === correctDept.id) {
          btn.classList.add('correct');
          scoreDeptGame++;
          setTimeout(deptGame, 800);
        } else {
          btn.classList.add('wrong');
          answersContainer.querySelectorAll('.quiz-answer-btn').forEach(b => {
            if (b.getAttribute('data-dept-id') === correctDept.id) {
              b.classList.add('correct');
            }
          });
          endDeptGame();
        }
      });

      answersContainer.appendChild(btn);
    });
  } catch (error) {
    console.error('deptGame error:', error);
  }
}

/** Handle end of département quiz (wrong answer) — show replay */
function endDeptGame() {
  const playButton = document.getElementById('playButtonDept');
  setControlVisibility('playButtonDept', true, 'flex');
  playButton.textContent = texts.buttons?.replay || 'Rejouer';

  setControlVisibility('modeDeptGame', true, 'block');
  setControlVisibility('zoneDeptGame', true, 'block');
  setControlVisibility('choicesDeptGame', true, 'block');
  setSectionControlLabelsVisible('deptGame', true);

  scoreDeptGame = 0;
}
