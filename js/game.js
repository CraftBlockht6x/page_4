/**
 * 游戏主逻辑文件
 * 处理游戏初始化、用户交互和游戏状态管理
 */

// DOM 元素
const chessboard = document.getElementById('chessboard');
const currentPlayerElement = document.getElementById('current-player');
const playerIndicatorRed = document.getElementById('player-indicator-red');
const playerIndicatorBlack = document.getElementById('player-indicator-black');
const playerMovesInfoElement = document.getElementById('player-moves-info'); 
const gameStatusElement = document.getElementById('game-status');
const restartButton = document.getElementById('restart-btn');
const undoButton = document.getElementById('undo-btn');

// 游戏配置
const AI_COLOR = COLORS.BLACK;
const PLAYER_COLOR = COLORS.RED;

// 游戏状态
let currentPlayer = COLORS.RED;
let selectedPiece = null;
let gameHistory = [];
let validMoveMarkers = [];
let aiThinking = false;
let gameOver = false; // 新增游戏结束标志

// 修改initGame函数，确保正确应用让子设置
function initGame() {
    chessboard.innerHTML = '';
    
    // 获取当前让子设置下的初始棋盘
    const initialBoard = getInitialBoard();
    
    // 初始化棋盘状态
    initBoardState();
    
    // 放置棋子
    initialBoard.forEach(piece => {
        if (piece) { // 确保piece不为null
            chessboard.appendChild(createPieceElement(piece));
        }
    });
    
    // 重置游戏状态
    currentPlayer = COLORS.RED;
    selectedPiece = null;
    gameHistory = [];
    validMoveMarkers = [];
    gameOver = false; // 重置游戏结束标志
    
    // 确保重置双方的剩余步数
    resetPlayerRemainingMoves(COLORS.RED);
    resetPlayerRemainingMoves(COLORS.BLACK);
    
    updateGameStatus();
    addPieceEventListeners();

}

// 事件处理相关函数
function addPieceEventListeners() {
    const pieces = document.querySelectorAll('.chess-piece');
    pieces.forEach(piece => {
        piece.addEventListener('click', handlePieceClick);
    });
    chessboard.addEventListener('click', handleBoardClick);
}

function handlePieceClick(event) {
    // AI回合、思考中或游戏结束时不响应点击
    if (currentPlayer === AI_COLOR || aiThinking || gameOver) {
        return;
    }

    const pieceElement = event.target;
    const pieceColor = pieceElement.dataset.color;

    if (pieceColor === currentPlayer) {
        // 处理己方棋子选中
        if (selectedPiece) {
            selectedPiece.classList.remove('selected');
            clearValidMoveMarkers();
        }
        
        selectedPiece = pieceElement;
        selectedPiece.classList.add('selected');
        showValidMoves(parseInt(pieceElement.dataset.x), parseInt(pieceElement.dataset.y));
    } else if (selectedPiece) {
        // 处理吃子
        const fromX = parseInt(selectedPiece.dataset.x);
        const fromY = parseInt(selectedPiece.dataset.y);
        const toX = parseInt(pieceElement.dataset.x);
        const toY = parseInt(pieceElement.dataset.y);
        tryMovePiece(fromX, fromY, toX, toY);
    }
    
    event.stopPropagation();
}

function handleBoardClick(event) {
    // 如果没有选中的棋子，或者点击的是棋子，或者游戏结束，不处理
    if (!selectedPiece || event.target.classList.contains('chess-piece') || gameOver) {
        return;
    }

    // 获取点击的位置（相对于棋盘）
    const boardRect = chessboard.getBoundingClientRect();
    const cellWidth = boardRect.width / BOARD_WIDTH;
    const cellHeight = boardRect.height / BOARD_HEIGHT;
    const clickX = event.clientX - boardRect.left;
    const clickY = event.clientY - boardRect.top;
    
    // 计算棋盘坐标
    const toX = Math.floor(clickX / cellWidth);
    const toY = Math.floor(clickY / cellHeight);
    
    // 获取选中棋子的坐标
    const fromX = parseInt(selectedPiece.dataset.x);
    const fromY = parseInt(selectedPiece.dataset.y);
    
    // 尝试移动棋子
    tryMovePiece(fromX, fromY, toX, toY);
}

