/* ============================================================
   K Rahul Reddy — AI Explorer Showcase
   All demos run client-side. No backend. No API keys.
   ============================================================ */

// ===== UTILITIES =====
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('Failed to load: ' + src));
        document.head.appendChild(s);
    });
}

function setLoading(container, msg) {
    container.innerHTML = `<div class="demo-loading"><div class="spinner"></div><p>${msg}</p></div>`;
}

// ===== HERO PARTICLE NETWORK =====
(function initHero() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles = [], mouse = { x: -1000, y: -1000 };
    const PARTICLE_COUNT = 80, CONNECT_DIST = 150;

    function resize() {
        w = canvas.width = canvas.offsetWidth;
        h = canvas.height = canvas.offsetHeight;
    }

    function createParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * w, y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
                r: Math.random() * 2 + 1
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;

            const dx = mouse.x - p.x, dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) { p.x -= dx * 0.01; p.y -= dy * 0.01; }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(129,140,248,0.5)';
            ctx.fill();

            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const d = Math.hypot(p.x - p2.x, p.y - p2.y);
                if (d < CONNECT_DIST) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(129,140,248,${0.15 * (1 - d / CONNECT_DIST)})`;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', () => { resize(); createParticles(); });
    canvas.addEventListener('mousemove', e => { mouse.x = e.offsetX; mouse.y = e.offsetY; });
    canvas.addEventListener('mouseleave', () => { mouse.x = -1000; mouse.y = -1000; });
    resize(); createParticles(); draw();
})();

// ===== TYPED TEXT =====
(function initTyped() {
    const el = document.getElementById('hero-typed');
    if (!el) return;
    const phrases = [
        'Exploring TensorFlow.js in the browser...',
        'Running transformers client-side with WASM...',
        'Real-time hand tracking with MediaPipe...',
        'Training models with zero backend...',
        'Depth estimation from a single photo...',
        'Q-learning agents solving mazes live...'
    ];
    let pi = 0, ci = 0, deleting = false;
    function tick() {
        const phrase = phrases[pi];
        el.textContent = phrase.substring(0, ci) + (ci < phrase.length || deleting ? '|' : '');
        if (!deleting) {
            if (ci < phrase.length) { ci++; setTimeout(tick, 40 + Math.random() * 30); }
            else { setTimeout(() => { deleting = true; tick(); }, 2000); }
        } else {
            if (ci > 0) { ci--; setTimeout(tick, 20); }
            else { deleting = false; pi = (pi + 1) % phrases.length; setTimeout(tick, 500); }
        }
    }
    tick();
})();

// ===== NAV SCROLL =====
window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});

// ===== SCROLL ANIMATIONS =====
const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});

// ===== MODAL SYSTEM =====
let currentCleanup = null;

window.openDemo = function(demoId) {
    const demo = DEMOS[demoId];
    if (!demo) return;
    document.getElementById('modal-title').textContent = demo.title;
    document.getElementById('modal-desc').textContent = demo.desc;
    const body = document.getElementById('modal-body');
    body.innerHTML = '';
    document.getElementById('demo-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    demo.init(body);
};

window.closeDemo = function() {
    document.getElementById('demo-modal').classList.add('hidden');
    document.body.style.overflow = '';
    if (currentCleanup) { currentCleanup(); currentCleanup = null; }
    document.getElementById('modal-body').innerHTML = '';
};

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDemo(); });

// ===== WEBCAM HELPER =====
async function setupWebcam(container, onFrame, options = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'demo-webcam-wrap';
    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.autoplay = true;
    video.width = options.width || 640;
    video.height = options.height || 480;
    const overlay = document.createElement('canvas');
    overlay.width = video.width;
    overlay.height = video.height;
    wrap.appendChild(video);
    wrap.appendChild(overlay);
    container.appendChild(wrap);

    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: video.width }, height: { ideal: video.height }, facingMode: 'user' }
    });
    video.srcObject = stream;
    await video.play();

    const ctx = overlay.getContext('2d');
    let running = true;

    async function loop() {
        if (!running) return;
        try { await onFrame(video, ctx, overlay); } catch (e) { /* skip frame */ }
        requestAnimationFrame(loop);
    }
    loop();

    currentCleanup = () => {
        running = false;
        stream.getTracks().forEach(t => t.stop());
        video.srcObject = null;
    };
    return { video, overlay, ctx };
}

// ===== DEMO DEFINITIONS =====
const DEMOS = {};

// ---------- 1. NEURAL CELLULAR AUTOMATA ----------
DEMOS.nca = {
    title: 'Neural Cellular Automata',
    desc: 'Click to seed or destroy cells. Watch them self-organize, grow, and regenerate.',
    init(container) {
        container.innerHTML = `
            <div class="demo-info"><i class="fas fa-info-circle"></i> Click to seed life. Right-click to destroy. Inspired by Google's NCA research.</div>
            <canvas id="nca-canvas" width="600" height="400"></canvas>
            <div class="demo-controls">
                <button id="nca-reset">Reset</button>
                <label>Speed <input type="range" id="nca-speed" min="1" max="20" value="8"></label>
                <label>Rule <select id="nca-rule"><option value="life">Game of Life</option><option value="grow">Neural Grow</option><option value="waves">Wave Pattern</option></select></label>
            </div>
            <div class="demo-status" id="nca-status">Generation: 0 | Living cells: 0</div>`;

        const canvas = document.getElementById('nca-canvas');
        const ctx = canvas.getContext('2d');
        const CELL = 5, COLS = canvas.width / CELL, ROWS = canvas.height / CELL;
        let grid = Array.from({ length: ROWS }, () => new Float32Array(COLS));
        let gen = 0, running = true;

        function seed(cx, cy, r) {
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    const y = cy + dy, x = cx + dx;
                    if (y >= 0 && y < ROWS && x >= 0 && x < COLS && dx * dx + dy * dy <= r * r) {
                        grid[y][x] = Math.random() * 0.5 + 0.5;
                    }
                }
            }
        }

        seed(Math.floor(COLS / 2), Math.floor(ROWS / 2), 8);

        function getRule() { return document.getElementById('nca-rule').value; }

        function step() {
            const next = Array.from({ length: ROWS }, () => new Float32Array(COLS));
            const rule = getRule();
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    let sum = 0, count = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dy === 0 && dx === 0) continue;
                            const ny = (y + dy + ROWS) % ROWS, nx = (x + dx + COLS) % COLS;
                            sum += grid[ny][nx];
                            count++;
                        }
                    }
                    const avg = sum / count;
                    const self = grid[y][x];
                    if (rule === 'life') {
                        const alive = Math.round(sum);
                        next[y][x] = self > 0.5 ? (alive === 2 || alive === 3 ? 1 : 0)
                                                  : (alive === 3 ? 1 : 0);
                    } else if (rule === 'grow') {
                        const activation = Math.tanh((avg - 0.15) * 8) * 0.5 + 0.5;
                        next[y][x] = self * 0.95 + activation * 0.15;
                        next[y][x] = Math.max(0, Math.min(1, next[y][x]));
                    } else {
                        next[y][x] = Math.sin(avg * Math.PI * 4 + self * 2) * 0.5 + 0.5;
                    }
                }
            }
            grid = next;
            gen++;
        }

        function render() {
            const img = ctx.createImageData(canvas.width, canvas.height);
            let living = 0;
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    const v = grid[y][x];
                    if (v > 0.01) living++;
                    const r = Math.floor(v * 52 + (1 - v) * 10);
                    const g = Math.floor(v * 211 + (1 - v) * 10);
                    const b = Math.floor(v * 153 + (1 - v) * 26);
                    for (let cy = 0; cy < CELL; cy++) {
                        for (let cx = 0; cx < CELL; cx++) {
                            const idx = ((y * CELL + cy) * canvas.width + (x * CELL + cx)) * 4;
                            img.data[idx] = r; img.data[idx + 1] = g; img.data[idx + 2] = b; img.data[idx + 3] = 255;
                        }
                    }
                }
            }
            ctx.putImageData(img, 0, 0);
            document.getElementById('nca-status').textContent = `Generation: ${gen} | Living cells: ${living}`;
        }

        function loop() {
            if (!running) return;
            const speed = +document.getElementById('nca-speed').value;
            for (let i = 0; i < speed; i++) step();
            render();
            requestAnimationFrame(loop);
        }
        loop();

        canvas.addEventListener('mousedown', e => {
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.offsetX / rect.width) * COLS);
            const y = Math.floor((e.offsetY / rect.height) * ROWS);
            if (e.button === 2) {
                for (let dy = -4; dy <= 4; dy++)
                    for (let dx = -4; dx <= 4; dx++) {
                        const ny = y + dy, nx = x + dx;
                        if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) grid[ny][nx] = 0;
                    }
            } else { seed(x, y, 5); }
        });
        canvas.addEventListener('contextmenu', e => e.preventDefault());
        document.getElementById('nca-reset').addEventListener('click', () => {
            grid = Array.from({ length: ROWS }, () => new Float32Array(COLS));
            seed(Math.floor(COLS / 2), Math.floor(ROWS / 2), 8);
            gen = 0;
        });
        currentCleanup = () => { running = false; };
    }
};

// ---------- 2. RL MAZE SOLVER ----------
DEMOS.maze = {
    title: 'RL Maze Solver',
    desc: 'Draw walls, then watch a Q-learning agent learn the optimal path in real-time.',
    init(container) {
        container.innerHTML = `
            <div class="demo-info"><i class="fas fa-info-circle"></i> Click cells to toggle walls. Agent (blue) learns to reach goal (green). Watch the Q-value heatmap emerge.</div>
            <canvas id="maze-canvas" width="600" height="400"></canvas>
            <div class="demo-controls">
                <button id="maze-train" class="active">Train</button>
                <button id="maze-pause">Pause</button>
                <button id="maze-reset">New Maze</button>
                <label>Speed <input type="range" id="maze-speed" min="1" max="50" value="10"></label>
                <label>ε <input type="range" id="maze-eps" min="1" max="100" value="30"></label>
            </div>
            <div class="demo-status" id="maze-status">Episode: 0 | Steps: 0 | Best: ∞</div>`;

        const canvas = document.getElementById('maze-canvas');
        const ctx = canvas.getContext('2d');
        const CELL = 40, COLS = Math.floor(canvas.width / CELL), ROWS = Math.floor(canvas.height / CELL);
        const ACTIONS = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // up,down,left,right
        let walls = new Set(), Q = {}, agent, goal, episode = 0, steps = 0, bestSteps = Infinity;
        let training = true, paused = false;

        function key(r, c, a) { return `${r},${c},${a !== undefined ? a : ''}`; }
        function getQ(r, c, a) { return Q[key(r, c, a)] || 0; }
        function setQ(r, c, a, v) { Q[key(r, c, a)] = v; }
        function maxQ(r, c) {
            let best = -Infinity;
            for (let a = 0; a < 4; a++) best = Math.max(best, getQ(r, c, a));
            return best === -Infinity ? 0 : best;
        }

        function resetMaze() {
            walls = new Set();
            Q = {};
            episode = 0; steps = 0; bestSteps = Infinity;
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (Math.random() < 0.25 && !(r === 0 && c === 0) && !(r === ROWS - 1 && c === COLS - 1)) {
                        walls.add(key(r, c));
                    }
                }
            }
            agent = { r: 0, c: 0 };
            goal = { r: ROWS - 1, c: COLS - 1 };
        }

        function resetAgent() {
            agent = { r: 0, c: 0 };
            steps = 0;
            episode++;
        }

        function stepAgent() {
            const eps = +document.getElementById('maze-eps').value / 100;
            let action;
            if (Math.random() < eps) {
                action = Math.floor(Math.random() * 4);
            } else {
                action = 0; let bestV = getQ(agent.r, agent.c, 0);
                for (let a = 1; a < 4; a++) {
                    const v = getQ(agent.r, agent.c, a);
                    if (v > bestV) { bestV = v; action = a; }
                }
            }
            const [dr, dc] = ACTIONS[action];
            const nr = agent.r + dr, nc = agent.c + dc;
            let reward = -1;
            let nextR = agent.r, nextC = agent.c;

            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !walls.has(key(nr, nc))) {
                nextR = nr; nextC = nc;
            } else {
                reward = -5;
            }

            if (nextR === goal.r && nextC === goal.c) {
                reward = 100;
            }

            const alpha = 0.1, gamma = 0.95;
            const oldQ = getQ(agent.r, agent.c, action);
            setQ(agent.r, agent.c, action, oldQ + alpha * (reward + gamma * maxQ(nextR, nextC) - oldQ));

            agent.r = nextR;
            agent.c = nextC;
            steps++;

            if (agent.r === goal.r && agent.c === goal.c) {
                if (steps < bestSteps) bestSteps = steps;
                resetAgent();
            } else if (steps > ROWS * COLS * 4) {
                resetAgent();
            }
        }

        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (walls.has(key(r, c))) {
                        ctx.fillStyle = '#2d3436';
                    } else {
                        const qv = maxQ(r, c);
                        const intensity = Math.max(0, Math.min(1, (qv + 10) / 110));
                        ctx.fillStyle = `rgba(129,140,248,${intensity * 0.4})`;
                    }
                    ctx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1);
                }
            }
            ctx.fillStyle = '#34d399';
            ctx.fillRect(goal.c * CELL, goal.r * CELL, CELL - 1, CELL - 1);
            ctx.fillStyle = '#818cf8';
            ctx.beginPath();
            ctx.arc(agent.c * CELL + CELL / 2, agent.r * CELL + CELL / 2, CELL / 3, 0, Math.PI * 2);
            ctx.fill();
            document.getElementById('maze-status').textContent =
                `Episode: ${episode} | Steps: ${steps} | Best: ${bestSteps === Infinity ? '∞' : bestSteps}`;
        }

        resetMaze();
        let running = true;
        function loop() {
            if (!running) return;
            if (training && !paused) {
                const speed = +document.getElementById('maze-speed').value;
                for (let i = 0; i < speed; i++) stepAgent();
            }
            render();
            requestAnimationFrame(loop);
        }
        loop();

        canvas.addEventListener('click', e => {
            const rect = canvas.getBoundingClientRect();
            const c = Math.floor((e.offsetX / rect.width) * COLS);
            const r = Math.floor((e.offsetY / rect.height) * ROWS);
            if ((r === 0 && c === 0) || (r === goal.r && c === goal.c)) return;
            const k = key(r, c);
            if (walls.has(k)) walls.delete(k); else walls.add(k);
        });

        document.getElementById('maze-train').addEventListener('click', () => { training = true; paused = false; });
        document.getElementById('maze-pause').addEventListener('click', () => { paused = !paused; });
        document.getElementById('maze-reset').addEventListener('click', resetMaze);
        currentCleanup = () => { running = false; };
    }
};

// ---------- 3. AI MELODY COMPOSER ----------
DEMOS.melody = {
    title: 'AI Melody Composer',
    desc: 'Click piano keys to set seed notes, then let the Markov chain generate a melody.',
    init(container) {
        const NOTES = ['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5'];
        const FREQS = { C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99 };

        // Markov transition table based on common Western music patterns
        const TRANS = {
            C4:{D4:.2,E4:.25,F4:.1,G4:.2,A4:.1,B4:.05,C5:.1},
            D4:{C4:.15,E4:.3,F4:.15,G4:.2,A4:.1,B4:.05,D5:.05},
            E4:{C4:.1,D4:.15,F4:.25,G4:.25,A4:.15,E5:.1},
            F4:{E4:.2,G4:.3,A4:.2,C4:.1,D4:.1,F5:.1},
            G4:{A4:.25,F4:.15,E4:.2,C4:.15,B4:.1,G5:.05,D4:.1},
            A4:{G4:.25,B4:.2,C5:.2,F4:.1,E4:.15,A4:.1},
            B4:{C5:.4,A4:.2,G4:.15,D5:.1,E4:.1,B4:.05},
            C5:{B4:.15,D5:.2,E5:.15,G4:.2,A4:.15,C4:.15},
            D5:{C5:.25,E5:.25,B4:.15,G4:.15,A4:.1,F5:.1},
            E5:{D5:.2,C5:.25,F5:.15,G5:.1,A4:.15,E4:.15},
            F5:{E5:.3,G5:.2,D5:.2,C5:.15,A4:.15},
            G5:{F5:.2,E5:.25,D5:.2,C5:.2,G4:.15}
        };

        container.innerHTML = `
            <div class="demo-info"><i class="fas fa-info-circle"></i> Click piano keys to play notes. Hit "Generate" to let the AI compose a continuation using Markov chains.</div>
            <div class="piano" id="piano">${NOTES.map((n, i) =>
                `<div class="piano-key" data-note="${n}" style="left:${i * (100 / NOTES.length)}%">${n.replace('4','').replace('5','\'')}</div>`
            ).join('')}</div>
            <div class="melody-display" id="melody-display"></div>
            <div class="demo-controls">
                <button id="mel-generate">🎲 Generate (8 notes)</button>
                <button id="mel-play">▶ Play</button>
                <button id="mel-clear">Clear</button>
                <label>Tempo <input type="range" id="mel-tempo" min="80" max="300" value="160"></label>
                <label>Randomness <input type="range" id="mel-temp" min="1" max="100" value="50"></label>
            </div>
            <div class="demo-status" id="mel-status">Sequence: (click keys or generate)</div>`;

        let audioCtx = null, sequence = [];

        function getAudioCtx() {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            return audioCtx;
        }

        function playNote(note, time, dur) {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = FREQS[note];
            gain.gain.setValueAtTime(0.25, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + dur * 0.9);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(time);
            osc.stop(time + dur);
        }

        function nextNote(current) {
            const trans = TRANS[current];
            if (!trans) return NOTES[Math.floor(Math.random() * NOTES.length)];
            const temp = +document.getElementById('mel-temp').value / 50;
            const entries = Object.entries(trans);
            const weights = entries.map(([, p]) => Math.pow(p, 1 / temp));
            const total = weights.reduce((a, b) => a + b, 0);
            let r = Math.random() * total, cum = 0;
            for (let i = 0; i < entries.length; i++) {
                cum += weights[i];
                if (r < cum) return entries[i][0];
            }
            return entries[entries.length - 1][0];
        }

        function updateDisplay() {
            const display = document.getElementById('melody-display');
            display.innerHTML = '';
            const w = display.offsetWidth || 400;
            sequence.forEach((note, i) => {
                const dot = document.createElement('div');
                dot.className = 'note-dot';
                const noteIdx = NOTES.indexOf(note);
                dot.style.left = `${(i / Math.max(sequence.length, 1)) * (w - 20) + 10}px`;
                dot.style.bottom = `${(noteIdx / NOTES.length) * 60 + 10}px`;
                dot.style.background = `hsl(${noteIdx * 30}, 80%, 65%)`;
                display.appendChild(dot);
            });
            document.getElementById('mel-status').textContent = `Sequence: ${sequence.join(' → ') || '(empty)'}`;
        }

        document.getElementById('piano').addEventListener('click', e => {
            const key = e.target.closest('.piano-key');
            if (!key) return;
            const note = key.dataset.note;
            sequence.push(note);
            playNote(note, getAudioCtx().currentTime, 0.3);
            key.classList.add('active');
            setTimeout(() => key.classList.remove('active'), 200);
            updateDisplay();
        });

        document.getElementById('mel-generate').addEventListener('click', () => {
            const last = sequence.length ? sequence[sequence.length - 1] : NOTES[Math.floor(Math.random() * NOTES.length)];
            let current = last;
            for (let i = 0; i < 8; i++) {
                current = nextNote(current);
                sequence.push(current);
            }
            updateDisplay();
        });

        document.getElementById('mel-play').addEventListener('click', () => {
            if (!sequence.length) return;
            const ctx = getAudioCtx();
            const bpm = +document.getElementById('mel-tempo').value;
            const noteDur = 60 / bpm;
            const keys = document.querySelectorAll('.piano-key');
            sequence.forEach((note, i) => {
                const time = ctx.currentTime + i * noteDur;
                playNote(note, time, noteDur * 0.8);
                setTimeout(() => {
                    keys.forEach(k => k.classList.remove('active'));
                    const k = document.querySelector(`.piano-key[data-note="${note}"]`);
                    if (k) { k.classList.add('active'); setTimeout(() => k.classList.remove('active'), noteDur * 400); }
                }, i * noteDur * 1000);
            });
        });

        document.getElementById('mel-clear').addEventListener('click', () => { sequence = []; updateDisplay(); });
        currentCleanup = () => { if (audioCtx) audioCtx.close().catch(() => {}); audioCtx = null; };
    }
};

// ---------- 4. HAND TRACKING LAB ----------
DEMOS.hands = {
    title: 'Hand Tracking Lab',
    desc: 'Allow webcam access. Move your hands — AI detects 21 landmarks per hand in real-time.',
    init(container) {
        container.innerHTML = `
            <div class="demo-info"><i class="fas fa-info-circle"></i> Uses Google MediaPipe Hands API — 21 landmarks per hand detected on-device via WASM.</div>`;
        setLoading(container, 'Loading MediaPipe Hands model...');

        (async () => {
            try {
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.min.js');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1675466124/drawing_utils.js');
                container.innerHTML = `<div class="demo-info"><i class="fas fa-info-circle"></i> MediaPipe Hands — 21 landmarks per hand. Move your fingers!</div>`;

                const wrap = document.createElement('div');
                wrap.className = 'demo-webcam-wrap';
                const video = document.createElement('video');
                video.setAttribute('playsinline', ''); video.autoplay = true;
                video.width = 640; video.height = 480; video.style.display = 'block';
                const overlay = document.createElement('canvas');
                overlay.width = 640; overlay.height = 480;
                wrap.appendChild(video); wrap.appendChild(overlay);
                container.appendChild(wrap);

                const status = document.createElement('div');
                status.className = 'demo-status'; status.id = 'hands-status';
                status.textContent = 'Initializing camera...';
                container.appendChild(status);

                const ctx = overlay.getContext('2d');
                const particles = [];

                const hands = new Hands({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${f}` });
                hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.5 });
                hands.onResults(results => {
                    ctx.clearRect(0, 0, 640, 480);
                    if (results.multiHandLandmarks) {
                        for (const landmarks of results.multiHandLandmarks) {
                            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#818cf8', lineWidth: 2 });
                            drawLandmarks(ctx, landmarks, { color: '#34d399', lineWidth: 1, radius: 3 });
                            // Particle trail from fingertips (indices 4,8,12,16,20)
                            for (const tip of [4, 8, 12, 16, 20]) {
                                particles.push({ x: landmarks[tip].x * 640, y: landmarks[tip].y * 480, life: 1, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 });
                            }
                        }
                        status.textContent = `Hands detected: ${results.multiHandLandmarks.length}`;
                    } else {
                        status.textContent = 'No hands detected — show your hand to the camera';
                    }
                    // Draw particles
                    for (let i = particles.length - 1; i >= 0; i--) {
                        const p = particles[i];
                        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
                        if (p.life <= 0) { particles.splice(i, 1); continue; }
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.life * 4, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(129,140,248,${p.life})`;
                        ctx.fill();
                    }
                    if (particles.length > 200) particles.splice(0, particles.length - 200);
                });

                const camera = new Camera(video, {
                    onFrame: async () => await hands.send({ image: video }),
                    width: 640, height: 480
                });
                await camera.start();
                status.textContent = 'Hand tracking active — move your hands!';

                currentCleanup = () => { camera.stop(); hands.close(); };
            } catch (err) {
                container.innerHTML = `<div class="demo-info" style="border-color:#ff7675;color:#ff7675"><i class="fas fa-exclamation-triangle"></i> Failed to load MediaPipe Hands: ${err.message}. This demo requires HTTPS and camera access.</div>`;
            }
        })();
    }
};

// ---------- 5. FACE MESH EXPLORER ----------
DEMOS.face = {
    title: 'Face Mesh Explorer',
    desc: 'Allow webcam access. AI maps 468 facial landmarks and detects your expressions.',
    init(container) {
        setLoading(container, 'Loading MediaPipe Face Mesh model...');
        (async () => {
            try {
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1675466124/drawing_utils.js');
                container.innerHTML = `<div class="demo-info"><i class="fas fa-info-circle"></i> MediaPipe Face Mesh — 468 landmarks. Try different expressions!</div>`;

                const wrap = document.createElement('div');
                wrap.className = 'demo-webcam-wrap';
                const video = document.createElement('video');
                video.setAttribute('playsinline', ''); video.autoplay = true;
                video.width = 640; video.height = 480; video.style.display = 'block';
                const overlay = document.createElement('canvas');
                overlay.width = 640; overlay.height = 480;
                wrap.appendChild(video); wrap.appendChild(overlay);
                container.appendChild(wrap);
                const status = document.createElement('div');
                status.className = 'demo-status'; container.appendChild(status);

                const ctx = overlay.getContext('2d');
                const fm = new FaceMesh({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${f}` });
                fm.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5 });
                fm.onResults(results => {
                    ctx.clearRect(0, 0, 640, 480);
                    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length) {
                        const lm = results.multiFaceLandmarks[0];
                        // Draw mesh points
                        for (const pt of lm) {
                            ctx.beginPath();
                            ctx.arc(pt.x * 640, pt.y * 480, 1, 0, Math.PI * 2);
                            ctx.fillStyle = `rgba(129,140,248,0.7)`;
                            ctx.fill();
                        }
                        // Simple expression detection
                        const mouthOpen = Math.abs(lm[13].y - lm[14].y) * 480;
                        const eyeLeft = Math.abs(lm[159].y - lm[145].y) * 480;
                        const eyeRight = Math.abs(lm[386].y - lm[374].y) * 480;
                        const browLeft = Math.abs(lm[70].y - lm[63].y) * 480;
                        let expr = '😐 Neutral';
                        if (mouthOpen > 15) expr = '😮 Mouth Open';
                        if (eyeLeft < 3 && eyeRight < 3) expr = '😑 Eyes Closed';
                        if (browLeft > 8) expr = '😲 Eyebrows Raised';
                        const lipCornerL = lm[61], lipCornerR = lm[291], lipTop = lm[13];
                        if (lipCornerL.y > lipTop.y + 0.01 && lipCornerR.y > lipTop.y + 0.01) expr = '😊 Smiling';
                        status.textContent = `468 landmarks detected | Expression: ${expr}`;
                    } else {
                        status.textContent = 'No face detected — look at the camera';
                    }
                });
                const camera = new Camera(video, { onFrame: async () => await fm.send({ image: video }), width: 640, height: 480 });
                await camera.start();
                currentCleanup = () => { camera.stop(); fm.close(); };
            } catch (err) {
                container.innerHTML = `<div class="demo-info" style="border-color:#ff7675;color:#ff7675"><i class="fas fa-exclamation-triangle"></i> Failed to load Face Mesh: ${err.message}. Requires HTTPS + camera.</div>`;
            }
        })();
    }
};

