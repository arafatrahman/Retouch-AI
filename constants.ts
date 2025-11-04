
import { Filter, Adjustment } from './types';

export const FILTERS: Filter[] = [
  { name: "Natural Beauty", prompt: "Subtly enhance the natural beauty. Apply very light skin smoothing to even out texture, slightly brighten the eyes, and add a soft, healthy glow. Keep all changes minimal and realistic." },
  { name: "Glow Up", prompt: "Give the photo a 'glow up'. Smooth the skin for a flawless finish, add luminous highlights to cheekbones, slightly enlarge and brighten eyes, and enhance lip color for a vibrant look." },
  { name: "Porcelain Skin", prompt: "Create a porcelain skin effect. Apply significant skin smoothing to remove blemishes and pores, even out the skin tone to a fair, uniform color, and add a soft, matte finish." },
  { name: "Sun-Kissed", prompt: "Create a sun-kissed look. Add a warm, golden tan to the skin tone, brighten the image as if in sunlight, and add a gentle glow." },
  { name: "Soft Focus", prompt: "Apply a soft-focus effect. Gently blur the background, soften facial features, smooth skin, and reduce harsh lines for a dreamy, ethereal look." },
  { name: "Sharp & Defined", prompt: "Enhance facial definition. Subtly contour the cheekbones and jawline, sharpen the eyes and eyebrows, and add clarity to the overall image." },
  { name: "Vintage Film", prompt: "Apply a vintage film aesthetic. Add slight grain, desaturate colors slightly, add warm tones, and apply minimal, natural-looking skin retouching." },
  { name: "Ethereal Vibe", prompt: "Create an ethereal vibe. Brighten the overall image, add a cool, bluish tint, make the skin look luminous, and slightly enlarge the eyes for a magical look." },
  { name: "Classic B&W", prompt: "Convert the image to a classic black and white portrait. Enhance contrast for dramatic effect, smooth skin, and sharpen key features like eyes and lips." },
  { name: "Matte Finish", prompt: "Give the photo a modern matte finish. Mute highlights and shadows, desaturate colors slightly, and apply heavy skin smoothing for a clean, non-reflective look." },
  { name: "Bright Eyes", prompt: "Focus on the eyes. Significantly brighten and add sparkle to the irises, whiten the sclera, and subtly enhance eyelashes. Keep other facial changes minimal." },
  { name: "Fresh Face", prompt: "Create a 'no-makeup' makeup look. Even out skin tone, cover minor blemishes, add a hint of rosy color to the cheeks and lips, and slightly brighten the under-eye area." },
  { name: "Glamour Shot", prompt: "Apply a high-fashion glamour effect. Use dramatic contouring, create smoky eyes, enhance lip volume and add a glossy finish, and airbrush the skin to perfection." },
  { name: "Peachy Keen", prompt: "Add a warm, peachy tone to the entire image. Focus on adding a peach-colored blush to the cheeks and a similar tint to the lips. Create a warm, inviting feel." },
  { name: "Cool & Crisp", prompt: "Apply a cool and crisp color grading. Add a slight blue tint to the shadows, increase the overall sharpness, and brighten the image for a clean, high-definition look." },
  { name: "Rose Gold", prompt: "Infuse the image with a rose gold tint. Apply a warm pinkish-gold overlay, add a metallic sheen to highlights, and create a luxurious, trendy aesthetic." },
  { name: "Heroic Look", prompt: "Enhance features to look more heroic and strong. Define the jawline, slightly broaden the chin, sharpen the gaze, and add dramatic, high-contrast lighting." },
  { name: "Youthful Touch", prompt: "Apply enhancements to create a more youthful appearance. Reduce fine lines and wrinkles, slightly lift the cheeks and corners of the mouth, and restore a bright, even skin tone." },
  { name: "Dreamy Pastel", prompt: "Wash the image in soft pastel colors. Lighten the image significantly, add hints of light pink, blue, and lavender, and apply a soft-focus effect." },
  { name: "Golden Hour", prompt: "Recreate the lighting of the 'golden hour'. Cast a warm, soft, golden light across the image, lengthen shadows, and give the skin a radiant, sunlit glow." },
];

export const ADJUSTMENT_OPTIONS: Adjustment[] = [
    { id: 'skinSmoothing', label: 'Skin Smoothing', min: 0, max: 100, step: 1, defaultValue: 0 },
    { id: 'skinTone', label: 'Skin Tone', min: -50, max: 50, step: 1, defaultValue: 0 }, // -50 cool, 50 warm
    { id: 'facialShaping', label: 'Facial Shaping', min: 0, max: 100, step: 1, defaultValue: 0 }, // Slimming
    { id: 'eyeEnlargement', label: 'Eye Enhancement', min: 0, max: 100, step: 1, defaultValue: 0 },
    { id: 'noseModification', label: 'Nose Refinement', min: 0, max: 100, step: 1, defaultValue: 0 },
    { id: 'mouthShaping', label: 'Mouth Shaping', min: 0, max: 100, step: 1, defaultValue: 0 },
];
