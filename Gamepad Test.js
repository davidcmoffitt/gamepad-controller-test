  const fudgeFactor = 2; // because of bug in Chrome related to svg text alignment font sizes can not be < 1
const gamepadsElem = document.querySelector("#gamepads");
const gamepadsByIndex = {};

const controllerTemplate = `
<div class="head"><div class="id"></div></div>

<table class="gamepadtablestyle">
  <thead>
  <tr>
    <th>INDEX</th>
    <th>CONNECTED</th>
    <th>MAPPING</th>
    <th>TIME STAMP</th>
  </tr>
  </thead>
  <tbody>
  <tr>
    <td><div class="index"></div></td>
    <td><div class="connected"></div></td>
    <td><div class="mapping"></div></td>
    <td><div class="timestamp ellipsis"></div></td>
  </tr>
  </tbody>
</table>

<table class="gamepadtablestyle1">
  <thead>
  <tr>
    <th>POSE</th>
    <th>HAPTIC ACTUATORS</th>
    <th>HAND</th>
    <th>DISPLAY ID</th>
    <th>VIBRATION</th>
  </tr>
  </thead>
  <tbody>
  <tr>
    <td><div class="pose"></div></td>
    <td><div class="hapticActuators"></div></td>
    <td><div class="hand"></div></td>
    <td><div class="displayId"></div></td>
    <td><div class="vibrationActuator"></div></td>
  </tr>
  </tbody>
</table>

<div>
  <div class="inputs">
    <div class="axes"></div>
    <div class="buttons"></div>
  </div>
</div>
`;
const axisTemplate = `
<svg viewBox="-2.2 -2.2 4.4 4.4" width="135" height="160">
    <circle cx="0" cy="0" r="2" fill="none" stroke="#000" stroke-width="0.04" />
    <path d="M0,-2L0,2M-2,0L2,0" stroke="#000" stroke-width="0.04" />
    <circle cx="0" cy="0" r="0.22" fill="#FF0C00" class="axis" />
    <text text-anchor="middle" fill="#000" x="0" y="2.55">0</text>
</svg>
`;

const buttonTemplate = `
<svg viewBox="-2.2 -2.2 4.4 4.4" width="54" height="63">
  <circle cx="0" cy="0" r="2" fill="none" stroke="#000" stroke-width="0.1" />
  <circle cx="0" cy="0" r="0" fill="none" fill="#FF0C00" class="button" />
  <text class="value" dominant-baseline="middle" text-anchor="middle" fill="#000" x="0" y="0">0.00</text>
  <text class="index" alignment-baseline="hanging" dominant-baseline="hanging" text-anchor="start" fill="#000" x="-2.1" y="-2.6">0</text>
</svg>
`;

function addGamepad(gamepad) {
  console.log("add:", gamepad.index);
  const elem = document.createElement("div");
  elem.innerHTML = controllerTemplate;

  const axesElem = elem.querySelector(".axes");
  const buttonsElem = elem.querySelector(".buttons");

  const axes = [];
  for (let ndx = 0; ndx < gamepad.axes.length; ndx += 2) {
    const div = document.createElement("div");
    div.innerHTML = axisTemplate;
    axesElem.appendChild(div);
    axes.push({
      axis: div.querySelector(".axis"),
      value: div.querySelector("text")
    });
  }

  const buttons = [];
  for (let ndx = 0; ndx < gamepad.buttons.length; ++ndx) {
    const div = document.createElement("div");
    div.innerHTML = buttonTemplate;
    buttonsElem.appendChild(div);
    div.querySelector(".index").textContent = ndx;
    buttons.push({
      circle: div.querySelector(".button"),
      value: div.querySelector(".value")
    });
  }

  gamepadsByIndex[gamepad.index] = {
    gamepad,
    elem,
    axes,
    buttons,
    index: elem.querySelector(".index"),
    id: elem.querySelector(".id"),

    mapping: elem.querySelector(".mapping"),

    connected: elem.querySelector(".connected"),

    timestamp: elem.querySelector(".timestamp"),

    pose: elem.querySelector(".pose"),
    hapticActuators: elem.querySelector(".hapticActuators"),
    hand: elem.querySelector(".hand"),
    displayId: elem.querySelector(".displayId"),
    vibrationActuator: elem.querySelector(".vibrationActuator")
  };
  gamepadsElem.appendChild(elem);
}

function removeGamepad(gamepad) {
  const info = gamepadsByIndex[gamepad.index];
  if (info) {
    delete gamepadsByIndex[gamepad.index];
    info.elem.parentElement.removeChild(info.elem);
  }
}

function addGamepadIfNew(gamepad) {
  const info = gamepadsByIndex[gamepad.index];
  if (!info) {
    addGamepad(gamepad);
  } else {
    info.gamepad = gamepad;
  }
}

function handleConnect(e) {
  console.log("connect");
  addGamepadIfNew(e.gamepad);
}

function handleDisconnect(e) {
  console.log("disconnect");
  removeGamepad(e.gamepad);
}

const t = String.fromCharCode(0x26aa);
const f = String.fromCharCode(0x26ab);
function onOff(v) {
  return v ? t : f;
}

const keys = [
  "index",
  "id",
  "connected",
  "mapping",
  "timestamp",
  "pose",
  "hapticActuators",
  "hand",
  "displayId",
  "vibrationActuator"
];

function processController(info) {
  const { elem, gamepad, axes, buttons } = info;
  const lines = [`gamepad  : ${gamepad.index}`];
  for (const key of keys) {
    info[key].textContent = gamepad[key] ?? "n/a";
  }
  axes.forEach(({ axis, value }, ndx) => {
    const off = ndx * 2;
    axis.setAttributeNS(null, "cx", gamepad.axes[off] * fudgeFactor);
    axis.setAttributeNS(null, "cy", gamepad.axes[off + 1] * fudgeFactor);
    value.textContent = `${gamepad.axes[off]
      .toFixed(2)
      .padStart(5)},${gamepad.axes[off + 1].toFixed(2).padStart(5)}`;
  });
  buttons.forEach(({ circle, value }, ndx) => {
    const button = gamepad.buttons[ndx];
    circle.setAttributeNS(null, "r", button.value * fudgeFactor);
    circle.setAttributeNS(null, "fill", button.pressed ? "red" : "gray");
    value.textContent = `${button.value.toFixed(2)}`;
  });

  //  lines.push(`axes     : [${gamepad.axes.map((v, ndx) => `${ndx}: ${v.toFixed(2).padStart(5)}`).join(', ')} ]`);
  //  lines.push(`buttons  : [${gamepad.buttons.map((v, ndx) => `${ndx}: ${onOff(v.pressed)} ${v.value.toFixed(2)}`).join(', ')} ]`);
  // elem.textContent = lines.join('\n');
}

function addNewPads() {
  const gamepads = navigator.getGamepads();
  for (let i = 0; i < gamepads.length; i++) {
    const gamepad = gamepads[i];
    if (gamepad) {
      addGamepadIfNew(gamepad);
    }
  }
}

window.addEventListener("gamepadconnected", handleConnect);
window.addEventListener("gamepaddisconnected", handleDisconnect);

function process() {
  addNewPads(); // some browsers add by polling, others by event

  Object.values(gamepadsByIndex).forEach(processController);
  requestAnimationFrame(process);
}
requestAnimationFrame(process);