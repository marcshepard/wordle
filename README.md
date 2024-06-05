# Overview

A wordle app web app that can analyze the play and give suggestions.

This is a partial port of a Java app I once wrote (pre-wordle-bot) to better understand optimal opening words and play. It currently just implements "play" (playing a game where it picks a random word to guess). In the future I may port over the "cheat" mode as well (where it doesn't know the answer - you tell it what you guessed and the colors you got back and it performs the analysis from that).

This folder is the front-end of a wordle app, written in react/javascript.
The backend is in the ..\..\apis\workdle folder, written in C#.
They are hosted at <TODO - add URLS once deployed>.

The main goal of this app is to practice putting code in the launch playground environment, as well as practicing the things Joe suggested
* More practice developing in react, using Azure, and using MSAL (my first foray into that was a [chat-app](https://github.com/marcshepard/chat-app)
* Learn to write a back-end in C#
* Use the MSAL default tenant (previous project I used B2C as it was a consumer-like app)
* Simplify the development and deployment structure:
    * Front-end and back-end in the same repo
    * Deployment workflow triggers filtered to the right folder
    * Push environment variables in the workflow
* Time permitting; add semenatic kernel (although it's not a clear fit for this project, so I might instead do that in my chat-app)

A secondary goal is to convert an old Python based wordle analyzer to the web to make it easier to use.


The Chat API is a REST API that uses a cookie to share state with the client. It has two methods:
* New:
    * Paremeters: none
    * Returns: none (although it modifies the cookie to show a new state)
* Guess:
    * Parameters: A 5 letter word
    * Returns: 5 colors
* Analyze:
    * Parameters: (optional) guess: a 5 letter word representing a guess you want to evaluate
    * Returns: json data of the form:
        num_remaining: <number of possible answers remaining given prior guesses>
        guess_eval: (expected remaining, num_buckets, largest_bucket)
        recommended_guesses: <list of (guess, expected remaining) for the top 5 guesses>