function showValidMoves(x, y) {
    clearValidMoveMarkers();
    
    // 遍历棋盘所有位置
    for (let toY = 0; toY < BOARD_HEIGHT; toY++) {
        for (let toX = 0; toX < BOARD_WIDTH; toX++) {
            // 检查移动是否合法
            if (isValidMove(x, y, toX, toY)) {
                // 创建标记
                const marker = document.createElement('div');
                marker.className = 'valid-move';
                marker.style.left = `${(toX / (BOARD_WIDTH - 1)) * 100}%`;
                marker.style.top = `${(toY / (BOARD_HEIGHT - 1)) * 100}%`;
                
                // 添加点击事件
                marker.addEventListener('click', () => {
                    tryMovePiece(x, y, toX, toY);
                });
                
                chessboard.appendChild(marker);
                validMoveMarkers.push(marker);
            }
        }
    }
}

function clearValidMoveMarkers() {
    validMoveMarkers.forEach(marker => marker.remove());
    validMoveMarkers = [];
}

/**
 * 尝试移动棋子
 * @param {number} fromX - 起始位置X坐标
 * @param {number} fromY - 起始位置Y坐标
 * @param {number} toX - 目标位置X坐标
 * @param {number} toY - 目标位置Y坐标
 * @returns {boolean} 移动是否成功
 */
function tryMovePiece(fromX, fromY, toX, toY) {
    // 如果游戏已结束，不允许移动
    if (gameOver) {
        return false;
    }
    
    const moveResult = movePiece(fromX, fromY, toX, toY);
    
    if (moveResult.success) {
        gameHistory.push({
            fromX, fromY, toX, toY,
            capturedPiece: moveResult.captured,
            piece: boardState[toY][toX]
        });

        // 更新剩余步数
        if (moveSettings && moveSettings[currentPlayer]) {
            moveSettings[currentPlayer].remainingMoves--;
        }

        updateBoardUI();
        
        if (selectedPiece) {
            selectedPiece.classList.remove('selected');
            selectedPiece = null;
        }
        clearValidMoveMarkers();
        
        // 检查游戏状态，统一在这里处理胜负判断
        const gameStatus = checkGameStatus();
        
        // 如果游戏已经结束，立即结束回合
        if (gameStatus.gameEnded) {
            gameOver = true;
            // 强制结束当前回合
            if (moveSettings && moveSettings[currentPlayer]) {
                moveSettings[currentPlayer].remainingMoves = 0;
            }
            // 显示游戏结果
            gameStatusElement.textContent = gameStatus.message;
            disableBoard();
        }
        
        // 检查是否需要切换玩家
        if (gameOver || !moveSettings || moveSettings[currentPlayer].remainingMoves <= 0) {
            // 切换玩家
            currentPlayer = currentPlayer === COLORS.RED ? COLORS.BLACK : COLORS.RED;
            
            // 重置新玩家的步数
            if (moveSettings && !gameOver) {
                resetPlayerRemainingMoves(currentPlayer);
            }
            
            // 如果是玩家回合结束，并且下一回合是AI，则触发AI回合
            if (currentPlayer === AI_COLOR && !gameOver) {
                setTimeout(makeAiTurn, 500);
            }
        }
        
        updateGameStatus();
        return true;
    }
    
    return false;
}

function updateBoardUI() {
    chessboard.innerHTML = '';
        
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const piece = boardState[y][x];
            if (piece) {
                const pieceElement = createPieceElement({ ...piece, x, y });
                chessboard.appendChild(pieceElement);
            }
        }
    }
    
    addPieceEventListeners();
}

