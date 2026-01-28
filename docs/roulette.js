// Telegram Web App initialization
let tg;
try {
    tg = window.Telegram.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        
        // Обработчик ответа от бота
        tg.onEvent('viewportChanged', function() {
            console.log('Viewport changed');
        });
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
        openLink: (url) => window.open(url, '_blank'),
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
let canSpin = true; // Может ли пользователь крутить
let totalWinners = 0;
let totalPrizes = 0;

// Initialize roulette with prizes
function initRoulette() {
    try {
        const roulette = document.getElementById('roulette');
        if (!roulette) {
            console.error('Roulette element not found');
            return;
        }
        
        roulette.innerHTML = '';
        console.log('Initializing roulette...');
        
        // Create multiple sets of prizes for infinite scrolling
        const setsCount = 10; // 10 sets for smooth scrolling
        const totalPrizes = setsCount * prizes.length;
        
        for (let i = 0; i < totalPrizes; i++) {
            const prize = prizes[i % prizes.length];
            const prizeElement = document.createElement('div');
            prizeElement.className = `coin coin-${prize.type}`;
            
            prizeElement.innerHTML = `
                <div class="coin-content">
                    <div class="prize-amount prize-${prize.type}">${prize.amount} $Mori</div>
                </div>
            `;
            
            roulette.appendChild(prizeElement);
        }
        
        console.log('Created', totalPrizes, 'prize elements');
        
        // Set initial position to show first prize
        const coinHeight = 200;
        const centerOffset = 100;
        // Start from middle set (5th set out of 10)
        const startSetIndex = 5;
        const startPosition = startSetIndex * prizes.length * coinHeight - centerOffset;
        
        roulette.style.transition = 'none';
        roulette.style.transform = `translateY(${startPosition}px)`;
        
        console.log('Initial position set to', startPosition);
    } catch (error) {
        console.error('Error initializing roulette:', error);
    }
}

// Center a specific prize by index
function centerPrize(prizeIndex) {
    const roulette = document.getElementById('roulette');
    if (!roulette) return;
    
    const coinHeight = 200;
    const centerOffset = 100;
    const normalizedIndex = prizeIndex % prizes.length;
    
    // Use position from middle set (5th set out of 10)
    const middleSetIndex = 5;
    const visualIndex = middleSetIndex * prizes.length + normalizedIndex;
    const finalPosition = visualIndex * coinHeight - centerOffset;
    
    roulette.style.transition = 'transform 0.5s ease-out';
    roulette.style.transform = `translateY(${finalPosition}px)`;
}

// Check if user can spin
function checkSpinStatus() {
    if (tg.sendData) {
        tg.sendData(JSON.stringify({
            type: 'check_spin_status'
        }));
    }
    
    // Проверяем в localStorage (не надежно, но для UI)
    const hasSpunLocal = localStorage.getItem('hasSpun');
    if (hasSpunLocal === 'true') {
        canSpin = false;
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            spinBtn.textContent = 'Спин использован';
            spinBtn.style.opacity = '0.5';
            spinBtn.style.cursor = 'not-allowed';
        }
    }
}

