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
let cellElements = []; // Matriz con la referencia al <div> de cada celda, para acceso rápido
let foundWordsCount = 0;
let isSelecting = false;
let startCoord = null;            // Celda donde empezó el arrastre { r, col }
let currentSelectionCoords = [];  // Celdas resaltadas en este momento
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
    cellElements = [];

    for (let r = 0; r < GRID_SIZE; r++) {
        const rowEls = [];
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
            rowEls.push(cell);
        }
        cellElements.push(rowEls);
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

function getCellElement(r, c) {
    return cellElements[r] ? cellElements[r][c] : undefined;
}

// ------------------------------------------------------------------
// Selección por arrastre, pensada para que sea fácil en celular:
// no importa si el dedo se desvía un poco de la línea recta, la
// selección siempre se "endereza" hacia la dirección horizontal o
// vertical dominante entre la celda inicial y la celda actual.
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
    startCoord = { r: parseInt(cell.dataset.row), col: parseInt(cell.dataset.col) };
    updateSelectionVisuals([startCoord]);
}

function onPointerMove(e) {
    if (!isSelecting || !startCoord) return;
    e.preventDefault();

    const point = getCoordFromPoint(e.clientX, e.clientY);
    if (!point) return;

    const lineCoords = computeLineCoords(startCoord, point);
    updateSelectionVisuals(lineCoords);
}

function onPointerUp() {
    if (!isSelecting) return;
    isSelecting = false;
    checkSelectedWord(currentSelectionCoords);
    startCoord = null;
}

// Si el dedo se sale un poco del tablero (muy común al estirar hacia
// la última letra en celular), lo "recortamos" al borde más cercano
// en vez de perder la selección.
function getCoordFromPoint(clientX, clientY) {
    const rect = gridElement.getBoundingClientRect();
    const x = Math.min(Math.max(clientX, rect.left + 1), rect.right - 1);
    const y = Math.min(Math.max(clientY, rect.top + 1), rect.bottom - 1);

    const el = document.elementFromPoint(x, y);
    const cell = el ? el.closest('.grid-cell') : null;
    if (!cell) return null;

    return { r: parseInt(cell.dataset.row), col: parseInt(cell.dataset.col) };
}

// Calcula la línea recta horizontal o vertical entre la celda inicial
// y la celda actual, usando siempre la dirección dominante. Así, un
// trazo imperfecto (con algo de desvío) igual selecciona la palabra.
function computeLineCoords(start, current) {
    const deltaRow = current.r - start.r;
    const deltaCol = current.col - start.col;
    const coords = [];

    if (Math.abs(deltaCol) >= Math.abs(deltaRow)) {
        const dir = deltaCol === 0 ? 0 : Math.sign(deltaCol);
        const length = Math.abs(deltaCol);
        for (let i = 0; i <= length; i++) {
            coords.push({ r: start.r, col: start.col + dir * i });
        }
    } else {
        const dir = Math.sign(deltaRow);
        const length = Math.abs(deltaRow);
        for (let i = 0; i <= length; i++) {
            coords.push({ r: start.r + dir * i, col: start.col });
        }
    }
    return coords;
}

function updateSelectionVisuals(newCoords) {
    // Quitamos el resaltado "en progreso" de las celdas que ya no aplican
    currentSelectionCoords.forEach(coord => {
        const stillSelected = newCoords.some(c => c.r === coord.r && c.col === coord.col);
        if (!stillSelected) {
            const cell = getCellElement(coord.r, coord.col);
            if (cell) cell.classList.remove('selected');
        }
    });

    // Resaltamos las celdas nuevas (si aún no están encontradas)
    newCoords.forEach(coord => {
        const cell = getCellElement(coord.r, coord.col);
        if (cell && !cell.classList.contains('found')) {
            cell.classList.add('selected');
        }
    });

    currentSelectionCoords = newCoords;
}

function clearSelectionVisuals() {
    currentSelectionCoords.forEach(coord => {
        const cell = getCellElement(coord.r, coord.col);
        if (cell) cell.classList.remove('selected');
    });
    currentSelectionCoords = [];
}

function checkSelectedWord(selectedCoords) {
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
        selectedCoords.forEach(coord => {
            const cell = getCellElement(coord.r, coord.col);
            if (cell) {
                cell.classList.remove('selected');
                cell.classList.add('found');
                cell.style.backgroundColor = color;
            }
        });

        // Tachamos el elemento de la lista lateral utilizando su índice único
        const wordUiItem = document.getElementById(`word-item-${match.index}`);
        if (wordUiItem) wordUiItem.classList.add('word-found');

        currentSelectionCoords = [];

        // Validamos si ya completó el reto de las 20 palabras ocultas
        if (foundWordsCount === WORDS_TO_FIND.length) {
            sopaCta.classList.remove('hidden');
            sopaCta.scrollIntoView({ behavior: 'smooth' });
        }
    } else {
        // Si soltamos y no es correcto, limpiamos para reiniciar la jugada
        clearSelectionVisuals();
    }
}
