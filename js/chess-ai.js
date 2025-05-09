/**
 * 象棋AI模块
 * 实现AI对弈功能
 */

// AI难度级别
const AI_DIFFICULTY = {
    EASY: 'easy',      // 简单
    MEDIUM: 'medium',  // 中等
    HARD: 'hard'       // 困难
};

// 当前AI难度
let currentDifficulty = AI_DIFFICULTY.HARD;

// 棋子价值表（用于评估局面）
const PIECE_VALUES = {
    [PIECE_TYPES.KING]: 10000,
    [PIECE_TYPES.ADVISOR]: 200,
    [PIECE_TYPES.ELEPHANT]: 200,
    [PIECE_TYPES.HORSE]: 400,
    [PIECE_TYPES.CHARIOT]: 900,
    [PIECE_TYPES.CANNON]: 450,
    [PIECE_TYPES.PAWN]: 100
};

// 位置价值表（不同位置的加成）
const POSITION_VALUES = {
    // 兵/卒的位置价值
    [PIECE_TYPES.PAWN]: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [30, 40, 50, 60, 70, 60, 50, 40, 30],
        [40, 50, 60, 70, 80, 70, 60, 50, 40],
        [50, 60, 70, 80, 90, 80, 70, 60, 50],
        [60, 70, 80, 90, 100, 90, 80, 70, 60],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]
    // 其他棋子的位置价值可以根据需要添加
};

/**
 * AI做出决策
 * @param {string} aiColor - AI的颜色
 * @returns {Object} 包含起始和目标位置的移动
 */
function makeAiMove(aiColor) {
    // 根据难度选择搜索深度
    let depth = 1;
    switch (currentDifficulty) {
        case AI_DIFFICULTY.EASY:
            depth = 1;
            break;
        case AI_DIFFICULTY.MEDIUM:
            depth = 2;
            break;
        case AI_DIFFICULTY.HARD:
            depth = 3;
            break;
    }
    
    const possibleMoves = getAllPossibleMoves(aiColor);
    
    // 如果没有可能的移动，返回null
    if (possibleMoves.length === 0) {
        return null;
    }
    
    // 在简单难度下，随机选择一个移动
    if (currentDifficulty === AI_DIFFICULTY.EASY) {
        const randomIndex = Math.floor(Math.random() * possibleMoves.length);
        return possibleMoves[randomIndex];
    }
    
    // 在中等和困难难度下，使用极小化极大算法
    let bestMove = null;
    let bestScore = -Infinity;
    
    for (const move of possibleMoves) {
        // 临时保存当前状态
        const { fromX, fromY, toX, toY } = move;
        const originalTarget = boardState[toY][toX];
        const originalSource = boardState[fromY][fromX];
        
        // 尝试移动
        boardState[toY][toX] = originalSource;
        boardState[fromY][fromX] = null;
        
        // 评估移动后的局面
        const score = -minimax(depth - 1, -Infinity, Infinity, aiColor === COLORS.RED ? COLORS.BLACK : COLORS.RED);
        
        // 恢复棋盘状态
        boardState[fromY][fromX] = originalSource;
        boardState[toY][toX] = originalTarget;
        
        // 更新最佳移动
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    
    return bestMove;
}

/**
 * 极小化极大算法
 * @param {number} depth - 搜索深度
 * @param {number} alpha - Alpha值
 * @param {number} beta - Beta值
 * @param {string} color - 当前玩家颜色
 * @returns {number} 局面评分
 */
function minimax(depth, alpha, beta, color) {
    // 达到搜索深度或游戏结束，评估局面
    if (depth === 0) {
        return evaluateBoard(color);
    }
    
    const possibleMoves = getAllPossibleMoves(color);
    
    // 如果没有可能的移动，返回极低分数（输棋）
    if (possibleMoves.length === 0) {
        return -10000;
    }
    
    let bestScore = -Infinity;
    
    for (const move of possibleMoves) {
        // 临时保存当前状态
        const { fromX, fromY, toX, toY } = move;
        const originalTarget = boardState[toY][toX];
        const originalSource = boardState[fromY][fromX];
        
        // 尝试移动
        boardState[toY][toX] = originalSource;
        boardState[fromY][fromX] = null;
        
        // 递归评估
        const score = -minimax(depth - 1, -beta, -alpha, color === COLORS.RED ? COLORS.BLACK : COLORS.RED);
        
        // 恢复棋盘状态
        boardState[fromY][fromX] = originalSource;
        boardState[toY][toX] = originalTarget;
        
        // 更新最佳分数
        bestScore = Math.max(bestScore, score);
        alpha = Math.max(alpha, score);
        
        // Alpha-Beta剪枝
        if (alpha >= beta) {
            break;
        }
    }
    
    return bestScore;
}

/**
 * 获取所有可能的移动
 * @param {string} color - 玩家颜色
 * @returns {Array} 所有可能的移动数组
 */
function getAllPossibleMoves(color) {
    const moves = [];
    
    // 遍历棋盘
    for (let fromY = 0; fromY < BOARD_HEIGHT; fromY++) {
        for (let fromX = 0; fromX < BOARD_WIDTH; fromX++) {
            const piece = boardState[fromY][fromX];
            
            // 如果是当前玩家的棋子
            if (piece && piece.color === color) {
                // 检查所有可能的目标位置
                for (let toY = 0; toY < BOARD_HEIGHT; toY++) {
                    for (let toX = 0; toX < BOARD_WIDTH; toX++) {
                        if (isValidMove(fromX, fromY, toX, toY)) {
                            moves.push({ fromX, fromY, toX, toY });
                        }
                    }
                }
            }
        }
    }
    
    return moves;
}

/**
 * 评估当前局面
 * @param {string} color - 当前玩家颜色
 * @returns {number} 局面评分
 */
function evaluateBoard(color) {
    let score = 0;
    
    // 遍历棋盘
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const piece = boardState[y][x];
            
            if (piece) {
                // 基础棋子价值
                let pieceScore = PIECE_VALUES[piece.type];
                
                // 位置加成（如果有）
                if (POSITION_VALUES[piece.type]) {
                    // 对于红方，棋盘是上下颠倒的
                    const posY = piece.color === COLORS.RED ? BOARD_HEIGHT - 1 - y : y;
                    pieceScore += POSITION_VALUES[piece.type][posY][x] || 0;
                }
                
                // 根据棋子颜色调整分数
                if (piece.color === color) {
                    score += pieceScore;
                } else {
                    score -= pieceScore;
                }
            }
        }
    }
    
    return score;
}

/**
 * 设置AI难度
 * @param {string} difficulty - 难度级别
 */
function setAiDifficulty(difficulty) {
    if (Object.values(AI_DIFFICULTY).includes(difficulty)) {
        currentDifficulty = difficulty;
    }
}

/**
 * 获取当前AI难度
 * @returns {string} 当前难度级别
 */
function getAiDifficulty() {
    return currentDifficulty;
}