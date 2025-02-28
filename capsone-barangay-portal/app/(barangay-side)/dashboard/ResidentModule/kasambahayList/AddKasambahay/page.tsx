"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../../db/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

export default function AddKasambahay() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    registrationControlNumber: "",
    lastName: "",
    firstName: "",
    middleName: "",
    homeAddress: "",
    dateOfBirth: "",
    placeOfBirth: "",
    sex: "",
    age: "",
    civilStatus: "",
    educationalAttainment: "",
    natureOfWork: "",
    employmentArrangement: "",
    salary: "",
    sssMember: false,
    philhealthMember: false,
    pagibigMember: false,
    employerName: "",
    employerAddress: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLatestNumber = async () => {
      try {
        const kasambahayCollection = collection(db, "KasambahayList");
        const q = query(kasambahayCollection, orderBy("registrationControlNumber", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        let newNumber = 1;
        if (!querySnapshot.empty) {
          const latestEntry = querySnapshot.docs[0].data();
          newNumber = latestEntry.registrationControlNumber + 1;
        }

        setFormData((prevData) => ({
          ...prevData,
          registrationControlNumber: newNumber.toString(),
        }));
      } catch (error) {
        console.error("Error fetching latest registration number:", error);
      }
    };

    fetchLatestNumber();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Convert specific fields to numbers
    const numericFields = ["educationalAttainment", "natureOfWork", "employmentArrangement", "salary"];
    
    setFormData({
      ...formData,
      [name]: numericFields.includes(name) ? Number(value) : type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };
  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Ensure the latest registration number is assigned
      const kasambahayCollection = collection(db, "KasambahayList");
      const q = query(kasambahayCollection, orderBy("registrationControlNumber", "desc"), limit(1));
      const querySnapshot = await getDocs(q);

      let latestNumber = 1;
      if (!querySnapshot.empty) {
        const latestEntry = querySnapshot.docs[0].data();
        latestNumber = latestEntry.registrationControlNumber + 1;
      }

      await addDoc(kasambahayCollection, {
        ...formData,
        registrationControlNumber: latestNumber,
        createdAt: serverTimestamp(),
      });

      alert("Kasambahay added successfully!");
      router.push("/dashboard/ResidentModule/kasambahayList");
    } catch (err) {
      setError("Failed to add kasambahay");
      console.error(err);
    }
    setLoading(false);
  };

  const handleBack = () => {
    router.push("/dashboard/ResidentModule/kasambahayList");
  };

  return (
    <main className="main-container">
      <div className="main-content">
        <Link href="/dashboard/ResidentModule/kasambahayList">
          <button type="button" className="back-button" onClick={handleBack}></button>
        </Link>
        <div className="section-1">
          <p className="NewResident">New Kasambahay</p>
          <div className="actions">
            <button className="action-view" type="submit" form="addKasambahayForm" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
        <form id="addKasambahayForm" onSubmit={handleSubmit} className="section-2">
          <div className="section-2-left-side">
            <p>Last Name</p>
            <input type="text" className="search-bar" placeholder="Enter Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />

            <p>First Name</p>
            <input type="text" className="search-bar" placeholder="Enter First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />

            <p>Middle Name</p>
            <input type="text" className="search-bar" placeholder="Enter Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} required />

            <p>Home Address</p>
            <input type="text" className="search-bar" placeholder="Enter Address" name="homeAddress" value={formData.homeAddress} onChange={handleChange} required />

            <p>Place of Birth</p>
            <input type="text" className="search-bar" placeholder="Enter Place of Birth" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} required />

            <p>Date of Birth</p>
            <input type="date" className="search-bar" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />

            <p>Age</p>
            <input
              type="number"
              className="search-bar" 
              placeholder="Enter Age" 
              name="age"
              value={formData.age}
              onChange={handleChange}
              required
              min="1"
              max="120"
            />

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


            <p>Educational Attainment</p>
            <select name="educationalAttainment" className="featuredStatus" value={formData.educationalAttainment} onChange={handleChange} required>
              <option value="" disabled>Choose Educational Attainment</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
            </select>

            <p>Nature of Work</p>
            <select name="natureOfWork" className="featuredStatus" value={formData.natureOfWork} onChange={handleChange} required>
              <option value="" disabled>Choose Nature of Work</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>

            <p>Employment Arrangement</p>
            <select name="employmentArrangement" className="featuredStatus" value={formData.employmentArrangement} onChange={handleChange} required>
              <option value="" disabled>Choose Employment Arrangement</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>

            <p>Range of Salary</p>
            <select name="salary" className="featuredStatus" value={formData.salary} onChange={handleChange} required>
            <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>


            <p>SSS Membership</p>
            <div className="checkbox-container">
              <label className="checkbox-label">
                <input type="checkbox" name="sssMember" checked={formData.sssMember} onChange={handleChange} />
                Is this resident an SSS Member?
              </label>
            </div>

            <p>Pag-Ibig Membership</p>
            <div className="checkbox-container">
              <label className="checkbox-label">
                <input type="checkbox" name="pagibigMember" checked={formData.pagibigMember} onChange={handleChange} />
                Is this resident a Pag-Ibig Member?
              </label>
            </div>

            <p>PhilHealth Membership</p>
            <div className="checkbox-container">
              <label className="checkbox-label">
                <input type="checkbox" name="philhealthMember" checked={formData.philhealthMember} onChange={handleChange} />
                Is this resident a PhilHealth Member?
              </label>
            </div>

            <p>Employer Name</p>
            <input type="text" className="search-bar" placeholder="Enter Employer" name="employerName" value={formData.employerName} onChange={handleChange} required />

            <p>Employer Address</p>
            <input type="text" className="search-bar" placeholder="Enter Employer Address" name="employerAddress" value={formData.employerAddress} onChange={handleChange} required />
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </main>
  );
}
