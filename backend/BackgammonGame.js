const Move = require('./Move');

/*
 * | 12 11 10  9  8  7 | B | 6  5  4  3  2  1 |
 * |-------------------|---|------------------|
 * | W  .  .  .  B  .  |   | B  .  .  .  .  W |
 * | W  .  .  .  B  .  |   | B  .  .  .  .  W |
 * | W  .  .  .  B  .  |   | B  .  .  .  .  . |
 * | W  .  .  .  .  .  |   | B  .  .  .  .  . |
 * | W  .  .  .  .  .  |   | B  .  .  .  .  . |
 * |                   |   |                  |
 * | B  .  .  .  .  .  |   | W  .  .  .  .  . |
 * | B  .  .  .  .  .  |   | W  .  .  .  .  . |
 * | B  .  .  .  .  W  |   | W  .  .  .  .  . |
 * | B  .  .  .  .  W  |   | W  .  .  .  .  B |
 * | B  .  .  .  .  W  |   | W  .  .  .  .  B |
 * |-------------------|---|------------------|
 * | 13 14 15 16 17 18 | W | 19 20 21 22 23 24|
 */

const BLACK = 0;
const WHITE = 1;

const CAPTURED_BAR = -1;
const FINISHED_BAR = -2;

class BackgammonGame {
    constructor() {
        this.turn = BLACK;
        this.gameStatus = Array.from({ length: 24 }, () => []);
        this.capturedBlacks = [];
        this.capturedWhites = [];
        this.finishedBlacks = [];
        this.finishedWhites = [];
        this.blacksResults = [];
        this.whitesResults = [];
    }

    init(turn) {
        this.gameStatus = Array.from({ length: 24 }, () => []);

        this.gameStatus[0] = [WHITE, WHITE];
        this.gameStatus[5] = [BLACK, BLACK, BLACK, BLACK, BLACK];
        this.gameStatus[7] = [BLACK, BLACK, BLACK];
        this.gameStatus[11] = [WHITE, WHITE, WHITE, WHITE, WHITE];
        this.gameStatus[12] = [BLACK, BLACK, BLACK, BLACK, BLACK];
        this.gameStatus[16] = [WHITE, WHITE, WHITE];
        this.gameStatus[18] = [WHITE, WHITE, WHITE, WHITE, WHITE];
        this.gameStatus[23] = [BLACK, BLACK];

        this.turn = turn;
    }

    rollDice() {
        return Math.floor(Math.random() * 6) + 1;
    }

    loadDiceResults(dice1, dice2) {
        const results = this.turn === BLACK ? this.blacksResults : this.whitesResults;
        results.length = 0;

        if (dice1 === dice2) {
            results.push(dice1, dice1, dice1, dice1);
        } else {
            results.push(dice1, dice2);
        }
    }

    move(from, to) {
        const bar = this.turn === BLACK ? this.capturedBlacks : this.capturedWhites;
        const finished = this.turn === BLACK ? this.finishedBlacks : this.finishedWhites;
    
        // Validate the move
        if (from !== CAPTURED_BAR && (this.gameStatus[from].length === 0 || this.gameStatus[from][0] !== this.turn)) {
            throw new Error('Invalid move: no pieces to move or wrong player');
        }
    
        if (to !== FINISHED_BAR && (this.gameStatus[to].length > 1 && this.gameStatus[to][0] !== this.turn)) {
            throw new Error('Invalid move: target point blocked');
        }
    
        // Moving from the bar
        if (from === CAPTURED_BAR) {
            if (this.gameStatus[to].length > 0 && this.gameStatus[to][0] !== this.turn) {
                const enemyBar = this.turn === BLACK ? this.capturedWhites : this.capturedBlacks;
                enemyBar.push(this.gameStatus[to].pop());
            }
            this.gameStatus[to].push(bar.pop());
        } else {
            // Normal moves and bearing off
            if (to === FINISHED_BAR) {
                finished.push(this.gameStatus[from].pop());
            } else {
                if (this.gameStatus[to].length > 0 && this.gameStatus[to][0] !== this.turn) {
                    const enemyBar = this.turn === BLACK ? this.capturedWhites : this.capturedBlacks;
                    enemyBar.push(this.gameStatus[to].pop());
                }
                this.gameStatus[to].push(this.gameStatus[from].pop());
            }
        }
    
        const results = this.turn === BLACK ? this.blacksResults : this.whitesResults;
        if (from === CAPTURED_BAR) {
            results.splice(results.indexOf(this.turn === BLACK ? 24 - to : to + 1), 1);
        } else if (to === FINISHED_BAR) {
            if (results.includes(this.turn === BLACK ? from + 1 : 24 - from)) {
                results.splice(results.indexOf(this.turn === BLACK ? from + 1 : 24 - from), 1);
            } else {
                results.pop();
            }
        } else {
            results.splice(results.indexOf(Math.abs(from - to)), 1);
        }
    }
       

    isInHomeBoard() {
        if (this.turn === BLACK) {
            return this.capturedBlacks.length === 0 && this.gameStatus.slice(0, 6).every(column => column.length === 0 || column[0] === BLACK);
        } else {
            return this.capturedWhites.length === 0 && this.gameStatus.slice(18, 24).every(column => column.length === 0 || column[0] === WHITE);
        }
    }

