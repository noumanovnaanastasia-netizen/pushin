// --- НАСТРОЙКА СЛУЧАЙНЫХ СОБЫТИЙ (РОБЛОКС-СТАЙЛ) ---
let eventTimer = 0;
const EVENT_INTERVAL = 300; // Событие срабатывает каждые 5 минут (300 секунд)

// Для тестов на GitHub сделаем появление быстрее — раз в 45 секунд, чтобы игроку не пришлось долго ждать
const TEST_EVENT_INTERVAL = 45; 

// База данных 8 уникальных событий с редкостями
const EVENTS_DATABASE = [
    { id: 'storm', name: "Сахарный Шторм ⚡", rarity: "epic", desc: "Бешеный клик! Сила нажатия умножена на х5 на 20 сек!" },
    { id: 'mouse', name: "Нашествие мышей! 🐭", rarity: "common", desc: "Мышка прибежала! Быстро кликни на неё, пока она не утащила ягоды!" },
    { id: 'package', name: "Посылка от фаната 📦", rarity: "rare", desc: "Кликни по посылке 5 раз, чтобы забрать монеты и семена!" },
    { id: 'king', name: "Королевский визит 👑", rarity: "legendary", desc: "В гостях Пушин-Король! Весь пассивный доход х5 на 30 сек!" },
    { id: 'star', name: "Падающая звезда ⭐", rarity: "legendary", desc: "Поймай звезду! Она взорвется и выдаст тонну готового урожая!" },
    { id: 'sleep', name: "Сонный час 💤", rarity: "common", desc: "Пушин уснул, пассивный доход упал на 50%! Кликни 10 раз, чтобы разбудить." },
    { id: 'luck', name: "Час Удачи 🎰", rarity: "rare", desc: "Рулетка мгновенно перезарядилась и дает только лучшие призы!" },
    { id: 'cookie', name: "Золотая Печенька 🍪", rarity: "common", desc: "Поймай летающую печеньку и получи мгновенный куш монет!" }
];

function initEventSystem() {
    console.log("Система случайных событий запущена!");
}

function updateEventLoop() {
    eventTimer++;
    
    // Используем тестовый интервал в 45 секунд, чтобы игру было интересно проверять на гитхабе
    if (eventTimer >= TEST_EVENT_INTERVAL) {
        eventTimer = 0;
        triggerRandomEvent();
    }

    // Обработка активных бустов времени
    if (activeBuff.active) {
        let timeLeft = Math.ceil((activeBuff.endTime - Date.now()) / 1000);
        if (timeLeft <= 0) {
            activeBuff.active = false;
            activeBuff.name = "Нет";
            document.getElementById('buff-indicator').style.display = 'none';
        } else {
            document.getElementById('buff-name').innerText = activeBuff.name;
            document.getElementById('buff-timer').innerText = timeLeft;
        }
    }
}

function triggerRandomEvent() {
    // Включаем победный фанфарный звук, чтобы привлечь игрока, если он отошел
    const fanfare = document.getElementById('sound-fanfare');
    if (fanfare) { fanfare.currentTime = 0; fanfare.play().catch(() => {}); }

    // Роллим случайное событие на основе редкостей
    let rand = Math.random();
    let selectedEvent = EVENTS_DATABASE[7]; // По умолчанию золотая печенька

    if (rand < 0.04) selectedEvent = EVENTS_DATABASE.find(e => e.id === 'king');     // Король (Легендарное 4%)
    else if (rand < 0.08) selectedEvent = EVENTS_DATABASE.find(e => e.id === 'star'); // Звезда (Легендарное 4%)
    else if (rand < 0.20) selectedEvent = EVENTS_DATABASE.find(e => e.id === 'storm'); // Шторм (Эпическое 12%)
    else if (rand < 0.35) selectedEvent = EVENTS_DATABASE.find(e => e.id === 'package'); // Посылка (Редкое 15%)
    else if (rand < 0.50) selectedEvent = EVENTS_DATABASE.find(e => e.id === 'luck');   // Удача (Редкое 15%)
    else if (rand < 0.70) selectedEvent = EVENTS_DATABASE.find(e => e.id === 'mouse');  // Мышь (Обычное 20%)
    else if (rand < 0.85) selectedEvent = EVENTS_DATABASE.find(e => e.id === 'sleep');  // Сон (Обычное 15%)
    else selectedEvent = EVENTS_DATABASE.find(e => e.id === 'cookie');                  // Печенька (Обычное 15%)

    // Выводим красивый текстовый баннер сверху экрана
    const banner = document.getElementById('event-banner');
    if (banner) {
        banner.className = `hidden-event`;
        // Вызываем перерисовку
        void banner.offsetWidth;
        banner.innerHTML = `
            <div style="font-size:0.8rem; letter-spacing:1px;">ВНЕЗАПНОЕ СОБЫТИЕ:</div>
            <div style="font-size:1.2rem; font-weight:bold;">${selectedEvent.name}</div>
            <div class="rarity-${selectedEvent.rarity}">Редкость: ${selectedEvent.rarity.toUpperCase()}</div>
            <div style="font-size:0.85rem; margin-top:3px; color:#5c4a4a;">${selectedEvent.desc}</div>
        `;
        banner.style.display = 'block';
        // Через 6 секунд баннер плавно прячется
        setTimeout(() => { banner.style.display = 'none'; }, 6000);
    }

    // Спавним интерактивный летающий объект на экране
    spawnEventObject(selectedEvent.id);
}

