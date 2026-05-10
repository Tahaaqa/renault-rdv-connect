import sharp from "sharp";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getBackendConfig } from "@/backend/config";

export async function extractPlateText(imageBuffer: Buffer): Promise<{
  text: string;
  confidence: number;
  normalized: string | null;
}> {
  const config = getBackendConfig();
  if (!config.geminiApiKey) {
    console.warn("GEMINI_API_KEY is not configured. OCR will fail.");
    return { text: "", confidence: 0, normalized: null };
  }

  // Convert to JPEG base64 to pass to Gemini
  const processed = await sharp(imageBuffer)
    .resize({ width: 1024, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a specialized Tunisian license plate OCR system. 
IMPORTANT: You must read the plate visually strictly from LEFT to RIGHT.
A standard Tunisian license plate has a Series Number (1 to 3 digits) on the LEFT, the Arabic word 'تونس' in the MIDDLE, and a Registration Number (1 to 4 digits) on the RIGHT.
Because Arabic is a right-to-left language, OCR systems often accidentally reverse the numbers. DO NOT reverse them.
Output ONLY the formatted string: "XXX TN YYYY"
where XXX is the number on the far left of the physical plate, and YYYY is the number on the far right.
Do not include any other text.`;

  const imageParts = [
    {
      inlineData: {
        data: processed.toString("base64"),
        mimeType: "image/jpeg",
      },
    },
  ];

  try {
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const rawText = response.text().trim();

    // Since we instructed Gemini to output 'XXX TN YYYY', it should be perfectly formatted.
    let textForMatch = rawText.toUpperCase();
    textForMatch = textForMatch.replace(/تونس/g, "TN").replace(/TUNISIA/g, "TN").replace(/TUN/g, "TN").replace(/TU/g, "TN");
    
    let normalized: string | null = null;
    const match = textForMatch.match(/(\d{1,4})\s*TN\s*(\d{1,4})/);
    
    if (match) {
      normalized = `${match[1]} TN ${match[2]}`;
    } else {
      // Fallback: extract just the numbers and assume it's a standard plate
      const numbers = textForMatch.replace(/[^\d\s]/g, " ").trim().split(/\s+/).filter(Boolean);
      if (numbers.length >= 2) {
         normalized = `${numbers[0]} TN ${numbers[numbers.length - 1]}`;
      } else {
         normalized = rawText; // fallback
      }
    }

    return { text: rawText, confidence: 99, normalized: normalized };
  } catch (error) {
    console.error("Gemini OCR error:", error);
    return { text: "", confidence: 0, normalized: null };
  }
}
