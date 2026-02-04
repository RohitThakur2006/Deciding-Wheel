// --- SETUP ---
const arrow = document.querySelector('.wheel-arrow'); 
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const input = document.getElementById('itemInput');
const addBtn = document.getElementById('addBtn');
const spinBtn = document.getElementById('spinBtn');
const list = document.getElementById('itemList');
const resetBtn = document.getElementById('resetbtn');

// --- NEW: PRESS ENTER TO ADD ---
input.addEventListener("keypress", function(event) {
    // If the user presses the "Enter" key on the keyboard
    if (event.key === "Enter") {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        addBtn.click();
    }
});
// State Variables
let items = []; 
const colors = ['#4A90E2', '#50E3C2', '#F5A623', '#D0021B', '#BD10E0', '#B8E986'];
let currentRotation = 0; 

// --- FUNCTION 1: DRAW THE WHEEL ---
function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // --- NEW LOGIC: HIDE ARROW IF EMPTY ---
    if (items.length === 0) {
        arrow.style.display = 'none'; // Hide the arrow
        return;
    }
    
    // If we have items, SHOW the arrow
    arrow.style.display = 'block'; 

    const sliceAngle = (Math.PI * 2) / items.length;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < items.length; i++) {
        // ... (The rest of your drawing loop stays exactly the same) ...
        // Draw Slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, 180, i * sliceAngle, (i + 1) * sliceAngle);
        ctx.closePath();
        
        ctx.globalAlpha = 0.6; 
        ctx.fillStyle = colors[i % colors.length]; 
        ctx.fill();

        ctx.globalAlpha = 1.0;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "white";
        ctx.stroke();

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

// --- FUNCTION 2: ADD ITEMS ---
addBtn.addEventListener('click', function() {
    const text = input.value;
    if (text === "") return;

    items.push(text);
    input.value = "";
    
    // Update HTML List
    const li = document.createElement('li');
    li.textContent = text;
    list.appendChild(li);

    drawWheel();
});

// --- HELPER: Ease Out Function (Physics for slowing down) ---
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}
spinBtn.addEventListener('click', function() {
    if (items.length === 0) {
        alert("Add items first!");
        return;
    }

    const duration = 4000; 
    const startAngle = currentRotation;
    const targetAngle = startAngle + 1800 + Math.random() * 1800; 
    const startTime = performance.now();
    const sliceAngle = 360 / items.length;
    
    // Track the section passing the TOP (270 degrees)
    // We add 90 degrees offset because 0 is at 3 o'clock, 270 is at 12 o'clock.
    // Logic: (Angle + 90) converts the top position to the standard 0 calculation
    let lastSection = Math.floor((startAngle + 90) / sliceAngle);

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1); 
        const easedProgress = easeOutCubic(progress);
        
        currentRotation = startAngle + (targetAngle - startAngle) * easedProgress;
        canvas.style.transform = `rotate(${currentRotation}deg)`;

        // --- FLICK TRIGGER (Adjusted for TOP) ---
        const currentSection = Math.floor((currentRotation + 90) / sliceAngle);
        
        if (currentSection > lastSection) {
            triggerFlick(); 
            lastSection = currentSection;
        }

        if (progress < 1) {
            requestAnimationFrame(animate); 
        } else {
            // --- WINNER CALCULATION (Adjusted for TOP) ---
            const actualRotation = currentRotation % 360;
            
            // Formula: (270 - Rotation) handles the offset for the Top position
            // We use standard modulo arithmetic to handle negative numbers safely
            const winningIndex = Math.floor(((270 - actualRotation) % 360 + 360) % 360 / sliceAngle);
            
            // Map index to item
            alert(`Winner is: ${items[winningIndex]}`);
        }
    }

    requestAnimationFrame(animate);
});
// --- HELPER: The Flick Animation Trigger ---
function triggerFlick() {
    arrow.classList.remove('flick');
    void arrow.offsetWidth; // Magic trigger to restart animation
    arrow.classList.add('flick');
}

// --- FUNCTION 4: RESET BUTTON ---
resetBtn.addEventListener('click', function() {
    items = []; 
    list.innerHTML = "";
    currentRotation = 0;
    canvas.style.transform = "rotate(0deg)";
    drawWheel();
});
