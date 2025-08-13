def solve_sudoku(sudoku_list):
    """Takes a 1D list of 81 elements, solves the sudoku, and returns the 2D solved matrix."""
    if len(sudoku_list) != 81:
        raise ValueError("Sudoku list must have exactly 81 elements.")

    # Step 1: Convert to 2D matrix
    grid = [sudoku_list[i*9:(i+1)*9] for i in range(9)]

    # Step 2: Solve using backtracking
    if solve(grid):
        return grid
    else:
        raise ValueError("No solution exists for the provided Sudoku.")


def solve(grid):
    for row in range(9):
        for col in range(9):
            if grid[row][col] == 0:  # Empty cell found
                for num in range(1, 10):
                    if valid(grid, row, col, num):
                        grid[row][col] = num
                        if solve(grid):
                            return True
                        grid[row][col] = 0  # Backtrack
                return False
    return True  # Solved


def valid(grid, row, col, num):

    # Check row and column
    if num in grid[row]:
        return False
    if num in [grid[r][col] for r in range(9)]:
        return False

    # Check 3x3 subgrid
    start_row, start_col = (row//3)*3, (col//3)*3
    for r in range(start_row, start_row+3):
        for c in range(start_col, start_col+3):
            if grid[r][c] == num:
                return False

    return True