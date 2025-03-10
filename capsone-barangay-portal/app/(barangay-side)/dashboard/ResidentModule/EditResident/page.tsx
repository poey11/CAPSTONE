"use client";
import "@/CSS/ResidentModule/addresident.css"; // Reuses existing CSS
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../../../../db/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";

export default function EditResident() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const residentId = searchParams.get("id"); 

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    dateOfBirth: "",
    placeOfBirth: "",
    age: 0,
    sex: "",
    civilStatus: "",
    occupation: "",
    contactNumber: "",
    emailAddress: "",
    precinctNumber: "",
    generalLocation:"",
    PWD: false,
    soloParent: false,
    isVoter: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!residentId) return;

    const fetchResident = async () => {
      try {
        const docRef = doc(db, "Residents", residentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            name: data.name || "N/A",
            address: data.address || "N/A",
            generalLocation: data.generalLocation || "N/A",
            dateOfBirth: data.dateOfBirth || "N/A",
            age: data.age || "N/A",
            sex: data.sex || "N/A",
            civilStatus: data.civilStatus || "N/A",
            occupation: data.occupation || "N/A",
            contactNumber: data.contactNumber || "N/A",
            emailAddress: data.emailAddress || "N/A",
            precinctNumber: data.precinctNumber || "N/A",
            placeOfBirth: data.placeOfBirth || "N/A",
            PWD: data.PWD ?? false,
            soloParent: data.soloParent ?? false,
            isVoter: data.isVoter ?? false,
          });
        } else {
          setError("Resident not found.");
        }
      } catch (error) {
        console.error("Error fetching resident:", error);
        setError("Failed to load resident data.");
      }
    };

    fetchResident();
  }, [residentId]);

  //  input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  // form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!residentId) return;

    setLoading(true);
    setError("");

    try {
      const docRef = doc(db, "Residents", residentId);
      await updateDoc(docRef, formData);

      alert("Resident updated successfully!");
      router.push("/dashboard/ResidentModule");
    } catch (err) {
      console.error("Update failed:", err);
      setError("Failed to update resident.");
    } finally {
      setLoading(false);
    }
  };

    const handleBack = () => {
      window.location.href = "/dashboard/ResidentModule";
    };
  

  return (
    <main className="main-container">
      <div className="main-content">
        <Link href="/dashboard/ResidentModule">
        <button type="button" className="back-button" onClick={handleBack}></button>;
        </Link>
        <div className="section-1">
          <p className="NewResident">Edit Resident</p>
          <div className="actions">
            <button className="action-view" type="submit" form="editResidentForm" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
        <form id="editResidentForm" onSubmit={handleSubmit} className="section-2">
          <div className="section-2-left-side">
            <p>Full Name</p>
            <input type="text" className="search-bar" name="name" value={formData.name} onChange={handleChange} required />
            <p>Address</p>
            <input type="text" className="search-bar" name="address" value={formData.address} onChange={handleChange} required />

            <p>Location</p>
            <select name="generalLocation" className="featuredStatus" value={formData.generalLocation} onChange={handleChange} required>
              <option value="" disabled>Choose Part of Fairview</option>
              <option value="East Fairview">East Fairview</option>
              <option value="West Fairview">West Fairview</option>
              <option value="South Fairview">South Fairview</option>
            </select>

            <p>Place of Birth</p>
            <input type="text" className="search-bar" name="placeofBirth" value={formData.placeOfBirth} onChange={handleChange} required />

            <p>Date of Birth</p>
            <input type="date" className="search-bar" name="dateofBirth" value={formData.dateOfBirth} onChange={handleChange} required />

            <p>Age</p>
            <input type="number" className="search-bar" name="age" value={formData.age} onChange={handleChange} required min="1" max="120" />

            <p>Sex</p>
            <select name="sex" className="featuredStatus" value={formData.sex} onChange={handleChange} required>
              <option value="" disabled>Choose Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <p>Civil Status</p>
            <select name="civilStatus" className="featuredStatus" value={formData.civilStatus} onChange={handleChange} required>
              <option value="" disabled>Choose Civil Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Divorced">Divorced</option>
              <option value="Separated">Separated</option>
            </select>

            <p>Occupation</p>
            <input type="text" className="search-bar" name="occupation" value={formData.occupation} onChange={handleChange} />
            <p>Contact Number</p>
            <input type="tel" className="search-bar" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required pattern="[0-9]{11}" placeholder="Enter 11-digit phone number" />

            <p>Email Address</p>
            <input type="email" className="search-bar" name="emailAddress" value={formData.emailAddress} onChange={handleChange} />

            <p>Precinct Number</p>
            <input type="text" className="search-bar" name="precinctNumber" value={formData.precinctNumber} onChange={handleChange} />

            <p>PWD</p>
            <div className="checkbox-container">
              <label className="checkbox-label">
                <input type="checkbox" name="PWD" checked={formData.PWD} onChange={handleChange} />
                Is this resident a person with disability?
              </label>
            </div>

            <p>Solo Parent</p>
            <div className="checkbox-container">
              <label className="checkbox-label">
                <input type="checkbox" name="soloParent" checked={formData.soloParent} onChange={handleChange} />
                Is this resident a solo parent?
              </label>
            </div>

            <p>Voter</p>
            <div className="checkbox-container">
              <label className="checkbox-label">
                <input type="checkbox" name="isVoter" checked={formData.isVoter} onChange={handleChange} />
                Is this resident a registered voter?
              </label>
            </div>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </main>
  );
}

