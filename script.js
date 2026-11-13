
"use strict";

/* =========================================
   BLIND PEOPLE FREE FIRE
   Frontend Developer: Dashrath Babu
   Junior Developer: Umakant Das
========================================= */

const $ = id => document.getElementById(id);

const GAME = {
  diamonds: 1000,
  health: 100,
  maxHealth: 100,
  ammo: 12,
  reserveAmmo: 120,
  weapon: "Pistol",
  ownedWeapons: ["Pistol"],
  missionStarted: false,
  bossActive: false,
  gameOver: false,
  playerX: 0,
  playerY: 0,
  enemies: [],
  kills: 0,
  level: 1,
  aiTimer: null,
  bossTimer: null
};

/* ---------- WEAPONS ---------- */

const WEAPONS = {
  Pistol: {
    damage: 35,
    magazine: 12,
    price: 0,
    reserve: 60,
    fireSound: "pistol gun .mp3",
    reloadSound: "pistol gun reload.mp3"
  },

  "AK-47": {
    damage: 30,
    magazine: 30,
    price: 500,
    reserve: 90,
    fireSound: "AK-47 Short Burst .mp3",
    reloadSound: "AK-47 Reload.mp3"
  },

  "Sniper Rifle": {
    damage: 100,
    magazine: 5,
    price: 600,
    reserve: 20,
    fireSound: "M24 Sniper Rifle.mp3",
    reloadSound: "Rifle Reloading.mp3"
  },

  Shotgun: {
    damage: 75,
    magazine: 6,
    price: 400,
    reserve: 30,
    fireSound: "shotgun.mp3",
    reloadSound: "gun reload.mp3"
  },

  "Heavy Gun": {
    damage: 25,
    magazine: 50,
    price: 700,
    reserve: 150,
    fireSound: "Heavy Machine Gun Fire..mp3",
    reloadSound: "rifle reload.mp3"
  },

  "Grenade Launcher": {
    damage: 100,
    magazine: 1,
    price: 800,
    reserve: 5,
    fireSound: "Grenade Launcher.mp3",
    reloadSound: "Rifle Reloading.mp3"
  }
};

/* ---------- SOUND SYSTEM ---------- */

const SOUND_FOLDER = "sounds/";

const SOUND_FILES = {
  click: "button click.mp3",
  account: "account create successfully.mp3",
  enter: "enter games successfully.mp3",
  purchase: "purchase successfully.mp3",
  enemy: "Enemy Group Eliminated.mp3",
  victory: "victory achieve.mp3",
  reward: "item drop successfully.mp3",
  grenade: "Grenade .mp3"
};

function playSound(file) {
  if (!file) return;

  try {
    const audio = new Audio(
      SOUND_FOLDER + encodeURIComponent(file)
    );

    audio.volume = 0.85;

    audio.play().catch(() => {
      // Sound unavailable होने पर भी गेम चलता रहेगा।
    });
  } catch (error) {
    console.warn("Sound error:", error);
  }
}

/* ---------- VOICE ANNOUNCEMENT ---------- */

function speak(message) {
  if (!("speechSynthesis" in window)) return;

  try {
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(message);
    speech.lang = "hi-IN";
    speech.rate = 0.9;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
  } catch (error) {
    console.warn("Voice error:", error);
  }
}

function announce(message, options = {}) {
  const status = $("status");

  if (status) status.textContent = message;

  const log = $("gameLog");
  if (log) log.textContent = message;

  if (options.sound) playSound(options.sound);

  if (options.speak !== false) speak(message);
}

/* ---------- POPUP ---------- */

function showPopup(message, sound = null) {
  const popup = $("gamePopup");
  const popupMessage = $("popupMessage");

  if (popupMessage) popupMessage.textContent = message;
  if (popup) popup.hidden = false;

  if (sound) playSound(sound);

  speak(message);
}

function closePopup() {
  const popup = $("gamePopup");
  if (popup) popup.hidden = true;
}

/* ---------- HUD ---------- */

