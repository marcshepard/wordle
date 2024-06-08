/**
 * @module gameEngine - game engine business logic; might arficicially make API calls to a server
 */

import { possibleAnswers, allowedGuesses } from "./wordleWords";

/**
 * Possible colors for guessed letters
 */

export const COLORS = {
    YELLOW: "yellow",
    GREEN: "green",
    GREY: "grey",
    EMPTY: "empty",
};

export const GAME_STATE = {
    PLAYING: "playing",
    WON: "won",
    LOST: "lost",
}

/**
 * Start a new game.
 * 
 * @returns a json object containing the game state:
 *      {string} solution - The solution word
 *      {Array<string, COLOR[]> guesses - An array of guessed words and their COLORS
 *      {string} state - The current GAME_STATE
 *      {string error - The error string will be null if there was no error on the last guess.
 */
export function newGame() {
    const solution = possibleAnswers[Math.floor(Math.random() * possibleAnswers.length)];
    return {
        solution: solution,                 // The solution word
        guesses: [],                        // A list of (guess, colors) they have made so far
        remainingAnswers: possibleAnswers,  // The number of possible answers remaining
        state: GAME_STATE.PLAYING,          // The current state of the game; one of playing, won, lost
        error: null                         // An error message, if any, from the last guess
    };
}

/**
 * Prune a list of remaining answers based on a guess and the colors returned for that guess
 * 
 * @param {string[]} remainingAnswers - The list of possible answers before the guess
 * @param {string} word - The word guessed
 * @param {COLORS[]} colors - The colors returned for the guess
 * 
 * @returns {string[]} - The list of possible answers which would have returned the same colors
 */
function pruneList(remainingAnswers, word, colors) {
    if (remainingAnswers === null || remainingAnswers.length === 0) {
        console.log("No remaining answers - this shouldn't happen!");
        return remainingAnswers; // Should never happen
    }

    // Each remaining answer can only be a possible answer if guessing word against it would return the colors
    // So filter to just the subset of remainingAnswers for which calculatePattern(word, answser) === colors
    return remainingAnswers.filter(answer => {
        return colors.every((color, index) => {
            return color === calculatePattern(word, answer)[index];
        });
    });
}

/**
 * Make a guess.
 * 
 * @param {Object} game - The game.
 * @param {string} word - The word to guess.
 * 
 * @returns {Object} - A new game state
 */
export function guess(game, word) {
    word = word.toLowerCase();

    if (!possibleAnswers.includes(word) && !allowedGuesses.includes(word)) {
        return {...game, error: "Not in word list"};
    }

    var gameState = game.state;
    if (gameState !== GAME_STATE.PLAYING) {
        alert("Game is already over - this code path shouldn't happen!");
        return game;
    }
    const colors = calculatePattern(word, game.solution);
    if (colors.every(color => color === COLORS.GREEN)) {
        gameState = GAME_STATE.WON;
    } else if (game.guesses.length >= 5) {
        gameState = GAME_STATE.LOST;
    }

    if (!game.remainingAnswers) {
        game.remainingAnswers = possibleAnswers
    }
    const answersAfterGuess = pruneList(game.remainingAnswers, word, colors);

    return {...game, guesses: [...game.guesses, {word: word, colors: colors}], remainingAnswers : answersAfterGuess, error: null, state: gameState};
}

/**
 * Analyze a guess.
 * 
 * @param {string} guess - A guessed word.
 * @param {string[]} remainingAnswers - An array of the remaining possible answers.
 * 
 * @returns {number} expectedRemaining - The expected number of remaining answers after the guess.
 * @returns {number} buckets - The number of buckets the guess will produce for the possibleAnswers.
 * @returns {number} largestBucket - The size of the largest bucket.
 */
export function analyze(guess, remainingAnswers) {
    guess = guess.toLowerCase();

    const buckets = new Map();
    remainingAnswers.forEach(answer => {
        const pattern = calculatePattern(guess, answer).join('');
        if (!buckets.has(pattern)) {
            buckets.set(pattern, 1);
        } else {
            buckets.set(pattern, buckets.get(pattern) + 1);
        }
    });

    var largestBucket = 0;
    var expectedRemaining = 0;
    buckets.forEach((count) => {
        expectedRemaining += count * count / remainingAnswers.length;
        if (count > largestBucket)
            largestBucket = count;
    });
    // Adjust for the fact that the guess might be correct, which would reduce the number of remaining answers by 1
    if (remainingAnswers.includes(guess)) {
        expectedRemaining -= 1/remainingAnswers.length;
    }
    expectedRemaining = expectedRemaining.toFixed(2);

    return {expectedRemaining, buckets: buckets.size, largestBucket};
}

