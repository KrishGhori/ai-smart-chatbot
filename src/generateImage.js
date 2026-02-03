// Gemini image generator using the official endpoint.
// IMPORTANT: Set your API key in a Vite env variable named VITE_GEMINI_API_KEY
// Example .env: VITE_GEMINI_API_KEY="YOUR_KEY_HERE"

export async function generatimage(prompt) {
  // Read the key from Vite env (do not hard-code API keys in source)
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  const placeholder = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

  if (!key) {
    // No API key configured — use Unsplash Source (no signup) when a prompt is provided,
    // otherwise fall back to the tiny placeholder image.
    if (prompt && prompt.trim()) {
      const unsplashUrl = `https://source.unsplash.com/1200x800/?${encodeURIComponent(prompt)}`;
      console.info('No Gemini key: returning Unsplash URL for prompt.');
      return { src: unsplashUrl, message: 'No Gemini API key configured — using Unsplash photos for this prompt.' };
    }

    console.warn('Gemini API key missing; showing placeholder image. To enable real images set VITE_GEMINI_API_KEY and restart Vite.');
    return { src: placeholder, message: 'No Gemini API key configured — showing placeholder image.' };
  }

  // Use header-based key; do not include key in URL to avoid leaking it in logs
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';
  const body = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    // Try to parse useful info (retry delay, message)
    const text = await resp.text();
    let message = `Gemini API error ${resp.status}`;
    try {
      const bodyJson = JSON.parse(text);
      if (resp.status === 429) {
        const retryInfo = bodyJson?.error?.details?.find(d => d['@type']?.includes('RetryInfo'));
        const retryDelay = retryInfo?.retryDelay;
        let seconds = null;
        if (retryDelay) {
          const m = String(retryDelay).match(/([0-9]+(?:\.[0-9]+)?)/);
          if (m) seconds = Math.ceil(parseFloat(m[1]));
        }
        message = seconds ? `Rate limit hit. Retry in ${seconds}s.` : 'Rate limit hit. Try again later.';
      } else {
        message = bodyJson?.error?.message || message;
      }
    } catch (e) {
      message = `${message}: ${text}`;
    }
    console.warn(message);
    // return placeholder image and message instead of throwing to avoid app crash
    return { src: placeholder, message };
  }

  const data = await resp.json();

  // helper to find either a data URI or raw base64 image inside the response
  function findImageString(obj) {
    if (!obj) return null;
    if (typeof obj === 'string') {
      // data URI
      const dataUriMatch = obj.match(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+/);
      if (dataUriMatch) return dataUriMatch[0];
      // raw base64 (heuristic: long base64-like string)
      const base64Match = obj.match(/([A-Za-z0-9+/=]{200,})/);
      if (base64Match) return base64Match[1];
      return null;
    }
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = findImageString(item);
        if (found) return found;
      }
    } else if (typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        const found = findImageString(obj[key]);
        if (found) return found;
      }
    }
    return null;
  }

  const imgStr = findImageString(data);
  if (!imgStr) throw new Error('No image data found in Gemini response');

  // if it's already a data URI, return it
  if (imgStr.startsWith('data:')) return imgStr;

  // otherwise assume it is raw base64 and return a PNG data URL
  return `data:image/png;base64,${imgStr}`;
}
