// Telegram Web App initialization
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Prize values in Mori
const prizes = [
    { amount: 50, type: 'gold' },
    { amount: 100, type: 'gold' },
    { amount: 150, type: 'gold' },
    { amount: 200, type: 'dark-gold' },
    { amount: 75, type: 'gold' },
    { amount: 500, type: 'dark-gold' },
    { amount: 125, type: 'gold' },
    { amount: 250, type: 'gold' },
    { amount: 1000, type: 'dark-gold' },
    { amount: 175, type: 'gold' },
    { amount: 300, type: 'gold' },
    { amount: 400, type: 'dark-gold' },
];

let balance = 0;
const spinCost = 1;
let isSpinning = false;
let isFirstSpin = true;

// Initialize roulette
function initRoulette() {
    const roulette = document.getElementById('roulette');
    roulette.innerHTML = '';
    
    // Create more coins for smooth scrolling
    const totalCoins = 30;
    for (let i = 0; i < totalCoins; i++) {
        const prize = prizes[i % prizes.length];
        const coin = document.createElement('div');
        coin.className = `coin ${prize.type}`;
        coin.style.setProperty('--coin-index', i);
        coin.innerHTML = `
            <div class="coin-content">
                <div class="coin-face">
                    <img src="${MORI_COIN_BASE64}" alt="Mori Coin" class="coin-image">
                </div>
                <div class="prize-amount">${prize.amount} $Mori</div>
            </div>
        `;
        roulette.appendChild(coin);
    }
    
    // Center the first coin on load
    centerCoin(0);
}

// Center a specific coin by index
function centerCoin(coinIndex) {
    const roulette = document.getElementById('roulette');
    const coinHeight = 360;
    const centerOffset = 180; // Center of visible area (600px height / 2 - 180px coin center)
    const finalPosition = coinIndex * coinHeight - centerOffset;
    roulette.style.transition = 'transform 0.5s ease-out';
    roulette.style.transform = `translateY(${finalPosition}px)`;
}

// Spin function
function spin() {
    if (isSpinning) return;
    
    // First spin is free
    if (!isFirstSpin && balance < spinCost) {
        tg.showAlert('Недостаточно средств!');
        return;
    }
    
    isSpinning = true;
    
    // Only deduct cost if it's not the first spin
    if (!isFirstSpin) {
        balance -= spinCost;
        updateBalance();
    } else {
        isFirstSpin = false;
        updateSpinButton();
    }
    
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
    const coinHeight = 360;
    const centerOffset = 180; // Center of visible area (600px height / 2 - 180px coin center)
    const finalPosition = randomIndex * coinHeight - centerOffset;
    
    // Calculate spin distance - make it spin multiple times (at least 3 full rotations)
    const spinDistance = 3 * 360 * 12; // 3 full rotations through all 12 coins
    const totalDistance = currentY - spinDistance + finalPosition;
    
    // Remove transition for animation
    roulette.style.transition = 'none';
    roulette.style.transform = `translateY(${currentY}px)`;
    
    // Force reflow
    void roulette.offsetHeight;
    
    // Add spinning class for animation
    roulette.classList.add('spinning');
    roulette.style.setProperty('--spin-start', `${currentY}px`);
    roulette.style.setProperty('--spin-end', `${totalDistance}px`);
    
    setTimeout(() => {
        roulette.classList.remove('spinning');
        // Center the winning coin with smooth transition
        centerCoin(randomIndex);
        
        // Add prize to balance
        balance += selectedPrize.amount;
        updateBalance();
        
        // Show result modal
        showResult(selectedPrize.amount);
        
        isSpinning = false;
    }, 3000);
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
    if (isFirstSpin) {
        spinBtn.textContent = 'Бесплатный спин';
    } else {
        spinBtn.textContent = 'Крутить за $1';
    }
}

// Top up balance
function topUpBalance() {
    // Send data to bot to open payment
    if (tg.sendData) {
        tg.sendData(JSON.stringify({
            type: 'top_up_balance'
        }));
    } else {
        // Fallback: just add some balance for testing
        balance += 100;
        updateBalance();
        tg.showAlert('Баланс пополнен на $100');
    }
}

// Event listeners
document.getElementById('spinBtn').addEventListener('click', spin);
document.getElementById('topUpBtn').addEventListener('click', topUpBalance);
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
initRoulette();
updateBalance();
updateSpinButton();