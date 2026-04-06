import { prevuse } from "./UserContext/store"

const Api_Url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

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

export async function generateResponse() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    return "Gemini is not configured yet. Add VITE_GEMINI_API_KEY to your .env file and restart Vite to enable chat responses."
  }

  const parts = [
    {
      text: `Answer the user's question in a clear, structured format with short paragraphs and bullet points when helpful. Avoid raw markdown symbols like asterisks around every sentence.\n\nUser question: ${prevuse.prompt || ""}`
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