/**
 * Facial Analysis Logic Engine
 * Processes 468 MediaPipe FaceMesh landmarks to calculate Lookmaxxing metrics.
 */

export interface FacialMetrics {
    score: number;
    symmetry: number;
    midFaceRatio: number;
    canthalTilt: number;
    jawlineDefinition: number;
    browRidge: number;
    proportions: number;
}

export type Landmark = { x: number; y: number; z: number };

export function calculateLookmaxxingMetrics(landmarks: Landmark[]): FacialMetrics {
    if (!landmarks || landmarks.length < 468) {
        throw new Error("Invalid landmark data");
    }

    // Helper: Distance between two points
    const dist = (p1: Landmark, p2: Landmark) =>
        Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

    // 1. Eye Symmetry (comparing heights and sizes)
    const leftEye = landmarks[159]; // Top
    const rightEye = landmarks[386]; // Top
    const eyeHeightDiff = Math.abs(leftEye.y - rightEye.y);
    const symmetry = Math.max(0, 100 - (eyeHeightDiff * 1000)); // Normalized

    // 2. Canthal Tilt (Inner vs Outer Canthus)
    // Left: 133 (Inner), 33 (Outer)
    // Right: 362 (Inner), 263 (Outer)
    const leftInner = landmarks[133];
    const leftOuter = landmarks[33];
    const leftTilt = -Math.atan2(leftOuter.y - leftInner.y, leftOuter.x - leftInner.x) * (180 / Math.PI);

    const rightInner = landmarks[362];
    const rightOuter = landmarks[263];
    const rightTilt = Math.atan2(rightOuter.y - rightInner.y, rightOuter.x - rightInner.x) * (180 / Math.PI);

    const avgTilt = (leftTilt + rightTilt) / 2;

    // 3. Mid-face Ratio (Width / Height)
    const zygomaticLeft = landmarks[234];
    const zygomaticRight = landmarks[454];
    const midFaceWidth = dist(zygomaticLeft, zygomaticRight);

    const midFaceTop = landmarks[168]; // Glabella
    const midFaceBottom = landmarks[2]; // Subnasale
    const midFaceHeight = dist(midFaceTop, midFaceBottom);

    const midFaceRatio = midFaceWidth / midFaceHeight;

    // 4. Jawline Definition (Angle at Gonion) - Rough estimate using lower jaw points
    const chin = landmarks[152];
    const leftGonion = landmarks[172];
    const rightGonion = landmarks[397];
    const jawlineWidth = dist(leftGonion, rightGonion);
    const jawlineDefinition = Math.min(100, (jawlineWidth / midFaceWidth) * 120);

    // 5. Total Score (Weighted average)
    const score = Math.round(
        (symmetry * 0.3) +
        (Math.min(100, jawlineDefinition) * 0.2) +
        (Math.min(100, Math.abs(midFaceRatio - 1.0) * 100) * 0.2) +
        (Math.max(0, 100 - Math.abs(avgTilt - 4) * 5) * 0.3)
    );

    return {
        score: Math.min(99, Math.max(50, score)),
        symmetry,
        midFaceRatio,
        canthalTilt: avgTilt,
        jawlineDefinition,
        browRidge: 85, // Placeholder for more complex calculation
        proportions: 82  // Placeholder
    };
}

export function getTierForScore(score: number): { title: string; meaning: string } {
    if (score >= 95) return { title: "Elite Model Tier", meaning: "Exceptional structural harmony exceeding 99% of population." };
    if (score >= 85) return { title: "Professional Tier", meaning: "Strong aesthetic markings frequently seen in commercial modeling." };
    if (score >= 75) return { title: "High Symmetry Tier", meaning: "Standard facial balance with positive structural development." };
    if (score >= 65) return { title: "Balanced Tier", meaning: "Common facial structure with no major asymmetries detected." };
    return { title: "Individual Tier", meaning: "Unique facial markings with opportunities for structural optimization." };
}
