const questions = [
    {
        text: "¿Cómo es la forma de la pancita de mamá?",
        nino: "Puntiaguda, hacia adelante",
        nina: "Redondeada y ancha"
    },
    {
        text: "¿Qué antojos ha tenido más mamá?",
        nino: "Salados y picantes",
        nina: "Dulces y postres"
    },
    {
        text: "Dicen que el ritmo cardíaco del bebé ha sido...",
        nino: "Más lento (menos de 140 lpm)",
        nina: "Más rápido (más de 140 lpm)"
    },
    {
        text: "¿Cómo ha estado la piel de mamá durante el embarazo?",
        nino: "Más reseca de lo normal",
        nina: "Más radiante de lo normal"
    },
    {
        text: "Según la leyenda del anillo colgante sobre la pancita, se mueve...",
        nino: "En línea recta",
        nina: "En círculos"
    },
    {
        text: "¿Cómo ha estado el humor de mamá?",
        nino: "Tranquilo, casi sin cambios",
        nina: "Con más cambios de humor"
    }
];

let current = 0;
let ninoCount = 0;
let ninaCount = 0;
let guestName = "";

const nameScreen = document.getElementById('nameScreen');
const quizScreen = document.getElementById('quizScreen');
const resultScreen = document.getElementById('resultScreen');
const guestNameInput = document.getElementById('guestName');
const startBtn = document.getElementById('startBtn');
const questionText = document.getElementById('questionText');
const ninoBtn = document.getElementById('ninoBtn');
const ninaBtn = document.getElementById('ninaBtn');
const progressFill = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');
const beam = document.getElementById('beam');
const balanceEmblem = document.getElementById('balanceEmblem');

startBtn.addEventListener('click', () => {
    guestName = guestNameInput.value.trim();
    nameScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    renderQuestion();
});

guestNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startBtn.click();
});

function renderQuestion() {
    const q = questions[current];
    questionText.textContent = q.text;
    ninoBtn.textContent = `💙 ${q.nino}`;
    ninaBtn.textContent = `💗 ${q.nina}`;
    progressFill.style.width = `${(current / questions.length) * 100}%`;
    progressLabel.textContent = `Pregunta ${current + 1} de ${questions.length}`;
}

function tiltBalance() {
    const diff = ninoCount - ninaCount;
    const angle = Math.max(-15, Math.min(15, diff * 5));
    balanceEmblem.classList.add('still');
    balanceEmblem.style.transform = `rotate(${angle}deg)`;
}

function answer(side) {
    if (side === 'nino') ninoCount++; else ninaCount++;
    tiltBalance();
    current++;

    if (current < questions.length) {
        setTimeout(renderQuestion, 150);
    } else {
        progressFill.style.width = '100%';
        setTimeout(showResults, 350);
    }
}

ninoBtn.addEventListener('click', () => answer('nino'));
ninaBtn.addEventListener('click', () => answer('nina'));

function showResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');

    const total = questions.length;
    const ninoPct = Math.round((ninoCount / total) * 100);
    const ninaPct = 100 - ninoPct;

    const title = guestName ? `¡Estos son tus resultados, ${guestName}!` : '¡Estos son tus resultados!';
    document.getElementById('resultTitle').textContent = title;

    let sub;
    if (ninoCount > ninaCount) {
        sub = 'Según la sabiduría popular, ¡tu predicción se inclina por el azul!';
    } else if (ninaCount > ninoCount) {
        sub = 'Según la sabiduría popular, ¡tu predicción se inclina por el rosa!';
    } else {
        sub = '¡Empate perfecto! Ni siquiera el destino se decide...';
    }
    document.getElementById('resultSub').textContent = sub;

    setTimeout(() => {
        document.getElementById('ninoBar').style.width = `${ninoPct}%`;
        document.getElementById('ninaBar').style.width = `${ninaPct}%`;
        document.getElementById('ninoPct').textContent = `${ninoPct}%`;
        document.getElementById('ninaPct').textContent = `${ninaPct}%`;
    }, 100);
}
