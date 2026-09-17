// --- СИСТЕМА ОГОРОДА И СИМУЛЯТОРА ДОМА (ПРОФЕССИОНАЛЬНАЯ ВЕРСИЯ) ---
let farmPlots = [
    { id: 0, planted: false, type: null, progress: 0, lvlNeeded: 1 },
    { id: 1, planted: false, type: null, progress: 0, lvlNeeded: 2 },
    { id: 2, planted: false, type: null, progress: 0, lvlNeeded: 4 },
    { id: 3, planted: false, type: null, progress: 0, lvlNeeded: 6 }
];

let shopSubTab = 'seeds';
let catFedUntil = 0; // Время сытости Пушина в миллисекундах

// Расширенная база данных семян и урожая (Plants vs. Zombies стиль)
const CROP_DETAILS = {
    wheat: { name: "Золотая Пшеница 🌾", time: 10, xp: 5, icon: "🌾" },
    berry: { name: "Садовая Смородина 🍇", time: 25, xp: 12, icon: "🍇" },
    blueberry: { name: "Лесная Голубика 🧊", time: 50, xp: 28, icon: "🧊" },
    strawberry: { name: "Сочная Клубника 🍓", time: 80, xp: 45, icon: "🍓" }
};

// Мягкие звуки кликов по интерфейсу смартфона
function playUiSound() {
    const uiSound = document.getElementById('sound-ui');
    if (uiSound) {
        uiSound.currentTime = 0;
        uiSound.play().catch(() => {});
    }
}

// Инициализация при старте (Запускается из game.js)
function initFarmSystem() {
    let timePassedSeconds = Math.floor((Date.now() - gameData.lastSaveTime) / 1000);
    if (timePassedSeconds > 10 && timePassedSeconds < 86400) {
        farmPlots.forEach(plot => {
            if (plot.planted && plot.progress < 100) {
                let cropTime = CROP_DETAILS[plot.type].time;
                let addedProgress = (timePassedSeconds / cropTime) * 100;
                plot.progress = Math.min(100, plot.progress + addedProgress);
            }
        });
        console.log("Огород: Пассивный оффлайн-рост успешно рассчитан!");
    }
}

// Посекундный игровой цикл фермы
function updateFarmLoop() {
    farmPlots.forEach(plot => {
        if (plot.planted && plot.progress < 100) {
            let cropTime = CROP_DETAILS[plot.type].time;
            plot.progress += (1 / cropTime) * 100;
            if (plot.progress >= 100) plot.progress = 100;
        }
    });

    if (currentMainPanel === 'home') renderHomeSystem();
    if (currentMainPanel === 'farm') renderFarmPlots();
}

// --- ВИЗУАЛЬНАЯ ОТРИСОВКА ГРЯДОК ( Plants vs. Zombies ) ---
function renderFarmPlots() {
    const container = document.getElementById('farm-plots-container');
    if (!container) return;

    let html = '';
    farmPlots.forEach(plot => {
        let isLocked = gameData.level < plot.lvlNeeded;
        
        if (isLocked) {
            html += `
                <div class="farm-plot locked">
                    <div style="font-size: 2.2rem;">🔒</div>
                    <h4>Грядка #${plot.id + 1}</h4>
                    <p style="font-size:0.8rem; color:#7f8c8d; margin:4px 0 0 0;">Нужен Уровень ${plot.lvlNeeded}</p>
                </div>
            `;
        } else if (!plot.planted) {
            html += `
                <div class="farm-plot">
                    <div style="font-size: 2.2rem;">🕳️</div>
                    <h4>Пустая земля</h4>
                    <select id="plant-select-${plot.id}" style="padding:6px; margin-bottom:8px; border-radius:10px; border:1px solid #ccc; font-weight:bold; font-size:0.8rem; width:95%;">
                        <option value="wheat">🌾 Пшеница (${gameData.wheatSeeds} шт)</option>
                        <option value="berry">🍇 Смородина (${gameData.berrySeeds} шт)</option>
                        <option value="blueberry">🧊 Голубика (${gameData.blueberrySeeds} шт)</option>
                        <option value="strawberry">🍓 Клубника (${gameData.strawberrySeeds || 0} шт)</option>
                    </select>
                    <button class="buy-btn" style="background:#55efc4; padding:6px 12px; width:90%; font-size:0.85rem;" onclick="plantCrop(${plot.id})">Посадить</button>
                </div>
            `;
        } else if (plot.progress < 100) {
            html += `
                <div class="farm-plot" style="background:#f7fff7;">
                    <div style="font-size: 2.2rem; animation: floatUp 2s infinite ease-in-out;">🌱</div>
                    <h4>Рост: ${Math.floor(plot.progress)}%</h4>
                    <p style="margin:2px 0; font-size:0.8rem; color:#7f8c8d;">${CROP_DETAILS[plot.type].name}</p>
                    <div style="background:#eee; height:8px; border-radius:5px; overflow:hidden; border:1px solid #ddd; margin:4px 5px 0 5px;">
                        <div style="background:linear-gradient(90deg, #55efc4, #2ed573); width:${plot.progress}%; height:100%;"></div>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="farm-plot" style="border-color:#2ed573; background:#e3fcef; transform: scale(1.02);">
                    <div style="font-size: 2.6rem;">${CROP_DETAILS[plot.type].icon}</div>
                    <h4 style="color:#2ed573; margin:4px 0;">Созрело!</h4>
                    <button class="buy-btn" style="background:#2ed573; width:90%;" onclick="harvestCrop(${plot.id})">Собрать 🧺</button>
                </div>
            `;
        }
    });

    container.innerHTML = html;
    
    // Рассчитываем и обновляем табло пассивного дохода от ресурсов на складе
    let farmPps = (gameData.inventory.wheat * 0.5) + (gameData.inventory.berry * 1.5) + (gameData.inventory.blueberry * 4.0) + ((gameData.inventory.strawberry || 0) * 8.0);
    document.getElementById('farm-pps-count').innerText = Math.floor(farmPps);
}

