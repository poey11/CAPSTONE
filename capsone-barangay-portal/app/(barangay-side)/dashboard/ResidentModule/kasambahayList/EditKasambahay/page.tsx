"use client";
import "@/CSS/ResidentModule/addresident.css"; 
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../../../../../db/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";

interface KasambahayFormData {
  registrationControlNumber: string;
  firstName: string;
  lastName: string;
  middleName: string;
  homeAddress: string;
  dateOfBirth: string;
  placeOfBirth: string;
  age: string;
  sex: string;
  civilStatus: string;
  educationalAttainment: string;
  natureOfWork: string;
  employmentArrangement: string;
  salary: string;
  employerName: string;
  employerAddress: string;
  sssMember: boolean;
  philhealthMember: boolean;
  pagibigMember: boolean;
}

export default function EditKasambahay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kasambahayId = searchParams.get("id"); 

  const [formData, setFormData] = useState<KasambahayFormData>({
    registrationControlNumber: "",
    firstName: "",
    lastName: "",
    middleName: "",
    homeAddress: "",
    dateOfBirth: "",
    placeOfBirth: "",
    age: "",
    sex: "",
    civilStatus: "",
    educationalAttainment: "",
    natureOfWork: "",
    employmentArrangement: "",
    salary: "",
    employerName: "",
    employerAddress: "",
    sssMember: false,
    philhealthMember: false,
    pagibigMember: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!kasambahayId) return;

    const fetchKasambahay = async () => {
      try {
        const docRef = doc(db, "KasambahayList", kasambahayId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            registrationControlNumber: data.registrationControlNumber || "",
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            middleName: data.middleName || "",
            homeAddress: data.homeAddress || "",
            dateOfBirth: data.dateOfBirth || "",
            placeOfBirth: data.placeOfBirth || "",
            age: data.age || "",
            sex: data.sex || "",
            civilStatus: data.civilStatus || "",
            educationalAttainment: data.educationalAttainment || "",
            natureOfWork: data.natureOfWork || "",
            employmentArrangement: data.employmentArrangement || "",
            salary: data.salary || "",
            employerName: data.employerName || "",
            employerAddress: data.employerAddress || "",
            sssMember: data.sssMember ?? false,
            philhealthMember: data.philhealthMember ?? false,
            pagibigMember: data.pagibigMember ?? false,
          });
        } else {
          setError("Kasambahay record not found.");
        }
      } catch (error) {
        console.error("Error fetching Kasambahay:", error);
        setError("Failed to load data.");
      }
    };

    fetchKasambahay();
  }, [kasambahayId]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Convert specific fields to numbers
    const numericFields = ["educationalAttainment", "natureOfWork", "employmentArrangement", "salary"];
    
    setFormData({
      ...formData,
      [name]: numericFields.includes(name) ? Number(value) : type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };
  

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!kasambahayId) return;

    setLoading(true);
    setError("");

    try {
      const docRef = doc(db, "Kasambahay", kasambahayId);
      await updateDoc(docRef, {
        registrationControlNumber: formData.registrationControlNumber,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        homeAddress: formData.homeAddress,
        dateOfBirth: formData.dateOfBirth,
        placeOfBirth: formData.placeOfBirth,
        age: formData.age,
        sex: formData.sex,
        civilStatus: formData.civilStatus,
        educationalAttainment: formData.educationalAttainment,
        natureOfWork: formData.natureOfWork,
        employmentArrangement: formData.employmentArrangement,
        salary: formData.salary,
        employerName: formData.employerName,
        employerAddress: formData.employerAddress,
        sssMember: formData.sssMember,
        philhealthMember: formData.philhealthMember,
        pagibigMember: formData.pagibigMember,
      });
      

      alert("Kasambahay record updated successfully!");
      router.push("/dashboard/ResidentModule/KasambahayList");
    } catch (err) {
      console.error("Update failed:", err);
      setError("Failed to update record.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule/kasambahayList";
  };

  return (
    <main className="main-container">
      <div className="main-content">
        <Link href="/dashboard/ResidentModule/kasambahayList">
        <button type="button" className="back-button" onClick={handleBack}></button>
        </Link>
        <div className="section-1">
          <p className="NewResident">Edit Kasambahay</p>
          <div className="actions">
            <button className="action-view" type="submit" form="editKasambahayForm" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
        <form id="editKasambahayForm" onSubmit={handleSubmit} className="section-2">
          <div className="section-2-left-side">
            <p>Registration Control Number</p>
            <input type="text" name="registrationControlNumber" value={formData.registrationControlNumber} onChange={handleChange} disabled className="disabled-input" 
  />

            <p>First Name</p>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />

            <p>Last Name</p>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />

            <p>Middle Name</p>
            <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} required />

            <p>Home Address</p>
            <input type="text" name="homeAddress" value={formData.homeAddress} onChange={handleChange} required />

            <p>Sex</p>
            <select name="sex" value={formData.sex} onChange={handleChange} required>
              <option value="" disabled>Choose Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <p>Civil Status</p>
            <select name="civilStatus" value={formData.civilStatus} onChange={handleChange} required>
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

            <p>SSS Member</p>
            <input type="checkbox" name="sssMember" checked={formData.sssMember} onChange={handleChange} />

            <p>PhilHealth Member</p>
            <input type="checkbox" name="philhealthMember" checked={formData.philhealthMember} onChange={handleChange} />

            <p>Pag-IBIG Member</p>
            <input type="checkbox" name="pagibigMember" checked={formData.pagibigMember} onChange={handleChange} />

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
