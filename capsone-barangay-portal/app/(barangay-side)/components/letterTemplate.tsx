import { useSearchParams } from "next/navigation";
import { useState } from "react";
import "@/CSS/IncidentModule/Letters.css";



interface OtherInfo {
    complainant: {
        fname: string;
        address: string;
        contact: string;
    };
    respondent: {
        fname: string;
        address: string;
        contact: string;
    };
    DateOfDelivery: string;
    DateOfMeeting: string;
    LuponStaff: string;
    DateFiled: string;
}

const letterTemplate: React.FC = () => {
    const searchParam = useSearchParams();
    const docId = searchParam.get("id")?.split("?")[0];
    const actionId = searchParam.get("id")?.split("?")[1].split("=")[1];
    const [otherInfo, setOtherInfo] = useState<OtherInfo>({
        complainant: {
            fname: "",
            address: "",
            contact: ""
        },
        respondent: {
            fname: "",
            address: "",
            contact: ""
        },
        DateOfDelivery: "",
        DateOfMeeting: "",
        LuponStaff: "",
        DateFiled: ""
    });

    return (
        <main className="main-container">
            <div className="main-content">
            <div className="section-1">
                {actionId === "summon" ? <p className="NewOfficial">Past Generated Summon Letter</p> : <p className="NewOfficial">Past Generated Dialouge Letter</p>}
            
            </div>

            <div className="section-2">

                <div className="section-2-left-side">

                    <p >Complainant's Information</p>
                    <p>Name</p>

                    <input 
                        type="text" 
                        className="search-bar" 
                        placeholder={otherInfo.complainant.fname}
                        value={otherInfo.complainant.fname}
                        id="complainant.fname"
                        name="complainant.fname"
                        disabled
                    />

                    <p>Address</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder= {otherInfo.complainant.address}
                    value={otherInfo.complainant.address}
                    id="complainant.address"
                    name="complainant.address"
                    disabled
                    />

                    <p>Contact Nos</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder= {otherInfo.complainant.contact}
                    value={otherInfo.complainant.contact}
                    id="complainant.contact"
                    name="complainant.contact"
                    disabled
                    />

                </div>

                <div className="section-2-right-side">

                    <p>Respondent's Information</p>

                    <p>Name</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder={otherInfo.respondent.fname}
                    value={otherInfo.respondent.fname}
                    id="respondent.fname"
                    name="respondent.fname"
                    disabled
                    />

                    <p>Address</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder= {otherInfo.respondent.address}
                    value={otherInfo.respondent.address}
                    id="respondent.address"
                    name="respondent.address"
                    disabled
                    />


                    <p>Contact Nos</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder= {otherInfo.respondent.contact}
                    value={otherInfo.respondent.contact}
                    id="respondent.contact"
                    name="respondent.contact"
                    disabled
                    />
                </div>
            </div>


              <div className="section-3">
                <p className="title">Other Information</p>

                    <div className="bars">
                        <div className="input-group">
                            <p>Date of Delivery</p>
                            <input type="text" className="search-bar" placeholder="Enter Date of Delivery" 
                            value={otherInfo.DateOfDelivery}
                            id="DateOfDelivery"
                            name="DateOfDelivery"
                            disabled
                            />
                        </div>

                        <div className="input-group">
                            <p>Date and Time of Meeting</p>
                            <input  type="text" className="search-bar" placeholder="Enter Date of Meeting" 
                            value={otherInfo.DateOfMeeting}
                            id="DateOfMeeting"
                            name="DateOfMeeting"
                            disabled
                            />

                        </div>

                    </div>

                    <div className="bars">
                        <div className="input-group">
                            {/* change into drop box */}
                            <p>Delivered By</p>
                            <input type="text" className="search-bar" placeholder="Enter Name of Lupon Staff" 
                            value={otherInfo.LuponStaff}
                            id="LuponStaff"
                            name="LuponStaff"
                            disabled
                            />
                        </div>

                        <div className="input-group">
                            <p>Date Filed</p>
                            <input  type="text" className="search-bar" placeholder="Choose hearing number" 
                            value={otherInfo.DateFiled}
                            id="DateFiled"
                            name="DateFiled"
                            disabled
                            />
                        </div>
                    </div>
            </div>

            </div> 
        </main>
    )

}

export default letterTemplate;