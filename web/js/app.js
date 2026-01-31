/**
 * Intelligent Alarm — cross-platform (Windows + Mac)
 * Data model: weekday preset (Mon–Fri), weekend preset (Sat–Sun).
 * Uses Web Notifications API; persistence via localStorage.
 * No external libraries.
 */

(function () {
  'use strict';

  const STORAGE_WEEKDAY = 'AlarmPreset.weekday';
  const STORAGE_WEEKEND = 'AlarmPreset.weekend';
  const CHECK_INTERVAL_MS = 30 * 1000; // check every 30 seconds
  const NOTIFY_DEBOUNCE_MS = 2 * 60 * 1000; // don't re-notify within 2 minutes

  const AlarmType = { WEEKDAY: 'weekday', WEEKEND: 'weekend' };

  function isDateInWeekend(date) {
    const day = date.getDay(); // 0 = Sun, 6 = Sat
    return day === 0 || day === 6;
  }

  function getPreset(key, defaultTime) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const data = JSON.parse(raw);
        return {
          time: data.time || defaultTime,
          isEnabled: data.isEnabled !== false,
          type: data.type
        };
      }
    } catch (_) {}
    return { time: defaultTime, isEnabled: true, type: key === STORAGE_WEEKDAY ? AlarmType.WEEKDAY : AlarmType.WEEKEND };
  }

  function savePreset(key, preset) {
    try {
      localStorage.setItem(key, JSON.stringify({
        time: preset.time,
        isEnabled: preset.isEnabled,
        type: preset.type
      }));
    } catch (_) {}
  }

  function requestPermission() {
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

  function timeStringToMinutes(str) {
    const [h, m] = (str || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  function nowMinutes() {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  function checkAndNotify(weekdayPreset, weekendPreset, lastNotified) {
    const now = new Date();
    const weekend = isDateInWeekend(now);
    const nowM = nowMinutes();

    const preset = weekend ? weekendPreset : weekdayPreset;
    if (!preset.isEnabled) return lastNotified;

    const [h, m] = (preset.time || '07:00').split(':').map(Number);
    const targetM = (h || 0) * 60 + (m || 0);

    if (Math.abs(nowM - targetM) > 1) return lastNotified; // within 1 minute
    if (Date.now() - lastNotified < NOTIFY_DEBOUNCE_MS) return lastNotified;

    const title = weekend ? 'Weekend Alarm' : 'Weekday Alarm';
    const body = weekend ? 'Good morning!' : 'Time to get up!';
    showNotification(title, body);
    return Date.now();
  }

  function runChecker(state) {
    state.lastNotified = checkAndNotify(
      state.weekdayPreset,
      state.weekendPreset,
      state.lastNotified
    );
  }

  function updateActiveCards() {
    const weekend = isDateInWeekend(new Date());
    const cardWeekday = document.getElementById('card-weekday');
    const cardWeekend = document.getElementById('card-weekend');
    if (cardWeekday) {
      cardWeekday.classList.remove('active-weekday', 'active-weekend');
      if (!weekend) cardWeekday.classList.add('active-weekday');
    }
    if (cardWeekend) {
      cardWeekend.classList.remove('active-weekday', 'active-weekend');
      if (weekend) cardWeekend.classList.add('active-weekend');
    }
  }

  /** Time-of-day theme: 0 = night (navy/black), 1 = day (light blue). Smooth transition. */
  function timeOfDayBrightness(date) {
    const hour = date.getHours() + date.getMinutes() / 60;
    const t = (hour / 24) * 2 * Math.PI - Math.PI / 2;
    return Math.max(0, Math.min(1, (Math.sin(t) + 1) / 2));
  }

  function applyTimeOfDayTheme() {
    const bright = timeOfDayBrightness(new Date());
    const r = Math.round((0.03 + (0.85 - 0.03) * bright) * 255);
    const g = Math.round((0.05 + (0.92 - 0.05) * bright) * 255);
    const bl = Math.round((0.12 + (1 - 0.12) * bright) * 255);
    const r2 = Math.round((0.08 + (1 - 0.08) * bright) * 255);
    const g2 = Math.round((0.1 + (1 - 0.1) * bright) * 255);
    const b2 = Math.round((0.18 + (1 - 0.18) * bright) * 255);
    document.documentElement.style.setProperty('--theme-bg-r', r);
    document.documentElement.style.setProperty('--theme-bg-g', g);
    document.documentElement.style.setProperty('--theme-bg-b', bl);
    document.documentElement.style.setProperty('--theme-surface-r', r2);
    document.documentElement.style.setProperty('--theme-surface-g', g2);
    document.documentElement.style.setProperty('--theme-surface-b', b2);
    document.documentElement.style.setProperty('--theme-text', bright > 0.5 ? '#1e293b' : '#f1f5f9');
    document.documentElement.style.setProperty('--theme-text-muted', bright > 0.5 ? '#64748b' : '#94a3b8');
    document.documentElement.style.setProperty('--theme-border', bright > 0.5 ? '#e2e8f0' : '#334155');
  }

  const state = {
    weekdayPreset: getPreset(STORAGE_WEEKDAY, '07:00'),
    weekendPreset: getPreset(STORAGE_WEEKEND, '09:00'),
    lastNotified: 0
  };

  function persistAndSchedule() {
    savePreset(STORAGE_WEEKDAY, state.weekdayPreset);
    savePreset(STORAGE_WEEKEND, state.weekendPreset);
  }

  function bindUi() {
    const timeWeekday = document.getElementById('time-weekday');
    const timeWeekend = document.getElementById('time-weekend');
    const enabledWeekday = document.getElementById('enabled-weekday');
    const enabledWeekend = document.getElementById('enabled-weekend');
    const permissionHint = document.getElementById('permission-hint');

    if (timeWeekday) {
      timeWeekday.value = state.weekdayPreset.time;
      timeWeekday.addEventListener('change', function () {
        state.weekdayPreset.time = timeWeekday.value;
        persistAndSchedule();
      });
    }
    if (timeWeekend) {
      timeWeekend.value = state.weekendPreset.time;
      timeWeekend.addEventListener('change', function () {
        state.weekendPreset.time = timeWeekend.value;
        persistAndSchedule();
      });
    }
    if (enabledWeekday) {
      enabledWeekday.checked = state.weekdayPreset.isEnabled;
      enabledWeekday.addEventListener('change', function () {
        state.weekdayPreset.isEnabled = enabledWeekday.checked;
        persistAndSchedule();
      });
    }
    if (enabledWeekend) {
      enabledWeekend.checked = state.weekendPreset.isEnabled;
      enabledWeekend.addEventListener('change', function () {
        state.weekendPreset.isEnabled = enabledWeekend.checked;
        persistAndSchedule();
      });
    }

    requestPermission().then(function (granted) {
      if (!granted && permissionHint) permissionHint.classList.remove('hidden');
    });

    applyTimeOfDayTheme();
    setInterval(applyTimeOfDayTheme, 60 * 1000);
    updateActiveCards();
    setInterval(updateActiveCards, 60 * 1000);

    setInterval(function () { runChecker(state); }, CHECK_INTERVAL_MS);
    runChecker(state);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindUi);
  } else {
    bindUi();
  }
})();
