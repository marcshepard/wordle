/** 
 * @file App.js is the root component of this Wordle react app
 */


import { useState, useRef, useEffect } from 'react';
import Modal from 'react-modal';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import './App.css';
import { newGame, guess, analyze, topGuesses, COLORS, GAME_STATE, analyzeCheat } from "./gameEngine.js"
import { allowedGuesses, possibleAnswers } from './wordleWords.js';


// The names of the CSS classes for the different tile colors
const TILE_CLASS_NAMES = {
  [COLORS.GREEN]: "Green-background Letter-tile",
  [COLORS.YELLOW]: "Yellow-background Letter-tile",
  [COLORS.GREY]: "Grey-background Letter-tile",
  [COLORS.EMPTY]: "Empty-background Letter-tile"
};

// Game modes
const GAME_MODES = {
  NO_HINTS: "No Hints",
  HINTS: "Hints",
  CHEAT: "Cheat"
};

Modal.setAppElement('#root');   // For accessibility


/**
 * A modal dialog for help
 * 
 * @param {boolean} modalIsOpen - If the modal is open or not
 * @param {function} onModalClose - Callback when the modal is closed
 * 
 * @returns {JSX.Element} Help component
 */
function HelpModal({modalIsOpen, onModalClose}) {
  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={onModalClose}
      contentLabel="Help Modal"
      className = "Help"
    >
      <button className="Help-close" onClick={onModalClose}>x</button>
      <div>
        <h2 align="Center">About wordle analyzer</h2>
        <p>This app will help you learn to optimize your wordle play. A few key concepts:</p>
        <ol>
          <li>Wordle starts with a random word from a fixed list of possible answers, which are common words and never plurals.</li>
          <li>The set of remaining possible answers shrinks as you make guesses and get back colors;
            <ul>
            <li> <span className="Green-background">green</span>: right letter, right spot</li>
            <li> <span className="Yellow-background">yellow</span>: right letter, wrong spot</li>
            <li> <span className="Grey-background">grey</span>: wrong letter</li>
            </ul>
          </li>
          <li>An optimal guess will, on average, shrink the number of remaining answers the most.
            For example, if the remaining answers are [CRANE, CRANK, CRAVE, CRAMP, and CRAZY], then CRAVE as it will either be right or there will only be 1 remaining answer left.</li>
        </ol>
        <p>There are three modes of play</p>
        <ul>
          <li><b>No Hints</b> - Normal wordle play</li>
          <li><b>Hints</b> - After each guess, you can get hints and the chance for a redo</li>
          <li><b>Cheat</b> - Assists in an external online puzzle; you enter your guess and the colors you got back and get hints</li>
        </ul>
        <p>Wordle analyzer version: 1.1</p>
      </div>
    </Modal>
  );
}

/**
 * A modal dialog for cheat hints, displayed after they have entered their previous guess
 * 
 * @param {boolean} modalIsOpen - If the modal is open or not
 * @param {function} onModalClose - Callback when the modal is closed
 * @param {Array<string, COLORS[]>} game - The current game state
 * 
 * @returns {JSX.Element} Help component
 */
function CheatModal({modalIsOpen, onModalClose, game}) {
  const [maxHints, setMaxHints] = useState(false);

  if (!modalIsOpen) {
    return (<Modal isOpen={false}/>);
  }

  const remainingAnswers = game.remainingAnswers;

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={onModalClose}
      contentLabel="Cheat Modal"
      className="Help"
    >
      <button className="Help-close" onClick={onModalClose}>x</button>
      <div>
        <h2 align="Center">Hints</h2>
        <button onClick={() => setMaxHints(!maxHints)}>{maxHints? "Less" : "More"} hints</button>
        <p>Remaining answers: {remainingAnswers.length}</p>
        {maxHints &&
          <div>
            <p>Top guesses based on expected remaining answers:</p>
            <select style={{ fontFamily: 'monospace' }}>
              {Array.from(topGuesses(game.remainingAnswers)).map(([word, expectedRemaining]) => (
                <option key={word}>{word.toUpperCase()}, {expectedRemaining}</option>
              ))}
            </select>
          </div>
        }
        <br />
      </div>
    </Modal>
  );
}

/**
 * A modal dialog for hints
 * 
 * @param {boolean} modalIsOpen - If the modal is open or not
 * @param {function} onModalClose - Callback when the modal is closed
 * @param {Object} game - The current game state
 * @param {string} word - The word being guessed
 * @param {function} onSubmit - Callback when the user submits a guess
 * 
 * @returns {JSX.Element} Help component
 */
