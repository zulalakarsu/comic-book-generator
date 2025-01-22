"use client";

import { useState, useEffect } from 'react';

interface ImageUrl {
  url: string;
  caption: string;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<ImageUrl[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImagesLoaded, setIsImagesLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setIsClient(true);
  }, []);

  const generateComic = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt first');
      return;
    }

    setError(null);
    setIsLoading(true);
    setIsImagesLoaded(false);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_prompt: prompt })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate comic');
      }

      if (!data.img_urls || !Array.isArray(data.img_urls)) {
        throw new Error('Invalid response format');
      }

      // Preload images
      const preloadResult = await preloadImages(data.img_urls);
      if (!preloadResult) {
        throw new Error('Failed to load one or more images');
      }
      setImages(data.img_urls);
      setIsImagesLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const preloadImages = async (images: ImageUrl[]) => {
    try {
      const imagePromises = images.map((img) => {
        return new Promise<boolean>((resolve, reject) => {
          const image = new window.Image();
          image.onload = () => resolve(true);
          image.onerror = () => reject(new Error(`Failed to load image: ${img.url}`));
          image.src = img.url;
        });
      });

      await Promise.all(imagePromises);
      return true;
    } catch (err) {
      console.error('Image loading error:', err);
      return false;
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-center text-orange-500 mb-4">
          AI Comic Book
        </h1>
        <p className="text-lg text-center text-gray-700 mb-8">
          Transform your ideas into comic stories about a Scottish Fold cat named Pumpkino!
        </p>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 max-w-2xl mx-auto">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 max-w-2xl mx-auto">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a short prompt (e.g. adventure on a boat)"
            className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none mb-4 text-black"
          />
          <button 
            onClick={generateComic}
            disabled={isLoading}
            className="w-full bg-orange-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-orange-600 transition duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Generating Comic...' : 'Generate Comic'}
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Creating your comic panels...</p>
          </div>
        )}

        {!isLoading && images && images.length > 0 && isImagesLoaded && (
          <div className="bg-white p-8 rounded-xl shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {images.map((image, index) => (
                <div key={index} className="flex flex-col">
                  {isClient && (
                    <div className="relative aspect-square border-4 border-gray-900 rounded-lg shadow-xl overflow-hidden bg-white">
                      <img 
                        src={image.url} 
                        alt={`Panel ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="mt-4 bg-yellow-100 p-4 rounded-lg border-2 border-gray-900 shadow-md">
                    <p className="text-gray-900 text-center text-base font-medium">
                      {image.caption}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
