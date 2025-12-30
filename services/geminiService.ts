import { GoogleGenAI, Type } from "@google/genai";
import { Caption, SpokenLanguage, CaptionOutputFormat } from "../types";

// --- Audio Extraction Logic ---

const encodeWAV = (audioBuffer: AudioBuffer): Blob => {
  const numChannels = 1; 
  const sampleRate = 16000; 
  const format = 1; 
  const bitDepth = 16;
  
  const originalSampleRate = audioBuffer.sampleRate;
  const oldData = audioBuffer.getChannelData(0); 
  const ratio = originalSampleRate / sampleRate;
  const newLength = Math.round(oldData.length / ratio);
  const resultData = new Int16Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const offset = Math.round(i * ratio);
    const val = Math.max(-1, Math.min(1, oldData[offset]));
    resultData[i] = val < 0 ? val * 0x8000 : val * 0x7FFF;
  }

  const buffer = new ArrayBuffer(44 + resultData.byteLength);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + resultData.byteLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, resultData.byteLength, true);

  const byteView = new Uint8Array(buffer, 44);
  const dataByteView = new Uint8Array(resultData.buffer);
  byteView.set(dataByteView);

  return new Blob([buffer], { type: 'audio/wav' });
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const extractAudioFromVideo = async (videoFile: File, onProgress: (status: string) => void): Promise<{ data: string, mimeType: string }> => {
  try {
    onProgress("Extracting audio from video...");
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await videoFile.arrayBuffer();
    onProgress("Decoding audio track...");
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    onProgress("Compressing audio...");
    const wavBlob = encodeWAV(audioBuffer);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        resolve({
          data: base64Data,
          mimeType: 'audio/wav'
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(wavBlob);
    });
  } catch (error) {
    console.error("Audio extraction failed", error);
    throw new Error("Failed to extract audio. The file might be corrupt or the format is unsupported.");
  }
};

// --- Main Service ---

export const generateCaptions = async (
  videoFile: File,
  spokenLanguage: SpokenLanguage,
  outputFormat: CaptionOutputFormat,
  onProgress: (status: string) => void
): Promise<Caption[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const audioPartData = await extractAudioFromVideo(videoFile, onProgress);
  
  const audioPart = {
    inlineData: {
      data: audioPartData.data,
      mimeType: audioPartData.mimeType,
    },
  };

  onProgress("Transcribing with Gemini...");
  
  // Construct precise instructions based on the combination of Input and Output
  let taskInstruction = "";

  if (outputFormat === CaptionOutputFormat.ENGLISH) {
    taskInstruction = `Transcribe the audio in ${spokenLanguage} and then TRANSLATE it into English.`;
  } else if (outputFormat === CaptionOutputFormat.HINGLISH) {
    taskInstruction = `The audio is in ${spokenLanguage} (likely Hindi). Transcribe it using the English alphabet (Romanized Hindi/Hinglish). Example: 'Kya haal hai'.`;
  } else if (outputFormat === CaptionOutputFormat.GUJLISH) {
    taskInstruction = `The audio is in ${spokenLanguage} (likely Gujarati). Transcribe it using the English alphabet (Romanized Gujarati/Gujlish). Example: 'Kem cho'.`;
  } else if (outputFormat === CaptionOutputFormat.ROMANIZED) {
    taskInstruction = `The audio is in ${spokenLanguage}. Transcribe it using the English alphabet (Romanized). Do not use the native script.`;
  } else {
    // Native
    taskInstruction = `Transcribe the audio exactly as spoken in ${spokenLanguage} using the native script.`;
  }

  const prompt = `
    Analyze the provided audio file.
    Task: ${taskInstruction}
    
    Return a JSON array where each object represents a subtitle segment.
    
    IMPORTANT RULES FOR VIRAL VIDEOS:
    1. Keep segments VERY SHORT (1-3 words max). This makes the video feel faster.
    2. Ensure strict time alignment.
    
    JSON Schema:
    - "startTime": number (seconds)
    - "endTime": number (seconds)
    - "text": string (the content)
  `;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        startTime: { type: Type.NUMBER, description: "Start time in seconds" },
        endTime: { type: Type.NUMBER, description: "End time in seconds" },
        text: { type: Type.STRING, description: "The caption text" },
      },
      required: ["startTime", "endTime", "text"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: {
        parts: [audioPart, { text: prompt }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are a professional captioner for viral Shorts/Reels. You understand Indian languages and slang perfectly.",
      },
    });

    onProgress("Processing response...");
    
    if (!response.text) {
      throw new Error("No response from Gemini.");
    }

    const rawCaptions = JSON.parse(response.text);
    
    const captions: Caption[] = rawCaptions.map((c: any, index: number) => ({
      id: `cap-${index}-${Date.now()}`,
      startTime: c.startTime,
      endTime: c.endTime,
      text: c.text
    }));

    return captions;

  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};