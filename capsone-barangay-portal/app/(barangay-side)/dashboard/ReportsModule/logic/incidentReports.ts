// app/(barangay-side)/dashboard/ReportsModule/logic/incidentReports.ts
import { Firestore, collection, getDocs, query, where } from "firebase/firestore";
import { FirebaseStorage, ref, getDownloadURL, uploadBytes } from "firebase/storage";
import ExcelJS from "exceljs";

// tiny helpers (duplication is fine per your preference)
const toJSDate = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val?.toDate === "function") return val.toDate();
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};
const startOfMonth = (y: number, m: number) => new Date(y, m, 1, 0, 0, 0, 0);
const endExclusiveOfMonth = (y: number, m: number) => new Date(y, m + 1, 1, 0, 0, 0, 0);
const monthNameUpper = (y: number, m: number) =>
  new Date(y, m).toLocaleString("default", { month: "long" }).toUpperCase();
const buildReportLabel = (
  startMonth: number, startYear: number, endMonth: number, endYear: number, allTime: boolean
) => {
  if (allTime) return "ALL TIME";
  if (startMonth === endMonth && startYear === endYear) return `${monthNameUpper(endYear, endMonth)} ${endYear}`;
  return `${monthNameUpper(startYear, startMonth)} ${startYear} – ${monthNameUpper(endYear, endMonth)} ${endYear}`;
};
const buildFileLabel = (
  startMonth: number, startYear: number, endMonth: number, endYear: number, allTime: boolean
) => {
  if (allTime) return "ALL_TIME";
  if (startMonth === endMonth && startYear === endYear) {
    const m = new Date(endYear, endMonth).toLocaleString("default", { month: "long" });
    return `${m}_${endYear}`.replace(/\s+/g, "_");
  }
  const sm = new Date(startYear, startMonth).toLocaleString("default", { month: "long" });
  const em = new Date(endYear, endMonth).toLocaleString("default", { month: "long" });
  return `${sm}_${startYear}__to__${em}_${endYear}`.replace(/\s+/g, "_");
};
async function loadTemplate(storage: FirebaseStorage, path: string) {
  const t = ref(storage, path);
  const url = await getDownloadURL(t);
  const res = await fetch(url);
  return await res.arrayBuffer();
}
async function uploadXlsx(storage: FirebaseStorage, wb: ExcelJS.Workbook, fileName: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const outRef = ref(storage, `GeneratedReports/${fileName}`);
  await uploadBytes(outRef, blob);
  const fileUrl = await getDownloadURL(outRef);
  return { fileUrl, fileName };
}

