import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [emotion, setEmotion] = useState("");

  const loadModels = async () => {
    const MODEL_URL = "/models";
    await faceapi.nets.tinyFaceDetector.loadFromUri(
      `${MODEL_URL}/tiny_face_detector_model`
    );
    await faceapi.nets.faceExpressionNet.loadFromUri(
      `${MODEL_URL}/face_expression_model`
    );
  };

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Error accessing webcam:", err));
  };

  const handleVideoOnPlay = () => {
    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight,
      };

      faceapi.matchDimensions(canvas, displaySize);

      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (resizedDetections) {
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

        const expressions = resizedDetections.expressions;
        const maxValue = Math.max(...Object.values(expressions));
        const dominantEmotion = Object.keys(expressions).find(
          (key) => expressions[key] === maxValue
        );
        setEmotion(dominantEmotion);
      }
    }, 200);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    loadModels().then(startVideo);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-extrabold text-black mb-8 drop-shadow-lg">
        Facial Emotion Detection
      </h1>

      <div className="relative w-[720px] h-[560px] shadow-2xl rounded-2xl overflow-hidden bg-black/30">
        <video
          ref={videoRef}
          autoPlay
          muted
          onPlay={handleVideoOnPlay}
          className="w-full h-full rounded-2xl object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full z-10"
        />
      </div>

      <h2 className="mt-8 text-xl text-black font-semibold drop-shadow-md">
        Detected Emotion:{" "}
        <span className="text-blue-500 capitalize">{emotion || "None"}</span>
      </h2>
    </div>
  );
}

export default App;