/**
 * Analyze a cheat guess.
 * 
 * @param {string} guess - A guessed word.
 * @param {COLORS[]} colors - The colors that would be returned for the guess.
 * @param {string[]} remainingAnswers - An array of the remaining possible answers.
 * 
 * @returns {Array<string>} remaining - The updated set of remaining answers.
 */
export function analyzeCheat (guess, colors, remainingAnswers) {
    guess = guess.toLowerCase();
    const matches = [];
    remainingAnswers.forEach(answer => {
        const pattern = calculatePattern(guess, answer);
        if (colors.every((color, index) => color === pattern[index])) {
            matches.push(answer);
        }
    });
    return matches;
}

/**
 * Analyze the current game state.
 * 
 * @param {string[]} [possibleAnswers] - An array of the remaining possible answers.
 * 
 * @returns {guess[]} guesses - A list of recommended guesses. Each one consists of:
 * @returns {string} guess.word - A word to guess
 * @returns {number} guess.expectedRemaining - The expected number of remaining possibilities.
 * @returns {number} guess.nuckets - The number of buckets.
 * @returns {number} guess.largestBucket - The size of the largest bucket.
 */
export function topGuesses(remainingAnswers) {
    // Precomputed answers for the opening guess
    if (remainingAnswers === null || remainingAnswers.length === possibleAnswers.length) {
        const preComputed = new Map([
            ["raise", "60.7"],
            ["arise", "63.5"],
            ["irate", "63.5"],
            ["arose", "65.8"],
            ["alter", "69.8"],
            ["later", "70.0"],
            ["saner", "70.0"],
            ["snare", "71.0"],
            ["stare", "71.0"],
            ["slate", "71.3"],
            ["alert", "71.5"],
            ["crate", "72.8"],
            ["trace", "73.9"],
            ["stale", "75.3"],
            ["aisle", "76.1"],
            ["learn", "76.7"],
            ["leant", "77.1"],
            ["alone", "77.2"],
            ["least", "78.0"],
            ["crane", "78.7"]
        ]);
        return preComputed;
    }

    // For each possible answer, find the expected remaining possibilities after guessing it
    const expectedRemaining = new Map();
    remainingAnswers.forEach(answer => {
        expectedRemaining.set(answer, analyze(answer, remainingAnswers).expectedRemaining);
    });

    // Sort the map by expectedRemaining
    const sorted = new Map([...expectedRemaining.entries()].sort((a, b) => a[1] - b[1]));

    // Filter to a map containing just the top 10 guesses
    const top = new Map([...sorted.entries()].slice(0, 20));

    return top;
}

/**
 * Calculate the pattern of a guess compared to an answer.
 * 
 * @param {string} guessed - The guessed word.
 * @param {string} answer - The answer word.
 * 
 * @returns {string[]} - The pattern of the guess.
 */
export function calculatePattern(guess, answer) {
    const WORD_SIZE = guess.length;

    let colors = new Array(WORD_SIZE); // To store the pattern we'll return
    let closeCount = new Map();
    let matchCount = new Map();

    // First calculate which indexes are green matches, which are grey misses, and rest we won't know yet
    // We'll keep track of the latter (ones we don't know yet) in "closeCount", so we can figure out how to color
    // these next. We also need to keep counts for letters that produced exact matches in matchCount.
    for (let i = 0; i < WORD_SIZE; i++) {
        let letter = guess.charAt(i);
        if (letter === answer.charAt(i)) {
            colors[i] = COLORS.GREEN;
            if (!matchCount.has(letter)) {
                matchCount.set(letter, 1);
            } else {
                matchCount.set(letter, matchCount.get(letter) + 1);
            }
        } else if (answer.indexOf(letter) < 0) {
            colors[i] = COLORS.GREY;
        } else {
            closeCount.set(letter, 1);
        }
    }

    // Next, keep track of how many yellows we need to mark for each letter:
    for (let letter of closeCount.keys()) {
        let count = Math.min(countOccurrences(answer, letter), countOccurrences(guess, letter));
        if (!matchCount.has(letter)) {
            closeCount.set(letter, count);
        } else {
            closeCount.set(letter, count - matchCount.get(letter));
        }
    }

    // Finally, mark the null values in "pattern" with either yellow or grey...
    for (let i = 0; i < WORD_SIZE; i++) {
        if (!colors[i]) {
            let letter = guess.charAt(i);
            let count = closeCount.get(letter);
            if (count > 0) {
                colors[i] = COLORS.YELLOW;
                closeCount.set(letter, count - 1);
            } else {
                colors[i] = COLORS.GREY;
            }
        }
    }

    return colors;
}

/**
 * Count the occurrences of a letter in a word.
 * 
 * @param {string} answer - The word to search.
 * @param {string} letter - The letter to search for.
 * 
 * @returns {number} - The number of occurrences of the letter in the word.
 */
function countOccurrences(answer, letter) {
    return answer.split(letter).length - 1;
}