function plantCrop(plotId) {
    playUiSound();
    const select = document.getElementById(`plant-select-${plotId}`);
    let cropType = select.value;

    if (cropType === 'wheat' && gameData.wheatSeeds > 0) { gameData.wheatSeeds--; }
    else if (cropType === 'berry' && gameData.berrySeeds > 0) { gameData.berrySeeds--; }
    else if (cropType === 'blueberry' && gameData.blueberrySeeds > 0) { gameData.blueberrySeeds--; }
    else if (cropType === 'strawberry' && (gameData.strawberrySeeds || 0) > 0) { gameData.strawberrySeeds--; }
    else {
        if (typeof showGameAlert === 'function') showGameAlert("❌ Нет семян", "У тебя закончились семена этого растения! Загляни во вкладку Кухня.", "common");
        return;
    }

    let plot = farmPlots.find(p => p.id === plotId);
    plot.planted = true;
    plot.type = cropType;
    plot.progress = 0;

    renderFarmPlots();
}

function harvestCrop(plotId) {
    let plot = farmPlots.find(p => p.id === plotId);
    let crop = plot.type;

    if (!gameData.inventory[crop]) gameData.inventory[crop] = 0;
    gameData.inventory[crop]++;
    
    if (typeof addXP === 'function') addXP(CROP_DETAILS[crop].xp);

    plot.planted = false;
    plot.type = null;
    plot.progress = 0;

    renderFarmPlots();
    if (typeof updateUI === 'function') updateUI();
}

// --- УХОД ЗА КОТИКОМ И СЫТОСТЬ (ДОМ ПУШИНА) ---
function getHomeFoodBonus() {
    return Date.now() < catFedUntil ? 100 : 0; // +100% (удвоение) всего дохода, если кот сыт
}

function renderHomeSystem() {
    const statusText = document.getElementById('home-cat-status');
    const bonusText = document.getElementById('home-cat-bonus');
    const feedBtn = document.getElementById('btn-feed-cat');
    
    if (!statusText) return;

    let timeLeft = Math.ceil((catFedUntil - Date.now()) / 1000);
    if (timeLeft > 0) {
        statusText.innerText = `Сытый & Довольный 🥰 (${timeLeft}с)`;
        statusText.style.color = '#2ed573';
        bonusText.innerText = '+100%';
        bonusText.style.color = '#2ed573';
        feedBtn.disabled = true;
    } else {
        statusText.innerText = "Голодный 😿";
        statusText.style.color = '#e74c3c';
        bonusText.innerText = '+0%';
        bonusText.style.color = '#4a4a4a';
        feedBtn.disabled = gameData.inventory.wheat < 100;
    }
}

function feedPusheen() {
    if (gameData.inventory.wheat >= 100) {
        gameData.inventory.wheat -= 100;
        catFedUntil = Date.now() + 120000; // Кот сыт на 2 минуты
        renderHomeSystem();
        if (typeof updateUI === 'function') updateUI();
        if (typeof showGameAlert === 'function') showGameAlert("🥣 Ам-ням!", "Пушин слопал вкусную кашу из пшеницы и замурчал! Весь пассивный доход удвоен!", "rare");
    }
}

