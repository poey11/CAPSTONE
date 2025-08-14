"use client";
import "@/CSS/ProgramsBrgy/ParticipantsLists.css";
import { useState } from "react";
import { useRouter } from "next/navigation";


export default function EditResident() {


     const router = useRouter();

    const [activeSection, setActiveSection] = useState("details");
    const [showDiscardPopup, setShowDiscardPopup] = useState(false);
    const [position, setPosition] = useState("");
    const [identificationFile, setIdentificationFile] = useState<File | null>(null);
    const [identificationPreview, setIdentificationPreview] = useState<string | null>(null);
      const [showRejectPopup, setShowRejectPopup] = useState(false); 
  const [loading, setLoading] = useState(false); 



  const [showSubmitRejectPopup, setShowSubmitRejectPopup] = useState(false); 
      const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");

    const handleBack = () => {
      window.location.href = "/dashboard/ProgramsModule/ProgramsAndEvents";
    };

    const handleDiscardClick = async () => {
        setShowDiscardPopup(true);
    }



      const handleRejectClick = () => {
    setShowRejectPopup(true); 
  };

    const handleIdentificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setIdentificationFile(file);
        setIdentificationPreview(URL.createObjectURL(file));
    }

};


   const handleParticipantsClick = () => {
    router.push("/dashboard/ProgramsModule/ProgramsAndEvents/ParticipantsLists");
  };

  const handleEditClick = () => {
    router.push("/dashboard/ProgramsModule/ProgramsAndEvents/ProgramDetails");
  };

  

// Dummy data
const dummyParticipants = [
  { name: "Juan Dela Cruz", contact: "0917-123-4567", email: "juan@email.com", location: "Quezon City" },
  { name: "Maria Santos", contact: "0918-987-6543", email: "maria@email.com", location: "Manila" },
  { name: "Pedro Pascual", contact: "0917-555-1234", email: "pedro@email.com", location: "Cebu City" },
  { name: "Ana Lopez", contact: "0919-333-6789", email: "ana@email.com", location: "Davao City" },
  { name: "Carlos Reyes", contact: "0917-987-2222", email: "carlos@email.com", location: "Baguio City" },
  { name: "Luisa Fernandez", contact: "0918-765-9876", email: "luisa@email.com", location: "Iloilo City" },
  { name: "Miguel Cruz", contact: "0917-555-7890", email: "miguel@email.com", location: "Makati" },
  { name: "Sophia Martinez", contact: "0919-888-1111", email: "sophia@email.com", location: "Taguig" },
  { name: "Daniel Ortega", contact: "0917-444-9999", email: "daniel@email.com", location: "Pasig City" },
  { name: "Isabella Gutierrez", contact: "0918-321-5432", email: "isabella@email.com", location: "Cavite" }
];


    return (
        <main className="edit-program-main-container" >



        
           







            <div className="program-redirectionpage-section">



                {/*
                    MAIN REDIRECTION BUTTONS.
                
                    Will only be shown if  na approve na ni punong banargay yung requested na program or
                    if si assistant nag create ng program.
                */}

               <button className="program-redirection-buttons" onClick={handleEditClick}>
                        <div className="program-redirection-icons-section">
                            <img src="/images/profile-user.png" alt="user info" className="program-redirection-icons-info" />
                             </div>
                         <h1>Program Details</h1>
                </button>


                <button className="program-redirection-buttons-selected" onClick={handleParticipantsClick }>
                        <div className="program-redirection-icons-section">
                            <img src="/images/team.png" alt="user info" className="program-redirection-icons-info"/> 
                             </div>
                         <h1>Partcipants</h1>
                </button>








                {/*
                
                   NOTE:
                   1. Buttons for punong barangay only if a new button was suggested.
                   2. Hide mo nalang je if need mo na
              


                   <button className="program-redirection-buttons" onClick={handleRejectClick}>
                        <div className="program-redirection-icons-section" >
                             <img src="/images/rejected.png" alt="user info" className="program-redirection-icons-info" />
                             </div>
                         <h1>Reject Request</h1>
                    </button>



                <button className="program-redirection-buttons">
                        <div className="program-redirection-icons-section">
                            <img src="/images/generatedoc.png" alt="user info" className="program-redirection-icons-info" />
                             </div>
                         <h1>Approve Request</h1>
                </button>

            */}







            </div>

            <div className="edit-program-main-content-participants">
              <div className="edit-program-main-section1">
                    <div className="edit-program-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                            </button>

                            <h1> Participants Lists </h1>
                    </div>

                <div className="action-btn-section-program">
                    <div className="participants-count">
                        20 / 50 
                    </div>

                 </div>


                </div>


                <div className="edit-program-bottom-section-participants">
                  
                    <div className="participants-container">
                      <table className="participants-table">
                        <thead>
                          <tr>
                            <th>Full Name</th>
                            <th>Contact Number</th>
                            <th>Email Address</th>
                            <th>Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dummyParticipants.map((participant, index) => (
                            <tr key={index}>
                              <td>{participant.name}</td>
                              <td>{participant.contact}</td>
                              <td>{participant.email}</td>
                              <td>{participant.location}</td>
                            </tr>
                          ))}
                        </tbody>

                      </table>
                    </div>



                </div>

                

            </div>



        </main>
    );
}

