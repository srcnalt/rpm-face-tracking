import './App.css';

import useHandDetection from './hooks/useHandDetection';

function App() {

  const { direction, videoRef, webcamButtonRef, canvasRef } = useHandDetection()

  return (
    <div className="App">
      <button ref={webcamButtonRef} id="webcamButton" className="mdc-button mdc-button--raised button">
        <span className="mdc-button__ripple"></span>
        <span className="mdc-button__label">ENABLE WEBCAM</span>
      </button>
      <p>Direction: {direction != "" ? direction : "Unknown"}</p>
      <div className="camera-feed-container">
        <video ref={videoRef} className='camera-feed mirror-scene' id="video" autoPlay></video>
        <canvas ref={canvasRef} className="camera-feed mirror-scene output_canvas" id="output_canvas" />
      </div>
      {/* <Canvas className='mirror-scene' style={{ height: 600 }} camera={{ fov: 25 }} shadows>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} color={new Color(1, 1, 0)} intensity={0.5} castShadow />
        <pointLight position={[-10, 0, 10]} color={new Color(1, 0, 0)} intensity={0.5} castShadow />
        <pointLight position={[0, 0, 10]} intensity={0.5} castShadow />
        <Avatar url={url} />
      </Canvas> */}
    </div>
  );
}

export default App;
