"use strict";
const $ = (...args) => document.querySelector(...args);

const INTERVAL_KEY = "interval";

const intervalValues = [
  ["5", "5s"],
  ["10", "10s"],
  ["30", "30s"],
  ["60", "1m"],
  ["120", "2m"],
];
const shutdownValues = [
  ["-1", "never"],
  ["1", "1h"],
  ["2", "2h"],
  ["3", "3h"],
  ["6", "6h"],
  ["9", "9h"],
];

const ICONS = {
  shutdown: "settings_power",
  interval: "update",
};

const header = $("header");
const pictures = $("#pictures");
const footer = $("footer");
const skipNext = $("#next");
const skipPrev = $("#prev");
const close = $("#close");
const gear = $("#gear");
const settings = $("#settings");

const OPAGUE = "opague";

let current = 0;
let interval = null;
let shutdown = null;

let intervalValue = "10";
let shutdownValue = "-1";

let overlayDisplay = "none";
let settingsDisplay = "none";

function setStyle(el, style) {
  for (const key in style) {
    el.style[key] = style[key];
  }
}

function setDisplay(els, display) {
  for (const el of els) {
    setStyle(el, { display })
  }
}

/*
 * Settings.
 */
function toggleSettings() {
  if (settingsDisplay === "none") {
    showSettings();
  } else {
    hideSettings();
  }
}

function hideSettings() {
  settingsDisplay = "none";
  setDisplay([settings], settingsDisplay);
}

function showSettings() {
  settingsDisplay = "flex";
  setDisplay([settings], settingsDisplay);
}

function settingsButton(name, [value, label]) {
  const d = document.createElement("div");
  d.classList.add("settings-container");
  const i = document.createElement("input");
  i.classList.add(name);
  i.name = name;
  i.value = value;
  i.type = "radio";
  const c = document.createElement("div");
  c.classList.add("checkmark");
  c.textContent = label;
  d.appendChild(i);
  d.appendChild(c);
  return d;
}

function settingsForm(name, values, callback) {
  const f = document.createElement("form");
  const label = document.createElement("div");
  label.classList.add("checkmark");
  const i = document.createElement("i");
  i.classList.add("material-icons");
  i.textContent = ICONS[name];
  label.appendChild(i);
  f.appendChild(label);
  for (const tuple of values) {
    f.appendChild(settingsButton(name, tuple));
  }
  f.addEventListener("change", () => {
    const val = f.querySelector("input:checked").value;
    callback(val);
  });
  return f;
}

function createSettings() {
  const shutdownCallback = v => setShutdown(parseInt(v));
  const intervalCallback = v => updateInterval(parseInt(v))
  const interval = settingsForm("interval", intervalValues, intervalCallback);
  const shutdown = settingsForm("shutdown", shutdownValues, shutdownCallback);
  settings.appendChild(interval);
  settings.appendChild(shutdown);
}

function selectSetting(name, val) {
  let all = [...settings.querySelectorAll(`.${name}`)];
  let selected = all.filter(e => e.value === val)[0];
  if (selected) {
    selected.checked = true;
  }
}

/*
 * Overlay
 */
function toggleOverlay() {
  if (overlayDisplay === "none") {
    showOverlay();
  } else {
    hideOverlay();
  }
}

function hideOverlay() {
  interval = window.setInterval(next, intervalValue * 1000);
  hideSettings();
  overlayDisplay = "none";
  setDisplay([header, footer], overlayDisplay);
}

function showOverlay() {
  window.clearInterval(interval);
  overlayDisplay = "flex";
  setDisplay([header, footer], overlayDisplay);
}


/*
 * Image update and navigation.
 */
function next() {
  step(i => i + 1);
}

function prev() {
  step(i => i - 1);
}

function step(f) {
  const imgs = document.querySelectorAll("img");
  // fail over
  if (!isFinite(current)) {
    document.querySelectorAll(`.${OPAGUE}`).forEach(
      e => e.classList.remove(OPAGUE)
    );
    current = 0;
  }
  if (current < imgs.length) {
    imgs[current].classList.remove(OPAGUE);
  }
  current = (f(current) + imgs.length) % imgs.length;
  console.log(current);
  if (current < imgs.length) {
    imgs[current].classList.add(OPAGUE);
  }
}

function img(src) {
  const elem = document.createElement("img");
  elem.src = src;
  return elem;
}

function update(url) {
  return fetch(url).then(imgs => {
    const div = document.querySelector("#pictures > div");
    const rep = div.cloneNode();
    return imgs.json().then(json => {
      try {
        json.map(img).forEach(e => rep.appendChild(e));
        div.parentElement.replaceChild(rep, div);
      } catch(e) {
        alert(e);
      }
    })
  }).then(next);
}


/*
 * Shutdown and update interval.
 */
function setShutdown(val) {
  window.clearTimeout(shutdown);
  shutdown = window.setTimeout(callShutdown, val * 1000);
}

function callShutdown() {
  console.log("shutdown");
}

function updateInterval(val) {
  if (val) {
    intervalValue = val;
    localStorage.setItem(INTERVAL_KEY, intervalValue);
  }
}

function initShutdownAndInterval() {
  intervalValue = localStorage.getItem(INTERVAL_KEY) || intervalValue;
  selectSetting("interval", intervalValue);
  selectSetting("shutdown", shutdownValue);
  interval = window.setInterval(next, intervalValue * 1000);
  update("getImages");
}

function init() {
  createSettings();
  pictures.addEventListener("click", toggleOverlay);
  gear.addEventListener("click", toggleSettings);
  close.addEventListener("click", hideOverlay);
  skipNext.addEventListener("click", next);
  skipPrev.addEventListener("click", prev);
  initShutdownAndInterval();
}

init();
