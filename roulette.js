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

// Handle coin image loading errors
function handleCoinImageError(imgElement) {
    console.error('Coin image failed to load:', imgElement.src);
    // Try fallback to mori-coin.png if current source is base64
    if (imgElement.src && imgElement.src.startsWith('data:')) {
        imgElement.src = 'mori-coin.png';
        console.log('Trying fallback image: mori-coin.png');
    } else if (imgElement.src && !imgElement.src.includes('mori-coin.png')) {
        // If mori-coin.png also fails, show placeholder
        imgElement.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'coin-placeholder';
        placeholder.textContent = '🪙';
        placeholder.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 80px;';
        imgElement.parentElement.appendChild(placeholder);
    }
}

// Initialize roulette with Mori coins
function initRoulette() {
    try {
        const roulette = document.getElementById('roulette');
        if (!roulette) {
            console.error('Roulette element not found');
            return;
        }
        
        // Check if MORI_COIN_BASE64 is defined
        if (typeof MORI_COIN_BASE64 === 'undefined' || !MORI_COIN_BASE64) {
            console.error('MORI_COIN_BASE64 is not defined. Trying fallback...');
            // Try fallback to mori-coin.png
            window.MORI_COIN_BASE64 = 'mori-coin.png';
            console.log('Using fallback image: mori-coin.png');
        }
        
        roulette.innerHTML = '';
        
        // Create multiple coin sets for smooth infinite scrolling
        // Создаем больше дубликатов для бесконечной прокрутки
        const setsCount = 10; // 10 наборов призов для плавной прокрутки
        const totalCoins = setsCount * prizes.length; // 10 полных циклов
        
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
        
        // Center the first coin on load - всегда на призе
        centerCoin(0);
        
        // Убеждаемся, что позиция нормализована после загрузки
        setTimeout(() => {
            normalizeRoulettePosition();
        }, 100);
    } catch (error) {
        console.error('Error initializing roulette:', error);
    }
}

// Center a specific coin by index
function centerCoin(coinIndex) {
    const roulette = document.getElementById('roulette');
    const coinHeight = 200; // Увеличено расстояние между призами
    const centerOffset = 100; // Center of visible area (половина высоты видимой области)
    
    // Нормализуем индекс, чтобы он всегда был в пределах одного цикла призов
    const normalizedIndex = coinIndex % prizes.length;
    const finalPosition = normalizedIndex * coinHeight - centerOffset;
    
    roulette.style.transition = 'transform 0.5s ease-out';
    roulette.style.transform = `translateY(${finalPosition}px)`;
}

// Нормализовать позицию рулетки, чтобы всегда был виден приз
function normalizeRoulettePosition() {
    const roulette = document.getElementById('roulette');
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
    const nearestIndex = Math.round(targetY / coinHeight);
    const normalizedIndex = ((nearestIndex % prizes.length) + prizes.length) % prizes.length;
    
    // Устанавливаем позицию точно на приз
    const finalPosition = normalizedIndex * coinHeight - centerOffset;
    roulette.style.transition = 'transform 0.3s ease-out';
    roulette.style.transform = `translateY(${finalPosition}px)`;
    
    return normalizedIndex;
}

// Spin function
function spin() {
    if (isSpinning) return;
    
    isSpinning = true;
    
    const roulette = document.getElementById('roulette');
    
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
    
    // Calculate final position - center the selected coin
    const coinHeight = 200; // Увеличено расстояние между призами
    const centerOffset = 100; // Half of visible area
    
    // Нормализуем текущую позицию, чтобы начать с правильной позиции
    const currentNormalizedY = currentY + centerOffset;
    const currentNormalizedIndex = Math.round(currentNormalizedY / coinHeight);
    const normalizedStartIndex = ((currentNormalizedIndex % prizes.length) + prizes.length) % prizes.length;
    const normalizedStartY = normalizedStartIndex * coinHeight - centerOffset;
    
    // Вычисляем финальную позицию (всегда точно на призе)
    const finalPosition = randomIndex * coinHeight - centerOffset;
    
    // Calculate spin distance - make it spin multiple times (8-10 full rotations для плавности)
    const rotations = 8 + Math.random() * 2; // 8-10 полных оборотов
    // Вычисляем расстояние так, чтобы остановиться точно на выбранном призе
    const fullCycles = Math.floor(rotations);
    const extraDistance = (fullCycles * prizes.length + randomIndex - normalizedStartIndex) * coinHeight;
    const totalDistance = normalizedStartY - extraDistance;
    
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
    roulette.style.transform = `translateY(${normalizedStartY}px)`;
    
    // Force reflow
    void roulette.offsetHeight;
    
    // Add spinning class for animation
    roulette.classList.add('spinning');
    roulette.style.setProperty('--spin-start', `${normalizedStartY}px`);
    roulette.style.setProperty('--spin-end', `${totalDistance}px`);
    
    setTimeout(() => {
        roulette.classList.remove('spinning');
        // Remove spinning class from coins
        allCoins.forEach(coin => {
            coin.classList.remove('coin-spinning');
        });
        // Center the winning coin with smooth transition - всегда точно на призе
        const finalPos = savedRandomIndex * coinHeight - centerOffset;
        roulette.style.transition = 'transform 0.5s ease-out';
        roulette.style.transform = `translateY(${finalPos}px)`;
        
        // Убеждаемся, что позиция нормализована (на случай небольших погрешностей)
        setTimeout(() => {
            normalizeRoulettePosition();
        }, 600);
        
        // Add prize to balance
        balance += savedSelectedPrize.amount;
        updateBalance();
        
        // Show result modal
        showResult(savedSelectedPrize.amount);
        
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

// Initialize on load - wait for coin image data to load
function waitForCoinData(callback, maxAttempts = 100) {
    let attempts = 0;
    const checkInterval = setInterval(function() {
        attempts++;
        if (typeof MORI_COIN_BASE64 !== 'undefined' && MORI_COIN_BASE64) {
            clearInterval(checkInterval);
            console.log('Coin data loaded, initializing roulette...');
            callback();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.warn('Timeout waiting for coin data, using fallback');
            // Set fallback and initialize anyway
            if (typeof MORI_COIN_BASE64 === 'undefined' || !MORI_COIN_BASE64) {
                window.MORI_COIN_BASE64 = 'mori-coin.png';
                console.log('Using fallback image: mori-coin.png');
            }
            callback();
        }
    }, 100);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, waiting for coin data...');
    waitForCoinData(function() {
        try {
            initRoulette();
            updateBalance();
        } catch (error) {
            console.error('Initialization error:', error);
        }
    });
});

// Also try to initialize if DOM is already loaded
if (document.readyState !== 'loading') {
    console.log('DOM already loaded, waiting for coin data...');
    waitForCoinData(function() {
        try {
            initRoulette();
            updateBalance();
        } catch (error) {
            console.error('Initialization error:', error);
        }
    });
}