/**
 * 检查游戏状态
 * @returns {Object} 包含游戏状态信息的对象
 */
function checkGameStatus() {
    // 检查是否有一方的将帅已经被吃掉
    let redKingExists = false;
    let blackKingExists = false;
    
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const piece = boardState[y][x];
            if (piece && piece.type === PIECE_TYPES.KING) {
                if (piece.color === COLORS.RED) {
                    redKingExists = true;
                } else {
                    blackKingExists = true;
                }
            }
        }
    }
    
    // 如果有一方的将帅被吃掉，游戏立即结束
    if (!redKingExists) {
        return {
            gameEnded: true,
            message: '黑方胜利！'
        };
    } else if (!blackKingExists) {
        return {
            gameEnded: true,
            message: '红方胜利！'
        };
    }
    
    // 检查将军和将死状态
    if (isCheck(currentPlayer)) {
        const message = `${currentPlayer === COLORS.RED ? '红方' : '黑方'}被将军！`;
        
        if (isCheckmate(currentPlayer)) {
            return {
                gameEnded: true,
                message: `${currentPlayer === COLORS.RED ? '黑方' : '红方'}胜利！`
            };
        }
        
        return {
            gameEnded: false,
            message: message
        };
    }
    
    return {
        gameEnded: false,
        message: ''
    };
}


function updateGameStatus() {
    if (!playerIndicatorRed || !playerIndicatorBlack || !playerMovesInfoElement) {
        console.error("Player indicator or moves info element not found!");
        return;
    }

    if (gameOver) {
        // 游戏结束时，两个指示器都变为非激活状态
        playerIndicatorRed.classList.remove('active');
        playerIndicatorBlack.classList.remove('active');
        playerMovesInfoElement.textContent = ''; // 清空步数信息
        // gameStatusElement 由 tryMovePiece 中的 checkGameStatus 结果驱动
        return;
    }


    // 根据当前玩家激活对应的指示器
    if (currentPlayer === COLORS.RED) {
        playerIndicatorRed.classList.add('active');
        playerIndicatorBlack.classList.remove('active');
    } else if (currentPlayer === COLORS.BLACK) {
        playerIndicatorBlack.classList.add('active');
        playerIndicatorRed.classList.remove('active');
    } else {
        // 其他情况或初始状态，都设为不激活
        playerIndicatorRed.classList.remove('active');
        playerIndicatorBlack.classList.remove('active');
    }

    // 更新剩余步数信息
    if (moveSettings && moveSettings[currentPlayer] && typeof moveSettings[currentPlayer].remainingMoves === 'number') {
        playerMovesInfoElement.textContent = `(剩余${moveSettings[currentPlayer].remainingMoves}步)`;
    } else {
        playerMovesInfoElement.textContent = ''; // 如果没有步数信息，清空
    }



    if (gameStatusElement) {
        const gameStatusInfo = checkGameStatus(); // 先获取将军等状态
        
        // === 在这里插入针对 AI 思考中的特殊处理 ===
        if (aiThinking && currentPlayer === AI_COLOR) { // 确保是AI的回合并且它在思考
            let aiPlayerName = (AI_COLOR === COLORS.RED) ? "红方" : "黑方";
            if (gameStatusInfo.message && !gameStatusInfo.gameEnded) { // AI思考中但被将军
                gameStatusElement.textContent = `${aiPlayerName} 思考中... (${gameStatusInfo.message})`;
            } else if (!gameStatusInfo.gameEnded) { // AI思考中且无将军
                gameStatusElement.textContent = `${aiPlayerName} 思考中...`;
            }
            // 如果 gameStatusInfo.gameEnded 为 true，则让下面的 gameOver 逻辑处理
        }
        // === AI 思考中处理结束 ===
        else if (!gameStatusInfo.gameEnded && gameStatusInfo.message) { // 有将军等信息且游戏未结束
            gameStatusElement.textContent = gameStatusInfo.message;
        } else if (!gameStatusInfo.gameEnded && !gameStatusInfo.message) { // 游戏未结束，且无将军等信息
            // ============== 这是你指出的关键修改处 ==============
            if (currentPlayer === PLAYER_COLOR) {
                let playerDisplayName = (PLAYER_COLOR === COLORS.RED) ? "红方" : "黑方";
                gameStatusElement.textContent = `${playerDisplayName}请走棋`; // 或者 `${playerDisplayName}思考中`
            } else {
                // 其他情况（比如AI回合刚开始，aiThinking还未true，或者理论上不应出现的状态）
                gameStatusElement.textContent = ""; // 可以保持清空或设置一个默认值
}}}
   
}




