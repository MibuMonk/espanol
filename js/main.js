/* ═══════════════════════════════════════════════════════════════
   SHARED JS — Español Course
   Contains TTS, speed slider, scroll progress, and shared utilities
   ═══════════════════════════════════════════════════════════════ */

// ============================
// TTS (Text-to-Speech) System
// ============================
var speechRate = 0.7;
var voicesLoaded = false;
var spanishVoice = null;

function loadVoices() {
  var voices = speechSynthesis.getVoices();
  if (voices.length > 0) {
    spanishVoice = voices.find(function(v) { return v.lang.startsWith('es'); });
    voicesLoaded = true;
  }
}

if (typeof speechSynthesis !== 'undefined') {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

function speak(text, rate) {
  if (typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  var utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = rate || speechRate;
  if (spanishVoice) utterance.voice = spanishVoice;
  speechSynthesis.speak(utterance);
}

// ============================
// Speed Slider
// ============================
function initSpeedSlider() {
  var speedSlider = document.getElementById('speed-slider');
  var speedValEl = document.getElementById('speed-val');
  if (!speedSlider || !speedValEl) return;

  speedSlider.addEventListener('input', function() {
    speechRate = parseFloat(this.value);
    speedValEl.textContent = speechRate.toFixed(2).replace(/0$/, '') + 'x';
  });
}

function updateSpeed(val) {
  speechRate = parseFloat(val);
  var el = document.getElementById('speed-val');
  if (el) el.textContent = val + 'x';
}

// ============================
// Scroll Progress Bar
// ============================
function initScrollProgress() {
  var bar = document.getElementById('progress-bar') || document.getElementById('scroll-progress');
  if (!bar) return;

  window.addEventListener('scroll', function() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = progress + '%';
    if (bar.hasAttribute('aria-valuenow')) {
      bar.setAttribute('aria-valuenow', Math.round(progress));
    }
    if (typeof updateSectionNav === 'function') {
      updateSectionNav();
    }
  });
}

// ============================
// Dialogue Playback
// ============================
// DOM-based: reads data-es attributes from elements with data-dialogue attribute (L1, L2)
// Array-based: accepts an array of strings directly (L3)
function playDialogue(dialogueIdOrArray) {
  if (typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();

  var texts;
  if (Array.isArray(dialogueIdOrArray)) {
    texts = dialogueIdOrArray;
  } else {
    var lines = document.querySelectorAll('[data-dialogue="' + dialogueIdOrArray + '"]');
    texts = [];
    lines.forEach(function(line) {
      var es = line.getAttribute('data-es');
      if (es) texts.push(es);
    });
  }

  var i = 0;
  function playNext() {
    if (i >= texts.length) return;
    var utterance = new SpeechSynthesisUtterance(texts[i]);
    utterance.lang = 'es-ES';
    utterance.rate = speechRate;
    if (spanishVoice) utterance.voice = spanishVoice;
    utterance.onend = function() {
      i++;
      setTimeout(playNext, 800);
    };
    speechSynthesis.speak(utterance);
  }
  playNext();
}

// ============================
// Section Nav Highlight
// ============================
function updateSectionNav() {
  var navLinks = document.querySelectorAll('.section-nav a');
  if (!navLinks.length) return;

  var current = '';
  var offset = 160;

  navLinks.forEach(function(link) {
    var href = link.getAttribute('href');
    if (!href || href.charAt(0) !== '#') return;
    var id = href.substring(1);
    var el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= offset) {
      current = id;
    }
  });

  navLinks.forEach(function(link) {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + current) {
      link.classList.add('active');
    }
  });
}

// ============================
// Exercise System (L1, L2)
// ============================
var exerciseState = {};

function getExState(exId) {
  if (!exerciseState[exId]) {
    var section = document.getElementById(exId);
    var qBlocks = section.querySelectorAll('.question-block');
    var total = qBlocks.length;
    exerciseState[exId] = { answered: 0, correct: 0, total: total, done: {} };
  }
  return exerciseState[exId];
}

function selectMC(btn) {
  var block = btn.closest('.question-block');
  var qId = block.getAttribute('data-q');
  var exId = block.closest('[data-exercise]').getAttribute('data-exercise');
  var state = getExState(exId);
  if (state.done[qId]) return;

  block.querySelectorAll('.mc-btn').forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
}

function checkMC(qId, correctVal) {
  var block = document.querySelector('[data-q="' + qId + '"]');
  var exId = block.closest('[data-exercise]').getAttribute('data-exercise');
  var state = getExState(exId);
  if (state.done[qId]) return;

  var selected = block.querySelector('.mc-btn.selected');
  if (!selected) return;

  var fb = document.getElementById('fb-' + qId);
  var isCorrect = selected.getAttribute('data-val') === correctVal;

  block.querySelectorAll('.mc-btn').forEach(function(b) { b.disabled = true; });
  block.querySelector('.check-btn').disabled = true;

  if (isCorrect) {
    selected.classList.add('correct');
    fb.textContent = '\u2713 \u6b63\u786e\uff01';
    fb.className = 'feedback correct';
    state.correct++;
  } else {
    selected.classList.add('wrong');
    block.querySelectorAll('.mc-btn').forEach(function(b) {
      if (b.getAttribute('data-val') === correctVal) b.classList.add('correct');
    });
    fb.textContent = '\u2717 \u6b63\u786e\u7b54\u6848\u662f\uff1a' + correctVal;
    fb.className = 'feedback wrong';
  }

  state.answered++;
  state.done[qId] = true;
  checkExerciseComplete(exId);
}

