// --- ДАННЫЕ ОГОРОДА И КУХНИ ---
let farmPlots = [
    { id: 0, planted: false, type: null, progress: 0, lvlNeeded: 1 },
    { id: 1, planted: false, type: null, progress: 0, lvlNeeded: 2 },
    { id: 2, planted: false, type: null, progress: 0, lvlNeeded: 4 },
    { id: 3, planted: false, type: null, progress: 0, lvlNeeded: 6 }
];

let shopSubTab = 'seeds';

// Статус дома: время, до которого Пушин сыт
let catFedUntil = 0; 

const CROP_DETAILS = {
    wheat: { name: "Пшеница 🌾", time: 10, xp: 5, icon: "🌾" },
    berry: { name: "Смородина 🍇", time: 30, xp: 15, icon: "🍇" },
    blueberry: { name: "Голубика 🧊", time: 60, xp: 35, icon: "🧊" }
};

// --- ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ ФЕРМЫ ---
function initFarmSystem() {
    // Рассчитываем оффлайн-доход при заходе в игру
    let timePassedSeconds = Math.floor((Date.now() - gameData.lastSaveTime) / 1000);
    if (timePassedSeconds > 10 && timePassedSeconds < 86400) {
        // За время отсутствия грядки могли вырасти
        farmPlots.forEach(plot => {
            if (plot.planted && plot.progress < 100) {
                let cropTime = CROP_DETAILS[plot.type].time;
                let addedProgress = (timePassedSeconds / cropTime) * 100;
                plot.progress = Math.min(100, plot.progress + addedProgress);
            }
        });
        console.log(`Ферма: Обработан оффлайн-режим за ${timePassedSeconds} секунд.`);
    }
}

// Посекундный цикл фермы
function updateFarmLoop() {
    farmPlots.forEach(plot => {
        if (plot.planted && plot.progress < 100) {
            let cropTime = CROP_DETAILS[plot.type].time;
            plot.progress += (1 / cropTime) * 100;
            if (plot.progress >= 100) {
                plot.progress = 100;
            }
        }
    });

    // Обновляем текст статуса сытости на панели дома, если она открыта
    if (currentMainPanel === 'home') {
        renderHomeSystem();
    }
    // Обновляем огород, если открыт
    if (currentMainPanel === 'farm') {
        renderFarmPlots();
    }
}

// --- УПРАВЛЕНИЕ ОГОРОДОМ (ГРЯДКИ) ---
function renderFarmPlots() {
    const container = document.getElementById('farm-plots-container');
    if (!container) return;

    let html = '';
    farmPlots.forEach(plot => {
        let isLocked = gameData.level < plot.lvlNeeded;
        
        if (isLocked) {
            html += `
                <div class="farm-plot locked">
                    <div style="font-size: 2rem;">🔒</div>
                    <h4>Грядка #${plot.id + 1}</h4>
                    <p style="font-size:0.8rem; color:#7f8c8d;">Нужен Уровень ${plot.lvlNeeded}</p>
                </div>
            `;
        } else if (!plot.planted) {
            html += `
                <div class="farm-plot">
                    <div style="font-size: 2rem;">🕳️</div>
                    <h4>Пустая грядка</h4>
                    <select id="plant-select-${plot.id}" style="padding:4px; margin-bottom:5px; border-radius:6px;">
                        <option value="wheat">🌾 Пшеница (Запас: ${gameData.wheatSeeds})</option>
                        <option value="berry">🍇 Смородина (Запас: ${gameData.berrySeeds})</option>
                        <option value="blueberry">🧊 Голубика (Запас: ${gameData.blueberrySeeds})</option>
                    </select>
                    <button class="buy-btn" style="background:#55efc4; padding:5px 10px;" onclick="plantCrop(${plot.id})">Посадить</button>
                </div>
            `;
        } else if (plot.progress < 100) {
            html += `
                <div class="farm-plot">
                    <div style="font-size: 2rem;">🌱</div>
                    <h4>Рост: ${Math.floor(plot.progress)}%</h4>
                    <p>${CROP_DETAILS[plot.type].name}</p>
                    <div style="background:#eee; height:6px; border-radius:3px; overflow:hidden;">
                        <div style="background:var(--main-color); width:${plot.progress}%; height:100%;"></div>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="farm-plot" style="border-color:#2ed573; background:#f5fff7;">
                    <div style="font-size: 2.3rem;">${CROP_DETAILS[plot.type].icon}</div>
                    <h4 style="color:#2ed573; margin:5px 0;">Созрело!</h4>
                    <button class="buy-btn" style="background:#2ed573;" onclick="harvestCrop(${plot.id})">Собрать урожай</button>
                </div>
            `;
        }
    });

    container.innerHTML = html;
    
    // Дополнительно выводим оффлайн-доход огорода на верхнее табло
    let farmPps = (gameData.inventory.wheat * 0.5) + (gameData.inventory.berry * 1.5) + (gameData.inventory.blueberry * 4.0);
    document.getElementById('farm-pps-count').innerText = Math.floor(farmPps);
}

