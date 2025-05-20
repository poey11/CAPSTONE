import { useEffect, useState } from "react"

interface LetterFormProps {
    DateOfDelivery: string,
    DateTimeOfMeeting: string,
    LuponStaff: string,
    DateFiled: string,
    hearingNumber:number,
}

const letterForm: React.FC<LetterFormProps> = ({DateOfDelivery,DateTimeOfMeeting,LuponStaff,DateFiled,hearingNumber}) => {
    const [hearing, setHearing] = useState<string>("")
    useEffect(() => {
        if(hearingNumber === 1){
            setHearing("First")
        }else if(hearingNumber === 2){
            setHearing("Second")
        }
        else if(hearingNumber === 3){
            setHearing("Third")
        }   
    },[hearingNumber])



return(<>
    <main className="main-container">
        <div className="main-content">
            <div className="section-1">
                <p className="NewOfficial">Summon Letter ({hearing} Hearing)</p>

             </div>

             <form>
              <div className="section-3">
                <p className="title">Other Information</p>

                    <div className="bars">
                        <div className="input-group">
                            <p>Date of Delivery</p>
                            <input type="date" className="search-bar" placeholder="Enter Date of Delivery" 
                            value={DateOfDelivery}
                            id="DateOfDelivery"
                            name="DateOfDelivery"
                            onKeyDown={(e) => e.preventDefault()}
                            disabled
                           
                            />
                        </div>
                        
                        <div className="input-group">
                            <p>Date and Time of Meeting</p>
                            <input type="datetime-local" className="search-bar" 
                            value={DateTimeOfMeeting}
                            onKeyDown={(e) => e.preventDefault()}
                            id="DateTimeOfMeeting"
                            name="DateTimeOfMeeting"
                            disabled
                            />
                            
                        </div>

                    </div>

                    <div className="bars">
                        <div className="input-group">
                            {/* change into drop box */}
                            <p>Delivered By</p>
                            <input type="text" className="search-bar" 
                            value={LuponStaff}
                            id="LuponStaff"
                            name="LuponStaff"
                            disabled
                            />
                        </div>

                        <div className="input-group">
                            <p>Date Filed</p>
                            <input type="date" className="search-bar" 
                            value={DateFiled}
                            id="DateFiled"
                            name="DateFiled"
                            onKeyDown={(e) => e.preventDefault()}
                            
                            disabled
                            />
                        </div>
                    </div>
                    
            </div>
           </form>

        </div> 
       
       
    </main>


</>)

}

export default letterForm;