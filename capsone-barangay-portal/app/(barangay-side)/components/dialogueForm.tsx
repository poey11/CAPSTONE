
import { useState } from "react";


interface HearingFormProps {
    date?: string;
    forField?: string;
    time?: string;
    minutesOfHearing?: string;
    remarks?: string;
    parties?: string;
}


const dialogueForm: React.FC<HearingFormProps> = ({date,forField,time,minutesOfHearing,remarks,parties}) => {
    const [showDialogueContent, setShowDialogueContent] = useState(false); // Initially hidden
    const [showHearingContent, setShowHearingContent] = useState(false); // Initially hidden
    const toggleHearingContent = () => setShowHearingContent(prev => !prev);


    const handleToggleClick = () => {
        setShowDialogueContent(prevState => !prevState); // Toggle visibility
    };

    return (
        <>
            <div className="dialouge-meeting-section-edit">    
                <div className="title-section-edit">
                  <button type="button" className={showDialogueContent ? "record-details-minus-button" : "record-details-plus-button"}  onClick={handleToggleClick}></button>
                  <h1>Dialogue Meeting</h1>
                </div>
          
            <hr/>
          
            {showDialogueContent && (
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
                                  <p>Minutes of Dialogue</p>
                                  <textarea className="description-edit" placeholder="Enter Minutes of Dialogue" rows={13}></textarea>
                              </div>
                          </div>
                
                          <div className="section-4-dialouge-edit">
                              <div className="fields-section-edit">
                                  <p>Party A</p>
                                  <textarea className="description-edit" placeholder="Enter Party" rows={10}></textarea>
                              </div>
                              <div className="fields-section-edit">
                                  <p>Party B</p>
                                  <textarea className="description-edit" placeholder="Enter Party" rows={10}></textarea>
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

export default dialogueForm;