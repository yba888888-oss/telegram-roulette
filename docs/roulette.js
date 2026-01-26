// Telegram Web App initialization
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Prize values in Mori (matching the wheel: $1000, $100, $200, $300, $400, $500, $600, $700, $800, $900)
const prizes = [
    { amount: 1000, label: '$1000' },
    { amount: 100, label: '$100' },
    { amount: 200, label: '$200' },
    { amount: 300, label: '$300' },
    { amount: 400, label: '$400' },
    { amount: 500, label: '$500' },
    { amount: 600, label: '$600' },
    { amount: 700, label: '$700' },
    { amount: 800, label: '$800' },
    { amount: 900, label: '$900' }
];

let balance = 0;
const spinCost = 1;
let isSpinning = false;
let isFirstSpin = true;
let currentRotation = 0;

// Initialize wheel
function initWheel() {
    const wheel = document.getElementById('wheel');
    wheel.innerHTML = '';
    
    const totalSegments = prizes.length;
    const segmentAngle = 360 / totalSegments;
    
    // Create wheel segments
    prizes.forEach((prize, index) => {
        const segment = document.createElement('div');
        segment.className = 'wheel-segment';
        segment.style.setProperty('--segment-index', index);
        segment.style.setProperty('--segment-angle', segmentAngle);
        segment.style.setProperty('--rotation', index * segmentAngle);
        
        // Alternate colors: red and cream
        const isRed = index % 2 === 0;
        segment.classList.add(isRed ? 'segment-red' : 'segment-cream');
        
        segment.innerHTML = `
            <div class="segment-content">
                <span class="segment-value">${prize.label}</span>
            </div>
        `;
        
        wheel.appendChild(segment);
    });
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
    
    const wheel = document.getElementById('wheel');
    
    // Random prize selection
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const selectedPrize = prizes[randomIndex];
    
    // Calculate rotation
    // Each segment is 36 degrees (360/10)
    const segmentAngle = 360 / prizes.length;
    // Target angle for the selected segment (pointing to top)
    const targetAngle = randomIndex * segmentAngle;
    
    // Spin multiple full rotations (at least 5 full spins)
    const fullSpins = 5;
    const totalRotation = currentRotation + (fullSpins * 360) + (360 - targetAngle);
    currentRotation = totalRotation % 360;
    
    // Apply rotation
    wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    wheel.style.transform = `rotate(${totalRotation}deg)`;
    
    // After animation completes
    setTimeout(() => {
        // Add prize to balance
        balance += selectedPrize.amount;
        updateBalance();
        
        // Show result modal
        showResult(selectedPrize.amount);
        
        isSpinning = false;
    }, 4000);
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
initWheel();
updateBalance();
updateSpinButton();
