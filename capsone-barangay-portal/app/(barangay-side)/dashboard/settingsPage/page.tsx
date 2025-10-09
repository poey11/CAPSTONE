"use client"
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import "@/CSS/SettingsPage/settingsPage.css";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";


export default function SettingsPage() {
    const router = useRouter();

     const searchParams = useSearchParams();
     const userId = searchParams.get("id")



     
  const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);


     
    const [userData, setUserData] = useState({
        firstName: "",
        lastName: "",
        address: "",
        birthDate: "",
        sex: "",
        phone: "",
        profileImage: "",
        position:"",
        department: "",
        userid: "",
        term: "",
        facebookLink: "",
        email: "",
    });

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {

        const fetchUserData = async () => {
            const docRef = doc(db, "BarangayUsers", userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
               
                setUserData({
                    firstName: docSnap.data().firstName || "User",
                    lastName: docSnap.data().lastName || "User",
                    address: docSnap.data().address || "",
                    birthDate: docSnap.data().birthDate || "",
                    sex: docSnap.data().sex || "",
                    phone: docSnap.data().phone || "",
                    position: docSnap.data().position || "",
                    profileImage: docSnap.data().profileImage || "/Images/user.png",
                    department: docSnap.data().department || "",
                    userid: docSnap.data().userid || "",
                    term: docSnap.data().term || "",
                    facebookLink: docSnap.data().facebookLink || "",
                    email: docSnap.data().email || "",
                });

                setPreview(docSnap.data().fileURL || null);
            }
        };

        fetchUserData();
        }
    }, [userId]);

    const handleBack = () => {
        router.push("/dashboard");
    };

    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    /*
    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && userId) {
            const storage = getStorage();
            const storageRef = ref(storage, `profileImages/${userId}_${file.name}`);
            
            try {
                // Upload the image
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);
                
                // Update Firestore profileImage field with new URL
                const userRef = doc(db, "BarangayUsers", userId);
                await updateDoc(userRef, {
                    profileImage: downloadURL,
                });
    
                // Update local state for instant UI feedback
                setSelectedImage(downloadURL);
                setUserData((prev) => ({
                    ...prev,
                    profileImage: downloadURL,
                }));
    
            } catch (err) {
                console.error("Image upload failed", err);
                setError("Failed to upload image. Please try again.");
            }
        }
    };
    */

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file && userId) {
    const storage = getStorage();
    const storageRef = ref(storage, `profileImages/${userId}_${file.name}`);

    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Set image preview and temp update, but DO NOT save to Firestore yet
      setSelectedImage(downloadURL);
      setUserData((prev) => ({
        ...prev,
        profileImage: downloadURL,
      }));
    } catch (err) {
      console.error("Image upload failed", err);
      setError("Failed to upload image. Please try again.");
    }
  }
};


    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

   
    const [chosenTerm, setChosenTerm] = useState("");
    const [formattedTerm, setFormattedTerm] = useState("");

    useEffect(() => {
        const currentYear = new Date(chosenTerm).getFullYear();
        setFormattedTerm(`${currentYear} - ${currentYear + 3}`);
    }, [chosenTerm]);


    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

          // Prevent form submit popup if user just clicked Upload Image
            if (isUploadingImage) {
                setIsUploadingImage(false); // Reset after click
                return;
            }

        setShowSubmitPopup(true); // Just show the confirmation popup
      };
      


      const confirmSubmit = async () => {
        setShowSubmitPopup(false);
        setLoading(true);
        setError("");
      
        if (!userId) {
          setPopupErrorMessage("User session expired. Please log in again.");
          setShowErrorPopup(true);
          setTimeout(() => setShowErrorPopup(false), 3000);
          setLoading(false);
          return;
        }
      
        const phoneRegex = /^09\d{9}$/;
        if (!phoneRegex.test(userData.phone)) {
            setPopupErrorMessage("Invalid contact number. Format: 0917XXXXXXX");
            setShowErrorPopup(true);
            setTimeout(() => setShowErrorPopup(false), 3000);
          setLoading(false);
          return;
        }
      
        try {
          const docRef = doc(db, "BarangayUsers", userId);
          const docSnap = await getDoc(docRef);
      
          if (docSnap.exists()) {
            const currentData = docSnap.data();
            const isDataChanged = Object.keys(userData).some((key) => {
              const newVal = userData[key as keyof typeof userData]?.toString().trim();
              const currentVal = currentData[key]?.toString().trim();
              return newVal !== currentVal;
            });
      
            if (!isDataChanged) {
                setPopupErrorMessage("No Changes Detected!");
                setShowErrorPopup(true);
                setTimeout(() => setShowErrorPopup(false), 3000);
              setLoading(false);
              return;
            }
          }
      
          await updateDoc(docRef, { ...userData,
            term: formattedTerm
           });
          setPopupMessage("Barangay User Updated Successfully!");
          setShowPopup(true);
      
          setTimeout(() => {
            setShowPopup(false);
            // router.push("/dashboard/ResidentModule");
          }, 3000);
        } catch (err: any) {
          console.error("Error updating profile:", err);
          setError("Failed to update profile. Please try again. " + err.message);
        }
      
        setLoading(false);
      };
      
    

    return (
        <main className="modifyaccsettings-main-container-settings">

            <div className="modifyaccsettings-main-section-settings">

          
                <div className="modifyaccsettings-main-section1-settings">
                    <div className="modifyaccsettings-main-section1-left-settings">
                        <button onClick={handleBack}>   
                            <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn-settings" />
                        </button>
                        <h1>Edit Account Settings</h1>
                    </div>

                    <div className="action-btn-section-settings">
                        <button className="discard-btn-settings" type="button">Discard</button>
                        <button className="save-btn-settings" type="submit" form="settings-form">Save</button>
                    </div>
                </div>

             

                <form  id ="settings-form" onSubmit={handleSubmit}>


                <div className="main-fields-container-settings">


                    <div className="account-details-section-settings">
                        <div className="icon-container-settings">
                        <img
                            src={selectedImage || userData.profileImage || undefined}
                            alt="User Icon"
                            className="user-icon-settings"
                        />

                            <input
                    
                                type="file"
                                accept="image/*"
                                id="fileUpload"
                                style={{ display: "none" }}
                                onChange={handleImageChange}
                            />
                            <button
                                    type="button"
                                    className="upload-btn-settings"
                                    onClick={() => {
                                        document.getElementById("fileUpload")?.click();
                                    }}
                                    >
                                    Upload Image
                                    </button>

                        </div>

                        <div className="main-fields-container-section2-settings">
                            <div className="fields-container-settings">
                                <div className="fields-section-settings">
                                    <p>Official First Name</p>
                                    <input 
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                     className="input-field-settings" 
                                     value={userData.firstName}
                                      onChange={handleChange} 
                                      />
                                </div>
                                
                                <div className="fields-section-settings">
                                    <p>Official Last Name</p>
                                    <input 
                                    id="lastName"
                                    name="lastName"
                                    type="text" 
                                    className="input-field-settings" 
                                    value={userData.lastName } 
                                    onChange={handleChange} />
                                </div>

                                <div className="fields-section-settings">
                                    <p>Address</p>
                                    <input 
                                    id="address"
                                    name="address"
                                    type="text" 
                                    className="input-field-settings"
                                     value={userData.address} 
                                     onChange={handleChange} />
                                </div>
                                <div className="fields-section-settings">
                                    <p>Email</p>
                                    <input 
                                    id="email"
                                    name="email"
                                    type="text" 
                                    className="input-field-settings"
                                     value={userData.email} 
                                     onChange={handleChange} />
                                </div>
                                <div className="fields-section-settings">
                                    <p>Facebook</p>
                                    <input 
                                    id="facebookLink"
                                    name="facebookLink"
                                    type="text" 
                                    className="input-field-settings"
                                     value={userData.facebookLink} 
                                     onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="main-fields-container-section1-settings">
                            <div className="section-left-settings">
                                <div className="fields-container-settings">
                                    <div className="fields-section-settings">
                                        <p>Update Term Duration</p>
                                        <input 
                                        id="chooseTerm"
                                        name="birthDate"
                                        type="date"
                                        min={new Date().toISOString().split("T")[0]}
                                         className="input-field-settings" 
                                         value={chosenTerm} 
                                         onChange={()=>{ 
                                            const input = document.getElementById("chooseTerm") as HTMLInputElement;
                                            setChosenTerm(input.value);
                                         }} />
                                    </div>
                                    <div className="fields-section-settings">
                                        <p>Birthday</p>
                                        <input 
                                        id="birthDate"
                                        name="birthDate"
                                        type="date"
                                         className="input-field-settings" 
                                         value={userData.birthDate} 
                                         onChange={handleChange} />
                                    </div>
                                    <div className="fields-section-settings">
                                        <p>Sex</p>
                                        <select 
                                        id="sex"
                                        name="sex"
                                        className="input-field-settings"  
                                        value={userData.sex} 
                                        onChange={(e) => setUserData({ ...userData, sex: e.target.value })}>

                                            <option value="" disabled>Select gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>

                             <div className="fields-section-settings">
                                    <p>User ID</p>
                                    <input
                                    id="userid"
                                    name="userid"
                                    type="text"
                                    className="input-field-settings"
                                    value={userData.userid}
                                    disabled
                                    />

                                </div>




                            
                                    </div>
                            </div>
                            <div className="section-right-settings">
                                <div className="fields-section-settings">
                                    <p>Current Term</p>
                                    <input
                                    id="term"
                                    name="term"
                                    type="Text"
                                    className="input-field-settings"   
                                    value={userData.term || "N/A"}
                                    readOnly
                                    />

                                </div>
                                <div className="fields-section-settings">
                                    <p>Contact Number</p>
                                    <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    className="input-field-settings"
                                    maxLength={11}
                                    title="Please enter a valid 11-digit contact number"
                                    value={userData.phone}
                                    onChange={handleChange}
                                    />

                                </div>

                                <div className="fields-section-settings">
                                    <p>Position</p>
                                    <input
                                      id="position"
                                      name="position"
                                      type="text" 
                                      className="input-field-settings"
                                      value={userData.position} 
                                      readOnly 
                                      onChange={handleChange} />
                                </div>

                                        {userData.position === "LF Staff" && (

                                        <>
                                        <div className="fields-section-settings">
                                        <p>Department</p>
                                        <input
                                        id="department"
                                        name="department"
                                        type="text" 
                                        className="input-field-settings"
                                        value={userData.department} 
                                        readOnly 
                                        onChange={handleChange} />
                                        </div>
                                        </>
                                        )}



                            </div>
                
                        </div>
                    </div>

                </div>
            </form>
                
            </div>


            {showSubmitPopup && (
                        <div className="confirmation-popup-overlay-add">
                            <div className="confirmation-popup-add">
                                <p>Are you sure you want to submit?</p>
                                <div className="yesno-container-add">
                                    <button onClick={() => setShowSubmitPopup(false)} className="no-button-add">No</button>
                                    <button onClick={confirmSubmit} className="yes-button-add">Yes</button> 
                                </div> 
                            </div>
                        </div>
        )}

        {showPopup && (
                <div className={`popup-overlay-add show`}>
                    <div className="popup-add">
                      <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                      <p>{popupMessage}</p>
                    </div>
                </div>
                )}

        {showErrorPopup && (
                <div className={`error-popup-overlay-add show`}>
                    <div className="popup-add">
                      <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                      <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}

        </main>
    );
}
