// --- КОРНЕВАЯ СИСТЕМА ДАННЫХ ИГРЫ (ЯДРО ХИТА) ---
let activeBuff = { name: "Нет", active: false, endTime: 0, value: 0 };
let ysdkInstance = null;
let paymentsInstance = null;
let currentMainPanel = null;

// Функции для кастомных окон (Вместо уродливых браузерных alert)
function showGameAlert(title, message, rarity = "common") {
    const overlay = document.getElementById('custom-alert');
    const titleEl = document.getElementById('alert-title');
    const msgEl = document.getElementById('alert-message');
    const boxEl = document.querySelector('.alert-box');
    
    if (!overlay || !titleEl || !msgEl) return;

    titleEl.innerText = title;
    msgEl.innerText = message;
    
    // Настраиваем рамку под редкость, как в Brawl Stars
    if (rarity === "legendary") boxEl.style.borderColor = "#fdcb6e";
    else if (rarity === "epic") boxEl.style.borderColor = "#a55eea";
    else if (rarity === "rare") boxEl.style.borderColor = "#74b9ff";
    else boxEl.style.borderColor = "#f7a8b8";

    overlay.style.display = 'flex';
}

function closeCustomAlert() {
    playUiSound();
    const overlay = document.getElementById('custom-alert');
    if (overlay) overlay.style.display = 'none';
}

// Запуск при старте игры
window.addEventListener('DOMContentLoaded', () => {
    loadGame();
    initYandexSDK();
    
    if (typeof initFarmSystem === 'function') initFarmSystem();
    if (typeof initEventSystem === 'function') initEventSystem();
    
    setInterval(mainGameLoop, 1000);
    setInterval(saveGame, 3000);
    
    updateUI();
});

// --- ИНТЕГРАЦИЯ ЯНДЕКС GAMES SDK ---
function initYandexSDK() {
    if (typeof YaGames !== 'undefined') {
        YaGames.init().then(ysdk => {
            console.log('Яндекс SDK Успешно запущен!');
            ysdkInstance = ysdk;
            ysdk.getPayments({ signed: true }).then(_payments => {
                paymentsInstance = _payments;
            }).catch(err => console.log('Премиум покупки недоступны на устройстве'));
        }).catch(err => console.log('Ошибка запуска SDK', err));
    }
}

function exitGame() {
    playUiSound();
    if (ysdkInstance) {
        ysdkInstance.dispatchEvent(ysdkInstance.EVENTS.EXIT).catch(err => console.log(err));
    } else {
        showGameAlert("Каталог Яндекса", "Локальный тест: ты успешно вышла из игры!", "common");
    }
}

// --- СИСТЕМА ОПЫТА (XP) И ТАПОВ ПО КОТИКУ ---
function handlePusheenClick(event) {
    const clickSound = document.getElementById('sound-click');
    const meowSound = document.getElementById('sound-meow');
    
    if (clickSound) { clickSound.currentTime = 0; clickSound.play().catch(() => {}); }

    if (Math.random() < 0.2 && meowSound) {
        meowSound.currentTime = 0;
        meowSound.play().catch(() => {});
    }

    let currentPower = gameData.clickPower;
    if (gameData.activeSkin === '👑') currentPower *= 3; // Легендарный скин х3 к тапу
    if (activeBuff.active && activeBuff.name === "Сахарный Шторм") currentPower *= 5; // Ивент х5
    if (activeBuff.active && activeBuff.name === "Турбо Клик") currentPower += activeBuff.value;

    gameData.cookies += currentPower;
    
    addXP(1); // Качаем уровень
    createFloatingNumber(event.clientX, event.clientY, `+${currentPower}`);
    updateUI();
}

