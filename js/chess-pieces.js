/**
 * 棋子定义文件
 * 定义了所有棋子的类型、名称和初始位置
 */

// 棋子类型枚举
const PIECE_TYPES = {
    KING: 'king',       // 将/帅
    ADVISOR: 'advisor', // 士/仕
    ELEPHANT: 'elephant', // 象/相
    HORSE: 'horse',     // 马
    CHARIOT: 'chariot', // 车
    CANNON: 'cannon',   // 炮
    PAWN: 'pawn'        // 兵/卒
};

// 棋子颜色枚举
const COLORS = {
    RED: 'red',
    BLACK: 'black'
};

// 棋子名称映射
const PIECE_NAMES = {
    [COLORS.RED]: {
        [PIECE_TYPES.KING]: '帅',
        [PIECE_TYPES.ADVISOR]: '仕',
        [PIECE_TYPES.ELEPHANT]: '相',
        [PIECE_TYPES.HORSE]: '马',
        [PIECE_TYPES.CHARIOT]: '车',
        [PIECE_TYPES.CANNON]: '炮',
        [PIECE_TYPES.PAWN]: '兵'
    },
    [COLORS.BLACK]: {
        [PIECE_TYPES.KING]: '将',
        [PIECE_TYPES.ADVISOR]: '士',
        [PIECE_TYPES.ELEPHANT]: '象',
        [PIECE_TYPES.HORSE]: '马',
        [PIECE_TYPES.CHARIOT]: '车',
        [PIECE_TYPES.CANNON]: '炮',
        [PIECE_TYPES.PAWN]: '卒'
    }
};

// 初始棋盘设置
const INITIAL_BOARD = [
    // 黑方（上方）
    { type: PIECE_TYPES.CHARIOT, color: COLORS.BLACK, x: 0, y: 0 },
    { type: PIECE_TYPES.HORSE, color: COLORS.BLACK, x: 1, y: 0 },
    { type: PIECE_TYPES.ELEPHANT, color: COLORS.BLACK, x: 2, y: 0 },
    { type: PIECE_TYPES.ADVISOR, color: COLORS.BLACK, x: 3, y: 0 },
    { type: PIECE_TYPES.KING, color: COLORS.BLACK, x: 4, y: 0 },
    { type: PIECE_TYPES.ADVISOR, color: COLORS.BLACK, x: 5, y: 0 },
    { type: PIECE_TYPES.ELEPHANT, color: COLORS.BLACK, x: 6, y: 0 },
    { type: PIECE_TYPES.HORSE, color: COLORS.BLACK, x: 7, y: 0 },
    { type: PIECE_TYPES.CHARIOT, color: COLORS.BLACK, x: 8, y: 0 },
    { type: PIECE_TYPES.CANNON, color: COLORS.BLACK, x: 1, y: 2 },
    { type: PIECE_TYPES.CANNON, color: COLORS.BLACK, x: 7, y: 2 },
    { type: PIECE_TYPES.PAWN, color: COLORS.BLACK, x: 0, y: 3 },
    { type: PIECE_TYPES.PAWN, color: COLORS.BLACK, x: 2, y: 3 },
    { type: PIECE_TYPES.PAWN, color: COLORS.BLACK, x: 4, y: 3 },
    { type: PIECE_TYPES.PAWN, color: COLORS.BLACK, x: 6, y: 3 },
    { type: PIECE_TYPES.PAWN, color: COLORS.BLACK, x: 8, y: 3 },
    
    // 红方（下方）
    { type: PIECE_TYPES.CHARIOT, color: COLORS.RED, x: 0, y: 9 },
    { type: PIECE_TYPES.HORSE, color: COLORS.RED, x: 1, y: 9 },
    { type: PIECE_TYPES.ELEPHANT, color: COLORS.RED, x: 2, y: 9 },
    { type: PIECE_TYPES.ADVISOR, color: COLORS.RED, x: 3, y: 9 },
    { type: PIECE_TYPES.KING, color: COLORS.RED, x: 4, y: 9 },
    { type: PIECE_TYPES.ADVISOR, color: COLORS.RED, x: 5, y: 9 },
    { type: PIECE_TYPES.ELEPHANT, color: COLORS.RED, x: 6, y: 9 },
    { type: PIECE_TYPES.HORSE, color: COLORS.RED, x: 7, y: 9 },
    { type: PIECE_TYPES.CHARIOT, color: COLORS.RED, x: 8, y: 9 },
    { type: PIECE_TYPES.CANNON, color: COLORS.RED, x: 1, y: 7 },
    { type: PIECE_TYPES.CANNON, color: COLORS.RED, x: 7, y: 7 },
    { type: PIECE_TYPES.PAWN, color: COLORS.RED, x: 0, y: 6 },
    { type: PIECE_TYPES.PAWN, color: COLORS.RED, x: 2, y: 6 },
    { type: PIECE_TYPES.PAWN, color: COLORS.RED, x: 4, y: 6 },
    { type: PIECE_TYPES.PAWN, color: COLORS.RED, x: 6, y: 6 },
    { type: PIECE_TYPES.PAWN, color: COLORS.RED, x: 8, y: 6 }
];

