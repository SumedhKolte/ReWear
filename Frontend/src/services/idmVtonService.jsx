import { client } from "@gradio/client";


// Helper: fetch image as Blob
export async function fetchImageAsBlob(url) {
  const response = await fetch(url);
  return await response.blob();
}

export async function runVirtualTryOn(personImage, garmentImage, prompt = "high quality, detailed clothing") {
  const app = await client.connect("yisol/IDM-VTON", {
    hf_token: process.env.REACT_APP_HF_TOKEN // Only needed for private spaces
  });

  // IDM-VTON expects 7 parameters
  const result = await app.predict("/tryon", [
    { background: personImage, layers: [], composite: null }, // Human image
    garmentImage, // Garment image
    prompt,       // Prompt
    true,         // Auto-mask
    true,         // Auto-mask only
    20,           // Denoising steps
    Math.floor(Math.random() * 1000000) // Seed
  ]);
  return result.data; // [outputImage, maskedImage]
}
