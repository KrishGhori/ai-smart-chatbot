import "../App.css"
import { MdOutlineUploadFile, MdOutlineImage } from "react-icons/md";
import { CiChat1 } from "react-icons/ci";
import { GoPlus } from "react-icons/go";
import { CiLocationArrow1 } from "react-icons/ci";
import Chat from './Chat';
import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { use } from "../UserContext/store";
import { DataContext, prevuse } from "../UserContext/store";
import { generateResponse } from "../Gemini";
import { generatimage } from "../generateImage";


const Home = () => {
   
    const {popup , setpopup , inp , setinp , feature , setfeature  , setresultAI  , setgenimgurl} = useContext(DataContext) ;

    const navigate = useNavigate();
    const [generating, setGenerating] = useState(false);

    const handlehomenavigation = ()=>{
        navigate("/")
    }
    
    const handlegenerateimg = async ()=> {
            if (generating) return;
            if(!inp || !inp.trim()){
                setresultAI("Please enter a prompt to generate an image.");
                return;
            }
            setGenerating(true);
            // keep prompt for Chat page
            prevuse.prompt = inp;
            setresultAI("Generating image...");
            navigate('/chat');
            setgenimgurl("");
            try {
                const result = await generatimage(inp);
                let imgSrc = null;
                let message = null;

                if (result instanceof Blob) {
                    imgSrc = URL.createObjectURL(result);
                } else if (typeof result === 'string') {
                    imgSrc = result;
                } else if (result && typeof result === 'object' && result.src) {
                    imgSrc = result.src;
                    message = result.message;
                } else {
                    setresultAI('Failed to generate image');
                    return;
                }

                setgenimgurl(imgSrc);

                if (message) {
                    setresultAI(message);
                } else if (typeof imgSrc === 'string' && imgSrc.length < 200) {
                    setresultAI('No Gemini API key configured — showing placeholder image.');
                } else {
                    setresultAI('');
                }
            } catch (err) {
                console.error(err);
                setresultAI(`Error: ${err.message}`);
            } finally {
                setGenerating(false);
            }
            // keep `inp` so Chat can display the prompt
    }

    const handleSubmit = async (e) => {

        e.preventDefault();
        

        prevuse.data = use.data;
        prevuse.mime_type = use.mime_type;
        prevuse.imgUrl = use.imgUrl;
        prevuse.prompt = inp;

        // Provide immediate feedback and call API
        setresultAI("Thinking...");
        try {
            const result = await generateResponse();
            setresultAI(result);
            navigate('/chat');
        } catch (error) {
            console.error(error);
            setresultAI(`Error: ${error.message || 'Failed to get response'}`);
            navigate('/chat');
        }
    }

    const handleimage = (e) => {
        const file = e.target.files[0]
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            // store on temporary `use` object
            use.data = base64;
            use.mime_type = file.type;
            use.imgUrl = base64;

            // also store immediately on `prevuse` so other pages can read it
            prevuse.data = base64;
            prevuse.mime_type = file.type;
            prevuse.imgUrl = base64;
        };
        reader.readAsDataURL(file);
    }

    
  return (
    <div className='home'>
        
        <nav>
            <div className='logo' onClick={handlehomenavigation} title="logo">
                Smart AI😎BOT
            </div>
        </nav>
    <input type="file" accept="image/*" id="input" hidden onChange={handleimage}/>
     <div className='hero'>
            <span className='main_para' title="para">What can I help with?</span>
            <div className='cate'>
               <div onClick={()=>{
                setfeature("Upload Image")
                 document.getElementById("input").click()
                
               }
               }>
                <span  className='U1' title="Upload Image" >
                    <MdOutlineUploadFile />
                    Upload Image</span>
                </div>
                <div onClick={async () => {   
                        setpopup(false);
                        setfeature("Generate Image");
                        // if a prompt already exists, generate immediately
                        if (inp && inp.trim() && !generating) {
                            await handlegenerateimg();
                        }
                    }}><span className='G1' title="Generate Image">
                    <MdOutlineImage />
                    Generate Image</span></div> 
                <div onClick={()=>{
                    setpopup(false)
                    setfeature("Let's Chat")
                }}><span className='L1' title="Let's Chat">
                    <CiChat1 />
                    Let's Chat</span></div>
            </div>
        </div> 
        
        
        
        
        <form className='add' onSubmit= {(e)=>{
            e.preventDefault()
            if(inp){
                if(feature== "Generate Image"){
                    handlegenerateimg()
                }
                else{
                    handleSubmit(e)
                }
            }
        }}>  
        
        {feature== "Upload Image" ? <img src={use.imgUrl} className="img" alt="" /> : null}
            
            {popup ? 
            <div className="plies">
                <div className="pop-up" title="Upload Image" onClick={()=>{
                    setpopup(false)
                    setfeature("Upload Image")
                    document.getElementById("input").click()}}>
                        <MdOutlineUploadFile /></div>
                <div className="pop-gen" title="Generate Image" onClick={()=> setfeature("Generate Image")}>
                    <MdOutlineImage /></div>
            </div> 
            : 
            null
            }
            

            <div className='plues' title="upload-button" onClick={()=>{
                setpopup(prev => !prev)
            }}>
             
             {feature== "Generate Image" ? <MdOutlineImage /> : <GoPlus></GoPlus>}
             
            </div>
            <input type="text" title="input" className = "input" onChange={(e)=>setinp(e.target.value)} value={inp} placeholder='Ask Something...' />

            {inp ? <button type="submit" title="submit" className='submit' disabled={generating}>
                {generating ? '...' : <CiLocationArrow1 />}
            </button>
            :
            null}
            
        </form>

    </div>
  )
}

export default Home