function updateHUD() {
  const values = {
    diamonds: GAME.diamonds,
    health: GAME.health,
    ammo: GAME.ammo,
    reserveAmmo: GAME.reserveAmmo,
    weaponName: GAME.weapon,
    enemyCount: GAME.enemies.length,
    level: GAME.level
  };

  for (const [id, value] of Object.entries(values)) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  const position = $("positionStatus");

  if (position) {
    position.textContent =
      "आपकी स्थिति: " +
      GAME.playerX + ", " + GAME.playerY;
  }
}

/* ---------- ACCOUNT ---------- */

function createAccount() {
  const input = $("playerName");
  const name = input ? input.value.trim() : "";

  if (!name) {
    showPopup("कृपया पहले अपना खिलाड़ी नाम लिखें।");
    return;
  }

  try {
    localStorage.setItem("blindFFPlayerName", name);
  } catch (error) {
    console.warn("Storage error:", error);
  }

  if ($("playerDisplay")) {
    $("playerDisplay").textContent = name;
  }

  if ($("accountStatus")) {
    $("accountStatus").textContent =
      "अकाउंट सफलतापूर्वक बन गया।";
  }

  announce(
    "Account Create Successfully. स्वागत है " + name,
    { sound: SOUND_FILES.account }
  );
}

function loadAccount() {
  try {
    const name = localStorage.getItem("blindFFPlayerName");

    if (name) {
      if ($("playerDisplay")) {
        $("playerDisplay").textContent = name;
      }

      if ($("playerName")) {
        $("playerName").value = name;
      }

      if ($("accountStatus")) {
        $("accountStatus").textContent =
          "आपका पिछला ऑफलाइन अकाउंट लोड हो गया।";
      }
    }
  } catch (error) {
    console.warn("Account loading error:", error);
  }
}

/* ---------- ENEMY SYSTEM ---------- */

let nextEnemyId = 1;

function createEnemy(type = "soldier", x = 3, y = 2) {
  const boss = type === "boss";

  return {
    id: nextEnemyId++,
    type,
    x,
    y,
    health: boss ? 300 : 100,
    damage: boss ? 20 : 8
  };
}

function spawnSquad() {
  GAME.enemies = [
    createEnemy("soldier", 3, 2),
    createEnemy("soldier", -3, 1),
    createEnemy("soldier", 2, -4)
  ];

  updateHUD();
}

function distanceBetween(x1, y1, x2, y2) {
  return Math.sqrt(
    Math.pow(x2 - x1, 2) +
    Math.pow(y2 - y1, 2)
  );
}

function getDirection(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "पूर्व" : "पश्चिम";
  }

  if (Math.abs(dy) > 0) {
    return dy > 0 ? "दक्षिण" : "उत्तर";
  }

  return "सामने";
}

function scanEnemy() {
  if (!GAME.missionStarted || GAME.gameOver) {
    announce("पहले मिशन शुरू करें।");
    return;
  }

  if (GAME.enemies.length === 0) {
    announce("अभी कोई दुश्मन आसपास नहीं है।");
    return;
  }

  let nearest = null;
  let nearestDistance = Infinity;

  for (const enemy of GAME.enemies) {
    const distance = distanceBetween(
      GAME.playerX,
      GAME.playerY,
      enemy.x,
      enemy.y
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = enemy;
    }
  }

  const direction = getDirection(
    nearest.x - GAME.playerX,
    nearest.y - GAME.playerY
  );

  const distanceText =
    nearestDistance < 2 ? "बहुत पास" :
    nearestDistance < 5 ? "पास" : "दूर";

  const message =
    (nearest.type === "boss" ? "Commander Boss" : "दुश्मन") +
    " " + direction +
    " दिशा में है। दूरी " + distanceText +
    "। दुश्मन की हेल्थ " + nearest.health;

  if ($("directionStatus")) {
    $("directionStatus").textContent = message;
  }

  announce(message);
}

/* ---------- MOVEMENT ---------- */

function movePlayer(dx, dy, direction) {
  if (!GAME.missionStarted || GAME.gameOver) {
    announce("पहले मिशन शुरू करें।");
    return;
  }

  GAME.playerX += dx;
  GAME.playerY += dy;

  updateHUD();

  announce(
    direction + " चले। आपकी स्थिति " +
    GAME.playerX + ", " + GAME.playerY
  );
}

/* ---------- FIRE WEAPON ---------- */