function spawnEventObject(eventId) {
    const zone = document.getElementById('floating-event-zone');
    if (!zone) return;

    const obj = document.createElement('div');
    obj.style.position = 'absolute';
    obj.style.cursor = 'pointer';
    obj.style.zIndex = '999';
    obj.style.transition = 'all 0.5s ease';
    
    // Случайное место на экране
    let posX = Math.floor(Math.random() * (window.innerWidth - 80));
    let posY = Math.floor(Math.random() * (window.innerHeight - 250)) + 100;
    obj.style.left = posX + 'px';
    obj.style.top = posY + 'px';

    // Внешний вид в зависимости от ивента (эмодзи)
    if (eventId === 'cookie') { obj.innerText = '⭐🍪'; obj.style.fontSize = '3rem'; obj.onclick = () => { gameData.cookies += 150; alert("Поймано! +150 🍪"); obj.remove(); }; }
    else if (eventId === 'star') { obj.innerText = '🌠'; obj.style.fontSize = '3.5rem'; obj.onclick = () => { gameData.inventory.berry += 20; gameData.inventory.blueberry += 10; alert("Звездный взрыв! На склад упало: 20 Смородины и 10 Голубики!"); obj.remove(); }; }
    else if (eventId === 'mouse') { obj.innerText = '🐭'; obj.style.fontSize = '2.5rem'; obj.onclick = () => { alert("Ура! Ты прогнала мышь-воришку кликом, припасы в безопасности!"); obj.remove(); }; }
    else if (eventId === 'package') {
        let clicks = 0; obj.innerText = '📦'; obj.style.fontSize = '3rem';
        obj.onclick = () => {
            clicks++; obj.style.transform = 'scale(1.2)'; setTimeout(() => obj.style.transform='scale(1)', 100);
            if (clicks >= 5) { gameData.wheatSeeds += 3; gameData.berrySeeds += 1; alert("Посылка открыта! Найдено: 3 семени пшеницы и 1 семя смородины!"); obj.remove(); }
        };
    }
    else if (eventId === 'storm') { obj.innerText = '⚡'; obj.style.fontSize = '3rem'; obj.onclick = () => { activeBuff.name = "Сахарный Шторм"; activeBuff.active = true; activeBuff.endTime = Date.now() + 20000; document.getElementById('buff-indicator').style.display = 'block'; obj.remove(); }; }
    else if (eventId === 'king') { obj.innerText = '👑'; obj.style.fontSize = '3.5rem'; obj.onclick = () => { activeBuff.name = "Королевский визит"; activeBuff.active = true; activeBuff.endTime = Date.now() + 30000; document.getElementById('buff-indicator').style.display = 'block'; obj.remove(); }; }
    else if (eventId === 'luck') { obj.innerText = '🎰'; obj.style.fontSize = '3rem'; obj.onclick = () => { gameData.lastWheelSpinTime = 0; alert("Рулетка перезагружена! Зайди в телефон и крути прямо сейчас!"); obj.remove(); }; }
    else if (eventId === 'sleep') {
        let wakeClicks = 0; obj.innerText = '💤'; obj.style.fontSize = '2.5rem';
        alert("⚠️ Ой! Пушин крепко заснул! Разбуди его кликами по значку сна, чтобы вернуть полный пассивный доход!");
        obj.onclick = () => {
            wakeClicks++; if (typeof addXP === 'function') addXP(5);
            if (wakeClicks >= 10) { alert("Пушин проснулся и готов кушать печеньки!"); obj.remove(); }
        };
    }

    zone.appendChild(obj);
    // Если игрок не нажал за 12 секунд — объект исчезает сам
    setTimeout(() => { if (obj.parentNode) obj.remove(); }, 12000);
}

// МЕТКА_JS_КОНЦА_ЧАСТИ_5_1
// --- ВСТРОЕННАЯ РУЛЕТКА (КОЛЕСО ФОРТУНЫ) ---
let isSpinningWheel = false;

