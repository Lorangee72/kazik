document.addEventListener('DOMContentLoaded', function() {
    const symbols = ['🍒', '🍋', '🍊', '🍇', '🍉', '🍓', '7️⃣', '💰', '🍀'];
    const slots = [
        document.getElementById('slot1'),
        document.getElementById('slot2'),
        document.getElementById('slot3')
    ];
    const spinButton = document.getElementById('spin-button');
    const balanceElement = document.getElementById('balance');
    const currentBetElement = document.getElementById('current-bet');
    const resultElement = document.getElementById('result');
    const restartButton = document.getElementById('restart-button');
    const progressBar = document.getElementById('progress-bar');
    
    // Кнопки изменения ставки
    const increaseSmallBetButton = document.getElementById('increase-small-bet');
    const increaseBetButton = document.getElementById('increase-bet');
    const increaseBigBetButton = document.getElementById('increase-big-bet');
    const decreaseSmallBetButton = document.getElementById('decrease-small-bet');
    const decreaseBetButton = document.getElementById('decrease-bet');
    const decreaseBigBetButton = document.getElementById('decrease-big-bet');

    const betControlButtons = [
        increaseSmallBetButton,
        increaseBetButton,
        increaseBigBetButton,
        decreaseSmallBetButton,
        decreaseBetButton,
        decreaseBigBetButton
    ];

    const TARGET_AMOUNT = 1000000;
    
    // Загружаем сохраненные данные или устанавливаем значения по умолчанию
    let balance = parseInt(localStorage.getItem('casinoBalance')) || 1000;
    let currentBet = parseInt(localStorage.getItem('casinoCurrentBet')) || 10;
    let spinCount = parseInt(localStorage.getItem('casinoSpinCount')) || 0;
    let isSpinning = false;
    
    // Сохраняем состояние игры
    function saveGameState() {
        localStorage.setItem('casinoBalance', balance);
        localStorage.setItem('casinoCurrentBet', currentBet);
        localStorage.setItem('casinoSpinCount', spinCount);
    }
    
    function updateProgress() {
        const progress = Math.min((balance / TARGET_AMOUNT) * 100, 100);
        progressBar.style.width = `${progress}%`;
    }
    
    function updateBalance() {
        balanceElement.textContent = balance.toLocaleString();
        updateProgress();
        
        if (balance < 10) {
            restartButton.style.display = 'block';
            spinButton.style.display = 'none';
        } else {
            restartButton.style.display = 'none';
            spinButton.style.display = 'block';
        }
        
        saveGameState(); // Сохраняем при изменении баланса
    }
    
    function updateBet() {
        currentBetElement.textContent = currentBet;
        
        decreaseSmallBetButton.disabled = currentBet <= 10 || isSpinning;
        decreaseBetButton.disabled = currentBet <= 100 || isSpinning;
        decreaseBigBetButton.disabled = currentBet <= 1000 || isSpinning;
        
        increaseSmallBetButton.disabled = currentBet + 10 > balance || isSpinning;
        increaseBetButton.disabled = currentBet + 100 > balance || isSpinning;
        increaseBigBetButton.disabled = currentBet + 1000 > balance || isSpinning;
        
        spinButton.disabled = balance < currentBet || balance <= 0 || isSpinning;
        
        saveGameState(); // Сохраняем при изменении ставки
    }
    
    function toggleBetControls(enable) {
        betControlButtons.forEach(button => {
            button.disabled = !enable;
        });
        updateBet();
    }
    
    function spinSlot(slotElement, duration, finalIndex) {
        return new Promise((resolve) => {
            let startTime = null;
            const spinDuration = duration;
            let lastChange = 0;
            
            function animate(currentTime) {
                if (!startTime) startTime = currentTime;
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / spinDuration, 1);
                
                if (currentTime - lastChange > 100) {
                    const randomIndex = Math.floor(Math.random() * symbols.length);
                    slotElement.textContent = symbols[randomIndex];
                    lastChange = currentTime;
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    slotElement.textContent = symbols[finalIndex];
                    slotElement.classList.remove('spinning');
                    resolve();
                }
            }
            
            slotElement.classList.add('spinning');
            requestAnimationFrame(animate);
        });
    }
    
    function checkResult() {
        const values = slots.map(slot => slot.textContent);
        let winAmount = 0;
        let message = 'Попробуйте ещё раз!';
        
        if (values[0] === values[1] && values[1] === values[2]) {
            winAmount = currentBet * (values[0] === '7️⃣' ? 50 : 30);
            message = `ДЖЕКПОТ ${winAmount.toLocaleString()} ₽!`;
            resultElement.classList.add('jackpot');
        } 
        else if (values[0] === values[1] || values[1] === values[2] || values[0] === values[2]) {
            winAmount = Math.floor(currentBet * 0.75);
            message = `Возврат ${winAmount} ₽`;
            resultElement.classList.add('win');
        } else {
            resultElement.classList.remove('win', 'jackpot');
        }
        
        balance += winAmount;
        resultElement.textContent = message;
        updateBalance();
        updateBet();
        
        if (balance >= TARGET_AMOUNT) {
            resultElement.textContent = `ПОЗДРАВЛЯЕМ! Вы достигли цели в ${TARGET_AMOUNT.toLocaleString()} ₽!`;
            resultElement.classList.add('jackpot');
            spinButton.disabled = true;
            restartButton.style.display = 'block';
        }
        
        if (winAmount === 0) {
            spinCount++;
            if (spinCount >= 5 && !symbols.includes('💰')) {
                symbols.push('💰', '🍀', '💰', '🍀');
            }
        } else {
            spinCount = 0;
            while (symbols.includes('💰')) symbols.splice(symbols.indexOf('💰'), 1);
            while (symbols.includes('🍀')) symbols.splice(symbols.indexOf('🍀'), 1);
        }
        
        saveGameState(); // Сохраняем после каждого спина
    }
    
    spinButton.addEventListener('click', async function() {
        if (isSpinning || balance < currentBet) return;
        
        isSpinning = true;
        balance -= currentBet;
        updateBalance();
        resultElement.textContent = '';
        resultElement.classList.remove('win', 'jackpot');
        spinButton.disabled = true;
        restartButton.style.display = 'none';
        toggleBetControls(false);
        
        const results = [];
        for (let i = 0; i < slots.length; i++) {
            results.push(Math.floor(Math.random() * symbols.length));
        }
        
        const spinPromises = [];
        for (let i = 0; i < slots.length; i++) {
            const delay = i * 200;
            const duration = 1000 + i * 200;
            
            spinPromises.push(
                new Promise(resolve => {
                    setTimeout(async () => {
                        await spinSlot(slots[i], duration, results[i]);
                        resolve();
                    }, delay);
                })
            );
        }
        
        await Promise.all(spinPromises);
        
        isSpinning = false;
        checkResult();
        toggleBetControls(true);
        spinButton.disabled = balance < currentBet || balance <= 0;
    });
    
    restartButton.addEventListener('click', function() {
        balance = 1000;
        currentBet = 10;
        spinCount = 0;
        updateBalance();
        updateBet();
        resultElement.textContent = 'Игра начата заново! Удачи!';
        resultElement.classList.remove('win', 'jackpot');
        
        while (symbols.includes('💰')) symbols.splice(symbols.indexOf('💰'), 1);
        while (symbols.includes('🍀')) symbols.splice(symbols.indexOf('🍀'), 1);
        
        toggleBetControls(true);
        
        // Очищаем сохраненные данные при перезапуске
        localStorage.removeItem('casinoBalance');
        localStorage.removeItem('casinoCurrentBet');
        localStorage.removeItem('casinoSpinCount');
    });
    
    // Обработчики для кнопок изменения ставки
    increaseSmallBetButton.addEventListener('click', function() {
        if (currentBet + 10 <= balance && !isSpinning) {
            currentBet += 10;
            updateBet();
        }
    });
    
    increaseBetButton.addEventListener('click', function() {
        if (currentBet + 100 <= balance && !isSpinning) {
            currentBet += 100;
            updateBet();
        }
    });
    
    increaseBigBetButton.addEventListener('click', function() {
        if (currentBet + 1000 <= balance && !isSpinning) {
            currentBet += 1000;
            updateBet();
        }
    });
    
    decreaseSmallBetButton.addEventListener('click', function() {
        if (currentBet > 10 && !isSpinning) {
            currentBet = Math.max(10, currentBet - 10);
            updateBet();
        }
    });
    
    decreaseBetButton.addEventListener('click', function() {
        if (currentBet > 100 && !isSpinning) {
            currentBet = Math.max(10, currentBet - 100);
            updateBet();
        } else if (currentBet > 10 && !isSpinning) {
            currentBet = 10;
            updateBet();
        }
    });
    
    decreaseBigBetButton.addEventListener('click', function() {
        if (currentBet > 1000 && !isSpinning) {
            currentBet = Math.max(10, currentBet - 1000);
            updateBet();
        } else if (currentBet > 10 && !isSpinning) {
            currentBet = 10;
            updateBet();
        }
    });
    
    // Инициализация
    updateBalance();
    updateBet();
    spinButton.disabled = balance < currentBet || balance <= 0;
});