function checkText(qId, acceptableAnswers) {
  var block = document.querySelector('[data-q="' + qId + '"]');
  var exId = block.closest('[data-exercise]').getAttribute('data-exercise');
  var state = getExState(exId);
  if (state.done[qId]) return;

  var input = document.getElementById('input-' + qId);
  var userAnswer = input.value.trim();
  if (!userAnswer) return;

  var fb = document.getElementById('fb-' + qId);
  var isCorrect = acceptableAnswers.some(function(a) {
    return userAnswer.toLowerCase() === a.toLowerCase();
  });

  input.disabled = true;
  block.querySelector('.check-btn').disabled = true;

  if (isCorrect) {
    input.classList.add('correct');
    fb.textContent = '\u2713 \u6b63\u786e\uff01';
    fb.className = 'feedback correct';
    state.correct++;
  } else {
    input.classList.add('wrong');
    fb.textContent = '\u2717 \u6b63\u786e\u7b54\u6848\u662f\uff1a' + acceptableAnswers[0];
    fb.className = 'feedback wrong';
  }

  state.answered++;
  state.done[qId] = true;
  checkExerciseComplete(exId);
}

function checkTextStartsWith(qId, prefix) {
  var block = document.querySelector('[data-q="' + qId + '"]');
  var exId = block.closest('[data-exercise]').getAttribute('data-exercise');
  var state = getExState(exId);
  if (state.done[qId]) return;

  var input = document.getElementById('input-' + qId);
  var userAnswer = input.value.trim();
  if (!userAnswer) return;

  var fb = document.getElementById('fb-' + qId);
  var isCorrect = userAnswer.toLowerCase().startsWith(prefix.toLowerCase()) && userAnswer.length > prefix.length;

  input.disabled = true;
  block.querySelector('.check-btn').disabled = true;

  if (isCorrect) {
    input.classList.add('correct');
    fb.textContent = '\u2713 \u6b63\u786e\uff01' + userAnswer;
    fb.className = 'feedback correct';
    state.correct++;
  } else {
    input.classList.add('wrong');
    fb.textContent = '\u2717 \u7b54\u6848\u5e94\u4ee5 "' + prefix + '" \u5f00\u5934\uff0c\u4f8b\u5982 "Me llamo Carlos"';
    fb.className = 'feedback wrong';
  }

  state.answered++;
  state.done[qId] = true;
  checkExerciseComplete(exId);
}

function checkExerciseComplete(exId) {
  var state = getExState(exId);
  if (state.answered >= state.total) {
    var scoreEl = document.getElementById('score-' + exId);
    scoreEl.textContent = '\u4f60\u7b54\u5bf9\u4e86 ' + state.correct + '/' + state.total + ' \u9898';
    scoreEl.classList.add('show');
    var retryEl = document.getElementById('retry-' + exId);
    retryEl.classList.add('show');
  }
}

function resetExercise(exId) {
  var section = document.getElementById(exId);
  exerciseState[exId] = null;

  section.querySelectorAll('.mc-btn').forEach(function(b) {
    b.disabled = false;
    b.classList.remove('selected', 'correct', 'wrong');
  });

  section.querySelectorAll('.answer-input').forEach(function(inp) {
    inp.disabled = false;
    inp.value = '';
    inp.classList.remove('correct', 'wrong');
  });

  section.querySelectorAll('.check-btn').forEach(function(b) { b.disabled = false; });

  section.querySelectorAll('.feedback').forEach(function(f) {
    f.className = 'feedback';
    f.textContent = '';
  });

  document.getElementById('score-' + exId).classList.remove('show');
  document.getElementById('retry-' + exId).classList.remove('show');
}

// ============================
// Collapsible Sections (L1, L2 style)
// ============================
function toggleCollapse(btn) {
  var content = btn.nextElementSibling;
  var isOpen = btn.classList.contains('open');

  if (isOpen) {
    content.style.maxHeight = null;
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  } else {
    content.style.maxHeight = content.scrollHeight + 'px';
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }
}

// L3-style collapsible (body gets .open class)
function toggleCollapsible(header) {
  var body = header.nextElementSibling;
  var isOpen = body.classList.contains('open');
  body.classList.toggle('open');
  header.classList.toggle('open');
  header.setAttribute('aria-expanded', !isOpen);
}

// ============================
// Initialize on DOM ready
// ============================
document.addEventListener('DOMContentLoaded', function() {
  initSpeedSlider();
  initScrollProgress();
  if (document.querySelector('.section-nav')) {
    updateSectionNav();
  }
});
