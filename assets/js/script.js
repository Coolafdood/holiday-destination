const pokemonImage = document.getElementById("pokemon-image").querySelector("img");
const guessInput = document.getElementById("pokemon-guess");
const submitBtn = document.getElementById("submit-guess");
const nextBtn = document.getElementById("next-pokemon");
const newGameBtn = document.getElementById("new-game");
const resultMessage = document.getElementById("result-message");
const scoreSpan = document.getElementById("score");
const highScoreSpan = document.getElementById("high-score");

let currentPokemon = "";
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
highScoreSpan.textContent = highScore;

// Fetch random Pokémon from PokéAPI
async function getRandomPokemon() {
    const randomId = Math.floor(Math.random() * 151) + 1; // Gen 1 Pokémon
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
    const data = await response.json();

    currentPokemon = data.name.toLowerCase();
    pokemonImage.src = data.sprites.other["official-artwork"].front_default;
    pokemonImage.style.filter = "brightness(0)"; // always silhouette at start
    resultMessage.textContent = "";
    guessInput.value = "";
}

// Check the user's guess
submitBtn.addEventListener("click", () => {
    const guess = guessInput.value.toLowerCase().trim();
    if (!guess) return;

    if (guess === currentPokemon) {
        resultMessage.textContent = `✅ Correct! It's ${currentPokemon}`;
        pokemonImage.style.filter = "brightness(1)"; // reveal Pokémon
        score++;
        scoreSpan.textContent = score;

        // Update high score
        if (score > highScore) {
            highScore = score;
            localStorage.setItem("highScore", highScore);
            highScoreSpan.textContent = highScore;
        }
    } else {
        resultMessage.textContent = "❌ Wrong! Try again.";
    }
    guessInput.value = "";
});

// Next Pokémon button (skip, but keep silhouette)
nextBtn.addEventListener("click", () => {
    getRandomPokemon();
});

// New Game button (reset score + load fresh silhouette)
newGameBtn.addEventListener("click", () => {
    score = 0;
    scoreSpan.textContent = score;
    resultMessage.textContent = "";
    getRandomPokemon();
});

// Start game on page load
getRandomPokemon();
