
/* ==========================================
   BLIND PEOPLE FREE FIRE
   Main JavaScript
   Developer: Dasharath Babu
   ========================================== */

"use strict";

// ==========================================
// GAME SETTINGS
// ==========================================

const CONFIG = {
  maxHealth: 100,
  magazineSize: 30,
  startingAmmo: 90,
  startingDiamonds: 1000,
  enemyHealth: 100,
  bossHealth: 300,
  fireDelay: 450,
  reloadTime: 1500
};

// ==========================================
// ELEMENTS
// ==========================================

const $ = (id) => document.getElementById(id);

const screens = {
  welcome: $("welcomeScreen"),
  account: $("accountScreen"),
  character: $("characterScreen"),
  game: $("gameScreen")
};

const elements = {
  health: $("healthValue"),
  ammo: $("ammoValue"),
  diamonds: $("diamondValue"),
  enemy: $("enemyValue"),
  status: $("gameStatus"),
  mute: $("muteBtn"),
  captcha: $("captchaQuestion"),
  captchaAnswer: $("captchaAnswer"),
  help: $("helpPanel")
};

// ==========================================
// PLAYER DATA
// ==========================================

const player = {
  name: "",
  username: "",
  hero: "",
  gender: "पुरुष",
  health: CONFIG.maxHealth,
  ammo: CONFIG.magazineSize,
  reserveAmmo: CONFIG.startingAmmo,
  diamonds: CONFIG.startingDiamonds,
  medkits: 3,
  kills: 0,
  position: 0
};

// ==========================================
// GAME DATA
// ==========================================

const game = {
  started: false,
  muted: false,
  enemyAlive: false,
  enemyHealth: CONFIG.enemyHealth,
  enemyDistance: 20,
  enemyDirection: "सामने",
  bossActive: false,
  bossHealth: CONFIG.bossHealth,
  mission: 1,
  firing: false,
  reloading: false,
  fireTimer: null,
  inventoryOpen: false
};

// ==========================================
// VOICE SYSTEM
// ==========================================

function speak(message) {
  if (!message) return;

  if (elements.status) {
    elements.status.textContent = message;
  }

  if (game.muted) return;

  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "hi-IN";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    speechSynthesis.speak(utterance);
  }
}

// ==========================================
// SCREEN MANAGEMENT
// ==========================================

function showScreen(name) {
  Object.entries(screens).forEach(([key, screen]) => {
    if (screen) screen.hidden = key !== name;
  });
}

// ==========================================
// ACCESSIBILITY
// ==========================================

function focusElement(element) {
  if (element) {
    element.focus();
  }
}

// ==========================================
// SOUND MUTE
// ==========================================

function toggleMute() {
  game.muted = !game.muted;

  elements.mute.textContent = game.muted
    ? "आवाज़ चालू करें"
    : "आवाज़ बंद करें";

  elements.mute.setAttribute(
    "aria-pressed",
    String(game.muted)
  );

  if (game.muted && "speechSynthesis" in window) {
    speechSynthesis.cancel();
  } else {
    speak("आवाज़ चालू कर दी गई है");
  }
}

// ==========================================
// CAPTCHA SYSTEM
// ==========================================

let captchaResult = 0;

function generateCaptcha() {
  const first = Math.floor(Math.random() * 10) + 1;
  const second = Math.floor(Math.random() * 10) + 1;

  captchaResult = first + second;

  elements.captcha.textContent =
    `${first} + ${second} कितना होता है?`;

  elements.captchaAnswer.value = "";

  speak(`${first} जोड़ ${second} कितना होता है?`);
}

// ==========================================
// WELCOME SCREEN
// ==========================================

$("welcomeContinue").addEventListener("click", () => {
  showScreen("account");
  generateCaptcha();
  focusElement($("playerName"));
});

// ==========================================
// ACCOUNT CREATION
// ==========================================

$("newCaptcha").addEventListener("click", generateCaptcha);