// МЕТКА_JS_КОНЦА_ЧАСТИ_4_1
// --- КУХНЯ-МАГАЗИН (🌱 СЕМЕНА И 🧁 КРАФТ ВЫПЕЧКИ) ---
function switchShopSubTab(subTabId) {
    playUiSound();
    shopSubTab = subTabId;
    document.querySelectorAll('.shop-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderShopItems();
}

function renderShopItems() {
    const container = document.getElementById('shop-items-container');
    if (!container) return;

    let html = '';

    if (shopSubTab === 'seeds') {
        html += `
            <div class="shop-item">
                <div class="item-info"><h3>Мешок семян Пшеницы 🌾</h3><p>Цена: 20 🍪</p></div>
                <button class="buy-btn" onclick="buySeeds('wheat', 20)">Купить</button>
            </div>
            <div class="shop-item">
                <div class="item-info"><h3>Семена Смородины 🍇</h3><p>Цена: 100 🍪</p></div>
                <button class="buy-btn" onclick="buySeeds('berry', 100)">Купить</button>
            </div>
            <div class="shop-item">
                <div class="item-info"><h3>Семена Голубики 🧊</h3><p>Цена: 400 🍪</p></div>
                <button class="buy-btn" onclick="buySeeds('blueberry', 400)">Купить</button>
            </div>
            <div class="shop-item">
                <div class="item-info"><h3>Семена Клубники 🍓</h3><p>Цена: 1000 🍪</p></div>
                <button class="buy-btn" onclick="buySeeds('strawberry', 1000)">Купить</button>
            </div>
        `;
    } else if (shopSubTab === 'craft') {
        html += `
            <div class="shop-item">
                <div class="item-info">
                    <h3>Французский Круассан 🥐</h3>
                    <p>Требует: 50 Пшеницы 🌾 | Доход: +15/с навсегда</p>
                </div>
                <button class="buy-btn" onclick="craftItem('croissant')">Испечь</button>
            </div>
            <div class="shop-item">
                <div class="item-info">
                    <h3>Ягодный Пирог 🥧</h3>
                    <p>Требует: 30 Смородины 🍇 | Доход: +60/с навсегда</p>
                </div>
                <button class="buy-btn" onclick="craftItem('pie')">Испечь</button>
            </div>
        `;
    }

    container.innerHTML = html;
}

function buySeeds(type, cost) {
    playUiSound();
    if (gameData.cookies >= cost) {
        gameData.cookies -= cost;
        if (type === 'wheat') gameData.wheatSeeds++;
        if (type === 'berry') gameData.berrySeeds++;
        if (type === 'blueberry') gameData.blueberrySeeds++;
        if (type === 'strawberry') gameData.strawberrySeeds = (gameData.strawberrySeeds || 0) + 1;
        
        renderShopItems();
        if (typeof updateUI === 'function') updateUI();
        if (typeof saveGame === 'function') saveGame();
    } else {
        if (typeof showGameAlert === 'function') showGameAlert("❌ Нет печенек", "Тебе не хватает печенек для покупки семян!", "common");
    }
}

function craftItem(type) {
    playUiSound();
    if (type === 'croissant') {
        if (gameData.inventory.wheat >= 50) {
            gameData.inventory.wheat -= 50;
            gameData.autoClickers += 15;
            if (typeof showGameAlert === 'function') showGameAlert("🥐 М-м-м!", "Какой аромат! Ты испекла французский круассан! Пассивный доход увеличен на +15/с!", "rare");
        } else { if (typeof showGameAlert === 'function') showGameAlert("❌ Мало пшеницы", "Нужно собрать 50 шт. пшеницы на огороде!", "common"); return; }
    }
    if (type === 'pie') {
        if (gameData.inventory.berry >= 30) {
            gameData.inventory.berry -= 30;
            gameData.autoClickers += 60;
            if (typeof showGameAlert === 'function') showGameAlert("🥧 Ух ты!", "Настоящий ягодный пирог со смородиной готов! Пассивный доход увеличен на +60/с!", "epic");
        } else { if (typeof showGameAlert === 'function') showGameAlert("❌ Мало ягод", "Нужно собрать 30 шт. смородины на огороде!", "common"); return; }
    }
    renderShopItems();
    if (typeof updateUI === 'function') updateUI();
    if (typeof saveGame === 'function') saveGame();
}

// --- 📈 ПРОФЕССИОНАЛЬНАЯ БИРЖА С ЛИНЕЙНЫМ ГРАФИКОМ ---
let marketPrice = 5.0; 
let marketHistory = [5.0, 4.8, 5.2, 5.0, 5.5]; 
let marketInterval = null;

function renderMarketSystem() {
    let arrow = marketHistory[marketHistory.length - 1] >= marketHistory[marketHistory.length - 2] ? '▲' : '▼';
    let color = arrow === '▲' ? '#2ed573' : '#ff4757';
    
    let html = `
        <h3>📈 Живая Биржа Ягод</h3>
        <p>Курс меняется каждые 3 секунды. Лови момент!</p>
        <div style="background:#f1f2f6; border-radius:14px; padding:12px; text-align:center; margin-bottom:12px; border:2px solid #fff;">
            <span style="font-size:1.1rem; font-weight:bold; color:#4a3c3c;">🍇 Курс ягод: </span>
            <span id="market-price-text" style="font-size:1.6rem; font-weight:bold; color:${color};">
                ${marketPrice.toFixed(2)} 🍪 ${arrow}
            </span>
        </div>
        <canvas id="market-canvas" width="300" height="130"></canvas>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:15px;">
            <button class="buy-btn" style="background:#2ed573;" onclick="sellCrops('all')">Продать ВСЁ</button>
            <button class="buy-btn" style="background:#ff4757;" onclick="sellCrops('half')">Продать 50%</button>
        </div>
    `;
    return html;
}

function startMarketCanvas() {
    if (marketInterval) clearInterval(marketInterval);
    
    marketInterval = setInterval(() => {
        let change = (Math.random() - 0.47) * 2.2; 
        marketPrice = Math.max(1.5, marketPrice + change); 
        
        marketHistory.push(marketPrice);
        if (marketHistory.length > 15) marketHistory.shift(); 
        
        const priceText = document.getElementById('market-price-text');
        if (priceText) {
            let arrow = marketHistory[marketHistory.length - 1] >= marketHistory[marketHistory.length - 2] ? '▲' : '▼';
            let color = arrow === '▲' ? '#2ed573' : '#ff4757';
            priceText.innerText = `${marketPrice.toFixed(2)} 🍪 ${arrow}`;
            priceText.style.color = color;
        }
        
        drawMarketGraph();
    }, 3000);

    setTimeout(drawMarketGraph, 120);
}

function drawMarketGraph() {
    const canvas = document.getElementById('market-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Сетка на фоне холста биржи
    ctx.strokeStyle = '#3e4452';
    ctx.lineWidth = 0.5;
    for (let i = 20; i < canvas.height; i += 25) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    if (marketHistory.length < 2) return;

    // Плавная линия трейдинга курса
    ctx.strokeStyle = '#f7a8b8';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    
    let step = canvas.width / (marketHistory.length - 1);
    let minP = Math.min(...marketHistory);
    let maxP = Math.max(...marketHistory);
    
    // Защита от деления на 0, если все цены в истории равны
    let range = maxP - minP;
    if (range === 0) range = 1;

    marketHistory.forEach((val, index) => {
        let x = index * step;
        let y = canvas.height - 15 - ((val - minP) / range) * (canvas.height - 30);
        
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    
    ctx.stroke();
}

function sellCrops(mode) {
    playUiSound();
    if (!gameData.inventory.strawberry) gameData.inventory.strawberry = 0;
    
    let totalCrops = gameData.inventory.wheat + gameData.inventory.berry + gameData.inventory.blueberry + gameData.inventory.strawberry;
    if (totalCrops === 0) {
        if (typeof showGameAlert === 'function') showGameAlert("🎒 Склад пуст!", "У тебя нет собранного урожая в инвентаре для продажи!", "common");
        return;
    }

    let multiplier = mode === 'all' ? 1.0 : 0.5;
    let earned = 0;

    let wheatSold = Math.floor(gameData.inventory.wheat * multiplier);
    let berrySold = Math.floor(gameData.inventory.berry * multiplier);
    let blueberrySold = Math.floor(gameData.inventory.blueberry * multiplier);
    let strawberrySold = Math.floor(gameData.inventory.strawberry * multiplier);

    earned += wheatSold * (marketPrice * 0.4);
    earned += berrySold * (marketPrice * 1.5);
    earned += blueberrySold * (marketPrice * 4.0);
    earned += strawberrySold * (marketPrice * 8.0);
    
    earned = Math.floor(earned);

    gameData.inventory.wheat -= wheatSold;
    gameData.inventory.berry -= berrySold;
    gameData.inventory.blueberry -= blueberrySold;
    gameData.inventory.strawberry -= strawberrySold;

    gameData.cookies += earned;

    if (typeof showGameAlert === 'function') showGameAlert("💰 Сделка закрыта!", `Ты успешно продала урожай на бирже и заработала +${earned} печенек!`, "rare");
    
    let appBox = document.getElementById('phone-app-box');
    if (appBox && appBox.classList.contains('active')) {
        document.getElementById('app-body').innerHTML = renderMarketSystem();
        drawMarketGraph();
    }
    if (typeof updateUI === 'function') updateUI();
    if (typeof saveGame === 'function') saveGame();
}
