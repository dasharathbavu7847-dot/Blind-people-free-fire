
// =============================================
// BLIND PEOPLE FREE FIRE
// Game Developer: Dashrath Babu
// Junior Developer: Umakant Das
// =============================================

"use strict";

// ---------------- GAME DATA ----------------

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
    sounds: true
};

// ---------------- SOUND SYSTEM ----------------

const audio = {};

function loadSound(name, file) {
    audio[name] = new Audio(file);
    audio[name].preload = "auto";
}

function playSound(name) {
    if (!game.sounds || !audio[name]) return;

    audio[name].currentTime = 0;
    audio[name].play().catch(() => {});
}

// Add your MP3 files here when ready.
// loadSound("fire", "sounds/gun-fire.mp3");
// loadSound("reload", "sounds/reload.mp3");
// loadSound("enemy", "sounds/enemy.mp3");
// loadSound("medicine", "sounds/medicine.mp3");

// ---------------- ANNOUNCEMENT ----------------

function announce(message) {
    const status = document.getElementById("status");

    if (status) {
        status.textContent = message;
    }

    if (!game.voice) return;

    if ("speechSynthesis" in window) {
        speechSynthesis.cancel();

        const speech = new SpeechSynthesisUtterance(message);
        speech.lang = "en-IN";
        speech.rate = 1;

        speechSynthesis.speak(speech);
    }
}

// ---------------- SECTION SYSTEM ----------------

function show(sectionId) {
    const sections = document.querySelectorAll("main > section");

    sections.forEach(section => {
        section.hidden = true;
    });

    const target = document.getElementById(sectionId);

    if (target) {
        target.hidden = false;

        const heading = target.querySelector("h2");

        if (heading) {
            heading.setAttribute("tabindex", "-1");
            heading.focus();
        }

        announce(heading ? heading.textContent : sectionId);
    }
}

function backMenu() {
    show("menu");
}

// ---------------- ENTER GAME ----------------

function enterGame() {
    const input = document.getElementById("playerName");

    game.player = input.value.trim() || "Soldier";

    document.getElementById("welcome").textContent =
        "Welcome " + game.player;

    document.getElementById("profileName").textContent =
        "Player Name: " + game.player;

    show("menu");
}

// ---------------- OFFLINE BATTLE ----------------

function startOffline() {
    game.health = 100;
    game.ammo = game.magazine;
    game.reserveAmmo = 90;
    game.kills = 0;
    game.running = true;
    game.paused = false;

    game.difficulty =
        document.getElementById("difficulty").value;

    game.enemies =
        Number(document.getElementById("enemyCount").value);

    updateBattle();

    show("battle");

    announce(
        "Offline battle started. " +
        game.enemies + " enemies detected."
    );
}

// ---------------- ONLINE SYSTEM ----------------

function connectServer() {
    const address = document.getElementById("server").value.trim();
    const status = document.getElementById("serverStatus");

    if (!address) {
        status.textContent = "Please enter server address.";
        announce("Server address required");
        return;
    }

    status.textContent =
        "Server connection requires a configured multiplayer backend.";

    announce("Multiplayer server is not configured");
}

function createRoom() {
    const roomName =
        document.getElementById("roomName").value.trim();

    const capacity =
        Number(document.getElementById("capacity").value);

    const roomType =
        document.getElementById("roomType").value;

    const status = document.getElementById("roomStatus");

    if (!roomName) {
        status.textContent = "Please enter room name.";
        announce("Room name required");
        return;
    }

    status.textContent =
        roomName + " room selected. Capacity: " +
        capacity + ". Type: " + roomType +
        ". Server connection required.";

    announce("Room configuration selected");
}

function joinRoom() {
    const code =
        document.getElementById("roomCode").value.trim();

    if (!code) {
        announce("Please enter room code");
        return;
    }

    document.getElementById("roomStatus").textContent =
        "Room code entered: " + code +
        ". Server connection required.";

    announce("Room joining requires multiplayer server");
}

function quickMatch() {
    document.getElementById("roomStatus").textContent =
        "Quick Match requires an online multiplayer server.";

    announce("Quick match server not configured");
}

// ---------------- BATTLE MOVEMENT ----------------

function turnLeft() {
    game.direction = (game.direction + 270) % 360;
    announce("Turned left. Direction " + game.direction);
}

function turnRight() {
    game.direction = (game.direction + 90) % 360;
    announce("Turned right. Direction " + game.direction);
}

function moveForward() {
    if (!checkBattle()) return;

    game.distance = Math.max(0, game.distance - 2);

    announce("Moving forward. Distance " + game.distance);
}

