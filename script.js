/**
 * File: script.js
 * Description: Polymorphic architecture to handle lottery data generation
 * and statistics filters for both Lotofácil and Mega-Sena.
 */

// Lottery rules and metadata configuration registry
const GAME_RULES = {
    lotofacil: {
        totalNumbers: 25,
        minSelected: 15,
        maxSelected: 20,
        gridLayoutClass: 'grid-lotofacil',
        themeColor: '#7b1fa2',
        themeColorHover: '#6a1b9a',
        borders: new Set([1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25]),
        validateEvenOdd: (game) => {
            const evens = game.filter(n => n % 2 === 0).length;
            return evens === 7 || evens === 8; // Standard 7x8 or 8x7 distribution
        },
        validateBorders: function(game) {
            const borderCount = game.filter(n => this.borders.has(n)).length;
            return borderCount >= 8 && borderCount <= 11;
        }
    },
    megasena: {
        totalNumbers: 60,
        minSelected: 6,
        maxSelected: 20,
        gridLayoutClass: 'grid-megasena',
        themeColor: '#20bf6b',
        themeColorHover: '#26de81',
        // External frame mapping for the 6x10 Mega-Sena layout
        borders: new Set([
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            11, 20, 21, 30, 31, 40, 41, 50,
            51, 52, 53, 54, 55, 56, 57, 58, 59, 60
        ]),
        validateEvenOdd: (game) => {
            const evens = game.filter(n => n % 2 === 0).length;
            const ratio = evens / game.length;
            return ratio >= 0.4 && ratio <= 0.6; // Balanced even/odd ratio
        },
        validateBorders: function(game) {
            const ratio = game.filter(n => this.borders.has(n)).length / game.length;
            return ratio >= 0.45 && ratio <= 0.65;
        }
    }
};

// Global state tracking
let currentGame = 'lotofacil';
const boardState = new Map(); // key: number(1-N) -> value: state (0: Neutral, 1: Fixed, 2: Excluded)

// DOM Element Selectors
const elGameType = document.getElementById('gameType');
const elBoard = document.getElementById('board');
const elNumbersPerGame = document.getElementById('numbersPerGame');
const elBtnGenerate = document.getElementById('btnGenerate');
const elResultsPanel = document.getElementById('resultsPanel');
const elGamesList = document.getElementById('gamesList');

/**
 * Syncs UI components and styles based on the selected game modality
 */
function switchModality() {
    currentGame = elGameType.value;
    const config = GAME_RULES[currentGame];

    // Dynamic theme styling inject
    document.documentElement.style.setProperty('--primary-color', config.themeColor);
    document.documentElement.style.setProperty('--primary-hover', config.themeColorHover);

    // Reset data maps
    boardState.clear();
    for (let i = 1; i <= config.totalNumbers; i++) {
        boardState.set(i, 0);
    }

    // Populate selectable numbers option dropdown list
    elNumbersPerGame.innerHTML = '';
    for (let i = config.minSelected; i <= config.maxSelected; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.innerText = `${i} dezenas ` + (i === config.minSelected ? '(Aposta Mínima)' : '');
        elNumbersPerGame.appendChild(option);
    }

    // Render interactive board matrix
    elBoard.className = `board-grid ${config.gridLayoutClass}`;
    elBoard.innerHTML = '';

    for (let i = 1; i <= config.totalNumbers; i++) {
        const button = document.createElement('button');
        button.className = 'number-ball state-0';
        button.innerText = String(i).padStart(2, '0');
        button.type = 'button';

        button.addEventListener('click', () => {
            const currentState = boardState.get(i);
            const nextState = (currentState + 1) % 3;
            boardState.set(i, nextState);
            button.className = `number-ball state-${nextState}`;
        });

        elBoard.appendChild(button);
    }

    elResultsPanel.style.display = 'none';
}

/**
 * Evaluates consecutive number streaks inside a draft combination array
 */
