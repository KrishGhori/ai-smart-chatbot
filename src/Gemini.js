import { prevuse } from "./UserContext/store"

const Api_Url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyCw6SKYZbMW7niDNoMLuqNcZFJ5j30YCJA"

export async function generateResponse() {
    let RequestOption = {
        method : "POST" ,
        Headers : 'Content-Type : application/json' ,
        body : JSON.stringify({
            "contents": [
    {
      "parts": [
        {
          "text": prevuse.prompt
        },
        prevuse.data ? [{
          "inline_data": {
            "mime_type": prevuse.mime_type,
            "data": prevuse.data
          }
        }]: []
      ]
    }
  ]
        })
    }
    try {
        let response = await fetch(Api_Url,RequestOption)
        const data = await response.json()
        const apiresonse = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,"$1").trim()
        return apiresonse 
    } catch (error) {
        console.log("error",error)
    }
}