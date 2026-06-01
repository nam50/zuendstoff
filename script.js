// Fragen werden aus questions.js geladen (rawQuestions)

const questions = [];
for (let i = 0; i < rawQuestions.de.length; i++) {
    questions.push({
        de: rawQuestions.de[i],
        en: rawQuestions.en[i]
    });
}

const texts = {
    de: {
        endTitle: "Das war's!",
        endDesc: "Keine weiteren Fragen verfügbar.",
        restartBtn: "Neu starten"
    },
    en: {
        endTitle: "That's it!",
        endDesc: "No more questions available.",
        restartBtn: "Restart"
    }
};

let currentLang = 'de';
let currentCardIndex = 0;
const cardContainer = document.getElementById('card-container');
const endMessage = document.getElementById('end-message');
const restartBtn = document.getElementById('restart-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const langBtn = document.getElementById('lang-btn');

function toggleLanguage() {
    currentLang = currentLang === 'de' ? 'en' : 'de';
    // If we are in German, button says 'EN' to switch to English
    langBtn.textContent = currentLang === 'de' ? 'EN' : 'DE';
    
    // Update static texts
    endMessage.querySelector('h2').textContent = texts[currentLang].endTitle;
    endMessage.querySelector('p').textContent = texts[currentLang].endDesc;
    restartBtn.textContent = texts[currentLang].restartBtn;
    
    // Update existing cards immediately without re-initializing
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const index = parseInt(card.dataset.index);
        card.querySelector('.card-content').textContent = questions[index][currentLang];
    });
}

function shuffleQuestions() {
    const cards = document.querySelectorAll('.card');
    
    // Disable button and rotate icon
    shuffleBtn.style.pointerEvents = 'none';
    shuffleBtn.style.transform = 'rotate(360deg)';
    
    // Animate current cards flying away in random directions
    cards.forEach((card) => {
        const throwX = (Math.random() - 0.5) * window.innerWidth * 1.5;
        const throwY = (Math.random() - 0.5) * window.innerHeight * 1.5;
        const rotation = (Math.random() - 0.5) * 360;
        
        card.style.transition = 'transform 0.5s cubic-bezier(0.55, 0.085, 0.68, 0.53), opacity 0.4s ease-out';
        card.style.transform = `translateX(${throwX}px) translateY(${throwY}px) rotate(${rotation}deg) scale(0.5)`;
        card.style.opacity = '0';
    });
    
    // Wait for fly away animation to finish
    setTimeout(() => {
        // Shuffle array of objects
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }
        
        // Initialize new cards
        initCards();
        
        // Prepare new cards for "pop in" animation
        const newCards = document.querySelectorAll('.card');
        newCards.forEach(card => {
            card.style.transition = 'none';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.2) translateY(-100px)';
        });
        
        // Trigger reflow to apply the start state
        void cardContainer.offsetWidth;
        
        // Restore transitions
        newCards.forEach(card => {
            card.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.6s ease';
        });
        
        // Move them to their proper stacked positions
        updateCards();
        
        // Reset shuffle button state silently
        setTimeout(() => {
            shuffleBtn.style.transition = 'none';
            shuffleBtn.style.transform = 'rotate(0)';
            setTimeout(() => {
                shuffleBtn.style.transition = 'all 0.3s ease';
                shuffleBtn.style.pointerEvents = 'auto';
            }, 50);
        }, 100);
        
    }, 450);
}

function initCards() {
    // Keep end message and remove all existing cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => card.remove());
    
    // Create cards in reverse order so the first one is on top in DOM but last in loop
    for (let i = questions.length - 1; i >= 0; i--) {
        createCard(i);
    }
    
    currentCardIndex = 0;
    endMessage.classList.remove('visible');
    updateCards();
}

function createCard(index) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.index = index;
    
    card.innerHTML = `
        <div class="card-number">${index + 1} / ${questions.length}</div>
        <div class="card-content">${questions[index][currentLang]}</div>
    `;
    
    // Insert before end message
    cardContainer.insertBefore(card, endMessage);
    setupCardEvents(card);
}

