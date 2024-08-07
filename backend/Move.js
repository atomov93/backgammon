class Move {
    /**
     * Represents a move in the game with a starting and ending position.
     * @param {number} from - The starting position of the move.
     * @param {number} to - The ending position of the move.
     */
    constructor(from, to) {
        if (!Move.isValidPosition(from) || !Move.isValidPosition(to)) {
            throw new Error(`Invalid move positions: from ${from} to ${to}`);
        }
        this.from = from;
        this.to = to;
    }

    /**
     * Converts the move to a JSON string representation.
     * @returns {string} JSON string representing the move.
     */
    toString() {
        return JSON.stringify({ from: this.from, to: this.to });
    }

    /**
     * Compares this move with another move for equality.
     * @param {Move} otherMove - Another move to compare with.
     * @returns {boolean} True if the moves are equal, otherwise false.
     */
    equals(otherMove) {
        return this.from === otherMove.from && this.to === otherMove.to;
    }

    /**
     * Static method to create a Move object from a JSON string.
     * @param {string} jsonString - JSON string representing a move.
     * @returns {Move} A Move object created from the JSON string.
     * @throws Will throw an error if JSON parsing fails or if move is invalid.
     */
    static fromJson(jsonString) {
        try {
            const { from, to } = JSON.parse(jsonString);
            return new Move(from, to);
        } catch (error) {
            throw new Error(`Failed to parse JSON string: ${error.message}`);
        }
    }

    /**
     * Validates if a position is within the acceptable range for the game.
     * @param {number} position - The position to validate.
     * @returns {boolean} True if the position is valid, otherwise false.
     */
    static isValidPosition(position) {
        // Assuming valid positions are from -1 (captured) to 24 (off the board)
        return position >= -1 && position <= 24;
    }
}

module.exports = Move;