function addXP(amount) {
    gameData.xp += amount;
    if (gameData.xp >= gameData.xpNeeded) {
        gameData.xp -= gameData.xpNeeded;
        gameData.level++;
        gameData.xpNeeded = Math.round(gameData.xpNeeded * 1.5);
        
        // Награда за уровень
        gameData.wheatSeeds += 2;
        
        const fanfare = document.getElementById('sound-fanfare');
        if (fanfare) { fanfare.currentTime = 0; fanfare.play().catch(() => {}); }
        
        showGameAlert("🎉 Твой уровень повышен!", `Ура! Пушин вырос до ${gameData.level} уровня! Дарим тебе бонусные семена пшеницы!`, "legendary");
    }
}

function createFloatingNumber(x, y, text) {
    const container = document.getElementById('click-zone');
    const num = document.createElement('div');
    num.className = 'floating-number';
    num.innerText = text;
    
    const rect = container.getBoundingClientRect();
    num.style.left = (x - rect.left - 10) + 'px';
    num.style.top = (y - rect.top - 20) + 'px';
    
    if (container) container.appendChild(num);
    setTimeout(() => num.remove(), 600);
}

// МЕТКА_JS_КОНЦА_ЧАСТИ_5_1
// --- БАЗА ДАННЫХ НАКЛЕЕК/СКИНОВ ПУШИНА И ИХ ДОХОДА ---
const SKINS_DATABASE = {
    '🐱': { name: "Базовый Пушин", rarity: "common", bonus: 0, icon: "🐱" },
    '👒': { name: "Пушин-Садовод", rarity: "common", bonus: 5, icon: "👒" },
    '🧑‍🍳': { name: "Пушин-Шеф", rarity: "rare", bonus: 25, icon: "🧑‍🍳" },
    '🕶️': { name: "Пушин-Бизнесмен", rarity: "rare", bonus: 60, icon: "🕶️" },
    '👑': { name: "Королевский Пушин", rarity: "legendary", bonus: 200, icon: "👑" }
};

// --- БЫСТРЫЙ МАГАЗИН И ПРОКАЧКА ---
function buyUpgradeClick() {
    playUiSound();
    if (gameData.cookies >= gameData.clickUpgradeCost) {
        gameData.cookies -= gameData.clickUpgradeCost;
        gameData.clickUpgradeLvl++;
        
        if (gameData.clickUpgradeLvl <= 3) gameData.clickPower += 1;
        else if (gameData.clickUpgradeLvl <= 6) gameData.clickPower += 2;
        else gameData.clickPower += 5;

        gameData.clickUpgradeCost = Math.round(gameData.clickUpgradeCost * 1.5);
        updateUI();
        saveGame();
    }
}

function buyAutoClicker() {
    playUiSound();
    if (gameData.cookies >= gameData.autoClickerCost) {
        gameData.cookies -= gameData.autoClickerCost;
        gameData.autoClickers++;
        gameData.autoClickerCost = Math.round(gameData.autoClickerCost * 1.4);
        updateUI();
        saveGame();
    }
}

