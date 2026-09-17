// --- КОРНЕВАЯ СИСТЕМА ДАННЫХ ИГРЫ ---
let gameData = {
    cookies: 0,
    clickPower: 1,
    clickUpgradeLvl: 1,
    clickUpgradeCost: 10,
    autoClickers: 0,
    autoClickerCost: 50,
    
    // Опыт и уровни Пушина
    level: 1,
    xp: 0,
    xpNeeded: 100,
    
    // Гардероб и Скины
    activeSkin: '🐱',
    ownedSkins: ['🐱'], // Сразу открыт базовый кот
    
    // Экономика огорода и склада
    wheatSeeds: 5,
    berrySeeds: 0,
    blueberrySeeds: 0,
    inventory: { wheat: 0, berry: 0, blueberry: 0 },
    
    // Статистика рулетки и оффлайна
    lastWheelSpinTime: 0,
    lastSaveTime: Date.now()
};

// Переменные окружения и баффов
let activeBuff = { name: "Нет", active: false, endTime: 0, value: 0 };
let ysdkInstance = null;
let paymentsInstance = null;
let currentMainPanel = null;

// Инициализация при загрузке страницы
window.onload = function() {
    loadGame();
    initYandexSDK();
    
    // Запуск таймеров
    if (typeof initFarmSystem === 'function') initFarmSystem();
    if (typeof initEventSystem === 'function') initEventSystem();
    
    setInterval(mainGameLoop, 1000);
    setInterval(saveGame, 3000);
    
    updateUI();
};

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
    if (ysdkInstance) {
        ysdkInstance.dispatchEvent(ysdkInstance.EVENTS.EXIT).catch(err => console.log(err));
    } else {
        alert('Каталог Яндекса: Вы вышли из игры!');
    }
}

// --- СИСТЕМА ОПЫТА (XP) И ЗВУКОВ КЛИКА ---
function handlePusheenClick(event) {
    const clickSound = document.getElementById('sound-click');
    const meowSound = document.getElementById('sound-meow');
    
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});

    if (Math.random() < 0.2) {
        meowSound.currentTime = 0;
        meowSound.play().catch(() => {});
    }

    // Сила клика с учетом баффов и надетых редких скинов
    let currentPower = gameData.clickPower;
    if (gameData.activeSkin === '👑') currentPower *= 3; // Легендарный скин х3 к клику
    if (activeBuff.active && activeBuff.name === "Сахарный Шторм") currentPower *= 5; // Ивент х5
    if (activeBuff.active && activeBuff.name === "Турбо Клик") currentPower += activeBuff.value;

    gameData.cookies += currentPower;
    
    // Добавляем XP за каждый клик
    addXP(1);
    
    createFloatingNumber(event.clientX, event.clientY, `+${currentPower}`);
    updateUI();
}

