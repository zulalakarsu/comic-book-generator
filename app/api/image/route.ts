import { NextResponse } from 'next/server';
import Replicate from "replicate";

interface ComicPanel {
  prompt: string;
  caption: string;
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
  try {
    const { comics } = await req.json();

    if (!comics || !Array.isArray(comics)) {
      return NextResponse.json(
        { error: "Comics array is required" },
        { status: 400 }
      );
    }

    const img_urls = await generateImages(comics);

    return NextResponse.json({ 
      success: true,
      img_urls 
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate images" },
      { status: 500 }
    );
  }
}

export async function generateImages(comics: ComicPanel[]): Promise<{ url: string; caption: string }[]> {
  const imagePromises = comics.map((panel: ComicPanel) => 
    replicate.run(
      "sundai-club/pumkino:86402cac92141dd074aa6a12d8b197cafc50adf91a3625e42fd5c36dc33ed45e",
      {
        input: {
          prompt: panel.prompt,
          num_inference_steps: 28,
          guidance_scale: 7.5,
          model: "dev"
        }
      }
    ) as Promise<string[]>
  );

  const outputs = await Promise.all(imagePromises);
  return outputs.map((output, index) => ({
    url: String(output[0]),
    caption: comics[index].caption
  }));
}
