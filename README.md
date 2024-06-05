# Overview

A wordle app that can analyze the play and give suggestions.

It has three modes of play:
1) No hints - plays like wordle
2) Hints - evaluates your guess and optionally gives suggestions each time you enter a word
3) Cheat - let's you enter words and colors from online play and gives Hints on what to do next

It is hosted on github pages if you want to give it a try.

I originally wrote this in Java to learn optimal wordle strategies (the original was written before wordlebot was created), and to practice writing UI code in Java. This is a re-write in react to help me learn react, and also it is better as a web app as it is more easily accessible.

Note: The words list may be out-of-date; I'd grabbed it from the wordle source code a couple of years back and I see the word list is no longer in their source code. So the results of this vs wordlebot are no longer aligned (they were when wordlebot first came out, but things have drifted). But it seems to still be effective, solving a wordle puzzle in about 3.5 guesses on average.


