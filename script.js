/* script.js — Developer portfolio shared scripts */

/* ── Helpers ────────────────────────────────────────────────── */

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function typewriter(el, text, speed) {
  speed = speed || 45;
  return new Promise(function (resolve) {
    var i = 0;
    function tick() {
      if (i < text.length) {
        el.textContent += text[i++];
        setTimeout(tick, speed);
      } else {
        resolve();
      }
    }
    tick();
  });
}

/* ── Terminal Animation (index.html only) ───────────────────── */

async function startTerminal() {
  var body = document.querySelector('.terminal-body');
  if (!body) return;

  var PROMPT = 'vlad@portfolio:~$ ';

  async function addCommandLine(cmd) {
    var line = document.createElement('div');
    line.className = 'terminal-line';

    var p = document.createElement('span');
    p.className = 'terminal-prompt';
    p.textContent = PROMPT;

    var c = document.createElement('span');
    c.className = 'terminal-cmd';

    line.append(p, c);
    body.appendChild(line);
    await typewriter(c, cmd, 60);
    await delay(180);
  }

  async function addOutputLine(text, extraClass) {
    var out = document.createElement('div');
    out.className = 'terminal-output' + (extraClass ? ' ' + extraClass : '');
    body.appendChild(out);
    await typewriter(out, text, 20);
    await delay(120);
  }

  async function addCursorLine() {
    var line = document.createElement('div');
    line.className = 'terminal-line';

    var p = document.createElement('span');
    p.className = 'terminal-prompt';
    p.textContent = PROMPT;

    var cur = document.createElement('span');
    cur.className = 'terminal-cursor';

    line.append(p, cur);
    body.appendChild(line);
  }

  await delay(350);
  await addCommandLine('whoami');
  await addOutputLine('Vlad Petrosyan', 'green');
  await delay(280);
  await addCommandLine('cat role.txt');
  await addOutputLine('student | engineer | robotics developer');
  await delay(280);
  await addCursorLine();
}

/* ── VS Code Status Bar ─────────────────────────────────────── */

function initStatusBar() {
  var bar = document.querySelector('.vscode-statusbar');
  if (!bar) return;

  var clockEl = bar.querySelector('.statusbar-clock');
  if (!clockEl) return;

  function tick() {
    var now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
  }
  tick();
  setInterval(tick, 1000);
}

/* ── Age Calculator ─────────────────────────────────────────── */

function updateAge() {
  var el = document.getElementById('vlad-age');
  if (!el) return;
  var bday = new Date('2010-01-22');
  var now = new Date();
  var age = now.getFullYear() - bday.getFullYear();
  var m = now.getMonth() - bday.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < bday.getDate())) age--;
  el.textContent = age;
}

/* ── Init ───────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {
  startTerminal();
  initStatusBar();
  updateAge();
});