function addXP(amount) {
    gameData.xp += amount;
    if (gameData.xp >= gameData.xpNeeded) {
        gameData.xp -= gameData.xpNeeded;
        gameData.level++;
        gameData.xpNeeded = Math.round(gameData.xpNeeded * 1.5);
        
        // Подарок за новый уровень (Бесплатный бокс!)
        gameData.wheatSeeds += 2;
        
        const fanfare = document.getElementById('sound-fanfare');
        fanfare.currentTime = 0;
        fanfare.play().catch(() => {});
        
        alert(`🎉 УРА! Твой Пушин вырос! Новый Уровень: ${gameData.level}! Дарим тебе семена!`);
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
    
    container.appendChild(num);
    setTimeout(() => num.remove(), 600);
}

// МЕТКА_JS_КОНЦА_ЧАСТИ_3_1
// --- БАЗА ДАННЫХ СКИНОВ И ИХ ДОХОДА ---
const SKINS_DATABASE = {
    '🐱': { name: "Базовый Пушин", rarity: "common", bonus: 0, icon: "🐱" },
    '👒': { name: "Пушин-Садовод", rarity: "common", bonus: 5, icon: "👒" },
    '🧑‍🍳': { name: "Пушин-Шеф", rarity: "rare", bonus: 25, icon: "🧑‍🍳" },
    '🕶️': { name: "Пушин-Бизнесмен", rarity: "rare", bonus: 60, icon: "🕶️" },
    '👑': { name: "Королевский Пушин", rarity: "legendary", bonus: 200, icon: "👑" }
};

// --- ЭКОНОМИКА И БЫСТРЫЙ МАГАЗИН ---
function buyUpgradeClick() {
    if (gameData.cookies >= gameData.clickUpgradeCost) {
        gameData.cookies -= gameData.clickUpgradeCost;
        gameData.clickUpgradeLvl++;
        
        // Шаг роста силы клика: +1, +2, +5
        if (gameData.clickUpgradeLvl <= 3) gameData.clickPower += 1;
        else if (gameData.clickUpgradeLvl <= 6) gameData.clickPower += 2;
        else gameData.clickPower += 5;

        gameData.clickUpgradeCost = Math.round(gameData.clickUpgradeCost * 1.5);
        updateUI();
        saveGame();
    }
}

function buyAutoClicker() {
    if (gameData.cookies >= gameData.autoClickerCost) {
        gameData.cookies -= gameData.autoClickerCost;
        gameData.autoClickers++;
        gameData.autoClickerCost = Math.round(gameData.autoClickerCost * 1.4);
        updateUI();
        saveGame();
    }
}

// --- ПРИЛОЖЕНИЕ ТЕЛЕФОНА: ГАРДЕРОБ И БОКСЫ ---
function renderWardrobe() {
    let html = `
        <h3>🎁 Счастливые Боксы</h3>
        <p>Испытай удачу! Выбей легендарный скин Пушина!</p>
        <button class="buy-btn" style="width:100%; margin-bottom:15px; background:#fdcb6e;" onclick="openSkinBox()">
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
            html += `<button class="buy-btn" disabled style="background:#ccc;">🔒 Закрыто</button>`;
        } else if (isActive) {
            html += `<button class="buy-btn" disabled style="background:#2ed573;">Надет</button>`;
        } else {
            html += `
                <button class="buy-btn" onclick="saveNewSkin('${id}')" style="background:#74b9ff;">
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
    if (gameData.cookies < 500) {
        alert("Недостаточно печенек! Бокс стоит 500 🍪");
        return;
    }
    gameData.cookies -= 500;

    // Шансы выпадения скинов (Роблокс-стиль)
    let rand = Math.random();
    let rolledSkin = '🐱';
    
    if (rand < 0.05) rolledSkin = '👑';       // Легендарный 5%
    else if (rand < 0.15) rolledSkin = '🕶️';  // Редкий 10%
    else if (rand < 0.35) rolledSkin = '🧑‍🍳'; // Редкий 20%
    else if (rand < 0.65) rolledSkin = '👒';  // Обычный 30%
    else rolledSkin = '🐱';                    // Базовый 35%

    let sfx = document.getElementById('sound-fanfare');
    sfx.currentTime = 0; sfx.play().catch(() => {});

    if (gameData.ownedSkins.includes(rolledSkin)) {
        // Трейдинг / Компенсация дубликата за монетки на бирже
        let refund = 250;
        gameData.cookies += refund;
        alert(`📦 Из бокса выпал дубликат: ${SKINS_DATABASE[rolledSkin].name}. Мы автоматически продали его на бирже за +${refund} печенек!`);
    } else {
        gameData.ownedSkins.push(rolledSkin);
        alert(`🎉 УРА! ТЕБЕ ВЫПАЛ НОВЫЙ СКИН: ${SKINS_DATABASE[rolledSkin].name}! Зайди в гардероб, чтобы его примерить.`);
    }

    // Перерисовываем экран гардероба, если он открыт
    let appBox = document.getElementById('phone-app-box');
    if (appBox.classList.contains('active')) {
        document.getElementById('app-body').innerHTML = renderWardrobe();
    }
    updateUI();
}

function saveNewSkin(skinId) {
    if (gameData.ownedSkins.includes(skinId)) {
        gameData.activeSkin = skinId;
        
        // Мгновенно переодеваем Пушина на главном экране кликера!
        document.getElementById('pusheen').innerText = skinId;
        
        alert(`🧥 Стиль изменен! Пушин переоделся.`);
        
        // Обновляем список в гардеробе
        document.getElementById('app-body').innerHTML = renderWardrobe();
        updateUI();
        saveGame();
    }
}

// МЕТКА_JS_КОНЦА_ЧАСТИ_3_2
// --- ИНТЕРФЕЙС ПАСТЕЛЬНОГО ТЕЛЕФОНА И ПРИЛОЖЕНИЙ ---
function togglePhone() {
    const phone = document.getElementById('phone-modal');
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
    const mainApps = document.getElementById('phone-main-apps');
    const appBox = document.getElementById('phone-app-box');
    const appBody = document.getElementById('app-body');
    
    mainApps.style.display = 'none';
    appBox.classList.add('active');
    
    // Загружаем контент нужного приложения
    if (appName === 'profile') {
        // Расчет пассивного дохода от скинов
        let skinBonus = 0;
        gameData.ownedSkins.forEach(id => {
            if (SKINS_DATABASE[id]) skinBonus += SKINS_DATABASE[id].bonus;
        });
        
        appBody.innerHTML = `
            <h3>📊 Профиль Пушина</h3>
            <p>🌟 <b>Уровень:</b> ${gameData.level}</p>
            <p>✨ <b>Текущий Опыт (XP):</b> ${gameData.xp} / ${gameData.xpNeeded}</p>
            <p>🍪 <b>Всего печенек:</b> ${gameData.cookies}</p>
            <hr>
            <h4>💰 Статистика дохода:</h4>
            <p>👉 Сила клика: +${gameData.clickPower} 🍪</p>
            <p>🐈 Помощники (котята): +${gameData.autoClickers} 🍪/с</p>
            <p>🧥 Пассив от гардероба: +${skinBonus} 🍪/с</p>
        `;
    } 
    else if (appName === 'inventory') {
        appBody.innerHTML = `
            <h3>🎒 Твой Инвентарь</h3>
            <p>Здесь лежат собранные ресурсы, дающие пассивный доход!</p>
            <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
                <div class="shop-item"><span>🌾 Пшеница:</span> <b>${gameData.inventory.wheat} шт.</b></div>
                <div class="shop-item"><span>🍇 Смородина:</span> <b>${gameData.inventory.berry} шт.</b></div>
                <div class="shop-item"><span>🫐 Голубика:</span> <b>${gameData.inventory.blueberry} шт.</b></div>
            </div>
            <p style="font-size:0.8rem; color:#aaa; margin-top:10px;">
                * Семена на складе: 🌾 x${gameData.wheatSeeds} | 🍇 x${gameData.berrySeeds} | 🫐 x${gameData.blueberrySeeds}
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
        // Перемещаем рулетку внутрь телефона
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
        // Восстанавливаем кулдаун для нового элемента рулетки
        setTimeout(() => { if (typeof checkWheelCooldown === 'function') checkWheelCooldown(); }, 50);
    } 
    else if (appName === 'games') {
        appBody.innerHTML = `
            <h3>🕹️ Развлечения и Игры</h3>
            <p>Зарабатывай редкие семена и опыт!</p>
            <div class="shop-item" style="flex-direction:column; align-items:flex-start; gap:8px;">
                <h4>Ловец Вкусняшек 🧺</h4>
                <p style="font-size:0.8rem; margin:0; color:#7f8c8d;">Успей поймать падающую еду за 30 секунд!</p>
                <button class="buy-btn" style="width:100%; margin-top:5px;" onclick="triggerMinigame('catcher')">Играть</button>
            </div>
            <div class="shop-item" style="flex-direction:column; align-items:flex-start; gap:8px; margin-top:10px;">
                <h4>Налей Молочко 🥛</h4>
                <p style="font-size:0.8rem; margin:0; color:#7f8c8d;">Вовремя нажми на кнопку, чтобы наполнить миску.</p>
                <button class="buy-btn" style="width:100%; margin-top:5px; background:#74b9ff;" onclick="triggerMinigame('milk')">Играть</button>
            </div>
        `;
    }
}

function closePhoneApp() {
    document.getElementById('phone-app-box').classList.remove('active');
    document.getElementById('phone-main-apps').style.display = 'grid';
}

// --- УПРАВЛЕНИЕ 4 ГЛАВНЫМИ КНОПКАМИ ИНТЕРФЕЙСА ---
function openMainPanel(panelId) {
    // Закрываем телефон, если он открыт
    document.getElementById('phone-modal').classList.remove('open');
    
    const panel = document.getElementById(`panel-${panelId}`);
    const navBtn = document.getElementById(`nav-btn-${panelId}`);
    
    // Если нажимаем на уже открытую панель — закрываем её (возврат на главный экран кликера)
    if (currentMainPanel === panelId) {
        panel.classList.remove('active');
        navBtn.classList.remove('active');
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
    // 1. Пассивный доход от котят-автокликеров
    let totalPps = gameData.autoClickers;
    
    // 2. Пассивный доход от ВСЕХ выбитых скинов (Гардероб)
    gameData.ownedSkins.forEach(id => {
        if (SKINS_DATABASE[id]) totalPps += SKINS_DATABASE[id].bonus;
    });

    // 3. Пассивный доход от семян и ягод на складе (Многоуровневая экономика)
    let inventoryIncome = 0;
    inventoryIncome += (gameData.wheatSeeds + gameData.berrySeeds + gameData.blueberrySeeds) * 0.1; // Семена
    inventoryIncome += gameData.inventory.wheat * 0.5; // Собрано пшеницы
    inventoryIncome += gameData.inventory.berry * 1.5; // Собрано смородины
    inventoryIncome += gameData.inventory.blueberry * 4.0; // Собрано голубики
    
    totalPps += Math.floor(inventoryIncome);

    // Применяем буст сытости дома (если кот сыт)
    if (typeof getHomeFoodBonus === 'function') {
        totalPps = Math.floor(totalPps * (1 + getHomeFoodBonus() / 100));
    }

    if (totalPps > 0) {
        gameData.cookies += totalPps;
        addXP(Math.ceil(totalPps * 0.1)); // Пассивный опыт
    }

    // Обработка таймеров фермы и ивентов
    if (typeof updateFarmLoop === 'function') updateFarmLoop();
    if (typeof updateEventLoop === 'function') updateEventLoop();

    updateUI();
}

// --- ОБНОВЛЕНИЕ ТЕКСТА И ИНТЕРФЕЙСА (UI) ---
function updateUI() {
    document.getElementById('cookies-count').innerText = gameData.cookies;
    document.getElementById('click-power-show').innerText = gameData.clickPower * (gameData.activeSkin === '👑' ? 3 : 1);
    
    // Вычисляем общий PPS для табло
    let displayPps = gameData.autoClickers;
    gameData.ownedSkins.forEach(id => { if (SKINS_DATABASE[id]) displayPps += SKINS_DATABASE[id].bonus; });
    document.getElementById('pps-count').innerText = displayPps;
    
    // Обновляем быстрый магазин
    document.getElementById('q-click-cost').innerText = gameData.clickUpgradeCost;
    document.getElementById('btn-quick-click').disabled = gameData.cookies < gameData.clickUpgradeCost;
    
    document.getElementById('q-pps-cost').innerText = gameData.autoClickerCost;
    document.getElementById('btn-quick-pps').disabled = gameData.cookies < gameData.autoClickerCost;

    // Шкала XP
    document.getElementById('pusheen-rank').innerText = `🐱 Ур. ${gameData.level}`;
    let xpPercent = Math.min(100, (gameData.xp / gameData.xpNeeded) * 100);
    document.getElementById('xp-bar-fill').style.width = `${xpPercent}%`;
    
    // Отображаем надетый скин на главном экране
    document.getElementById('pusheen').innerText = gameData.activeSkin;
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
            // Восстанавливаем скин на главном экране
            document.getElementById('pusheen').innerText = gameData.activeSkin;
        } catch(e) {
            console.log("Ошибка загрузки данных", e);
        }
    }
}
