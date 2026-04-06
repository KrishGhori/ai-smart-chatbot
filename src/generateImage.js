const FREE_IMAGE_API_URL = "https://image.pollinations.ai/prompt";

export async function generatimage(prompt) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  const useGemini = import.meta.env.VITE_USE_GEMINI_IMAGE === "true" && Boolean(key);
  const placeholder = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
  const cleanPrompt = String(prompt || "").trim();

  if (!cleanPrompt) {
    return { src: placeholder, message: "Please enter a prompt to generate an image." };
  }

  if (!useGemini) {
    const freeImageUrl = `${FREE_IMAGE_API_URL}/${encodeURIComponent(cleanPrompt)}?width=1024&height=1024&model=flux&nologo=true`;
    return {
      src: freeImageUrl,
      message: "Generated using free image API."
    };
  }

  // Optional Gemini path when explicitly enabled.
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';
  const body = {
    contents: [
      {
        parts: [
          { text: cleanPrompt }
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
    } catch {
      message = `${message}: ${text}`;
    }
    console.warn(message);
    const freeImageUrl = `${FREE_IMAGE_API_URL}/${encodeURIComponent(cleanPrompt)}?width=1024&height=1024&model=flux&nologo=true`;
    return {
      src: freeImageUrl,
      message: `${message} Falling back to free image API.`
    };
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