function updateCards() {
    const cards = document.querySelectorAll('.card');
    let remainingCards = 0;
    
    cards.forEach(card => {
        const cardIndex = parseInt(card.dataset.index);
        const indexDiff = cardIndex - currentCardIndex;
        
        if (indexDiff >= 0) {
            remainingCards++;
            // Calculate stacking effect
            // The top card is 1 scale, cards below scale down
            const scale = Math.max(1 - (indexDiff * 0.05), 0.8);
            const translateY = indexDiff * 20;
            const zIndex = questions.length - indexDiff;
            
            card.style.transform = `scale(${scale}) translateY(${translateY}px)`;
            card.style.zIndex = zIndex;
            card.style.opacity = indexDiff < 3 ? (1 - indexDiff * 0.2) : 0;
            
            if (indexDiff === 0) {
                card.style.pointerEvents = 'auto';
            } else {
                card.style.pointerEvents = 'none';
            }
        } else {
            // Past cards fly to the left
            card.style.transform = `translateX(-150vw) rotate(-20deg)`;
            card.style.zIndex = questions.length + indexDiff;
            card.style.opacity = 0;
            card.style.pointerEvents = 'none';
        }
    });
    
    if (remainingCards === 0) {
        endMessage.classList.add('visible');
    } else {
        endMessage.classList.remove('visible');
    }
}

function setupCardEvents(card) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    
    // Touch events
    card.addEventListener('touchstart', handleDragStart, { passive: false });
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
    
    // Mouse events
    card.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    
    function handleDragStart(e) {
        if (parseInt(card.dataset.index) !== currentCardIndex) return;
        
        isDragging = true;
        card.classList.add('dragging');
        
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        startX = clientX;
        startY = clientY;
    }
    
    function handleDragMove(e) {
        if (!isDragging) return;
        
        e.preventDefault(); // Prevent scrolling
        
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        currentX = clientX - startX;
        currentY = clientY - startY;
        
        if (currentX <= 0) {
            // Swiping Left: Move current card
            const rotation = currentX * 0.05;
            card.style.transform = `translateX(${currentX}px) translateY(${currentY}px) rotate(${rotation}deg)`;
            
            // Ensure previous card is hidden
            if (currentCardIndex > 0) {
                const prevCard = document.querySelector(`.card[data-index="${currentCardIndex - 1}"]`);
                if (prevCard) {
                    prevCard.style.transform = `translateX(-150vw) rotate(-20deg)`;
                    prevCard.style.opacity = 0;
                }
            }
        } else {
            // Swiping Right: Pull in the previous card
            if (currentCardIndex > 0) {
                const prevCard = document.querySelector(`.card[data-index="${currentCardIndex - 1}"]`);
                if (prevCard) {
                    // Current card stays completely still
                    card.style.transform = '';
                    
                    // Previous card comes in from the left
                    const startPos = -window.innerWidth;
                    const newX = Math.min(startPos + currentX * 1.5, 0);
                    const rotation = (newX / window.innerWidth) * 20;
                    
                    prevCard.classList.add('dragging');
                    prevCard.style.opacity = 1;
                    prevCard.style.transform = `translateX(${newX}px) translateY(${currentY}px) rotate(${rotation}deg)`;
                }
            } else {
                // First card, no previous card to pull. Just stretch current slightly
                const rotation = currentX * 0.02;
                card.style.transform = `translateX(${currentX * 0.3}px) translateY(${currentY * 0.3}px) rotate(${rotation}deg)`;
            }
        }
    }
    
    function handleDragEnd(e) {
        if (!isDragging) return;
        
        isDragging = false;
        card.classList.remove('dragging');
        
        if (currentCardIndex > 0) {
            const prevCard = document.querySelector(`.card[data-index="${currentCardIndex - 1}"]`);
            if (prevCard) prevCard.classList.remove('dragging');
        }
        
        const swipeThreshold = window.innerWidth * 0.25;
        
        if (currentX < -swipeThreshold) {
            // Swipe Left -> Next Card
            currentCardIndex++;
            updateCards();
        } else if (currentX > swipeThreshold && currentCardIndex > 0) {
            // Swipe Right -> Previous Card
            currentCardIndex--;
            updateCards();
        } else {
            // Snap back
            updateCards();
        }
        
        currentX = 0;
        currentY = 0;
    }
}

