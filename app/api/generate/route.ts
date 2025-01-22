import { NextResponse } from 'next/server';
import Replicate from "replicate";
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

interface ComicPanel {
  prompt: string;
  caption: string;
}

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
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a JSON generator. Return ONLY a valid JSON object with exactly 3 panels, using this structure:
            {
              "comics": [
                {
                  "prompt": "PUMKI the cat [scene description] cartoonish style, warm colors",
                  "caption": "Pumpkino [action description]"
                }
              ]
            }
            Do not include any additional text, markdown, or explanation.`
        },
        { role: "user", content: user_prompt }
      ],
      temperature: 0.5,
      max_tokens: 1000
    }));

    const content = response.choices[0]?.message?.content ?? null;
    console.log("Raw OpenAI Response:", content);

    if (!content) {
      throw new Error("No content received from OpenAI");
    }
    
    let comicStory: { comics: ComicPanel[] };
    try {
      comicStory = JSON.parse(content.trim());
      console.log("Parsed Comic Story:", comicStory);
    } catch {
      console.error('Failed to parse JSON. Raw content:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    const img_urls: { url: string; caption: string }[] = [];

    for (const panel of comicStory.comics) {
      try {
        const output = await replicate.run(
          "sundai-club/pumkino:86402cac92141dd074aa6a12d8b197cafc50adf91a3625e42fd5c36dc33ed45e",
          { 
            input: {
              prompt: panel.prompt,
            }
          }
        ) as string[];

        console.log("Replicate Response:", output);

        if (!output?.[0]) {
          throw new Error("No image generated");
        }

        img_urls.push({
          url: String(output[0]),
          caption: panel.caption
        });
      } catch (error: unknown) {
        console.error('Error generating image:', error);
        throw new Error("Failed to generate image");
      }
    }
    
    return NextResponse.json({ 
      success: true,
      img_urls: img_urls
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate comic story" },
      { status: 500 }
    );
  }
}
