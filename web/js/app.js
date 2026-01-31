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
