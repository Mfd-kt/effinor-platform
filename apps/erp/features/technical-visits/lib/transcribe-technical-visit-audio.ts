import OpenAI from "openai";

export async function transcribeTechnicalVisitAudioFile(
  file: File,
): Promise<{ text: string } | { error: string }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { error: "Configuration manquante : OPENAI_API_KEY." };
  }

  const openai = new OpenAI({ apiKey });
  try {
    const result = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "fr",
    });
    const text = typeof result === "string" ? result : result.text?.trim() ?? "";
    if (!text) {
      return { error: "Transcription vide renvoyée par le service." };
    }
    return { text };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue lors de la transcription.";
    return { error: message };
  }
}
