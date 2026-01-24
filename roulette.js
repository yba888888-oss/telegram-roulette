// Telegram Web App initialization
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Prize values
const prizes = [
    { amount: 0.05, type: 'teal' },
    { amount: 1, type: 'teal' },
    { amount: 0.4, type: 'teal' },
    { amount: 2, type: 'blue' },
    { amount: 0.1, type: 'teal' },
    { amount: 5, type: 'blue' },
    { amount: 0.2, type: 'teal' },
    { amount: 0.5, type: 'teal' },
    { amount: 10, type: 'blue' },
    { amount: 0.3, type: 'teal' },
    { amount: 0.15, type: 'teal' },
    { amount: 3, type: 'blue' },
];

let balance = 0.159564;
let isSpinning = false;
let autoSpin = false;

// Initialize roulette
function initRoulette() {
    const roulette = document.getElementById('roulette');
    roulette.innerHTML = '';
    
    // Create more tickets for smooth scrolling
    const totalTickets = 30;
    for (let i = 0; i < totalTickets; i++) {
        const prize = prizes[i % prizes.length];
        const ticket = document.createElement('div');
        ticket.className = `ticket ${prize.type}`;
        ticket.style.setProperty('--ticket-index', i);
        ticket.innerHTML = `
            <div class="ticket-content">
                <span class="coin-icon">💎</span>
                <span class="amount">${prize.amount}</span>
                <span class="tether-label">Tether</span>
            </div>
        `;
        roulette.appendChild(ticket);
    }
}

// Spin function
function spin() {
    if (isSpinning) return;
    
    if (balance < 1) {
        tg.showAlert('Недостаточно средств!');
        return;
    }
    
    isSpinning = true;
    balance -= 1;
    updateBalance();
    
    const roulette = document.getElementById('roulette');
    roulette.classList.add('spinning');
    
    // Random prize selection
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const selectedPrize = prizes[randomIndex];
    
    // Calculate final position - center the selected ticket
    const ticketHeight = 120;
    const centerOffset = 290; // Center of visible area (600px height / 2 - 60px ticket center)
    const finalPosition = randomIndex * ticketHeight - centerOffset;
    
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
        
        // Continue auto-spin if enabled
        if (autoSpin && balance >= 1) {
            setTimeout(() => {
                roulette.style.transition = '';
                spin();
            }, 2500);
        } else if (autoSpin && balance < 1) {
            autoSpin = false;
            updateAutoSpinButton();
            tg.showAlert('Недостаточно средств для авто-спина!');
        }
    }, 3000);
}

// Show result modal
function showResult(amount) {
    const modal = document.getElementById('resultModal');
    const prizeAmount = document.getElementById('prizeAmount');
    prizeAmount.textContent = `${amount} Tether`;
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
    balanceElement.textContent = `${balance.toFixed(6)} USDT`;
}

// Toggle auto-spin
function toggleAutoSpin() {
    autoSpin = !autoSpin;
    updateAutoSpinButton();
    
    if (autoSpin && balance >= 1 && !isSpinning) {
        spin();
    }
}

function updateAutoSpinButton() {
    const btn = document.getElementById('autoSpinBtn');
    if (autoSpin) {
        btn.textContent = 'Остановить';
        btn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    } else {
        btn.textContent = 'Авто-спин';
        btn.style.background = 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)';
    }
}

// Event listeners
document.getElementById('spinBtn').addEventListener('click', spin);
document.getElementById('autoSpinBtn').addEventListener('click', toggleAutoSpin);
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
