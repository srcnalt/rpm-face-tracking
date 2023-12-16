import { NormalizedLandmarkList, drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { HAND_CONNECTIONS } from "@mediapipe/hands";
import { FilesetResolver, HandLandmarker, HandLandmarkerOptions } from "@mediapipe/tasks-vision";

let video: HTMLVideoElement;
let handLandmarker: HandLandmarker;
let enableWebcamButton: HTMLButtonElement;
let webcamRunning: Boolean = false;
let canvasElement: HTMLCanvasElement;
let canvasCtx: CanvasRenderingContext2D;
let lastVideoTime = -1;

const options: HandLandmarkerOptions = {
    baseOptions: {
        modelAssetPath: `/models/hand_landmarker.task`,
        delegate: "GPU"
    },
    numHands: 1,
    runningMode: "VIDEO"
};

export const detectHand = async () => {
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
        video.addEventListener("loadeddata", detect);
    });
}

const detect = async () => {

    let direction = ''
    let nowInMs = Date.now();
    if (lastVideoTime !== video.currentTime && webcamRunning) {
        lastVideoTime = video.currentTime;
        const handLandmarkerResult = handLandmarker.detectForVideo(video, nowInMs);

        draw(handLandmarkerResult?.landmarks);

        direction = getDirection(handLandmarkerResult?.landmarks);
    }
    if (webcamRunning)
        window.requestAnimationFrame(detect);

    return direction
}


const draw = (landmarks: NormalizedLandmarkList[]) => {
    canvasElement = document.getElementById(
        "output_canvas"
    ) as HTMLCanvasElement;
    canvasCtx = canvasElement.getContext("2d") as CanvasRenderingContext2D;

    canvasCtx?.save();
    canvasCtx?.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (landmarks) {
        for (const landmark of landmarks) {
            drawConnectors(canvasCtx!, landmark, HAND_CONNECTIONS, {
                color: "#7a42af",
                lineWidth: 2
            });
            drawLandmarks(canvasCtx!, landmark, { color: "#69ebca", radius: 1 });
        }
    }
    canvasCtx?.restore();
}


const getDirection = (landmarks: NormalizedLandmarkList[]): string => {
    if (landmarks && landmarks[0]) {
        // is the hand right
        if (landmarks[0][9].x < 0.5) {
            return "right";
        } else {
            return "left";
        }
    }
    return ""; // Handle the case where landmarks are not available
}

