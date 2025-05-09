/**
 * 象棋规则文件
 * 定义了各种棋子的移动规则和游戏规则判断
 */

// 棋盘边界常量
const BOARD_WIDTH = 9;
const BOARD_HEIGHT = 10;

// 九宫格边界
const PALACE = {
    [COLORS.RED]: { minX: 3, maxX: 5, minY: 7, maxY: 9 },
    [COLORS.BLACK]: { minX: 3, maxX: 5, minY: 0, maxY: 2 }
};

// 当前棋盘状态，二维数组表示
let boardState = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(null));

// 连续移动步数配置
const moveSettings = {
    [COLORS.RED]: {
        maxMoves: 1,    // 红方每回合可以连续移动的步数
        remainingMoves: 1  // 当前回合剩余可移动步数
    },
    [COLORS.BLACK]: {
        maxMoves: 1,    // 黑方每回合可以连续移动的步数
        remainingMoves: 1  // 当前回合剩余可移动步数
    }
};

// 设置玩家连续移动步数
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

// 修改初始化棋盘状态函数
function initBoardState() {
    // 清空棋盘
    boardState = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(null));
    
    // 获取考虑让子的初始棋盘配置
    const initialBoard = getInitialBoard();
    
    // 放置棋子
    initialBoard.forEach(piece => {
        if (piece) { // 确保piece不为null
            boardState[piece.y][piece.x] = { 
                type: piece.type, 
                color: piece.color 
            };
        }
    });
    
    return boardState;
}

// 检查坐标是否在棋盘内
function isInsideBoard(x, y) {
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT;
}

// 检查坐标是否在九宫格内
function isInsidePalace(x, y, color) {
    const palace = PALACE[color];
    return x >= palace.minX && x <= palace.maxX && y >= palace.minY && y <= palace.maxY;
}

// 获取两点之间的棋子数量（用于车和炮的移动判断）
function getPiecesBetween(fromX, fromY, toX, toY) {
    let count = 0;
    
    // 水平移动
    if (fromY === toY) {
        const minX = Math.min(fromX, toX);
        const maxX = Math.max(fromX, toX);
        
        for (let x = minX + 1; x < maxX; x++) {
            if (boardState[fromY][x] !== null) {
                count++;
            }
        }
    }
    // 垂直移动
    else if (fromX === toX) {
        const minY = Math.min(fromY, toY);
        const maxY = Math.max(fromY, toY);
        
        for (let y = minY + 1; y < maxY; y++) {
            if (boardState[y][fromX] !== null) {
                count++;
            }
        }
    }
    
    return count;
}

// 验证移动是否合法
function isValidMove(fromX, fromY, toX, toY) {
    // 检查起始位置是否有棋子
    if (!boardState[fromY][fromX]) {
        return false;
    }
    
    // 获取棋子信息
    const piece = boardState[fromY][fromX];
    const targetPiece = boardState[toY][toX];
    
    // 不能吃自己的棋子
    if (targetPiece && targetPiece.color === piece.color) {
        return false;
    }
    
    // 根据棋子类型验证移动
    switch (piece.type) {
        case PIECE_TYPES.KING:
            return isValidKingMove(fromX, fromY, toX, toY, piece.color);
        case PIECE_TYPES.ADVISOR:
            return isValidAdvisorMove(fromX, fromY, toX, toY, piece.color);
        case PIECE_TYPES.ELEPHANT:
            return isValidElephantMove(fromX, fromY, toX, toY, piece.color);
        case PIECE_TYPES.HORSE:
            return isValidHorseMove(fromX, fromY, toX, toY);
        case PIECE_TYPES.CHARIOT:
            return isValidChariotMove(fromX, fromY, toX, toY);
        case PIECE_TYPES.CANNON:
            return isValidCannonMove(fromX, fromY, toX, toY);
        case PIECE_TYPES.PAWN:
            return isValidPawnMove(fromX, fromY, toX, toY, piece.color);
        default:
            return false;
    }
}

// 将/帅移动规则
function isValidKingMove(fromX, fromY, toX, toY, color) {
    // 必须在九宫格内
    if (!isInsidePalace(toX, toY, color)) {
        return false;
    }
    
    // 一次只能移动一格，横向或纵向
    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);
    
    // 将帅对脸检查
    if (dx === 0 && dy === 0) {
        // 在同一列上
        const otherKingX = fromX;
        let otherKingY = -1;
        
        // 寻找对方的将/帅
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            if (boardState[y][otherKingX] && 
                boardState[y][otherKingX].type === PIECE_TYPES.KING && 
                boardState[y][otherKingX].color !== color) {
                otherKingY = y;
                break;
            }
        }
        
        // 检查两个将/帅之间是否有其他棋子
        if (otherKingY !== -1) {
            const minY = Math.min(fromY, otherKingY);
            const maxY = Math.max(fromY, otherKingY);
            let hasPieceBetween = false;
            
            for (let y = minY + 1; y < maxY; y++) {
                if (boardState[y][fromX] !== null) {
                    hasPieceBetween = true;
                    break;
                }
            }
            
            // 如果没有棋子阻挡，则不能移动到这个位置（会造成将帅对脸）
            if (!hasPieceBetween) {
                return false;
            }
        }
    }
    
    return (dx + dy === 1);
}

// 士/仕移动规则
function isValidAdvisorMove(fromX, fromY, toX, toY, color) {
    // 必须在九宫格内
    if (!isInsidePalace(toX, toY, color)) {
        return false;
    }
    
    // 只能斜着走一格
    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);
    
    return (dx === 1 && dy === 1);
}

