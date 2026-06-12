/**
 * Facial Analysis Logic Engine
 * Processes 468 MediaPipe FaceMesh landmarks to calculate Lookmaxxing metrics.
 */

export interface FacialMetrics {
    score: number;
    rawScore: number;
    confidenceScore: number;
    qualityWarnings: string[];
    symmetry: number;
    midFaceRatio: number;
    canthalTilt: number;
    canthalTiltScore: number;
    jawlineDefinition: number;
    browRidge: number;
    proportions: number;
    faceWidth: number;
    faceHeight: number;
    jawAngle: number;
    fWHR: number;
    upperThird: number;
    middleThird: number;
    lowerThird: number;
}

export type Landmark = { x: number; y: number; z: number };

const dist = (p1: Landmark, p2: Landmark) =>
    Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

const median = (values: number[]): number => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

export function medianLandmarks(samples: Landmark[][]): Landmark[] {
    if (!samples.length) {
        throw new Error("No landmark samples provided");
    }

    return samples[0].map((_, index) => ({
        x: median(samples.map(sample => sample[index]?.x ?? 0)),
        y: median(samples.map(sample => sample[index]?.y ?? 0)),
        z: median(samples.map(sample => sample[index]?.z ?? 0)),
    }));
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function calibrateOverallScore(rawScore: number): number {
    const clampedRawScore = clamp(rawScore, 0, 100);

    // Raw landmark geometry is intentionally strict. This maps it into a
    // consumer-facing range while keeping relative differences intact.
    if (clampedRawScore < 50) {
        return Math.round(45 + clampedRawScore * 0.6);
    }

    return Math.round(75 + (clampedRawScore - 50) * 0.38);
}

export function getFaceRotation(
    landmarks: Landmark[]
): number {

    const leftEye =
        landmarks[33];

    const rightEye =
        landmarks[263];

    return Math.atan2(
        rightEye.y - leftEye.y,
        rightEye.x - leftEye.x
    );
}

export function rotatePoint(
    point: Landmark,
    center: Landmark,
    angle: number   
): Landmark {

    const dx = point.x - center.x;
    const dy = point.y - center.y;

    return {
        ...point,
        x:
            center.x +
            dx * Math.cos(-angle) -
            dy * Math.sin(-angle),

        y:
            center.y +
            dx * Math.sin(-angle) +
            dy * Math.cos(-angle),
    };
}

export function getCaptureQuality(landmarks: Landmark[]): {
    confidenceScore: number;
    warnings: string[];
} {
    if (!landmarks || landmarks.length < 468) {
        return {
            confidenceScore: 0,
            warnings: ["Face landmarks were not detected clearly."]
        };
    }

    const warnings: string[] = [];
    const rollDegrees = Math.abs(getFaceRotation(landmarks) * (180 / Math.PI));
    const faceWidth = dist(landmarks[234], landmarks[454]);
    const faceHeight = dist(landmarks[10], landmarks[152]);
    const nose = landmarks[1];
    const leftCheekDistance = dist(nose, landmarks[234]);
    const rightCheekDistance = dist(nose, landmarks[454]);
    const yawImbalance =
        Math.abs(leftCheekDistance - rightCheekDistance) /
        Math.max(leftCheekDistance, rightCheekDistance, 0.001);
    const mouthOpening =
        dist(landmarks[13], landmarks[14]) /
        Math.max(faceHeight, 0.001);

    if (rollDegrees > 3) {
        warnings.push("Keep your eyes level with the camera.");
    }

    if (faceWidth < 0.32 || faceHeight < 0.42) {
        warnings.push("Move a little closer so the face fills the frame.");
    }

    if (yawImbalance > 0.16) {
        warnings.push("Face the camera directly instead of turning sideways.");
    }

    if (mouthOpening > 0.025) {
        warnings.push("Use a relaxed, closed-mouth expression.");
    }

    const rollPenalty = clamp((rollDegrees - 1) * 7, 0, 25);
    const sizePenalty = faceWidth < 0.32 || faceHeight < 0.42 ? 15 : 0;
    const yawPenalty = clamp((yawImbalance - 0.06) * 120, 0, 25);
    const expressionPenalty = clamp((mouthOpening - 0.012) * 700, 0, 20);

    return {
        confidenceScore: Math.round(
            clamp(
                100 - rollPenalty - sizePenalty - yawPenalty - expressionPenalty,
                45,
                99
            )
        ),
        warnings
    };
}

export function calculateLookmaxxingMetrics(landmarks: Landmark[]): FacialMetrics {
    if (!landmarks || landmarks.length < 468) {
        throw new Error("Invalid landmark data");
    }

    const angleBetween = (
    p1: Landmark,
    p2: Landmark,
    p3: Landmark
    ): number => {

        const a = dist(p2, p3);
        const b = dist(p1, p3);
        const c = dist(p1, p2);

        return (
            Math.acos(
                (a * a + c * c - b * b) /
                (2 * a * c)
            ) *
            (180 / Math.PI)
        );
    };

    const normalizeScore = (
        value: number,
        ideal: number,
        tolerance: number
    ): number => {

        const deviation =
            Math.abs(value - ideal);

        return Math.max(
            0,
            100 - (deviation / tolerance) * 100
        );
    };
    const captureQuality = getCaptureQuality(landmarks);
    // 1. Eye Symmetry (comparing heights and sizes)
    // Align landmarks to correct for head rotation
    const rotation =
        getFaceRotation(landmarks);

    const center =
        landmarks[168];

    const alignedLandmarks =
        landmarks.map(p =>
            rotatePoint(
                p,
                center,
                rotation
            )
        );

    const symmetryPairs = [
    [33, 263],
    [133, 362],
    [61, 291],
    [234, 454],
    [172, 397]
];

const midline =
    alignedLandmarks[168].x;

let totalError = 0;

for (const [leftIdx, rightIdx] of symmetryPairs) {

    const left =
        alignedLandmarks[leftIdx];

    const right =
        alignedLandmarks[rightIdx];

    const leftDistance =
        Math.abs(midline - left.x);

    const rightDistance =
        Math.abs(right.x - midline);

    totalError +=
        Math.abs(
            leftDistance -
            rightDistance
        );
}

const symmetry =
    Math.max(
        0,
        100 - totalError * 300
    );

    // 2. Canthal Tilt (Inner vs Outer Canthus)
    // Left: 133 (Inner), 33 (Outer)
    // Right: 362 (Inner), 263 (Outer)
    const getCanthalTilt = (inner: Landmark, outer: Landmark): number => {
        const eyeWidth = Math.max(Math.abs(outer.x - inner.x), 0.001);
        const outerRise = inner.y - outer.y;
        return Math.atan2(outerRise, eyeWidth) * (180 / Math.PI);
    };

    const leftInner = alignedLandmarks[133];
    const leftOuter = alignedLandmarks[33];
    const leftTilt = getCanthalTilt(leftInner, leftOuter);

    const rightInner = alignedLandmarks[362];
    const rightOuter = alignedLandmarks[263];
    const rightTilt = getCanthalTilt(rightInner, rightOuter);

    const avgTilt =
    (
        leftTilt +
        rightTilt
    ) / 2;

    const canthalTiltScore =
    normalizeScore(
        avgTilt,
        5,
        8
    );

    // 3. Mid-face Ratio (Width / Height)
    const zygomaticLeft = alignedLandmarks[234];
    const zygomaticRight = alignedLandmarks[454];
    const midFaceWidth = dist(zygomaticLeft, zygomaticRight);

    const midFaceTop = alignedLandmarks[168]; // Glabella
    const midFaceBottom = alignedLandmarks[2]; // Subnasale
    const midFaceHeight = dist(midFaceTop, midFaceBottom);
    const midFaceRatio = midFaceHeight > 0 ? midFaceWidth / midFaceHeight : 0;

    const faceWidth =
    dist(
        alignedLandmarks[234],
        alignedLandmarks[454]
    );

    const faceHeight =
        dist(
            alignedLandmarks[10],
            alignedLandmarks[152]
        );

    const fWHR =
        faceWidth / faceHeight;

    const fWHRScore =
        normalizeScore(
            fWHR,
            0.82,
            0.25
        );

    const upperThird =
    dist(
        alignedLandmarks[10],
        alignedLandmarks[168]
    );

    const middleThird =
        dist(
            alignedLandmarks[168],
            alignedLandmarks[2]
        );

    const lowerThird =
        dist(
            alignedLandmarks[2],
            alignedLandmarks[152]
        );

    const thirdsBalance =
    (
        normalizeScore(
            upperThird / middleThird,
            1,
            0.3
        )
        +
        normalizeScore(
            middleThird / lowerThird,
            1,
            0.3
        )
    ) / 2;
    // 4. Jawline Definition (Angle at Gonion) - Rough estimate using lower jaw points
    const jawAngle =
        angleBetween(
            alignedLandmarks[172],
            alignedLandmarks[152],
            alignedLandmarks[397]
        );

    const jawlineDefinition =
        normalizeScore(
            jawAngle,
            110,
            30
        );
    // 5. Total Score (Weighted average)
    const rawScore =
    Math.round(
        symmetry * 0.25 +
        jawlineDefinition * 0.20 +
        canthalTiltScore * 0.15 +
        thirdsBalance * 0.20 +
        fWHRScore * 0.20
    );

    return {
        score: Math.min(99, Math.max(0, calibrateOverallScore(rawScore))),
        rawScore: Math.min(99, Math.max(0, rawScore)),
        confidenceScore: captureQuality.confidenceScore,
        qualityWarnings: captureQuality.warnings,
        symmetry,
        midFaceRatio,
        canthalTilt: avgTilt,
        canthalTiltScore,
        jawlineDefinition,
        browRidge: thirdsBalance,
        proportions: fWHRScore,

        faceWidth,
        faceHeight,
        jawAngle,
        fWHR,
        upperThird,
        middleThird,
        lowerThird
    };
}

export function getTierForScore(score: number): { title: string; meaning: string } {
    if (score >= 95) return { title: "Elite Model Tier", meaning: "Exceptional structural harmony exceeding 99% of population." };
    if (score >= 85) return { title: "Professional Tier", meaning: "Strong aesthetic markings frequently seen in commercial modeling." };
    if (score >= 75) return { title: "High Symmetry Tier", meaning: "Standard facial balance with positive structural development." };
    if (score >= 65) return { title: "Balanced Tier", meaning: "Common facial structure with no major asymmetries detected." };
    return { title: "Individual Tier", meaning: "Unique facial markings with opportunities for structural optimization." };
}
