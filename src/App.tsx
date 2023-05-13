import './App.css';

import { useEffect } from 'react';
import { FaceLandmarker, FaceLandmarkerOptions, FilesetResolver } from "@mediapipe/tasks-vision";
import { AnimationMixer, Euler, Matrix4 } from 'three';
import { Canvas, useFrame, useGraph } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

let video: HTMLVideoElement;
let faceLandmarker: FaceLandmarker;
let lastVideoTime = -1;
let blendshapes: any[] = [];
let rotation: Euler;
let headMesh: any;

const options: FaceLandmarkerOptions = {
  baseOptions: {
    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
    delegate: "GPU"
  },
  numFaces: 1,
  runningMode: "VIDEO",
  outputFaceBlendshapes: true,
  outputFacialTransformationMatrixes: true,
};

function Avatar() {
  const avatar = useGLTF("https://models.readyplayer.me/6407b039ea361a4a822bc531.glb?morphTargets=ARKit&textureAtlas=1024");
  const anim = useGLTF("./male-idle.glb");
  const { nodes } = useGraph(avatar.scene);

  const mixer = new AnimationMixer(avatar.scene);
  mixer.clipAction(anim.animations[0]).play();

  useEffect(() => {
    headMesh = (nodes.Wolf3D_Head || nodes.Wolf3D_Avatar);
  }, [nodes]);

  useFrame((_, delta) => {
    if (headMesh?.morphTargetInfluences && blendshapes.length > 0) {
      mixer.update(delta / 2);

      blendshapes.forEach(element => {
        let index = headMesh.morphTargetDictionary[element.categoryName];
        if (index >= 0) {
          headMesh.morphTargetInfluences[index] = element.score;
        }
      });

      nodes.Neck.rotation.set(rotation.x + 0.5, rotation.y, rotation.z);
      nodes.Spine2.rotation.set(rotation.x / 10, rotation.y / 10, rotation.z / 10);
    }
  });

  return <primitive object={avatar.scene} position={[0, -1.6, 4]} />
}

function App() {
  const setup = async () => {
    const filesetResolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, options);

    video = document.getElementById("video") as HTMLVideoElement;
    navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: false,
    }).then(function (stream) {
      video.srcObject = stream;
      video.addEventListener("loadeddata", predict);
    });
  }

  const predict = async () => {
    let nowInMs = Date.now();
    if (lastVideoTime !== video.currentTime) {
      lastVideoTime = video.currentTime;
      const faceLandmarkerResult = faceLandmarker.detectForVideo(video, nowInMs);

      if (faceLandmarkerResult.faceBlendshapes && faceLandmarkerResult.faceBlendshapes.length > 0 && faceLandmarkerResult.faceBlendshapes[0].categories) {
        blendshapes = faceLandmarkerResult.faceBlendshapes[0].categories;

        const matrix = new Matrix4().fromArray(faceLandmarkerResult.facialTransformationMatrixes![0].data);
        rotation = new Euler().setFromRotationMatrix(matrix);
      }
    }

    window.requestAnimationFrame(predict);
  }

  useEffect(() => {
    setup();
  }, []);

  return (
    <div className="App">
      <video id="video" width="640" height="300" autoPlay></video>
      <Canvas style={{ height: 600 }} camera={{ fov: 25 }}>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <Avatar />
      </Canvas>
    </div>
  );
}

export default App;
