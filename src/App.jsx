import { Route, Routes } from 'react-router'
import './App.css'
import Chat from './Pages/Chat'
import Home from './Pages/Home'

function App() {
 

  return (
   <div>
   <Routes>
 <Route
  path='/'
  element={<Home/>}/>

    <Route
    path='/chat'
    element={<Chat/>}/>
    </Routes>
    
   </div>
  )
}

export default App
