"use strict";
const $ = (...args) => document.querySelector(...args);

const INTERVAL_KEY = "interval";
const FOLDER_KEY = "folder";

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

const folderNames = [
  ["new","new"],
  ["2021","2021"],
  ["old","old"],
  ["2020","2020"],
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
const poweroff = $("#poweroff");
const close = $("#close");
const gear = $("#gear");
const settings = $("#settings");
const folderSel = $("#folder-sel");

const OPAGUE = "opague";

let current = 0;
let interval = null;
let shutdown = null;

let folder = null;

let intervalValue = "10";
let shutdownValue = "-1";

let overlayDisplay = "none";
let settingsDisplay = "none";
let folderSelDisplay = "none";


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
  hideFolderSel();
  overlayDisplay = "none";
  setDisplay([header, footer], overlayDisplay);
}

function showOverlay() {
  window.clearInterval(interval);
  overlayDisplay = "flex";
  setDisplay([header, footer], overlayDisplay);
}
/*
 * Folder selection menu
 */
function toggleFolderSel(){
  if (folderSelDisplay === "none") {
    showFolderSel();
  } else {
    hideFolderSel();
  }
}

function hideFolderSel(){
  folderSelDisplay = "none";
  setDisplay([folderSel],folderSelDisplay);
}

function showFolderSel(){
  folderSelDisplay = "flex";
  setDisplay([folderSel],folderSelDisplay);
}

function createFolderSel(){
  const folderCallback = v => updateFolder(v);
  const folder = folderForm("folder", folderNames, folderCallback);
  folderSel.appendChild(folder);
}

function selectFolder(name, val) {
  let all = [...settings.querySelectorAll(`.${name}`)];
  let selected = all.filter(e => e.value === val)[0];
  if (selected) {
    selected.checked = true;
  }
}
function folderForm(name, values, callback) {
  const f = document.createElement("form");
  const label = document.createElement("div");
  //label.classList.add("checkmark");
  //const i = document.createElement("i");
  //i.classList.add("material-icons");
  //i.textContent = ICONS[name];
  //label.appendChild(i);
  //f.appendChild(label);
  for (const tuple of values) {
    f.appendChild(settingsButton(name, tuple));
  }
  f.addEventListener("change", () => {
    const val = f.querySelector("input:checked").value;
    callback(val);
  });
  return f;
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

function update() {
  return fetch("updateAndGetImages?folder=" + folder).then(imgs => {
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

function shutdownPframe() {
  return fetch("shutDownPframe").then(() => {
    console.log("shutting donw…");
  }).catch(() => {
    alert("unable to shut down!");
  })
}


/*
 * Shutdown and update interval.
 */
function setShutdown(val) {
  window.clearTimeout(shutdown);
  if (shutdown > 0) {
    shutdown = window.setTimeout(shutdownPframe, val * 60 * 60 * 1000);
  }
}

function updateFolder(val)
{
  if (val) {
    folder = val;
    localStorage.setItem(FOLDER_KEY, folder);
    update();
  }
}

function updateInterval(val) {
  if (val) {
    intervalValue = val;
    localStorage.setItem(INTERVAL_KEY, intervalValue);
  }
}

function initShutdownAndInterval() {
  intervalValue = localStorage.getItem(INTERVAL_KEY) || intervalValue;
  folder = localStorage.getItem(FOLDER_KEY) || folder;
  selectSetting("interval", intervalValue);
  selectSetting("shutdown", shutdownValue);
  interval = window.setInterval(next, intervalValue * 1000);
  update();
}

function init() {
  createSettings();
  createFolderSel();
  pictures.addEventListener("click", toggleOverlay);
  gear.addEventListener("click", toggleSettings);
  folders.addEventListener("click",toggleFolderSel);
  close.addEventListener("click", hideOverlay);
  poweroff.addEventListener("click", () => {
    if (window.confirm("Shutdown PiFrame?")) {
      shutdownPframe();
    }
  });
  skipNext.addEventListener("click", next);
  skipPrev.addEventListener("click", prev);
  initShutdownAndInterval();
}

init();