function plantCrop(plotId) {
    const select = document.getElementById(`plant-select-${plotId}`);
    let cropType = select.value;

    if (cropType === 'wheat' && gameData.wheatSeeds > 0) { gameData.wheatSeeds--; }
    else if (cropType === 'berry' && gameData.berrySeeds > 0) { gameData.berrySeeds--; }
    else if (cropType === 'blueberry' && gameData.blueberrySeeds > 0) { gameData.blueberrySeeds--; }
    else {
        alert("У тебя нет семян этого растения! Купи их на Кухне.");
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

    gameData.inventory[crop]++;
    if (typeof addXP === 'function') addXP(CROP_DETAILS[crop].xp);

    // Очищаем грядку
    plot.planted = false;
    plot.type = null;
    plot.progress = 0;

    renderFarmPlots();
    if (typeof updateUI === 'function') updateUI();
}

// --- УХОД ЗА КОТИКОМ (ДОМ) ---
function getHomeFoodBonus() {
    return Date.now() < catFedUntil ? 100 : 0; // +100% к доходу если сыт
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
        catFedUntil = Date.now() + 120000; // Сытость на 2 минуты (для теста, потом увеличим)
        renderHomeSystem();
        if (typeof updateUI === 'function') updateUI();
        alert("🥣 Пушин слопал кашу из пшеницы и теперь сыт! Твой пассивный доход удвоен!");
    }
}

