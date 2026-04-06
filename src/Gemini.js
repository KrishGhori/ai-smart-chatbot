import { prevuse } from "./UserContext/store"

const Api_Url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
const POLLINATIONS_BASE_URL = import.meta.env.VITE_POLLINATIONS_BASE_URL || "https://gen.pollinations.ai"
const POLLINATIONS_TEXT_MODEL = import.meta.env.VITE_POLLINATIONS_TEXT_MODEL || "openai"
const POLLINATIONS_API_KEY = (import.meta.env.VITE_POLLINATIONS_API_KEY || "").trim()
const POLLINATIONS_LEGACY_TEXT_URL = import.meta.env.VITE_POLLINATIONS_LEGACY_TEXT_URL || "https://text.pollinations.ai"
const HF_API_KEY = (import.meta.env.VITE_HF_API_KEY || "").trim()
const HF_TEXT_MODEL = import.meta.env.VITE_HF_TEXT_MODEL || "google/flan-t5-base"

const toRawBase64 = (value) => {
  if (!value || typeof value !== "string") {
    return value
  }

  const commaIndex = value.indexOf(",")
  if (value.startsWith("data:") && commaIndex !== -1) {
    return value.slice(commaIndex + 1)
  }

  return value
}

const buildFreePrompt = (userPrompt, hasImage) => {
  return [
    "Answer in a clear and structured way with short paragraphs and bullet points when useful.",
    "Avoid heavy markdown formatting.",
    hasImage ? "User also attached an image, but image analysis is unavailable in free mode. Mention this briefly and continue with text help." : "",
    `User question: ${userPrompt}`
  ].filter(Boolean).join("\n\n")
}

const buildLocalFallbackResponse = (userPrompt) => {
  return [
    "I could not reach the text providers right now, but I can still help.",
    "",
    "Quick guidance:",
    "- Check your internet connection and try again in a few seconds.",
    "- Keep prompts short and specific for more reliable responses.",
    "- If the issue continues, switch to Gemini mode from your app settings.",
    "",
    `Your request was: "${userPrompt}"`
  ].join("\n")
}

const parsePollinationsMessage = (content) => {
  if (typeof content === "string") {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : part?.text || ""))
      .join("\n")
      .trim()
  }

  return ""
}

const getPollinationsAuthText = async (freePrompt) => {
  const response = await fetch(`${POLLINATIONS_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${POLLINATIONS_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: POLLINATIONS_TEXT_MODEL,
      messages: [{ role: "user", content: freePrompt }]
    })
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data?.error?.message || `Pollinations API error ${response.status}`
    throw new Error(message)
  }

  const messageContent = parsePollinationsMessage(data?.choices?.[0]?.message?.content)
  if (!messageContent) {
    throw new Error("Pollinations API returned an empty response.")
  }

  return messageContent
}

const getPollinationsAnonymousText = async (freePrompt) => {
  const response = await fetch(`${POLLINATIONS_BASE_URL}/text/${encodeURIComponent(freePrompt)}`)
  if (!response.ok) {
    throw new Error(`Pollinations API error ${response.status}`)
  }

  const freeText = (await response.text()).trim()
  if (!freeText) {
    throw new Error("Pollinations API returned an empty response.")
  }

  return freeText
}

const getPollinationsLegacyText = async (freePrompt) => {
  const response = await fetch(`${POLLINATIONS_LEGACY_TEXT_URL}/${encodeURIComponent(freePrompt)}`)
  if (!response.ok) {
    throw new Error(`Legacy Pollinations API error ${response.status}`)
  }

  const freeText = (await response.text()).trim()
  if (!freeText) {
    throw new Error("Legacy Pollinations API returned an empty response.")
  }

  return freeText
}

const getHuggingFaceText = async (freePrompt) => {
  if (!HF_API_KEY) {
    throw new Error("Hugging Face API key is missing.")
  }

  const response = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(HF_TEXT_MODEL)}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: freePrompt,
      parameters: {
        max_new_tokens: 220,
        return_full_text: false
      }
    })
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data?.error || `Hugging Face API error ${response.status}`
    throw new Error(String(message))
  }

  const text = Array.isArray(data)
    ? (data[0]?.generated_text || "")
    : (data?.generated_text || "")

  if (!String(text).trim()) {
    throw new Error("Hugging Face API returned an empty response.")
  }

  return String(text).trim()
}

const getDuckDuckGoText = async (userPrompt) => {
  const query = String(userPrompt || "").trim()
  if (!query) {
    throw new Error("DuckDuckGo fallback query is empty.")
  }

  const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`)
  if (!response.ok) {
    throw new Error(`DuckDuckGo API error ${response.status}`)
  }

  const data = await response.json().catch(() => ({}))
  const abstractText = String(data?.AbstractText || "").trim()
  const answerText = String(data?.Answer || "").trim()
  const heading = String(data?.Heading || "").trim()

  const best = abstractText || answerText
  if (!best) {
    throw new Error("DuckDuckGo returned no direct answer.")
  }

  return heading ? `${heading}: ${best}` : best
}

