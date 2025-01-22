# Comic Story Generator

## Overview
The Comic Story Generator is a web application that allows users to create a 3-panel comic story about a cat's adventure. The model was trained on images of a cat called 'Pumpkin'. Users can input a prompt, and the application utilizes OpenAI's GPT-4 model to generate the comic story, which is then illustrated using the Replicate API.

link to project: https://comic-book-beta.vercel.app/

<img width="1041" alt="Image" src="https://github.com/user-attachments/assets/4f66f80f-b47d-4365-9f62-513109cef572"/>

## Features
- User-friendly interface for inputting prompts.
- Generates a structured comic story in JSON format.
- Automatically creates images for each panel using AI.
- Displays the generated comic story with images.

## Technologies Used
- **Next.js**: A React framework for building server-side rendered applications.
- **OpenAI API**: For generating comic story content.
- **Replicate API**: For generating images based on the prompts.
- **TypeScript**: For type safety and better development experience.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/comic-story-generator.git
   cd comic-story-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your API keys:
   ```plaintext
   OPENAI_API_KEY=your_openai_api_key
   REPLICATE_API_TOKEN=your_replicate_api_token
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`.

## Usage
- Enter a short prompt in the input area (e.g., "adventure on a boat").
- Click the submit button to generate the comic story.
- The application will display the generated comic panels along with their captions.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments
- [OpenAI](https://openai.com/) for providing the GPT-4 model.
- [Replicate](https://replicate.com/) for the image generation API.
