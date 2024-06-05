/** 
 * @file App.js is the root component of this Wordle react app
 */


import { useState, useRef, useEffect } from 'react';
import Modal from 'react-modal';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import './App.css';
import { SignInButton, SignOutButton, Authenticated, Unauthenticated, AuthProviderAppWrapper } from "./MsalSignin";
import { newGame, guess, analyze, topGuesses, COLORS, GAME_STATE } from "./gameEngine.js"
import { allowedGuesses, possibleAnswers } from './wordleWords.js';

// Configuration variables
const APP_NAME = "Wordle Analyzer";
const LOGO = `${process.env.PUBLIC_URL}/logo.png`;

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
 * SignInHeader: A header for the sign-in page, with app logo, name, and a sign-in button
 * 
 * @param {string} logo - The URL of the app logo
 * @param {string} appName - The name of the app
 * 
 * @returns {JSX.Element} The app header
 */
function SignInHeader({logo, appName}) {
  return (
    <div className="Signin-header">
      <img src={logo} alt="logo" className="App-logo" />
      <h1>{appName}</h1>
      <div className="Sign-out-button">
        <SignInButton />
      </div>
    </div>      
  );
}

/**
 * A modal dialog for help
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
        <h2 align="Center">About wordle analyzer v1.0</h2>
        <p>This app will help you learn to optimize your wordle play. A few key concepts:</p>
        <ol>
          <li>Wordle starts with a random word from a fixed list of possible answers, which are common words and never plurals.</li>
          <li>The set of remaining possible answers shrinks as you make guesses and get back colors; green = right letter right spot, yellow=right letter wrong spot, grey=wrong letter.</li>
          <li>An optimal guess will, on average, shrink the number of remaining answers the most.
            For example, if the remaining answers are [CRANE, CRANK, CRAVE, CRAMP, and CRAZY], then CRAVE as it will either be right or there will only be 1 remaining answer left.</li>
        </ol>
        <p>There are three modes of play</p>
        <ul>
          <li><b>No Hints</b> - Normal wordle play</li>
          <li><b>Hints</b> - After each guess, you can get hints and the chance for a redo</li>
          <li><b>Cheat</b> - Assists in an external online puzzle; you enter your guess and the colors you got back and get hints</li>
        </ul>
      </div>
    </Modal>
  );
}

/**
 * A modal dialog for hints
 * 
 * @returns {JSX.Element} Help component
 */
function HintsModal({modalIsOpen, setModalIsOpen, game, word, onSubmit}) {
  const [maxHints, setMaxHints] = useState(false);

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
      onRequestClose={() => setModalIsOpen(false)}
      contentLabel="Help Modal"
      className="Help"
    >
      <button className="Help-close" onClick={() => setModalIsOpen(false)}>x</button>
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
            <p>Top guesses based on expected remaining answers:</p>
            <select style={{ fontFamily: 'monospace' }}>
              {Array.from(topGuesses(game.remainingAnswers)).map(([word, expectedRemaining]) => (
                <option key={word}>{word.toUpperCase()}, {expectedRemaining}</option>
              ))}
            </select>
          </div>
        }
        <br />

        <button style={{ marginRight: "10px" }} onClick={() => setModalIsOpen(false)}>Change my guess</button>
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
 * @param {onChange} - The function to call when the entered word changes
 * @param {onEnter} - The function to call when the enter key is pressed, should return a true/false if the entered word is valid and they keyboard should be cleared
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
          if (!onEnter()) {
            keyboardRef.current.clearInput();
          }
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
      if (!onEnter()) {
        keyboardRef.current.clearInput();
      }
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

