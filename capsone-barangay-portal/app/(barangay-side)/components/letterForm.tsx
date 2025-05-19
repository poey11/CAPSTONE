import { useState } from "react"

interface LetterFormProps {
    DateOfDelivery: string,
    DateTimeOfMeeting: string,
    LuponStaff: string,
    DateFiled: string,
    hearingNumber:number,
}

const letterForm: React.FC<LetterFormProps> = ({DateOfDelivery,DateTimeOfMeeting,LuponStaff,DateFiled,hearingNumber}) => {
    const [hearing, setHearing] = useState<string>("")
    
    if(hearingNumber === 0){
        setHearing("First")
    }else if(hearingNumber === 1){
        setHearing("Second")
    }
    else if(hearingNumber === 2){
        setHearing("Third")
    }

    

return(<>
    <main className="main-container">
        <div className="main-content">
            <div className="section-1">
                <p className="NewOfficial">Summon Letter ({hearing} Hearing)</p> : <p className="NewOfficial">Dialouge Letter</p>

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
                            <select className="search-bar" 
                            value={LuponStaff}
                            id="LuponStaff"
                            name="LuponStaff"
                            disabled
                            >
                                {/* <option value="">Select Official/Kagawad</option>
                                {listOfStaffs.map((staff, index) => (
                                    <option key={index} value={`${staff.firstName} ${staff.lastName}`}>
                                        {staff.firstName} {staff.lastName}
                                    </option>
                                ))} */}
                            </select>
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

                    // <div className="section-4">
                    //     {(generatedHearingSummons < 3 && actionId==="summon") && ( <button className="letter-announcement-btn" type="submit" name="print" >Print</button>)}
                    //     {(!isDialogue && actionId==="dialogue") && ( <button className="letter-announcement-btn" type="submit" name="print" >Print</button>)}
                    //     <button className="letter-announcement-btn" type="submit" name="sendSMS">Send SMS</button> {/*Add condition when the users presses the button will be disabled (once for dialogue and 3 times for summons before disabling) */}
                    // </div>
export default letterForm;