function HintsModal({modalIsOpen, onModalClose, game, word, onSubmit}) {
  const [maxHints, setMaxHints] = useState(false);

  if (!modalIsOpen) {
    return (<Modal isOpen={false}/>);
  }

  const gameUpdate = guess(game, word);
  const analysis = analyze(word, game.remainingAnswers)
  const remainingAnswers = game.remainingAnswers ? game.remainingAnswers : possibleAnswers;
  const validGuess = possibleAnswers.includes(word.toLowerCase()) || allowedGuesses.includes(word.toLowerCase());
  const possibleAnswer = remainingAnswers.includes(word.toLowerCase());
  const helpfulGuess = analysis.expectedRemaining < remainingAnswers.length;
  const oneRemaining = remainingAnswers.length === 1;
  const isSolution = oneRemaining && remainingAnswers[0] === word.toLowerCase();

  
  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={onModalClose}
      contentLabel="Help Modal"
      className="Help"
    >
      <button className="Help-close" onClick={onModalClose}>x</button>
      <div>
        <h2 align="Center">Hints</h2>
        <button onClick={() => setMaxHints(!maxHints)}>{maxHints? "Less" : "More"} hints</button>
        {!validGuess && <p>{word} is not a valid wordle guess. Try again.</p>}
        {validGuess && oneRemaining && isSolution && <p>There was only one remaining solution, and you guessed it!</p>}
        {validGuess && oneRemaining && !isSolution && <p>There was only one remaining solution, and {word} wasn't it.</p>}
        {validGuess && !oneRemaining && <p>Your guess {word} {possibleAnswer ? "is" : "is not"}
        {" one of the remaining " + remainingAnswers.length + " possible answers"}.</p>}
        {validGuess && !oneRemaining && helpfulGuess && <p>It will, on average, reduce the remaining answers to {analysis.expectedRemaining} by
          creating {analysis.buckets} color buckets, the largest having {analysis.largestBucket} words.</p>}
        {validGuess && !oneRemaining && !helpfulGuess && <p>And it won't eliminate any of the remaining possible answers,
          so you really should try a different guess.</p>}
        {maxHints && !isSolution &&
          <div>
            <p>Top guesses based on expected remaining answers after the guess:</p>
            <select style={{ fontFamily: 'monospace' }}>
              {Array.from(topGuesses(game.remainingAnswers)).map(([word, expectedRemaining]) => (
                <option key={word}>{word.toUpperCase()}, {expectedRemaining}</option>
              ))}
            </select>
          </div>
        }
        <br />

        <button style={{ marginRight: "10px" }} onClick={onModalClose}>Change my guess</button>
        {validGuess && <button onClick={() => onSubmit(gameUpdate)}>Submit {word}</button>}
      </div>
    </Modal>
  );
}

/**
 * A virtual keyboard for mobile devices which also collects physical keyboard input on PCs
 * Customized for wordle; only allows 5 letter words, color keys based on guesses, limited keys
 * Must define classNames in .css for:
 * -KB-green, KB-yellow, KB-grey, and KB-default - key colors
 * -react-simple-keyboard - color between keys (the apps background color)
 * -Keyboard - the size of the Keyboard
 * 
 * @param {function} onChange - Callback when the entered word changes
 * @param {function} onEnter - Callback when a work is entered (only called if all 5 letters are entered)
 * @param {Array<[string, COLORS[]]>} guessedButtons - An array of previously guessed (words, colors)
 * @param {function} setKeyboardRef - Callback to let the parent control get the keyboard reference (so it can see the currently entered word and reset it)
 *
 * @returns {JSX.Element} MobileKeyboard component
 */