function spinWheel() {
    if (isSpinningWheel) return;
    
    let now = Date.now();
    if (now - gameData.lastWheelSpinTime < 30000) {
        alert("Колесо ещё перезаряжается!");
        return;
    }

    isSpinningWheel = true;
    gameData.lastWheelSpinTime = now;
    if (typeof saveGame === 'function') saveGame();

    const wheel = document.getElementById('wheel');
    if (!wheel) return;

    // Крутим минимум на 3 полных оборота + случайный сектор
    let randomDegrees = Math.floor(Math.random() * 360) + 1080; 
    wheel.style.transform = `rotate(${randomDegrees}deg)`;

    // Посекундно блокируем кнопку
    checkWheelCooldown();

    setTimeout(() => {
        isSpinningWheel = false;
        wheel.style.transition = 'none';
        let actualDegrees = randomDegrees % 360;
        wheel.style.transform = `rotate(${actualDegrees}deg)`;
        
        // Возвращаем плавность анимации для следующего раза
        setTimeout(() => { wheel.style.transition = 'transform 3s cubic-bezier(0.1, 0.8, 0.3, 1)'; }, 50);

        // Расчет приза (4 сектора по 90 градусов с сочными эмодзи)
        if (actualDegrees >= 0 && actualDegrees < 90) {
            gameData.cookies += 100;
            alert("🎉 Сектор 🎁: Отличный приз! Получено +100 Печенек!");
        } else if (actualDegrees >= 90 && actualDegrees < 180) {
            gameData.cookies = Math.max(0, gameData.cookies - 20);
            alert("💥 Сектор 🐭: Ой-ой! Мышка утащила 20 печенек!");
        } else if (actualDegrees >= 180 && actualDegrees < 270) {
            activeBuff.name = "Турбо Клик";
            activeBuff.active = true;
            activeBuff.value = 3;
            activeBuff.endTime = Date.now() + 15000;
            if (document.getElementById('buff-indicator')) document.getElementById('buff-indicator').style.display = 'block';
            alert("⚡ Сектор 🔥: Режим Турбо-Клика! Сила клика +3 на 15 секунд!");
        } else {
            gameData.cookies += 400;
            alert("👑 Сектор 💎: МЕГА СУПЕР-ПРИЗ! Найдено +400 Печенек!");
        }

        if (typeof updateUI === 'function') updateUI();
        checkWheelCooldown();
    }, 3000);
}

function checkWheelCooldown() {
    const spinBtn = document.getElementById('spin-btn');
    const timerText = document.getElementById('wheel-timer-text');
    const countdown = document.getElementById('wheel-countdown');
    
    if (!spinBtn) return;

    let now = Date.now();
    let timePassed = now - gameData.lastWheelSpinTime;

    if (timePassed < 30000 && !isSpinningWheel) {
        spinBtn.disabled = true;
        if (timerText) timerText.style.display = 'block';
        if (countdown) countdown.innerText = Math.ceil((30000 - timePassed) / 1000);
    } else if (!isSpinningWheel) {
        spinBtn.disabled = false;
        if (timerText) timerText.style.display = 'none';
    }
}

// --- 🕹️ ИНТЕРАКТИВНЫЕ МИНИ-ИГРЫ ДЛЯ УДЕРЖАНИЯ ---
let mgTimerInterval = null;
let mgSpawnInterval = null;
let mgScore = 0;
let mgTimeLeft = 30;

function triggerMinigame(gameType) {
    // Закрываем телефон, чтобы открыть полноэкранный оверлей игры
    if (typeof togglePhone === 'function') togglePhone();
    
    const overlay = document.getElementById('minigame-overlay');
    overlay.style.display = 'flex';
    
    mgScore = 0;
    mgTimeLeft = 30;
    document.getElementById('mg-score').innerText = mgScore;
    document.getElementById('mg-timer').innerText = mgTimeLeft;
    
    const field = document.getElementById('minigame-field');
    field.innerHTML = '';

    if (gameType === 'catcher') {
        runCatcherGame();
    } else if (gameType === 'milk') {
        runMilkGame();
    }
}

