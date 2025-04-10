import { useState } from "react";



interface HearingFormProps {
    date?: string;
    forField?: string;
    time?: string;
    minutesOfHearing?: string;
    remarks?: string;
    parties?: string;
    nosHearing?: number;
}

const HearingForm: React.FC<HearingFormProps> = ({date,forField,time,minutesOfHearing,remarks,parties, nosHearing}) => {
    const [showHearingContent, setShowHearingContent] = useState(false); // Initially hidden
    const toggleHearingContent = () => setShowHearingContent(prev => !prev);
    const [details, setDetails] = useState({
        date: date || "",
        forField: forField || "",
        time: time || "",
        minutesOfHearing: minutesOfHearing || "",
        remarks: remarks || "",
        parties: parties || "",
    }); 
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
                                <input type="date" className="search-bar-edit" placeholder="Enter Date" />
                            </div>
                            <div className="input-group-edit">
                                <p>For</p>
                                <input type="text" className="search-bar-edit" placeholder="Enter For" />
                            </div>
                            <div className="input-group-edit">
                                <p>Time</p>
                                <input type="time" className="search-bar-edit" placeholder="Enter Time" />
                            </div>
                        </div>
                    </div>
                    <div className="section-3-dialouge-edit">
                        <div className="fields-section-edit">
                            <p>Minutes of Hearing</p>
                            <textarea className="description-edit" placeholder="Enter Minutes of Hearing" rows={13}></textarea>
                        </div>
                    </div>
                    <div className="section-4-dialouge-edit">
                        <div className="fields-section-edit">
                            <p>Party A</p>
                            <textarea className="description-edit" placeholder="Enter Remarks" rows={10}></textarea>
                        </div>
                        <div className="fields-section-edit">
                            <p>Party B</p>
                            <textarea className="description-edit" placeholder="Enter Parties" rows={10}></textarea>
                        </div>
                    </div>

                    <div className="section-4-dialouge-edit">
                        <div className="fields-section-edit">
                            <p>Remarks</p>
                            <textarea className="description-edit" placeholder="Enter Remarks" rows={10}></textarea>
                        </div>
                        <div className="fields-section-edit">
                            <p>Hearing Officer</p>
                            <input type="text" className="description-edit" placeholder=""/>
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