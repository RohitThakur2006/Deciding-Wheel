// ==========================================
//      WHEEL OF FORTUNE - HYBRID PHYSICS
// ==========================================

// --- 1. SETUP & VARIABLES ---
const arrow = document.querySelector('.wheel-arrow'); 
const canvas = document.getElementById('wheelCanvas') || document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const spinner = document.getElementById('loadingSpinner');
// Elements
const input = document.getElementById('itemInput');
const addBtn = document.getElementById('addBtn');
const spinBtn = document.getElementById('spinBtn');
const list = document.getElementById('itemList'); // Kept as 'list' to match your pref
const resetBtn = document.getElementById('resetbtn');

// Locking Groups (For disabling buttons)
const inputGroup = document.querySelector('.input-group');

// Modal Elements
const modal = document.getElementById('winnerModal');
const winnerText = document.getElementById('winnerText');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeIcon = document.querySelector('.close-icon');

// Audio
const clickSound = new Audio('clack.mp3'); 

// State Variables
let items = []; 
const colors = ['#4A90E2', '#50E3C2', '#F5A623', '#D0021B', '#BD10E0', '#B8E986'];
let currentRotation = 0; 
let lastClickTime = 0;       
const minClickGap = 90; // Prevents sound spam

// --- 2. GLOBAL LOCK (Prevents Cheating) ---
function setGlobalLock(locked) {
    if (locked) {
        inputGroup.classList.add('frozen');
        list.classList.add('frozen');
        if (resetBtn) resetBtn.classList.add('frozen');
        spinBtn.classList.add('frozen'); 
        spinBtn.disabled = true; 
    } else {
        inputGroup.classList.remove('frozen');
        list.classList.remove('frozen');
        if (resetBtn) resetBtn.classList.remove('frozen');
        spinBtn.classList.remove('frozen');
        spinBtn.disabled = false;
    }
}

// --- 3. DRAW FUNCTION ---
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
        
        ctx.fillStyle = colors[i % colors.length]; 
        ctx.fill();
        
        // White Borders
        if (items.length > 1){
            ctx.lineWidth = 2;
            ctx.strokeStyle = "white";
            ctx.stroke();
        }

        // Text
        ctx.save(); 
        ctx.translate(centerX, centerY);
        ctx.rotate((i * sliceAngle) + (sliceAngle / 2));
        ctx.textAlign = "right"; 
        ctx.fillStyle = "white";
        ctx.font = "bold 18px Arial";
        let textToDraw = items[i];
        if (textToDraw.length > 15) {
            textToDraw = textToDraw.substring(0, 15) + "...";
        }
        ctx.fillText(textToDraw, 160, 5); 
        ctx.restore();
    }
}

// --- 4. ADD ITEMS (With URL Check) ---
addBtn.addEventListener('click', async function() {
    const text = input.value;
    if (text === "") return;

    if (isValidUrl(text)) {
        input.value = "Searching..."; 
        input.disabled = true; 
        try {
            const response = await fetch('https://wheel-backend-33vx.onrender.com/get-title', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: text })
            });
            const data = await response.json();
            
            input.value = "";
            input.disabled = false;
            input.focus();

            if (response.ok && data.title) {
                addItemToWheel(data.title); 
            } else {
                alert("❌ Could not find product name!, Please Try Again");
            }
        } catch (error) {
            input.value = "";
            input.disabled = false;
            alert("❌ Server Error: Is Python running?");
        }
    } else {
        input.value = "";
        addItemToWheel(text);
    }
});

function addItemToWheel(text) {
    items.push(text);
    
    const li = document.createElement('li');
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    li.appendChild(textSpan);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️'; 
    deleteBtn.className = 'delete-btn';
    
    deleteBtn.addEventListener('click', function() {
        // Locked by CSS, but good to have safety
        list.removeChild(li);
        const index = items.indexOf(text);
        if (index > -1) items.splice(index, 1);
        drawWheel();
    });

    li.appendChild(deleteBtn);
    list.appendChild(li);
    drawWheel();
}

// --- 5. PHYSICS ENGINE (Quintic Easing) ---
// This is the smooth "Start Fast, End Slow" math
function easeOutQuint(t) {
    return 1 - Math.pow(1 - t, 5); 
}

// --- 6. SPIN LOGIC (Restored & Fixed) ---
spinBtn.addEventListener('click', function() {
    if (items.length < 2) {
        alert("You need at least 2 items to spin!");
        return; 
    }

    // A. LOCK EVERYTHING
    setGlobalLock(true);

    // B. SETUP ANIMATION
    const duration = 8000; // 8 Seconds
    const startAngle = currentRotation;
    // Spin at least 10 times (3600) + random
    const targetAngle = startAngle + 3600 + Math.random() * 360; 
    const startTime = performance.now();
    const sliceAngle = 360 / items.length;
    
    // For calculating the "Click" sound
    let lastSection = Math.floor((startAngle + 90) / sliceAngle);

    // C. THE ANIMATION LOOP
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1); 
        
        // Apply Physics Math
        const easedProgress = easeOutQuint(progress);
        currentRotation = startAngle + (targetAngle - startAngle) * easedProgress;
        
        // Rotate the Canvas
        canvas.style.transform = `rotate(${currentRotation}deg)`;

        // Check for "Clicks"
        const currentSection = Math.floor((currentRotation + 90) / sliceAngle);
        if (currentSection > lastSection) {
            triggerFlick(); 
            lastSection = currentSection;
        }

        // Continue or Finish?
        if (progress < 1) {
            requestAnimationFrame(animate); 
        } else {
            // D. FINISHED!
            const actualRotation = currentRotation % 360;
            // Correct Math to find the winner at the top (270 degrees)
            const winningIndex = Math.floor(((270 - actualRotation) % 360 + 360) % 360 / sliceAngle);
            
            winnerText.textContent = items[winningIndex];
            modal.style.display = "flex";
            
            // Unlock Everything
            setGlobalLock(false);
        }
    }

    requestAnimationFrame(animate);
});

// --- 7. HELPERS & RESET ---
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

if (resetBtn) {
    resetBtn.addEventListener('click', function() {
        items = []; 
        list.innerHTML = "";
        currentRotation = 0;
        canvas.style.transform = "rotate(0deg)";
        drawWheel();
    });
}

input.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addBtn.click();
    }
});

function isValidUrl(string) {
    try { new URL(string); return true; } catch (_) { return false; }
}

closeModalBtn.addEventListener('click', () => modal.style.display = "none");
closeIcon.addEventListener('click', () => modal.style.display = "none");
window.addEventListener('click', (event) => {
    if (event.target === modal) modal.style.display = "none";
});