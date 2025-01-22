import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateImages, ComicPanel } from "../utils";

const openai = new OpenAI({
  apiKey: process.env.GITHUB_TOKEN,
  baseURL: "https://models.inference.ai.azure.com",
});

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string | null;
      role: string;
    };
    index: number;
    finish_reason: string;
  }>;
}

async function fetchWithRetry<T>(fetchFunction: () => Promise<T>, retries: number = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchFunction();
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      console.warn(`Retrying... (${i + 1}/${retries})`);
    }
  }

  throw new Error('Max retries exceeded');
}

export async function POST(req: Request) {
  try {
    const { user_prompt } = await req.json();

    if (!user_prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const response: OpenAIResponse = await fetchWithRetry(() => openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 'Create a comic story with exactly 3 panels. Return only valid JSON matching this exact format: {"comics":[{"prompt":"PUMKI the cat [scene description] cartoonish style, warm colors","caption":"[A caption that refers to the cat as Pumpkino]"}]}. Include exactly 3 objects in the comics array.'
        },
        { role: "user", content: user_prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    }));

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No content received from OpenAI");

    const comicStory = JSON.parse(content.trim());
    
    // Ensure the comicStory structure is correct
    const comics = comicStory.comics.map((panel: ComicPanel) => ({
      prompt: panel.prompt,
      caption: panel.caption
    }));

    const img_urls = await generateImages(comics);

    return NextResponse.json({ 
      success: true,
      img_urls 
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate comic story" },
      { status: 500 }
    );
  }
}
