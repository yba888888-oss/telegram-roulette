// Telegram Web App initialization
let tg;
try {
    tg = window.Telegram.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
    }
} catch (error) {
    console.error('Telegram WebApp error:', error);
    // Fallback for testing outside Telegram
    tg = {
        ready: () => {},
        expand: () => {},
        showAlert: (msg) => alert(msg),
        sendData: () => {},
        close: () => {},
        initDataUnsafe: {}
    };
}

// Prize values in Mori - кастомные призы для Mori Coin
const prizes = [
    { amount: 50, type: 'common' },
    { amount: 100, type: 'common' },
    { amount: 150, type: 'common' },
    { amount: 200, type: 'rare' },
    { amount: 250, type: 'rare' },
    { amount: 300, type: 'rare' },
    { amount: 500, type: 'epic' },
    { amount: 1000, type: 'legendary' },
];

let balance = 0;
let isSpinning = false;

// Initialize roulette with Mori coins
function initRoulette() {
    try {
        const roulette = document.getElementById('roulette');
        if (!roulette) {
            console.error('Roulette element not found');
            return;
        }
        
        roulette.innerHTML = '';
        console.log('Cleared roulette, creating coins...');
        
        // Create multiple coin sets for smooth infinite scrolling
        // Создаем достаточно дубликатов для бесконечной прокрутки
        const setsCount = 15; // 15 наборов призов для плавной прокрутки
        const totalCoins = setsCount * prizes.length;
        
        for (let i = 0; i < totalCoins; i++) {
            const prize = prizes[i % prizes.length];
            const coin = document.createElement('div');
            coin.className = `coin coin-${prize.type}`;
            coin.style.setProperty('--coin-index', i);
            
            coin.innerHTML = `
                <div class="coin-content">
                    <div class="prize-amount prize-${prize.type}">${prize.amount} $Mori</div>
                </div>
            `;
            
            roulette.appendChild(coin);
        }
        
        console.log('Roulette initialized with', totalCoins, 'coins');
        
        // Устанавливаем начальную позицию - показываем первый приз
        const coinHeight = 200;
        const centerOffset = 100;
        // Используем позицию из середины созданных элементов (7-й набор из 15)
        const startSetIndex = 7;
        const startVisualIndex = startSetIndex * prizes.length;
        const startPosition = startVisualIndex * coinHeight - centerOffset;
        
        roulette.style.transition = 'none';
        roulette.style.transform = `translateY(${startPosition}px)`;
        
        console.log('Initial position set to', startPosition);
    } catch (error) {
        console.error('Error initializing roulette:', error);
    }
}

// Center a specific coin by index (упрощенная версия)
function centerCoin(coinIndex) {
    const roulette = document.getElementById('roulette');
    if (!roulette) return;
    
    const coinHeight = 200;
    const centerOffset = 100;
    const normalizedIndex = coinIndex % prizes.length;
    
    // Используем позицию из середины созданных элементов (7-й набор из 15)
    const middleSetIndex = 7;
    const visualIndex = middleSetIndex * prizes.length + normalizedIndex;
    const finalPosition = visualIndex * coinHeight - centerOffset;
    
    roulette.style.transition = 'transform 0.5s ease-out';
    roulette.style.transform = `translateY(${finalPosition}px)`;
}

// Нормализовать позицию рулетки, чтобы всегда был виден приз
function normalizeRoulettePosition() {
    const roulette = document.getElementById('roulette');
    if (!roulette) return 0;
    
    const coinHeight = 200;
    const centerOffset = 100;
    
    // Получаем текущую позицию
    const currentTransform = roulette.style.transform;
    let currentY = 0;
    if (currentTransform) {
        const match = currentTransform.match(/translateY\(([^)]+)\)/);
        if (match) {
            currentY = parseFloat(match[1]) || 0;
        }
    }
    
    // Вычисляем ближайший индекс приза
    const targetY = currentY + centerOffset;
    let nearestIndex = Math.round(targetY / coinHeight);
    
    // Нормализуем индекс в пределах одного цикла призов
    const normalizedIndex = ((nearestIndex % prizes.length) + prizes.length) % prizes.length;
    
    // Используем позицию из середины созданных элементов (7-й набор из 15)
    const middleSetIndex = 7;
    const visualIndex = middleSetIndex * prizes.length + normalizedIndex;
    const finalPosition = visualIndex * coinHeight - centerOffset;
    
    roulette.style.transition = 'transform 0.3s ease-out';
    roulette.style.transform = `translateY(${finalPosition}px)`;
    
    return normalizedIndex;
}

