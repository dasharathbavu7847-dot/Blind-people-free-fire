
"use strict";

const game = {
  player: "Soldier",
  health: 100,
  ammo: 30,
  reserveAmmo: 90,
  magazine: 30,
  enemies: 3,
  gold: 500,
  diamonds: 20,
  medkits: 2,
  kills: 0,
  running: false,
  paused: false,
  direction: 0,
  distance: 10,
  difficulty: "Normal",
  voice: true,
  sounds: true,
  currentGun: "Basic Rifle",
  ownedGuns: ["Basic Rifle"],
  gunIndex: 0,
  reloadTimer: null
};

const soundFiles = {
  click: "button click.mp3",
  enter: "enter games successfully.mp3",
  fire: "AK-47 Short Burst .mp3",
  rifle: "Rifle Shot .mp3",
  reload: "Rifle Reloading.mp3",
  pistol: "pistol gun .mp3",
  shotgun: "shotgun.mp3",
  sniper: "M24 Sniper Rifle.mp3",
  grenade: "Grenade .mp3",
  enemy: "Enemy Group Eliminated.mp3",
  medkit: "item drop successfully.mp3",
  purchase: "purchase successfully.mp3",
  victory: "victory achieve.mp3",
  empty: "bomb not usable.mp3",
  magazine: "magazine.mp3"
};

const audio = {};

Object.entries(soundFiles).forEach(([key, file]) => {
  const a = new Audio("sounds/" + encodeURIComponent(file));
  a.preload = "auto";
  audio[key] = a;
});

function playSound(name) {
  if (!game.sounds || !audio[name]) return;

  const a = audio[name];

  try {
    a.pause();
    a.currentTime = 0;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
  } catch (_) {}
}

