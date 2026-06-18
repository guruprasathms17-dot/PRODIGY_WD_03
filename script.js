/* ============================================================
   TIC-TAC-TOE — Prodigy Infotech Task-03
   Modes : Player vs Player | Player vs AI
   AI    : Easy (random) | Medium (smart) | Hard (minimax)
   ============================================================ */

// ── DOM REFS ──────────────────────────────────────────────
const cells        = document.querySelectorAll('.cell');
const board        = document.getElementById('board');
const statusText   = document.getElementById('statusText');
const statusInd    = document.getElementById('statusIndicator');
const statusBar    = document.querySelector('.status-bar');
const btnNewGame   = document.getElementById('btnNewGame');
const btnResetScore= document.getElementById('btnResetScore');
const btnPvP       = document.getElementById('btnPvP');
const btnPvAI      = document.getElementById('btnPvAI');
const diffRow      = document.getElementById('diffRow');
const diffBtns     = document.querySelectorAll('.diff-btn');
const valX         = document.getElementById('valX');
const valO         = document.getElementById('valO');
const drawCount    = document.getElementById('drawCount');
const nameX        = document.getElementById('nameX');
const nameO        = document.getElementById('nameO');
const scoreXCard   = document.getElementById('scoreX');
const scoreOCard   = document.getElementById('scoreO');
const overlay      = document.getElementById('overlay');
const overlayEmoji = document.getElementById('overlayEmoji');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySub   = document.getElementById('overlaySub');
const overlayBtn   = document.getElementById('overlayBtn');
const winLineSvg   = document.getElementById('winLineSvg');
const winLine      = document.getElementById('winLine');

// ── PARTICLES ────────────────────────────────────────────
(function() {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const colors = ['#f472b6','#38bdf8','#818cf8','#34d399'];
  for (let i = 0; i < 35; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2.5 + .8,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - .5) * .3,
      vy: -(Math.random() * .5 + .2),
      alpha: Math.random() * .5 + .1,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
})();

// ── WIN COMBOS ────────────────────────────────────────────
const WIN_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],  // rows
  [0,3,6],[1,4,7],[2,5,8],  // cols
  [0,4,8],[2,4,6],           // diags
];

// Win line coordinates (SVG viewBox 0–3 grid)
const LINE_COORDS = {
  '0,1,2': {x1:.5,y1:.5,x2:2.5,y2:.5},
  '3,4,5': {x1:.5,y1:1.5,x2:2.5,y2:1.5},
  '6,7,8': {x1:.5,y1:2.5,x2:2.5,y2:2.5},
  '0,3,6': {x1:.5,y1:.5,x2:.5,y2:2.5},
  '1,4,7': {x1:1.5,y1:.5,x2:1.5,y2:2.5},
  '2,5,8': {x1:2.5,y1:.5,x2:2.5,y2:2.5},
  '0,4,8': {x1:.5,y1:.5,x2:2.5,y2:2.5},
  '2,4,6': {x1:2.5,y1:.5,x2:.5,y2:2.5},
};

// ── GAME STATE ────────────────────────────────────────────
let boardState = Array(9).fill(null);
let currentPlayer = 'X';
let gameOver = false;
let mode = 'pvp';       // 'pvp' | 'ai'
let difficulty = 'medium';
let scores = { X:0, O:0, draw:0 };

// ── INIT ─────────────────────────────────────────────────
function initGame() {
  boardState = Array(9).fill(null);
  currentPlayer = 'X';
  gameOver = false;

  cells.forEach(c => {
    c.textContent = '';
    c.className = 'cell';
  });

  winLine.setAttribute('x1',0); winLine.setAttribute('y1',0);
  winLine.setAttribute('x2',0); winLine.setAttribute('y2',0);
  winLine.classList.remove('draw-line');

  overlay.classList.remove('show');
  statusBar.classList.remove('ai-thinking');

  updateStatus();
  highlightTurn();
}

// ── RENDER HELPERS ────────────────────────────────────────
function updateStatus(msg, type) {
  if (msg) {
    statusText.textContent = msg;
    statusInd.className = 'status-indicator ' + (type || '');
  } else {
    statusText.textContent = currentPlayer === 'X'
      ? (mode === 'ai' ? 'Your Turn (✕)' : "Player X's Turn")
      : (mode === 'ai' ? 'AI is thinking…' : "Player O's Turn");
    statusInd.className = 'status-indicator ' + currentPlayer.toLowerCase();
  }
}

function highlightTurn() {
  scoreXCard.classList.toggle('active-turn', currentPlayer === 'X' && !gameOver);
  scoreOCard.classList.toggle('active-turn', currentPlayer === 'O' && !gameOver);
}

function updateScoreBoard() {
  valX.textContent = scores.X;
  valO.textContent = scores.O;
  drawCount.textContent = scores.draw;
}

// ── CELL CLICK ────────────────────────────────────────────
cells.forEach(cell => {
  cell.addEventListener('click', () => {
    const idx = +cell.dataset.index;
    if (gameOver || boardState[idx]) return;
    if (mode === 'ai' && currentPlayer === 'O') return;
    placeMove(idx, currentPlayer);
  });
});

function placeMove(idx, player) {
  boardState[idx] = player;
  const cell = cells[idx];
  cell.textContent = player === 'X' ? '✕' : '○';
  cell.classList.add('taken', player === 'X' ? 'x-mark' : 'o-mark', 'pop');

  const result = checkResult();
  if (result) { endGame(result); return; }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  updateStatus();
  highlightTurn();

  if (mode === 'ai' && currentPlayer === 'O' && !gameOver) {
    statusBar.classList.add('ai-thinking');
    setTimeout(aiMove, difficulty === 'easy' ? 300 : 550);
  }
}