// 1. МИНИ-ИГРА: ЛОВЕЦ ВКУСНЯШЕК В КОРЗИНУ 🧺
function runCatcherGame() {
    const basket = document.getElementById('basket-catcher');
    basket.style.display = 'block';
    basket.style.left = '50%';
    
    // Управление корзинкой (тапы по левой или правой стороне экрана)
    window.onpointerdown = function(e) {
        let basketLeft = parseInt(basket.style.left) || 50;
        if (e.clientX < window.innerWidth / 2) {
            basket.style.left = Math.max(10, basketLeft - 15) + '%';
        } else {
            basket.style.left = Math.min(90, basketLeft + 15) + '%';
        }
    };

    // Таймер игры
    mgTimerInterval = setInterval(() => {
        mgTimeLeft--;
        document.getElementById('mg-timer').innerText = mgTimeLeft;
        if (mgTimeLeft <= 0) stopMinigame('catcher');
    }, 1000);

    // Падение еды с неба
    const emojis = ['🥐', '🌾', '🍇', '🧁', '🍪'];
    mgSpawnInterval = setInterval(() => {
        const field = document.getElementById('minigame-field');
        const food = document.createElement('div');
        food.className = 'falling-food';
        food.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        food.style.left = Math.floor(Math.random() * 85) + '%';
        food.style.top = '0px';
        field.appendChild(food);

        let pos = 0;
        let foodFall = setInterval(() => {
            pos += 6;
            food.style.top = pos + 'px';
            
            // Проверка столкновения с корзинкой
            let fieldHeight = field.clientHeight;
            if (pos >= fieldHeight - 60 && pos <= fieldHeight - 20) {
                let foodLeft = parseFloat(food.style.left);
                let basketLeft = parseFloat(basket.style.left);
                if (Math.abs(foodLeft - basketLeft) < 15) {
                    mgScore++;
                    document.getElementById('mg-score').innerText = mgScore;
                    food.remove();
                    clearInterval(foodFall);
                }
            }

            if (pos > fieldHeight) {
                food.remove();
                clearInterval(foodFall);
            }
        }, 30);
    }, 800);
}

// 2. МИНИ-ИГРА: НАЛЕЙ МОЛОЧКО В МИСКУ 🥛
function runMilkGame() {
    document.getElementById('basket-catcher').style.display = 'none';
    const field = document.getElementById('minigame-field');
    
    field.innerHTML = `
        <div style="text-align:center; padding-top:40px; width:100%;">
            <p>Нажми кнопку СТОП, когда шкала заполнится ровно до зеленой зоны!</p>
            <div style="background:#333; width:60px; height:200px; margin:20px auto; border-radius:10px; position:relative; overflow:hidden;">
                <!-- Зелёная идеальная зона -->
                <div style="background:#2ed573; position:absolute; bottom:140px; height:30px; width:100%; opacity:0.6;"></div>
                <!-- Растущее молоко -->
                <div id="milk-fill" style="background:white; position:absolute; bottom:0; width:100%; height:0%;"></div>
            </div>
            <button class="buy-btn" id="milk-stop-btn" style="background:#74b9ff; font-size:1.3rem; padding:10px 30px;" onclick="stopMilkGameAction()">🛑 СТОП!</button>
        </div>
    `;

    const milkFill = document.getElementById('milk-fill');
    let milkHeight = 0;
    let direction = 1;

    mgSpawnInterval = setInterval(() => {
        milkHeight += 3 * direction;
        if (milkHeight >= 100 || milkHeight <= 0) direction *= -1; // Движение туда-сюда
        milkFill.style.height = milkHeight + '%';
    }, 40);

    mgTimerInterval = setInterval(() => {
        mgTimeLeft--;
        document.getElementById('mg-timer').innerText = mgTimeLeft;
        if (mgTimeLeft <= 0) stopMinigame('milk');
    }, 1000);
}

function stopMilkGameAction() {
    clearInterval(mgSpawnInterval);
    const milkFill = document.getElementById('milk-fill');
    let finalHeight = parseInt(milkFill.style.height);

    // Идеальная зеленая зона находится между 70% и 85% высоты
    if (finalHeight >= 70 && finalHeight <= 85) {
        mgScore = 50; // Максимальные очки за точный налив
        alert("🥛 ИДЕАЛЬНО! Налито ровно полная миска! Получено максимальное комбо бонусов!");
    } else if (finalHeight > 85) {
        mgScore = 10;
        alert("💦 Ой! Молоко перелилось через край! Пушин немного расстроен.");
    } else {
        mgScore = 15;
        alert("🥣 Маловато налито, но котик всё равно попьет.");
    }
    
    stopMinigame('milk');
}

function stopMinigame(type) {
    clearInterval(mgTimerInterval);
    clearInterval(mgSpawnInterval);
    window.onpointerdown = null;

    document.getElementById('minigame-overlay').style.display = 'none';

    // Выдача крутых наград в зависимости от набранных очков
    let wheatPrize = Math.floor(mgScore / 3);
    let berryPrize = Math.floor(mgScore / 10);
    
    if (type === 'milk' && mgScore === 50) {
        wheatPrize = 25; berryPrize = 5; // Фиксированный супер-бонус
    }

    gameData.wheatSeeds += wheatPrize;
    gameData.berrySeeds += berryPrize;
    if (typeof addXP === 'function') addXP(mgScore * 2);

    alert(`🎮 Игра завершена!\nТвоя награда за активность:\n🌾 Семена Пшеницы: +${wheatPrize} шт.\n🍇 Семена Смородины: +${berryPrize} шт.\n✨ Опыт Пушина: +${mgScore * 2} XP!`);
    
    if (typeof updateUI === 'function') updateUI();
    if (typeof saveGame === 'function') saveGame();
}