// МЕТКА_JS_КОНЦА_ЧАСТИ_4_1
// --- КУХНЯ-МАГАЗИН (СЕМЕНА И ВЫПЕЧКА) ---
function switchShopSubTab(subTabId) {
    shopSubTab = subTabId;
    // Снимаем класс active со всех вкладок внутри Кухни
    document.querySelectorAll('.shop-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    // Подсвечиваем нужную кнопку
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
                <div class="item-info"><h4>Мешок семян Пшеницы 🌾</h4><p>Цена: 20 🍪</p></div>
                <button class="buy-btn" onclick="buySeeds('wheat', 20)">Купить</button>
            </div>
            <div class="shop-item">
                <div class="item-info"><h4>Семена Смородины 🍇</h4><p>Цена: 100 🍪</p></div>
                <button class="buy-btn" onclick="buySeeds('berry', 100)">Купить</button>
            </div>
            <div class="shop-item">
                <div class="item-info"><h4>Семена Голубики 🧊</h4><p>Цена: 400 🍪</p></div>
                <button class="buy-btn" onclick="buySeeds('blueberry', 400)">Купить</button>
            </div>
        `;
    } else if (shopSubTab === 'craft') {
        html += `
            <div class="shop-item">
                <div class="item-info">
                    <h4>Французский Круассан 🥐</h4>
                    <p>Требует: 50 Пшеницы 🌾 | Доход: +15/с навсегда</p>
                </div>
                <button class="buy-btn" onclick="craftItem('croissant')">Испечь</button>
            </div>
            <div class="shop-item">
                <div class="item-info">
                    <h4>Ягодный Пирог 🥧</h4>
                    <p>Требует: 30 Смородины 🍇 | Доход: +60/с навсегда</p>
                </div>
                <button class="buy-btn" onclick="craftItem('pie')">Испечь</button>
            </div>
        `;
    }

    container.innerHTML = html;
}

function buySeeds(type, cost) {
    if (gameData.cookies >= cost) {
        gameData.cookies -= cost;
        if (type === 'wheat') gameData.wheatSeeds++;
        if (type === 'berry') gameData.berrySeeds++;
        if (type === 'blueberry') gameData.blueberrySeeds++;
        
        renderShopItems();
        if (typeof updateUI === 'function') updateUI();
        saveGame();
    } else {
        alert("Недостаточно печенек!");
    }
}

function craftItem(type) {
    if (type === 'croissant') {
        if (gameData.inventory.wheat >= 50) {
            gameData.inventory.wheat -= 50;
            gameData.autoClickers += 15; // Постоянный буст к пассивному доходу!
            alert("🥐 М-м-м, какой аромат! Ты испекла французский круассан! Пассивный доход увеличен на +15/с!");
        } else { alert("Недостаточно пшеницы! Нужно 50 шт."); return; }
    }
    if (type === 'pie') {
        if (gameData.inventory.berry >= 30) {
            gameData.inventory.berry -= 30;
            gameData.autoClickers += 60; // Ещё более мощный постоянный буст
            alert("🥧 Ух ты! Настоящий ягодный пирог со смородиной готов! Пассивный доход увеличен на +60/с!");
        } else { alert("Недостаточно смородины! Нужно 30 шт."); return; }
    }
    renderShopItems();
    if (typeof updateUI === 'function') updateUI();
    saveGame();
}

// --- 📈 НАСТОЯЩАЯ БИРЖА С БЕГУЩИМ ЛИНЕЙНЫМ ГРАФИКОМ ---
let marketPrice = 5.0; // Стартовая цена ягод
let marketHistory =; // Массив для точек графика
let marketInterval = null;

function renderMarketSystem() {
    let arrow = marketHistory[marketHistory.length - 1] >= marketHistory[marketHistory.length - 2] ? '▲' : '▼';
    let color = arrow === '▲' ? '#2ed573' : '#ff4757';
    
    let html = `
        <h3>📈 Биржа Ягод и Скинов</h3>
        <p>Курс меняется каждые 3 секунды. Поймай лучшую цену!</p>
        <div style="background:#f1f2f6; border-radius:12px; padding:10px; text-align:center; margin-bottom:10px;">
            <span style="font-size:1.1rem; font-weight:bold;">🍇 Курс ягод: </span>
            <span id="market-price-text" style="font-size:1.5rem; font-weight:bold; color:${color};">
                ${marketPrice.toFixed(2)} 🍪 ${arrow}
            </span>
        </div>
        <canvas id="market-canvas" width="300" height="120"></canvas>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:15px;">
            <button class="buy-btn" style="background:#2ed573;" onclick="sellCrops('all')">Продать урожай</button>
            <button class="buy-btn" style="background:#ff4757;" onclick="sellCrops('half')">Продать 50%</button>
        </div>
    `;
    return html;
}

function startMarketCanvas() {
    if (marketInterval) clearInterval(marketInterval);
    
    // Цикл обновления цен каждые 3 секунды (для динамики)
    marketInterval = setInterval(() => {
        let change = (Math.random() - 0.48) * 2; // Небольшой уклон вверх
        marketPrice = Math.max(1.5, marketPrice + change); // Цена не падает ниже 1.5
        
        marketHistory.push(marketPrice);
        if (marketHistory.length > 15) marketHistory.shift(); // Ограничиваем ширину графика
        
        // Обновляем текст, если приложение биржи открыто в телефоне
        const priceText = document.getElementById('market-price-text');
        if (priceText) {
            let arrow = marketHistory[marketHistory.length - 1] >= marketHistory[marketHistory.length - 2] ? '▲' : '▼';
            let color = arrow === '▲' ? '#2ed573' : '#ff4757';
            priceText.innerText = `${marketPrice.toFixed(2)} 🍪 ${arrow}`;
            priceText.style.color = color;
        }
        
        drawMarketGraph();
    }, 3000);

    // Запускаем отрисовку с задержкой, чтобы canvas успел появиться в DOM
    setTimeout(drawMarketGraph, 100);
}

function drawMarketGraph() {
    const canvas = document.getElementById('market-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Фон сетки
    ctx.strokeStyle = '#3e4452';
    ctx.lineWidth = 0.5;
    for (let i = 20; i < canvas.height; i += 20) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Рисуем бегущую линию трейдинга
    ctx.strokeStyle = '#f7a8b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    let step = canvas.width / (marketHistory.length - 1);
    let minP = Math.min(...marketHistory) - 1;
    let maxP = Math.max(...marketHistory) + 1;
    let range = maxP - minP;

    marketHistory.forEach((val, index) => {
        let x = index * step;
        // Переворачиваем ось Y, чтобы большие цены были вверху
        let y = canvas.height - ((val - minP) / range) * canvas.height;
        
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    
    ctx.stroke();
}

function sellCrops(mode) {
    let totalCrops = gameData.inventory.wheat + gameData.inventory.berry + gameData.inventory.blueberry;
    if (totalCrops === 0) {
        alert("Твой инвентарь пуст! Нечего продавать.");
        return;
    }

    let multiplier = mode === 'all' ? 1.0 : 0.5;
    let earned = 0;

    // Базовые цены, умноженные на динамический курс биржи
    let wheatSold = Math.floor(gameData.inventory.wheat * multiplier);
    let berrySold = Math.floor(gameData.inventory.berry * multiplier);
    let blueberrySold = Math.floor(gameData.inventory.blueberry * multiplier);

    earned += wheatSold * (marketPrice * 0.4);
    earned += berrySold * (marketPrice * 1.5);
    earned += blueberrySold * (marketPrice * 4.0);
    
    earned = Math.floor(earned);

    gameData.inventory.wheat -= wheatSold;
    gameData.inventory.berry -= berrySold;
    gameData.inventory.blueberry -= blueberrySold;

    gameData.cookies += earned;

    alert(`💰 Биржа: Сделка совершена! Продано ягод и зерна. Заработано +${earned} печенек!`);
    
    // Перерисовываем экран
    let appBox = document.getElementById('phone-app-box');
    if (appBox && appBox.classList.contains('active')) {
        appBody.innerHTML = renderMarketSystem();
        drawMarketGraph();
    }
    if (typeof updateUI === 'function') updateUI();
    saveGame();
}