function disableBoard() {
    const pieces = document.querySelectorAll('.chess-piece');
    pieces.forEach(piece => {
        piece.removeEventListener('click', handlePieceClick);
    });
    chessboard.removeEventListener('click', handleBoardClick);
}

function undoMove() {
    if (gameHistory.length === 0 || aiThinking) {
        return;
    }
    
    // 如果游戏已结束，重新启用棋盘
    if (gameOver) {
        gameOver = false;
        addPieceEventListeners();
    }
    
    const steps = currentPlayer === PLAYER_COLOR ? 2 : 1;
    
    for (let i = 0; i < steps; i++) {
        if (gameHistory.length === 0) break;
        
        const lastMove = gameHistory.pop();
        boardState[lastMove.fromY][lastMove.fromX] = lastMove.piece;
        boardState[lastMove.toY][lastMove.toX] = lastMove.capturedPiece;
        
        // 切换玩家
        currentPlayer = currentPlayer === COLORS.RED ? COLORS.BLACK : COLORS.RED;
    }
    
    // 重置当前玩家的剩余步数
    if (moveSettings && moveSettings[currentPlayer]) {
        resetPlayerRemainingMoves(currentPlayer);
    }
    
    updateBoardUI();
    gameStatusElement.textContent = '';
    updateGameStatus();
}

function makeAiTurn() {
    if (currentPlayer !== AI_COLOR || aiThinking || gameOver) return;

    aiThinking = true;
 //   gameStatusElement.textContent = 'AI思考中...';
 updateGameStatus(); 
    // 使用setTimeout让UI有机会更新
    setTimeout(() => {
        // 获取当前AI可移动的步数
        const remainingMoves = moveSettings[AI_COLOR].remainingMoves;
        let moveMade = false;
        
        // 获取所有可能的移动
        const possibleMoves = getAllPossibleMoves(AI_COLOR);
        
        // 如果没有可能的移动，AI认输
        if (possibleMoves.length === 0) {
            gameOver = true;
            gameStatusElement.textContent = '黑方无子可走，红方胜利！';
            moveSettings[AI_COLOR].remainingMoves = 0;
            currentPlayer = PLAYER_COLOR;
            updateGameStatus();
            aiThinking = false;
            return;
        }
        
        // AI连续移动多步
        for (let i = 0; i < remainingMoves && !gameOver; i++) {
            // 尝试使用AI算法获取最佳移动
            const aiMove = makeAiMove(AI_COLOR);
            
            if (aiMove) {
                // 执行移动
                const moveResult = tryMovePiece(aiMove.fromX, aiMove.fromY, aiMove.toX, aiMove.toY);
                
                // 如果移动成功，标记已移动
                if (moveResult) {
                    moveMade = true;
                }
                
                // 如果移动失败或没有剩余步数或游戏结束，结束AI回合
                if (!moveResult || moveSettings[AI_COLOR].remainingMoves <= 0 || gameOver) {
                    break;
                }
            } else {
                // 如果AI算法没有返回移动但有可能的移动，随机选择一个
                const randomIndex = Math.floor(Math.random() * possibleMoves.length);
                const randomMove = possibleMoves[randomIndex];
                
                // 执行随机移动
                const moveResult = tryMovePiece(randomMove.fromX, randomMove.fromY, randomMove.toX, randomMove.toY);
                if (moveResult) {
                    moveMade = true;
                }
                
                // 如果移动失败或没有剩余步数或游戏结束，结束AI回合
                if (!moveResult || moveSettings[AI_COLOR].remainingMoves <= 0 || gameOver) {
                    break;
                }
            }
        }

        // 如果AI没有成功移动任何棋子，但仍有剩余步数，强制结束回合
        if (!moveMade && moveSettings[AI_COLOR].remainingMoves > 0) {
            // 确保AI至少移动一个棋子
            if (possibleMoves.length > 0) {
                const randomIndex = Math.floor(Math.random() * possibleMoves.length);
                const randomMove = possibleMoves[randomIndex];
                tryMovePiece(randomMove.fromX, randomMove.fromY, randomMove.toX, randomMove.toY);
            } else {
                // 如果真的没有可能的移动，结束回合
                moveSettings[AI_COLOR].remainingMoves = 0;
                currentPlayer = PLAYER_COLOR;
                updateGameStatus();
            }
        }

        aiThinking = false;
    //    if (!gameOver) {            gameStatusElement.textContent = '';        }
    }, 500);
}

