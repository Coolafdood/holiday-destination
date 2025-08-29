// File: assets/js/script.js
// Pokemon Guess game logic using PokeAPI
// Works with the provided index.html

(function () {
  const imageEl = document.querySelector('#pokemon-image img');
  const guessInput = document.getElementById('pokemon-guess');
  const submitBtn = document.getElementById('submit-guess');
  const nextBtn = document.getElementById('next-pokemon');
  const newGameBtn = document.getElementById('new-game');
  const resultMessage = document.getElementById('result-message');
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('high-score');

  // Gen 1–9 national dex goes up to 1010 (as of 2023/24). Some IDs may lack artwork; we'll retry if image fails.
  const MIN_ID = 1;
  const MAX_ID = 1010;

  let current = {
    id: null,
    name: null,
    displayName: null,
    revealed: false,
  };

  let score = 0;
  const LS_KEY = 'pokemonGuessHighScore';
  let highScore = Number(localStorage.getItem(LS_KEY) || 0);
  highScoreEl.textContent = highScore;

  // Utility: normalize/slugify a guess to compare with API names
  function canonicalize(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD') // separate accents
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .replace(/[.']/g, '')
      .replace(/♀/g, '-f')
      .replace(/♂/g, '-m')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  // Accept a handful of well-known alias spellings
  function alias(str) {
    const a = canonicalize(str);
    const map = new Map([
      ['mr-mime', ['mr-mime', 'mr-mime-galar', 'mr-mime-kanto']],
      ['mime-jr', ['mime-jr']],
      ['farfetchd', ['farfetchd', 'farfetchd-galar']],
      ['type-null', ['type-null']],
      ['jangmo-o', ['jangmo-o']],
      ['hakamo-o', ['hakamo-o']],
      ['kommo-o', ['kommo-o']],
      ['porygon-z', ['porygon-z']],
      ['nidoran-f', ['nidoran-f']],
      ['nidoran-m', ['nidoran-m']],
    ]);
    for (const [canonical, variants] of map) {
      if (variants.includes(a)) return canonical;
    }
    return a;
  }

  function setMessage(html, type = 'info') {
    resultMessage.className = '';
    resultMessage.classList.add('alert');
    const cls = {
      success: 'alert-success',
      error: 'alert-danger',
      info: 'alert-secondary',
    }[type] || 'alert-secondary';
    resultMessage.classList.add(cls);
    resultMessage.innerHTML = html;
  }

  function clearMessage() {
    resultMessage.className = '';
    resultMessage.textContent = '';
  }

  function setScore(newScore) {
    score = newScore;
    scoreEl.textContent = score;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem(LS_KEY, String(highScore));
      highScoreEl.textContent = highScore;
    }
  }

  function applySilhouette(on) {
    if (!imageEl) return;
    if (on) {
      imageEl.classList.add('silhouette');
      imageEl.setAttribute('aria-hidden', 'true');
    } else {
      imageEl.classList.remove('silhouette');
      imageEl.removeAttribute('aria-hidden');
    }
  }

  async function fetchPokemon(id) {
    const url = `https://pokeapi.co/api/v2/pokemon/${id}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch Pokémon');
    const data = await res.json();

    // Prefer official artwork; fallback to dream_world or default sprite
    const artwork =
      data.sprites?.other?.['official-artwork']?.front_default ||
      data.sprites?.other?.dream_world?.front_default ||
      data.sprites?.front_default;

    return {
      id: data.id,
      name: data.name, // API slug (lowercase, hyphenated)
      displayName: data.name
        .split('-')
        .map(s => (s.length ? s[0].toUpperCase() + s.slice(1) : s))
        .join(' '),
      image: artwork,
      types: data.types?.map(t => t.type.name) || [],
    };
  }

  function randInt(min, maxInclusive) {
    return Math.floor(Math.random() * (maxInclusive - min + 1)) + min;
  }

  async function loadRandomPokemon() {
    clearMessage();
    current.revealed = false;
    guessInput.value = '';
    guessInput.focus();
    applySilhouette(true);

    let tries = 0;
    while (tries < 5) {
      tries++;
      const id = randInt(MIN_ID, MAX_ID);
      try {
        const p = await fetchPokemon(id);
        if (!p.image) continue; // skip if no artwork
        current.id = p.id;
        current.name = p.name; // slug
        current.displayName = p.displayName;
        current.types = p.types;
        imageEl.src = p.image;
        imageEl.alt = 'Hidden Pokémon silhouette';
        applySilhouette(true);
        return;
      } catch (e) {
        // try another id
      }
    }
    // As a last resort, show a pokeball and message
    imageEl.src = 'assets/images/pokeball.png';
    setMessage('Could not load a Pokémon. Check your connection and try again.', 'error');
  }

  function checkGuess() {
    const userGuess = guessInput.value.trim();
    if (!userGuess) {
      setMessage('Type a name first 🙂', 'info');
      return;
    }

    const expected = alias(current.name);
    const provided = alias(userGuess);

    if (provided === expected) {
      applySilhouette(false);
      setMessage(`Correct! It\'s <strong>${current.displayName}</strong>!`, 'success');
      setScore(score + 1);
      current.revealed = true;
    } else {
      // Give a gentle hint
      const firstLetter = current.displayName[0].toUpperCase();
      const typeHint = current.types?.length ? ` Type hint: <em>${current.types.join(' / ')}</em>.` : '';
      setMessage(`Not quite. Try again! Hint: starts with <strong>${firstLetter}</strong>.${typeHint}`, 'error');
    }
  }

  function nextPokemon() {
    loadRandomPokemon();
  }

  function newGame() {
    setScore(0);
    loadRandomPokemon();
  }

  // Event listeners
  submitBtn.addEventListener('click', checkGuess);
  nextBtn.addEventListener('click', nextPokemon);
  newGameBtn.addEventListener('click', newGame);
  guessInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') checkGuess();
  });

  // Start first round
  window.addEventListener('DOMContentLoaded', () => {
    // If the initial src is a pokeball, we still start a round
    loadRandomPokemon();
  });
})();