function validateSequences(game) {
    const sortedGame = [...game].sort((a, b) => a - b);
    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedGame.length; i++) {
        if (sortedGame[i] === sortedGame[i - 1] + 1) {
            currentStreak++;
            if (currentStreak > maxStreak) maxStreak = currentStreak;
        } else {
            currentStreak = 1;
        }
    }
    return maxStreak <= (currentGame === 'lotofacil' ? 4 : 3);
}

// --- MATHEMATICAL COMBINATORIAL UTILS ---
function getProductRange(start, end) {
    let result = 1;
    for (let i = start; i > end; i--) result *= i;
    return result;
}

function getCombinationsCount(n, k) {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    if (k > n / 2) k = n - k;
    return getProductRange(n, n - k) / getProductRange(k, 1);
}

/**
 * Processing engine that filters and outputs the generated games
 */
function processGeneration() {
    const config = GAME_RULES[currentGame];
    const numbersCount = parseInt(elNumbersPerGame.value);
    const totalGamesRequested = parseInt(document.getElementById('gameQuantity').value);
    const selectedMode = parseInt(document.getElementById('gameMode').value);

    const fixedNumbers = [];
    const excludedNumbers = [];
    const availablePool = [];

    boardState.forEach((state, number) => {
        if (state === 1) fixedNumbers.push(number);
        else if (state === 2) excludedNumbers.push(number);
        else availablePool.push(number);
    });

    if (fixedNumbers.length > numbersCount) {
        alert(`Erro: Você fixou ${fixedNumbers.length} dezenas, mas configurou o jogo para ter apenas ${numbersCount} números.`);
        return;
    }

    const remainingSlots = numbersCount - fixedNumbers.length;
    if (remainingSlots > availablePool.length) {
        alert("Erro: Espaço amostral insuficiente. Desbloqueie dezenas marcadas em vermelho.");
        return;
    }

    // Dynamic combinatorial ceiling check
    const maximumCombinations = getCombinationsCount(availablePool.length, remainingSlots);
    let gamesToTarget = totalGamesRequested;
    if (totalGamesRequested > maximumCombinations && selectedMode === 0) {
        gamesToTarget = maximumCombinations;
    }

    const generatedGamesSet = new Set();
    let currentIteration = 0;
    const maxSafetyLoops = 30000;

    while (generatedGamesSet.size < gamesToTarget && currentIteration < maxSafetyLoops) {
        currentIteration++;

        // Random sampling generation logic
        const shuffledPool = [...availablePool].sort(() => 0.5 - Math.random());
        const sampledNumbers = shuffledPool.slice(0, remainingSlots);
        const completeCombination = [...fixedNumbers, ...sampledNumbers].sort((a, b) => a - b);

        // Conditional polymorphic filter checkpoints
        if (selectedMode === 1 && !config.validateEvenOdd(completeCombination)) continue;
        if (selectedMode === 2 && !config.validateBorders(completeCombination)) continue;
        if (selectedMode === 3 && !validateSequences(completeCombination)) continue;

        const dynamicGameString = completeCombination.map(n => String(n).padStart(2, '0')).join(' ');
        generatedGamesSet.add(dynamicGameString);
    }

    // DOM UI Injection rendering
    elGamesList.innerHTML = '';
    if (generatedGamesSet.size === 0) {
        elGamesList.innerHTML = '<p style="color:var(--color-excluded); font-weight:bold;">Nenhum jogo atendeu aos filtros estritos aplicados. Experimente mudar os números fixados/bloqueados ou use a Sequência Randômica Normal.</p>';
    } else {
        let printCounter = 1;
        generatedGamesSet.forEach(gameString => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'game-line';
            rowDiv.innerText = `Jogo ${String(printCounter).padStart(2, '0')}: ${gameString}`;
            elGamesList.appendChild(rowDiv);
            printCounter++;
        });
    }

    elResultsPanel.style.display = 'block';
    elResultsPanel.scrollIntoView({ behavior: 'smooth' });
}

// Global Event Listeners Registration
document.addEventListener('DOMContentLoaded', () => {
    elGameType.addEventListener('change', switchModality);
    elBtnGenerate.addEventListener('click', processGeneration);
    
    // Bootstrap initial app layout render
    switchModality();
});