// 添加步数设置函数
function setPlayerMoves(color, moves) {
    if (moves >= 1 && moves <= 3) {
        moveSettings[color].maxMoves = moves;
        moveSettings[color].remainingMoves = moves;
    }
}

// 重置玩家剩余步数
function resetPlayerRemainingMoves(color) {
    moveSettings[color].remainingMoves = moveSettings[color].maxMoves;
}

// 修改让子设置处理函数
function initHandicapSettings() {
    const handicapInputs = document.querySelectorAll('.piece-selection input');
    
    handicapInputs.forEach(input => {
        input.addEventListener('change', function() {
            const color = this.dataset.color;
            const type = this.dataset.type;
            const index = parseInt(this.dataset.index);
            
            // 重置该颜色该类型的让子设置
            handicapSettings[color] = handicapSettings[color].filter(
                h => h.type !== type || h.index !== index
            );
            
            // 如果选中，则添加新的让子设置
            if (this.checked) {
                handicapSettings[color].push({
                    type: type,
                    index: index
                });
            }
            
            // 立即重新初始化游戏以应用新的让子设置
            initGame();
        });
    });
}

// 添加重置让子设置的函数
function resetHandicapUI() {
    const handicapInputs = document.querySelectorAll('.piece-selection input');
    handicapInputs.forEach(input => {
        input.checked = false;
    });
}

// 修改重新开始按钮的事件处理
restartButton.addEventListener('click', function() {
    resetHandicapSettings(); // 重置让子设置
    resetHandicapUI();      // 重置让子UI
    initGame();             // 重新初始化游戏
});

// 在文件底部添加步数设置的事件监听器
document.getElementById('red-moves').addEventListener('change', function(e) {
    if (typeof setPlayerMoves === 'function') {
        setPlayerMoves(COLORS.RED, parseInt(e.target.value));
        // 如果当前是红方回合，立即更新显示
        if (currentPlayer === COLORS.RED) {
            updateGameStatus();
        }
    }
});

document.getElementById('black-moves').addEventListener('change', function(e) {
    if (typeof setPlayerMoves === 'function') {
        setPlayerMoves(COLORS.BLACK, parseInt(e.target.value));
        // 如果当前是黑方回合，立即更新显示
        if (currentPlayer === COLORS.BLACK) {
            updateGameStatus();
        }
    }
});

// 绑定悔棋按钮事件
undoButton.addEventListener('click', undoMove);

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    initHandicapSettings();
    initGame();
});