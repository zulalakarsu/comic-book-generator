import Replicate from "replicate";

export interface ComicPanel {
  prompt: string;
  caption: string;
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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