// ---------- 6. BODY POSE ENGINE ----------
DEMOS.pose = {
    title: 'Body Pose Engine',
    desc: 'Allow webcam access. AI tracks 33 body landmarks with BlazePose.',
    init(container) {
        setLoading(container, 'Loading MediaPipe Pose model...');
        (async () => {
            try {
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675471629/pose.js');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1675466124/drawing_utils.js');
                container.innerHTML = `<div class="demo-info"><i class="fas fa-info-circle"></i> MediaPipe BlazePose — 33 body landmarks. Stand up and move!</div>`;

                const wrap = document.createElement('div');
                wrap.className = 'demo-webcam-wrap';
                const video = document.createElement('video');
                video.setAttribute('playsinline', ''); video.autoplay = true;
                video.width = 640; video.height = 480; video.style.display = 'block';
                const overlay = document.createElement('canvas');
                overlay.width = 640; overlay.height = 480;
                wrap.appendChild(video); wrap.appendChild(overlay);
                container.appendChild(wrap);
                const status = document.createElement('div');
                status.className = 'demo-status'; container.appendChild(status);

                const ctx = overlay.getContext('2d');
                const pose = new Pose({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675471629/${f}` });
                pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5 });
                pose.onResults(results => {
                    ctx.clearRect(0, 0, 640, 480);
                    if (results.poseLandmarks) {
                        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#818cf8', lineWidth: 3 });
                        drawLandmarks(ctx, results.poseLandmarks, { color: '#34d399', lineWidth: 1, radius: 4 });
                        status.textContent = '33 pose landmarks detected — try moving!';
                    } else {
                        status.textContent = 'No body detected — stand in view of the camera';
                    }
                });
                const camera = new Camera(video, { onFrame: async () => await pose.send({ image: video }), width: 640, height: 480 });
                await camera.start();
                currentCleanup = () => { camera.stop(); pose.close(); };
            } catch (err) {
                container.innerHTML = `<div class="demo-info" style="border-color:#ff7675;color:#ff7675"><i class="fas fa-exclamation-triangle"></i> Failed to load Pose: ${err.message}. Requires HTTPS + camera.</div>`;
            }
        })();
    }
};

// ---------- 7. OBJECT DETECTOR ----------
DEMOS.objdet = {
    title: 'Object Detector',
    desc: 'Allow webcam access. TensorFlow.js COCO-SSD detects 80 object categories in real-time.',
    init(container) {
        setLoading(container, 'Loading TensorFlow.js + COCO-SSD model (~5MB)...');
        (async () => {
            try {
                await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js');
                await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js');
                container.innerHTML = `<div class="demo-info"><i class="fas fa-info-circle"></i> TensorFlow.js COCO-SSD — detects 80 object categories. Point camera at objects!</div>`;
                const model = await cocoSsd.load();

                await setupWebcam(container, async (video, ctx, overlay) => {
                    const predictions = await model.detect(video);
                    ctx.clearRect(0, 0, overlay.width, overlay.height);
                    predictions.forEach(p => {
                        const [x, y, w, h] = p.bbox;
                        ctx.strokeStyle = '#818cf8';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, w, h);
                        ctx.fillStyle = '#818cf8';
                        ctx.font = '14px Inter, sans-serif';
                        const label = `${p.class} ${Math.round(p.score * 100)}%`;
                        const tm = ctx.measureText(label);
                        ctx.fillRect(x, y - 20, tm.width + 8, 20);
                        ctx.fillStyle = '#fff';
                        ctx.fillText(label, x + 4, y - 5);
                    });
                    const el = container.querySelector('.demo-status') || (() => { const d = document.createElement('div'); d.className = 'demo-status'; container.appendChild(d); return d; })();
                    el.textContent = `Objects detected: ${predictions.length}`;
                });
            } catch (err) {
                container.innerHTML = `<div class="demo-info" style="border-color:#ff7675;color:#ff7675"><i class="fas fa-exclamation-triangle"></i> Failed to load COCO-SSD: ${err.message}</div>`;
            }
        })();
    }
};

// ---------- 8. TEACHABLE MACHINE ----------
DEMOS.teach = {
    title: 'Teachable Machine',
    desc: 'Train a custom image classifier in your browser using MobileNet transfer learning.',
    init(container) {
        setLoading(container, 'Loading TensorFlow.js + MobileNet (~15MB)...');
        (async () => {
            try {
                await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js');
                await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js');
                const mobilenet_model = await window.mobilenet.load({ version: 2, alpha: 0.5 });

                container.innerHTML = `
                    <div class="demo-info"><i class="fas fa-info-circle"></i> MobileNet feature extraction + KNN classifier. Add 5+ samples per class, then classify!</div>
                    <div class="demo-columns">
                        <div class="demo-column">
                            <video id="teach-video" autoplay playsinline width="320" height="240" style="border-radius:12px;transform:scaleX(-1)"></video>
                            <div class="demo-controls">
                                <button id="teach-predict">🔍 Classify</button>
                            </div>
                            <div class="teach-pred" id="teach-pred" style="display:none">
                                <div class="teach-pred-label" id="teach-pred-label">—</div>
                                <div class="teach-pred-conf" id="teach-pred-conf"></div>
                            </div>
                        </div>
                        <div class="demo-column">
                            <div class="teach-class" data-class="0"><div class="teach-class-header"><span class="teach-class-name">✋ Class A</span><span class="teach-samples" id="tc-0">0 samples</span></div><button onclick="addTeachSample(0)">+ Add Sample</button></div>
                            <div class="teach-class" data-class="1"><div class="teach-class-header"><span class="teach-class-name">✌️ Class B</span><span class="teach-samples" id="tc-1">0 samples</span></div><button onclick="addTeachSample(1)">+ Add Sample</button></div>
                            <div class="teach-class" data-class="2"><div class="teach-class-header"><span class="teach-class-name">👍 Class C</span><span class="teach-samples" id="tc-2">0 samples</span></div><button onclick="addTeachSample(2)">+ Add Sample</button></div>
                        </div>
                    </div>
                    <div class="demo-status" id="teach-status">Add samples for each class, then click Classify.</div>`;

                const video = document.getElementById('teach-video');
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
                video.srcObject = stream;
                await video.play();

                const classNames = ['Class A', 'Class B', 'Class C'];
                const classData = [[], [], []];

                function getFeatures() {
                    return mobilenet_model.infer(video, true);
                }

                window.addTeachSample = function(classIdx) {
                    const features = getFeatures();
                    classData[classIdx].push(features);
                    document.getElementById(`tc-${classIdx}`).textContent = `${classData[classIdx].length} samples`;
                    document.getElementById('teach-status').textContent = `Added sample to ${classNames[classIdx]}. Total: ${classData[classIdx].length}`;
                };

                document.getElementById('teach-predict').addEventListener('click', () => {
                    const totalSamples = classData.reduce((s, c) => s + c.length, 0);
                    if (totalSamples < 2) {
                        document.getElementById('teach-status').textContent = 'Add at least some samples first!';
                        return;
                    }
                    const testFeatures = getFeatures();
                    let bestClass = 0, bestDist = Infinity;

                    for (let c = 0; c < classData.length; c++) {
                        if (classData[c].length === 0) continue;
                        let totalDist = 0;
                        for (const sample of classData[c]) {
                            const diff = tf.sub(testFeatures, sample);
                            const dist = tf.norm(diff).dataSync()[0];
                            totalDist += dist;
                            diff.dispose();
                        }
                        const avgDist = totalDist / classData[c].length;
                        if (avgDist < bestDist) { bestDist = avgDist; bestClass = c; }
                    }

                    const confidence = Math.max(0, Math.min(100, Math.round((1 / (1 + bestDist * 0.1)) * 100)));
                    document.getElementById('teach-pred').style.display = 'block';
                    document.getElementById('teach-pred-label').textContent = `${['✋','✌️','👍'][bestClass]} ${classNames[bestClass]}`;
                    document.getElementById('teach-pred-conf').textContent = `Confidence: ~${confidence}% (distance: ${bestDist.toFixed(2)})`;
                    document.getElementById('teach-status').textContent = `Predicted: ${classNames[bestClass]}`;
                });

                currentCleanup = () => {
                    stream.getTracks().forEach(t => t.stop());
                    video.srcObject = null;
                    classData.forEach(c => c.forEach(t => t.dispose()));
                    delete window.addTeachSample;
                };
            } catch (err) {
                container.innerHTML = `<div class="demo-info" style="border-color:#ff7675;color:#ff7675"><i class="fas fa-exclamation-triangle"></i> Failed: ${err.message}</div>`;
            }
        })();
    }
};

// ---------- 9. SENTIMENT ANALYZER ----------
DEMOS.sentiment = {
    title: 'Sentiment Analyzer',
    desc: 'Type text and a DistilBERT transformer model analyzes the sentiment — runs entirely in your browser.',
    init(container) {
        container.innerHTML = `
            <div class="demo-info"><i class="fas fa-info-circle"></i> Uses Hugging Face Transformers.js — runs DistilBERT model via WASM in your browser. First load downloads ~67MB model (cached after).</div>
            <textarea id="sent-input" rows="4" style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:var(--bg);color:var(--text);font-family:var(--font);font-size:.95rem;resize:vertical" placeholder="Type or paste any text here...">I absolutely love this new AI technology! It's incredible how far we've come.</textarea>
            <div class="demo-controls">
                <button id="sent-analyze" class="active">🔍 Analyze Sentiment</button>
            </div>
            <div id="sent-results" style="margin-top:16px"></div>
            <div class="demo-status" id="sent-status">Click Analyze to run the transformer model.</div>`;

        let pipeline = null;

        document.getElementById('sent-analyze').addEventListener('click', async () => {
            const text = document.getElementById('sent-input').value.trim();
            if (!text) return;
            const status = document.getElementById('sent-status');
            const results = document.getElementById('sent-results');

            if (!pipeline) {
                status.textContent = 'Loading Transformers.js + DistilBERT model (first time: ~67MB download)...';
                try {
                    const { pipeline: createPipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
                    pipeline = await createPipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
                    status.textContent = 'Model loaded! Analyzing...';
                } catch (err) {
                    status.textContent = `Failed to load model: ${err.message}`;
                    results.innerHTML = `<div class="demo-info" style="border-color:#ff7675;color:#ff7675">Transformers.js requires a modern browser with WASM support. Try Chrome or Edge.</div>`;
                    return;
                }
            }

            status.textContent = 'Analyzing...';
            const output = await pipeline(text);
            const result = output[0];
            const isPositive = result.label === 'POSITIVE';
            const score = Math.round(result.score * 100);

            results.innerHTML = `
                <div class="sentiment-bar-wrap ${isPositive ? 'sentiment-pos' : 'sentiment-neg'}">
                    <div class="sentiment-label"><span>${isPositive ? '😊 POSITIVE' : '😟 NEGATIVE'}</span><span>${score}%</span></div>
                    <div class="sentiment-bar"><div class="sentiment-fill" style="width:${score}%"></div></div>
                </div>
                <div class="sentiment-bar-wrap ${!isPositive ? 'sentiment-pos' : 'sentiment-neg'}" style="margin-top:8px">
                    <div class="sentiment-label"><span>${!isPositive ? '😊 POSITIVE' : '😟 NEGATIVE'}</span><span>${100 - score}%</span></div>
                    <div class="sentiment-bar"><div class="sentiment-fill" style="width:${100 - score}%"></div></div>
                </div>`;
            status.textContent = `Result: ${result.label} (${score}% confidence) — model ran entirely in your browser!`;
        });

        currentCleanup = () => { pipeline = null; };
    }
};

// ---------- 10. DEPTH ESTIMATOR ----------
DEMOS.depth = {
    title: 'Depth Estimator',
    desc: 'Upload any image. A Depth Anything model generates a depth map entirely in your browser.',
    init(container) {
        container.innerHTML = `
            <div class="demo-info"><i class="fas fa-info-circle"></i> Uses Hugging Face Transformers.js with Depth-Anything-Small model (~50MB, cached after first load).</div>
            <div class="demo-columns">
                <div class="demo-column" style="align-items:center">
                    <p style="color:var(--dim);font-size:.85rem;margin-bottom:8px">Original Image</p>
                    <canvas id="depth-input" class="demo-output-img" width="400" height="300" style="cursor:pointer"></canvas>
                    <div class="demo-controls" style="justify-content:center">
                        <button id="depth-upload">📁 Upload Image</button>
                        <button id="depth-sample">🖼️ Try Sample</button>
                    </div>
                    <input type="file" id="depth-file" accept="image/*" style="display:none">
                </div>
                <div class="demo-column" style="align-items:center">
                    <p style="color:var(--dim);font-size:.85rem;margin-bottom:8px">AI Depth Map</p>
                    <canvas id="depth-output" class="demo-output-img" width="400" height="300"></canvas>
                </div>
            </div>
            <div class="demo-status" id="depth-status">Upload an image or try the sample to generate a depth map.</div>`;

        let depthPipeline = null;
        const inputCanvas = document.getElementById('depth-input');
        const outputCanvas = document.getElementById('depth-output');
        const inputCtx = inputCanvas.getContext('2d');
        const outputCtx = outputCanvas.getContext('2d');

        function drawSampleImage() {
            // Generate a simple synthetic scene as sample
            inputCtx.fillStyle = '#87CEEB';
            inputCtx.fillRect(0, 0, 400, 300);
            inputCtx.fillStyle = '#228B22';
            inputCtx.fillRect(0, 200, 400, 100);
            inputCtx.fillStyle = '#8B4513';
            inputCtx.fillRect(150, 100, 100, 100);
            inputCtx.fillStyle = '#DC143C';
            inputCtx.beginPath();
            inputCtx.moveTo(140, 100); inputCtx.lineTo(200, 50); inputCtx.lineTo(260, 100);
            inputCtx.fill();
            inputCtx.fillStyle = '#FFD700';
            inputCtx.beginPath();
            inputCtx.arc(50, 50, 25, 0, Math.PI * 2);
            inputCtx.fill();
            inputCtx.fillStyle = '#654321';
            inputCtx.fillRect(310, 120, 20, 80);
            inputCtx.fillStyle = '#006400';
            inputCtx.beginPath();
            inputCtx.arc(320, 100, 40, 0, Math.PI * 2);
            inputCtx.fill();
        }

        drawSampleImage();

        async function analyzeDepth() {
            const status = document.getElementById('depth-status');
            if (!depthPipeline) {
                status.textContent = 'Loading Depth Anything model (~50MB, first time only)...';
                try {
                    const { pipeline: createPipeline, RawImage } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
                    depthPipeline = { pipe: await createPipeline('depth-estimation', 'Xenova/depth-anything-small-hf'), RawImage };
                    status.textContent = 'Model loaded! Processing...';
                } catch (err) {
                    status.textContent = `Failed to load model: ${err.message}`;
                    return;
                }
            }
            status.textContent = 'Estimating depth...';
            try {
                const blob = await new Promise(r => inputCanvas.toBlob(r, 'image/png'));
                const url = URL.createObjectURL(blob);
                const img = await depthPipeline.RawImage.fromURL(url);
                URL.revokeObjectURL(url);
                const result = await depthPipeline.pipe(img);
                const depthMap = result.predicted_depth || result.depth;
                const depthData = depthMap.data;
                const w = depthMap.width, h = depthMap.height;

                outputCanvas.width = w; outputCanvas.height = h;
                const imgData = outputCtx.createImageData(w, h);
                let min = Infinity, max = -Infinity;
                for (const v of depthData) { if (v < min) min = v; if (v > max) max = v; }
                const range = max - min || 1;
                for (let i = 0; i < depthData.length; i++) {
                    const norm = (depthData[i] - min) / range;
                    // Viridis-inspired colormap
                    const r = Math.floor(Math.max(0, Math.min(255, (norm < 0.5 ? norm * 2 * 100 : 50 + norm * 205))));
                    const g = Math.floor(norm * 200 + 30);
                    const b = Math.floor(Math.max(0, (1 - norm) * 255));
                    imgData.data[i * 4] = r;
                    imgData.data[i * 4 + 1] = g;
                    imgData.data[i * 4 + 2] = b;
                    imgData.data[i * 4 + 3] = 255;
                }
                outputCtx.putImageData(imgData, 0, 0);
                status.textContent = `Depth map generated (${w}×${h}) — brighter = closer. Model ran entirely in your browser!`;
            } catch (err) {
                status.textContent = `Error during depth estimation: ${err.message}`;
            }
        }

        document.getElementById('depth-upload').addEventListener('click', () => document.getElementById('depth-file').click());
        document.getElementById('depth-file').addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(400 / img.width, 300 / img.height, 1);
                const w = Math.floor(img.width * scale), h = Math.floor(img.height * scale);
                inputCanvas.width = w; inputCanvas.height = h;
                inputCtx.drawImage(img, 0, 0, w, h);
                analyzeDepth();
            };
            img.src = URL.createObjectURL(file);
        });
        document.getElementById('depth-sample').addEventListener('click', () => {
            inputCanvas.width = 400; inputCanvas.height = 300;
            drawSampleImage();
            analyzeDepth();
        });
        inputCanvas.addEventListener('click', () => document.getElementById('depth-file').click());

        currentCleanup = () => { depthPipeline = null; };
    }
};