    canBearOff(dice) {
        if (!this.isInFinalState()) return false;
    
        if (this.turn === BLACK) {
            // Check for pieces in the home board and check each die
            return this.canBearOffBlack(dice);
        } else {
            return this.canBearOffWhite(dice);
        }
    }
    
    canBearOffBlack(dice) {
        for (let i = 0; i < dice.length; i++) {
            if (this.gameStatus[dice[i] - 1].length > 0 && this.gameStatus[dice[i] - 1][0] === BLACK) {
                return true;
            }
        }
        for (let i = dice.length; i < 6; i++) {
            if (this.gameStatus[i].length > 0 && this.gameStatus[i][0] === BLACK) {
                return true;
            }
        }
        return false;
    }
    
    canBearOffWhite(dice) {
        for (let i = 0; i < dice.length; i++) {
            if (this.gameStatus[24 - dice[i]].length > 0 && this.gameStatus[24 - dice[i]][0] === WHITE) {
                return true;
            }
        }
        for (let i = 18; i < 24; i++) {
            if (this.gameStatus[i].length > 0 && this.gameStatus[i][0] === WHITE) {
                return true;
            }
        }
        return false;
    }
    

    isInFinalState() {
        if (this.turn === BLACK) {
            if (this.capturedBlacks.length > 0) return false;
            for (let i = 6; i < this.gameStatus.length; i++) {
                if (this.gameStatus[i].length > 0 && this.gameStatus[i][0] === BLACK) return false;
            }
        } else {
            if (this.capturedWhites.length > 0) return false;
            for (let i = 17; i >= 0; i--) {
                if (this.gameStatus[i].length > 0 && this.gameStatus[i][0] === WHITE) return false;
            }
        }
        return true;
    }

    hasResults() {
        return (this.turn === BLACK ? this.blacksResults : this.whitesResults).length > 0;
    }

    switchTurn() {
        this.turn = this.turn === BLACK ? WHITE : BLACK;
    }

    getTurn() {
        return this.turn;
    }

    hasWon() {
        return this.gameStatus.every(column => column.length === 0 || column[0] !== this.turn);
    }

    getGameStateAsJson() {
        const state = this.gameStatus.map((column, index) => {
            if (column.length === 0) return null;
            return { column: index, count: column.length, type: column[0] };
        }).filter(item => item !== null);
    
        return JSON.stringify({
            board: state,
            captured: { white: this.capturedWhites.length, black: this.capturedBlacks.length },
            finished: { white: this.finishedWhites.length, black: this.finishedBlacks.length },
            turn: this.turn,
            results: this.turn === BLACK ? this.blacksResults : this.whitesResults
        });
    }    

    getPossibleMoves() {
        const possibleMoves = [];
        const results = this.turn === BLACK ? this.blacksResults : this.whitesResults;
        const bar = this.turn === BLACK ? this.capturedBlacks : this.capturedWhites;
    
        if (bar.length > 0) {
            // Handling re-entries from the bar
            results.forEach(dice => {
                const targetPoint = this.turn === BLACK ? 24 - dice : dice - 1;
                if (this.gameStatus[targetPoint].length < 2 || this.gameStatus[targetPoint][0] === this.turn) {
                    possibleMoves.push(new Move(CAPTURED_BAR, targetPoint));
                }
            });
        } else {
            // Regular moves
            this.gameStatus.forEach((column, index) => {
                if (column[0] === this.turn) {
                    results.forEach(dice => {
                        const targetPoint = this.turn === BLACK ? index - dice : index + dice;
                        if (targetPoint >= 0 && targetPoint < 24) {
                            if (this.gameStatus[targetPoint].length < 2 || this.gameStatus[targetPoint][0] === this.turn) {
                                possibleMoves.push(new Move(index, targetPoint));
                            }
                        }
                    });
                }
            });
    
            // Bearing off (removing pieces from the board when all pieces are in the home board)
            if (this.isInFinalState()) {
                const homeBaseStart = this.turn === BLACK ? 0 : 18;
                const homeBaseEnd = this.turn === BLACK ? 5 : 23;
                const highestOccupied = this.findHighestOccupied(homeBaseStart, homeBaseEnd);
    
                results.forEach(die => {
                    const targetPoint = this.turn === BLACK ? die - 1 : 24 - die;
                    if (targetPoint >= homeBaseStart && targetPoint <= homeBaseEnd && this.gameStatus[targetPoint].length && this.gameStatus[targetPoint][0] === this.turn) {
                        possibleMoves.push(new Move(targetPoint, FINISHED_BAR));
                    } else if (die > highestOccupied && highestOccupied >= homeBaseStart && highestOccupied <= homeBaseEnd) {
                        possibleMoves.push(new Move(highestOccupied, FINISHED_BAR));
                    }
                });
            }
        }
    
        return possibleMoves;
    }
    
    findHighestOccupied(start, end) {
        for (let i = end; i >= start; i--) {
            if (this.gameStatus[i].length > 0 && this.gameStatus[i][0] === this.turn) {
                return i;
            }
        }
        return -1; // If no pieces are found, handle this case appropriately
    }
    
}

module.exports = BackgammonGame;
