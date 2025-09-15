"use client";


import "@/CSS/OfficialsPage/OfficialsPage.css";
import { useState,useEffect } from "react";
import { collection, onSnapshot} from "firebase/firestore";
import { db } from "@/app/db/firebase";
interface Official {
  id: string;
  name: string;
  position: string;
  term: string;
  contact: string;
  image?: string;
  email?: string;
  facebook?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
}


export default function Official() {
 

  const [captain, setCaptain] = useState<Official | undefined>(undefined);
  const [officials, setOfficials] = useState<Official[]>([]);

  const [listOfficials, setListOfficials] = useState<Official[]>([]);

  useEffect(() => {
    const docRef = collection(db, "BarangayUsers");
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
          
      const data: Official[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: [doc.data().firstName, doc.data().middleName, doc.data().lastName]
          .filter(Boolean) // removes null, undefined, and empty strings
          .join(" "),
          position: doc.data().position === "LF Staff"
            ? `${doc.data().position} (${doc.data().department || "N/A"})`
            : doc.data().position || "N/A",          
        term: doc.data().term || "N/A",
        contact: doc.data().phone,
        image: doc.data().image || "/images/default-profile.png",
        email: doc.data().email || "N/A",
        createdBy: doc.data().createdBy || "N/A",
        createdAt: doc.data().createdAt,
        updatedBy: doc.data().updatedBy || "N/A",
        facebook: doc.data().facebook || "N/A",
      }));
      setListOfficials(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const captainData = listOfficials.find(
      (official) => official.position === "Punong Barangay"
    );
    setCaptain(captainData);
    const otherOfficials = listOfficials.filter(
      (official) => official.position !== "Punong Barangay"
    );
    setOfficials(otherOfficials);
  }, [listOfficials]);

  return (

    
    <main className="main-container-officials">

      <div className="headerpic-officials">
        <p>BARANGAY OFFICIALS</p>
      </div>

      <div className="officials-header-main">
        <h1 className="officials-title">Elected Officials</h1>
        <div className="officials-underline"></div>
      </div>

      <div className="officials-content">
        <div className="officials-punong-brgy-section">
          <div className="officials-punong-brgy-card">
            <div className="officials-punong-brgy-image">
              <img src={captain?.image ||"/Images/default-identificationpic.jpg"} className="Captain-image-officials" alt="Captain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/Images/default-identificationpic.jpg";
                }}
              />
            </div>
            <div className="officials-punong-brgy-details">
              <p className="official-role-punong-brgy">{captain?.position}</p>
              <h2 className="official-name-punong-brgy">{captain?.name}</h2>
              <p className="official-phonenumber-punong-brgy">Term Duration: {captain?.term || "N/A"}</p>
              <p className="official-phonenumber-punong-brgy">Facebook: {captain?.facebook || "N/A"}</p>
              <p className="official-phonenumber-punong-brgy">Email: {captain?.email || "N/A"}</p>
              <p className="official-phonenumber-punong-brgy">Contact Information: {captain?.contact}</p>
            </div>
          </div>
        </div>

        <div className="other-officials-section">
          {officials.map((official, index) => (
            <div key={index} className="official-card-officials">
              <img
                src={official.image}
                alt={official.name}
                className="official-image-officials"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/Images/default-identificationpic.jpg";
                }}
              />
              <div className="official-content-officials">
                <p className="official-role-officials">{official.position}</p>
                <h2 className="official-name-officials">{official.name}</h2>
                <p className="official-phonenumber-officials">
                  Term Duration: {official.term}
                </p>
                <p className="official-phonenumber-officials">
                  Facebook: {official.facebook || "N/A"}
                </p>
                <p className="official-phonenumber-officials">
                  Email: {official.email || "N/A"}
                </p>
                <p className="official-phonenumber-officials">
                  Contact Information: {official.contact}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
