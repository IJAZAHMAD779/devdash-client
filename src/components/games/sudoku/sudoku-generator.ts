/**
 * Sudoku puzzle generator and solver.
 * Generates valid, uniquely solvable 9x9 Sudoku boards.
 */

export type SudokuGrid = number[][];

export type Difficulty = "easy" | "medium" | "hard";

/**
 * Checks if placing `num` at (row, col) is valid in grid
 */
export function isValidPlacement(grid: SudokuGrid, row: number, col: number, num: number): boolean {
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] === num) return false;
  }

  for (let r = 0; r < 9; r++) {
    if (grid[r][col] === num) return false;
  }

  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (grid[startRow + r][startCol + c] === num) return false;
    }
  }

  return true;
}

/**
 * Solves a Sudoku grid using backtracking
 */
export function solveSudoku(grid: SudokuGrid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        for (const num of numbers) {
          if (isValidPlacement(grid, row, col, num)) {
            grid[row][col] = num;
            if (solveSudoku(grid)) return true;
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/**
 * Generates a complete valid 9x9 Sudoku solution
 */
export function generateSolvedGrid(): SudokuGrid {
  const grid: SudokuGrid = Array.from({ length: 9 }, () => Array(9).fill(0));
  solveSudoku(grid);
  return grid;
}

/**
 * Generates a playable Sudoku puzzle with the given difficulty
 */
export function generatePuzzle(difficulty: Difficulty): {
  initialGrid: SudokuGrid;
  solvedGrid: SudokuGrid;
} {
  const solvedGrid = generateSolvedGrid();
  const initialGrid: SudokuGrid = solvedGrid.map((row) => [...row]);

  // Clues to leave based on difficulty
  const cluesMap: Record<Difficulty, number> = {
    easy: 38,
    medium: 30,
    hard: 24,
  };

  const cellsToRemove = 81 - cluesMap[difficulty];
  const positions: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  positions.sort(() => Math.random() - 0.5);

  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= cellsToRemove) break;
    initialGrid[r][c] = 0;
    removed++;
  }

  return { initialGrid, solvedGrid };
}