// Use the Colors enum in the Grid component
function Grid({ guessed, word, shake }) {
  const paddedWord = word.toUpperCase().padEnd(5, " ");
  return (
    <div className={shake? "Centered Shake" : "Centered"} >
      <table className="Letter-table">
        <tbody>
          {guessed.map((guess, i) => (            // Display the guessed words
            <tr key={i}>
              {guess.colors.map((color, j) => (
                <td key={j} className={TILE_CLASS_NAMES[color]}>{guess.word[j].toUpperCase()}</td>
              ))}
            </tr>
          ))}

          {guessed.length < 6 &&                  // Display in-progress guess if the game isn't over
            <tr>
              {paddedWord.split("").map((letter, i) => (
                <td className={TILE_CLASS_NAMES[COLORS.EMPTY]} key={i}>{letter}</td>
              ))}
            </tr>
          }

          {guessed.length < 5 &&    // Pad out with empty tiles to make 6 rows
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
  const [keyboardRef, setKeyboardRef] = useState(null);     // The keyboard component reference
  const [num, setNum] = useState(0);                        // A dummy variable to force a re-render

  // As gameMode is toggled, persist to local storage to remember the user's preference for next time
  useEffect(() => {
    localStorage.setItem("gameMode", gameMode);
  }, [gameMode]);

  const word = keyboardRef ? keyboardRef.getInput() : "";  // The current word being guessed


  // Calculate guessed button colors to pass to the virtual keyboard
  const guessedButtons = {green: [], yellow: [], grey: []};
  for (const guess of game.guesses) {
    for (let i = 0; i < 5; i++) {
      if (guess.colors[i] === COLORS.GREEN) {
        guessedButtons.green.push(guess.word[i].toUpperCase());
      } else if (guess.colors[i] === COLORS.YELLOW) {
        guessedButtons.yellow.push(guess.word[i].toUpperCase());
      } else if (guess.colors[i] === COLORS.GREY) {
        guessedButtons.grey.push(guess.word[i].toUpperCase());
      }
    }
  }

  // Start a new game
  function startNewGame() {
    setGame(newGame());
    keyboardRef.clearInput();
  }

  // Handle display updates as the user types letters in the keyboard control
  function handleWordChange() {
    setNum(num + 1);  // Force a re-render to get the current word from the keyboard
  }

  function handleWordEntered() {
    if (gameMode === GAME_MODES.HINTS) {
      setHintsModalIsOpen(true);  // Open up the hints model
      return true;                // Leave it up to the hints modal if the game should be updated or not
    }
    const gameUpdate = guess(game, word);
    updateGame(gameUpdate);
  }

  // Handle a new word being entered
  function updateGame(gameUpdate) {
    setHintsModalIsOpen(false);
    setGame(gameUpdate);

    // If the game is over, clear the last guessed word
    if (gameUpdate.state !== GAME_STATE.PLAYING) {
      keyboardRef.clearInput();
      return false;
    }

    // If the guessed word is valid and consumed into gameUpdate, then clear it
    if (!gameUpdate.error) {
      keyboardRef.clearInput();
      return false;
    }

    // Else game still but guess was invalid. Clear the err message after 2 seconds, preserve the word.
    setTimeout(() => setGame({...gameUpdate, error: null}), 2000);
    return true;
  }

  return (
    <div className="App">
      <Authenticated>
        <div className="App-header">
          <button title="Start a new game" onClick={() => startNewGame()}>New Game</button>
          <select title="Toggle play mode - see help for details" value={gameMode} onChange={event => setGameMode(event.target.value)}>
            <option value={GAME_MODES.HINTS}>{GAME_MODES.HINTS}</option>
            <option value={GAME_MODES.NO_HINTS}>{GAME_MODES.NO_HINTS}</option>
            <option value={GAME_MODES.CHEAT} disabled>{GAME_MODES.CHEAT}</option>
          </select>
          <button title="Learn about the wordle analyzer" onClick={() => setHelpModalIsOpen(true)}>Help</button>
          <SignOutButton />
        </div>
        <p className="error-message">{game.error || ""}</p>
        <Grid guessed={game.guesses} word={word} shake={game.error}/>
        <br />
        {game.state === GAME_STATE.PLAYING && <MobileKeyboard
            setKeyboardRef={setKeyboardRef}
            onChange={handleWordChange} onEnter={handleWordEntered} guessedButtons={guessedButtons}/>}
        {game.state === GAME_STATE.LOST && <p>You lost. The word was {game.solution.toUpperCase()}</p>}
        {game.state === GAME_STATE.WON && <p>You Won!</p>}
        <HelpModal modalIsOpen={helpModalIsOpen} onModalClose={() => setHelpModalIsOpen(false)}/>
        <HintsModal modalIsOpen={hintsModalIsOpen} setModalIsOpen={setHintsModalIsOpen} game={game} word={word} onSubmit={updateGame}/>
      </Authenticated>
      <Unauthenticated>
        <SignInHeader logo={LOGO} appName={APP_NAME} />
      </Unauthenticated>
    </div>
  );
}

function App() {
  return (
    <AuthProviderAppWrapper>
      <Wordle />
    </AuthProviderAppWrapper>
  );
}

export default App;