function MobileKeyboard({onChange, onEnter, guessedButtons, setKeyboardRef}) {
  const keyboardRef = useRef();

  useEffect(() => {
    setKeyboardRef(keyboardRef.current);
  }, [setKeyboardRef, keyboardRef]);

  // Add an event listener to the document to capture physical keyboard input in the PC
  // I'd have prefered to use physicalKeyboardHighlight={true}, but that won't map lower case letters to
  // the upper case ones shown on the keyboard...
  useEffect(() => {
    const handleKeyDown = (event) => {      
      const key = event.key.toUpperCase();
      if (key.length === 1 && key.match(/[A-Z]/) && keyboardRef.current.getInput().length < 5) {
        const newInput = keyboardRef.current.getInput() + key;
        keyboardRef.current.setInput(newInput);
        onChange();
      } else if (event.key === "Backspace" && keyboardRef.current.getInput().length > 0) {
        const newInput = keyboardRef.current.getInput().slice(0, -1);
        keyboardRef.current.setInput(newInput);
        onChange();
      } else if (event.key === "Enter") {
        if (keyboardRef.current.getInput().length === 5) {
          onEnter();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function to remove the event listener when the component unmounts
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onChange, onEnter]);

  function handleKeyPress(button) {
    if (button === "{enter}" && keyboardRef.current.getInput().length === 5) {
      onEnter();
    }
  }

  function handleChange(input) {
    onChange(input);
  }

  // Everthing below here is just styling the keyboard

  const keyboardLayout = {
    'default': [
      "Q W E R T Y U I O P",
      "A S D F G H J K L",
      "{bksp} Z X C V B N M {enter}"
    ]
  }

  const keyboardDisplay = {
      '{bksp}': 'Back',
      '{enter}': 'Enter'
  };

  const buttonTheme = [];
  if (guessedButtons.green && guessedButtons.green.length > 0) {
    buttonTheme.push({
      class: "KB-green",
      buttons: guessedButtons.green.join(" ")
    });
  }
  if (guessedButtons.yellow && guessedButtons.yellow.length > 0) {
    buttonTheme.push({
      class: "KB-yellow",
      buttons: guessedButtons.yellow.join(" ")
    });
  }
  if (guessedButtons.grey && guessedButtons.grey.length > 0) {
    buttonTheme.push({
      class: "KB-grey",
      buttons: guessedButtons.grey.join(" ")
    });
  }
  var defaultButtons = ["{bksp}", "{enter}"];
  for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    if (!guessedButtons.green.includes(letter) && !guessedButtons.yellow.includes(letter) && !guessedButtons.grey.includes(letter)) {
      defaultButtons.push(letter);
    }
  }
  buttonTheme.push({
    class: "KB-default",
    buttons: defaultButtons.join(" ")
  });

  return (
    <div className="Keyboard">
      <Keyboard
        keyboardRef={(r) => { keyboardRef.current = r; }}
        layoutName="default"
        maxLength={5}
        layout={keyboardLayout}
        display={keyboardDisplay}
        buttonTheme={buttonTheme}
        onKeyPress={handleKeyPress}
        onChange={handleChange}
      />
    </div>
  );
}

/**
 * A grid control to show the words guesses and colors
 * 
 * @param {Array<[string, COLORS]>} guessed - The array of previously guessed words and their colors 
 * @param {string} word - The word being guessed
 * @param {boolean} shake - If true, the grid will shake breifly to indicate an error
 * @param {COLORS[]} cheatColors - only passed in CheatMode, to allow the user to change the colors of word
 * @param {function} setCheatColors - only passed in CheatMode, to allow this control to update the colors on click
 * 
 * @returns {JSX.Element} The grid component
 */
function Grid({ guessed, word, shake, cheatColors, setCheatColors }) {
  // Toggle the colors of the word being guessed in cheat mode
  function onColorsSet(i) {
    if (word.length < i + 1 || !setCheatColors) {  // Can only change the color of a tile that has a letter in it
      return;
    }
    if (cheatColors[i] === COLORS.EMPTY) {
      setCheatColors(cheatColors.map((color, j) => j === i ? COLORS.GREY : color));
    } else if (cheatColors[i] === COLORS.GREY) {
      setCheatColors(cheatColors.map((color, j) => j === i ? COLORS.YELLOW : color));
    } else if (cheatColors[i] === COLORS.YELLOW) {
      setCheatColors(cheatColors.map((color, j) => j === i ? COLORS.GREEN : color));
    } else {
      setCheatColors(cheatColors.map((color, j) => j === i ? COLORS.GREY : color));
    }
  }

  const paddedWord = word.toUpperCase().padEnd(5, " ");
  return (
    <div className={shake? "Centered Shake" : "Centered"} >
      <table className="Letter-table">
        <tbody>
          {/*Render the rows of already-guessed words*/}
          {guessed.map((guess, i) => (
            <tr key={i}>
              {guess.colors.map((color, j) => (
                <td key={j} className={TILE_CLASS_NAMES[color]}><b>{guess.word[j].toUpperCase()}</b></td>
              ))}
            </tr>
          ))}

          {/*Render the word being guessed if the game isn't over */}
          {guessed.length < 6 &&
            <tr>
              {paddedWord.split("").map((letter, i) => (
                <td onClick={setCheatColors ? () => onColorsSet(i) : null}
                  className={TILE_CLASS_NAMES[cheatColors[i]]} key={i}><b>{letter}</b></td>
              ))}
            </tr>
          }

          {/*Render empty rows as needed to pad things out to 6 rows */}
          {guessed.length < 5 &&
            [...Array(6 - guessed.length - 1)].map((_, i) => (
              <tr key={i + guessed.length + 1}>
                {[...Array(5)].map((_, j) => (
                  <td key={j} className={TILE_CLASS_NAMES[COLORS.EMPTY]}></td>
                ))}
              </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * @component Wordle the Wordle Analyzer app
 * 
 * @returns {JSX.Element} App component
 */
function Wordle() {
  const initialGameMode = localStorage.getItem("gameMode") || GAME_MODES.HINTS;
  const [game, setGame] = useState(newGame());                // The current game state
  const [gameMode, setGameMode] = useState(initialGameMode);  // Toggles between hints, no hints, and cheat modes
  const [helpModalIsOpen, setHelpModalIsOpen] = useState(false); // Toggles if the help modal dialog is open or not
  const [hintsModalIsOpen, setHintsModalIsOpen] = useState(false); // Toggles if the hints modal dialog is open or not
  const [cheatModalIsOpen, setCheatModalIsOpen] = useState(false); // Toggles if the cheats modal dialog is open or not
  const [keyboardRef, setKeyboardRef] = useState(null);     // The keyboard component reference
  const [num, setNum] = useState(0);                        // A dummy variable to force a re-render
  const [cheatColors, setCheatColors] = useState(Array(5).fill(COLORS.EMPTY));     // Colors of the word being guessed in cheat mode

  // As gameMode is toggled, persist to local storage to remember the user's preference for next time
  useEffect(() => {
    localStorage.setItem("gameMode", gameMode);
  }, [gameMode]);

  const word = keyboardRef ? keyboardRef.getInput() : "";  // The current word being guessed

  // Calculate guessed button colors to pass to the virtual keyboard
  const guessedButtons = {green: [], yellow: [], grey: []};
  for (const guess of game.guesses) { // Green if any guess of that letter got green
    for (let i = 0; i < 5; i++) {
      if (guess.colors[i] === COLORS.GREEN) {
        guessedButtons.green.push(guess.word[i].toUpperCase());
      }
    }
  }
  for (const guess of game.guesses) {
    for (let i = 0; i < 5; i++) { // Yellow if any guess of that letter got yellow and is not green
      if (guess.colors[i] === COLORS.YELLOW && !guessedButtons.green.includes(guess.word[i].toUpperCase())) {
        guessedButtons.yellow.push(guess.word[i].toUpperCase());
      }
    }
  }
  for (const guess of game.guesses) {
    for (let i = 0; i < 5; i++) { // If it was guessed and never green or yellow, then color it grey
      if (guess.colors[i] === COLORS.GREY && !guessedButtons.green.includes(guess.word[i].toUpperCase()) && !guessedButtons.yellow.includes(guess.word[i].toUpperCase())) {
        guessedButtons.grey.push(guess.word[i].toUpperCase());
      }
    }
  }

  // Clear the current guess after after it has been succesfully entered
  // Called after a valid guess is made and the games guess history is updated
  function clearGuess() {
    keyboardRef.clearInput();
    setCheatColors(new Array(5).fill(COLORS.EMPTY));
  }

  // Start a new game
  function startNewGame() {
    setGame(newGame());
    clearGuess();
  }

  // Handle display updates as the user types letters in the keyboard control
  function handleWordChange() {
    setNum(num + 1);  // Force a re-render to get the current word from the keyboard
  }

  // Handle the user pressing enter in the keyboard control
  function handleWordEntered() {
    // In Hints mode, the hint modal will let the user decide if they want to update the game or not
    if (gameMode === GAME_MODES.HINTS) {
      // On Android, the model gets immediately closed. Trying delay opening as workaround in case the issue
      // is the virtual keyboard sending additional events after the enter key is pressed.
      setTimeout(() => setHintsModalIsOpen(true), 200);
      return;
    }

    // In no hints play, just update the game
    if (gameMode === GAME_MODES.NO_HINTS) {
      const gameUpdate = guess(game, word);
      updateGame(gameUpdate);
      if (gameUpdate.guesses.length > game.guesses.length)
        clearGuess();
      return;
    }

    // In cheat mode, update the game if there were no entry errors and show cheat model for hints on next guess
    if (gameMode === GAME_MODES.CHEAT) {
      const gameUpdate = {...game};   // Make a copy of the game to update
      // If any cheatColors are empty, let the user know they need to set them all
      if (cheatColors.includes(COLORS.EMPTY)) {
        gameUpdate.error = "In cheat mode, you must set all colors";
        setGame(gameUpdate);
        setTimeout(() => setGame({...gameUpdate, error: null}), 2000);
        return;
      }

      // If the guess and color combination won't leave any remaining possible answers, let the user know the error
      const matches = analyzeCheat(word, cheatColors, game.remainingAnswers);
      if (matches.length === 0) {
        gameUpdate.error = "There are no words that match the guess and colors";
        setGame(gameUpdate);
        setTimeout(() => setGame({...gameUpdate, error: null}), 2000);
        return;
      }

      // Otherwise, update the game with the guess and colors and if the game is not won or loss,
      // show the cheat modal with hints for the next guess
      // If all the cheatColors are green, set gameUpdate to won
      if (cheatColors.every(color => color === COLORS.GREEN)) {
        gameUpdate.state = GAME_STATE.WON;
      } else if (gameUpdate.guesses.length >= 5) {
        gameUpdate.state = GAME_STATE.LOST;
      }
      gameUpdate.remainingAnswers = matches;
      gameUpdate.guesses = [...game.guesses, {word: word, colors: cheatColors}];      
      updateGame(gameUpdate);
      if (gameUpdate.state === GAME_STATE.PLAYING)
        // The 200ms delay is a workaround for the same Android issue as in Hints modal above
        setTimeout(() => setCheatModalIsOpen(true), 200);
      return;
    }

    console.error("I should never get here");
  }

  // Handle a new word being entered
  function updateGame(gameUpdate) {
    setHintsModalIsOpen(false);
    setGame(gameUpdate);

    // If the game is over, clear the last guessed word
    if (gameUpdate.state !== GAME_STATE.PLAYING) {
      clearGuess();
    }

    // If the guessed word is valid and consumed into gameUpdate, then clear it
    if (!gameUpdate.error) {
      clearGuess();
    }

    // Else guess was invalid. Clear the err message after 2 seconds, preserve the word.
    setTimeout(() => setGame({...gameUpdate, error: null}), 2000);
  }

  // Change the game mode
  function changeGameMode(mode) {
    // Set the new mode
    setGameMode(mode);

    // If changing to or from cheat mode, start a new game
    if ((mode === GAME_MODES.CHEAT && gameMode !== GAME_MODES.CHEAT) ||
        (mode !== GAME_MODES.CHEAT && gameMode === GAME_MODES.CHEAT)) {
      startNewGame();
    }
  }

  return (
    <div className="App">
      <div className="App-header">
        <button title="Start a new game" onClick={() => startNewGame()}>New Game</button>
        <select title="Toggle play mode - see help for details" value={gameMode} onChange={event => changeGameMode(event.target.value)}>
          <option value={GAME_MODES.HINTS}>{GAME_MODES.HINTS}</option>
          <option value={GAME_MODES.NO_HINTS}>{GAME_MODES.NO_HINTS}</option>
          <option value={GAME_MODES.CHEAT}>{GAME_MODES.CHEAT}</option>
        </select>
        <button title="Learn about the wordle analyzer" onClick={() => setHelpModalIsOpen(true)}>Help</button>
      </div>
      <p className="error-message">{game.error || ""}</p>
      <Grid guessed={game.guesses} word={word} shake={game.error}
        cheatColors={cheatColors} setCheatColors={gameMode === GAME_MODES.CHEAT ? setCheatColors : null}/>
      <br />
      {game.state === GAME_STATE.PLAYING && <MobileKeyboard
          setKeyboardRef={setKeyboardRef}
          onChange={handleWordChange} onEnter={handleWordEntered} guessedButtons={guessedButtons}/>}
      {game.state === GAME_STATE.LOST && <p>You lost. The word was {game.solution.toUpperCase()}</p>}
      {game.state === GAME_STATE.WON && <p>You Won!</p>}
      <HelpModal modalIsOpen={helpModalIsOpen} onModalClose={() => setHelpModalIsOpen(false)}/>
      <HintsModal modalIsOpen={hintsModalIsOpen} onModalClose={() => setHintsModalIsOpen(false)} game={game} word={word} onSubmit={updateGame}/>
      <CheatModal modalIsOpen={cheatModalIsOpen} onModalClose={() => setCheatModalIsOpen(false)} game={game}/>
    </div>
  );
}

/**
 * @component App the root component of the Wordle Analyzer app
 * 
 * @returns {JSX.Element} App component
 */
function App() {
  return (
    <Wordle />
  );
}

export default App;
