// Configuración básica del Tablero
const GRID_SIZE = 15;
const WORDS_TO_FIND = [
    "ISABELLA", "ISABELLA", "ISABELLA", "IAN", "SANTIAGO",
    "BEBE", "FAMILIA", "AMOR", "CUNA", "TETERO",
    "PANAL", "CHUPO", "SONAJERO", "MILAGRO", "DULCE",
    "PADRES", "SUENO", "ROPA", "ABRAZO", "REVELACION"
];

// Colores que se van alternando cada vez que se acierta una palabra: 1ro rosa, 2do azul...
const HIGHLIGHT_COLORS = ['rgba(255, 99, 178, 0.6)', 'rgba(70, 160, 255, 0.6)'];

let grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
let foundWordsCount = 0;
let isSelecting = false;
let selectedCells = [];
let wordPlacements = []; // Guarda las posiciones reales de las palabras inyectadas

const gridElement = document.getElementById('wordsearchGrid');
const listElement = document.getElementById('wordsList');
const countElement = document.getElementById('wordsCount');
const sopaCta = document.getElementById('sopaCta');

// Inicialización del juego
initWordSearch();

function initWordSearch() {
    // 1. Intentar ubicar todas las palabras en la matriz vacía
    WORDS_TO_FIND.forEach((word, index) => {
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 100) {
            const direction = Math.random() > 0.5 ? 'H' : 'V'; // Horizontal o Vertical
            const row = Math.floor(Math.random() * GRID_SIZE);
            const col = Math.floor(Math.random() * GRID_SIZE);

            if (canPlaceWord(word, row, col, direction)) {
                placeWord(word, row, col, direction, index);
                placed = true;
            }
            attempts++;
        }
    });

    // 2. Rellenar los espacios vacíos con letras aleatorias de la A a la Z
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === '') {
                grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        }
    }

    // 3. Pintar el tablero en el HTML
    renderGrid();

    // 4. Pintar la lista de palabras lateral
    renderWordList();

    // 5. Activar la selección por arrastre (mouse y táctil)
    setupSelectionEvents();
}

function canPlaceWord(word, row, col, dir) {
    if (dir === 'H' && col + word.length > GRID_SIZE) return false;
    if (dir === 'V' && row + word.length > GRID_SIZE) return false;

    for (let i = 0; i < word.length; i++) {
        const r = dir === 'V' ? row + i : row;
        const c = dir === 'H' ? col + i : col;
        if (grid[r][c] !== '' && grid[r][c] !== word[i]) return false;
    }
    return true;
}

function placeWord(word, row, col, dir, wordIndex) {
    let cells = [];
    for (let i = 0; i < word.length; i++) {
        const r = dir === 'V' ? row + i : row;
        const c = dir === 'H' ? col + i : col;
        grid[r][c] = word[i];
        cells.push({ r, c });
    }
    wordPlacements.push({ word, cells, found: false, index: wordIndex });
}

function renderGrid() {
    gridElement.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.textContent = grid[r][c];
            cell.dataset.row = r;
            cell.dataset.col = c;

            // Evita que el navegador haga scroll o seleccione texto mientras arrastras
            cell.style.touchAction = 'none';
            cell.style.userSelect = 'none';

            gridElement.appendChild(cell);
        }
    }
    gridElement.style.touchAction = 'none';
}

function renderWordList() {
    listElement.innerHTML = '';
    // Agrupamos visualmente para mostrar la lista en la pantalla limpia
    WORDS_TO_FIND.forEach((word, index) => {
        const li = document.createElement('li');
        li.classList.add('word-item');
        li.textContent = word;
        li.id = `word-item-${index}`;
        listElement.appendChild(li);
    });
}

// ------------------------------------------------------------------
// Selección por arrastre usando Pointer Events.
// Funciona igual con mouse (clic + arrastrar + soltar) y con el dedo
// en pantallas táctiles (tocar + deslizar + soltar), sin necesidad de
// manejar mouse y touch por separado.
// ------------------------------------------------------------------
function setupSelectionEvents() {
    gridElement.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
}

function onPointerDown(e) {
    const cell = e.target.closest('.grid-cell');
    if (!cell) return;

    e.preventDefault();
    isSelecting = true;
    clearSelectionStyles();
    selectedCells = [];
    addCellToSelection(cell);
}

function onPointerMove(e) {
    if (!isSelecting) return;
    e.preventDefault();

    // Usamos las coordenadas reales del puntero (en vez de e.target) porque
    // en táctil el navegador "captura" el target original al primer toque.
    const elAtPoint = document.elementFromPoint(e.clientX, e.clientY);
    const cell = elAtPoint ? elAtPoint.closest('.grid-cell') : null;
    addCellToSelection(cell);
}

function onPointerUp() {
    if (!isSelecting) return;
    isSelecting = false;
    checkSelectedWord();
}

function addCellToSelection(cell) {
    if (!cell || !gridElement.contains(cell)) return;
    if (cell.classList.contains('found')) return;

    if (!selectedCells.includes(cell)) {
        cell.classList.add('selected');
        selectedCells.push(cell);
    }
}

function clearSelectionStyles() {
    document.querySelectorAll('.grid-cell.selected').forEach(cell => cell.classList.remove('selected'));
}

function checkSelectedWord() {
    // Extraemos las coordenadas de las celdas actualmente seleccionadas
    const selectedCoords = selectedCells.map(cell => ({
        r: parseInt(cell.dataset.row),
        col: parseInt(cell.dataset.col)
    }));

    // Buscamos si estas coordenadas coinciden exactamente con alguna palabra guardada en el mapa
    let match = wordPlacements.find(placement => {
        if (placement.found || placement.cells.length !== selectedCoords.length) return false;

        // Validar si cada celda de la palabra está en la selección
        return placement.cells.every(pCell =>
            selectedCoords.some(sCoord => sCoord.r === pCell.r && sCoord.col === pCell.c)
        );
    });

    if (match) {
        // Marcamos la palabra como encontrada
        match.found = true;
        foundWordsCount++;
        countElement.textContent = foundWordsCount;

        // Alterna el color de acierto: 1ra palabra rosa, 2da azul, 3ra rosa, etc.
        const color = HIGHLIGHT_COLORS[(foundWordsCount - 1) % HIGHLIGHT_COLORS.length];

        // Cambiamos el estilo visual de las celdas a Acertadas ("found")
        selectedCells.forEach(cell => {
            cell.classList.remove('selected');
            cell.classList.add('found');
            cell.style.backgroundColor = color;
        });

        // Tachamos el elemento de la lista lateral utilizando su índice único
        const wordUiItem = document.getElementById(`word-item-${match.index}`);
        if (wordUiItem) wordUiItem.classList.add('word-found');

        selectedCells = [];

        // Validamos si ya completó el reto de las 20 palabras ocultas
        if (foundWordsCount === WORDS_TO_FIND.length) {
            sopaCta.classList.remove('hidden');
            sopaCta.scrollIntoView({ behavior: 'smooth' });
        }
    } else {
        // Si soltamos y no es correcto, limpiamos para reiniciar la jugada
        clearSelectionStyles();
        selectedCells = [];
    }
}