$("accountForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const name = $("playerName").value.trim();
  const username = $("username").value.trim();
  const answer = Number(elements.captchaAnswer.value);

  if (!name || !username) {
    speak("कृपया अपना नाम और Username भरें");
    return;
  }

  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    speak("Username सही नहीं है। दोबारा लिखें");
    return;
  }

  if (answer !== captchaResult) {
    speak("गलत जवाब। कृपया फिर कोशिश करें");
    generateCaptcha();
    return;
  }

  player.name = name;
  player.username = username;

  $("accountGreeting").textContent =
    `स्वागत है ${player.name}! अपना किरदार चुनें।`;

  showScreen("character");

  focusElement($("heroName"));

  speak(`खाता बन गया है। स्वागत है ${player.name}`);
});

// ==========================================
// CHARACTER SELECTION
// ==========================================

$("enterGameBtn").addEventListener("click", () => {
  const selectedGender = document.querySelector(
    'input[name="gender"]:checked'
  );

  player.gender = selectedGender
    ? selectedGender.value
    : "पुरुष";

  player.hero =
    $("heroName").value.trim() || player.name;

  $("playerSummary").textContent =
    `खिलाड़ी ${player.name}, Hero ${player.hero}, ` +
    `किरदार ${player.gender}`;

  showScreen("game");

  updateHUD();

  speak(
    `नमस्ते ${player.hero}! आपका Battlefield तैयार है। ` +
    "मिशन शुरू करने के लिए बटन दबाएँ।"
  );

  focusElement($("startBtn"));
});

// ==========================================
// HUD UPDATE
// ==========================================

function updateHUD() {
  elements.health.textContent = player.health;

  elements.ammo.textContent =
    `${player.ammo} / ${player.reserveAmmo}`;

  elements.diamonds.textContent = player.diamonds;

  if (game.bossActive) {
    elements.enemy.textContent =
      `बॉस ${game.bossHealth} Health`;
  } else if (game.enemyAlive) {
    elements.enemy.textContent =
      `दुश्मन ${game.enemyHealth} Health`;
  } else {
    elements.enemy.textContent = "कोई दुश्मन नहीं";
  }
}

// ==========================================
// MISSION START
// ==========================================

$("startBtn").addEventListener("click", startMission);

function startMission() {
  if (game.started) {
    speak("मिशन पहले से चल रहा है");
    return;
  }

  if (player.health <= 0) {
    speak("आपकी Health खत्म हो गई है। नया गेम शुरू करें");
    return;
  }

  game.started = true;
  game.enemyAlive = false;
  game.bossActive = false;

  speak(
    `मिशन नंबर ${game.mission} शुरू हो गया है। ` +
    "दुश्मन खोजने के लिए Scan बटन दबाएँ।"
  );

  updateHUD();
}

// ==========================================
// ENEMY DETECTION
// ==========================================

$("scanBtn").addEventListener("click", scanEnemy);

function scanEnemy() {
  if (!game.started) {
    speak("पहले मिशन शुरू करें");
    return;
  }

  if (game.bossActive) {
    speak(
      `बॉस आपकी ${game.enemyDirection} दिशा में है। ` +
      `दूरी ${game.enemyDistance} मीटर।`
    );
    return;
  }

  if (!game.enemyAlive) {
    spawnEnemy();
  }

  const direction = game.enemyDirection;
  const distance = game.enemyDistance;

  speak(
    `दुश्मन मिल गया! ` +
    `दुश्मन ${direction} दिशा में है। ` +
    `दूरी ${distance} मीटर। ` +
    `दुश्मन की Health ${game.enemyHealth} है।`
  );

  updateHUD();
}

function spawnEnemy() {
  game.enemyAlive = true;
  game.enemyHealth = CONFIG.enemyHealth;

  const directions = [
    "सामने",
    "पीछे",
    "बाएँ",
    "दाएँ"
  ];

  game.enemyDirection =
    directions[Math.floor(Math.random() * directions.length)];

  game.enemyDistance =
    Math.floor(Math.random() * 35) + 5;

  updateHUD();
}

// ==========================================
// PLAYER MOVEMENT
// ==========================================

