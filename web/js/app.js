/**
 * Atmospheric Clock — Alarm, Timer, Stopwatch (matches SwiftUI)
 * TabView, current time header, single alarm, circular timer, lap stopwatch.
 * Time-of-day gradient: Night / Sunrise / Day / Dusk.
 */

(function () {
  'use strict';

  const STORAGE_ALARM = 'AtmosphericClock.alarm';
  const CHECK_INTERVAL_MS = 30 * 1000;
  const NOTIFY_DEBOUNCE_MS = 2 * 60 * 1000;
  const RING_CIRCUMFERENCE = 2 * Math.PI * 100;

  function $(id) { return document.getElementById(id); }

  function formatCurrentTime(date) {
    const h = date.getHours();
    const m = date.getMinutes();
    const am = h < 12;
    const h12 = h % 12 || 12;
    return h12 + ':' + String(m).padStart(2, '0') + ' ' + (am ? 'AM' : 'PM');
  }

  function formatTimer(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function formatStopwatch(ms) {
    const totalMs = Math.floor(ms);
    const m = Math.floor(totalMs / 60000);
    const s = Math.floor((totalMs % 60000) / 1000);
    const msPart = totalMs % 1000;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '.' + String(msPart).padStart(3, '0');
  }

  // ——— Tab switching ———
  function switchTab(tabId) {
    ['alarm', 'timer', 'stopwatch'].forEach(function (id) {
      const panel = $('panel-' + id);
      const btn = document.querySelector('.tab-btn[data-tab="' + id + '"]');
      if (panel) panel.classList.toggle('hidden', id !== tabId);
      if (btn) {
        btn.classList.toggle('active', id === tabId);
        btn.setAttribute('aria-selected', id === tabId);
      }
    });
  }

  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  // ——— Current time header (updates every second) ———
  function updateCurrentTime() {
    const el = $('current-time');
    if (el) {
      el.textContent = formatCurrentTime(new Date());
      el.setAttribute('datetime', new Date().toISOString());
    }
  }
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  // ——— Alarm: single preset, UNCalendarNotificationTrigger-style (daily at time) ———
  function getAlarmPreset() {
    try {
      const raw = localStorage.getItem(STORAGE_ALARM);
      if (raw) {
        const data = JSON.parse(raw);
        return { time: data.time || '07:00', isEnabled: !!data.isEnabled };
      }
    } catch (_) {}
    return { time: '07:00', isEnabled: false };
  }

  function saveAlarmPreset(preset) {
    try {
      localStorage.setItem(STORAGE_ALARM, JSON.stringify(preset));
    } catch (_) {}
  }

  function requestNotificationPermission() {
    if (!('Notification' in window)) return Promise.resolve(false);
    if (Notification.permission === 'granted') return Promise.resolve(true);
    if (Notification.permission === 'denied') return Promise.resolve(false);
    return Notification.requestPermission().then(function (p) { return p === 'granted'; });
  }

  function showNotification(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body: body || '' });
    } catch (_) {}
  }

  var alarmState = getAlarmPreset();
  var lastAlarmNotified = 0;

  function checkAlarm() {
    if (!alarmState.isEnabled) return;
    const now = new Date();
    const nowM = now.getHours() * 60 + now.getMinutes();
    const [h, m] = (alarmState.time || '07:00').split(':').map(Number);
    const targetM = (h || 0) * 60 + (m || 0);
    if (Math.abs(nowM - targetM) > 1) return;
    if (Date.now() - lastAlarmNotified < NOTIFY_DEBOUNCE_MS) return;
    showNotification('Alarm', 'Time to get up!');
    lastAlarmNotified = Date.now();
  }

  var timeAlarm = $('time-alarm');
  var enabledAlarm = $('enabled-alarm');
  var permissionHint = $('permission-hint');

  if (timeAlarm) {
    timeAlarm.value = alarmState.time;
    timeAlarm.addEventListener('change', function () {
      alarmState.time = timeAlarm.value;
      saveAlarmPreset(alarmState);
    });
  }
  if (enabledAlarm) {
    enabledAlarm.checked = alarmState.isEnabled;
    enabledAlarm.addEventListener('change', function () {
      alarmState.isEnabled = enabledAlarm.checked;
      saveAlarmPreset(alarmState);
    });
  }

  requestNotificationPermission().then(function (granted) {
    if (!granted && permissionHint) permissionHint.classList.remove('hidden');
  });
  setInterval(checkAlarm, CHECK_INTERVAL_MS);
  checkAlarm();

  // ——— Timer: circular countdown ring ———
  var totalSeconds = 300;
  var remainingSeconds = 300;
  var timerRunning = false;
  var timerIntervalId = null;

  function updateTimerDisplay() {
    var display = $('timer-display');
    if (display) display.textContent = formatTimer(remainingSeconds);
    var progress = $('timer-ring-progress');
    if (progress) {
      var ratio = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
      progress.setAttribute('stroke-dashoffset', RING_CIRCUMFERENCE * (1 - ratio));
    }
  }

  function tickTimer() {
    if (!timerRunning || remainingSeconds <= 0) return;
    remainingSeconds -= 1;
    updateTimerDisplay();
    if (remainingSeconds <= 0) {
      timerRunning = false;
      if (timerIntervalId) clearInterval(timerIntervalId);
      timerIntervalId = null;
      if (startBtn) { startBtn.textContent = 'Start'; startBtn.classList.remove('hidden'); }
      if (pauseBtn) pauseBtn.classList.add('hidden');
      if (resetBtn) resetBtn.classList.remove('hidden');
      if (stepperWrap) stepperWrap.classList.remove('hidden');
    }
  }

  var minutesEl = $('timer-minutes');
  var secondsEl = $('timer-seconds');
  var stepperWrap = $('timer-stepper-wrap');
  var minMinusBtn = $('timer-min-minus');
  var minPlusBtn = $('timer-min-plus');
  var secMinusBtn = $('timer-sec-minus');
  var secPlusBtn = $('timer-sec-plus');
  var startBtn = $('timer-start');
  var pauseBtn = $('timer-pause');
  var resetBtn = $('timer-reset');

  function setTimerDuration(min, sec) {
    min = Math.max(0, Math.min(120, min));
    sec = Math.max(0, Math.min(59, sec));
    totalSeconds = Math.max(1, min * 60 + sec);
    if (!timerRunning) remainingSeconds = totalSeconds;
    if (minutesEl) minutesEl.textContent = min;
    if (secondsEl) secondsEl.textContent = sec;
    updateTimerDisplay();
  }

  function getCurrentMinSec() {
    var m = Math.floor(remainingSeconds / 60);
    var s = remainingSeconds % 60;
    return { min: m, sec: s };
  }

  if (minMinusBtn) minMinusBtn.addEventListener('click', function () {
    if (timerRunning) return;
    var cur = getCurrentMinSec();
    setTimerDuration(cur.min - 1, cur.sec);
  });
  if (minPlusBtn) minPlusBtn.addEventListener('click', function () {
    if (timerRunning) return;
    var cur = getCurrentMinSec();
    setTimerDuration(cur.min + 1, cur.sec);
  });
  if (secMinusBtn) secMinusBtn.addEventListener('click', function () {
    if (timerRunning) return;
    var cur = getCurrentMinSec();
    setTimerDuration(cur.min, cur.sec - 1);
  });
  if (secPlusBtn) secPlusBtn.addEventListener('click', function () {
    if (timerRunning) return;
    var cur = getCurrentMinSec();
    setTimerDuration(cur.min, cur.sec + 1);
  });

  if (startBtn) {
    startBtn.addEventListener('click', function () {
      if (timerRunning) return;
      if (remainingSeconds <= 0) remainingSeconds = totalSeconds;
      timerRunning = true;
      startBtn.classList.add('hidden');
      if (pauseBtn) pauseBtn.classList.remove('hidden');
      if (resetBtn) resetBtn.classList.remove('hidden');
      if (stepperWrap) stepperWrap.classList.add('hidden');
      timerIntervalId = setInterval(tickTimer, 1000);
    });
  }
  if (pauseBtn) {
    pauseBtn.addEventListener('click', function () {
      timerRunning = false;
      if (timerIntervalId) clearInterval(timerIntervalId);
      timerIntervalId = null;
      if (startBtn) { startBtn.textContent = 'Resume'; startBtn.classList.remove('hidden'); }
      pauseBtn.classList.add('hidden');
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      timerRunning = false;
      if (timerIntervalId) clearInterval(timerIntervalId);
      timerIntervalId = null;
      remainingSeconds = totalSeconds;
      if (startBtn) { startBtn.textContent = 'Start'; startBtn.classList.remove('hidden'); }
      if (pauseBtn) pauseBtn.classList.add('hidden');
      resetBtn.classList.add('hidden');
      if (stepperWrap) stepperWrap.classList.remove('hidden');
      updateTimerDisplay();
    });
  }

  setTimerDuration(5, 0);

  // ——— Stopwatch: lap timer with milliseconds (Date() difference to avoid drift) ———
  var stopwatchStartDate = null;
  var stopwatchLapStart = null;
  var laps = [];

  function renderStopwatch() {
    var display = $('stopwatch-display');
    if (!display) return;
    if (!stopwatchStartDate) {
      display.textContent = '00:00.000';
      return;
    }
    var elapsed = new Date() - stopwatchStartDate;
    display.textContent = formatStopwatch(elapsed);
  }

  var stopwatchStartBtn = $('stopwatch-start');
  var stopwatchLapBtn = $('stopwatch-lap');
  var stopwatchStopBtn = $('stopwatch-stop');
  var lapsList = $('stopwatch-laps');

  if (stopwatchStartBtn) {
    stopwatchStartBtn.addEventListener('click', function () {
      stopwatchStartDate = new Date();
      stopwatchLapStart = stopwatchStartDate;
      laps = [];
      if (lapsList) lapsList.innerHTML = '';
      stopwatchStartBtn.classList.add('hidden');
      stopwatchLapBtn.classList.remove('hidden');
      stopwatchStopBtn.classList.remove('hidden');
    });
  }
  if (stopwatchLapBtn) {
    stopwatchLapBtn.addEventListener('click', function () {
      if (!stopwatchStartDate || !stopwatchLapStart) return;
      var lapMs = new Date() - stopwatchLapStart;
      laps.push(lapMs);
      stopwatchLapStart = new Date();
      var li = document.createElement('li');
      li.textContent = 'Lap ' + laps.length + ' — ' + formatStopwatch(lapMs);
      if (lapsList) lapsList.appendChild(li);
    });
  }
  if (stopwatchStopBtn) {
    stopwatchStopBtn.addEventListener('click', function () {
      stopwatchStartDate = null;
      stopwatchLapStart = null;
      stopwatchStartBtn.classList.remove('hidden');
      stopwatchLapBtn.classList.add('hidden');
      stopwatchStopBtn.classList.add('hidden');
    });
  }

  setInterval(renderStopwatch, 20);

  // ——— Time-of-day theme (Night / Sunrise / Day / Dusk — matches Swift) ———
  function hourFraction(date) {
    return date.getHours() + date.getMinutes() / 60;
  }

  function applyTimeOfDayTheme() {
    var hour = hourFraction(new Date());
    var r, g, b, r2, g2, b2;
    var isNight = hour >= 20 || hour < 6;
    if (isNight) {
      r = 10; g = 14; b = 26;
      r2 = 26; g2 = 34; b2 = 53;
    } else if (hour >= 6 && hour < 9) {
      r = 232; g = 168; b = 56;
      r2 = 135; g2 = 206; b2 = 235;
    } else if (hour >= 9 && hour < 17) {
      r = 91; g = 163; b = 246;
      r2 = 179; g2 = 224; b2 = 255;
    } else {
      r = 255; g = 126; b = 95;
      r2 = 44; g2 = 62; b2 = 80;
    }
    document.documentElement.style.setProperty('--theme-bg-r', r);
    document.documentElement.style.setProperty('--theme-bg-g', g);
    document.documentElement.style.setProperty('--theme-bg-b', b);
    document.documentElement.style.setProperty('--theme-surface-r', r2);
    document.documentElement.style.setProperty('--theme-surface-g', g2);
    document.documentElement.style.setProperty('--theme-surface-b', b2);
    var bright = hour >= 6 && hour < 18;
    document.documentElement.style.setProperty('--theme-text', bright ? '#1e293b' : '#f1f5f9');
    document.documentElement.style.setProperty('--theme-text-muted', bright ? '#64748b' : '#94a3b8');
    document.documentElement.style.setProperty('--theme-border', bright ? '#e2e8f0' : '#334155');
    var orb = document.getElementById('sky-orb');
    if (orb) {
      orb.classList.remove('sun', 'moon');
      orb.classList.add(isNight ? 'moon' : 'sun');
    }
  }

  applyTimeOfDayTheme();
  setInterval(applyTimeOfDayTheme, 60 * 1000);
})();
