const canvas = document.getElementById('pixel-canvas');
const ctx = canvas.getContext('2d');
const palette = document.getElementById('color-palette');
const clearButton = document.getElementById('clear-button');
const brushSizeSlider = document.getElementById('brush-size-slider');
const saveButton = document.getElementById('save-button');
const descriptionInput = document.getElementById('description');
const characterNameInput = document.getElementById('characterName');
const undoButton = document.getElementById('undo-button');
const redoButton = document.getElementById('redo-button');

let cellSize = 16; // Each cell is always 16x16 pixels
canvas.width = cellSize * 24;
canvas.height = cellSize * 24;

let currentColor = 'black';
let drawing = false;
let brushSize = parseInt(brushSizeSlider.value);

// Initialize canvas with white background
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Stack for undo and redo
let undoStack = [];
let redoStack = [];

function saveState() {
    redoStack = [];
    undoStack.push(canvas.toDataURL());
    if (undoStack.length > 10) {
        undoStack.shift();
    }
}

function undo() {
    if (undoStack.length > 0) {
        redoStack.push(canvas.toDataURL());
        const lastState = undoStack.pop();
        const img = new Image();
        img.src = lastState;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    }
}

function redo() {
    if (redoStack.length > 0) {
        undoStack.push(canvas.toDataURL());
        const nextState = redoStack.pop();
        const img = new Image();
        img.src = nextState;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    }
}

palette.addEventListener('click', (e) => {
    if (e.target.classList.contains('color')) {
        currentColor = e.target.getAttribute('data-color');
    }
});

canvas.addEventListener('mousedown', (e) => {
    saveState();
    drawing = true;
    draw(e);
});
canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mousemove', draw);

canvas.addEventListener('touchstart', (e) => {
    saveState();
    drawing = true;
    draw(e.touches[0]);
});
canvas.addEventListener('touchend', () => drawing = false);
canvas.addEventListener('touchmove', (e) => draw(e.touches[0]));

canvas.addEventListener('click', (e) => {
    if (!drawing) draw(e);
});

// Fix mouse release bug by listening to mouseup event on window
window.addEventListener('mouseup', () => drawing = false);

clearButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
        saveState();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
});

brushSizeSlider.addEventListener('input', () => {
    brushSize = parseInt(brushSizeSlider.value);
});

saveButton.addEventListener('click', savePixelArt);

undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
    } else if (e.ctrlKey && e.key === 'x') {
        e.preventDefault();
        redo();
    }
});

function draw(e) {
    if (!drawing && e.type !== 'click') return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    ctx.fillStyle = currentColor;

    if (brushSize > 1) {
        drawPixelArtCircle(x, y, brushSize);
    } else {
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
}

function drawPixelArtCircle(centerX, centerY, radius) {
    const radiusInPixels = Math.floor(radius / 2);
    for (let y = -radiusInPixels; y <= radiusInPixels; y++) {
        for (let x = -radiusInPixels; x <= radiusInPixels; x++) {
            if (x * x + y * y <= radiusInPixels * radiusInPixels) {
                ctx.fillRect((centerX + x) * cellSize, (centerY + y) * cellSize, cellSize, cellSize);
            }
        }
    }
}

function savePixelArt() {
    const pixelData = [];
    for (let y = 0; y < 24; y++) {
        for (let x = 0; x < 24; x++) {
            const pixel = ctx.getImageData(x * cellSize, y * cellSize, 1, 1).data;
            const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
            pixelData.push(hex);
        }
    }

    const jsonString = JSON.stringify({
        pixelData: pixelData,
        description: descriptionInput.value,
        characterName: characterNameInput.value
    });
    const encoded = btoa(jsonString);

    const blob = new Blob([encoded], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pixel-art.json';
    a.click();
    URL.revokeObjectURL(url);
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}
