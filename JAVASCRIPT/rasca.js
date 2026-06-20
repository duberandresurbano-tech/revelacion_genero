const canvas = document.getElementById('scratchCanvas');
const ctx = canvas.getContext('2d');
const scratchWrap = document.querySelector('.scratch-wrap');
const scratchHint = document.getElementById('scratchHint');
const scratchCta = document.getElementById('scratchCta');
const skipBtn = document.getElementById('skipBtn');

const REVEAL_THRESHOLD = 0.55; // 55% raspado = se revela todo
let isScratching = false;
let lastPoint = null;
let revealed = false;
let moveCount = 0;

drawScratchLayer();

function drawScratchLayer() {
    const w = canvas.width;
    const h = canvas.height;

    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#D9D2C4');
    gradient.addColorStop(1, '#B9AF9D');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 6;
    for (let i = -h; i < w; i += 22) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + h, h);
        ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 14; i++) {
        const sx = Math.random() * w;
        const sy = Math.random() * h;
        drawSparkle(sx, sy, 4 + Math.random() * 5);
    }

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-Math.PI / 14);
    ctx.fillStyle = '#4A4039';
    ctx.font = '700 22px Quicksand, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RASPA AQUÍ', 0, -6);
    ctx.font = '600 15px Quicksand, sans-serif';
    ctx.fillText('✨ 🪙 ✨', 0, 22);
    ctx.restore();
}

function drawSparkle(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.3, -size * 0.3);
    ctx.lineTo(size, 0);
    ctx.lineTo(size * 0.3, size * 0.3);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.3, size * 0.3);
    ctx.lineTo(-size, 0);
    ctx.lineTo(-size * 0.3, -size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const point = e.touches ? e.touches[0] : e;
    return {
        x: (point.clientX - rect.left) * scaleX,
        y: (point.clientY - rect.top) * scaleY
    };
}

function scratchAt(x, y) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
}

function scratchLine(p1, p2) {
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const steps = Math.max(1, Math.ceil(dist / 8));
    for (let i = 0; i <= steps; i++) {
        const x = p1.x + (p2.x - p1.x) * (i / steps);
        const y = p1.y + (p2.y - p1.y) * (i / steps);
        scratchAt(x, y);
    }
}

function startScratch(e) {
    if (revealed) return;
    isScratching = true;
    lastPoint = getPos(e);
    scratchAt(lastPoint.x, lastPoint.y);
}

function moveScratch(e) {
    if (!isScratching || revealed) return;
    e.preventDefault();
    const point = getPos(e);
    scratchLine(lastPoint, point);
    lastPoint = point;

    moveCount++;
    if (moveCount % 4 === 0) checkProgress();
}

function endScratch() {
    isScratching = false;
    checkProgress();
}

canvas.addEventListener('mousedown', startScratch);
canvas.addEventListener('mousemove', moveScratch);
window.addEventListener('mouseup', endScratch);

canvas.addEventListener('touchstart', startScratch, { passive: true });
canvas.addEventListener('touchmove', moveScratch, { passive: false });
window.addEventListener('touchend', endScratch);

function checkProgress() {
    if (revealed) return;
    const w = canvas.width;
    const h = canvas.height;
    const imageData = ctx.getImageData(0, 0, w, h).data;

    let transparent = 0;
    let total = 0;
    const stride = 4 * 4; // muestreo cada 4 píxeles para rendimiento

    for (let i = 3; i < imageData.length; i += stride) {
        total++;
        if (imageData[i] < 30) transparent++;
    }

    const ratio = transparent / total;
    if (ratio >= REVEAL_THRESHOLD) revealCard();
}

function revealCard() {
    if (revealed) return;
    revealed = true;

    canvas.classList.add('faded');
    setTimeout(() => { canvas.style.display = 'none'; }, 650);

    const rect = scratchWrap.getBoundingClientRect();
    createBurstParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);

    scratchHint.textContent = '¡Lo lograste! 🎉';
    skipBtn.classList.add('hidden');
    scratchCta.classList.remove('hidden');
}

skipBtn.addEventListener('click', () => {
    if (revealed) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    revealCard();
});
