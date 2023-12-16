import './App.css';

import { useEffect } from 'react';
import { detectHand } from './utils/detectHand';

function App() {

  useEffect(() => {
    detectHand();
  }, []);

  return (
    <div className="App">
      <button id="webcamButton" className="mdc-button mdc-button--raised button">
        <span className="mdc-button__ripple"></span>
        <span className="mdc-button__label">ENABLE WEBCAM</span>
      </button>
      <div className="camera-feed-container">
        <video className='camera-feed mirror-scene' id="video" autoPlay></video>
        <canvas className="camera-feed mirror-scene output_canvas" id="output_canvas" />
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
