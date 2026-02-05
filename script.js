// --- SETUP ---
const arrow = document.querySelector('.wheel-arrow'); 
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const input = document.getElementById('itemInput');
const addBtn = document.getElementById('addBtn');
const spinBtn = document.getElementById('spinBtn');
const list = document.getElementById('itemList');
const resetBtn = document.getElementById('resetbtn');

// --- NEW: MODAL ELEMENTS ---
const modal = document.getElementById('winnerModal');
const winnerText = document.getElementById('winnerText');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeIcon = document.querySelector('.close-icon');

// --- AUDIO SETUP ---
const clickSound = new Audio('clack.mp3'); 

// --- RATE LIMITER VARIABLES ---
let lastClickTime = 0;       
const minClickGap = 90;      

let items = []; 
const colors = ['#4A90E2', '#50E3C2', '#F5A623', '#D0021B', '#BD10E0', '#B8E986'];
let currentRotation = 0; 

// --- DRAW FUNCTION ---
function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (items.length === 0) {
        arrow.style.display = 'none'; 
        return;
    }
    arrow.style.display = 'block'; 

    const sliceAngle = (Math.PI * 2) / items.length;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < items.length; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, 180, i * sliceAngle, (i + 1) * sliceAngle);
        ctx.closePath();
        
        ctx.globalAlpha = 0.6; 
        ctx.fillStyle = colors[i % colors.length]; 
        ctx.fill();
        
        // YOUR CUSTOM STROKE LOGIC KEPT
        if (items.length > 1){
            ctx.globalAlpha = 1.0;
            ctx.lineWidth = 2;
            ctx.strokeStyle = "white";
            ctx.stroke();
        }

        ctx.save(); 
        ctx.translate(centerX, centerY);
        ctx.rotate((i * sliceAngle) + (sliceAngle / 2));
        ctx.textAlign = "right"; 
        ctx.fillStyle = "white";
        ctx.font = "bold 18px Arial";
        ctx.fillText(items[i], 160, 5);
        ctx.restore(); 
    }
}

// --- ADD ITEMS ---
input.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addBtn.click();
    }
});

addBtn.addEventListener('click', function() {
    const text = input.value;
    if (text === "") return;

    items.push(text);
    input.value = "";
    
    const li = document.createElement('li');
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    li.appendChild(textSpan);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️'; 
    deleteBtn.className = 'delete-btn';
    
    deleteBtn.addEventListener('click', function() {
        list.removeChild(li);
        const index = items.indexOf(text);
        if (index > -1) {
            items.splice(index, 1);
        }
        drawWheel();
    });

    li.appendChild(deleteBtn);
    list.appendChild(li);
    drawWheel();
});

// --- NEW PHYSICS: QUINTIC EASING ---
// This creates the "Suspense" effect (starts fast, ends VERY slow)
function easeOutQuint(t) {
    return 1 - Math.pow(1 - t, 5); // Power of 5 (Stronger curve than Cubic)
}

// --- SPIN LOGIC ---
spinBtn.addEventListener('click', function() {
    if (items.length === 0) {
        alert("Add items first!");
        return;
    }
    if (items.length < 2) {
        alert("You need at least 2 items to spin!");
        return; 
    }

    // --- CHANGE 1: LONGER DURATION (8 Seconds) ---
    const duration = 8000; 
    const startAngle = currentRotation;
    
    // Spin way more times (4000+ degrees) to account for the longer time
    const targetAngle = startAngle + 4000 + Math.random() * 4000; 
    const startTime = performance.now();
    const sliceAngle = 360 / items.length;
    let lastSection = Math.floor((startAngle + 90) / sliceAngle);

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1); 
        
        // --- CHANGE 2: USE QUINTIC EASING ---
        const easedProgress = easeOutQuint(progress);
        
        currentRotation = startAngle + (targetAngle - startAngle) * easedProgress;
        canvas.style.transform = `rotate(${currentRotation}deg)`;

        // --- FLICK CHECK ---
        const currentSection = Math.floor((currentRotation + 90) / sliceAngle);
        
        if (currentSection > lastSection) {
            triggerFlick(); 
            lastSection = currentSection;
        }

        if (progress < 1) {
            requestAnimationFrame(animate); 
        } else {
            // --- MODAL RESULT ---
            const actualRotation = currentRotation % 360;
            const winningIndex = Math.floor(((270 - actualRotation) % 360 + 360) % 360 / sliceAngle);
            
            winnerText.textContent = items[winningIndex];
            modal.style.display = "flex";
        }
    }

    requestAnimationFrame(animate);
});

// --- HELPER: SOUND ---
function triggerFlick() {
    arrow.classList.remove('flick');
    void arrow.offsetWidth; 
    arrow.classList.add('flick');

    const now = Date.now();
    if (now - lastClickTime > minClickGap) {
        clickSound.pause();
        clickSound.currentTime = 0; 
        clickSound.play();
        lastClickTime = now;
    }
}

// --- RESET ---
resetBtn.addEventListener('click', function() {
    items = []; 
    list.innerHTML = "";
    currentRotation = 0;
    canvas.style.transform = "rotate(0deg)";
    drawWheel();
});

// --- MODAL CLOSE LISTENERS ---
closeModalBtn.addEventListener('click', () => modal.style.display = "none");
closeIcon.addEventListener('click', () => modal.style.display = "none");
window.addEventListener('click', (event) => {
    if (event.target === modal) modal.style.display = "none";
});
