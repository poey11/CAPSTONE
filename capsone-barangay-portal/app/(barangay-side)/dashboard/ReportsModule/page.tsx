"use client";
import { useState, useEffect } from "react";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, query, where, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "@/CSS/ReportsModule/reports.css";

interface FileData {
  name: string;
  url: string;
}

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>("");

  const storage = getStorage();
  const db = getFirestore();

  const formFiles = [
    "Fairview ECA Form.docx",
    "KASAMBAHAY PROGRAM COMPONENTS FORM.docx",
    "Barangay Kontra Gutom(Hapag sa Barangay).docx",
  ];

  useEffect(() => {
    const fetchDownloadLinks = async () => {
      try {
        const urls = await Promise.all(
          formFiles.map(async (file) => {
            const fileRef = ref(storage, `ReportsModule/${file}`);
            const url = await getDownloadURL(fileRef);
            return { name: file, url };
          })
        );
        setFiles(urls);
      } catch (error) {
        console.error("Error fetching file URLs:", error);
      }
    };

    fetchDownloadLinks();
  }, []);

  const generateKasambahayReport = async () => {
  setLoading(true);
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const currentMonthYear = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase();

    const kasambahayRef = collection(db, "KasambahayList");
    const q = query(
      kasambahayRef,
      where("createdAt", ">=", `${year}-${month}-01`),
      where("createdAt", "<=", `${year}-${month}-31`)
    );

    const querySnapshot = await getDocs(q);
    let newMembers = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data());

    if (newMembers.length === 0) {
      alert("No new members found for the current month.");
      setLoading(false);
      return;
    }

    newMembers.sort((a, b) => Number(a.registrationControlNumber) - Number(b.registrationControlNumber));

    const templateRef = ref(storage, "ReportsModule/Kasambahay Masterlist Report Template.xlsx");
    const url = await getDownloadURL(templateRef);
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    let lastRow = 0;
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
      if (worksheet[cellAddress] && worksheet[cellAddress].v) {
        lastRow = row;
      }
    }

    const headerRow = lastRow + 2;
    worksheet[XLSX.utils.encode_cell({ r: headerRow, c: 0 })] = { v: `NEW MEMBERS (${currentMonthYear})`, s: { font: { bold: true, italic: true, color: { rgb: "FF0000" } } } };

    let rowIndex = headerRow + 1;
    newMembers.forEach((member) => {
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 0 })] = { v: member.registrationControlNumber };
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 1 })] = { v: member.lastName };
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 2 })] = { v: member.firstName };
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 3 })] = { v: member.middleName };
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 4 })] = { v: member.homeAddress };
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 5 })] = { v: member.placeOfBirth };
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 6 })] = { v: member.dateOfBirth };
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 7 })] = { v: member.sex };
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 8 })] = { v: member.age };
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 9 })] = { v: member.civilStatus };
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 10 })] = { v: member.educationalAttainment };
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 11 })] = { v: member.natureOfWork };
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 12 })] = { v: member.employmentArrangement };
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 13 })] = { v: member.salary };
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 14 })] = { v: member.sssMember ? "YES" : "NO" };
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 15 })] = { v: member.pagibigMember ? "YES" : "NO" };
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 16 })] = { v: member.philhealthMember ? "YES" : "NO" };
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 17 })] = { v: member.employerName };
      worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 18 })] = { v: member.employerAddress };
      rowIndex++;
    });

    const updatedWorkbook = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([updatedWorkbook], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `Kasambahay_Masterlist_${currentMonthYear}.xlsx`);

    alert("Kasambay Masterlist Report generated successfully!");
  } catch (error) {
    console.error("Unexpected error:", error);
    alert("Failed to generate Kasambay Masterlist Report.");
  } finally {
    setLoading(false);
  }
};

