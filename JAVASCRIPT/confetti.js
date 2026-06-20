function createBurstParticles(x, y) {
    const colors = ['#A8D8EA', '#5B9BB5', '#D4A95E'];
    for (let i = 0; i < 36; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        document.body.appendChild(particle);

        const size = Math.random() * 14 + 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        const destinationX = x + (Math.random() - 0.5) * 420;
        const destinationY = y + (Math.random() - 0.5) * 420;

        const animation = particle.animate([
            { transform: `translate(${x}px, ${y}px)`, opacity: 1 },
            { transform: `translate(${destinationX}px, ${destinationY}px)`, opacity: 0 }
        ], {
            duration: 1000 + Math.random() * 1000,
            easing: 'cubic-bezier(0, .9, .57, 1)',
            delay: Math.random() * 200
        });

        animation.onfinish = () => particle.remove();
    }
}

function startConfettiRain(total = 60) {
    const colors = ['#A8D8EA', '#5B9BB5', '#D4A95E', '#FFFFFF'];

    for (let i = 0; i < total; i++) {
        setTimeout(() => {
            const piece = document.createElement('div');
            piece.classList.add('confetti-fall');
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];

            const width = Math.random() * 6 + 5;
            const height = Math.random() * 10 + 8;
            piece.style.width = `${width}px`;
            piece.style.height = `${height}px`;

            document.body.appendChild(piece);

            const fallDuration = 2800 + Math.random() * 2200;
            const drift = (Math.random() - 0.5) * 200;
            const rotation = Math.random() * 720 - 360;

            const animation = piece.animate([
                { transform: 'translate(0, -20px) rotate(0deg)', opacity: 1 },
                { transform: `translate(${drift}px, 100vh) rotate(${rotation}deg)`, opacity: 0.9 }
            ], {
                duration: fallDuration,
                easing: 'cubic-bezier(0.4, 0, 0.6, 1)'
            });

            animation.onfinish = () => piece.remove();
        }, i * 60);
    }
}
