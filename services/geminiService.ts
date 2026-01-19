
import { GoogleGenAI } from "@google/genai";

// Always initialize GoogleGenAI with a named parameter using process.env.API_KEY
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Use gemini-2.5-flash-image for general image editing tasks
export const enhanceProductImage = async (base64Image: string, prompt: string = "Professional studio product photography on a clean, solid neutral background. Soft realistic shadows and high-end studio lighting.") => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/png'
          }
        },
        {
          text: `Remove the background from this image. Place the main object in a professional studio setting. ${prompt}. Ensure the product details are preserved and lighting looks expensive.`
        }
      ]
    }
  });

  // Iterate through parts to find the image part (inlineData)
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// Use gemini-2.5-flash-image for general image generation tasks
export const generateModel = async (prompt: string, aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "3:4") => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A high-fashion fashion model, professional lighting, photorealistic, cinematic quality, posing naturally. ${prompt}` }]
    },
    config: {
      imageConfig: {
        aspectRatio
      }
    }
  });

  // Iterate through parts to find the image part
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// Use gemini-2.5-flash-image for complex image-to-image/editing tasks
export const virtualTryOn = async (productBase64: string, modelBase64: string, isBatch: boolean = false) => {
  const ai = getAIClient();
  
  const subtleVariationPrompt = isBatch 
    ? "Maintain the same model's identity, but introduce a subtle change in pose, head tilt, or facial expression to make the catalog look varied and natural."
    : "";

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: modelBase64.split(',')[1],
            mimeType: 'image/png'
          }
        },
        {
          inlineData: {
            data: productBase64.split(',')[1],
            mimeType: 'image/png'
          }
        },
        {
          text: `Combine these images. The model from the first image should be wearing the product from the second image. High-quality fashion editorial style. Ensure realistic lighting and fabric drape. ${subtleVariationPrompt}`
        }
      ]
    }
  });

  // Iterate through parts to find the image part
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Virtual try-on failed");
};