function fireWeapon() {
  if (!GAME.missionStarted || GAME.gameOver) {
    announce("पहले मिशन शुरू करें।");
    return;
  }

  if (GAME.ammo <= 0) {
    announce("Magazine खाली है। Reload करें।");
    return;
  }

  if (GAME.enemies.length === 0) {
    announce("कोई दुश्मन निशाने पर नहीं है।");
    return;
  }

  let target = null;
  let bestDistance = Infinity;

  for (const enemy of GAME.enemies) {
    const distance = distanceBetween(
      GAME.playerX,
      GAME.playerY,
      enemy.x,
      enemy.y
    );

    if (distance < bestDistance) {
      bestDistance = distance;
      target = enemy;
    }
  }

  const weaponData = WEAPONS[GAME.weapon];
  const maxRange = GAME.weapon === "Sniper Rifle" ? 15 : 5;

  if (!target || bestDistance > maxRange) {
    announce("दुश्मन गोली की दूरी से बाहर है। पहले आगे बढ़ें।");
    return;
  }

  GAME.ammo--;

  target.health -= weaponData.damage;

  playSound(weaponData.fireSound);

  updateHUD();

  if (target.health <= 0) {
    eliminateEnemy(target);
  } else {
    announce(
      "गोली लगी। दुश्मन की बची हुई हेल्थ " +
      target.health
    );
  }
}

/* ---------- ELIMINATE ENEMY ---------- */

function eliminateEnemy(enemy) {
  GAME.enemies = GAME.enemies.filter(
    item => item.id !== enemy.id
  );

  GAME.kills++;
  GAME.diamonds += enemy.type === "boss" ? 200 : 50;
  GAME.reserveAmmo += 10;

  updateHUD();

  if ($("achievementStatus")) {
    $("achievementStatus").textContent =
      GAME.kills + " दुश्मन खत्म किए गए।";
  }

  playSound(SOUND_FILES.enemy);
  playSound(SOUND_FILES.reward);

  if (enemy.type === "boss") {
    finishMission();
    return;
  }

  announce(
    "Enemy Group Eliminated. दुश्मन खत्म हुआ। " +
    "50 Diamonds और 10 गोलियाँ मिलीं।"
  );

  if (GAME.enemies.length === 0) {
    setTimeout(() => {
      if (
        GAME.missionStarted &&
        !GAME.gameOver &&
        !GAME.bossActive
      ) {
        spawnSquad();
        announce("नया Enemy Squad आ गया है।");
      }
    }, 2500);
  }
}

/* ---------- RELOAD ---------- */

function reloadWeapon() {
  if (!GAME.missionStarted || GAME.gameOver) {
    announce("पहले मिशन शुरू करें।");
    return;
  }

  const weaponData = WEAPONS[GAME.weapon];
  const magazine = weaponData.magazine;

  if (GAME.ammo >= magazine) {
    announce("Magazine पहले से भरी हुई है।");
    return;
  }

  if (GAME.reserveAmmo <= 0) {
    announce("Reserve Ammo खत्म हो गया है।");
    return;
  }

  const needed = magazine - GAME.ammo;
  const amount = Math.min(needed, GAME.reserveAmmo);

  GAME.ammo += amount;
  GAME.reserveAmmo -= amount;

  updateHUD();
  playSound(weaponData.reloadSound);

  announce(
    "Reloading Complete. अब आपके पास " +
    GAME.ammo + " गोलियाँ हैं।"
  );
}

/* ---------- MEDICINE ---------- */

function useMedicine() {
  if (!GAME.missionStarted || GAME.gameOver) {
    announce("पहले मिशन शुरू करें।");
    return;
  }

  if (GAME.health >= GAME.maxHealth) {
    announce("आपकी Health पहले से पूरी है।");
    return;
  }

  GAME.health = Math.min(
    GAME.maxHealth,
    GAME.health + 40
  );

  updateHUD();

  announce("Medicine इस्तेमाल हुई। Health बढ़ गई।");
}

/* ---------- GRENADE ---------- */

let grenades = 3;

