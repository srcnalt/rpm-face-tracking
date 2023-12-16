import { useState, useEffect, useRef, useMemo } from 'react';
import { NormalizedLandmarkList, drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { HAND_CONNECTIONS } from "@mediapipe/hands";
import { FilesetResolver, HandLandmarker, HandLandmarkerOptions } from "@mediapipe/tasks-vision";

const useHandDetection = () => {
    const [direction, setDirection] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const webcamButtonRef = useRef<HTMLButtonElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const handLandmarkerRef = useRef<HandLandmarker | null>(null);
    // Use a ref to track whether handLandmarker has been created
    const handLandmarkerCreated = useRef(false);
    // check if landmarker loaded
    const [landmarkerLoaded, setLandmarkerLoaded] = useState(false);
    const [webcamRunning, setWebcamRunning] = useState(false);


    const options: HandLandmarkerOptions = {
        baseOptions: {
            modelAssetPath: `/models/hand_landmarker.task`,
            delegate: "GPU"
        },
        numHands: 1,
        runningMode: "VIDEO"
    };

    // Create or retrieve handLandmarker
    const createHandLandmarker = async () => {
        if (!handLandmarkerCreated.current) {
            const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
            handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, options);
            handLandmarkerCreated.current = true;
            setLandmarkerLoaded(true);
        }
    };

    useMemo(() => {
        // Run createHandLandmarker only once on mount
        createHandLandmarker();
    }, [])

    useEffect(() => {
        let lastVideoTime = -1;
        const webcamButton = webcamButtonRef.current
        let webcamRunning = false

        // createHandLandmarker()

        const detect = async () => {
            let nowInMs = Date.now();
            console.log(webcamRunning);

            if (lastVideoTime !== videoRef.current?.currentTime && webcamRunning) {
                lastVideoTime = videoRef.current?.currentTime || 0;
                const handLandmarkerResult = handLandmarkerRef.current?.detectForVideo(videoRef.current!, nowInMs);

                if (handLandmarkerResult) {
                    draw(handLandmarkerResult?.landmarks);
                    setDirection(getDirection(handLandmarkerResult?.landmarks));
                }

            }
            if (webcamRunning)
                window.requestAnimationFrame(detect);
        };


        const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

        const enableCam = () => {
            if (!handLandmarkerRef.current) {
                console.log("Wait! HandLandmarker not loaded yet.");
                return;
            }

            if (webcamRunning === true) {
                webcamRunning = false;
                setWebcamRunning(false)
                const video = videoRef.current;
                if (video && video.srcObject) {
                    const stream = video.srcObject as MediaStream;
                    const tracks = stream.getTracks();
                    tracks.forEach((track) => track.stop());
                    video.srcObject = null;
                }
                // Clear the canvas when the camera stops
                const canvas = canvasRef.current;
                const canvasCtx = canvas?.getContext("2d");
                if (canvasCtx) {
                    canvasCtx.clearRect(0, 0, canvas!.width, canvas!.height);
                }
                webcamButton!.innerText = "ENABLE WEBCAM";
                return
            } else {
                webcamRunning = true
                setWebcamRunning(true)
                webcamButton!.innerText = "DISABLE WEBCAM";
            }

            const video = videoRef.current;

            const constraints = {
                video: { width: 1280, height: 720 },
            };

            navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
                if (video) {
                    video.srcObject = stream;
                    video.addEventListener("loadeddata", detect);
                }
            });
        };

        const initializeHandDetection = async () => {
            // Wait for createHandLandmarker to complete
            // await createHandLandmarker();

            if (hasGetUserMedia()) {
                webcamButtonRef.current?.addEventListener("click", enableCam);
            } else {
                console.warn("getUserMedia() is not supported by your browser");
            }
        };

        initializeHandDetection();

        return () => {
            webcamButton?.removeEventListener("click", enableCam);

            // Cleanup resources associated with handLandmarker
            if (handLandmarkerRef.current) {
                // handLandmarkerRef.current.dispose(); // Replace with the actual cleanup method if available
            }
        };
    }, []);


    const draw = (landmarks: NormalizedLandmarkList[]) => {
        const canvasElement = canvasRef.current;
        const canvasCtx = canvasElement?.getContext("2d") as CanvasRenderingContext2D;

        canvasCtx?.save();
        canvasCtx?.clearRect(0, 0, canvasElement!.width, canvasElement!.height);

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
    };

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
    };

    return { landmarkerLoaded, webcamRunning, direction, videoRef, webcamButtonRef, canvasRef };
};

export default useHandDetection;