const generateFirstTimeJobSeekerReport = async () => {
  setLoading(true);
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const currentMonthYear = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase();

    const jobSeekerRef = collection(db, "JobSeekerList");
    const q = query(
      jobSeekerRef,
      where("dateApplied", ">=", `${year}-${month}-01`),
      where("dateApplied", "<=", `${year}-${month}-31`)
    );

    const querySnapshot = await getDocs(q);
    let jobSeekers = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data());

    if (jobSeekers.length === 0) {
      alert("No first-time job seekers found for the current month.");
      setLoading(false);
      return;
    }

    jobSeekers.sort((a, b) => new Date(a.dateApplied).getTime() - new Date(b.dateApplied).getTime());

    const templateRef = ref(storage, "ReportsModule/First Time Job Seeker Record.xlsx");
    const url = await getDownloadURL(templateRef);
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    const sheetName = "JANUARY";
    let worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      worksheet = XLSX.utils.aoa_to_sheet([["First Time Job Seekers", "", ""], ["", "", ""]]);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    let lastRow = 2;
    while (worksheet[XLSX.utils.encode_cell({ r: lastRow, c: 0 })]) {
      lastRow++;
    }

    jobSeekers.forEach((seeker) => {


      worksheet[XLSX.utils.encode_cell({ r: lastRow, c: 0 })] = { v: new Date(seeker.dateApplied).toLocaleDateString("en-US") };
      worksheet[XLSX.utils.encode_cell({ r: lastRow, c: 1 })] = { v: seeker.lastName };
      worksheet[XLSX.utils.encode_cell({ r: lastRow, c: 2 })] = { v: seeker.firstName };
      worksheet[XLSX.utils.encode_cell({ r: lastRow, c: 3 })] = { v: seeker.middleName };
      worksheet[XLSX.utils.encode_cell({ r: lastRow, c: 4 })] = { v: seeker.age };
      worksheet[XLSX.utils.encode_cell({ r: lastRow, c: 5 })] = { v: seeker.monthOfBirth };
      worksheet[XLSX.utils.encode_cell({ r: lastRow, c: 6 })] = { v: seeker.dayOfBirth };
      worksheet[XLSX.utils.encode_cell({ r: lastRow, c: 7 })] = { v: seeker.yearOfBirth };
      if (seeker.sex === "M") {
        worksheet[XLSX.utils.encode_cell({ r: lastRow, c: 8 })] = { v: "*" };
      } else if (seeker.sex === "F") {
        worksheet[XLSX.utils.encode_cell({ r: lastRow, c: 9 })] = { v: "*" }; 
      }
      worksheet[XLSX.utils.encode_cell({ r: lastRow, c: 10 })] = { v: seeker.remarks };


      lastRow++;
    });

    const updatedWorkbook = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([updatedWorkbook], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `FirstTimeJobSeekers_${currentMonthYear}.xlsx`);

    alert("First-Time Job Seeker Report generated successfully!");
  } catch (error) {
    console.error("Error generating report:", error);
    alert("Failed to generate First-Time Job Seeker Report.");
  } finally {
    setLoading(false);
  }
};

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const file = files.find((f) => f.name.replace(".docx", "") === selectedName) || null;
    setSelectedFile(file);
  };

  const handleModuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModule(e.target.value);
  };

  return (
    <div className="report-main-container">

      
      <h1 className="reports-title">Reports Module</h1>

      <div className="reports-section">
        <div className="report-card">
          <h2 className="report-title">Generate Reports</h2>
          <div className="Option-container">
            <select
              className="featuredStatus"
              onChange={handleModuleChange}
              required
            >
              <option value="">Select Module...</option>
              <option value="Resident Module">Resident Module</option>
              <option value="Incident Module">Incident Module</option>
              <option value="Services Module">Services Module</option>
              <option value="Programs Module">Programs Module</option>
            </select>
          </div>

          {selectedModule === "Resident Module" && (
            <>
              <button className="report-button">Generate Barangay Fairview Resident Masterlist</button>
              <button className="report-button">Generate East Fairview Resident List</button>
              <button className="report-button">Generate South Fairview Resident List</button>
              <button className="report-button">Generate West Fairview Resident List</button>
              <button onClick={generateKasambahayReport} disabled={loading} className="report-button">
                {loading ? "Generating..." : "Generate Kasambahay Masterlist"}
              </button>
              <button onClick={generateFirstTimeJobSeekerReport} disabled={loading} className="report-button">
                {loading ? "Generating..." : "Generate First-Time Job Seeker List"}
              </button>            </>
          )}

          {selectedModule === "Incident Module" && (
            <>
              <button className="report-button">Summary of Incidents</button>
              <button className="report-button">Incident Status Summary</button>
            </>
          )}

          {selectedModule === "Services Module" && (
            <>
              <button className="report-button">Most Requested Services Lists</button>
            </>
          )}

          {selectedModule === "Programs Module" && (
            <>
              <button className="report-button">Program Participation Report</button>
              <button className="report-button">Program Completion Status Report</button>
            </>
          )}
        </div>

        <div className="report-card">
          <h2 className="report-title">Downloadable Forms</h2>
          <div className="Option-container">
            <select
              className="featuredStatus"
              onChange={handleSelectChange}
              required
            >
              <option value="">Select a form...</option>
              {files.length > 0 ? (
                files.map((file, index) => (
                  <option key={index} value={file.name.replace(".docx", "")}> 
                    {file.name.replace(".docx", "")}
                  </option>
                ))
              ) : (
                <option>Loading files...</option>
              )}
            </select>
          </div>

          {selectedFile && (
            <div className="download-item">
              <span className="download-text">{selectedFile.name.replace(".docx", "")}</span>
              <a href={selectedFile.url} download className="download-button">
                Download
              </a>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default ReportsPage;
