"use client"

import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import { useState } from "react";
import "@/CSS/barangaySide/ServicesModule/BarangayDocs/BarangayCertificate.css";




const metadata:Metadata = { 
  title: "Edit Barangay Certificate Request Barangay Side",
  description: "Edit Barangay Certificate Request Barangay Side",
};


export default function EditInBarangayRequest() {
    const router = useRouter();
    const handleBack = () => {
        router.push("/dashboard/ServicesModule/InBarangayRequests");
    };

    const [files, setFiles] = useState<{ [key: string]: { name: string, preview: string | undefined }[] }>({
        container1: [],
    });

    const handleFileChange = (container: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (selectedFiles) {
            const fileArray = Array.from(selectedFiles).map((file) => {
                const preview = URL.createObjectURL(file);
                return { name: file.name, preview };
            });
            setFiles((prevFiles) => ({
                ...prevFiles,
                [container]: [...prevFiles[container], ...fileArray],
            }));
        }
    };

    const handleFileDelete = (container: string, fileName: string) => {
        setFiles((prevFiles) => ({
            ...prevFiles,
            [container]: prevFiles[container].filter((file) => file.name !== fileName),
        }));
    };

    const requestData = [
        {
            documentType: "Barangay Certificate",
            purpose: "Death Residency",
            daterequested: "2024-01-17",
            residentsince: "2002-01-14",
            firstname: "Rose",
            middlename: "Yap",
            lastname: "Fernandez",
            address: "Calamba, Laguna",
            age: "23",
            civilstatus: "Single",
            citizenship: "Filipino",
            birthday: "2002-09-06",
            gender: "Female",
            contact: "09171218101",
            status: "In Progress",
            requirements: "/Images/document.png",
        },
    ];

    const residentData = requestData[0] as Record<string, string>;
    const [showDiscardPopup, setShowDiscardPopup] = useState(false);
    const [showSavePopup, setShowSavePopup] = useState(false); 
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");

    const handleDiscardClick = async () => {
        setShowDiscardPopup(true);
    }

    const confirmDiscard = async () => {
        setShowDiscardPopup(false);

        setPopupMessage("Changes discarded successfully!");
                setShowPopup(true);

                // Hide the popup after 3 seconds
                setTimeout(() => {
                    setShowPopup(false);
                }, 3000);
    };

    const handleSaveClick = async () => {
        setShowSavePopup(true);
    }

    const confirmSave = async () => {
        setShowSavePopup(false);

                setPopupMessage("Changes saved successfully!");
                setShowPopup(true);

                // Hide the popup after 3 seconds
                setTimeout(() => {
                    setShowPopup(false);
                }, 3000);
    };

    return (
        <main className="addAnnouncement-main-container">
            <div className="section-1">
                <h1>Barangay Certificate In Barangay Request</h1>
            </div>

            <div className="addAnnouncement-main-section">
                <div className="addAnnouncement-main-section1">
                    <div className="addAnnouncement-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn" />
                        </button>

                        <h1>Barangay Certificate</h1>
                    </div>

                    <div className="action-btn-section">
                        <button className="discard-btn" onClick={handleDiscardClick}>Discard</button>
                        <button className="save-btn" onClick={handleSaveClick}>Save</button>
                    </div>

                    {showDiscardPopup && (
                        <div className="confirmation-popup-overlay">
                            <div className="confirmation-popup">
                                <p>Are you sure you want to discard the changes?</p>
                                <div className="yesno-container">
                                    <button onClick={() => setShowDiscardPopup(false)} className="no-button">No</button>
                                    <button onClick={confirmDiscard} className="yes-button">Yes</button> {/* need to change yung on click. mawawala yung new input and babalik sa original data.*/}
                                </div> 
                            </div>
                        </div>
                    )}

                    {showSavePopup && (
                        <div className="confirmation-popup-overlay">
                            <div className="confirmation-popup">
                                <p>Are you sure you want to save the changes?</p>
                                <div className="yesno-container">
                                    <button onClick={() => setShowSavePopup(false)} className="no-button">No</button> {/* need to change yung on click. mawawala yung new input and babalik sa original data.*/}
                                    <button onClick={confirmSave} className="yes-button">Yes</button> 
                                </div> 
                            </div>
                        </div>
                    )}

                    {showPopup && (
                        <div className={`popup-overlay show`}>
                            <div className="popup">
                                <p>{popupMessage}</p>
                            </div>
                        </div>
                    )}
                </div>

                <hr/>

                <div className="main-fields-container">
                    <div className="main-fields-container-section1">
                        <div className="section-left">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Purpose</p>
                                    <select
                                        id="clearancePurpose"
                                        name="clearancePurpose"
                                        className="input-field"
                                        required
                                        defaultValue={residentData.purpose}
                                    >
                                        <option value="" disabled>Select purpose</option>
                                        <option value="Occupancy/Moving Out">Occupancy / Moving Out</option>
                                        <option value="Estate Tax">Estate Tax</option>
                                        <option value="Death Residency">Death Residency</option>
                                        <option value="No Income (Scholarship)">No Income (Scholarship)</option>
                                        <option value="No Income (ESC)">No Income (ESC)</option>
                                        <option value="No Income (For Discount)">No Income (For Discount)</option>
                                        <option value="Cohabitation">Cohabitation</option>
                                        <option value="Guardianship">Guardianship</option>
                                        <option value="Good Moral and Probation">Good Moral and Probation</option>
                                        <option value="Garage/PUV">Garage/PUV</option>
                                        <option value="Garage/TRU">Garage/TRU</option>
                                        <option value="Residencye">Residency</option>
                                        <option value="Others">Others</option>
                                    </select>
                                </div>

                                <div className="fields-section">
                                    <p>Other Purpose</p>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Other Purpose"
                                    />
                                </div>

                            </div>
                        </div>

                        <div className="section-right">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Status</p>
                                    <select
                                        id="status"
                                        name="status"
                                        className="input-field"
                                        required
                                        defaultValue={residentData.status}
                                    >
                                        <option value="New">New</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Claiming">Claiming</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                                <div className="fields-section">
                                    <p>Date Requested</p>
                                    <input
                                        type="date"
                                        className="input-field"
                                        placeholder="Select Date From"
                                        defaultValue={residentData.daterequested}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="main-fields-container-section2">
                        <div className="fields-container">
                            <div className="fields-section">
                                <p>First Name</p>
                                <input
                                    type="text"
                                    className="headline"
                                    placeholder="First Name"
                                    defaultValue={residentData.firstname}
                                />
                            </div>

                            <div className="fields-section">
                                <p>Middle Name</p>
                                <input
                                    type="text"
                                    className="headline"
                                    placeholder="Middle Name"
                                    defaultValue={residentData.middlename}
                                />
                            </div>

                            <div className="fields-section">
                                <p>Last Name</p>
                                <input
                                    type="text"
                                    className="headline"
                                    placeholder="Last Name"
                                    defaultValue={residentData.lastname}
                                />
                            </div>

                            <div className="fields-section">
                                <p>Address</p>
                                <input
                                    type="text"
                                    className="headline"
                                    placeholder="Address"
                                    defaultValue={residentData.address}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="main-fields-container-section3">
                        <div className="section-left">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Resident Since</p>
                                    <input
                                        type="date"
                                        className="input-field"
                                        placeholder="Select Date From"
                                        defaultValue={residentData.residentsince}
                                    />
                                </div>
                                <div className="fields-section">
                                    <p>Age</p>
                                    <input
                                        type="number"
                                        id="age"
                                        name="age"
                                        className="input-field"
                                        required
                                        min="1"
                                        max="150"
                                        placeholder="Enter Age"
                                        step="1"
                                        defaultValue={residentData.age}
                                    />
                                </div>

                                <div className="fields-section">
                                    <p>Civil Status</p>
                                    <select
                                        id="civilstatus"
                                        name="civilstatus"
                                        className="input-field"
                                        required
                                        defaultValue={residentData.civilstatus}
                                    >
                                        <option value="" disabled>Select civil status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Widow">Widow</option>
                                        <option value="Separated">Separated</option>
                                    </select>
                                </div>

                                <div className="fields-section">
                                    <p>Citizenship</p>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Citizenship"
                                        defaultValue={residentData.citizenship}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="section-right">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Birthday</p>
                                    <input
                                        type="date"
                                        className="input-field"
                                        placeholder="Select Date From"
                                        defaultValue={residentData.birthday}
                                    />
                                </div>
                                <div className="fields-section">
                                    <p>Gender</p>
                                    <select
                                        id="gender"
                                        name="gender"
                                        className="input-field"
                                        required
                                        defaultValue={residentData.gender}
                                    >
                                        <option value="" disabled>Select gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>

                                <div className="fields-section">
                                    <p>Contact Number</p>
                                    <input
                                        type="tel"
                                        id="contactnumber"
                                        name="contactnumber"
                                        className="input-field"
                                        required
                                        placeholder="Enter Contact Number"
                                        maxLength={10}
                                        pattern="^[0-9]{10}$"
                                        title="Please enter a valid 10-digit contact number"
                                        defaultValue={residentData.contact}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="main-fields-container-section4">
                        <p>Requirements</p>
                        <div className="requirements-file-upload-container">
                            <label htmlFor="file-upload1" className="upload-link">Click to Upload File</label>
                            <input
                                id="file-upload1"
                                type="file"
                                className="file-upload-input"
                                multiple
                                accept=".jpg,.jpeg,.png"
                                required
                                onChange={handleFileChange('container1')}
                            />
                            <div className="uploadedFiles-container">
                                {/* Display the file names with image previews */}
                                {files.container1.length > 0 && (
                                    <div className="file-name-image-display">
                                        <ul>
                                            {files.container1.map((file, index) => (
                                                <div className="file-name-image-display-indiv" key={index}>
                                                    <li className="file-item"> 
                                                        {/* Display the image preview */}
                                                        {file.preview && (
                                                            <div className="filename-image-container">
                                                                <img
                                                                    src={file.preview}
                                                                    alt={file.name}
                                                                    className="file-preview"
                                                                />
                                                            </div>
                                                        )}
                                                        <span className="file-name">{file.name}</span>  
                                                        <div className="delete-container">
                                                            {/* Delete button with image */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleFileDelete('container1', file.name)}
                                                                className="delete-button"
                                                            >
                                                                <img
                                                                    src="/images/trash.png"  
                                                                    alt="Delete"
                                                                    className="delete-icon"
                                                                />
                                                            </button>
                                                        </div>
                                                    </li>
                                                </div>
                                            ))}  
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}

