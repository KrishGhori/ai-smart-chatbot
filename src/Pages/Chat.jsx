import { useContext } from 'react'
import { useNavigate } from "react-router-dom";
import { DataContext, prevuse } from '../UserContext/store';
import { MdOutlineUploadFile } from "react-icons/md";


const renderStructuredAnswer = (text) => {
  if (!text) return null;

  const lines = String(text)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks = [];
  let currentList = [];

  const flushList = () => {
    if (!currentList.length) return;
    blocks.push(
      <ul className="ai-list" key={`list-${blocks.length}`}>
        {currentList.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    );
    currentList = [];
  };

  lines.forEach((line) => {
    const cleanedLine = line.replace(/^\*\s+|^[-•]\s+|^\d+[.)]\s+/, "").trim();
    const isListItem = /^(\*|[-•]|\d+[.)])\s+/.test(line);
    const isHeading = /^[A-Z][A-Za-z\s-]{0,40}:$/.test(cleanedLine);

    if (isListItem) {
      currentList.push(cleanedLine);
      return;
    }

    flushList();

    blocks.push(
      isHeading
        ? <h4 className="ai-heading" key={`heading-${blocks.length}`}>{cleanedLine.replace(/:$/, "")}</h4>
        : <p key={`para-${blocks.length}`}>{line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1")}</p>
    );
  });

  flushList();

  return <div className="ai-content">{blocks}</div>;
};

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

        {feature === "Generate Image" ? (
          <>
            {!genimgurl ? (
              <span>Generating image...</span>
            ) : (
              <>
                <img className='gen_img' src={genimgurl} alt="generated result" />
                <span className='user-s'>{inp}</span>
              </>
            )}
          </>
        ) : (
          <>
            {!resultAI ? (
              <div>please,Try again later!!</div>
            ) : (
              renderStructuredAnswer(resultAI)
            )}
          </>
        )}

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


