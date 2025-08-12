from flask import Flask, request, jsonify
import cv2
import numpy as np
from flask_cors import CORS
from main.image_processing import extract_grid
from main.solver import solve_sudoku

app = Flask(__name__)
CORS(app)

@app.route("/solve", methods=["POST"])
def solve():
    # Check if file part is in request
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    image_bytes = file.read()

    # Convert bytes to NumPy image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Extract Sudoku grid
    try:
        grid = extract_grid(img)
    except Exception as e:
        return jsonify({"error": f"Failed to process image: {str(e)}"}), 500

    # Solve Sudoku
    try:
        solution = solve_sudoku(grid)
    except Exception as e:
        return jsonify({"error": f"Failed to solve Sudoku: {str(e)}"}), 500

    return jsonify({
        "grid": grid,
        "solution": solution
    })

if __name__ == "__main__":
    app.run(debug=True)
