import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

type ApiError = Error & {
  status?: number;
};

export async function POST(req: Request) {
  try {
    const { image, localResults } = await req.json() as {
      image?: string;
      localResults?: unknown;
    };

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[API] GEMINI_API_KEY is not set. Falling back to mock data.");
      return NextResponse.json(getMockData());
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const base64Data = image.split(",")[1] || image;

    const prompt = `
      Analyze this face for specialized "lookmaxxing" structural metrics. 
      ${localResults ? `A local geometric scan has already been performed with these results: ${JSON.stringify(localResults)}. The "score" field is a calibrated final score and "rawScore" is the stricter landmark-only score. Use the calibrated score as the numeric anchor for the final score, staying within 3 points unless the image clearly contradicts it. Use the local metric values as the objective baseline for metric scores and qualitative analysis.` : ""}
      Identify 6 key facial metrics (Jawline Definition, Eye Symmetry, Mid-face Ratio, Canthal Tilt, Chin Projection, Brow Ridge).

      Return ONLY a JSON object with this exact structure:
      {
        "score": number (0-100),
        "title": "string (Professional Tier Name)",
        "tierMeaning": "string (1-sentence explanation)",
        "summary": "string (2-sentence overview)",
        "confidenceScore": number (95-100),
        "metrics": [{
          "label": "string", 
          "value": "string (e.g. 'Ideal')", 
          "numericalValue": "string (e.g. '124°')",
          "score": number (0-100), 
          "percentile": number (0-100),
          "coords": {"x": number (0-100), "y": number (0-100)}
        }],
        "pros": ["string" x 4],
        "cons": ["string" x 4]
      }
    `;

    // Try multiple models in case of quota/rate limits
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash-lite"];
    let lastError: unknown = null;
    let successfulResponse = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[API] Attempting analysis with ${modelName}...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0,
            topP: 0.1,
            topK: 1,
            candidateCount: 1,
          },
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ]
        });

        const result = await model.generateContent([
          prompt,
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
        ]);

        successfulResponse = await result.response;
        console.log(`[API] ${modelName} responded successfully.`);
        break;
      } catch (err: unknown) {
        console.warn(`[API] ${modelName} failed:`, getErrorMessage(err));
        lastError = err;
        // Continue to next model if it's a rate limit or internal error
      }
    }

    if (!successfulResponse) {
      throw lastError || new Error("All models failed to respond");
    }

    const text = successfulResponse.text();

    try {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON found");

      const jsonString = text.substring(firstBrace, lastBrace + 1);
      const analysisResults = JSON.parse(jsonString);
      return NextResponse.json(analysisResults);
    } catch (parseError: unknown) {
      console.error("[API] Failed to parse result:", text);
      throw new Error(`Invalid structural data: ${getErrorMessage(parseError)}`);
    }

  } catch (error: unknown) {
    console.error("[API] Final analysis error:", error);

    const apiError = error as ApiError;
    const errorMessage = getErrorMessage(error);
    const isQuotaError = errorMessage.toLowerCase().includes("quota") ||
      errorMessage.toLowerCase().includes("rate limit") ||
      apiError.status === 429;

    return NextResponse.json({
      error: isQuotaError ? "API Rate Limit" : "Analysis failed",
      details: isQuotaError
        ? "The AI is currently processing many requests. Showing fallback data."
        : errorMessage,
      isMock: true,
      ...getMockData()
    }, { status: 200 });
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getMockData() {
  return {
    score: 84,
    title: "Elite Master Tier (Mock)",
    tierMeaning: "Exceptional structural harmony exceeding 98% of professional standards.",
    summary: "Your facial architecture demonstrates high horizontal symmetry and a well-defined gonial angle.",
    confidenceScore: 98.4,
    metrics: [
      { label: "Jawline Definition", value: "Defined", numericalValue: "124°", score: 88, percentile: 92, coords: { x: 50, y: 85 } },
      { label: "Eye Symmetry", value: "High", numericalValue: "0.98", score: 92, percentile: 95, coords: { x: 50, y: 35 } },
      { label: "Mid-face Ratio", value: "Ideal", numericalValue: "0.97", score: 85, percentile: 88, coords: { x: 50, y: 55 } },
      { label: "Canthal Tilt", value: "Positive", numericalValue: "+4°", score: 80, percentile: 75, coords: { x: 35, y: 35 } },
      { label: "Lip Fullness", value: "Balanced", numericalValue: "1:1.6", score: 78, percentile: 72, coords: { x: 50, y: 75 } },
      { label: "Nose Projection", value: "Standard", numericalValue: "34°", score: 72, percentile: 65, coords: { x: 50, y: 50 } },
    ],
    pros: [
      "Mandibular development shows elite lateral expansion",
      "Infraorbital rims provide exceptional support",
      "Nasofrontal angle is within the 95th percentile",
      "Vertical thirds align perfectly with classical proportions",
    ],
    cons: [
      "Lateral brow density could be enhanced via grooming",
      "Slight chin retrusion noted from profile perspective",
      "Minor infraorbital hollow detectable in current lighting",
      "Upper lip height is slightly above the ideal 1:2 ratio",
    ],
  };
}