function throwGrenade() {
  if (!GAME.missionStarted || GAME.gameOver) {
    announce("पहले मिशन शुरू करें।");
    return;
  }

  if (grenades <= 0) {
    announce("आपके पास Grenade नहीं बचा है।");
    return;
  }

  if (GAME.enemies.length === 0) {
    announce("Grenade फेंकने के लिए दुश्मन नहीं हैं।");
    return;
  }

  grenades--;

  playSound(SOUND_FILES.grenade);

  const affected = [...GAME.enemies];

  for (const enemy of affected) {
    enemy.health -= 100;

    if (enemy.health <= 0) {
      eliminateEnemy(enemy);
    }
  }

  announce(
    "Grenade फेंका गया। बचे हुए Grenade " + grenades
  );

  updateHUD();
}

/* ---------- SWITCH WEAPON ---------- */

function switchWeapon() {
  const weapons = GAME.ownedWeapons;

  if (weapons.length <= 1) {
    announce(
      "आपके पास अभी केवल Pistol है। Gun Store से और हथियार खरीदें।"
    );
    return;
  }

  const currentIndex = weapons.indexOf(GAME.weapon);
  const nextIndex = (currentIndex + 1) % weapons.length;

  GAME.weapon = weapons[nextIndex];

  const data = WEAPONS[GAME.weapon];

  GAME.ammo = data.magazine;

  updateHUD();

  announce(GAME.weapon + " तैयार है।");
}

/* ---------- GUN STORE ---------- */

function openStore() {
  const store = $("store");
  const items = $("storeItems");

  if (!store || !items) return;

  store.hidden = false;
  items.innerHTML = "";

  for (const [name, data] of Object.entries(WEAPONS)) {
    if (name === "Pistol") continue;

    const button = document.createElement("button");

    button.type = "button";
    button.textContent =
      name + " - " + data.price + " Diamonds";

    button.addEventListener("click", () => {
      buyWeapon(name);
    });

    items.appendChild(button);
  }

  announce("Gun Store खुल गया है।");
}

function buyWeapon(name) {
  const data = WEAPONS[name];

  if (!data) return;

  if (GAME.ownedWeapons.includes(name)) {
    announce("यह हथियार आपके पास पहले से है।");
    return;
  }

  if (GAME.diamonds < data.price) {
    showPopup(
      "अपर्याप्त Diamonds! खरीदारी अधूरी है। आपको " +
      data.price + " Diamonds चाहिए। आपके पास " +
      GAME.diamonds + " हैं।"
    );
    return;
  }

  GAME.diamonds -= data.price;
  GAME.ownedWeapons.push(name);
  GAME.weapon = name;
  GAME.ammo = data.magazine;
  GAME.reserveAmmo += data.reserve;

  updateHUD();

  announce(
    name + " खरीदा गया। Purchase Successfully।",
    { sound: SOUND_FILES.purchase }
  );
}

/* ---------- ENEMY AI ---------- */

function enemyAI() {
  if (!GAME.missionStarted || GAME.gameOver) return;

  for (const enemy of GAME.enemies) {
    const dx = GAME.playerX - enemy.x;
    const dy = GAME.playerY - enemy.y;

    const distance = distanceBetween(
      GAME.playerX,
      GAME.playerY,
      enemy.x,
      enemy.y
    );

    if (distance > 1.2) {
      if (Math.abs(dx) >= Math.abs(dy)) {
        enemy.x += Math.sign(dx);
      } else {
        enemy.y += Math.sign(dy);
      }
    } else {
      GAME.health -= enemy.damage;

      if (GAME.health < 0) GAME.health = 0;

      updateHUD();

      announce(
        (enemy.type === "boss" ? "Commander Boss" : "दुश्मन") +
        " ने हमला किया। आपकी Health " +
        GAME.health
      );

      if (GAME.health <= 0) {
        endGame();
        return;
      }
    }
  }
}

/* ---------- BOSS ---------- */

function summonBoss() {
  if (!GAME.missionStarted || GAME.gameOver) return;

  GAME.bossActive = true;
  GAME.enemies = [
    createEnemy("boss", 5, 5)
  ];

  updateHUD();

  announce(
    "Commander Boss आ गया है। सावधान सैनिक!"
  );
}

/* ---------- START MISSION ---------- */

