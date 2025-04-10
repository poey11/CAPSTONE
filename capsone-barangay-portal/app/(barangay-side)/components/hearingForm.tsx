import { getLocalDateString } from "@/app/helpers/helpers";
import { useState } from "react";



interface HearingFormProps {
    date?: string;
    forField?: string;
    time?: string;
    minutesOfHearing?: string;
    remarks?: string;
    parties?: string;
    nosHearing?: number;
    isHearing?: boolean;
}
const HearingForm: React.FC<HearingFormProps> = ({date,forField,time,minutesOfHearing,remarks,parties, nosHearing, isHearing}) => {
    const [showHearingContent, setShowHearingContent] = useState(false); // Initially hidden
    const toggleHearingContent = () => setShowHearingContent(prev => !prev);
    const today = getLocalDateString(new Date());
    const [details, setDetails] = useState({
        date: "",
        forField: "",
        time: "",
        minutesOfHearing: "",
        remarks: "",
        partyA: "",
        partyB: "",
        hearingOfficer: "",
    }); 
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDetails(prevDetails => ({
            ...prevDetails,
            [name]: value,
        }));
    }
    let nos ="";
    switch (nosHearing) {
        case 0:
            nos = "First";
            break;
        case 1:
            nos = "Second";
            break;
        case 2:
            nos = "Third";
            break;
        default:
            break;
    }
  

    return (
        <>
            <div className="hearing-section-edit">    
                <div className="title-section-edit">
                    <button type="button" className={showHearingContent ? "record-details-minus-button" : "record-details-plus-button"}  onClick={toggleHearingContent}></button>
                <h1>{nos} Hearing Section</h1>
            </div>
            <hr/>
            {showHearingContent && (
                <>
                <form>
                  <div className="section-2-dialouge-edit">
                      <p>Complainant's Information</p>
                      <div className="bars-edit">
                          <div className="input-group-edit">
                                <p>Date</p>
                                <input type="date" 
                                className="search-bar-edit"
                                max={today} 
                                onKeyDown={(e => e.preventDefault())}
                                name="date"
                                id="date"
                                value={details.date||""}
                                onChange={handleChange}
                                />
                          </div>
                          <div className="input-group-edit">
                                <p>For</p>
                                <input type="text" 
                                className="search-bar-edit" 
                                name="forField"
                                id="forField"
                                value={details.forField||""}
                                onChange={handleChange}
                                placeholder="Enter For" />
                          </div>
                          <div className="input-group-edit">
                                <p>Time</p>
                                <input type="time" 
                                className="search-bar-edit" 
                                name="time"
                                id="time"
                                value={details.time||""}
                                onChange={handleChange}
                                placeholder="Enter Time" />
                          </div>
                      </div>
                  </div>
        
                  <div className="section-3-dialouge-edit">
                      <div className="fields-section-edit">
                            <p>Minutes of Hearing</p>
                            <textarea className="description-edit" 
                            placeholder="Enter Minutes of Hearing" 
                            name="minutesOfHearing"
                            id="minutesOfHearing"
                            value={details.minutesOfHearing||""}
                            onChange={handleChange}
                            rows={13}/>
                      </div>
                  </div>
        
                  <div className="section-4-dialouge-edit">
                      <div className="fields-section-edit">
                            <p>Party A</p>
                            <textarea className="description-edit" 
                            placeholder="Enter Party A" 
                            name="partyA"
                            id="partyA"
                            value={details.partyA||""}
                            onChange={handleChange}
                            rows={10}/>
                      </div>
                      <div className="fields-section-edit">
                            <p>Party B</p>
                            <textarea className="description-edit" 
                            placeholder="Enter Party"
                            id="partyB"
                            name="partyB"
                            value={details.partyB||""}
                            onChange={handleChange}
                            rows={10}/>
                      </div>

                  </div>
                  <div className="section-4-dialouge-edit">
                      <div className="fields-section-edit">
                            <p>Remarks</p>
                            <textarea className="description-edit" 
                            name="remarks"
                            id="remarks"
                            value={details.remarks||""}
                            onChange={handleChange}
                            placeholder="Enter Remarks" 
                            rows={10}/>
                      </div>
                      <div className="fields-section-edit">
                            <p>Hearing Officer</p>
                            <input type="text" 
                            name="hearingOfficer"
                            id="hearingOfficer"
                            value={details.hearingOfficer||""}
                            onChange={handleChange}
                            className="description-edit" 
                            placeholder="Enter Hearing Officer"/>
                      </div>

                  </div>
                  <div className="flex justify-center items-center mt-10">
                        <button type="submit" className="action-view-edit">Save</button>   
                  </div>
                </form>
            </>
            )}
            </div>


        </>
    )
}

export default HearingForm;