// --- ПРИЛОЖЕНИЕ СМАРТФОНА: ГАРДЕРОБ И СЧАСТЛИВЫЕ БОКСЫ ---
function renderWardrobe() {
    let html = `
        <h3>🎁 Счастливые Боксы</h3>
        <p>Испытай удачу! Выбей легендарный скин Пушина!</p>
        <button class="buy-btn" style="width:100%; margin-bottom:15px; background:#fdcb6e; box-shadow:0 4px 0px #cf9d34;" onclick="openSkinBox()">
            📦 Открыть Скин-Бокс (500 🍪)
        </button>
        <hr>
        <h3>🧥 Твой Гардероб</h3>
        <div style="display:flex; flex-direction:column; gap:10px;">
    `;

    for (let id in SKINS_DATABASE) {
        let skin = SKINS_DATABASE[id];
        let isOwned = gameData.ownedSkins.includes(id);
        let isActive = gameData.activeSkin === id;
        
        html += `
            <div class="shop-item" style="border: 2px solid ${isActive ? '#f7a8b8' : '#eee'};">
                <div style="font-size:2rem;">${skin.icon}</div>
                <div class="item-info" style="flex-grow:1; margin-left:10px;">
                    <h4 style="margin:0;">${skin.name}</h4>
                    <p style="margin:2px 0 0 0; font-size:0.75rem;" class="rarity-${skin.rarity}">
                        Редкость: ${skin.rarity.toUpperCase()} (+${skin.bonus}/с)
                    </p>
                </div>
        `;

        if (!isOwned) {
            html += `<button class="buy-btn" disabled style="background:#ccc; box-shadow:none;">🔒 Закрыто</button>`;
        } else if (isActive) {
            html += `<button class="buy-btn" disabled style="background:#2ed573; box-shadow:none;">Надет</button>`;
        } else {
            html += `
                <button class="buy-btn" onclick="saveNewSkin('${id}')" style="background:#74b9ff; box-shadow:0 4px 0px #4d8ad4;">
                    Примерить & Сохранить
                </button>
            `;
        }
        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

function openSkinBox() {
    playUiSound();
    if (gameData.cookies < 500) {
        showGameAlert("❌ Мало печенек", "Бокс со скином стоит 500 печенек! Покликай ещё немного.", "common");
        return;
    }
    gameData.cookies -= 500;

    let rand = Math.random();
    let rolledSkin = '🐱';
    let rolledRarity = 'common';
    
    if (rand < 0.05) { rolledSkin = '👑'; rolledRarity = 'legendary'; } 
    else if (rand < 0.15) { rolledSkin = '🕶️'; rolledRarity = 'rare'; } 
    else if (rand < 0.35) { rolledSkin = '🧑‍🍳'; rolledRarity = 'rare'; } 
    else if (rand < 0.65) { rolledSkin = '👒'; rolledRarity = 'common'; } 
    else { rolledSkin = '🐱'; rolledRarity = 'common'; }

    const fanfare = document.getElementById('sound-fanfare');
    if (fanfare) { fanfare.currentTime = 0; fanfare.play().catch(() => {}); }

    if (gameData.ownedSkins.includes(rolledSkin)) {
        let refund = 250;
        gameData.cookies += refund;
        showGameAlert("📦 Повторный скин", `Выпал дубликат: ${SKINS_DATABASE[rolledSkin].name}. Мы автоматически сдали его на биржу за +${refund} 🍪!`, "common");
    } else {
        gameData.ownedSkins.push(rolledSkin);
        showGameAlert("🎉 ВЫБИТ СКИH!", `Тебе выпал скин: ${SKINS_DATABASE[rolledSkin].name}! Зайди в гардероб смартфона, чтобы его надеть.`, rolledRarity);
    }

    let appBox = document.getElementById('phone-app-box');
    if (appBox && appBox.classList.contains('active')) {
        document.getElementById('app-body').innerHTML = renderWardrobe();
    }
    updateUI();
}

function saveNewSkin(skinId) {
    if (gameData.ownedSkins.includes(skinId)) {
        gameData.activeSkin = skinId;
        document.getElementById('pusheen').innerText = skinId;
        
        showGameAlert("🧥 Стиль обновлен", `Пушин успешно переоделся в новый костюм!`, "rare");
        
        document.getElementById('app-body').innerHTML = renderWardrobe();
        updateUI();
        saveGame();
    }
}

// МЕТКА_JS_КОНЦА_ЧАСТИ_5_2
// --- ИНТЕРФЕЙС ПАСТЕЛЬНОГО ТЕЛЕФОНА И ПРИЛОЖЕНИЙ ---
function togglePhone() {
    playUiSound();
    const phone = document.getElementById('phone-modal');
    if (!phone) return;
    
    phone.classList.toggle('open');
    
    // Закрываем активные главные панели, если открываем телефон
    if (phone.classList.contains('open')) {
        document.querySelectorAll('.main-panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
        currentMainPanel = null;
    }
    updateUI();
}

function openPhoneApp(appName) {
    playUiSound();
    const mainApps = document.getElementById('phone-main-apps');
    const appBox = document.getElementById('phone-app-box');
    const appBody = document.getElementById('app-body');
    
    if (!mainApps || !appBox || !appBody) return;
    
    mainApps.style.display = 'none';
    appBox.classList.add('active');
    
    // Загружаем контент нужного приложения
    if (appName === 'profile') {
        let skinBonus = 0;
        gameData.ownedSkins.forEach(id => {
            if (SKINS_DATABASE[id]) skinBonus += SKINS_DATABASE[id].bonus;
        });
        
        appBody.innerHTML = `
            <h3>📊 Профиль Пушина</h3>
            <p>🌟 <b>Уровень:</b> ${gameData.level}</p>
            <p>✨ <b>Текущий Опыт (XP):</b> ${gameData.xp} / ${gameData.xpNeeded}</p>
            <p>🍪 <b>Всего печенек:</b> ${gameData.cookies}</p>
            <hr style="border:1px solid #eee; margin:12px 0;">
            <h4>💰 Статистика дохода:</h4>
            <p>👉 Сила клика: +${gameData.clickPower * (gameData.activeSkin === '👑' ? 3 : 1)} 🍪</p>
            <p>🐈 Помощники (котята): +${gameData.autoClickers} 🍪/с</p>
            <p>🧥 Пассив от гардероба: +${skinBonus} 🍪/с</p>
        `;
    } 
    else if (appName === 'inventory') {
        if (!gameData.inventory.strawberry) gameData.inventory.strawberry = 0;
        appBody.innerHTML = `
            <h3>🎒 Твой Инвентарь</h3>
            <p>Здесь лежат собранные ресурсы, дающие пассивный доход!</p>
            <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
                <div class="shop-item"><span>🌾 Пшеница:</span> <b>${gameData.inventory.wheat} шт.</b></div>
                <div class="shop-item"><span>🍇 Смородина:</span> <b>${gameData.inventory.berry} шт.</b></div>
                <div class="shop-item"><span>🧊 Голубика:</span> <b>${gameData.inventory.blueberry} шт.</b></div>
                <div class="shop-item"><span>🍓 Клубника:</span> <b>${gameData.inventory.strawberry} шт.</b></div>
            </div>
            <p style="font-size:0.8rem; color:#aaa; margin-top:12px; line-height:1.4;">
                * Семена на складе: 🌾 x${gameData.wheatSeeds} | 🍇 x${gameData.berrySeeds} | 🧊 x${gameData.blueberrySeeds} | 🍓 x${gameData.strawberrySeeds || 0}
            </p>
        `;
    } 
    else if (appName === 'wardrobe') {
        appBody.innerHTML = renderWardrobe();
    } 
    else if (appName === 'market') {
        if (typeof renderMarketSystem === 'function') {
            appBody.innerHTML = renderMarketSystem();
            if (typeof startMarketCanvas === 'function') startMarketCanvas();
        } else {
            appBody.innerHTML = `<p>Биржа загружается...</p>`;
        }
    } 
    else if (appName === 'wheel') {
        appBody.innerHTML = `
            <h3>🎡 Колесо Фортуны</h3>
            <div class="wheel-container">
                <div class="wheel-pointer">👇</div>
                <div id="wheel" class="wheel-visual"></div>
                <button class="buy-btn" id="spin-btn" onclick="spinWheel()">Крутить бесплатно!</button>
                <p id="wheel-timer-text" style="display:none; font-size:0.85rem; color:#7f8c8d;">
                    Кулдаун: <span id="wheel-countdown">30</span>с
                </p>
            </div>
        `;
        setTimeout(() => { if (typeof checkWheelCooldown === 'function') checkWheelCooldown(); }, 50);
    } 
    else if (appName === 'games') {
        appBody.innerHTML = `
            <h3>🕹️ Развлечения и Игры</h3>
            <p>Зарабатывай редкие семена и опыт!</p>
            <div class="shop-item" style="flex-direction:column; align-items:flex-start; gap:6px;">
                <h4 style="margin:0;">Ловец Вкусняшек 🧺</h4>
                <p style="font-size:0.8rem; margin:0; color:#7f8c8d;">Успей поймать падающую еду за 30 секунд!</p>
                <button class="buy-btn" style="width:100%; margin-top:5px; background:var(--main-color);" onclick="triggerMinigame('catcher')">Играть</button>
            </div>
            <div class="shop-item" style="flex-direction:column; align-items:flex-start; gap:6px; margin-top:10px;">
                <h4 style="margin:0;">Налей Молочко 🥛</h4>
                <p style="font-size:0.8rem; margin:0; color:#7f8c8d;">Вовремя нажми на кнопку, чтобы наполнить миску.</p>
                <button class="buy-btn" style="width:100%; margin-top:5px; background:#74b9ff; box-shadow:0 4px 0px #4d8ad4;" onclick="triggerMinigame('milk')">Играть</button>
            </div>
        `;
    }
}

function closePhoneApp() {
    playUiSound();
    const appBox = document.getElementById('phone-app-box');
    const mainApps = document.getElementById('phone-main-apps');
    if (appBox && mainApps) {
        appBox.classList.remove('active');
        mainApps.style.display = 'grid';
    }
}
// МЕТКА_JS_КОНЦА_ЧАСТИ_5_3
// --- УПРАВЛЕНИЕ 4 ГЛАВНЫМИ КНОПКАМИ ИНТЕРФЕЙСА ---
function openMainPanel(panelId) {
    playUiSound();
    
    // Закрываем телефон, если он открыт
    const phone = document.getElementById('phone-modal');
    if (phone) phone.classList.remove('open');
    
    const panel = document.getElementById(`panel-${panelId}`);
    const navBtn = document.getElementById(`nav-btn-${panelId}`);
    
    if (!panel) return;
    
    // Если нажимаем на уже открытую панель — закрываем её (возврат на главный экран кликера)
    if (currentMainPanel === panelId) {
        panel.classList.remove('active');
        if (navBtn) navBtn.classList.remove('active');
        currentMainPanel = null;
    } else {
        // Закрываем все панели и гасим кнопки
        document.querySelectorAll('.main-panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
        
        // Открываем нужную
        panel.classList.add('active');
        if (navBtn) navBtn.classList.add('active');
        currentMainPanel = panelId;
        
        // Рендерим контент открытой вкладки
        if (panelId === 'farm' && typeof renderFarmPlots === 'function') renderFarmPlots();
        if (panelId === 'shop' && typeof renderShopItems === 'function') renderShopItems();
        if (panelId === 'home' && typeof renderHomeSystem === 'function') renderHomeSystem();
    }
}

// --- СИСТЕМНЫЙ ИГРОВОЙ ЦИКЛ (Каждую секунду) ---
function mainGameLoop() {
    if (!gameData.inventory.strawberry) gameData.inventory.strawberry = 0;
    
    // 1. Пассивный доход от котят-автокликеров
    let totalPps = gameData.autoClickers;
    
    // 2. Пассивный доход от ВСЕХ выбитых скинов (Гардероб)
    gameData.ownedSkins.forEach(id => {
        if (SKINS_DATABASE[id]) totalPps += SKINS_DATABASE[id].bonus;
    });

    // 3. Пассивный доход от семян и ягод на складе (Многоуровневая экономика)
    let inventoryIncome = 0;
    inventoryIncome += (gameData.wheatSeeds + gameData.berrySeeds + gameData.blueberrySeeds + (gameData.strawberrySeeds || 0)) * 0.1; // Семена
    inventoryIncome += gameData.inventory.wheat * 0.5; // Собрано пшеницы
    inventoryIncome += gameData.inventory.berry * 1.5; // Собрано смородины
    inventoryIncome += gameData.inventory.blueberry * 4.0; // Собрано голубики
    inventoryIncome += gameData.inventory.strawberry * 8.0; // Собрано клубники
    
    totalPps += Math.floor(inventoryIncome);

    // Применяем буст сытости дома (если кот сыт)
    if (typeof getHomeFoodBonus === 'function') {
        totalPps = Math.floor(totalPps * (1 + getHomeFoodBonus() / 100));
    }

    if (totalPps > 0) {
        gameData.cookies += totalPps;
        if (typeof addXP === 'function') addXP(Math.ceil(totalPps * 0.05)); // Пассивный опыт
    }

    // Обработка таймеров фермы и ивентов
    if (typeof updateFarmLoop === 'function') updateFarmLoop();
    if (typeof updateEventLoop === 'function') updateEventLoop();

    updateUI();
}

// --- ОБНОВЛЕНИЕ ТЕКСТА И ИНТЕРФЕЙСА (UI) ---
function updateUI() {
    if (!gameData.inventory.strawberry) gameData.inventory.strawberry = 0;
    
    const cookiesCountEl = document.getElementById('cookies-count');
    const clickPowerEl = document.getElementById('click-power-show');
    const ppsCountEl = document.getElementById('pps-count');
    const rankEl = document.getElementById('pusheen-rank');
    const xpFillEl = document.getElementById('xp-bar-fill');
    const mainPusheenEl = document.getElementById('pusheen');
    
    if (cookiesCountEl) cookiesCountEl.innerText = gameData.cookies;
    if (clickPowerEl) clickPowerEl.innerText = gameData.clickPower * (gameData.activeSkin === '👑' ? 3 : 1);
    
    // Вычисляем общий PPS для табло
    let displayPps = gameData.autoClickers;
    gameData.ownedSkins.forEach(id => { if (SKINS_DATABASE[id]) displayPps += SKINS_DATABASE[id].bonus; });
    
    let inventoryIncome = 0;
    inventoryIncome += (gameData.wheatSeeds + gameData.berrySeeds + gameData.blueberrySeeds + (gameData.strawberrySeeds || 0)) * 0.1;
    inventoryIncome += gameData.inventory.wheat * 0.5;
    inventoryIncome += gameData.inventory.berry * 1.5;
    inventoryIncome += gameData.inventory.blueberry * 4.0;
    inventoryIncome += gameData.inventory.strawberry * 8.0;
    
    if (ppsCountEl) ppsCountEl.innerText = Math.floor(displayPps + inventoryIncome);

    // Обновляем быстрый магазин
    const qClickCostEl = document.getElementById('q-click-cost');
    const btnQuickClickEl = document.getElementById('btn-quick-click');
    if (qClickCostEl) qClickCostEl.innerText = gameData.clickUpgradeCost;
    if (btnQuickClickEl) btnQuickClickEl.disabled = gameData.cookies < gameData.clickUpgradeCost;
    
    const qPpsCostEl = document.getElementById('q-pps-cost');
    const btnQuickPpsEl = document.getElementById('btn-quick-pps');
    if (qPpsCostEl) qPpsCostEl.innerText = gameData.autoClickerCost;
    if (btnQuickPpsEl) btnQuickPpsEl.disabled = gameData.cookies < gameData.autoClickerCost;

    // Шкала XP
    if (rankEl) rankEl.innerText = `🐱 Ур. ${gameData.level}`;
    let xpPercent = Math.min(100, (gameData.xp / gameData.xpNeeded) * 100);
    if (xpFillEl) xpFillEl.style.width = `${xpPercent}%`;
    
    // Отображаем надетый скин на главном экране
    if (mainPusheenEl) mainPusheenEl.innerText = gameData.activeSkin;
}

// --- АВТОСОХРАНЕНИЕ (LocalStorage) ---
function saveGame() {
    gameData.lastSaveTime = Date.now();
    localStorage.setItem('pusheen_universe_save', JSON.stringify(gameData));
}

function loadGame() {
    let saved = localStorage.getItem('pusheen_universe_save');
    if (saved) {
        try {
            let parsed = JSON.parse(saved);
            gameData = Object.assign(gameData, parsed);
            if (!gameData.inventory.strawberry) gameData.inventory.strawberry = 0;
            
            const mainPusheenEl = document.getElementById('pusheen');
            if (mainPusheenEl) mainPusheenEl.innerText = gameData.activeSkin;
        } catch(e) {
            console.log("Ошибка загрузки данных", e);
        }
    }
}