function movePlayer(direction) {
  if (!game.started) {
    speak("पहले मिशन शुरू करें");
    return;
  }

  if (direction === "left") {
    player.position--;
    speak("आप बाईं ओर चले गए");
  } else {
    player.position++;
    speak("आप दाईं ओर चले गए");
  }

  if (game.enemyAlive || game.bossActive) {
    game.enemyDistance = Math.max(
      1,
      game.enemyDistance - 2
    );

    speak(
      `दुश्मन से दूरी अब ${game.enemyDistance} मीटर है।`
    );
  }
}

$("leftBtn").addEventListener("click", () => {
  movePlayer("left");
});

$("rightBtn").addEventListener("click", () => {
  movePlayer("right");
});

// ==========================================
// SHOOTING SYSTEM
// ==========================================

function shoot() {
  if (!game.started) {
    speak("पहले मिशन शुरू करें");
    return;
  }

  if (game.reloading) {
    speak("बंदूक Reload हो रही है");
    return;
  }

  if (player.ammo <= 0) {
    speak("गोली खत्म हो गई। Reload करें");
    return;
  }

  player.ammo--;

  if (game.bossActive) {
    game.bossHealth -= 20;

    if (game.bossHealth <= 0) {
      defeatBoss();
    } else {
      speak(
        `बॉस को गोली लगी। ` +
        `बॉस की Health ${game.bossHealth} बची है।`
      );
    }
  } else if (game.enemyAlive) {
    game.enemyHealth -= 25;

    if (game.enemyHealth <= 0) {
      defeatEnemy();
    } else {
      speak(
        `दुश्मन को गोली लगी। ` +
        `दुश्मन की Health ${game.enemyHealth} बची है।`
      );
    }
  } else {
    speak("गोली चली, लेकिन कोई दुश्मन सामने नहीं है");
  }

  updateHUD();
}

// ==========================================
// TAP AND HOLD FIRE
// ==========================================

function startFiring(event) {
  if (event && event.cancelable) {
    event.preventDefault();
  }

  if (game.firing) return;

  game.firing = true;

  shoot();

  game.fireTimer = setInterval(() => {
    if (game.firing) {
      shoot();

      if (player.ammo <= 0) {
        stopFiring();
      }
    }
  }, CONFIG.fireDelay);
}

function stopFiring() {
  game.firing = false;

  if (game.fireTimer) {
    clearInterval(game.fireTimer);
    game.fireTimer = null;
  }
}

const fireButton = $("fireBtn");

fireButton.addEventListener("pointerdown", startFiring);

fireButton.addEventListener("pointerup", stopFiring);
fireButton.addEventListener("pointercancel", stopFiring);
fireButton.addEventListener("lostpointercapture", stopFiring);
fireButton.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

fireButton.addEventListener("click", () => {
  if (fireButton.dataset.pointerUsed === "true") {
    fireButton.dataset.pointerUsed = "false";
    return;
  }

  shoot();
});

// Keyboard and screen reader activation
fireButton.addEventListener("keydown", (event) => {
  if (
    event.repeat ||
    (event.key !== "Enter" && event.key !== " ")
  ) return;

  event.preventDefault();
  startFiring();
});

fireButton.addEventListener("keyup", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    stopFiring();
  }
});

// ==========================================
// RELOAD SYSTEM
// ==========================================

$("reloadBtn").addEventListener("click", reloadWeapon);

function reloadWeapon() {
  if (!game.started) {
    speak("पहले मिशन शुरू करें");
    return;
  }

  if (game.reloading) {
    speak("Reload पहले से चल रहा है");
    return;
  }

  if (player.ammo === CONFIG.magazineSize) {
    speak("बंदूक पहले से पूरी भरी हुई है");
    return;
  }

  if (player.reserveAmmo <= 0) {
    speak("Reserve गोली खत्म हो गई है");
    return;
  }

  game.reloading = true;

  stopFiring();

  speak("बंदूक Reload हो रही है");

  setTimeout(() => {
    const needed =
      CONFIG.magazineSize - player.ammo;

    const available =
      Math.min(needed, player.reserveAmmo);

    player.ammo += available;
    player.reserveAmmo -= available;

    game.reloading = false;

    updateHUD();

    speak(
      `Reload पूरा हुआ। ` +
      `${player.ammo} गोलियाँ तैयार हैं।`
    );
  }, CONFIG.reloadTime);
}