function moveBack() {
    if (!checkBattle()) return;

    game.distance += 2;

    announce("Moving backward. Distance " + game.distance);
}

function run() {
    if (!checkBattle()) return;

    game.distance = Math.max(0, game.distance - 5);

    announce("Running forward");
}

function jump() {
    if (!checkBattle()) return;

    announce("Jumping");
}

// ---------------- FIRE GUN ----------------

function fire() {
    if (!checkBattle()) return;

    if (game.ammo <= 0) {
        announce("Magazine empty. Reload");
        playSound("empty");
        return;
    }

    game.ammo--;

    playSound("fire");

    if (game.enemies > 0) {
        game.enemies--;
        game.kills++;

        announce(
            "Enemy eliminated. " +
            game.enemies + " enemies remaining."
        );
    } else {
        announce("Gun fired. No enemies remaining.");
    }

    updateBattle();
}

// ---------------- RELOAD ----------------

function reload() {
    if (!checkBattle()) return;

    if (game.ammo === game.magazine) {
        announce("Magazine already full");
        return;
    }

    if (game.reserveAmmo <= 0) {
        announce("No reserve ammunition");
        return;
    }

    announce("Reloading magazine");
    playSound("reload");

    setTimeout(() => {
        const needed = game.magazine - game.ammo;
        const loaded = Math.min(needed, game.reserveAmmo);

        game.ammo += loaded;
        game.reserveAmmo -= loaded;

        updateBattle();

        announce("Reload complete");
    }, 1500);
}

// ---------------- ENEMY DETECTION ----------------

function detectEnemy() {
    if (!checkBattle()) return;

    if (game.enemies <= 0) {
        announce("No enemies detected");
        return;
    }

    announce(
        game.enemies + " enemies detected. " +
        "Distance " + game.distance + " meters."
    );

    playSound("enemy");
}

// ---------------- MEDKIT ----------------

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

    game.health = Math.min(
        100,
        game.health + 50
    );

    playSound("medicine");

    updateBattle();

    announce("Medkit used. Health " + game.health);
}

// ---------------- PAUSE ----------------

function pauseBattle() {
    if (!game.running) {
        announce("Battle not running");
        return;
    }

    game.paused = !game.paused;

    announce(game.paused ? "Battle paused" : "Battle resumed");
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

// ---------------- EXIT BATTLE ----------------

function exitBattle() {
    game.running = false;
    game.paused = false;

    announce("Battle ended");

    show("menu");
}

// ---------------- BATTLE STATUS ----------------

function updateBattle() {
    document.getElementById("health").textContent =
        "Health: " + game.health;

    document.getElementById("ammo").textContent =
        "Ammo: " + game.ammo + " / " + game.reserveAmmo;

    document.getElementById("enemies").textContent =
        "Enemies: " + game.enemies;

    document.getElementById("gold").textContent =
        "Gold: " + game.gold;

    updateProfile();
}

// ---------------- PLAYER PROFILE ----------------

function updateProfile() {
    document.getElementById("profileName").textContent =
        "Player Name: " + game.player;

    document.getElementById("profileGold").textContent =
        "Gold: " + game.gold;

    document.getElementById("profileDiamonds").textContent =
        "Diamonds: " + game.diamonds;
}

// ---------------- SHOP ----------------

function shopMessage(message) {
    document.getElementById("shopStatus").textContent = message;
    announce(message);
}

function buyAmmo() {
    if (game.gold < 100) {
        shopMessage("Not enough gold");
        return;
    }

    game.gold -= 100;
    game.reserveAmmo += 30;

    shopMessage("30 ammunition purchased");
    updateBattle();
}

function buyMedkit() {
    if (game.gold < 100) {
        shopMessage("Not enough gold");
        return;
    }

    game.gold -= 100;
    game.medkits++;

    shopMessage("Medkit purchased");
    updateBattle();
}

function gunShop() {
    shopMessage("Gun Shop is under development");
}

function magazineShop() {
    shopMessage("Magazine Shop is under development");
}

function goldShop() {
    shopMessage("Gold Shop is under development");
}

function diamondShop() {
    shopMessage("Diamond Shop is under development");
}

// ---------------- SETTINGS ----------------

function saveSettings() {
    game.voice =
        document.getElementById("voice").value === "On";

    game.sounds =
        document.getElementById("sounds").value === "On";

    document.getElementById("settingsStatus").textContent =
        "Settings saved successfully";

    announce("Settings saved");
}

// ---------------- INITIALIZATION ----------------

document.addEventListener("DOMContentLoaded", function () {
    updateBattle();
    updateProfile();

    console.log("Blind People Free Fire Loaded");
});
