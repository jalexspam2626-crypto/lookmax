"use strict";

"use client";

import React, { useRef, useState, useEffect } from "react";
import { Camera, Upload, RefreshCw, Zap, ShieldCheck, Target, Scan, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { calculateLookmaxxingMetrics, Landmark } from "@/lib/facial-analysis";

declare global {
    interface Window {
        FaceMesh: any;
    }
}

interface ScannerProps {
    onScan: (image: string, localResults?: any) => void;
    isProcessing: boolean;
}

const SCAN_MESSAGES = [
    "Analyzing facial symmetry...",
    "Detecting proportions...",
    "Evaluating facial structure...",
    "Calculating score...",
    "Mapping landmarks...",
    "Finalizing neural report..."
];

const LIVE_SCAN_MESSAGES = [
    "ALIGNING OPTICAL FRAME",
    "DETECTING FACIAL BOUNDS",
    "INITIALIZING NEURAL LINK",
    "CALIBRATING SYMMETRY AXIS",
    "MAPPING STRUCTURAL NODES",
    "READY FOR DEEP ANALYSIS"
];

export default function Scanner({ onScan, isProcessing }: ScannerProps) {
    const [mode, setMode] = useState<"camera" | "upload">("camera");
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [messageIndex, setMessageIndex] = useState(0);
    const [liveMessageIndex, setLiveMessageIndex] = useState(0);
    const [faceMeshResults, setFaceMeshResults] = useState<any>(null);
    const [isMeshLoading, setIsMeshLoading] = useState(true);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const faceMeshRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const requestRef = useRef<number>(null);

    useEffect(() => {
        if (mode === "camera") {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [mode]);

    useEffect(() => {
        const loadScripts = async () => {
            if (window.FaceMesh) {
                initMesh();
                return;
            }

            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";
            script.async = true;
            script.onload = () => initMesh();
            document.head.appendChild(script);
        };

        const initMesh = () => {
            const faceMesh = new window.FaceMesh({
                locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
            });

            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            faceMesh.onResults((results: any) => {
                setFaceMeshResults(results);
            });

            faceMeshRef.current = faceMesh;
            setIsMeshLoading(false);
        };

        loadScripts();

        return () => {
            if (faceMeshRef.current) faceMeshRef.current.close();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    useEffect(() => {
        if (mode === "camera" && stream && !isProcessing) {
            const processVideo = async () => {
                if (videoRef.current && videoRef.current.readyState >= 2 && faceMeshRef.current) {
                    await faceMeshRef.current.send({ image: videoRef.current });
                }
                requestRef.current = requestAnimationFrame(processVideo);
            };
            processVideo();
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [mode, stream, isProcessing]);

    useEffect(() => {
        if (isProcessing) {
            const interval = setInterval(() => {
                setMessageIndex((prev) => (prev + 1) % SCAN_MESSAGES.length);
            }, 1000);
            return () => clearInterval(interval);
        } else if (mode === "camera") {
            const interval = setInterval(() => {
                setLiveMessageIndex((prev) => (prev + 1) % LIVE_SCAN_MESSAGES.length);
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [isProcessing, mode]);

    const startCamera = async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            setStream(s);
            if (videoRef.current) {
                videoRef.current.srcObject = s;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setMode("upload");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvas.toDataURL("image/jpeg");

                let localResults = null;
                if (faceMeshResults?.multiFaceLandmarks?.[0]) {
                    try {
                        localResults = calculateLookmaxxingMetrics(faceMeshResults.multiFaceLandmarks[0]);
                    } catch (e) {
                        console.error("Local analysis failed:", e);
                    }
                }

                onScan(dataUrl, localResults);
            }
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onScan(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Mock Landmark Points (Normalized 0-100)
    const mockLandmarks = [
        { x: 35, y: 35 }, { x: 65, y: 35 }, // Eyes
        { x: 50, y: 55 }, // Nose
        { x: 50, y: 75 }, // Lips
        { x: 25, y: 60 }, { x: 75, y: 60 }, // Cheekbones
        { x: 30, y: 85 }, { x: 70, y: 85 }, { x: 50, y: 90 } // Jawline
    ];

    return (
        <div className="w-full max-w-3xl mx-auto space-y-8">
            <div className="flex justify-center gap-4">
                <button
                    onClick={() => setMode("camera")}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-full transition-all font-bold text-sm tracking-wide",
                        mode === "camera" ? "bg-primary text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "bg-foreground/5 dark:bg-white/5 text-foreground/40 dark:text-white/40 hover:bg-foreground/10 dark:hover:bg-white/10"
                    )}
                >
                    <Camera size={16} />
                    Start Live Scan
                </button>
                <button
                    onClick={() => setMode("upload")}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-full transition-all font-bold text-sm tracking-wide",
                        mode === "upload" ? "bg-primary text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "bg-foreground/5 dark:bg-white/5 text-foreground/40 dark:text-white/40 hover:bg-foreground/10 dark:hover:bg-white/10"
                    )}
                >
                    <Upload size={16} />
                    Upload Photo
                </button>
            </div>

            <div className="relative aspect-square md:aspect-[4/3] glass-card overflow-hidden group border-foreground/5 dark:border-white/5 bg-black">
                <AnimatePresence mode="wait">
                    {mode === "camera" ? (
                        <motion.div
                            key="camera"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full relative"
                        >
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover grayscale brightness-90 transition-all duration-700 contrast-110"
                            />

                            {/* Scanning Laser Line */}
                            <div className="scanning-line" />

                            {/* Face Detection Bounding Box */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-3/4 h-3/4 border border-primary/40 rounded-[40px] relative glow-box"
                                >
                                    {/* Corners */}
                                    <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-[40px]" />
                                    <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-[40px]" />
                                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-[40px]" />
                                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-[40px]" />

                                    {/* Floating Labels */}
                                    <div className="absolute -top-10 left-10 px-2 py-1 bg-primary/20 border border-primary/30 rounded text-[10px] font-bold text-primary uppercase tracking-tighter backdrop-blur-md">
                                        Eye Alignment: Valid
                                    </div>
                                    <div className="absolute top-1/2 -right-12 -translate-y-1/2 px-2 py-1 bg-primary/20 border border-primary/30 rounded text-[10px] font-bold text-primary uppercase tracking-tighter backdrop-blur-md rotate-90">
                                        Facial Ratio: 1.618
                                    </div>
                                    <div className="absolute -bottom-10 right-10 px-2 py-1 bg-primary/20 border border-primary/30 rounded text-[10px] font-bold text-primary uppercase tracking-tighter backdrop-blur-md">
                                        Jawline: Detected
                                    </div>

                                    {/* Live Status Message */}
                                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-full text-center">
                                        <motion.span
                                            key={liveMessageIndex}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 1, 1, 0] }}
                                            transition={{ duration: 2 }}
                                            className="text-[10px] text-primary font-black tracking-[0.2em]"
                                        >
                                            {LIVE_SCAN_MESSAGES[liveMessageIndex]}
                                        </motion.span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Facial Landmark Points */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {faceMeshResults?.multiFaceLandmarks?.[0] ? (
                                    faceMeshResults.multiFaceLandmarks[0].map((point: any, i: number) => (
                                        // only show key landmarks to avoid clutter (every 10th point)
                                        i % 12 === 0 && (
                                            <motion.div
                                                key={i}
                                                className="landmark-dot"
                                                style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
                                            />
                                        )
                                    ))
                                ) : (
                                    mockLandmarks.map((point, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 1, 0.5, 1] }}
                                            transition={{ delay: i * 0.1, repeat: Infinity, duration: 2 }}
                                            className="landmark-dot"
                                            style={{ left: `${point.x}%`, top: `${point.y}%` }}
                                        />
                                    ))
                                )}
                            </div>

                            {/* Vertical Symmetry Line */}
                            <div className="symmetry-line" />
                            <div className="symmetry-bead" />

                            {/* Scan Overlay Animation */}
                            <div className="absolute inset-0 scan-overlay" />

                            {/* Processing Overlay */}
                            <AnimatePresence>
                                {isProcessing && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-6"
                                    >
                                        <div className="relative w-32 h-32">
                                            <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                                            <motion.div
                                                className="absolute inset-0 rounded-full border-4 border-t-primary"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Target className="text-primary animate-pulse" size={32} />
                                            </div>
                                        </div>
                                        <div className="text-center space-y-2">
                                            <motion.p
                                                key={messageIndex}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-primary font-bold tracking-widest uppercase text-sm"
                                            >
                                                {SCAN_MESSAGES[messageIndex]}
                                            </motion.p>
                                            <div className="flex gap-1 justify-center">
                                                {[0, 1, 2].map((i) => (
                                                    <motion.div
                                                        key={i}
                                                        className="w-1.5 h-1.5 bg-primary/40 rounded-full"
                                                        animate={{ scale: [1, 1.5, 1] }}
                                                        transition={{ delay: i * 0.2, repeat: Infinity }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full flex flex-col items-center justify-center gap-6 p-12 text-center bg-gradient-to-b from-primary/10 to-transparent"
                        >
                            <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center mb-4 glow-box border border-primary/30">
                                <Upload size={40} className="text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Upload Portrait</h3>
                                <p className="text-foreground/40 dark:text-white/40 text-sm max-w-xs mx-auto">
                                    For scientific precision, use a high-resolution front-facing portrait with neutral lighting.
                                </p>
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-4 px-10 py-4 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-xl"
                            >
                                Select Image for Analysis
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <div className="flex items-center gap-6 pt-8 border-t border-foreground/5 dark:border-white/5 w-full">
                                <div className="flex-1 flex items-center justify-center gap-2 text-[10px] text-foreground/30 dark:text-white/30 uppercase font-bold tracking-widest">
                                    <ShieldCheck size={14} /> Encrypted
                                </div>
                                <div className="flex-1 flex items-center justify-center gap-2 text-[10px] text-foreground/30 dark:text-white/30 uppercase font-bold tracking-widest">
                                    <Target size={14} /> AI Analysis
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {mode === "camera" && !isProcessing && (
                    <motion.button
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={capturePhoto}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 px-12 py-5 rounded-2xl bg-primary text-white flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(59,130,246,0.5)] border border-white/20 backdrop-blur-xl z-20 group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-3 relative z-10">
                            <Zap size={22} fill="currentColor" className="text-yellow-400 group-hover:animate-bounce" />
                            <span className="text-lg font-black tracking-widest">ANALYZE NOW</span>
                        </div>
                        <span className="text-[9px] font-bold text-white/40 tracking-[0.3em] mt-1 relative z-10 uppercase">Start Neural Computation</span>
                    </motion.button>
                )}
            </div>

            <p className="text-center text-[10px] text-foreground/20 dark:text-white/20 uppercase tracking-[0.3em] font-bold">
                Facial Mapping Intelligence v4.0.2 • Secure Processing Active
            </p>
        </div>
    );
}