function announce(message, speak = true) {
  const status = document.getElementById("status");
  if (status) status.textContent = message;

  if (speak && game.voice && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "en-IN";
    utterance.rate = 1;

    window.speechSynthesis.speak(utterance);
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function show(id) {
  document.querySelectorAll("main > section").forEach(s => {
    s.hidden = true;
  });

  const target = document.getElementById(id);
  if (!target) return;

  target.hidden = false;

  const heading = target.querySelector("h2");

  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus();
  }

  announce(heading ? heading.textContent : id);
}

function backMenu() {
  show("menu");
}

function enterGame() {
  const input = document.getElementById("playerName");

  game.player = input && input.value.trim()
    ? input.value.trim()
    : "Soldier";

  setText("welcome", "Welcome " + game.player);

  updateProfile();
  playSound("enter");
  show("menu");
}

function startOffline() {
  game.health = 100;
  game.ammo = game.magazine;
  game.reserveAmmo = 90;
  game.kills = 0;
  game.running = true;
  game.paused = false;

  game.difficulty =
    document.getElementById("difficulty")?.value || "Normal";

  game.enemies =
    Number(document.getElementById("enemyCount")?.value || 3);

  game.distance = 10;

  updateBattle();
  show("battle");

  announce("Offline battle started. " + game.enemies + " enemies detected.");
}

function connectServer() {
  const address = document.getElementById("server")?.value.trim();

  setText(
    "serverStatus",
    address ? "Server backend is not configured yet." : "Please enter server address."
  );

  announce(address ? "Online server backend is not configured" : "Server address required");
}

function createRoom() {
  const name = document.getElementById("roomName")?.value.trim();

  if (!name) {
    setText("roomStatus", "Please enter room name.");
    announce("Room name required");
    return;
  }

  const cap = document.getElementById("capacity")?.value || "30";
  const type = document.getElementById("roomType")?.value || "public";

  setText(
    "roomStatus",
    name + " selected. Capacity: " + cap +
    ". Type: " + type + ". Multiplayer server required."
  );

  announce("Room settings selected. Server required");
}

function joinRoom() {
  const code = document.getElementById("roomCode")?.value.trim();

  if (!code) {
    setText("roomStatus", "Please enter room code.");
    announce("Room code required");
    return;
  }

  setText("roomStatus", "Room joining requires a configured multiplayer server.");
  announce("Multiplayer server required to join room");
}

function quickMatch() {
  setText("roomStatus", "Quick Match requires a configured multiplayer server.");
  announce("Quick match server not configured");
}

function sendFriendRequest() {
  const id = document.getElementById("friendId")?.value.trim();

  setText(
    "friendStatus",
    id ? "Friend request requires the multiplayer server." : "Please enter Friend Player ID."
  );

  announce(id ? "Friend request server required" : "Friend ID required");
}

function showFriends() {
  setText("friendStatus", "Friends list requires the multiplayer server.");
  announce("Friends list requires server");
}

function inviteFriend() {
  setText("friendStatus", "Inviting friends requires the multiplayer server.");
  announce("Friend invite requires server");
}

function checkBattle() {
  if (!game.running) {
    announce("Start offline battle first");
    return false;
  }

  if (game.paused) {
    announce("Battle is paused");
    return false;
  }

  return true;
}

function turnLeft() {
  if (!checkBattle()) return;

  game.direction = (game.direction + 270) % 360;
  announce("Turned left. Direction " + game.direction);
}

function turnRight() {
  if (!checkBattle()) return;

  game.direction = (game.direction + 90) % 360;
  announce("Turned right. Direction " + game.direction);
}

function moveForward() {
  if (!checkBattle()) return;

  game.distance = Math.max(0, game.distance - 2);
  announce("Moving forward. Distance " + game.distance + " meters");
}

function moveBack() {
  if (!checkBattle()) return;

  game.distance += 2;
  announce("Moving backward. Distance " + game.distance + " meters");
}

function run() {
  if (!checkBattle()) return;

  game.distance = Math.max(0, game.distance - 5);
  announce("Running forward");
}

function jump() {
  if (!checkBattle()) return;
  announce("Jump");
}

function fire() {
  if (!checkBattle()) return;

  if (game.ammo <= 0) {
    playSound("empty");
    announce("Magazine empty. Reload");
    return;
  }

  game.ammo--;

  const gunSound = {
    "Basic Rifle": "rifle",
    "AK-47": "fire",
    "M16": "rifle",
    "Shotgun": "shotgun",
    "Sniper Rifle": "sniper"
  }[game.currentGun] || "fire";

  playSound(gunSound);

  if (game.enemies > 0) {
    game.enemies--;
    game.kills++;

    if (game.enemies === 0) {
      playSound("victory");
      announce("All enemies eliminated. Victory");
    } else {
      announce("Enemy hit. " + game.enemies + " enemies remaining");
    }
  } else {
    announce("Gun fired. No enemies remaining");
  }

  updateBattle();
}

function reload() {
  if (!checkBattle()) return;

  if (game.reloadTimer) {
    announce("Reload already in progress");
    return;
  }

  if (game.ammo >= game.magazine) {
    announce("Magazine already full");
    return;
  }

  if (game.reserveAmmo <= 0) {
    announce("No reserve ammunition");
    playSound("empty");
    return;
  }

  announce("Reloading magazine");
  playSound("reload");

  game.reloadTimer = window.setTimeout(() => {
    const amount = Math.min(
      game.magazine - game.ammo,
      game.reserveAmmo
    );

    game.ammo += amount;
    game.reserveAmmo -= amount;
    game.reloadTimer = null;

    updateBattle();
    announce("Reload complete. Ammo " + game.ammo);
  }, 1400);
}

function detectEnemy() {
  if (!checkBattle()) return;

  if (game.enemies <= 0) {
    announce("No enemies detected");
    return;
  }

  playSound("enemy");

  const unit = document.getElementById("distance")?.value || "Meters";

  announce(
    game.enemies + " enemies detected. Approximate distance " +
    game.distance + " " + unit
  );
}

function medkit() {
  if (!checkBattle()) return;

  if (game.medkits <= 0) {
    announce("No medkits available");
    return;
  }

  if (game.health >= 100) {
    announce("Health already full");
    return;
  }

  game.medkits--;
  game.health = Math.min(100, game.health + 50);

  playSound("medkit");
  updateBattle();

  announce("Medkit used. Health " + game.health);
}

function changeGun() {
  if (!checkBattle()) return;

  if (game.ownedGuns.length < 2) {
    announce("No other gun owned yet");
    return;
  }

  game.gunIndex = (game.gunIndex + 1) % game.ownedGuns.length;
  game.currentGun = game.ownedGuns[game.gunIndex];

  updateBattle();
  announce("Weapon changed to " + game.currentGun);
}

function pauseBattle() {
  if (!game.running) {
    announce("Battle not running");
    return;
  }

  game.paused = !game.paused;
  announce(game.paused ? "Battle paused" : "Battle resumed");
}

function exitBattle() {
  if (game.reloadTimer) {
    clearTimeout(game.reloadTimer);
    game.reloadTimer = null;
  }

  game.running = false;
  game.paused = false;

  announce("Battle ended");
  show("menu");
}

function updateBattle() {
  setText("health", "Health: " + game.health);
  setText("ammo", "Ammo: " + game.ammo + " / " + game.reserveAmmo);
  setText("enemies", "Enemies: " + game.enemies);
  setText("gold", "Gold: " + game.gold);
  setText("diamondDisplay", "Diamonds: " + game.diamonds);
  setText("currentGun", "Current Gun: " + game.currentGun);

  updateProfile();
  updateShopMoney();
}

function updateProfile() {
  setText("profileName", "Player Name: " + game.player);
  setText("profileGold", "Gold: " + game.gold);
  setText("profileDiamonds", "Diamonds: " + game.diamonds);
}

function updateShopMoney() {
  setText("shopMoney", "Gold: " + game.gold + " | Diamonds: " + game.diamonds);
}

function shopMessage(message, success = false) {
  setText("shopStatus", message);

  if (success) playSound("purchase");

  announce(message);
  updateBattle();
}

function equipBasicGun() {
  game.currentGun = "Basic Rifle";
  game.gunIndex = game.ownedGuns.indexOf(game.currentGun);

  if (game.gunIndex < 0) {
    game.ownedGuns.unshift(game.currentGun);
    game.gunIndex = 0;
  }

  shopMessage("Basic Rifle equipped", true);
}

function buyGun(name, price) {
  if (game.ownedGuns.includes(name)) {
    shopMessage(name + " already owned");
    return;
  }

  if (game.diamonds < price) {
    shopMessage("Not enough diamonds to buy " + name);
    return;
  }

  game.diamonds -= price;
  game.ownedGuns.push(name);
  game.currentGun = name;
  game.gunIndex = game.ownedGuns.length - 1;

  shopMessage("Purchase successful. " + name + " purchased and equipped", true);
}

function buyAmmo() {
  if (game.gold < 100) {
    shopMessage("Not enough gold");
    return;
  }

  game.gold -= 100;
  game.reserveAmmo += 30;

  shopMessage("Purchase successful. 30 ammunition added", true);
}

function buyMedkit() {
  if (game.gold < 100) {
    shopMessage("Not enough gold");
    return;
  }

  game.gold -= 100;
  game.medkits++;

  shopMessage("Purchase successful. Medkit added", true);
}

function saveSettings() {
  game.voice = document.getElementById("voice")?.value === "On";
  game.sounds = document.getElementById("sounds")?.value === "On";

  setText("settingsStatus", "Settings saved successfully");

  if (game.sounds) playSound("click");

  announce("Settings saved", game.voice);
}

let touchStart = null;

document.addEventListener("touchstart", e => {
  const battle = document.getElementById("battle");

  if (!battle || battle.hidden) return;

  if (e.touches.length === 1) {
    touchStart = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      t: Date.now()
    };
  } else if (e.touches.length === 2) {
    touchStart = {
      two: true,
      y: e.touches[0].clientY
    };
  }
}, { passive: true });

document.addEventListener("touchend", e => {
  if (!touchStart) return;

  const start = touchStart;
  touchStart = null;

  if (start.two && e.changedTouches.length) {
    const dy = e.changedTouches[0].clientY - start.y;

    if (dy < -55) medkit();

    return;
  }

  if (start.two || !e.changedTouches.length) return;

  const dx = e.changedTouches[0].clientX - start.x;
  const dy = e.changedTouches[0].clientY - start.y;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < 55) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    changeGun();
  } else if (dy < 0) {
    reload();
  } else {
    detectEnemy();
  }
}, { passive: true });

document.addEventListener("click", e => {
  const button = e.target.closest && e.target.closest("button");

  if (button && game.sounds) {
    playSound("click");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  updateBattle();
  updateProfile();
  updateShopMoney();

  const soundToggle = document.getElementById("sounds");

  if (soundToggle) {
    soundToggle.value = "On";
  }

  console.log("Battle Frontline JavaScript loaded");
});
