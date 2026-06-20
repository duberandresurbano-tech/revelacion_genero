const balloon = document.getElementById('balloon');
const message = document.getElementById('message');
const introBlock = document.getElementById('introBlock');
const hint = document.getElementById('balloonHint');

const SUSPENSE_DURATION = 2.8; // segundos de redoble antes de revelar
let isRevealing = false;

balloon.addEventListener('click', function () {
    if (isRevealing) return;
    isRevealing = true;

    balloon.classList.add('suspense');
    hint.textContent = '🥁 Redoble de tambores...';
    hint.classList.add('suspense-hint');

    playDrumroll(SUSPENSE_DURATION);

    setTimeout(popBalloon, SUSPENSE_DURATION * 1000);
});

function popBalloon() {
    balloon.classList.remove('suspense');
    balloon.classList.add('pop');
    hint.style.display = 'none';

    createBurstParticles(
        balloon.offsetLeft + balloon.offsetWidth / 2,
        balloon.offsetTop + balloon.offsetHeight / 2
    );

    setTimeout(() => {
        balloon.style.display = 'none';
        introBlock.style.display = 'none';
        message.classList.remove('hidden');
        document.body.style.backgroundColor = '#EAF4F8';
        startConfettiRain();
    }, 300);
}

/* ---------- Redoble de tambores sintetizado (sin archivos de audio) ---------- */

let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function noiseHit(ctx, time, dur, freq, gainPeak) {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 0.9;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainPeak, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(time);
    noise.stop(time + dur);
}

function cymbalCrash(ctx, time) {
    const dur = 0.7;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3500;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(time);
    noise.stop(time + dur);
}

function playDrumroll(durationSeconds) {
    const ctx = getAudioContext();
    if (!ctx) return; // navegador sin Web Audio API: el suspenso sigue siendo visual

    const now = ctx.currentTime + 0.02;
    const endTime = now + durationSeconds;

    let t = now;
    let interval = 0.16;

    while (t < endTime - 0.08) {
        noiseHit(ctx, t, 0.07, 170, 0.45);
        interval *= 0.96;
        interval = Math.max(interval, 0.032);
        t += interval;
    }

    cymbalCrash(ctx, endTime - 0.03);
}
