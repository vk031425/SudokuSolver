import { useState, useRef } from "react";
import "./App.css";

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [solution, setSolution] = useState(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setSolution(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setSolution(null);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleReset = () => {
    // Clear selected image
    setSelectedImage(null);
    setSolution(null);

    // Clear file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleSolveSudoku = async () => {
    setLoading(true);
    setSolution(null);

    let imageBlob = null;
    if (selectedImage) {
      // If already selected/captured
      const res = await fetch(selectedImage);
      imageBlob = await res.blob();
    } else if (fileInputRef.current?.files[0]) {
      imageBlob = fileInputRef.current.files[0];
    } else {
      alert("Please upload an image first.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("image", imageBlob, "sudoku.jpg");

    try {
      const res = await fetch("http://127.0.0.1:5000/solve", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setSolution(data.solution);
      } else {
        alert(
          "Failed to solve Sudoku! Please upload a valid Sudoku image."
        );
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server");
    }

    setLoading(false);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>📋 Sudoku Solver</h1>
        <p>Solve Sudoku instantly from an image</p>
      </header>

      <div className="main-content">
        {/* Left Panel */}
        <div className="left-panel">
          <div className="button-row">
            <label className="upload-btn">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                hidden
              />
              📷 Upload Image
            </label>
          </div>

          <div
            className="upload-box"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Uploaded Sudoku"
                className="uploaded-preview"
              />
            ) : (
              <>
                <div className="upload-icon">⬆️</div>
                <p>Drag & drop Sudoku image here</p>
                <p>Min Res: 400x400px and sudoku image should not have any extra texts for better accuracy</p>
              </>
            )}
          </div>

          <div className="action-buttons">
            <>
              <button className="reset-btn" onClick={handleReset}>
                Reset
              </button>
              <button
                className={`solve-btn ${loading ? "disabled" : ""}`}
                onClick={handleSolveSudoku}
                disabled={loading}
              >
                {loading ? "Solving..." : "Solve Sudoku"}
              </button>
            </>
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          {solution ? (
            <table className="sudoku-table">
              <tbody>
                {solution.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="placeholder-grid">
              <p>Your solved Sudoku will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