// 象/相移动规则
function isValidElephantMove(fromX, fromY, toX, toY, color) {
    // 不能过河
    if (color === COLORS.RED && toY < 5) {
        return false;
    }
    if (color === COLORS.BLACK && toY > 4) {
        return false;
    }
    
    // 走田字格
    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);
    
    if (dx !== 2 || dy !== 2) {
        return false;
    }
    
    // 检查象眼是否被堵
    const eyeX = (fromX + toX) / 2;
    const eyeY = (fromY + toY) / 2;
    
    return boardState[eyeY][eyeX] === null;
}

// 马移动规则
function isValidHorseMove(fromX, fromY, toX, toY) {
    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);
    
    // 马走日
    if (!((dx === 1 && dy === 2) || (dx === 2 && dy === 1))) {
        return false;
    }
    
    // 检查马脚是否被绊
    let legX = fromX;
    let legY = fromY;
    
    if (dx === 1) { // 竖着走，检查横向马脚
        legY = fromY + (toY > fromY ? 1 : -1);
    } else { // 横着走，检查纵向马脚
        legX = fromX + (toX > fromX ? 1 : -1);
    }
    
    return boardState[legY][legX] === null;
}

// 车移动规则
function isValidChariotMove(fromX, fromY, toX, toY) {
    // 只能横向或纵向移动
    if (fromX !== toX && fromY !== toY) {
        return false;
    }
    
    // 路径上不能有其他棋子
    return getPiecesBetween(fromX, fromY, toX, toY) === 0;
}

// 炮移动规则
function isValidCannonMove(fromX, fromY, toX, toY) {
    // 只能横向或纵向移动
    if (fromX !== toX && fromY !== toY) {
        return false;
    }
    
    const pieceCount = getPiecesBetween(fromX, fromY, toX, toY);
    const targetPiece = boardState[toY][toX];
    
    // 移动：中间不能有棋子
    if (targetPiece === null) {
        return pieceCount === 0;
    }
    // 吃子：中间必须有且只有一个棋子
    else {
        return pieceCount === 1;
    }
}

// 兵/卒移动规则
function isValidPawnMove(fromX, fromY, toX, toY, color) {
    const dx = Math.abs(toX - fromX);
    const dy = toY - fromY; // 注意这里不取绝对值，因为方向很重要
    
    // 一次只能走一步
    if (dx + Math.abs(dy) !== 1) {
        return false;
    }
    
    // 红方兵只能向上（y减小）
    if (color === COLORS.RED) {
        // 没过河前只能前进
        if (fromY >= 5) {
            return dy === -1 && dx === 0;
        }
        // 过河后可以左右移动
        else {
            return dy === -1 || dx === 1;
        }
    }
    // 黑方卒只能向下（y增加）
    else {
        // 没过河前只能前进
        if (fromY <= 4) {
            return dy === 1 && dx === 0;
        }
        // 过河后可以左右移动
        else {
            return dy === 1 || dx === 1;
        }
    }
}

// 执行移动
function movePiece(fromX, fromY, toX, toY) {
    if (!isValidMove(fromX, fromY, toX, toY)) {
        return false;
    }
    
    // 保存移动前的状态（用于悔棋）
    const capturedPiece = boardState[toY][toX];
    
    // 执行移动
    boardState[toY][toX] = boardState[fromY][fromX];
    boardState[fromY][fromX] = null;
    
    return {
        success: true,
        captured: capturedPiece
    };
}

// 检查将军状态
function isCheck(color) {
    // 找到国王位置
    let kingX = -1;
    let kingY = -1;
    
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const piece = boardState[y][x];
            if (piece && piece.type === PIECE_TYPES.KING && piece.color === color) {
                kingX = x;
                kingY = y;
                break;
            }
        }
        if (kingX !== -1) break;
    }
    
    // 检查是否有任何对方棋子可以吃掉国王
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const piece = boardState[y][x];
            if (piece && piece.color !== color) {
                if (isValidMove(x, y, kingX, kingY)) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

// 检查是否将死
function isCheckmate(color) {
    // 如果没有被将军，就不可能将死
    if (!isCheck(color)) {
        return false;
    }
    
    // 尝试所有可能的移动来解除将军
    for (let fromY = 0; fromY < BOARD_HEIGHT; fromY++) {
        for (let fromX = 0; fromX < BOARD_WIDTH; fromX++) {
            const piece = boardState[fromY][fromX];
            if (piece && piece.color === color) {
                // 尝试移动到棋盘上的每个位置
                for (let toY = 0; toY < BOARD_HEIGHT; toY++) {
                    for (let toX = 0; toX < BOARD_WIDTH; toX++) {
                        if (isValidMove(fromX, fromY, toX, toY)) {
                            // 临时保存当前状态
                            const originalTarget = boardState[toY][toX];
                            const originalSource = boardState[fromY][fromX];
                            
                            // 尝试移动
                            boardState[toY][toX] = originalSource;
                            boardState[fromY][fromX] = null;
                            
                            // 检查移动后是否仍被将军
                            const stillInCheck = isCheck(color);
                            
                            // 恢复棋盘状态
                            boardState[fromY][fromX] = originalSource;
                            boardState[toY][toX] = originalTarget;
                            
                            // 如果有一步棋可以解除将军，则没有被将死
                            if (!stillInCheck) {
                                return false;
                            }
                        }
                    }
                }
            }
        }
    }
    
    // 尝试了所有可能的移动，仍然无法解除将军，判定为将死
    return true;
}