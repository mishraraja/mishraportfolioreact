import { arr, grid, yesNo, choose, paint } from "../../engine/scene";
import { formatValue } from "../../engine/trace";

const key = (r, c) => r + "," + c;

function range(a, b) {
  const out = [];
  for (let x = a; x <= b; x += 1) out.push(x);
  return out;
}

export const matrixProblems = [
  /* ------------------------------------------------------------------ */
  {
    slug: "set-matrix-zeroes",
    lc: 73,
    title: "Set Matrix Zeroes",
    world: "matrix",
    difficulty: "Medium",
    pattern: "matrix",
    emoji: "🕳️",
    statement: "If a cell is 0, set its entire row and column to 0. Do it in place.",
    story:
      "You're a building inspector marking condemned floors and shafts. You can't knock them down the moment you spot a crack, or the rubble would look like new cracks. So you leave sticky notes on the ground floor and the first shaft, then demolish everything at the end.",
    insight:
      "Use the first row and first column as markers for which columns and rows to zero. Remember separately whether the first row and first column themselves started with a 0.",
    complexity: { time: "O(m · n)", space: "O(1)", why: "A few passes over the grid; the markers live inside it." },
    inputs: [{ name: "matrix", kind: "matrix", maxRows: 5, maxCols: 5, min: -9, max: 9 }],
    examples: [
      { input: { matrix: [[1, 1, 1], [1, 0, 1], [1, 1, 1]] }, output: [[1, 0, 1], [0, 0, 0], [1, 0, 1]] },
      { input: { matrix: [[0, 1, 2, 0], [3, 4, 5, 2], [1, 3, 1, 5]] }, output: [[0, 0, 0, 0], [0, 4, 5, 0], [0, 3, 1, 0]] },
    ],
    trace({ matrix }, T) {
      const g = matrix;
      const m = g.length;
      const n = g[0].length;
      const firstRow = g[0].some((v) => v === 0);
      const firstCol = g.some((row) => row[0] === 0);
      const edges = () => {
        const out = {};
        range(0, n - 1).forEach((j) => {
          out[key(0, j)] = "cmp";
        });
        range(0, m - 1).forEach((i) => {
          out[key(i, 0)] = "cmp";
        });
        return out;
      };

      T.step(
        "The first row and first column become sticky notes: a 0 there will mean “zero this whole line later”. But first, remember whether those edges already had a 0 of their own.",
        [grid("matrix", g, { tones: edges() })],
        { ask: yesNo("Does the first row need zeroing at the very end?", firstRow, "Only if it held a 0 before we started writing notes into it.") }
      );
      T.step(`First row had a zero: ${firstRow}. First column had a zero: ${firstCol}. Now scan the inner cells.`, [grid("matrix", g, { tones: edges() })], {
        vars: { firstRowZero: firstRow, firstColZero: firstCol },
      });

      for (let i = 1; i < m; i += 1) {
        for (let j = 1; j < n; j += 1) {
          if (g[i][j] !== 0) continue;
          g[i][0] = 0;
          g[0][j] = 0;
          T.step(`A 0 at (${i}, ${j}). Leave notes: matrix[${i}][0] = 0 and matrix[0][${j}] = 0.`, [
            grid("matrix", g, { tones: { ...edges(), [key(i, j)]: "bad", [key(i, 0)]: "active", [key(0, j)]: "active" }, cursor: [i, j] }),
          ], { vars: { firstRowZero: firstRow, firstColZero: firstCol } });
        }
      }

      T.step("Now read the notes. An inner cell becomes 0 if its row's note or its column's note is 0.", [grid("matrix", g, { tones: edges() })]);
      for (let i = 1; i < m; i += 1) {
        const changed = {};
        for (let j = 1; j < n; j += 1) {
          if ((g[i][0] === 0 || g[0][j] === 0) && g[i][j] !== 0) {
            g[i][j] = 0;
            changed[key(i, j)] = "bad";
          }
        }
        const count = Object.keys(changed).length;
        if (count) {
          T.step(`Row ${i}: the notes say to zero ${count} cell${count === 1 ? "" : "s"}.`, [grid("matrix", g, { tones: { ...edges(), ...changed } })]);
        }
      }

      if (firstRow) {
        g[0].fill(0);
        T.step("The first row had a 0 from the start, so zero all of it.", [grid("matrix", g, { tones: Object.fromEntries(range(0, n - 1).map((j) => [key(0, j), "bad"])) })]);
      }
      if (firstCol) {
        range(0, m - 1).forEach((i) => {
          g[i][0] = 0;
        });
        T.step("The first column had a 0 from the start, so zero all of it.", [grid("matrix", g, { tones: Object.fromEntries(range(0, m - 1).map((i) => [key(i, 0), "bad"])) })]);
      }

      const zeros = {};
      g.forEach((row, i) =>
        row.forEach((v, j) => {
          if (v === 0) zeros[key(i, j)] = "found";
        })
      );
      T.step("Done — in place, with O(1) extra space.", [grid("matrix", g, { tones: zeros })]);
      return g;
    },
    java: `public void setZeroes(int[][] matrix) {
    int m = matrix.length, n = matrix[0].length;
    boolean firstRow = false, firstCol = false;
    for (int j = 0; j < n; j++) if (matrix[0][j] == 0) firstRow = true;
    for (int i = 0; i < m; i++) if (matrix[i][0] == 0) firstCol = true;
    for (int i = 1; i < m; i++)                  // leave notes on the edges
        for (int j = 1; j < n; j++)
            if (matrix[i][j] == 0) {
                matrix[i][0] = 0;
                matrix[0][j] = 0;
            }
    for (int i = 1; i < m; i++)                  // read the notes
        for (int j = 1; j < n; j++)
            if (matrix[i][0] == 0 || matrix[0][j] == 0) matrix[i][j] = 0;
    if (firstRow) Arrays.fill(matrix[0], 0);
    if (firstCol) for (int i = 0; i < m; i++) matrix[i][0] = 0;
}`,
    python: `def setZeroes(self, matrix: List[List[int]]) -> None:
    m, n = len(matrix), len(matrix[0])
    first_row = any(v == 0 for v in matrix[0])
    first_col = any(row[0] == 0 for row in matrix)
    for i in range(1, m):                 # leave notes on the edges
        for j in range(1, n):
            if matrix[i][j] == 0:
                matrix[i][0] = matrix[0][j] = 0
    for i in range(1, m):                 # read the notes
        for j in range(1, n):
            if matrix[i][0] == 0 or matrix[0][j] == 0:
                matrix[i][j] = 0
    if first_row:
        matrix[0] = [0] * n
    if first_col:
        for i in range(m):
            matrix[i][0] = 0`,
    quiz: {
      q: "Why not zero out a row and column the moment you find a 0?",
      options: [
        "The zeros you write would look like original zeros and spread across the whole matrix",
        "It's slower",
        "Arrays can't be changed while you read them",
        "It uses more memory",
      ],
      answer: 0,
      why: "That's why the work is split in two: first record what to zero, then zero it.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "spiral-matrix",
    lc: 54,
    title: "Spiral Matrix",
    world: "matrix",
    difficulty: "Medium",
    pattern: "matrix",
    emoji: "🌀",
    statement: "Return all elements of a matrix in spiral order, starting at the top-left and moving clockwise.",
    story:
      "Peel an onion one ring at a time. Walk along the top, down the right, back along the bottom and up the left — then step inside to the next ring and do it again, until there's nothing left.",
    insight: "Keep four boundaries: top, bottom, left, right. Walk one side, then shrink that boundary. Stop when the boundaries cross.",
    complexity: { time: "O(m · n)", space: "O(1) extra", why: "Every cell is visited exactly once." },
    inputs: [{ name: "matrix", kind: "matrix", maxRows: 5, maxCols: 5, min: -99, max: 99 }],
    examples: [
      { input: { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, output: [1, 2, 3, 6, 9, 8, 7, 4, 5] },
      { input: { matrix: [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]] }, output: [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7] },
    ],
    trace({ matrix }, T) {
      const g = matrix;
      const segments = [];
      let top = 0;
      let bottom = g.length - 1;
      let left = 0;
      let right = g[0].length - 1;
      const add = (dir, cells) => {
        if (cells.length) segments.push({ dir, cells });
      };
      while (top <= bottom && left <= right) {
        const topRow = top;
        add("→", range(left, right).map((j) => [topRow, j]));
        top += 1;
        const rightCol = right;
        add("↓", range(top, bottom).map((i) => [i, rightCol]));
        right -= 1;
        if (top <= bottom) {
          const bottomRow = bottom;
          add("←", range(left, right).reverse().map((j) => [bottomRow, j]));
          bottom -= 1;
        }
        if (left <= right) {
          const leftCol = left;
          add("↑", range(top, bottom).reverse().map((i) => [i, leftCol]));
          left += 1;
        }
      }

      const DIRS = ["→", "↓", "←", "↑"];
      const names = { "→": "along the top", "↓": "down the right side", "←": "back along the bottom", "↑": "up the left side" };
      const out = [];
      const seen = {};
      T.step("Peel the matrix like an onion: → along the top, ↓ down the right, ← along the bottom, ↑ up the left. Then shrink the boundaries and repeat.", [
        grid("matrix", g),
        arr("output", out),
      ]);

      segments.forEach((seg, k) => {
        const now = {};
        seg.cells.forEach(([r, c]) => {
          out.push(g[r][c]);
          now[key(r, c)] = "active";
        });
        const next = segments[k + 1];
        T.step(
          `${seg.dir} Walk ${names[seg.dir]}: ${seg.cells.map(([r, c]) => g[r][c]).join(", ")}.`,
          [grid("matrix", g, { tones: { ...seen, ...now } }), arr("output", out, { tones: paint(out.length - seg.cells.length, out.length - 1, "good") })],
          {
            ask: next
              ? choose("Which way does the walk turn next?", DIRS, DIRS.indexOf(next.dir), "The order always cycles → ↓ ← ↑. A side is only skipped when the boundaries have already crossed.")
              : undefined,
          }
        );
        seg.cells.forEach(([r, c]) => {
          seen[key(r, c)] = "visited";
        });
      });

      T.step(`Every cell visited exactly once: **${formatValue(out)}**.`, [
        grid("matrix", g, { tones: seen }),
        arr("output", out, { tones: paint(0, out.length - 1, "found") }),
      ]);
      return out;
    },
    java: `public List<Integer> spiralOrder(int[][] matrix) {
    List<Integer> out = new ArrayList<>();
    int top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1;
    while (top <= bottom && left <= right) {
        for (int j = left; j <= right; j++) out.add(matrix[top][j]);        // →
        top++;
        for (int i = top; i <= bottom; i++) out.add(matrix[i][right]);      // ↓
        right--;
        if (top <= bottom) {
            for (int j = right; j >= left; j--) out.add(matrix[bottom][j]); // ←
            bottom--;
        }
        if (left <= right) {
            for (int i = bottom; i >= top; i--) out.add(matrix[i][left]);   // ↑
            left++;
        }
    }
    return out;
}`,
    python: `def spiralOrder(self, matrix: List[List[int]]) -> List[int]:
    out = []
    top, bottom, left, right = 0, len(matrix) - 1, 0, len(matrix[0]) - 1
    while top <= bottom and left <= right:
        out += [matrix[top][j] for j in range(left, right + 1)]
        top += 1
        out += [matrix[i][right] for i in range(top, bottom + 1)]
        right -= 1
        if top <= bottom:
            out += [matrix[bottom][j] for j in range(right, left - 1, -1)]
            bottom -= 1
        if left <= right:
            out += [matrix[i][left] for i in range(bottom, top - 1, -1)]
            left += 1
    return out`,
    quiz: {
      q: "Why check top <= bottom before walking back along the bottom row?",
      options: [
        "After the top row and right column, a single remaining row would otherwise be read twice",
        "Only to avoid negative indices",
        "The bottom row is always empty",
        "It's purely a style choice",
      ],
      answer: 0,
      why: "In a one-row matrix, the top pass already read that row. Walking \"back along the bottom\" would repeat it in reverse.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "rotate-image",
    lc: 48,
    title: "Rotate Image",
    world: "matrix",
    difficulty: "Medium",
    pattern: "matrix",
    emoji: "🔄",
    statement: "Rotate an n × n matrix 90° clockwise, in place.",
    story:
      "Turning a photo a quarter-turn by hand is fiddly. Two easy moves do the same thing: flip the photo over its diagonal (like folding it corner to corner), then look at it in a mirror.",
    insight: "Transpose (swap matrix[i][j] with matrix[j][i]), then reverse each row. Together they make a clockwise quarter-turn.",
    complexity: { time: "O(n²)", space: "O(1)", why: "Every cell is swapped a constant number of times, in place." },
    inputs: [{ name: "matrix", kind: "matrix", maxRows: 5, maxCols: 5, square: true, min: -99, max: 99 }],
    examples: [
      { input: { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, output: [[7, 4, 1], [8, 5, 2], [9, 6, 3]] },
      {
        input: { matrix: [[5, 1, 9, 11], [2, 4, 8, 10], [13, 3, 6, 7], [15, 14, 12, 16]] },
        output: [[15, 13, 2, 5], [14, 3, 4, 1], [12, 6, 8, 9], [16, 7, 10, 11]],
      },
    ],
    trace({ matrix }, T) {
      const g = matrix;
      const n = g.length;
      const diagonal = () => Object.fromEntries(range(0, n - 1).map((i) => [key(i, i), "cmp"]));

      T.step("A clockwise quarter-turn in place is two simple moves: flip across the main diagonal (transpose), then mirror every row.", [
        grid("matrix", g, { tones: diagonal() }),
      ]);
      for (let i = 0; i < n; i += 1) {
        for (let j = i + 1; j < n; j += 1) {
          [g[i][j], g[j][i]] = [g[j][i], g[i][j]];
          T.step(`Transpose: swap (${i}, ${j}) with (${j}, ${i}).`, [
            grid("matrix", g, { tones: { ...diagonal(), [key(i, j)]: "active", [key(j, i)]: "active" } }),
          ]);
        }
      }
      T.step("Transposed: rows became columns, but the picture is a mirror image of the goal.", [grid("matrix", g)], {
        ask: choose(
          "To finish a clockwise turn, what do we mirror?",
          ["Each row (left ↔ right)", "Each column (top ↔ bottom)"],
          0,
          "Mirroring rows gives a clockwise turn; mirroring columns would give a counter-clockwise one."
        ),
      });
      for (let i = 0; i < n; i += 1) {
        g[i].reverse();
        T.step(`Mirror row ${i}: ${g[i].join(", ")}.`, [
          grid("matrix", g, { tones: Object.fromEntries(range(0, n - 1).map((j) => [key(i, j), "good"])) }),
        ]);
      }
      T.step(`Rotated: **${formatValue(g)}**.`, [grid("matrix", g)]);
      return g;
    },
    java: `public void rotate(int[][] matrix) {
    int n = matrix.length;
    for (int i = 0; i < n; i++)                  // 1. transpose: flip across the diagonal
        for (int j = i + 1; j < n; j++) {
            int tmp = matrix[i][j];
            matrix[i][j] = matrix[j][i];
            matrix[j][i] = tmp;
        }
    for (int[] row : matrix)                     // 2. mirror each row
        for (int l = 0, r = n - 1; l < r; l++, r--) {
            int tmp = row[l];
            row[l] = row[r];
            row[r] = tmp;
        }
}`,
    python: `def rotate(self, matrix: List[List[int]]) -> None:
    n = len(matrix)
    for i in range(n):                    # 1. transpose
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    for row in matrix:                    # 2. mirror each row
        row.reverse()`,
    quiz: {
      q: "Rotating 90° clockwise is the same as which two steps?",
      options: ["Transpose, then reverse each row", "Reverse each row, then reverse each column", "Transpose twice", "Reverse the whole matrix"],
      answer: 0,
      why: "Transposing sends (i, j) to (j, i); reversing rows then sends it to (j, n − 1 − i), which is exactly a clockwise quarter-turn.",
    },
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "word-search",
    lc: 79,
    title: "Word Search",
    world: "matrix",
    difficulty: "Medium",
    pattern: "backtracking",
    emoji: "🧗",
    statement: "Decide whether a word can be traced through horizontally or vertically adjacent cells of a letter grid, using each cell at most once.",
    story:
      "A rock climber follows a route of handholds spelling a word. At each hold they try the four directions for the next letter. Hit a dead end and they climb back down one hold, freeing it up, and try another way.",
    insight: "DFS from every cell that matches the first letter. Mark cells as used on the way in, and unmark them on the way back out (backtracking).",
    complexity: { time: "O(cells · 3^L)", space: "O(L)", why: "After the first step, each move has at most 3 unused directions; recursion depth is the word length." },
    inputs: [
      { name: "board", kind: "charGrid", maxRows: 4, maxCols: 5, pattern: /^[A-Za-z]$/, patternHint: "Use letters only." },
      { name: "word", kind: "string", minLen: 1, maxLen: 8, pattern: /^[A-Za-z]+$/, patternHint: "Use letters only." },
    ],
    examples: [
      { input: { board: [["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], word: "ABCCED" }, output: true },
      { input: { board: [["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], word: "SEE" }, output: true },
      { input: { board: [["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], word: "ABCB" }, output: false },
    ],
    trace({ board, word }, T) {
      const R = board.length;
      const C = board[0].length;
      const letters = word.split("");
      const path = [];
      const onPath = new Set();
      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      const pathTones = (tone, extra = {}) => ({ ...Object.fromEntries(path.map(([r, c]) => [key(r, c), tone])), ...extra });
      const draw = (gridTones, k) => [
        grid("board", board, { tones: gridTones }),
        arr("word", letters, { pointers: k !== undefined ? { k } : {}, tones: paint(0, path.length - 1, "good") }),
      ];

      T.step(`Look for "${word}". Start a climb from every cell holding '${word[0]}', marking holds as used on the way up and freeing them on the way down.`, draw({}));

      function dfs(r, c, k) {
        if (r < 0 || c < 0 || r >= R || c >= C || onPath.has(key(r, c)) || board[r][c] !== word[k]) return false;
        path.push([r, c]);
        onPath.add(key(r, c));
        const last = k === word.length - 1;
        const canContinue =
          !last &&
          dirs.some(([dr, dc]) => {
            const nr = r + dr;
            const nc = c + dc;
            return nr >= 0 && nc >= 0 && nr < R && nc < C && !onPath.has(key(nr, nc)) && board[nr][nc] === word[k + 1];
          });
        T.step(
          `'${word[k]}' matches at (${r}, ${c}) — ${k + 1} of ${word.length} letters.`,
          draw(pathTones("good", { [key(r, c)]: "active" }), k),
          { ask: last ? undefined : yesNo(`Is there an unused neighbour holding '${word[k + 1]}'?`, canContinue) }
        );
        if (last) return true;
        for (const [dr, dc] of dirs) {
          if (dfs(r + dr, c + dc, k + 1)) return true;
        }
        path.pop();
        onPath.delete(key(r, c));
        T.step(`No way forward from (${r}, ${c}). Climb back down and free that hold.`, draw(pathTones("good", { [key(r, c)]: "bad" }), k));
        return false;
      }

      for (let r = 0; r < R; r += 1) {
        for (let c = 0; c < C; c += 1) {
          if (board[r][c] !== word[0]) continue;
          if (dfs(r, c, 0)) {
            T.step(`Every letter of "${word}" is on the route. **Found → true**.`, draw(pathTones("found")));
            return true;
          }
        }
      }
      T.step(`No route spells "${word}". **Not found → false**.`, draw({}));
      return false;
    },
    java: `public boolean exist(char[][] board, String word) {
    for (int r = 0; r < board.length; r++)
        for (int c = 0; c < board[0].length; c++)
            if (dfs(board, word, r, c, 0)) return true;
    return false;
}

private boolean dfs(char[][] board, String word, int r, int c, int k) {
    if (k == word.length()) return true;                            // every letter matched
    if (r < 0 || c < 0 || r >= board.length || c >= board[0].length) return false;
    if (board[r][c] != word.charAt(k)) return false;                // wrong letter, or already used
    char saved = board[r][c];
    board[r][c] = '#';                                              // mark this hold as used
    boolean found = dfs(board, word, r + 1, c, k + 1) || dfs(board, word, r - 1, c, k + 1)
                 || dfs(board, word, r, c + 1, k + 1) || dfs(board, word, r, c - 1, k + 1);
    board[r][c] = saved;                                            // backtrack: free it again
    return found;
}`,
    python: `def exist(self, board: List[List[str]], word: str) -> bool:
    rows, cols = len(board), len(board[0])

    def dfs(r, c, k):
        if k == len(word):
            return True
        if not (0 <= r < rows and 0 <= c < cols) or board[r][c] != word[k]:
            return False
        board[r][c] = "#"                     # mark as used
        found = any(dfs(r + dr, c + dc, k + 1) for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        board[r][c] = word[k]                 # backtrack
        return found

    return any(dfs(r, c, 0) for r in range(rows) for c in range(cols))`,
    quiz: {
      q: "Why un-mark a cell when you backtrack?",
      options: [
        "A different route may legitimately need that cell later",
        "To save memory",
        "Otherwise the recursion never ends",
        "To reset the word index",
      ],
      answer: 0,
      why: "The mark only means “used on the current route”. Once you leave the route, the cell is free again.",
    },
  },
];
