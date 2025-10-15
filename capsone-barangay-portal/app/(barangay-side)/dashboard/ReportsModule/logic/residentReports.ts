// app/(barangay-side)/dashboard/ReportsModule/logic/residentReports.ts
// PURE logic only: no JSX, no "use client". UI triggers stay in page.tsx.

import { Firestore, collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { FirebaseStorage, ref, getDownloadURL, uploadBytes } from "firebase/storage";
import ExcelJS from "exceljs";

// ———————————————————————————————————
// Types
// ———————————————————————————————————
export type GeneratedXlsx = {
  fileUrl: string;           // gs/http url of uploaded XLSX in Storage
  fileName: string;          // uploaded XLSX filename (for logs/UI)
  label?: string;            // e.g., "SEPTEMBER 2025" etc.
  meta?: Record<string, any>;
};

// Helper: fetch an xlsx template from Storage
async function loadTemplateFromStorage(storage: FirebaseStorage, storagePath: string): Promise<ArrayBuffer> {
  const templateRef = ref(storage, storagePath);
  const url = await getDownloadURL(templateRef);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TEMPLATE_DOWNLOAD_FAILED: ${storagePath}`);
  return res.arrayBuffer();
}

// Helper: upload a workbook to Storage and return its URL
async function uploadWorkbook(
  storage: FirebaseStorage,
  workbook: ExcelJS.Workbook,
  uploadedName: string,
  folder = "GeneratedReports"
): Promise<GeneratedXlsx> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const storageRef = ref(storage, `${folder}/${uploadedName}`);
  await uploadBytes(storageRef, blob);
  const fileUrl = await getDownloadURL(storageRef);
  return { fileUrl, fileName: uploadedName };
}

// Map for Kasambahay “nature of work” labels
const defaultNatureOfWorkMap: Record<number, string> = {
  1: "Gen. House Help (All Around)",
  2: "YAYA",
  3: "COOK",
  4: "Gardener",
  5: "Laundry Person",
  6: "Others",
};

// ———————————————————————————————————
// KASAMBAHAY MASTERLIST (XLSX)
// ———————————————————————————————————
export async function generateKasambahayXlsx(params: {
  db: Firestore;
  storage: FirebaseStorage;
  natureOfWork: string; // "All" or numeric string "1".."6"
  natureOfWorkMap?: Record<number, string>;
}): Promise<GeneratedXlsx> {
  const { db, storage, natureOfWork, natureOfWorkMap = defaultNatureOfWorkMap } = params;

  const currentDate = new Date();
  const currentMonthYear = currentDate
    .toLocaleString("en-US", { month: "long", year: "numeric" })
    .toUpperCase();

  const kasambahayRef = collection(db, "KasambahayList");
  const q = query(kasambahayRef);
  const snapshot = await getDocs(q);

  let allMembers = snapshot.docs.map((doc) => doc.data() as any);

  if (natureOfWork !== "All") {
    allMembers = allMembers.filter((m) => m.natureOfWork === Number(natureOfWork));
  }

  const oldMembers = allMembers.filter((m) => {
    const d = new Date(m.createdAt);
    return d.getFullYear() < currentDate.getFullYear() ||
      (d.getFullYear() === currentDate.getFullYear() && d.getMonth() < currentDate.getMonth());
  });

  const currentMonthMembers = allMembers.filter((m) => {
    const d = new Date(m.createdAt);
    return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth();
  });

  if (oldMembers.length === 0 && currentMonthMembers.length === 0) {
    const msg = natureOfWork !== "All" ? `No Kasambahay records for ${natureOfWork}.` : "No Kasambahay records.";
    const err = new Error(msg);
    (err as any).code = "NO_DATA";
    throw err;
  }

  oldMembers.sort((a, b) => Number(a.registrationControlNumber) - Number(b.registrationControlNumber));
  currentMonthMembers.sort((a, b) => Number(a.registrationControlNumber) - Number(b.registrationControlNumber));

  // Load template & compose
  const arr = await loadTemplateFromStorage(storage, "ReportsModule/AdminStaff/Kasambahay Masterlist Report Template.xlsx");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arr);
  const ws = workbook.worksheets[0];

  const headerDrawings = ws.getImages().filter((img) => img.range.tl.nativeRow === 0);
  const footerDrawings = ws.getImages().filter((img) => img.range.tl.nativeRow >= 5);

  const footerStartRow = 6;
  ws.spliceRows(footerStartRow, 0, ...new Array(oldMembers.length + currentMonthMembers.length + 2).fill([]));

  headerDrawings.forEach((d) => {
    if (d.range?.tl) d.range.tl.nativeRow = 0;
    if (d.range?.br) d.range.br.nativeRow = 0;
  });

  let oldRow = footerStartRow + 1;
  let newRow = footerStartRow + oldMembers.length + 2;

  const putRow = (rowIndex: number, member: any) => {
    const row = ws.getRow(rowIndex);
    row.height = 100;
    const dob = member.dateOfBirth ? new Date(member.dateOfBirth) : undefined;
    const dobStr = dob
      ? `${String(dob.getMonth() + 1).padStart(2, "0")}/${String(dob.getDate()).padStart(2, "0")}/${dob.getFullYear()}`
      : "";

    const cells = [
      member.registrationControlNumber,
      member.lastName?.toUpperCase(),
      member.firstName?.toUpperCase(),
      member.middleName?.toUpperCase(),
      member.homeAddress?.toUpperCase(),
      member.placeOfBirth?.toUpperCase(),
      dobStr,
      member.sex === "Female" ? "F" : member.sex === "Male" ? "M" : "",
      member.age,
      member.civilStatus?.toUpperCase(),
      member.educationalAttainment,
      member.natureOfWork,
      member.employmentArrangement,
      member.salary,
      member.sssMember ? "YES" : "NO",
      member.pagibigMember ? "YES" : "NO",
      member.philhealthMember ? "YES" : "NO",
      member.employerName?.toUpperCase(),
      member.employerAddress?.toUpperCase(),
    ];

    cells.forEach((v, i) => {
      const c = row.getCell(i + 1);
      c.value = v;
      c.font = { name: "Calibri", size: 21 };
      c.alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
      c.border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
    });
    row.commit();
  };

  oldMembers.forEach((m: any) => putRow(oldRow++, m));

  const headerRow = ws.getRow(footerStartRow + oldMembers.length + 1);
  ws.unMergeCells(headerRow.number, 1, headerRow.number, 18);
  headerRow.getCell(1).value = `(NEW MEMBERS ${currentMonthYear})`;
  headerRow.getCell(1).font = { bold: true, italic: true, size: 21, color: { argb: "FF0000" } };
  headerRow.height = 25;
  headerRow.alignment = { horizontal: "left", vertical: "middle" };
  ws.mergeCells(headerRow.number, 1, headerRow.number, 18);
  headerRow.commit();

  currentMonthMembers.forEach((m: any) => putRow(newRow++, m));

  footerDrawings.forEach((d) => {
    const newFooterRow = (d.range?.tl?.nativeRow || 5) + oldMembers.length + currentMonthMembers.length + 2;
    if (d.range?.tl) d.range.tl.nativeRow = newFooterRow;
    if (d.range?.br) d.range.br.nativeRow = newFooterRow + 1;
  });

  ws.pageSetup = { horizontalCentered: true, verticalCentered: false, orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const label = natureOfWork !== "All"
    ? (defaultNatureOfWorkMap[Number(natureOfWork)] || `Type${natureOfWork}`)
    : "All";

  const uploadedName = `Kasambahay_Masterlist_${label}_${currentMonthYear.replace(" ", "_")}.xlsx`;
  const out = await uploadWorkbook(storage, workbook, uploadedName);
  return { ...out, label: currentMonthYear };
}

// ———————————————————————————————————
// FIRST-TIME JOB SEEKER (XLSX)
// ———————————————————————————————————
export async function generateFirstTimeJobSeekerXlsx(params: {
  db: Firestore;
  storage: FirebaseStorage;
}): Promise<GeneratedXlsx> {
  const { db, storage } = params;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const currentMonthYear = now.toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase();

  const jobSeekerRef = collection(db, "JobSeekerList");

  const qOld = query(jobSeekerRef, where("createdAt", "<", `${year}-${month}-01`), where("firstTimeClaimed", "==", true));
  const oldSnap = await getDocs(qOld);
  const old = oldSnap.docs.map((d) => d.data() as any);

  const qCurrent = query(
    jobSeekerRef,
    where("createdAt", ">=", `${year}-${month}-01`),
    where("createdAt", "<=", `${year}-${month}-31`),
    where("firstTimeClaimed", "==", true)
  );
  const curSnap = await getDocs(qCurrent);
  const cur = curSnap.docs.map((d) => d.data() as any);

  if (old.length === 0 && cur.length === 0) {
    const err = new Error("No new job seekers found.");
    (err as any).code = "NO_DATA";
    throw err;
  }

  const arr = await loadTemplateFromStorage(storage, "ReportsModule/AdminStaff/First Time Job Seeker Record.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arr);
  const ws = wb.worksheets[0];

  const monthNames = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  ws.getCell("A1").value = "(RA 11261 - FIRST TIME JOBSEEKERS ACT)\nROSTER OF BENEFICIARIES/AVAILEES\nBARANGAY FAIRVIEW\nQUEZON CITY";
  ws.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
  ws.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
  ws.getCell("A2").value = `AS OF ${currentMonthYear}`;

  for (let r = 1; r <= 4; r++) {
    const row = ws.getRow(r);
    row.eachCell((c) => (c.alignment = { horizontal: "center", vertical: "middle", wrapText: true }));
    row.commit();
  }

  const dataStartRow = 5;
  const footerStartRow = 5;

  const headerDrawings = ws.getImages().filter((img) => img.range.tl.nativeRow === 0);
  const footerDrawings = ws.getImages().filter((img) => img.range.tl.nativeRow >= footerStartRow);

  ws.spliceRows(dataStartRow, 0, ...new Array(old.length + cur.length + 2).fill([]));
  headerDrawings.forEach((d) => {
    if (d.range?.tl) d.range.tl.nativeRow = 0;
    if (d.range?.br) d.range.br.nativeRow = 0;
  });

  let oldRow = dataStartRow;
  let newRow = oldRow + old.length + 2;

  const fmt = (s: any) => [
    s.dateApplied ? new Date(s.dateApplied).toLocaleDateString("en-US") : "",
    s.lastName || "",
    s.firstName || "",
    s.middleName || "",
    s.age || "",
    s.monthOfBirth ? monthNames[parseInt(s.monthOfBirth, 10)] : "",
    s.dayOfBirth || "",
    s.yearOfBirth || "",
    s.sex === "Male" ? "*" : "",
    s.sex === "Female" ? "*" : "",
    s.remarks || "",
  ];

  const putRow = (idx: number, seeker: any) => {
    const row = ws.getRow(idx);
    row.height = 60;
    const cells = fmt(seeker);
    cells.forEach((v, i) => {
      const c = row.getCell(i + 1);
      c.value = v;
      c.font = { name: "Calibri", size: 14 };
      c.alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
      c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    });
    row.commit();
  };

  old.forEach((s: any) => putRow(oldRow++, s));

  const headerRow = ws.getRow(footerStartRow + old.length + 1);
  ws.unMergeCells(headerRow.number, 1, headerRow.number, 11);
  headerRow.getCell(1).value = `(NEW MEMBERS ${currentMonthYear})`;
  headerRow.getCell(1).font = { bold: true, italic: true, size: 16, color: { argb: "FF0000" } };
  headerRow.alignment = { horizontal: "left", vertical: "middle" };
  headerRow.height = 25;
  ws.mergeCells(headerRow.number, 1, headerRow.number, 11);
  headerRow.commit();

  cur.forEach((s: any) => putRow(newRow++, s));

  footerDrawings.forEach((d) => {
    const newRowNo = (d.range?.tl?.nativeRow || footerStartRow) + old.length + cur.length + 2;
    if (d.range?.tl) d.range.tl.nativeRow = newRowNo;
    if (d.range?.br) d.range.br.nativeRow = newRowNo + 1;
  });

  ws.pageSetup = { horizontalCentered: true, verticalCentered: false, orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const uploadedName = `JobSeeker_Masterlist_${currentMonthYear}.xlsx`;
  const out = await uploadWorkbook(storage, wb, uploadedName);
  return { ...out, label: currentMonthYear };
}

// ———————————————————————————————————
// SENIOR CITIZEN DEMOGRAPHIC (XLSX)
// ———————————————————————————————————
export async function generateSeniorCitizenXlsx(params: {
  db: Firestore;
  storage: FirebaseStorage;
}): Promise<GeneratedXlsx> {
  const { db, storage } = params;

  const now = new Date();
  const year = now.getFullYear();
  const title = `SENIOR CITIZEN DEMOGRAPHIC REPORT ${year}`;

  const residentRef = collection(db, "Residents");
  const q = query(residentRef);
  const snap = await getDocs(q);

  let residents = snap.docs.map((d) => d.data() as any).filter((r) => r.isSeniorCitizen === true);
  if (residents.length === 0) {
    const err = new Error("No senior citizens found.");
    (err as any).code = "NO_DATA";
    throw err;
  }

  residents.sort((a, b) => {
    const lastA = (a.lastName || "").trim().toUpperCase();
    const lastB = (b.lastName || "").trim().toUpperCase();
    const firstA = (a.firstName || "").trim().toUpperCase();
    const firstB = (b.firstName || "").trim().toUpperCase();
    const addrA = (a.address || "").trim().toUpperCase();
    const addrB = (b.address || "").trim().toUpperCase();
    if (lastA === lastB) return firstA === firstB ? addrA.localeCompare(addrB) : firstA.localeCompare(firstB);
    return lastA.localeCompare(lastB);
  });

  const arr = await loadTemplateFromStorage(storage, "ReportsModule/AdminStaff/INHABITANT RECORD TEMPLATE.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arr);
  const ws = wb.worksheets[0];

  ws.getCell("A1").value = "BARANGAY FAIRVIEW\nRECORD OF BARANGAY DEMOGRAPHICS";
  ws.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
  ws.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
  ws.getCell("A2").value = title;

  const dataStartRow = 4;
  const footerStart = 24;
  const footerEnd = 28;

  const footerImgs = ws.getImages().filter((img) => {
    const r = img.range?.tl?.nativeRow;
    return r >= (footerStart - 1) && r <= (footerEnd - 1);
  });

  const rowsNeeded = Math.max(0, dataStartRow + residents.length - (footerStart - 1));
  ws.insertRows(footerStart - 1, new Array(rowsNeeded).fill([]));

  residents.forEach((r, idx) => {
    const rowIdx = dataStartRow + idx;
    const row = ws.getRow(rowIdx);
    row.height = 55;

    const fullName = `${r.lastName || ""}, ${r.firstName || ""} ${r.middleName || ""}`.trim();
    const cells = [
      (idx + 1).toString(),
      fullName,
      r.address || "",
      r.dateOfBirth || "",
      r.placeOfBirth || "",
      r.age || "",
      r.sex || "",
      r.civilStatus || "",
      r.occupation || "",
      r.contactNumber || "",
      r.emailAddress || "",
      r.precinctNumber || "",
    ];

    cells.forEach((v, i) => {
      const c = row.getCell(i + 1);
      c.value = v;
      c.font = { name: "Calibri", size: 12 };
      c.alignment = { horizontal: "center", wrapText: true };
      c.border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
    });

    row.commit();
  });

  const totalRowIndex = dataStartRow + residents.length;
  const totalRow = ws.getRow(totalRowIndex);
  ws.mergeCells(`A${totalRowIndex}:L${totalRowIndex}`);
  totalRow.getCell(1).value = `TOTAL SENIOR CITIZENS: ${residents.length}`;
  totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  totalRow.getCell(1).font = { name: "Times New Roman", size: 10, bold: true };
  for (let c = 1; c <= 12; c++) totalRow.getCell(c).border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
  totalRow.commit();

  footerImgs.forEach((d) => {
    const off = rowsNeeded;
    if (d.range?.tl) d.range.tl.nativeRow += off;
    if (d.range?.br) d.range.br.nativeRow += off;
  });

  const newDateRowIndex = footerEnd + rowsNeeded + 1;
  ws.insertRow(newDateRowIndex - 1, []);
  ws.insertRow(newDateRowIndex, []);
  const dateRow = ws.getRow(newDateRowIndex + 1);
  dateRow.height = 40;

  const formattedDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  ws.mergeCells(`C${dateRow.number}:D${dateRow.number}`);
  const dateCell1 = dateRow.getCell(3);
  dateCell1.value = `${formattedDate}\nDate`;
  dateCell1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  dateCell1.font = { name: "Calibri", size: 11, italic: true, bold: true };

  ws.mergeCells(`H${dateRow.number}:I${dateRow.number}`);
  const dateCell2 = dateRow.getCell(8);
  dateCell2.value = `${formattedDate}\nDate`;
  dateCell2.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  dateCell2.font = { name: "Calibri", size: 11, italic: true, bold: true };

  ws.pageSetup = { horizontalCentered: true, verticalCentered: false, orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const uploadedName = `Senior_Citizen_Report_${year}.xlsx`;
  const out = await uploadWorkbook(storage, wb, uploadedName);
  return { ...out, label: String(year) };
}

// ———————————————————————————————————
// STUDENT DEMOGRAPHIC (XLSX)
// ———————————————————————————————————
export async function generateStudentDemographicXlsx(params: {
  db: Firestore;
  storage: FirebaseStorage;
}): Promise<GeneratedXlsx> {
  const { db, storage } = params;

  const now = new Date();
  const year = now.getFullYear();
  const title = `STUDENT DEMOGRAPHIC REPORT ${year}`;

  const residentRef = collection(db, "Residents");
  const q = query(residentRef);
  const snap = await getDocs(q);

  const residents = snap.docs
    .map((d) => d.data() as any)
    .filter((r) => r.isStudent === true || (r.age !== undefined && r.age <= 18));

  if (residents.length === 0) {
    const err = new Error("No student records found.");
    (err as any).code = "NO_DATA";
    throw err;
  }

  const arr = await loadTemplateFromStorage(storage, "ReportsModule/AdminStaff/INHABITANT RECORD TEMPLATE.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arr);
  const ws = wb.worksheets[0];

  ws.getCell("A1").value = "BARANGAY FAIRVIEW\nRECORD OF BARANGAY DEMOGRAPHICS";
  ws.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
  ws.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
  ws.getCell("A2").value = title;

  const dataStartRow = 4;
  const footerStart = 24;
  const footerEnd = 28;

  const footerImgs = ws.getImages().filter((img) => {
    const r = img.range?.tl?.nativeRow;
    return r >= (footerStart - 1) && r <= (footerEnd - 1);
  });

  const rowsNeeded = Math.max(0, dataStartRow + residents.length - (footerStart - 1));
  ws.insertRows(footerStart - 1, new Array(rowsNeeded).fill([]));

  residents.sort((a, b) => {
    const lastA = (a.lastName || "").trim().toUpperCase();
    const lastB = (b.lastName || "").trim().toUpperCase();
    const firstA = (a.firstName || "").trim().toUpperCase();
    const firstB = (b.firstName || "").trim().toUpperCase();
    const addrA = (a.address || "").trim().toUpperCase();
    const addrB = (b.address || "").trim().toUpperCase();
    if (lastA === lastB) return firstA === firstB ? addrA.localeCompare(addrB) : firstA.localeCompare(firstB);
    return lastA.localeCompare(lastB);
  });

  residents.forEach((r, idx) => {
    const rowIdx = dataStartRow + idx;
    const row = ws.getRow(rowIdx);
    row.height = 55;

    const fullName = `${r.lastName || ""}, ${r.firstName || ""} ${r.middleName || ""}`.trim();
    const cells = [
      (idx + 1).toString(),
      fullName,
      r.address || "",
      r.dateOfBirth || "",
      r.placeOfBirth || "",
      r.age || "",
      r.sex || "",
      r.civilStatus || "",
      r.occupation || "",
      r.contactNumber || "",
      r.emailAddress || "",
      r.precinctNumber || "",
    ];

    cells.forEach((v, i) => {
      const c = row.getCell(i + 1);
      c.value = v;
      c.font = { name: "Calibri", size: 12 };
      c.alignment = { horizontal: "center", wrapText: true };
      c.border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
    });

    row.commit();
  });

  const totalRowIndex = dataStartRow + residents.length;
  const totalRow = ws.getRow(totalRowIndex);
  ws.mergeCells(`A${totalRowIndex}:L${totalRowIndex}`);
  totalRow.getCell(1).value = `TOTAL STUDENTS/MINORS: ${residents.length}`;
  totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  totalRow.getCell(1).font = { name: "Times New Roman", size: 10, bold: true };
  for (let c = 1; c <= 12; c++) totalRow.getCell(c).border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
  totalRow.commit();

  footerImgs.forEach((d) => {
    const off = rowsNeeded;
    if (d.range?.tl) d.range.tl.nativeRow += off;
    if (d.range?.br) d.range.br.nativeRow += off;
  });

  const newDateRowIndex = footerEnd + rowsNeeded + 1;
  ws.insertRow(newDateRowIndex - 1, []);
  ws.insertRow(newDateRowIndex, []);
  const dateRow = ws.getRow(newDateRowIndex + 1);
  dateRow.height = 40;

  const formattedDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  ws.mergeCells(`C${dateRow.number}:D${dateRow.number}`);
  const dateCell1 = dateRow.getCell(3);
  dateCell1.value = `${formattedDate}\nDate`;
  dateCell1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  dateCell1.font = { name: "Calibri", size: 11, italic: true, bold: true };

  ws.mergeCells(`H${dateRow.number}:I${dateRow.number}`);
  const dateCell2 = dateRow.getCell(8);
  dateCell2.value = `${formattedDate}\nDate`;
  dateCell2.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  dateCell2.font = { name: "Calibri", size: 11, italic: true, bold: true };

  ws.pageSetup = { horizontalCentered: true, verticalCentered: false, orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const uploadedName = `Student_Demographic_Report_${year}.xlsx`;
  const out = await uploadWorkbook(storage, wb, uploadedName);
  return { ...out, label: String(year) };
}

// ———————————————————————————————————
// PWD DEMOGRAPHIC (XLSX)
// ———————————————————————————————————

export async function generatePwdDemographicXlsx(params: {
  db: Firestore;
  storage: FirebaseStorage;
}): Promise<GeneratedXlsx> {
  const { db, storage } = params;

  const now = new Date();
  const year = now.getFullYear();
  const title = `PWD DEMOGRAPHIC REPORT ${year}`;

  const residentRef = collection(db, "Residents");
  const q = query(residentRef);
  const snap = await getDocs(q);

  const todayStr = new Date().toISOString().split("T")[0];
  const today = new Date(todayStr);

  const residents = snap.docs
    .map(d => d.data() as any)
    .filter(r => r.isPWD === true)
    .filter(r => {
      const type = (r.pwdType || "").toLowerCase();
      if (type === "permanent") return !!r.pwdIdFileURL;
      if (type === "temporary") {
        if (!r.pwdTemporaryUntil) return false;
        const until = new Date(r.pwdTemporaryUntil);
        return until >= today;
      }
      return false;
    });

  if (residents.length === 0) {
    const err = new Error("No qualified PWD records found.");
    (err as any).code = "NO_DATA";
    throw err;
  }

  const arr = await loadTemplateFromStorage(storage, "ReportsModule/AdminStaff/INHABITANT RECORD TEMPLATE FOR PWD.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arr);
  const ws = wb.worksheets[0];

  ws.getCell("A1").value = "BARANGAY FAIRVIEW\nRECORD OF BARANGAY DEMOGRAPHICS";
  ws.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
  ws.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
  ws.getCell("A2").value = title;

  const dataStartRow = 4;
  const footerStart = 24;
  const footerEnd = 28;

  const footerImgs = ws.getImages().filter(img => {
    const r = img.range?.tl?.nativeRow;
    return r >= (footerStart - 1) && r <= (footerEnd - 1);
  });

  const rowsNeeded = Math.max(0, dataStartRow + residents.length - (footerStart - 1));
  if (rowsNeeded > 0) ws.insertRows(footerStart - 1, new Array(rowsNeeded).fill([]));

  residents.forEach((r, index) => {
    const rowIndex = dataStartRow + index;
    const row = ws.getRow(rowIndex);
    row.height = 55;

    const fullName = `${r.lastName || ""}, ${r.firstName || ""} ${r.middleName || ""}`.trim();
    const cells = [
      (index + 1).toString(),
      fullName,
      r.address || "",
      r.dateOfBirth || "",
      r.placeOfBirth || "",
      r.age || "",
      r.sex || "",
      r.civilStatus || "",
      r.occupation || "",
      r.contactNumber || "",
      r.pwdType || "",
      r.typeOfDisability || "",
      r.emailAddress || "",
      r.precinctNumber || "",
    ];

    cells.forEach((v, i) => {
      const c = row.getCell(i + 1);
      c.value = v;
      c.font = { name: "Calibri", size: 12 };
      c.alignment = { horizontal: "center", wrapText: true };
      c.border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
    });

    row.commit();
  });

  const totalRowIndex = dataStartRow + residents.length;
  const totalRow = ws.getRow(totalRowIndex);
  ws.mergeCells(`A${totalRowIndex}:N${totalRowIndex}`);
  totalRow.getCell(1).value = `TOTAL PWD: ${residents.length}`;
  totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  totalRow.getCell(1).font = { name: "Times New Roman", size: 10, bold: true };
  for (let col = 1; col <= 14; col++) {
    totalRow.getCell(col).border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
  }
  totalRow.commit();

  footerImgs.forEach(d => {
    if (d.range?.tl) d.range.tl.nativeRow += rowsNeeded;
    if (d.range?.br) d.range.br.nativeRow += rowsNeeded;
  });

  const newDateRowIndex = footerEnd + rowsNeeded + 1;
  ws.insertRow(newDateRowIndex - 1, []);
  ws.insertRow(newDateRowIndex, []);
  const dateRow = ws.getRow(newDateRowIndex + 1);
  dateRow.height = 40;

  const formattedDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  ws.mergeCells(`C${dateRow.number}:D${dateRow.number}`);
  const dateCell1 = dateRow.getCell(3);
  dateCell1.value = `${formattedDate}\nDate`;
  dateCell1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  dateCell1.font = { name: "Calibri", size: 11, italic: true, bold: true };

  ws.mergeCells(`H${dateRow.number}:I${dateRow.number}`);
  const dateCell2 = dateRow.getCell(8);
  dateCell2.value = `${formattedDate}\nDate`;
  dateCell2.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  dateCell2.font = { name: "Calibri", size: 11, italic: true, bold: true };

  ws.pageSetup = { horizontalCentered: true, verticalCentered: false, orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const uploadedName = `PWD_Demographic_Report_${year}.xlsx`;
  const out = await uploadWorkbook(storage, wb, uploadedName);
  return { ...out, label: String(year) };
}

// ———————————————————————————————————
// SOLO PARENT DEMOGRAPHIC (XLSX)
// ———————————————————————————————————
export async function generateSoloParentDemographicXlsx(params: {
  db: Firestore;
  storage: FirebaseStorage;
}): Promise<GeneratedXlsx> {
  const { db, storage } = params;

  const now = new Date();
  const year = now.getFullYear();
  const title = `SOLO PARENT DEMOGRAPHIC REPORT ${year}`;

  const residentRef = collection(db, "Residents");
  const q = query(residentRef);
  const snap = await getDocs(q);

  const residents = snap.docs.map(d => d.data() as any).filter(r => r.isSoloParent === true);

  if (residents.length === 0) {
    const err = new Error("No solo parent records found.");
    (err as any).code = "NO_DATA";
    throw err;
  }

  residents.sort((a, b) => {
    const lastA = (a.lastName || "").trim().toUpperCase();
    const lastB = (b.lastName || "").trim().toUpperCase();
    const firstA = (a.firstName || "").trim().toUpperCase();
    const firstB = (b.firstName || "").trim().toUpperCase();
    const addrA = (a.address || "").trim().toUpperCase();
    const addrB = (b.address || "").trim().toUpperCase();
    if (lastA === lastB) return firstA === firstB ? addrA.localeCompare(addrB) : firstA.localeCompare(firstB);
    return lastA.localeCompare(lastB);
  });

  const arr = await loadTemplateFromStorage(storage, "ReportsModule/AdminStaff/INHABITANT RECORD TEMPLATE.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arr);
  const ws = wb.worksheets[0];

  ws.getCell("A1").value = "BARANGAY FAIRVIEW\nRECORD OF BARANGAY DEMOGRAPHICS";
  ws.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
  ws.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
  ws.getCell("A2").value = title;

  const dataStartRow = 4;
  const footerStart = 24;
  const footerEnd = 28;

  const footerImgs = ws.getImages().filter(img => {
    const r = img.range?.tl?.nativeRow;
    return r >= (footerStart - 1) && r <= (footerEnd - 1);
  });

  const rowsNeeded = Math.max(0, dataStartRow + residents.length - (footerStart - 1));
  ws.insertRows(footerStart - 1, new Array(rowsNeeded).fill([]));

  residents.forEach((r, idx) => {
    const rowIdx = dataStartRow + idx;
    const row = ws.getRow(rowIdx);
    row.height = 55;

    const fullName = `${r.lastName || ""}, ${r.firstName || ""} ${r.middleName || ""}`.trim();
    const cells = [
      (idx + 1).toString(),
      fullName,
      r.address || "",
      r.dateOfBirth || "",
      r.placeOfBirth || "",
      r.age || "",
      r.sex || "",
      r.civilStatus || "",
      r.occupation || "",
      r.contactNumber || "",
      r.emailAddress || "",
      r.precinctNumber || "",
    ];

    cells.forEach((v, i) => {
      const c = row.getCell(i + 1);
      c.value = v;
      c.font = { name: "Calibri", size: 12 };
      c.alignment = { horizontal: "center", wrapText: true };
      c.border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
    });

    row.commit();
  });

  const totalRowIndex = dataStartRow + residents.length;
  const totalRow = ws.getRow(totalRowIndex);
  ws.mergeCells(`A${totalRowIndex}:L${totalRowIndex}`);
  totalRow.getCell(1).value = `TOTAL SOLO PARENTS: ${residents.length}`;
  totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  totalRow.getCell(1).font = { name: "Times New Roman", size: 10, bold: true };
  for (let c = 1; c <= 12; c++) totalRow.getCell(c).border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
  totalRow.commit();

  footerImgs.forEach(d => {
    const off = rowsNeeded;
    if (d.range?.tl) d.range.tl.nativeRow += off;
    if (d.range?.br) d.range.br.nativeRow += off;
  });

  const newDateRowIndex = footerEnd + rowsNeeded + 1;
  ws.insertRow(newDateRowIndex - 1, []);
  ws.insertRow(newDateRowIndex, []);
  const dateRow = ws.getRow(newDateRowIndex + 1);
  dateRow.height = 40;

  const formattedDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  ws.mergeCells(`C${dateRow.number}:D${dateRow.number}`);
  const dateCell1 = dateRow.getCell(3);
  dateCell1.value = `${formattedDate}\nDate`;
  dateCell1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  dateCell1.font = { name: "Calibri", size: 11, italic: true, bold: true };

  ws.mergeCells(`H${dateRow.number}:I${dateRow.number}`);
  const dateCell2 = dateRow.getCell(8);
  dateCell2.value = `${formattedDate}\nDate`;
  dateCell2.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  dateCell2.font = { name: "Calibri", size: 11, italic: true, bold: true };

  ws.pageSetup = { horizontalCentered: true, verticalCentered: false, orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const uploadedName = `Solo_Parent_Demographic_Report_${year}.xlsx`;
  const out = await uploadWorkbook(storage, wb, uploadedName);
  return { ...out, label: String(year) };
}

// ———————————————————————————————————
// RESIDENT REGISTRATION SUMMARY (XLSX)
// ———————————————————————————————————
const startOfMonth = (y: number, m: number) => new Date(y, m, 1, 0, 0, 0, 0);
const endExclusiveOfMonth = (y: number, m: number) => new Date(y, m + 1, 1, 0, 0, 0, 0);
const monthNameUpper = (y: number, m: number) => new Date(y, m).toLocaleString("default", { month: "long" }).toUpperCase();

function buildReportLabel(
  startMonth: number, startYear: number, endMonth: number, endYear: number, allTime: boolean
) {
  if (allTime) return "ALL TIME";
  if (startMonth === endMonth && startYear === endYear) {
    return `${monthNameUpper(endYear, endMonth)} ${endYear}`;
  }
  return `${monthNameUpper(startYear, startMonth)} ${startYear} – ${monthNameUpper(endYear, endMonth)} ${endYear}`;
}

function buildFileLabel(
  startMonth: number, startYear: number, endMonth: number, endYear: number, allTime: boolean
) {
  if (allTime) return "ALL_TIME";
  if (startMonth === endMonth && startYear === endYear) {
    const m = new Date(endYear, endMonth).toLocaleString("default", { month: "long" });
    return `${m}_${endYear}`.replace(/\s+/g, "_");
  }
  const sm = new Date(startYear, startMonth).toLocaleString("default", { month: "long" });
  const em = new Date(endYear, endMonth).toLocaleString("default", { month: "long" });
  return `${sm}_${startYear}__to__${em}_${endYear}`.replace(/\s+/g, "_");
}

const toJSDate = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val?.toDate === "function") return val.toDate();
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

export async function generateResidentRegistrationSummaryXlsx(params: {
  db: Firestore;
  storage: FirebaseStorage;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  allTime?: boolean;
}): Promise<GeneratedXlsx & { labelHuman: string; labelFile: string }> {
  const { db, storage, startMonth, startYear, endMonth, endYear, allTime = false } = params;

  const reportLabel = buildReportLabel(startMonth, startYear, endMonth, endYear, allTime);
  const reportTitle = `RESIDENT REGISTRATION SUMMARY - ${reportLabel}`;

  const residentRef = collection(db, "Residents");
  const q = query(residentRef);
  const snap = await getDocs(q);

  const rangeStart = startOfMonth(startYear, startMonth);
  const rangeEndExclusive = endExclusiveOfMonth(endYear, endMonth);

  let residents = snap.docs
    .map((d) => d.data() as any)
    .filter((res) => {
      const d = toJSDate(res.createdAt);
      if (!d) return false;
      if (allTime) return true;
      return d >= rangeStart && d < rangeEndExclusive;
    });

  if (residents.length === 0) {
    const err = new Error(allTime ? "No registered residents found." : "No residents found in the selected range.");
    (err as any).code = "NO_DATA";
    throw err;
  }

  residents.sort((a, b) => {
    const lastA = (a.lastName || "").trim().toUpperCase();
    const lastB = (b.lastName || "").trim().toUpperCase();
    const firstA = (a.firstName || "").trim().toUpperCase();
    const firstB = (b.firstName || "").trim().toUpperCase();
    const addrA = (a.address || "").trim().toUpperCase();
    const addrB = (b.address || "").trim().toUpperCase();
    if (lastA === lastB) return firstA === firstB ? addrA.localeCompare(addrB) : firstA.localeCompare(firstB);
    return lastA.localeCompare(lastB);
  });

  const arr = await loadTemplateFromStorage(storage, "ReportsModule/AdminStaff/INHABITANT RECORD TEMPLATE.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arr);
  const ws = wb.worksheets[0];

  ws.getCell("A1").value = "BARANGAY FAIRVIEW\nRESIDENT REGISTRATION SUMMARY";
  ws.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
  ws.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
  ws.getCell("A2").value = reportTitle;

  const footerStart = 24;
  const footerEnd = 28;
  let insertionRow = 4;

  const rowsNeeded = Math.max(0, insertionRow + residents.length - (footerStart - 1));
  ws.insertRows(footerStart - 1, new Array(rowsNeeded).fill([]));

  residents.forEach((r, idx) => {
    const row = ws.getRow(insertionRow);
    row.height = 55;

    const fullName = `${r.lastName || ""}, ${r.firstName || ""} ${r.middleName || ""}`.trim();
    const cells = [
      (idx + 1).toString(),
      fullName,
      r.address || "",
      r.dateOfBirth || "",
      r.placeOfBirth || "",
      r.age || "",
      r.sex || "",
      r.civilStatus || "",
      r.occupation || "",
      r.contactNumber || "",
      r.emailAddress || "",
      r.precinctNumber || "",
    ];

    cells.forEach((v, i) => {
      const c = row.getCell(i + 1);
      c.value = v;
      c.font = { name: "Calibri", size: 12 };
      c.alignment = { horizontal: "center", wrapText: true };
      c.border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
    });

    row.commit();
    insertionRow++;
  });

  const totalRow = ws.getRow(insertionRow);
  ws.mergeCells(`A${insertionRow}:L${insertionRow}`);
  totalRow.getCell(1).value = `TOTAL: ${residents.length}`;
  totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  totalRow.getCell(1).font = { name: "Times New Roman", size: 10 };
  totalRow.commit();

  const footerImgs = ws.getImages().filter((img: any) => {
    const r = img.range?.tl?.nativeRow;
    return r >= (footerStart - 1) && r <= (footerEnd - 1);
  });
  footerImgs.forEach((d: any) => {
    if (d.range?.tl) d.range.tl.nativeRow += residents.length;
    if (d.range?.br) d.range.br.nativeRow += residents.length;
  });

  const dateInsertRowIndex = footerEnd + residents.length + 2;
  ws.insertRow(dateInsertRowIndex - 1, []);
  ws.insertRow(dateInsertRowIndex, []);
  const dateRow = ws.getRow(dateInsertRowIndex + 1);
  dateRow.height = 40;

  const formattedDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  ws.mergeCells(`C${dateRow.number}:D${dateRow.number}`);
  const dateCell1 = dateRow.getCell(3);
  dateCell1.value = `${formattedDate}\nDate`;
  dateCell1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  dateCell1.font = { name: "Calibri", size: 11, italic: true, bold: true };

  ws.mergeCells(`H${dateRow.number}:I${dateRow.number}`);
  const dateCell2 = dateRow.getCell(8);
  dateCell2.value = `${formattedDate}\nDate`;
  dateCell2.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  dateCell2.font = { name: "Calibri", size: 11, italic: true, bold: true };

  ws.pageSetup = { horizontalCentered: true, orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const labelHuman = reportLabel;
  const labelFile = buildFileLabel(startMonth, startYear, endMonth, endYear, allTime);
  const uploadedName = `Resident_Registration_Summary_${labelFile}.xlsx`;
  const out = await uploadWorkbook(storage, wb, uploadedName);
  return { ...out, label: labelHuman, labelHuman, labelFile };
}

// ———————————————————————————————————
// RESIDENT MASTERLIST (INHABITANT RECORD) (XLSX)
// ———————————————————————————————————
export async function generateResidentMasterlistXlsx(params: {
  db: Firestore;
  storage: FirebaseStorage;
}): Promise<GeneratedXlsx> {
  const { db, storage } = params;

  const now = new Date();
  const year = now.getFullYear();
  const title = `RECORD OF BARANGAY INHABITANTS ${year}`;

  const residentRef = collection(db, "Residents");
  const q = query(residentRef);
  const snap = await getDocs(q);

  let residents = snap.docs.map(d => d.data() as any);
  if (residents.length === 0) {
    const err = new Error("No residents found.");
    (err as any).code = "NO_DATA";
    throw err;
  }

  residents.sort((a, b) => {
    const lastA = (a.lastName || "").trim().toUpperCase();
    const lastB = (b.lastName || "").trim().toUpperCase();
    const firstA = (a.firstName || "").trim().toUpperCase();
    const firstB = (b.firstName || "").trim().toUpperCase();
    const addrA = (a.address || "").trim().toUpperCase();
    const addrB = (b.address || "").trim().toUpperCase();
    if (lastA === lastB) return firstA === firstB ? addrA.localeCompare(addrB) : firstA.localeCompare(firstB);
    return lastA.localeCompare(lastB);
  });

  const arr = await loadTemplateFromStorage(storage, "ReportsModule/AdminStaff/INHABITANT RECORD TEMPLATE.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arr);
  const ws = wb.worksheets[0];

  ws.getCell("A1").value = "BARANGAY FAIRVIEW\nRECORD OF BARANGAY INHABITANTS";
  ws.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
  ws.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
  ws.getCell("A2").value = title;

  const footerStart = 24;
  const footerEnd = 28;

  let insertionRow = 4;
  const rowsNeeded = Math.max(0, insertionRow + residents.length);
  ws.insertRows(footerStart - 1, new Array(rowsNeeded).fill([]));

  residents.forEach((r, idx) => {
    const row = ws.getRow(insertionRow);
    row.height = 55;

    const fullName = `${r.lastName || ""}, ${r.firstName || ""} ${r.middleName || ""}`.trim();
    const cells = [
      (idx + 1).toString(),
      fullName,
      r.address || "",
      r.dateOfBirth || "",
      r.placeOfBirth || "",
      r.age || "",
      r.sex || "",
      r.civilStatus || "",
      r.occupation || "",
      r.contactNumber || "",
      r.emailAddress || "",
      r.precinctNumber || "",
    ];

    cells.forEach((v, i) => {
      const c = row.getCell(i + 1);
      c.value = v;
      c.font = { name: "Calibri", size: 12, bold: false };
      c.alignment = { horizontal: "center", wrapText: true };
      c.border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
    });

    row.commit();
    insertionRow++;
  });

  const totalRow = ws.getRow(insertionRow);
  ws.mergeCells(`A${insertionRow}:L${insertionRow}`);
  totalRow.getCell(1).value = `TOTAL: ${residents.length}`;
  totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  totalRow.getCell(1).font = { name: "Times New Roman", size: 10, bold: false };
  totalRow.commit();

  const totalInsertedRows = rowsNeeded - 4;
  const footerImgs = ws.getImages().filter(img => {
    const r = img.range?.tl?.nativeRow;
    return r >= (footerStart - 1) && r <= (footerEnd - 1);
  });
  footerImgs.forEach(d => {
    if (d.range?.tl) d.range.tl.nativeRow += totalInsertedRows;
    if (d.range?.br) d.range.br.nativeRow += totalInsertedRows;
  });

  const dateInsertRowIndex = footerEnd + totalInsertedRows + 2;
  ws.insertRow(dateInsertRowIndex - 1, []);
  ws.insertRow(dateInsertRowIndex, []);

  const dateRow = ws.getRow(dateInsertRowIndex + 1);
  dateRow.height = 40;

  const formattedDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  ws.mergeCells(`C${dateRow.number}:D${dateRow.number}`);
  const dateCell1 = dateRow.getCell(3);
  dateCell1.value = `${formattedDate}\nDate`;
  dateCell1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  dateCell1.font = { name: "Calibri", size: 11, italic: true, bold: true };

  ws.mergeCells(`H${dateRow.number}:I${dateRow.number}`);
  const dateCell2 = dateRow.getCell(8);
  dateCell2.value = `${formattedDate}\nDate`;
  dateCell2.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  dateCell2.font = { name: "Calibri", size: 11, italic: true, bold: true };

  ws.pageSetup = { horizontalCentered: true, verticalCentered: false, orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const uploadedName = `Inhabitant_Record_${year}.xlsx`;
  const out = await uploadWorkbook(storage, wb, uploadedName);
  return { ...out, label: String(year) };
}

// ———————————————————————————————————
// Helpers (local to this section)
// ———————————————————————————————————
function safeMergeCells(ws: ExcelJS.Worksheet, range: string) {
  try { ws.mergeCells(range); }
  catch (e: any) { console.warn(`Skipping merge for ${range}: ${e?.message ?? e}`); }
}

type ClusterGroup = Record<string, (r: any) => boolean>;

function toUpperIncludes(hay?: string, needle?: string) {
  if (!hay || !needle) return false;
  return hay.toUpperCase().includes(needle.toUpperCase());
}

function sortByName(a: any, b: any) {
  const lastA = (a.lastName || "").trim().toUpperCase();
  const lastB = (b.lastName || "").trim().toUpperCase();
  const firstA = (a.firstName || "").trim().toUpperCase();
  const firstB = (b.firstName || "").trim().toUpperCase();
  return lastA === lastB ? firstA.localeCompare(firstB) : lastA.localeCompare(lastB);
}

async function generateClusteredResidentListXlsx(params: {
  db: Firestore;
  storage: FirebaseStorage;
  locationLabel: string;      // "EAST FAIRVIEW" | "WEST FAIRVIEW" | "SOUTH FAIRVIEW"
  locationMatch: string;      // "East Fairview"  | "West Fairview" | "South Fairview"
  groups: ClusterGroup;       // label -> predicate(resident)
  outFilePrefix: string;      // "EastFairview" etc.
}): Promise<GeneratedXlsx> {
  const { db, storage, locationLabel, locationMatch, groups, outFilePrefix } = params;

  const now = new Date();
  const year = now.getFullYear();
  const reportTitle = `RECORD OF BARANGAY INHABITANTS ${year} - ${locationLabel}`;

  const snap = await getDocs(query(collection(db, "Residents")));
  const residents = snap.docs.map(d => d.data() as any);

  // Build grouped arrays
  const groupedEntries = Object.entries(groups).map(([label, pred]) => [label, residents.filter(r => r.generalLocation === locationMatch && pred(r))] as const);
  const filteredGroups = groupedEntries.filter(([, arr]) => arr.length > 0);

  if (filteredGroups.length === 0) {
    const err = new Error(`No residents found for ${locationLabel}.`);
    (err as any).code = "NO_DATA";
    throw err;
  }

  // Template
  const arr = await loadTemplateFromStorage(storage, "ReportsModule/AdminStaff/INHABITANT RECORD TEMPLATE.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arr);
  const ws = wb.worksheets[0];

  // Header
  ws.getCell("A1").value = "BARANGAY FAIRVIEW\nRECORD OF BARANGAY INHABITANTS";
  ws.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
  ws.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
  ws.getCell("A2").value = reportTitle;

  // Footer/drawings info
  const footerStart = 24;
  const footerEnd = 28;

  const totalResidents = filteredGroups.reduce((sum, [, members]) => sum + members.length, 0);
  let insertionRow = 4;

  // Insert enough rows before footer
  const rowsNeeded = Math.max(0, insertionRow + totalResidents);
  ws.insertRows(footerStart - 1, new Array(rowsNeeded).fill([]));

  const footerImgs = ws.getImages().filter(img => {
    const r = img.range?.tl?.nativeRow;
    return r >= (footerStart - 1) && r <= (footerEnd - 1);
  });

  // Render groups
  let counter = 1;
  for (const [groupLabel, members] of filteredGroups) {
    members.sort(sortByName);

    // Group header (merged A..L)
    safeMergeCells(ws, `A${insertionRow}:L${insertionRow}`);
    const headerRow = ws.getRow(insertionRow);
    const headerCell = headerRow.getCell(1);
    headerCell.value = groupLabel;
    headerCell.font = { name: "Times New Roman", size: 14, bold: true };
    headerCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    headerCell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    headerRow.height = 25;
    headerRow.commit();
    insertionRow++;

    // Members
    members.forEach((resident: any) => {
      const row = ws.getRow(insertionRow);
      row.height = 55;
      const fullName = `${resident.lastName || ""}, ${resident.firstName || ""} ${resident.middleName || ""}`.trim();

      const cells = [
        counter,
        fullName,
        resident.address || "",
        resident.dateOfBirth || "",
        resident.placeOfBirth || "",
        resident.age || "",
        resident.sex || "",
        resident.civilStatus || "",
        resident.occupation || "",
        resident.contactNumber || "",
        resident.emailAddress || "",
        resident.precinctNumber || "",
      ];

      cells.forEach((v, i) => {
        const c = row.getCell(i + 1);
        c.value = v;
        c.font = { name: "Calibri", size: 12 };
        c.alignment = { horizontal: "center", wrapText: true };
        c.border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
      });

      row.commit();
      insertionRow++;
      counter++;
    });

    // Group total
    const totalRow = ws.getRow(insertionRow);
    safeMergeCells(ws, `A${insertionRow}:L${insertionRow}`);
    totalRow.getCell(1).value = `TOTAL: ${members.length}`;
    totalRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    totalRow.getCell(1).font = { name: "Times New Roman", size: 12, italic: true, bold: true };
    totalRow.getCell(1).border = { bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
    totalRow.commit();
    insertionRow++;
  }

  // Shift footer drawings
  footerImgs.forEach(d => {
    if (d.range?.tl) d.range.tl.nativeRow += rowsNeeded;
    if (d.range?.br) d.range.br.nativeRow += rowsNeeded;
  });

  // Dual date row
  const newDateRowIndex = footerEnd + rowsNeeded + 1;
  ws.insertRow(newDateRowIndex - 1, []);
  ws.insertRow(newDateRowIndex, []);
  const dateRow = ws.getRow(newDateRowIndex + 1);
  dateRow.height = 40;

  const formattedDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  safeMergeCells(ws, `C${dateRow.number}:D${dateRow.number}`);
  const dateCell1 = dateRow.getCell(3);
  dateCell1.value = `${formattedDate}\nDate`;
  dateCell1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  dateCell1.font = { name: "Calibri", size: 11, italic: true, bold: true };

  safeMergeCells(ws, `H${dateRow.number}:I${dateRow.number}`);
  const dateCell2 = dateRow.getCell(8);
  dateCell2.value = `${formattedDate}\nDate`;
  dateCell2.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  dateCell2.font = { name: "Calibri", size: 11, italic: true, bold: true };

  // Page setup & upload
  ws.pageSetup = { horizontalCentered: true, verticalCentered: false, orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const uploadedName = `Inhabitant_Record_${outFilePrefix}_${year}.xlsx`;
  const out = await uploadWorkbook(storage, wb, uploadedName);
  return { ...out, label: String(year) };
}

// ———————————————————————————————————
// EAST FAIRVIEW
// ———————————————————————————————————
export async function generateEastResidentListXlsx(params: {
  db: Firestore;
  storage: FirebaseStorage;
}): Promise<GeneratedXlsx> {
  const groups: ClusterGroup = {
    RINA: (r) => toUpperIncludes(r.cluster, "RINA"),
    SAMAFA: (r) => toUpperIncludes(r.cluster, "SAMAFA"),
    SAMAPLI: (r) => toUpperIncludes(r.cluster, "SAMAPLI"),
    "SITIO KISLAP": (r) => toUpperIncludes(r.cluster, "SITIO KISLAP"),
    EFHAI: (r) => toUpperIncludes(r.cluster, "EFHAI"),
  };
  return generateClusteredResidentListXlsx({
    ...params,
    locationLabel: "EAST FAIRVIEW",
    locationMatch: "East Fairview",
    groups,
    outFilePrefix: "EastFairview",
  });
}

// ———————————————————————————————————
// WEST FAIRVIEW
// ———————————————————————————————————
export async function generateWestResidentListXlsx(params: {
  db: Firestore;
  storage: FirebaseStorage;
}): Promise<GeneratedXlsx> {
  const groups: ClusterGroup = {
    AUSTIN: (r) => toUpperIncludes(r.cluster, "AUSTIN"),
    "BASILIO 1": (r) => toUpperIncludes(r.cluster, "BASILIO 1"),
    DARISNAI: (r) => toUpperIncludes(r.cluster, "DARISNAI"),
    "MUSTANG BENZ": (r) => toUpperIncludes(r.cluster, "MUSTANG BENZ"),
    ULNA: (r) => toUpperIncludes(r.cluster, "ULNA"),
    "UNITED FAIRLANE": (r) => toUpperIncludes(r.cluster, "UNITED FAIRLANE"),
    URLINA: (r) => toUpperIncludes(r.cluster, "URLINA"),
    "VERBENA 1": (r) => toUpperIncludes(r.cluster, "VERBENA 1"),
    "WEST FAIRVIEW HOA": (r) => toUpperIncludes(r.cluster, "WEST FAIRVIEW HOA"),
    "TULIP RESIDENCES HOA": (r) => toUpperIncludes(r.cluster, "TULIP RESIDENCES HOA"),
  };
  return generateClusteredResidentListXlsx({
    ...params,
    locationLabel: "WEST FAIRVIEW",
    locationMatch: "West Fairview",
    groups,
    outFilePrefix: "WestFairview",
  });
}

// ———————————————————————————————————
// SOUTH FAIRVIEW
// ———————————————————————————————————
export async function generateSouthResidentListXlsx(params: {
  db: Firestore;
  storage: FirebaseStorage;
}): Promise<GeneratedXlsx> {
  const groups: ClusterGroup = {
    AKAP: (r) => toUpperIncludes(r.cluster, "AKAP"),
    ARNAI: (r) => toUpperIncludes(r.cluster, "ARNAI"),
    "F.L.N.A": (r) => toUpperIncludes(r.cluster, "F.L.N.A"),
    FEWRANO: (r) => toUpperIncludes(r.cluster, "FEWRANO"),
    "UPPER CORVETTE HOA": (r) => toUpperIncludes(r.cluster, "UPPER CORVETTE HOA"),
  };
  return generateClusteredResidentListXlsx({
    ...params,
    locationLabel: "SOUTH FAIRVIEW",
    locationMatch: "South Fairview",
    groups,
    outFilePrefix: "SouthFairview",
  });
}
