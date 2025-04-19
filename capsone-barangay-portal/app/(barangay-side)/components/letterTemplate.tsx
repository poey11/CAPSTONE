import { useSearchParams } from "next/navigation";
import { useState } from "react";
import "@/CSS/IncidentModule/Letters.css";


interface OtherInfo {
    index: number;
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

const letterTemplate: React.FC<OtherInfo> = ({ 
    index,
    complainant,
    respondent,
    DateFiled,
    DateOfDelivery,
    DateOfMeeting,
    LuponStaff}) => {
    const searchParam = useSearchParams();
    const docId = searchParam.get("id")?.split("?")[0];
    const actionId = searchParam.get("id")?.split("?")[1].split("=")[1];
    let nos ="";
    switch (index) {
        case 0:
            nos = "Third";
            break;
        case 1:
            nos = "Second";
            break;
        case 2:
            nos = "First";
            break;
        default:
            break;
    }

    return (
        <main className="main-container">
            <div className="main-content">
            <div className="section-1">
                {actionId === "summon" ? <p className="NewOfficial">{nos} Summon Letter</p> : <p className="NewOfficial">Past Generated Dialouge Letter</p>}
            
            </div>

            <div className="section-2">

                <div className="section-2-left-side">

                    <p >Complainant's Information</p>
                    <p>Name</p>

                    <input 
                        type="text" 
                        className="search-bar" 
                        placeholder={complainant.fname}
                        value={complainant.fname}
                        id="complainant.fname"
                        name="complainant.fname"
                        disabled
                    />

                    <p>Address</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder= {complainant.address}
                    value={complainant.address}
                    id="complainant.address"
                    name="complainant.address"
                    disabled
                    />

                    <p>Contact Nos</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder= {complainant.contact}
                    value={complainant.contact}
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
                    placeholder={respondent.fname}
                    value={respondent.fname}
                    id="respondent.fname"
                    name="respondent.fname"
                    disabled
                    />

                    <p>Address</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder= {respondent.address}
                    value={respondent.address}
                    id="respondent.address"
                    name="respondent.address"
                    disabled
                    />


                    <p>Contact Nos</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder= {respondent.contact}
                    value={respondent.contact}
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
                            value={DateOfDelivery}
                            id="DateOfDelivery"
                            name="DateOfDelivery"
                            disabled
                            />
                        </div>

                        <div className="input-group">
                            <p>Date and Time of Meeting</p>
                            <input  type="text" className="search-bar" placeholder="Enter Date of Meeting" 
                            value={DateOfMeeting}
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
                            value={LuponStaff}
                            id="LuponStaff"
                            name="LuponStaff"
                            disabled
                            />
                        </div>

                        <div className="input-group">
                            <p>Date Filed</p>
                            <input  type="text" className="search-bar" placeholder="Choose hearing number" 
                            value={DateFiled}
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