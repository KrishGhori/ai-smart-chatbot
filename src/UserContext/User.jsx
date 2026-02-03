import { useState } from "react"
import Home from "../Pages/Home"
import { DataContext } from "./store"
const User = ({children}) => {
 
  
 
  const [popup , setpopup] = useState(false);
  const [ inp , setinp] = useState('') ;
  const [feature , setfeature] = useState("chat");
  const [resultAI , setresultAI] = useState("") ;
  const [genimgurl , setgenimgurl] = useState("")
 
  return (
    <div>
      <DataContext.Provider value={{popup, setpopup, inp, setinp, feature, setfeature , resultAI , setresultAI ,genimgurl , setgenimgurl}}>
        {children}
      </DataContext.Provider>
    </div>
  )
}

export default User

