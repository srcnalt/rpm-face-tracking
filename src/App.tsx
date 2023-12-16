import './App.css';

import { useEffect, useState } from 'react';
import { FaceLandmarker, FaceLandmarkerOptions, FilesetResolver, HandLandmarker, HandLandmarkerOptions } from "@mediapipe/tasks-vision";
import { Color, Euler, Matrix4 } from 'three';
import { Canvas, useFrame, useGraph } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useDropzone } from 'react-dropzone';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';

let video: HTMLVideoElement;
let handLandmarker: HandLandmarker;
let enableWebcamButton: HTMLButtonElement;
let webcamRunning: Boolean = false;
let canvasElement: HTMLCanvasElement;
let canvasCtx: CanvasRenderingContext2D;


let lastVideoTime = -1;
let blendshapes: any[] = [];
let rotation: Euler;
let headMesh: any[] = [];

const options: HandLandmarkerOptions = {
  baseOptions: {
    modelAssetPath: `/models/hand_landmarker.task`,
    delegate: "GPU"
  },
  numHands: 1,
  runningMode: "VIDEO"
};

function Avatar({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const { nodes } = useGraph(scene);

  useEffect(() => {
    if (nodes.Wolf3D_Head) headMesh.push(nodes.Wolf3D_Head);
    if (nodes.Wolf3D_Teeth) headMesh.push(nodes.Wolf3D_Teeth);
    if (nodes.Wolf3D_Beard) headMesh.push(nodes.Wolf3D_Beard);
    if (nodes.Wolf3D_Avatar) headMesh.push(nodes.Wolf3D_Avatar);
    if (nodes.Wolf3D_Head_Custom) headMesh.push(nodes.Wolf3D_Head_Custom);
  }, [nodes, url]);

  useFrame(() => {
    if (blendshapes.length > 0) {
      blendshapes.forEach(element => {
        headMesh.forEach(mesh => {
          let index = mesh.morphTargetDictionary[element.categoryName];
          if (index >= 0) {
            mesh.morphTargetInfluences[index] = element.score;
          }
        });
      });

      nodes.Head.rotation.set(rotation.x, rotation.y, rotation.z);
      nodes.Neck.rotation.set(rotation.x / 5 + 0.3, rotation.y / 5, rotation.z / 5);
      nodes.Spine2.rotation.set(rotation.x / 10, rotation.y / 10, rotation.z / 10);
    }
  });

  return <primitive object={scene} position={[0, -1.75, 3]} />
}

function App() {
  const [url, setUrl] = useState<string>("https://models.readyplayer.me/6460d95f9ae10f45bffb2864.glb?morphTargets=ARKit&textureAtlas=1024");
  const { getRootProps } = useDropzone({
    onDrop: files => {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setUrl(reader.result as string);
      }
      reader.readAsDataURL(file);
    }
  });

  const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
    handLandmarker = await HandLandmarker.createFromOptions(vision, options);
  }

  // Check if webcam access is supported.
  const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

  // Enable the live webcam view and start detection.
  const enableCam = () => {
    if (!handLandmarker) {
      console.log("Wait! objectDetector not loaded yet.");
      return;
    }

    if (webcamRunning === true) {
      webcamRunning = false;
      enableWebcamButton.innerText = "ENABLE PREDICTIONS";
    } else {
      webcamRunning = true;
      enableWebcamButton.innerText = "DISABLE PREDICTIONS";
    }

    // Get the video element.
    video = document.getElementById("video") as HTMLVideoElement;

    // getUsermedia parameters.
    const constraints = {
      video: { width: 1280, height: 720 },
    };

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      video.srcObject = stream;
      video.addEventListener("loadeddata", predict);
    });
  }

  const setup = async () => {
    await createHandLandmarker();
    // If webcam supported, add event listener to button for when user
    // wants to activate it.
    if (hasGetUserMedia()) {
      enableWebcamButton = document.getElementById("webcamButton") as HTMLButtonElement;
      enableWebcamButton.addEventListener("click", enableCam);
    } else {
      console.warn("getUserMedia() is not supported by your browser");
    }
  }

  const predict = async () => {

    canvasElement = document.getElementById(
      "output_canvas"
    ) as HTMLCanvasElement;
    canvasCtx = canvasElement.getContext("2d") as CanvasRenderingContext2D;
    // canvasElement.style.width = video.videoWidth.toString();
    // canvasElement.style.height = video.videoHeight.toString();
    // canvasElement.width = video.videoWidth;
    // canvasElement.height = video.videoHeight;

    let nowInMs = Date.now();
    if (lastVideoTime !== video.currentTime && webcamRunning) {
      lastVideoTime = video.currentTime;
      const handLandmarkerResult = handLandmarker.detectForVideo(video, nowInMs);

      console.log(handLandmarkerResult?.landmarks["0"] && handLandmarkerResult?.landmarks["0"][0]?.x);

      if (handLandmarkerResult?.landmarks["0"]) {
        // is the hand right
        if (handLandmarkerResult.landmarks["0"][9].x < 0.5) {
          console.log("right");
        }
      }



      canvasCtx?.save();
      canvasCtx?.clearRect(0, 0, canvasElement.width, canvasElement.height);
      if (handLandmarkerResult?.landmarks) {
        for (const landmarks of handLandmarkerResult.landmarks) {
          drawConnectors(canvasCtx!, landmarks, HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 5
          });
          drawLandmarks(canvasCtx!, landmarks, { color: "#FF0000", radius: 1 });
        }
      }
      canvasCtx?.restore();

      // if (faceLandmarkerResult.faceBlendshapes && faceLandmarkerResult.faceBlendshapes.length > 0 && faceLandmarkerResult.faceBlendshapes[0].categories) {
      //   blendshapes = faceLandmarkerResult.faceBlendshapes[0].categories;

      //   const matrix = new Matrix4().fromArray(faceLandmarkerResult.facialTransformationMatrixes![0].data);
      //   rotation = new Euler().setFromRotationMatrix(matrix);
      // }
    }

    if (webcamRunning === true)
      window.requestAnimationFrame(predict);
  }

  const handleOnChange = (event: any) => {
    setUrl(`${event.target.value}?morphTargets=ARKit&textureAtlas=1024`);
  }

  useEffect(() => {
    setup();
  }, []);

  return (
    <div className="App">
      <div {...getRootProps({ className: 'dropzone' })}>
        <p>Drag & drop RPM avatar GLB file here</p>
      </div>
      <input className='url' type="text" placeholder="Paste RPM avatar URL" onChange={handleOnChange} />
      <button id="webcamButton" className="mdc-button mdc-button--raised">
        <span className="mdc-button__ripple"></span>
        <span className="mdc-button__label">ENABLE WEBCAM</span>
      </button>
      <video className='camera-feed mirror-scene' id="video" autoPlay></video>
      <canvas className="output_canvas camera-feed mirror-scene" id="output_canvas" style={{ height: 600 }}>
      </canvas>
      {/* <Canvas className='mirror-scene' style={{ height: 600 }} camera={{ fov: 25 }} shadows>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} color={new Color(1, 1, 0)} intensity={0.5} castShadow />
        <pointLight position={[-10, 0, 10]} color={new Color(1, 0, 0)} intensity={0.5} castShadow />
        <pointLight position={[0, 0, 10]} intensity={0.5} castShadow />
        <Avatar url={url} />
      </Canvas> */}
      <img className='logo' src="./logo.png" />
    </div>
  );
}

export default App;
