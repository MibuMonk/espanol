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

// Load voices on init and on change event
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

// Also support the L3-style oninput="updateSpeed()" pattern
function updateSpeed(val) {
  speechRate = parseFloat(val);
  var el = document.getElementById('speed-val');
  if (el) el.textContent = val + 'x';
}

// ============================
// Scroll Progress Bar
// ============================
function initScrollProgress() {
  // Support both id="progress-bar" (L1, L3) and id="scroll-progress" (L2)
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
    // L1-specific section nav highlighting
    if (typeof updateSectionNav === 'function') {
      updateSectionNav();
    }
  });
}

// ============================
// Initialize on DOM ready
// ============================
document.addEventListener('DOMContentLoaded', function() {
  initSpeedSlider();
  initScrollProgress();
});
