import React, { useState, useRef, useEffect } from "react";
import "./App.css";

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [useWebcam, setUseWebcam] = useState(false);
  const [solution, setSolution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showWebcamButtons, setShowWebcamButtons] = useState(false);

  const webcamStreamRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setUseWebcam(false);
      stopWebcam();
      setSolution(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setUseWebcam(false);
      stopWebcam();
      setSolution(null);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const startWebcam = () => {
    setUseWebcam(true);
    setShowWebcamButtons(true);
    setSelectedImage(null);
    setSolution(null);
  };

  const stopWebcam = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setUseWebcam(false);
    setSolution(null);
    stopWebcam();
    setShowWebcamButtons(false);
  };

  // Capture image from webcam
  const captureWebcamImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg");
    });
  };

  const handleTakePhoto = async () => {
    const blob = await captureWebcamImage();
    const imgUrl = URL.createObjectURL(blob);
    setSelectedImage(imgUrl);
    stopWebcam();
    setUseWebcam(false);
    setShowWebcamButtons(false);
  };

  const handleCancelWebcam = () => {
    stopWebcam();
    setUseWebcam(false);
    setShowWebcamButtons(false);
  };

  const handleSolveSudoku = async () => {
    setLoading(true);
    setSolution(null);

    let imageBlob = null;
    if (selectedImage && !useWebcam) {
      // If already selected/captured
      const res = await fetch(selectedImage);
      imageBlob = await res.blob();
    } else if (fileInputRef.current?.files[0]) {
      imageBlob = fileInputRef.current.files[0];
    } else {
      alert("Please upload or capture an image first.");
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
        alert(data.error || "Failed to solve Sudoku");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server");
    }

    setLoading(false);
  };

  // Start webcam stream
  useEffect(() => {
    if (useWebcam) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          webcamStreamRef.current = stream;
        })
        .catch((err) => console.error(err));
    } else {
      stopWebcam();
    }

    return () => {
      stopWebcam();
    };
  }, [useWebcam]);

  return (
    <div className="app-container">
      <header className="header">
        <h1>📋 Sudoku Solver</h1>
        <p>Solve Sudoku instantly from an image or live camera</p>
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
            <button className="webcam-btn" onClick={startWebcam}>
              🎥 Use Webcam
            </button>
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
            ) : useWebcam ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="uploaded-preview"
              />
            ) : (
              <>
                <div className="upload-icon">⬆️</div>
                <p>Drag & drop Sudoku image here</p>
              </>
            )}
          </div>

          <div className="action-buttons">
            {showWebcamButtons ? (
              <>
                <button className="reset-btn" onClick={handleCancelWebcam}>
                  Cancel
                </button>
                <button className="solve-btn" onClick={handleTakePhoto}>
                  Take Photo
                </button>
              </>
            ) : (
              <>
                <button className="reset-btn" onClick={handleReset}>
                  Reset
                </button>
                <button
                  className="solve-btn"
                  onClick={handleSolveSudoku}
                  disabled={loading}
                >
                  {loading ? "Solving..." : "Solve Sudoku"}
                </button>
              </>
            )}
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
