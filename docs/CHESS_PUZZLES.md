# Chess studio

The 24 bundled positions come from the [Lichess CC0 puzzle database](https://database.lichess.org/#puzzles), retrieved from its [official Hugging Face dataset](https://huggingface.co/datasets/Lichess/chess-puzzles). IDs, FENs, setup moves, solution lines, themes and snapshot ratings are retained in `src/components/easter/chessPuzzles.json`. Each position links to its source puzzle.

There are eight positions per level. Beginner puzzles are simple mates in one; intermediate puzzles introduce two-move sequences; advanced puzzles use higher-rated two- and three-move combinations. The displayed ratings are puzzle ratings from the source snapshot, not player ratings or a live feed.

## Play behavior

- Shuffle each difficulty set and avoid an immediate repeat, including across window reopenings. Retain the selected difficulty during the page session.
- Apply the original opponent setup move before showing the board. Orient the board for the solving side.
- Use [chess.js](https://jhlywa.github.io/chess.js/) for legal moves, king safety, captures, castling, en passant, promotion and checkmate.
- Follow the source's unique solution line; accept any alternative move that actually checkmates.
- Give three attempts across the complete puzzle. A wrong legal move spends one attempt and retains the last correct position. Illegal input and piece selection spend none.
- Play the opponent's reply automatically. Cancel pending replies when changing puzzles or closing the window.
- After three mistakes, offer solution notation, a fresh retry, or another random puzzle. Hints do not consume attempts.
- Support arrow-key board navigation, Enter to select/move, a promotion picker, focus containment and Escape to close.

Chess code, rules and puzzle data form a lazy chunk. Opening the portfolio does not load them. Saved offline releases include the chunk and need no puzzle API, engine download or account. The rules library is not a chess AI; opponent moves come from the validated solution line.

The unit suite plays every complete line and checks final checkmate, attempts, alternate mates, promotion, retained progress and shuffled sets. Browser checks exercise the actual board, difficulty selection, attempts, opponent replies and window reopening on desktop and mobile.

chess.js is BSD-2-Clause licensed; its notice is distributed in [`public/chess-js-LICENSE.txt`](../public/chess-js-LICENSE.txt).