// ==========================================
// MEDKIT AND HEALTH
// ==========================================

$("medBtn").addEventListener("click", useMedkit);

function useMedkit() {
  if (!game.started) {
    speak("पहले मिशन शुरू करें");
    return;
  }

  if (player.medkits <= 0) {
    speak("आपके पास कोई Medkit नहीं है");
    return;
  }

  if (player.health >= CONFIG.maxHealth) {
    speak("आपकी Health पहले से पूरी है");
    return;
  }

  player.medkits--;

  player.health = Math.min(
    CONFIG.maxHealth,
    player.health + 35
  );

  updateHUD();

  speak(
    `Medkit इस्तेमाल हुआ। ` +
    `Health ${player.health} है। ` +
    `${player.medkits} Medkit बाकी हैं।`
  );
}

// ==========================================
// ENEMY DEFEAT
// ==========================================

function defeatEnemy() {
  game.enemyAlive = false;

  player.kills++;
  player.diamonds += 100;

  updateHUD();

  speak(
    "मुबारक हो! आपने दुश्मन को हरा दिया। " +
    "आपको 100 Diamonds मिले।"
  );

  if (player.kills > 0 && player.kills % 3 === 0) {
    startBossMission();
  } else {
    game.mission++;

    speak(
      `अगला मिशन नंबर ${game.mission} तैयार है।`
    );
  }
}

// ==========================================
// BOSS MISSION
// ==========================================

function startBossMission() {
  game.bossActive = true;
  game.bossHealth = CONFIG.bossHealth;
  game.enemyAlive = false;
  game.enemyDistance = 15;

  updateHUD();

  speak(
    "सावधान! Boss Mission शुरू हो गया है। " +
    "बॉस आपके सामने है। उसकी Health 300 है।"
  );
}

function defeatBoss() {
  game.bossActive = false;

  player.diamonds += 500;
  player.health = Math.min(100, player.health + 25);

  game.mission++;

  updateHUD();

  speak(
    "शानदार जीत! आपने Boss को हरा दिया। " +
    "आपको 500 Diamonds और 25 Health बोनस मिला।"
  );
}

// ==========================================
// PLAYER DAMAGE
// ==========================================

function damagePlayer(amount) {
  if (!game.started || player.health <= 0) return;

  player.health = Math.max(
    0,
    player.health - amount
  );

  updateHUD();

  if (player.health <= 0) {
    gameOver();
  } else {
    speak(
      `आपको चोट लगी है। ` +
      `आपकी Health ${player.health} बची है।`
    );
  }
}

function gameOver() {
  game.started = false;

  stopFiring();

  speak(
    "गेम ओवर! आपकी Health खत्म हो गई। " +
    "दोबारा खेलने के लिए नया गेम शुरू करें।"
  );

  showGameOverButton();
}

// ==========================================
// INVENTORY SYSTEM
// ==========================================

function createInventory() {
  let inventory = $("inventoryPanel");

  if (inventory) return inventory;

  inventory = document.createElement("section");

  inventory.id = "inventoryPanel";
  inventory.className = "subpanel";
  inventory.hidden = true;

  inventory.setAttribute("aria-label", "Inventory");

  inventory.innerHTML = `
    <h3 tabindex="-1">आपका Inventory</h3>

    <p id="inventoryAmmo"></p>
    <p id="inventoryHealth"></p>
    <p id="inventoryMedkits"></p>
    <p id="inventoryDiamonds"></p>

    <button type="button" id="inventoryClose">
      Inventory बंद करें
    </button>
  `;

  $("gameScreen").appendChild(inventory);

  $("inventoryClose").addEventListener(
    "click",
    closeInventory
  );

  return inventory;
}

function openInventory() {
  const inventory = createInventory();

  $("inventoryAmmo").textContent =
    `गोली: ${player.ammo} / ${player.reserveAmmo}`;

  $("inventoryHealth").textContent =
    `Health: ${player.health}`;

  $("inventoryMedkits").textContent =
    `Medkit: ${player.medkits}`;

  $("inventoryDiamonds").textContent =
    `Diamonds: ${player.diamonds}`;

  inventory.hidden = false;

  game.inventoryOpen = true;

  speak(
    "Inventory खुल गया है। " +
    `आपके पास ${player.ammo} गोलियाँ और ` +
    `${player.medkits} Medkit हैं।`
  );

  focusElement($("inventoryClose"));
}