// ── WIN CHECK ────────────────────────────────────────────
function checkResult() {
  for (const combo of WIN_COMBOS) {
    const [a,b,c] = combo;
    if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
      return { winner: boardState[a], combo };
    }
  }
  if (boardState.every(Boolean)) return { winner: null, combo: null };
  return null;
}

function checkBoard(b) {
  for (const [a,i,c] of WIN_COMBOS) {
    if (b[a] && b[a] === b[i] && b[a] === b[c]) return b[a];
  }
  if (b.every(Boolean)) return 'draw';
  return null;
}

// ── END GAME ─────────────────────────────────────────────
function endGame({ winner, combo }) {
  gameOver = true;
  statusBar.classList.remove('ai-thinking');
  scoreXCard.classList.remove('active-turn');
  scoreOCard.classList.remove('active-turn');

  if (winner) {
    // Highlight win cells
    combo.forEach(i => cells[i].classList.add('win-cell'));

    // Draw win line
    const key = combo.join(',');
    const coords = LINE_COORDS[key];
    if (coords) {
      winLine.setAttribute('x1', coords.x1);
      winLine.setAttribute('y1', coords.y1);
      winLine.setAttribute('x2', coords.x2);
      winLine.setAttribute('y2', coords.y2);
      // Animate dashoffset
      const length = winLine.getTotalLength?.() || 200;
      winLine.style.strokeDasharray = length;
      winLine.style.strokeDashoffset = length;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { winLine.classList.add('draw-line'); });
      });
    }

    scores[winner]++;
    updateScoreBoard();
    updateStatus(`${winner === 'X' ? '✕ Player X' : '○ Player O'} Wins! 🎉`, 'win');

    const isAI = mode === 'ai' && winner === 'O';
    showOverlay(
      isAI ? '🤖' : '🎉',
      isAI ? 'AI Wins!' : (mode === 'ai' ? 'You Win! 🎉' : `Player ${winner} Wins!`),
      isAI ? 'Better luck next time!' : 'Excellent play!'
    );
  } else {
    scores.draw++;
    updateScoreBoard();
    updateStatus('It\'s a Draw! 🤝', 'draw');
    showOverlay('🤝', "It's a Draw!", 'Well played by both sides!');
  }
}

// ── OVERLAY ───────────────────────────────────────────────
function showOverlay(emoji, title, sub) {
  overlayEmoji.textContent = emoji;
  overlayTitle.textContent = title;
  overlaySub.textContent = sub;
  setTimeout(() => overlay.classList.add('show'), 400);
}

overlayBtn.addEventListener('click', initGame);

// ── AI LOGIC ─────────────────────────────────────────────
function aiMove() {
  statusBar.classList.remove('ai-thinking');
  let idx;
  if (difficulty === 'easy')   idx = randomMove();
  else if (difficulty === 'medium') idx = Math.random() < .6 ? minimaxMove() : randomMove();
  else idx = minimaxMove();

  if (idx !== undefined) placeMove(idx, 'O');
}

function randomMove() {
  const empty = boardState.map((v,i) => v === null ? i : -1).filter(i => i >= 0);
  return empty[Math.floor(Math.random() * empty.length)];
}

function minimaxMove() {
  let best = -Infinity, bestIdx;
  for (let i = 0; i < 9; i++) {
    if (!boardState[i]) {
      boardState[i] = 'O';
      const score = minimax(boardState, 0, false, -Infinity, Infinity);
      boardState[i] = null;
      if (score > best) { best = score; bestIdx = i; }
    }
  }
  return bestIdx;
}

function minimax(b, depth, isMax, alpha, beta) {
  const result = checkBoard(b);
  if (result === 'O') return 10 - depth;
  if (result === 'X') return depth - 10;
  if (result === 'draw') return 0;

  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = 'O';
        best = Math.max(best, minimax(b, depth+1, false, alpha, beta));
        b[i] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = 'X';
        best = Math.min(best, minimax(b, depth+1, true, alpha, beta));
        b[i] = null;
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  }
}

// ── MODE BUTTONS ─────────────────────────────────────────
btnPvP.addEventListener('click', () => {
  mode = 'pvp';
  btnPvP.classList.add('active');
  btnPvAI.classList.remove('active');
  diffRow.classList.remove('show');
  nameX.textContent = 'Player X';
  nameO.textContent = 'Player O';
  initGame();
});

btnPvAI.addEventListener('click', () => {
  mode = 'ai';
  btnPvAI.classList.add('active');
  btnPvP.classList.remove('active');
  diffRow.classList.add('show');
  nameX.textContent = 'You';
  nameO.textContent = 'AI';
  initGame();
});

// ── DIFFICULTY ───────────────────────────────────────────
diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    difficulty = btn.dataset.diff;
    diffBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    initGame();
  });
});

// ── ACTION BUTTONS ────────────────────────────────────────
btnNewGame.addEventListener('click', initGame);
btnResetScore.addEventListener('click', () => {
  scores = { X:0, O:0, draw:0 };
  updateScoreBoard();
  initGame();
});

// ── KEYBOARD ─────────────────────────────────────────────
document.addEventListener('keydown', e => {
  const n = parseInt(e.key);
  if (n >= 1 && n <= 9) {
    const idx = n - 1;
    if (!gameOver && !boardState[idx]) {
      if (mode === 'ai' && currentPlayer === 'O') return;
      placeMove(idx, currentPlayer);
    }
  }
  if (e.code === 'KeyN') initGame();
});

// ── START ─────────────────────────────────────────────────
initGame();