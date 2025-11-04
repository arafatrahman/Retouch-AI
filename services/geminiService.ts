import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { DetectedObject } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not set. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

/**
 * Edits an image using the Gemini API based on a text prompt.
 * @param base64Image The base64 encoded image string.
 * @param mimeType The MIME type of the image.
 * @param prompt The text prompt describing the desired edits.
 * @returns A promise that resolves to the base64 encoded string of the edited image.
 */
export const editImageWithGemini = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: `Please edit this photo according to the following instructions. Only return the edited image, no text. Instructions: ${prompt}`,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const firstPart = response.candidates?.[0]?.content?.parts?.[0];
    if (firstPart && firstPart.inlineData) {
      return firstPart.inlineData.data;
    } else {
      throw new Error("No image data returned from API.");
    }
  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    throw new Error("Failed to process image with AI. Please try again.");
  }
};


/**
 * Detects objects in an image using the Gemini API.
 * @param base64Image The base64 encoded image string.
 * @param mimeType The MIME type of the image.
 * @returns A promise that resolves to an array of detected objects.
 */
export const detectObjectsInImage = async (
  base64Image: string,
  mimeType: string,
): Promise<DetectedObject[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "Detect all distinct objects in this image. For each object, provide its name and a precise bounding box. The bounding box coordinates must be normalized between 0 and 1.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: "The common name of the detected object (e.g., 'person', 'car', 'hat')."
              },
              boundingBox: {
                type: Type.OBJECT,
                properties: {
                  x_min: { type: Type.NUMBER, description: "Normalized top-left corner x-coordinate." },
                  y_min: { type: Type.NUMBER, description: "Normalized top-left corner y-coordinate." },
                  x_max: { type: Type.NUMBER, description: "Normalized bottom-right corner x-coordinate." },
                  y_max: { type: Type.NUMBER, description: "Normalized bottom-right corner y-coordinate." },
                },
                required: ["x_min", "y_min", "x_max", "y_max"],
              },
            },
            required: ["name", "boundingBox"],
          },
        },
      },
    });

    const jsonString = response.text.trim();
    const detectedObjects = JSON.parse(jsonString);

    if (!Array.isArray(detectedObjects)) {
        throw new Error("API did not return a valid array of objects.");
    }

    return detectedObjects;

  } catch (error) {
    console.error("Error detecting objects with Gemini:", error);
    if (error instanceof SyntaxError) {
        throw new Error("Failed to parse object detection data from AI. The format was invalid.");
    }
    throw new Error("Failed to detect objects with AI. Please try again.");
  }
};