function closeInventory() {
  const inventory = $("inventoryPanel");

  if (!inventory) return;

  inventory.hidden = true;
  game.inventoryOpen = false;

  speak("Inventory बंद हो गया है");

  focusElement($("scanBtn"));
}

// ==========================================
// TWO FINGER INVENTORY GESTURE
// ==========================================

let touchPoints = new Map();
let twoFingerTriggered = false;

document.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "touch") return;

  touchPoints.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY
  });

  if (touchPoints.size === 2 && !twoFingerTriggered) {
    twoFingerTriggered = true;
    openInventory();
  }
});

document.addEventListener("pointerup", (event) => {
  touchPoints.delete(event.pointerId);

  if (touchPoints.size < 2) {
    twoFingerTriggered = false;
  }
});

document.addEventListener("pointercancel", (event) => {
  touchPoints.delete(event.pointerId);

  if (touchPoints.size < 2) {
    twoFingerTriggered = false;
  }
});

// ==========================================
// HELP SYSTEM
// ==========================================

$("helpBtn").addEventListener("click", () => {
  elements.help.hidden = false;

  speak(
    "गेम Controls। F से फायर करें। " +
    "R से Reload करें। S से दुश्मन खोजें। " +
    "A से बाएँ और D से दाएँ जाएँ। " +
    "H से Medkit इस्तेमाल करें।"
  );

  focusElement($("helpTitle"));
});

$("closeHelpBtn").addEventListener("click", () => {
  elements.help.hidden = true;

  speak("मदद बंद हो गई है");

  focusElement($("helpBtn"));
});

// ==========================================
// KEYBOARD CONTROLS
// ==========================================

document.addEventListener("keydown", (event) => {
  if (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  ) return;

  const target = event.target;

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) return;

  if (screens.game.hidden) return;

  const key = event.key.toLowerCase();

  switch (key) {
    case "f":
      if (!event.repeat) shoot();
      break;

    case "r":
      if (!event.repeat) reloadWeapon();
      break;

    case "s":
      if (!event.repeat) scanEnemy();
      break;

    case "a":
      if (!event.repeat) movePlayer("left");
      break;

    case "d":
      if (!event.repeat) movePlayer("right");
      break;

    case "h":
      if (!event.repeat) useMedkit();
      break;

    case "m":
      if (!event.repeat) toggleMute();
      break;

    case "i":
      if (!event.repeat) {
        game.inventoryOpen
          ? closeInventory()
          : openInventory();
      }
      break;
  }
});

// ==========================================
// GAME OVER BUTTON
// ==========================================

function showGameOverButton() {
  let button = $("restartGameBtn");

  if (!button) {
    button = document.createElement("button");

    button.id = "restartGameBtn";
    button.className = "primary";
    button.textContent = "नया गेम शुरू करें";

    $("gameScreen").appendChild(button);

    button.addEventListener("click", restartGame);
  }

  button.hidden = false;
}

function restartGame() {
  player.health = CONFIG.maxHealth;
  player.ammo = CONFIG.magazineSize;
  player.reserveAmmo = CONFIG.startingAmmo;
  player.diamonds = CONFIG.startingDiamonds;
  player.medkits = 3;
  player.kills = 0;
  player.position = 0;

  game.started = false;
  game.enemyAlive = false;
  game.enemyHealth = CONFIG.enemyHealth;
  game.bossActive = false;
  game.bossHealth = CONFIG.bossHealth;
  game.mission = 1;
  game.reloading = false;

  stopFiring();

  const inventory = $("inventoryPanel");

  if (inventory) inventory.hidden = true;

  const restart = $("restartGameBtn");

  if (restart) restart.hidden = true;

  updateHUD();

  speak(
    "नया गेम तैयार है। मिशन शुरू करने के लिए बटन दबाएँ।"
  );

  focusElement($("startBtn"));
}

// ==========================================