function startMission() {
  if (GAME.missionStarted && !GAME.gameOver) {
    announce("Mission पहले से शुरू है।");
    return;
  }

  clearInterval(GAME.aiTimer);
  clearTimeout(GAME.bossTimer);

  GAME.health = 100;
  GAME.playerX = 0;
  GAME.playerY = 0;
  GAME.missionStarted = true;
  GAME.bossActive = false;
  GAME.gameOver = false;
  GAME.kills = 0;
  grenades = 3;

  spawnSquad();
  updateHUD();

  playSound(SOUND_FILES.enter);

  announce(
    "Chapter " + GAME.level +
    " शुरू हो गया है। Enemy Squad सामने है।"
  );

  GAME.aiTimer = setInterval(enemyAI, 2500);
  GAME.bossTimer = setTimeout(summonBoss, 180000);
}

/* ---------- VICTORY ---------- */

function finishMission() {
  clearInterval(GAME.aiTimer);
  clearTimeout(GAME.bossTimer);

  GAME.missionStarted = false;
  GAME.bossActive = false;

  GAME.diamonds += 200;
  GAME.level++;

  updateHUD();

  playSound(SOUND_FILES.victory);

  showPopup(
    "VICTORY! Commander Boss हार गया। 200 अतिरिक्त Diamonds मिले। अगला Level " +
    GAME.level + " अनलॉक हुआ।"
  );
}

/* ---------- GAME OVER ---------- */

function endGame() {
  clearInterval(GAME.aiTimer);
  clearTimeout(GAME.bossTimer);

  GAME.missionStarted = false;
  GAME.gameOver = true;

  updateHUD();

  showPopup(
    "Game Over! आपकी Health खत्म हो गई। फिर से Start Mission दबाएँ।"
  );
}

/* ---------- HELP ---------- */

function openHelp() {
  if ($("help")) $("help").hidden = false;
  announce("Help और Controls खुल गए हैं।");
}

/* ---------- CONNECT BUTTONS ---------- */

function connectButton(id, callback) {
  const button = $(id);

  if (button) {
    button.addEventListener("click", callback);
  }
}

connectButton("createAccountBtn", createAccount);
connectButton("startBtn", startMission);
connectButton("scanBtn", scanEnemy);
connectButton("fireBtn", fireWeapon);
connectButton("reloadBtn", reloadWeapon);
connectButton("medBtn", useMedicine);
connectButton("grenadeBtn", throwGrenade);
connectButton("switchWeaponBtn", switchWeapon);
connectButton("storeBtn", openStore);
connectButton("helpBtn", openHelp);

connectButton("closeStoreBtn", () => {
  if ($("store")) $("store").hidden = true;
  announce("Gun Store बंद हो गया।");
});

connectButton("closeHelpBtn", () => {
  if ($("help")) $("help").hidden = true;
  announce("Help बंद हो गया।");
});

connectButton("closePopupBtn", closePopup);

connectButton("moveForward", () => {
  movePlayer(0, -1, "आगे");
});

connectButton("moveBackward", () => {
  movePlayer(0, 1, "पीछे");
});

connectButton("moveLeft", () => {
  movePlayer(-1, 0, "बाएँ");
});

connectButton("moveRight", () => {
  movePlayer(1, 0, "दाएँ");
});

/* ---------- BUTTON SOUND ---------- */

document.addEventListener("click", event => {
  if (event.target.closest("button")) {
    playSound(SOUND_FILES.click);
  }
});

/* ---------- KEYBOARD CONTROLS ---------- */

document.addEventListener("keydown", event => {
  if (event.repeat) return;

  switch (event.key.toLowerCase()) {
    case "w":
      movePlayer(0, -1, "आगे");
      break;

    case "s":
      movePlayer(0, 1, "पीछे");
      break;

    case "a":
      movePlayer(-1, 0, "बाएँ");
      break;

    case "d":
      movePlayer(1, 0, "दाएँ");
      break;

    case "f":
      fireWeapon();
      break;

    case "r":
      reloadWeapon();
      break;

    case "e":
      scanEnemy();
      break;
  }
});

/* ---------- INITIALIZE ---------- */

loadAccount();
updateHUD();

announce(
  "Blind People Free Fire तैयार है। Pistol आपका शुरुआती हथियार है। Start Mission दबाएँ।",
  { speak: false }
);