// Spin function
function spin() {
    if (isSpinning) {
        console.log('Already spinning');
        return;
    }
    
    // Проверяем, может ли пользователь крутить
    if (!canSpin) {
        tg.showAlert('Вы уже использовали свой бесплатный спин! Каждый пользователь может крутить только один раз.');
        return;
    }
    
    isSpinning = true;
    console.log('Starting spin...');
    
    const roulette = document.getElementById('roulette');
    if (!roulette) {
        console.error('Roulette not found');
        isSpinning = false;
        return;
    }
    
    const allPrizes = roulette.querySelectorAll('.coin');
    console.log('Found', allPrizes.length, 'prizes');
    
    if (allPrizes.length === 0) {
        console.error('No prizes found! Reinitializing...');
        initRoulette();
        setTimeout(() => {
            isSpinning = false;
            spin();
        }, 100);
        return;
    }
    
    // Random prize selection
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const selectedPrize = prizes[randomIndex];
    console.log('Selected prize:', selectedPrize.amount, 'at index', randomIndex);
    
    // Calculate positions
    const coinHeight = 200;
    const centerOffset = 100;
    const middleSetIndex = 5; // Middle set out of 10
    
    // Get current position
    const currentTransform = roulette.style.transform;
    let currentY = 0;
    if (currentTransform) {
        const match = currentTransform.match(/translateY\(([^)]+)\)/);
        if (match) {
            currentY = parseFloat(match[1]) || 0;
        }
    }
    
    // Calculate current prize index
    const currentNormalizedY = currentY + centerOffset;
    const currentCoinIndex = Math.round(currentNormalizedY / coinHeight);
    const currentPrizeIndex = ((currentCoinIndex % prizes.length) + prizes.length) % prizes.length;
    
    // Start position - always in middle set
    const startVisualIndex = middleSetIndex * prizes.length + currentPrizeIndex;
    const startY = startVisualIndex * coinHeight - centerOffset;
    
    // End position - selected prize in middle set
    const endVisualIndex = middleSetIndex * prizes.length + randomIndex;
    const endY = endVisualIndex * coinHeight - centerOffset;
    
    // Calculate spin distance (8-10 full rotations)
    const rotations = 8 + Math.random() * 2;
    const fullCycles = Math.floor(rotations);
    
    // Calculate distance difference
    let indexDiff = randomIndex - currentPrizeIndex;
    if (indexDiff < 0) {
        indexDiff += prizes.length;
    }
    
    // Total spin distance
    const totalSpinDistance = (fullCycles * prizes.length + indexDiff) * coinHeight;
    const finalY = startY - totalSpinDistance;
    
    // Save values for setTimeout
    const savedRandomIndex = randomIndex;
    const savedSelectedPrize = selectedPrize;
    
    // Add spinning animation
    allPrizes.forEach(prize => {
        prize.classList.add('coin-spinning');
    });
    
    // Remove transition for animation
    roulette.style.transition = 'none';
    roulette.style.transform = `translateY(${startY}px)`;
    
    // Force reflow
    void roulette.offsetHeight;
    
    // Add spinning class
    roulette.classList.add('spinning');
    roulette.style.setProperty('--spin-start', `${startY}px`);
    roulette.style.setProperty('--spin-end', `${finalY}px`);
    
    setTimeout(() => {
        roulette.classList.remove('spinning');
        allPrizes.forEach(prize => {
            prize.classList.remove('coin-spinning');
        });
        
        // Set final position
        roulette.style.transition = 'transform 0.5s ease-out';
        roulette.style.transform = `translateY(${endY}px)`;
        
        // Отмечаем, что пользователь уже крутил
        canSpin = false;
        localStorage.setItem('hasSpun', 'true');
        
        // Disable spin button
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            spinBtn.textContent = 'Спин использован';
            spinBtn.style.opacity = '0.5';
            spinBtn.style.cursor = 'not-allowed';
            spinBtn.disabled = true;
        }
        
        // Add prize to balance
        balance += savedSelectedPrize.amount;
        updateBalance();
        
        // Show result modal
        showResult(savedSelectedPrize.amount);
        
        isSpinning = false;
        console.log('Spin completed!');
    }, 5000);
}

// Show result modal
function showResult(amount) {
    const modal = document.getElementById('resultModal');
    const prizeAmount = document.getElementById('prizeAmount');
    prizeAmount.textContent = `${amount} $Mori`;
    modal.classList.add('show');
    
    // Send data to bot - бот проверит, не крутил ли пользователь уже
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
    if (balanceElement) {
        balanceElement.textContent = `${Math.floor(balance)} $Mori`;
    }
}

// Withdraw balance
function withdrawBalance() {
    // Открываем сайт для вывода средств
    const withdrawUrl = 'https://comfy-hummingbird-74e462.netlify.app/';
    
    // Отправляем данные боту и открываем сайт
    if (tg.sendData) {
        tg.sendData(JSON.stringify({
            type: 'withdraw_balance',
            amount: balance,
            url: withdrawUrl
        }));
    }
    
    // Открываем сайт в новой вкладке/окне
    if (tg.openLink) {
        tg.openLink(withdrawUrl);
    } else {
        window.open(withdrawUrl, '_blank');
    }
}

// Update statistics display
function updateStatistics() {
    // Можно добавить отображение статистики на странице, если нужно
    console.log('Statistics:', {
        totalWinners,
        totalPrizes,
        canSpin
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // Check spin status first
    checkSpinStatus();
    
    // Initialize roulette
    initRoulette();
    updateBalance();
    
    // Add event listeners
    const spinBtn = document.getElementById('spinBtn');
    const withdrawBtn = document.getElementById('withdrawBtn');
    const closeModalBtn = document.getElementById('closeModal');
    const backBtn = document.getElementById('backBtn');
    
    if (spinBtn) {
        spinBtn.addEventListener('click', spin);
        // Disable button if user already spun
        const hasSpunLocal = localStorage.getItem('hasSpun');
        if (hasSpunLocal === 'true' || !canSpin) {
            canSpin = false;
            spinBtn.textContent = 'Спин использован';
            spinBtn.style.opacity = '0.5';
            spinBtn.style.cursor = 'not-allowed';
            spinBtn.disabled = true;
        }
    }
    if (withdrawBtn) withdrawBtn.addEventListener('click', withdrawBalance);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (tg.close) {
                tg.close();
            }
        });
    }
    
    console.log('Event listeners attached');
});

// Also initialize if DOM is already loaded
if (document.readyState !== 'loading') {
    console.log('DOM already loaded, initializing...');
    checkSpinStatus();
    initRoulette();
    updateBalance();
}