// Spin function
function spin() {
    if (isSpinning) {
        console.log('Already spinning, ignoring');
        return;
    }
    
    isSpinning = true;
    console.log('Starting spin...');
    
    const roulette = document.getElementById('roulette');
    if (!roulette) {
        console.error('Roulette element not found!');
        isSpinning = false;
        return;
    }
    
    const allCoins = roulette.querySelectorAll('.coin');
    console.log('Found', allCoins.length, 'coins in roulette');
    
    if (allCoins.length === 0) {
        console.error('No coins found! Reinitializing...');
        initRoulette();
        setTimeout(() => {
            isSpinning = false;
            spin();
        }, 100);
        return;
    }
    
    // Get current position
    const currentTransform = roulette.style.transform;
    let currentY = 0;
    if (currentTransform) {
        const match = currentTransform.match(/translateY\(([^)]+)\)/);
        if (match) {
            currentY = parseFloat(match[1]) || 0;
        }
    }
    
    // Random prize selection
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const selectedPrize = prizes[randomIndex];
    console.log('Selected prize:', selectedPrize.amount, 'at index', randomIndex);
    
    // Calculate positions
    const coinHeight = 200;
    const centerOffset = 100;
    const middleSetIndex = 7; // Середина из 15 наборов
    
    // Всегда начинаем с позиции в середине созданных элементов
    // Определяем текущий индекс приза
    const currentNormalizedY = currentY + centerOffset;
    const currentCoinIndex = Math.round(currentNormalizedY / coinHeight);
    const currentPrizeIndex = ((currentCoinIndex % prizes.length) + prizes.length) % prizes.length;
    
    // Начальная позиция - всегда в середине созданных элементов
    const startVisualIndex = middleSetIndex * prizes.length + currentPrizeIndex;
    const startY = startVisualIndex * coinHeight - centerOffset;
    
    // Финальная позиция - выбранный приз в середине созданных элементов
    const endVisualIndex = middleSetIndex * prizes.length + randomIndex;
    const endY = endVisualIndex * coinHeight - centerOffset;
    
    // Вычисляем количество оборотов (8-10 полных циклов)
    const rotations = 8 + Math.random() * 2;
    const fullCycles = Math.floor(rotations);
    
    // Вычисляем расстояние прокрутки
    // Разница между начальным и конечным индексом в пределах одного цикла
    let indexDiff = randomIndex - currentPrizeIndex;
    if (indexDiff < 0) {
        indexDiff += prizes.length;
    }
    
    // Общее расстояние = полные циклы + разница до финального приза
    const totalSpinDistance = (fullCycles * prizes.length + indexDiff) * coinHeight;
    const finalY = startY - totalSpinDistance;
    
    // Сохраняем значения для использования в setTimeout
    const savedRandomIndex = randomIndex;
    const savedSelectedPrize = selectedPrize;
    
    // Add spinning class to all coins for rotation animation
    const allCoins = roulette.querySelectorAll('.coin');
    allCoins.forEach(coin => {
        coin.classList.add('coin-spinning');
    });
    
    // Remove transition for animation
    roulette.style.transition = 'none';
    roulette.style.transform = `translateY(${startY}px)`;
    
    // Force reflow
    void roulette.offsetHeight;
    
    // Add spinning class for animation
    roulette.classList.add('spinning');
    roulette.style.setProperty('--spin-start', `${startY}px`);
    roulette.style.setProperty('--spin-end', `${finalY}px`);
    
    setTimeout(() => {
        roulette.classList.remove('spinning');
        // Remove spinning class from coins
        allCoins.forEach(coin => {
            coin.classList.remove('coin-spinning');
        });
        // Устанавливаем финальную позицию точно на выбранный приз
        const coinHeight = 200;
        const centerOffset = 100;
        const middleSetIndex = 10;
        const finalNormalizedIndex = savedRandomIndex % prizes.length;
        const visualIndex = middleSetIndex * prizes.length + finalNormalizedIndex;
        const finalPos = visualIndex * coinHeight - centerOffset;
        
        console.log('Setting final position to', finalPos, 'for prize index', savedRandomIndex);
        roulette.style.transition = 'transform 0.5s ease-out';
        roulette.style.transform = `translateY(${finalPos}px)`;
        
        // Дополнительная нормализация через небольшую задержку
        setTimeout(() => {
            normalizeRoulettePosition();
        }, 600);
        
        // Add prize to balance
        balance += savedSelectedPrize.amount;
        updateBalance();
        console.log('Balance updated to', balance);
        
        // Show result modal
        showResult(savedSelectedPrize.amount);
        console.log('Spin completed!');
        
        isSpinning = false;
    }, 5000); // Увеличено время до 5 секунд
}

// Show result modal
function showResult(amount) {
    const modal = document.getElementById('resultModal');
    const prizeAmount = document.getElementById('prizeAmount');
    prizeAmount.textContent = `${amount} $Mori`;
    modal.classList.add('show');
    
    // Send data to bot
    if (tg.sendData) {
        tg.sendData(JSON.stringify({
            type: 'spin_result',
            prize: amount
        }));
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('resultModal');
    modal.classList.remove('show');
}

// Update balance display
function updateBalance() {
    const balanceElement = document.getElementById('balance');
    balanceElement.textContent = `${Math.floor(balance)} $Mori`;
}

// Update spin button text
function updateSpinButton() {
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.textContent = 'Бесплатный спин';
}

// Withdraw balance
function withdrawBalance() {
    // Send data to bot to withdraw balance
    if (tg.sendData) {
        tg.sendData(JSON.stringify({
            type: 'withdraw_balance',
            amount: balance
        }));
    } else {
        tg.showAlert('Функция вывода средств будет доступна в боте');
    }
}

// Event listeners
document.getElementById('spinBtn').addEventListener('click', spin);
document.getElementById('withdrawBtn').addEventListener('click', withdrawBalance);
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('backBtn').addEventListener('click', () => {
    if (tg.close) {
        tg.close();
    }
});

// Get user data from Telegram
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    console.log('User:', user);
}

// Initialize on load
function initializeApp() {
    console.log('Initializing app...');
    try {
        initRoulette();
        updateBalance();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    initializeApp();
});

// Also try to initialize if DOM is already loaded
if (document.readyState !== 'loading') {
    console.log('DOM already loaded, initializing...');
    initializeApp();
}