restartBtn.addEventListener('click', () => {
    // Shuffle array
    for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    initCards();
    
    // Pop in animation
    const newCards = document.querySelectorAll('.card');
    newCards.forEach(card => {
        card.style.transition = 'none';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.2) translateY(-100px)';
    });
    
    void cardContainer.offsetWidth;
    
    newCards.forEach(card => {
        card.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.6s ease';
    });
    
    updateCards();
});
shuffleBtn.addEventListener('click', shuffleQuestions);
langBtn.addEventListener('click', toggleLanguage);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initial shuffle
    for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    initCards();
});

// Add global touch/mouse handlers to allow swiping back from the end screen
let globalIsDragging = false;
let globalStartX = 0;
let globalStartY = 0;

cardContainer.addEventListener('touchstart', (e) => {
    if (currentCardIndex === questions.length) {
        globalIsDragging = true;
        globalStartX = e.touches[0].clientX;
        globalStartY = e.touches[0].clientY;
    }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (globalIsDragging) {
        const currentX = e.touches[0].clientX - globalStartX;
        const currentY = e.touches[0].clientY - globalStartY;
        if (currentX > 0) {
            const prevCard = document.querySelector(`.card[data-index="${currentCardIndex - 1}"]`);
            if (prevCard) {
                const startPos = -window.innerWidth;
                const newX = Math.min(startPos + currentX * 1.5, 0);
                const rotation = (newX / window.innerWidth) * 20;
                prevCard.classList.add('dragging');
                prevCard.style.opacity = 1;
                prevCard.style.transform = `translateX(${newX}px) translateY(${currentY}px) rotate(${rotation}deg)`;
            }
        }
    }
}, { passive: false });

document.addEventListener('touchend', (e) => {
    if (globalIsDragging) {
        globalIsDragging = false;
        const currentX = e.changedTouches[0].clientX - globalStartX;
        
        const prevCard = document.querySelector(`.card[data-index="${currentCardIndex - 1}"]`);
        if (prevCard) prevCard.classList.remove('dragging');
        
        if (currentX > window.innerWidth * 0.25) {
            currentCardIndex--;
        }
        updateCards();
    }
});

cardContainer.addEventListener('mousedown', (e) => {
    if (currentCardIndex === questions.length) {
        globalIsDragging = true;
        globalStartX = e.clientX;
        globalStartY = e.clientY;
    }
});

document.addEventListener('mousemove', (e) => {
    if (globalIsDragging) {
        const currentX = e.clientX - globalStartX;
        const currentY = e.clientY - globalStartY;
        if (currentX > 0) {
            const prevCard = document.querySelector(`.card[data-index="${currentCardIndex - 1}"]`);
            if (prevCard) {
                const startPos = -window.innerWidth;
                const newX = Math.min(startPos + currentX * 1.5, 0);
                const rotation = (newX / window.innerWidth) * 20;
                prevCard.classList.add('dragging');
                prevCard.style.opacity = 1;
                prevCard.style.transform = `translateX(${newX}px) translateY(${currentY}px) rotate(${rotation}deg)`;
            }
        }
    }
});

document.addEventListener('mouseup', (e) => {
    if (globalIsDragging) {
        globalIsDragging = false;
        const currentX = e.clientX - globalStartX;
        
        const prevCard = document.querySelector(`.card[data-index="${currentCardIndex - 1}"]`);
        if (prevCard) prevCard.classList.remove('dragging');
        
        if (currentX > window.innerWidth * 0.25) {
            currentCardIndex--;
        }
        updateCards();
    }
});
