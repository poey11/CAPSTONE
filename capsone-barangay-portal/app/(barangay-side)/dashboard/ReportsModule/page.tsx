"use client";

import { useState } from "react";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);

  const generateKasambahayReport = async () => {
    setLoading(true);

    try {
      const storage = getStorage();
      const db = getFirestore();

      // Get the current month and year
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const currentMonthYear = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase();

      // Fetch new members from Firestore (registered this month)
      const kasambahayRef = collection(db, "KasambahayList");
      const q = query(kasambahayRef, where("createdAt", ">=", `${year}-${month}-01`), where("createdAt", "<=", `${year}-${month}-31`));
      const querySnapshot = await getDocs(q);
      
      const newMembers = querySnapshot.docs.map(doc => doc.data());
      
      if (newMembers.length === 0) {
        alert("No new members found for the current month.");
        setLoading(false);
        return;
      }

      // Get template file from Firebase Storage
      const templateRef = ref(storage, "ReportsModule/Kasambahay Masterlist Report Template.xlsx");
      let url;
      try {
        url = await getDownloadURL(templateRef);
      } catch (error) {
        console.error("Error fetching template file:", error);
        alert("Failed to fetch report template. Check Firebase Storage.");
        setLoading(false);
        return;
      }
      
      let response;
      try {
        response = await fetch(url);
      } catch (error) {
        console.error("Error downloading template file:", error);
        alert("Failed to download report template.");
        setLoading(false);
        return;
      }
      
      let arrayBuffer;
      try {
        arrayBuffer = await response.arrayBuffer();
      } catch (error) {
        console.error("Error reading template file:", error);
        alert("Failed to process template file.");
        setLoading(false);
        return;
      }
      
      let workbook;
      try {
        workbook = XLSX.read(arrayBuffer, { type: "array" });
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        alert("Invalid Excel file format.");
        setLoading(false);
        return;
      }
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Find the last row dynamically (before the signature section)
      let lastRow = 0;
      const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
      for (let row = range.s.r; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
        if (worksheet[cellAddress] && worksheet[cellAddress].v) {
          lastRow = row;
        }
      }

      // Insert "NEW MEMBERS (CURRENT MONTH YEAR)" header
      const headerRow = lastRow + 2;
      const headerCell = XLSX.utils.encode_cell({ r: headerRow, c: 0 });
      worksheet[headerCell] = { v: `NEW MEMBERS (${currentMonthYear})`, s: { font: { bold: true, italic: true, color: { rgb: "FF0000" } } } };

      // Insert new members' data
      let rowIndex = headerRow + 1;
      newMembers.forEach(member => {
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
        worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 14 })] = { v: member.sssMember ? "Yes" : "No" };
        worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 15 })] = { v: member.pagibigMember ? "Yes" : "No" };
        worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 16 })] = { v: member.philhealthMember ? "Yes" : "No" };
        worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 17 })] = { v: member.employerName };
        worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 18 })] = { v: member.employerAddress };
        rowIndex++;
      });

      const updatedWorkbook = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([updatedWorkbook], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `Kasambahay_Masterlist_${currentMonthYear}.xlsx`);

      alert("Report generated successfully!");
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">Generate Reports</h1>
      <button
        onClick={generateKasambahayReport}
        disabled={loading}
        className={`px-6 py-3 text-white rounded-lg transition ${loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}`}
      >
        {loading ? "Generating..." : "Generate Kasambahay Masterlist"}
      </button>
    </div>
  );
};

export default ReportsPage;
