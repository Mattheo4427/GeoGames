/**
 * Main region quiz game loop.
 * Question: Given a random département, which region does it belong to?
 * Choices: 2, 4, or 8 region names
 */
async function regionGame() {
  try {
    if (departements.length === 0) await loadDepartements();
    if (regions.length === 0) await loadRegions();

    const choicesEl = document.getElementById('choicesRegion');
    const requestedChoices = Number.parseInt(choicesEl ? choicesEl.getAttribute('data-choices') : '4', 10);
    const numChoices = Number.isFinite(requestedChoices)
      ? Math.max(2, Math.min(requestedChoices, regions.length))
      : 4;

    if (departements.length === 0 || regions.length === 0) {
      console.error('regionGame: missing departements or regions data');
      return;
    }

    const randomDept = departements[Math.floor(Math.random() * departements.length)];
    if (!randomDept) {
      console.error('regionGame: could not pick a department');
      return;
    }
    const correctRegion = regions.find(r => r.id === randomDept.region);
    if (!correctRegion) { console.error('regionGame: no region for', randomDept); return; }

    const wrongRegions = regions.filter(r => r.id !== correctRegion.id);
    shuffleArray(wrongRegions);
    const allChoices = shuffleArray([correctRegion, ...wrongRegions.slice(0, numChoices - 1)]);

    const questionHTML = (texts.regionGame?.whichRegion || 'Dans quelle région se trouve ')
      + '<strong>' + randomDept.nom + ' (' + randomDept.id + ')</strong> ?';

    const questionEl = document.getElementById('regionQuestion');
    questionEl.innerHTML = questionHTML;

    setControlVisibility('playButtonRegion', false, 'flex');

    setControlVisibility('choicesRegionGame', false, 'block');
    setSectionControlLabelsVisible('regionGame', false);

    document.getElementById('scoreRegionGame').textContent =
      (texts.score || 'Score') + ' : ' + scoreRegionGame;

    const answersContainer = document.getElementById('region-quiz-answers');
    answersContainer.innerHTML = '';
    answersContainer.style.display = 'grid';

    let answered = false;

    allChoices.forEach(region => {
      const btn = document.createElement('button');
      btn.className = 'quiz-answer-btn';
      btn.setAttribute('data-region-id', region.id);
      btn.textContent = region.nom;

      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;

        if (region.id === correctRegion.id) {
          btn.classList.add('correct');
          scoreRegionGame++;
          setTimeout(regionGame, 800);
        } else {
          btn.classList.add('wrong');
          answersContainer.querySelectorAll('.quiz-answer-btn').forEach(b => {
            if (b.getAttribute('data-region-id') === correctRegion.id) {
              b.classList.add('correct');
            }
          });
          endRegionGame();
        }
      });

      answersContainer.appendChild(btn);
    });
  } catch (error) {
    console.error('regionGame error:', error);
  }
}

/** Handle end of region quiz (wrong answer) — show replay */
function endRegionGame() {
  const playButton = document.getElementById('playButtonRegion');
  setControlVisibility('playButtonRegion', true, 'flex');
  playButton.textContent = texts.buttons?.replay || 'Rejouer';

  setControlVisibility('choicesRegionGame', true, 'block');
  setSectionControlLabelsVisible('regionGame', true);

  scoreRegionGame = 0;
}
