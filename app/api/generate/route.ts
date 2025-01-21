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

interface ComicStory {
  comics: ComicPanel[];
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

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Create a 3-panel comic story about a cat's adventure. For each panel, provide:
            1. An image generation prompt that includes 'PUMKI the cat' and ends with 'cartoonish style, warm colors'
            2. A caption that refers to the cat as 'Pumpkino'

            Format the output as JSON with this structure:
            {
                "comics": [
                    {
                        "prompt": "Image generation prompt here",
                        "caption": "Caption text here"
                    }
                ]
            }`
        },
        { role: "user", content: user_prompt }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }
    
    let comicStory;
    try {
      comicStory = JSON.parse(content);
    } catch (e) {
      throw new Error("Invalid JSON response from OpenAI");
    }

    const img_urls = [];

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

        if (!output?.[0]) {
          throw new Error("No image generated");
        }

        img_urls.push({
          url: String(output[0]),  // Ensure URL is a string
          caption: panel.caption
        });
      } catch (err) {
        throw new Error(`Failed to generate image: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
