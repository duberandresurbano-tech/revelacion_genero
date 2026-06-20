const scratchCta = document.getElementById('scratchCta');
const skipBtn = document.getElementById('skipBtn');
const scratchHint = document.getElementById('scratchHint');

const REVEAL_THRESHOLD = 0.45; // 45% raspado revela la tarjeta
let cardsRevealed = 0; // Contador global de control de troleo

setupScratchCard('canvasNino', 'textNino', 'nino');
setupScratchCard('canvasNina', 'textNina', 'nina');

function setupScratchCard(canvasId, textContainerId, type) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    let isScratching = false;
    let lastPoint = null;
    let revealed = false;
    let moveCount = 0;

    const w = canvas.width;
    const h = canvas.height;
    
    // Pintar la capa gris inicial
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#D9D2C4');
    gradient.addColorStop(1, '#B9AF9D');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 4;
    for (let i = -h; i < w; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + h, h);
        ctx.stroke();
    }

    ctx.fillStyle = '#4A4039';
    ctx.font = '700 18px Quicksand, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RASPA AQUÍ', w / 2, h / 2);

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
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    function scratchLine(p1, p2) {
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const steps = Math.max(1, Math.ceil(dist / 6));
        for (let i = 0; i <= steps; i++) {
            const x = p1.x + (p2.x - p1.x) * (i / steps);
            const y = p1.y + (p2.y - p1.y) * (i / steps);
            scratchAt(x, y);
        }
    }

    canvas.addEventListener('mousedown', (e) => {
        if (revealed) return;
        isScratching = true;
        lastPoint = getPos(e);
        scratchAt(lastPoint.x, lastPoint.y);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isScratching || revealed) return;
        e.preventDefault();
        const point = getPos(e);
        scratchLine(lastPoint, point);
        lastPoint = point;
        moveCount++;
        if (moveCount % 5 === 0) checkProgress();
    });

    const endScratch = () => {
        isScratching = false;
        checkProgress();
    };

    window.addEventListener('mouseup', endScratch);
    
    canvas.addEventListener('touchstart', (e) => {
        if (revealed) return;
        isScratching = true;
        lastPoint = getPos(e);
        scratchAt(lastPoint.x, lastPoint.y);
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (!isScratching || revealed) return;
        if (e.cancelable) e.preventDefault();
        const point = getPos(e);
        scratchLine(lastPoint, point);
        lastPoint = point;
        moveCount++;
        if (moveCount % 5 === 0) checkProgress();
    }, { passive: false });

    window.addEventListener('touchend', endScratch);

    function checkProgress() {
        if (revealed) return;
        const imageData = ctx.getImageData(0, 0, w, h).data;
        let transparent = 0;
        let total = 0;
        
        for (let i = 3; i < imageData.length; i += 16) {
            total++;
            if (imageData[i] < 30) transparent++;
        }

        if (transparent / total >= REVEAL_THRESHOLD) {
            revealed = true;
            cardsRevealed++; 
            
            const container = document.getElementById(textContainerId);
            const decor = type === 'nino' ? '💙' : '💗';

            if (cardsRevealed === 1) {
                // MODIFICACIÓN SOLICITADA: Mensaje corto, limpio y directo
                container.innerHTML = `
                    <h3>Buen intento ${decor}</h3>
                `;
            } else {
                // Mensaje para la SEGUNDA tarjeta que abran (Mantiene el misterio)
                container.innerHTML = `
                    <span class="reveal-emoji">🤫</span>
                    <h3>¡Dejen de hacer trampas!<br>Solo sabrán el género del bebé hasta el final... ${decor}</h3>
                `;
            }

            canvas.classList.add('faded');
            setTimeout(() => { canvas.style.display = 'none'; }, 600);
            
            scratchHint.textContent = cardsRevealed === 1 ? '¡Qué intriga! 🤫 ¿Vas a mirar la otra?' : '¡Descubriste ambas! Es hora de ir al final.';
            skipBtn.classList.add('hidden');
            
            // Forzar enlace correcto y texto para el botón dinámico en GitHub Pages
            if (scratchCta) {
                const btnLink = scratchCta.querySelector('a');
                if (btnLink) {
                    btnLink.setAttribute('href', 'sopa.html');
                    btnLink.innerHTML = '¡Ir al Capítulo 4: Sopa de Letras! 🔍';
                }
                scratchCta.classList.remove('hidden');
            }
        }
    }
}

skipBtn.addEventListener('click', () => {
    document.getElementById('canvasNino').style.display = 'none';
    document.getElementById('canvasNina').style.display = 'none';
    skipBtn.classList.add('hidden');
    
    if (scratchCta) {
        const btnLink = scratchCta.querySelector('a');
        if (btnLink) {
            btnLink.setAttribute('href', 'sopa.html');
            btnLink.innerHTML = '¡Ir al Capítulo 4: Sopa de Letras! 🔍';
        }
        scratchCta.classList.remove('hidden');
    }
});