// 让子配置对象
let handicapSettings = {
    [COLORS.RED]: [],    // 存储红方让的子 [{type: PIECE_TYPES.XXX, index: 0}, ...]
    [COLORS.BLACK]: []   // 存储黑方让的子
};

// 重置让子设置
function resetHandicapSettings() {
    handicapSettings = {
        [COLORS.RED]: [],
        [COLORS.BLACK]: []
    };
}

// 添加让子设置
function addHandicap(color, pieceType, index) {
    handicapSettings[color].push({ type: pieceType, index });
}

// 修改初始棋盘设置，考虑让子
function getInitialBoard() {
    // 深拷贝初始棋盘配置
    let board = JSON.parse(JSON.stringify(INITIAL_BOARD));
    
    // 应用让子设置
    for (const color of [COLORS.RED, COLORS.BLACK]) {
        // 根据棋子类型分组
        const piecesByType = new Map();
        
        // 为每种类型的棋子创建有序列表
        board.forEach((piece, index) => {
            if (piece && piece.color === color) {
                if (!piecesByType.has(piece.type)) {
                    piecesByType.set(piece.type, []);
                }
                // 为红方特殊处理：从右到左排序
                if (color === COLORS.RED) {
                    piecesByType.get(piece.type).unshift({index, piece});
                } else {
                    piecesByType.get(piece.type).push({index, piece});
                }
            }
        });
        
        // 应用让子设置
        for (const handicap of handicapSettings[color]) {
            const pieces = piecesByType.get(handicap.type) || [];
            if (pieces.length > handicap.index) {
                const targetIndex = handicap.index;
                if (pieces[targetIndex]) {
                    board[pieces[targetIndex].index] = null;
                }
            }
        }
    }
    
    // 过滤掉空值并返回
    return board.filter(piece => piece !== null);
}

// 创建棋子DOM元素
function createPieceElement(piece) {
    const pieceElement = document.createElement('div');
    pieceElement.className = `chess-piece ${piece.color}`;
    pieceElement.textContent = PIECE_NAMES[piece.color][piece.type];
    pieceElement.dataset.type = piece.type;
    pieceElement.dataset.color = piece.color;
    pieceElement.dataset.x = piece.x;
    pieceElement.dataset.y = piece.y;
    
    // 设置棋子在棋盘上的位置（放在交叉线的交点上）
    pieceElement.style.left = `${(piece.x / (BOARD_WIDTH - 1)) * 100}%`;
    pieceElement.style.top = `${(piece.y / (BOARD_HEIGHT - 1)) * 100}%`;
    
    return pieceElement;
}