// ———————————————————————————————————
// 1) Incident Summary (grouped by department)
// ———————————————————————————————————
export async function generateIncidentSummaryXlsx(params: {
  db: Firestore;
  storage: FirebaseStorage;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  allTime?: boolean;
}) {
  const { db, storage, startMonth, startYear, endMonth, endYear, allTime = false } = params;

  const reportLabel = buildReportLabel(startMonth, startYear, endMonth, endYear, allTime);
  const arr = await loadTemplate(storage, "ReportsModule/LFStaff/Summary of Incidents Template.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arr);
  const ws = wb.worksheets[0];

  const qSnap = await getDocs(query(collection(db, "IncidentReports")));
  const rangeStart = startOfMonth(startYear, startMonth);
  const rangeEnd = endExclusiveOfMonth(endYear, endMonth);
  const incidentReports = qSnap.docs.map(d => d.data() as any).filter(rep => {
    const d = toJSDate(rep.createdAt);
    if (!d) return false;
    return allTime || (d >= rangeStart && d < rangeEnd);
  });

  const groups: Record<string, any[]> = {
    Lupon: [], VAWC: [], BCPC: [], GAD: [], Online: [],
  };
  incidentReports.forEach(rep => {
    const dep = rep.department || "Online";
    if (groups[dep as keyof typeof groups]) groups[dep].push(rep);
  });
  Object.keys(groups).forEach(k => {
    groups[k].sort((a, b) => (toJSDate(b.createdAt)?.getTime() || 0) - (toJSDate(a.createdAt)?.getTime() || 0));
  });

  const nonEmpty = Object.entries(groups).filter(([, arr]) => arr.length);
  if (nonEmpty.length === 0) {
    const err = new Error(allTime ? "No incident reports found." : `No incident reports found for ${reportLabel}.`);
    (err as any).code = "NO_DATA";
    throw err;
  }

  ws.getCell("A1").value = "BARANGAY FAIRVIEW\n SUMMARY OF INCIDENTS";
  ws.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
  ws.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
  ws.getCell("A2").value = `BARANGAY FAIRVIEW INCIDENT REPORTS - ${reportLabel}`;

  const originalFooterStartRow = 25;
  const originalFooterEndRow = 28;
  const totalRows = nonEmpty.reduce((s, [, r]) => s + r.length, 0);
  let insertionRow = 4;
  const toInsert = Math.max(0, insertionRow + totalRows + nonEmpty.length);
  for (let i = 0; i < toInsert; i++) ws.insertRow(originalFooterStartRow + i, []);

  const fmtDate = (d: Date | null) => {
    if (!d || isNaN(d.getTime())) return "";
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  for (const [department, reports] of nonEmpty) {
    ws.spliceRows(insertionRow, 1, []);
    const headRange = `A${insertionRow}:E${insertionRow}`;
    try { ws.unMergeCells(headRange); } catch {}
    ws.mergeCells(headRange);
    const hRow = ws.getRow(insertionRow);
    hRow.getCell(1).value = department;
    for (let c = 1; c <= 5; c++) {
      const cell = hRow.getCell(c);
      cell.font = { name: "Times New Roman", size: 20, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
    }
    hRow.height = 25; hRow.commit(); insertionRow++;

    (reports as any[]).forEach(rep => {
      const row = ws.getRow(insertionRow);
      row.height = 55;

      const comp = rep.complainant || {};
      const resp = rep.respondent || {};
      const cName = `${(comp.fname || rep.firstname || "")} ${(comp.lname || rep.lastname || "")}`.trim();
      const rName = `${resp.fname || ""} ${resp.lname || ""}`.trim();

      let received = "";
      if (rep.department === "Online") received = fmtDate(toJSDate(rep.createdAt));
      else received = `${rep.dateReceived || ""} ${rep.timeReceived || ""}`.trim() || fmtDate(toJSDate(rep.createdAt));

      const cells = [
        rep.caseNumber || "",
        ` C- ${cName}\n\n R- ${rName}`,
        received,
        rep.nature || rep.concerns || "",
        rep.status || "",
      ];
      cells.forEach((v, i) => {
        const c = row.getCell(i + 1);
        c.value = v;
        c.font = { name: "Calibri", size: 12 };
        c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        c.border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
      });
      row.commit(); insertionRow++;
    });

    ws.spliceRows(insertionRow, 1, []);
    const totalRange = `A${insertionRow}:E${insertionRow}`;
    try { ws.unMergeCells(totalRange); } catch {}
    ws.mergeCells(totalRange);
    const tRow = ws.getRow(insertionRow);
    tRow.getCell(1).value = `TOTAL: ${(reports as any[]).length}`;
    for (let c = 1; c <= 5; c++) {
      const cell = tRow.getCell(c);
      cell.font = { name: "Times New Roman", size: 12, italic: true, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
    }
    tRow.commit(); insertionRow++;

    ws.getRow(insertionRow).values = ["", "", "", "", ""];
    ws.getRow(insertionRow).height = 5;
    ws.getRow(insertionRow).commit();
    insertionRow++;
  }

  // shift footer drawings
  const footerImgs = ws.getImages().filter(img => {
    const r = img.range?.tl?.nativeRow;
    return r >= originalFooterStartRow - 1 && r <= originalFooterEndRow - 1;
  });
  footerImgs.forEach(d => {
    if (d.range?.tl) d.range.tl.nativeRow += toInsert;
    if (d.range?.br) d.range.br.nativeRow += toInsert;
  });

  const newDateRowIndex = originalFooterEndRow + toInsert + 1;
  ws.insertRow(newDateRowIndex - 1, []); ws.insertRow(newDateRowIndex, []);
  const dateRow = ws.getRow(newDateRowIndex + 1);
  dateRow.height = 40;
  const dateText = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  ws.mergeCells(`B${dateRow.number}:C${dateRow.number}`);
  ws.getCell(`B${dateRow.number}`).value = `${dateText}\nDate`;
  ws.getCell(`B${dateRow.number}`).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  ws.getCell(`B${dateRow.number}`).font = { name: "Calibri", size: 11, italic: true, bold: true };
  ws.mergeCells(`D${dateRow.number}:E${dateRow.number}`);
  ws.getCell(`D${dateRow.number}`).value = `${dateText}\nDate`;
  ws.getCell(`D${dateRow.number}`).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  ws.getCell(`D${dateRow.number}`).font = { name: "Calibri", size: 11, italic: true, bold: true };

  ws.pageSetup = { horizontalCentered: true, orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const fileName = `Incident_Summary_Report_${reportLabel.replace(/\s+/g, "_")}.xlsx`;
  return uploadXlsx(storage, wb, fileName);
}

// ———————————————————————————————————
// 2) Departmental Incident Report
// ———————————————————————————————————
export async function generateDepartmentalIncidentXlsx(params: {
  db: Firestore;
  storage: FirebaseStorage;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  allTime?: boolean;
  department: string; // 'ALL' or exact
  status: string;     // 'ALL' or exact
}) {
  const { db, storage, startMonth, startYear, endMonth, endYear, department, status, allTime = false } = params;

  const reportLabel = buildReportLabel(startMonth, startYear, endMonth, endYear, allTime);
  // pick template
  let templatePath = "ReportsModule/LFStaff/Departmental Incident Reports Template.xlsx";
  if (department === "BCPC") templatePath = "ReportsModule/LFStaff/Departmental Incident BCPC Reports Template.xlsx";
  else if (department === "VAWC") templatePath = "ReportsModule/LFStaff/Departmental Incident VAWC Reports Template.xlsx";
  else if (department === "GAD") templatePath = "ReportsModule/LFStaff/Departmental Incident GAD Reports Template.xlsx";

  const arr = await loadTemplate(storage, templatePath);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arr);
  const ws = wb.worksheets[0];

  ws.getCell("A2").value = `REPORT OF ${department} "${status !== "ALL" ? status : "ALL STATUS"}" CASES${allTime ? " - ALL TIME" : ""}`;
  ws.getCell("A3").value = allTime ? "FOR ALL TIME" : `FOR ${reportLabel}`;

  const qSnap = await getDocs(query(collection(db, "IncidentReports")));
  const rangeStart = startOfMonth(startYear, startMonth);
  const rangeEnd = endExclusiveOfMonth(endYear, endMonth);
  const filtered = qSnap.docs
    .map(d => ({ id: d.id, ...(d.data() as any) }))
    .filter(rep => {
      if (!allTime) {
        const d = toJSDate(rep.createdAt);
        if (!(d && d >= rangeStart && d < rangeEnd)) return false;
      }
      if (department !== "ALL" && rep.department !== department) return false;
      if (status !== "ALL" && rep.status !== status) return false;
      return true;
    })
    .sort((a, b) => (toJSDate(b.createdAt)?.getTime() || 0) - (toJSDate(a.createdAt)?.getTime() || 0));

  if (filtered.length === 0) {
    const err = new Error(allTime
      ? `No reports found for ${department === "ALL" ? "any department" : department}.`
      : `No reports found for ${department === "ALL" ? "any department" : department} in ${reportLabel}.`);
    (err as any).code = "NO_DATA";
    throw err;
  }

  // clear/expand data rows
  const dataStartRow = 5;
  const footerStartRow = 17;
  for (let i = dataStartRow; i < footerStartRow; i++) ws.getRow(i).values = [];
  try { ws.unMergeCells(`A${dataStartRow}:G${footerStartRow + 10}`); } catch {}
  ws.spliceRows(dataStartRow, footerStartRow - dataStartRow);
  ws.insertRows(dataStartRow, new Array(filtered.length).fill([]));

  const footerImgs = ws.getImages().filter(img => img.range?.tl?.nativeRow >= footerStartRow);

  // row render
  for (let i = 0; i < filtered.length; i++) {
    const r = filtered[i];
    const row = ws.getRow(dataStartRow + i);
    row.height = 55;

    const comp = r.complainant ?? {};
    const resp = r.respondent ?? {};
    const cName = (comp.fname || comp.lname) ? `${comp.fname || ""} ${comp.lname || ""}`.trim()
                  : `${r.firstname || ""} ${r.lastname || ""}`.trim();
    const cAge = comp.age ?? "";
    const cAddr = comp.address || r.location || "";
    const rName = `${resp.fname || ""} ${resp.lname || ""}`.trim();
    const rAge = resp.age ?? "";
    const rAddr = resp.address ?? "";

    // remarks via subcollections (best-effort; you can keep in UI side if you prefer)
    // Keeping this logic here for parity with your original code is fine.
    // If you want to simplify, return empty remarks and let UI fetch details later.
    // For now, we’ll keep it minimal: no subcollection fetch to avoid n+1. (Optional)
    let remarks = r.remarks ?? "";

    const createdAt = toJSDate(r.createdAt);
    const createdStr = createdAt ? createdAt.toISOString().split("T")[0] : "";

    const baseConcern = r.nature ?? r.concern ?? r.concerns ?? "";
    const concern = department === "ALL" ? `${baseConcern} (${r.department ?? ""})` : baseConcern;

    const cells = [
      createdStr,
      `C- ${cName}\nR- ${rName}`,
      `C- ${cAge}\nR- ${rAge}`,
      `C- ${cAddr}\nR- ${rAddr}`,
      concern,
      r.status ?? "",
      remarks ?? "",
    ];

    cells.forEach((v, idx) => {
      const c = row.getCell(idx + 1);
      c.value = v;
      c.font = { name: "Calibri", size: 12 };
      c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      c.border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
    });
    row.commit();
  }

  const offset = Math.max(filtered.length - (footerStartRow - dataStartRow), 0);
  footerImgs.forEach(d => {
    if (d.range?.tl) d.range.tl.nativeRow += offset;
    if (d.range?.br) d.range.br.nativeRow += offset;
  });

  ws.pageSetup = { horizontalCentered: true, verticalCentered: false, orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const fileName = `Department_Report_${department}_${status}_${reportLabel.replace(/\s+/g, "_")}.xlsx`;
  return uploadXlsx(storage, wb, fileName);
}

// ———————————————————————————————————
// 3) Lupon Settled (current month)
// ———————————————————————————————————
export async function generateLuponSettledXlsx(params: {
  db: Firestore; storage: FirebaseStorage;
}) {
  const { db, storage } = params;
  const now = new Date();
  const year = now.getFullYear();
  const monthText = now.toLocaleString("default", { month: "long" });

  const qSnap = await getDocs(query(
    collection(db, "IncidentReports"),
    where("department", "==", "Lupon"),
    where("status", "==", "settled")
  ));
  const rows = qSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

  if (rows.length === 0) {
    const err = new Error("No Lupon Settled reports found");
    (err as any).code = "NO_DATA";
    throw err;
  }

  const arr = await loadTemplate(storage, "ReportsModule/LFStaff/Lupon Tagapamayapa Settled Report Template.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arr);
  const ws = wb.worksheets[0];

  ws.getCell("A2").value = `DATE ACCOMPLISHED ${monthText.toUpperCase()} ${year}`;

  const dataStart = 5;
  const footerStart = 21;
  const footerCount = 4;
  ws.spliceRows(footerStart, footerCount);

  let rowIdx = dataStart;
  for (const r of rows) {
    ws.insertRow(rowIdx, []);
    const row = ws.getRow(rowIdx);
    row.height = 55;

    const comp = r.complainant || {};
    const resp = r.respondent || {};
    const cName = `${comp.fname || ""} ${comp.lname || ""}`.trim();
    const rName = `${resp.fname || ""} ${resp.lname || ""}`.trim();

    const cells = [
      r.caseNumber || "",
      `C- ${cName}\nR- ${rName}`,
      r.nature === "Criminal" ? "*" : "",
      r.nature === "Civil" ? "*" : "",
      r.specifyNature || "",
      r.isMediation ? "*" : "",
      r.isConciliation ? "*" : "",
      r.isArbitration ? "*" : "",
      r.status || "",
      r.remarks || "",
    ];
    cells.forEach((v, i) => {
      const c = row.getCell(i + 1);
      c.value = v;
      c.font = { name: "Calibri", size: 12 };
      c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      c.border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
    });
    row.commit(); rowIdx++;
  }

  // add a simple footer spacer
  ws.insertRows(rowIdx, [[], [], [], []]);

  ws.pageSetup = { horizontalCentered: true, verticalCentered: false, orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const fileName = `Lupon_Settled_Report_${monthText}_${year}.xlsx`;
  return uploadXlsx(storage, wb, fileName);
}

// ———————————————————————————————————
// 4) Lupon Pending (current month; Pending/Dismissed)
// ———————————————————————————————————
export async function generateLuponPendingXlsx(params: {
  db: Firestore; storage: FirebaseStorage;
}) {
  const { db, storage } = params;
  const now = new Date();
  const year = now.getFullYear();
  const monthText = now.toLocaleString("default", { month: "long" });

  const qSnap = await getDocs(query(
    collection(db, "IncidentReports"),
    where("department", "==", "Lupon"),
    where("status", "in", ["Pending", "pending", "dismissed", "Dismissed"])
  ));
  const rows = qSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

  const arr = await loadTemplate(storage, "ReportsModule/LFStaff/Lupon Tagapamayapa Pending Report Template.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arr);
  const ws = wb.worksheets[0];

  ws.getCell("A2").value = `DATE ACCOMPLISHED ${monthText.toUpperCase()} ${year}`;
  const dataStart = 5;

  ws.spliceRows(19, 20); // clear any template footers aggressively

  let rowIdx = dataStart;
  for (const r of rows) {
    ws.insertRow(rowIdx, []);
    const row = ws.getRow(rowIdx);
    row.height = 55;

    const comp = r.complainant || {};
    const resp = r.respondent || {};
    const cName = `${comp.fname || ""} ${comp.lname || ""}`.trim();
    const rName = `${resp.fname || ""} ${resp.lname || ""}`.trim();

    const cells = [
      r.caseNumber || "",
      `C- ${cName}\nR- ${rName}`,
      r.nature === "Criminal" ? "*" : "",
      r.nature === "Civil" ? "*" : "",
      !["Civil", "Criminal"].includes(r.nature ?? "") ? r.nature : "",
      r.isRepudiated ? "*" : "",
      (r.status ?? "").toLowerCase() === "pending" ? "*" : "",
      (r.status ?? "").toLowerCase() === "dismissed" ? "*" : "",
      r.status === "CFA" ? "*" : "",
      r.status || "",
      r.remarks || "",
    ];
    cells.forEach((v, i) => {
      const c = row.getCell(i + 1);
      c.value = v;
      c.font = { name: "Calibri", size: 12 };
      c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      c.border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
    });
    row.commit(); rowIdx++;
  }

  ws.insertRows(rowIdx, [[], [], [], []]);
  const lastFooterRow = rowIdx + 3;
  ws.spliceRows(lastFooterRow + 1, ws.rowCount - lastFooterRow);

  ws.pageSetup = { horizontalCentered: true, verticalCentered: false, orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const fileName = `Lupon_Pending_Report_${monthText}_${year}.xlsx`;
  return uploadXlsx(storage, wb, fileName);
}

// ———————————————————————————————————
// 5) Incident Status Summary (as of current month)
// ———————————————————————————————————
export async function generateIncidentStatusSummaryXlsx(params: {
  db: Firestore; storage: FirebaseStorage;
}) {
  const { db, storage } = params;
  const now = new Date();
  const monthYear = now.toLocaleDateString("en-US", { year: "numeric", month: "long" });

  const qSnap = await getDocs(query(collection(db, "IncidentReports")));
  const incidents = qSnap.docs.map(d => d.data() as any);
  const departments = ["Lupon", "VAWC", "GAD", "BCPC", "Online"];

  const counts = departments.map(dept => {
    const f = incidents.filter(i => i.department === dept);
    return {
      department: dept,
      pending: f.filter(i => i.status === "pending").length,
      inprogress: f.filter(i => i.status === "In - Progress").length,
      refer: f.filter(i => i.status === "Refer to Government Agency").length,
      dismissed: f.filter(i => (i.status === "dismissed" || i.status === "Dismissed")).length,
      settled: f.filter(i => (dept === "Online" ? i.status === "Settled" : (i.status === "settled" || i.status === "Settled"))).length,
      cfa: f.filter(i => i.status === "CFA").length,
      acknowledged: f.filter(i => i.status === "acknowledged").length,
    };
  });

  const arr = await loadTemplate(storage, "ReportsModule/LFStaff/Incident Status Summary Report.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arr);
  const ws = wb.worksheets[0];

  ws.getCell("A1").value = `INCIDENT STATUS SUMMARY REPORT AS OF ${monthYear.toUpperCase()}`;

  let startRow = 3;
  counts.forEach((item, i) => {
    const row = ws.getRow(startRow + i);
    row.getCell(1).value = item.department;
    row.getCell(2).value = item.pending;
    row.getCell(3).value = item.inprogress;
    row.getCell(4).value = item.settled;
    row.getCell(5).value = item.cfa;
    row.getCell(6).value = item.refer;
    row.getCell(7).value = item.dismissed;

    for (let c = 1; c <= 7; c++) {
      const cell = row.getCell(c);
      cell.font = { name: "Calibri", size: 12 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    }
    row.commit();
  });

  ws.pageSetup = { horizontalCentered: true, verticalCentered: false, orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const fileName = `Incident_Status_Summary_Report_${monthYear.replace(" ", "_")}.xlsx`;
  return uploadXlsx(storage, wb, fileName);
}
