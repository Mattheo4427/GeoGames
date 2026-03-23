async function flagGame() {
  try {
    const zone = getZoneData(getZoneKey('zoneFlag'));
    const isValidLabel = (value) => {
      const text = String(value ?? '').trim().toLowerCase();
      return text !== '' && text !== 'null' && text !== 'undefined';
    };

    let result = getRandomCountryDetails(zone, 4);
    let { codes, correct: originalIndex } = result;

    const modeBtn = document.getElementById('modeFlagGame');
    const isCountryMode = modeBtn.classList.contains('countries');
    let names = isCountryMode ? result.names : result.capitals;

    // Prevent null/undefined prompts in both countries and capitals modes.
    while (!Array.isArray(names) || names.length !== 4 || names.some(name => !isValidLabel(name))) {
      result = getRandomCountryDetails(zone, 4);
      codes = result.codes;
      originalIndex = result.correct;
      names = isCountryMode ? result.names : result.capitals;
    }

    document.getElementById('countryName').style.marginTop = '8.5vh';

    setControlVisibility('playButton', false, 'flex');

    setControlVisibility('modeFlagGame', false, 'block');
    setControlVisibility('zoneFlagGame', false, 'block');
    setSectionControlLabelsVisible('flagGame', false);

    for (let i = 1; i <= 4; i++) {
      document.getElementById('div' + i).style.pointerEvents = 'auto';
      document.getElementById('image' + i).style.outline = 'none';
      document.getElementById('name' + i).textContent = '';
    }

    document.getElementById('scoreFlagGame').textContent = (texts.score || 'Score') + ' : ' + scoreFlagGame;

    const countryText = document.getElementById('countryName');
    if (isCountryMode) {
      countryText.innerHTML = (texts.flagGame?.findFlag || 'Trouvez le drapeau de : ') + '<strong>' + names[originalIndex - 1] + '</strong>';
    } else {
      countryText.innerHTML = (texts.flagGame?.findFlagCapital || 'Trouvez le drapeau dont la capitale est : ') + '<strong>' + names[originalIndex - 1] + '</strong>';
    }

    const preload = src => new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });

    try {
      const images = await Promise.all(codes.map(code => preload('flags/' + code + '.png')));
      images.forEach((img, i) => {
        document.getElementById('image' + (i + 1)).src = img.src;
      });
    } catch (err) {
      console.error('Erreur lors du préchargement des images', err);
    }

    let hasClicked = false;

    for (let i = 1; i <= 4; i++) {
      document.getElementById('image' + i).onclick = () => {
        if (hasClicked) return;
        hasClicked = true;

        if (originalIndex === i) {
          scoreFlagGame++;
          document.getElementById('image' + i).style.outline = 'solid green 10px';
          setTimeout(flagGame, 1000);
        } else {
          endFlagGame(i, originalIndex, names);
        }
      };
    }

    document.getElementById('content').style.display = 'flex';
  } catch (error) {
    console.error('flagGame error:', error);
  }
}

/** Handle end of flag game round (wrong answer) */
function endFlagGame(bad, answer, names) {
  document.getElementById('image' + answer).style.outline = 'solid green 10px';
  document.getElementById('image' + bad).style.outline = 'solid red 10px';

  for (let i = 1; i <= 4; i++) {
    document.getElementById('div' + i).style.pointerEvents = 'none';
    const nameEl = document.getElementById('name' + i);
    const label = String(names[i - 1] ?? '').trim();
    nameEl.textContent = (label && label.toLowerCase() !== 'null' && label.toLowerCase() !== 'undefined')
      ? label
      : '-';
    nameEl.style.fontWeight = 'bold';
  }

  const playButton = document.getElementById('playButton');
  setControlVisibility('playButton', true, 'flex');
  playButton.textContent = texts.buttons?.replay || 'Rejouer';

  setControlVisibility('modeFlagGame', true, 'block');
  setControlVisibility('zoneFlagGame', true, 'block');
  setSectionControlLabelsVisible('flagGame', true);
  document.getElementById('countryName').style.marginTop = '1vh';

  scoreFlagGame = 0;
}