const getWikipediaText = async (userPrompt) => {
  const cleanedQuery = String(userPrompt || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(what|is|are|the|a|an|about|please|explain|tell|me|of|to|in)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  const searchQuery = cleanedQuery || String(userPrompt || "").trim()
  if (!searchQuery) {
    throw new Error("Wikipedia fallback query is empty.")
  }

  const searchResponse = await fetch(`https://en.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(searchQuery)}&limit=1`)
  if (!searchResponse.ok) {
    throw new Error(`Wikipedia search error ${searchResponse.status}`)
  }

  const searchData = await searchResponse.json().catch(() => ({}))
  const pageKey = searchData?.pages?.[0]?.key
  if (!pageKey) {
    throw new Error("No Wikipedia result found.")
  }

  const summaryResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageKey)}`)
  if (!summaryResponse.ok) {
    throw new Error(`Wikipedia summary error ${summaryResponse.status}`)
  }

  const summaryData = await summaryResponse.json().catch(() => ({}))
  const summary = (summaryData?.extract || "").trim()
  if (!summary) {
    throw new Error("Wikipedia returned an empty summary.")
  }

  return `From Wikipedia: ${summary}`
}

const getPollinationsText = async (freePrompt, userPrompt) => {
  const failures = []

  if (POLLINATIONS_API_KEY) {
    try {
      return await getPollinationsAuthText(freePrompt)
    } catch (error) {
      failures.push(`auth: ${error.message}`)
    }

    try {
      return await getPollinationsAnonymousText(freePrompt)
    } catch (error) {
      failures.push(`anon-new: ${error.message}`)
    }

    try {
      return await getHuggingFaceText(freePrompt)
    } catch (error) {
      failures.push(`huggingface: ${error.message}`)
    }

    try {
      return await getDuckDuckGoText(userPrompt)
    } catch (error) {
      failures.push(`duckduckgo: ${error.message}`)
    }

    try {
      return await getWikipediaText(userPrompt)
    } catch (error) {
      failures.push(`wikipedia: ${error.message}`)
    }

    throw new Error(`All authenticated text providers failed. ${failures.join(" | ")}`)
  }

  try {
    return await getPollinationsAnonymousText(freePrompt)
  } catch (error) {
    failures.push(`anon-new: ${error.message}`)
  }

  try {
    return await getPollinationsLegacyText(freePrompt)
  } catch (error) {
    failures.push(`anon-legacy: ${error.message}`)
  }

  try {
    return await getHuggingFaceText(freePrompt)
  } catch (error) {
    failures.push(`huggingface: ${error.message}`)
  }

  try {
    return await getDuckDuckGoText(userPrompt)
  } catch (error) {
    failures.push(`duckduckgo: ${error.message}`)
  }

  try {
    return await getWikipediaText(userPrompt)
  } catch (error) {
    failures.push(`wikipedia: ${error.message}`)
  }

  throw new Error(`All free text providers failed. ${failures.join(" | ")}`)
}

export async function generateResponse() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  const useGemini = import.meta.env.VITE_USE_GEMINI === "true" && Boolean(apiKey)
  const userPrompt = (prevuse.prompt || "").trim()

  if (!userPrompt) {
    return "Please enter a prompt first."
  }

  if (!useGemini) {
    const freePrompt = buildFreePrompt(userPrompt, Boolean(prevuse.data))

    try {
      const freeText = await getPollinationsText(freePrompt, userPrompt)

      return freeText.replace(/\*\*(.*?)\*\*/g, "$1").trim()
    } catch (error) {
      console.log("free api error", error)
      return buildLocalFallbackResponse(userPrompt)
    }
  }

  const parts = [
    {
      text: `Answer the user's question in a clear, structured format with short paragraphs and bullet points when helpful. Avoid raw markdown symbols like asterisks around every sentence.\n\nUser question: ${userPrompt}`
    }
  ]

  if (prevuse.data) {
    parts.push({
      inline_data: {
        mime_type: prevuse.mime_type,
        data: toRawBase64(prevuse.data)
      }
    })
  }

  const requestOption = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts
        }
      ]
    })
  }

  const requestUrl = `${Api_Url}?key=${apiKey}`

  try {
    const response = await fetch(requestUrl, requestOption)
    const data = await response.json()

    if (!response.ok) {
      const message = data?.error?.message || `Gemini API error ${response.status}`
      throw new Error(message)
    }

    const apiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!apiResponse) {
      const message = data?.promptFeedback?.blockReason
        ? `Gemini request blocked: ${data.promptFeedback.blockReason}`
        : "Gemini returned no text response."
      throw new Error(message)
    }

    return apiResponse.replace(/\*\*(.*?)\*\*/g, "$1").trim()
  } catch (error) {
    console.log("error", error)
    throw error
  }
}