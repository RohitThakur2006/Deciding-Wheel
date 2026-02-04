// --- SETUP ---
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const input = document.getElementById('itemInput');
const addBtn = document.getElementById('addBtn');
const spinBtn = document.getElementById('spinBtn'); // New Button
const list = document.getElementById('itemList');

// State Variables
let items = []; 
const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF5', '#F5FF33']; 
let currentRotation = 0; // Tracks the total rotation angle

// --- FUNCTION 1: DRAW THE WHEEL ---
function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (items.length === 0) return;

    const sliceAngle = (Math.PI * 2) / items.length;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < items.length; i++) {
        // Draw Slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, 180, i * sliceAngle, (i + 1) * sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length]; 
        ctx.fill();

        // Draw Text
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

// --- FUNCTION 3: SPIN THE WHEEL ---
spinBtn.addEventListener('click', function() {
    if (items.length === 0) {
        alert("Add items first!");
        return;
    }


    // 1. Calculate a random spin (Between 3000 and 6000 degrees)
    // We add this to the 'currentRotation' so it doesn't reset to 0 every time
    const spinAmount = 3000 + Math.random() * 3000; 
    currentRotation += spinAmount;

    // 2. Apply CSS Rotation (Smooth Animation)
    // We rotate the CANVAS element itself, not the drawing
    canvas.style.transform = `rotate(${currentRotation}deg)`;
    canvas.style.transition = "transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)"; // "Ease out" effect

    // 3. Calculate Winner (After 4 seconds)
    setTimeout(() => {
        // The math to find which slice is at the arrow (3 o'clock position usually 0deg)
        // Since we rotated the canvas, we need to normalize the angle
        const actualRotation = currentRotation % 360;
        
        // In Canvas 0 is at 3 o'clock. We want the pointer at the top (270 deg relative)
        // This math is tricky. Simplest way:
        // The wheel rotates Clockwise. The "pointer" is fixed at the Right (0 degrees).
        // If we rotate 10 degrees, the item at -10 degrees hits the pointer.
        
        const sliceAngle = 360 / items.length;
        
        // Calculate index pointing at 0 degrees (Right Side)
        // We reverse the rotation to find the index
        const winningIndex = Math.floor((360 - actualRotation) / sliceAngle) % items.length;
        
        // Handle negative modulo edge case
        const index = (items.length + winningIndex) % items.length;

        alert(`Winner is: ${items[index]}`);
        
    }, 4000); // Wait 4000ms (4 seconds) matches the transition time
});
// 1. Select the new button
const resetBtn = document.getElementById('resetbtn');

// 2. Add the click listener
resetBtn.addEventListener('click', function() {
    
    // 3. Clear the Data (The Memory)
    items = []; 

    // 4. Clear the Visual List (The HTML)
    list.innerHTML = "";

    // 5. Reset the Rotation variables
    currentRotation = 0;
    canvas.style.transform = "rotate(0deg)";

    // 6. Redraw (This will wipe the canvas because items is empty)
    drawWheel();
});
