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
                <div class="coin-face"></div>
                <div class="prize-amount">${prize.amount} $Mori Coin</div>
            </div>
        `;
        roulette.appendChild(coin);
    }
}

// Spin function
function spin() {
    if (isSpinning) return;
    
    if (balance < spinCost) {
        tg.showAlert('Недостаточно средств!');
        return;
    }
    
    isSpinning = true;
    balance -= spinCost;
    updateBalance();
    
    const roulette = document.getElementById('roulette');
    roulette.classList.add('spinning');
    
    // Random prize selection
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const selectedPrize = prizes[randomIndex];
    
    // Calculate final position - center the selected coin
    const coinHeight = 360;
    const centerOffset = 180; // Center of visible area (600px height / 2 - 180px coin center)
    const finalPosition = randomIndex * coinHeight - centerOffset;
    
    setTimeout(() => {
        roulette.classList.remove('spinning');
        roulette.style.transition = 'transform 0.5s ease-out';
        roulette.style.transform = `translateY(${finalPosition}px)`;
        
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
    prizeAmount.textContent = `${amount} $Mori Coin`;
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
    balanceElement.textContent = `${Math.floor(balance)} $Mori Coin`;
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
