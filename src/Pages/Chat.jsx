import React, { useContext } from 'react'
import { useNavigate } from "react-router-dom";
import { GoPlus } from "react-icons/go";
import { CiLocationArrow1 } from "react-icons/ci";
import { DataContext, prevuse } from '../UserContext/store';
import { MdOutlineUploadFile } from "react-icons/md";

const Chat = () => {
  
  const { inp , resultAI ,feature , genimgurl} = useContext(DataContext);
   
  const navigate = useNavigate()

  
    const handlehomenavigation = ()=>{
      navigate("/")
    }
    
    
  return (

    <div>
      <nav>
            <div className='logo' onClick={handlehomenavigation} title='logo'>
                Smart AI😎BOT
            </div>
        </nav>
     
    <div className='chat-page'>
      <div className='user' title='user'>
        {prevuse.imgUrl ? (
          <img className='user_img' src={prevuse.imgUrl} alt="user upload" />
        ) : (
          <div className='user_placeholder' title='no-image'>
            <MdOutlineUploadFile />
          </div>
        )}
        {!inp ? <span>Ask something...</span> : <span className='user-s'>
          {inp}
        </span>}
        
      </div>
      <div className='ai' title='ai'>
     
       
          {feature=="Generate Image" ? 
          <>
            {!genimgurl ? <span>Generating image...</span> : 
            <>
            <img src={genimgurl} alt="" />
            <span className='user-s'>
          {inp}
        </span>
            </>
            }
          </>
          :
            <>
              {!resultAI ? <span>API </span> : <span className='ai-s'>{resultAI}</span>}
            </>
          }

        
        
      </div>
    </div>

      
      <div className='tohome'>
          <button className="backhome" onClick={handlehomenavigation}>
          Back to Home
        </button>
      </div>
      
    </div>
  )
}

export default Chat
