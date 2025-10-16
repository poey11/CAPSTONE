// app/(barangay-side)/dashboard/ReportsModule/logic/programsReports.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Firestore, collection, getDocs, query, addDoc, where, orderBy, getDoc, doc } from "firebase/firestore"; // addDoc not used here; keep/remove as you prefer
import { FirebaseStorage, ref, getDownloadURL, uploadBytes } from "firebase/storage";
import ExcelJS from "exceljs";

// If you already have these helpers, import them from your shared utils and delete these local versions.
const toJSDate = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val?.toDate === "function") return val.toDate();
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};
const startOfMonth = (y: number, m: number) => new Date(y, m, 1, 0, 0, 0, 0);
const endExclusiveOfMonth = (y: number, m: number) => new Date(y, m + 1, 1, 0, 0, 0, 0);
const monthUpper = (y: number, m: number) =>
  new Date(y, m).toLocaleString("default", { month: "long" }).toUpperCase();
export const buildReportLabel = (
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number,
  allTime: boolean
) => {
  if (allTime) return "ALL TIME";
  if (startMonth === endMonth && startYear === endYear)
    return `${monthUpper(endYear, endMonth)} ${endYear}`;
  const sm = monthUpper(startYear, startMonth);
  const em = monthUpper(endYear, endMonth);
  return `${sm} ${startYear} – ${em} ${endYear}`;
};
export const buildFileLabel = (
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number,
  allTime: boolean
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

async function loadTemplate(storage: FirebaseStorage, path: string): Promise<ArrayBuffer> {
  const tRef = ref(storage, path);
  const url = await getDownloadURL(tRef);
  const res = await fetch(url);
  return await res.arrayBuffer();
}
async function uploadXlsx(storage: FirebaseStorage, wb: ExcelJS.Workbook, fileName: string): Promise<string> {
  const outRef = ref(storage, `GeneratedReports/${fileName}`);
  const buffer = await wb.xlsx.writeBuffer();
  const file = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  await uploadBytes(outRef, file);
  return await getDownloadURL(outRef);
}

export type ApprovalStatus = "All" | "Pending" | "Approved" | "Rejected";
export type ProgressStatus = "All" | "Upcoming" | "Ongoing" | "Completed";

export async function generateProgramsMonthlyXlsx(params: {
  db: Firestore;
  storage: FirebaseStorage;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  allTime?: boolean;
  approvalStatus: ApprovalStatus;
  progressStatus: ProgressStatus; // ignored when approvalStatus === "Rejected"
}): Promise<{ fileUrl: string; labelFile: string }> {
  const {
    db,
    storage,
    startMonth,
    startYear,
    endMonth,
    endYear,
    approvalStatus,
    progressStatus,
    allTime = false,
  } = params;

  const reportLabel = buildReportLabel(startMonth, startYear, endMonth, endYear, allTime);
  const labelFile = buildFileLabel(startMonth, startYear, endMonth, endYear, allTime);

  // Load template (starts writing at row 5)
  const arr = await loadTemplate(storage, "ReportsModule/AdminStaff/Programs Monthly Summary Report.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arr);
  const ws = wb.worksheets[0];

  try {
    ws.getCell("A1").value = "MONTHLY PROGRAMS REPORT";
    ws.getCell("A1").alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
    ws.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
  } catch {}
  ws.getCell("A2").value = `BARANGAY FAIRVIEW — ${allTime ? "AS OF ALL TIME" : `AS OF ${reportLabel}`}`;

  // Fetch programs within range + filters
  const rangeStart = startOfMonth(startYear, startMonth);
  const rangeEnd = endExclusiveOfMonth(endYear, endMonth);

  const progSnap = await getDocs(query(collection(db, "Programs")));
  const programs = progSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).filter(p => {
    const s = toJSDate(p.startDate);
    const e = toJSDate(p.endDate);
    if (!s || !e) return false;

    // overlap condition
    const overlaps =
      (s >= rangeStart && s < rangeEnd) || // starts inside range
      (e >= rangeStart && e < rangeEnd) || // ends inside range
      (s <= rangeStart && e >= rangeEnd);  // spans the whole range

    const inRange = allTime || overlaps;

    const approvalOk = approvalStatus === "All" ? true : (p.approvalStatus || "") === approvalStatus;
    const progressOk =
      approvalStatus === "Rejected"
        ? true
        : progressStatus === "All"
          ? true
          : (p.progressStatus || "") === progressStatus;

    return inRange && approvalOk && progressOk;
  });

  if (programs.length === 0) {
    const err: any = new Error(allTime ? "No programs found." : `No programs found for ${reportLabel}.`);
    err.code = "NO_DATA";
    throw err;
  }

  // Participants/Volunteers
  const ppSnap = await getDocs(query(collection(db, "ProgramsParticipants")));
  const people = ppSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

  // Flexible attendance check

  type Row = [string, string, string, string, string, string, string];
  const rows: Row[] = [];

  for (const p of programs) {
    const s = toJSDate(p.startDate);
    const e = toJSDate(p.endDate);
    const sStr = s ? s.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
    const eStr = e ? e.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
    const tS = p.timeStart || "";
    const tE = p.timeEnd || "";
    const dateRange = e ? `${sStr} - ${eStr}` : sStr;
    const timeRange = tS && tE ? `${tS} - ${tE}` : (tS || tE || "");
    const dateOfProgram = timeRange ? `${dateRange} / ${timeRange}` : dateRange;

    const name = p.programName || "";
    const status = p.progressStatus || p.approvalStatus || "";
    const loc = p.location || "";

    const approvedParticipants = people.filter(
      r => r.programId === p.id && r.approvalStatus === "Approved" && r.role === "Participant"
    );
    const approvedVolunteers = people.filter(
      r => r.programId === p.id && r.approvalStatus === "Approved" && r.role === "Volunteer"
    );

    // Capacity/maximum still respects per-day config for "multiple" events
    let participantsMax = 0;
    if ((p.eventType || "").toLowerCase() === "multiple" && Array.isArray(p.participantDays)) {
      participantsMax = (p.participantDays as number[]).reduce((a, b) => a + (Number(b) || 0), 0);
    } else {
      participantsMax = Number(p.participants || 0) || 0;
    }

    const participantsApproved = approvedParticipants.length;
    const attended = approvedParticipants.filter((rec: any) => rec?.attendance === true).length;

    const volunteersMax = Number(p.volunteers || 0) || 0;
    const volunteersApproved = approvedVolunteers.length;

    let attendancePct = "—";
    if ((p.progressStatus || "") === "Completed") {
      attendancePct =
        participantsApproved > 0
          ? `${((attended / participantsApproved) * 100).toFixed(1)}%`
          : "0%";
    }

    const participantsCell =
      participantsMax > 0 ? `${participantsApproved}/${participantsMax}` : `${participantsApproved}`;
    const volunteersCell =
      volunteersMax > 0 ? `${volunteersApproved}/${volunteersMax}` : `${volunteersApproved}`;

    rows.push([
      dateOfProgram,
      name,
      status,
      loc,
      participantsCell,
      volunteersCell,
      attendancePct,
    ]);
  }

  // Write to template starting row 5 and shift footer/signature images
  const dataStartRow = 5;

  const imgs: any[] = (ws as any).getImages ? (ws as any).getImages() : [];
  const footerImgs = imgs.filter((img) => (img.range?.tl?.nativeRow ?? 0) >= 20); // heuristic
  const footerStartRow = footerImgs.length
    ? Math.min(...footerImgs.map((i) => (i.range.tl.nativeRow as number))) + 1
    : 21; // fallback
  const spaceToDelete = Math.max(footerStartRow - dataStartRow, 0);
  if (spaceToDelete > 0) ws.spliceRows(dataStartRow, spaceToDelete);
  ws.insertRows(dataStartRow, new Array(rows.length).fill([]));

  const overflow = Math.max(rows.length - spaceToDelete, 0);
  footerImgs.forEach((d) => {
    if (d.range?.tl) d.range.tl.nativeRow += overflow;
    if (d.range?.br) d.range.br.nativeRow += overflow;
  });

  rows.forEach((r, i) => {
    const row = ws.getRow(dataStartRow + i);
    row.height = 44;
    r.forEach((val, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = val;
      cell.font = { name: "Calibri", size: 12 };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });
    row.commit();
  });

  ws.pageSetup = {
    horizontalCentered: true,
    verticalCentered: false,
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  const fileName = `Monthly_Programs_Report_${labelFile}.xlsx`;
  const fileUrl = await uploadXlsx(storage, wb, fileName);
  return { fileUrl, labelFile };
}



// ---------- Shared helpers ----------
const fmtDateLong = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};
const safe = (s?: string) => String(s || "");

// ---------- Export: for the modal dropdown ----------
export type ProgramPick = {
  id: string;
  programName: string;
  startDate?: string;
  endDate?: string;
  progressStatus?: string;
};

export async function fetchApprovedPrograms(db: any) {
  try {
    const q = query(
      collection(db, "Programs"),
      where("approvalStatus", "==", "Approved"),
      where("progressStatus", "==", "Completed"),
      orderBy("startDate", "desc")
    );
    const snap = await getDocs(q);

    const list = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        programName: data.programName || "(Unnamed Program)",
        startDate: data.startDate || "",
        endDate: data.endDate || "",
        progressStatus: data.progressStatus || "",
      };
    });

    return list;
  } catch (err) {
    console.error("fetchApprovedPrograms error:", err);
    throw new Error("Failed to load Approved programs.");
  }
}

// ---------- Internal: load participants from both collections ----------
type ParticipantRecord = {
  id: string;
  programId?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  contact?: string;
  role?: string;
  location?: string;
  address?: string;
  approvalStatus?: "Pending" | "Approved" | "Rejected";
  attendance?: boolean; // <- your boolean field
  dayChosen?: number | string; // <- for multiple-event programs
};

const safeFullName = (rec: ParticipantRecord) => {
  if (rec.fullName && rec.fullName.trim()) return rec.fullName;
  const f = rec.firstName || "";
  const l = rec.lastName || "";
  const s = `${f} ${l}`.trim();
  return s || "—";
};

async function fetchProgramParticipants(db: Firestore, programId: string): Promise<ParticipantRecord[]> {
  const snap1 = await getDocs(
    query(collection(db, "ProgramsParticipants"), where("programId", "==", programId))
  );
  const a: ParticipantRecord[] = snap1.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

  const snap2 = await getDocs(
    query(collection(db, "ProgramParticipants"), where("programId", "==", programId))
  );
  const b: ParticipantRecord[] = snap2.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

  const map = new Map<string, ParticipantRecord>();
  [...a, ...b].forEach((r) => map.set(r.id, r));
  return Array.from(map.values());
}

// ---------- Export: Program Participation/Summary XLSX (returns fileUrl & name) ----------
export async function generateProgramParticipationXlsx(args: {
  db: Firestore;
  storage: FirebaseStorage;
  programId: string;
}): Promise<{ fileUrl: string; programName: string }> {
  const { db, storage, programId } = args;

  // Load program
  const progSnap = await getDoc(doc(db, "Programs", programId));
  if (!progSnap.exists()) throw new Error("NOT_FOUND");
  const p: any = { id: programId, ...progSnap.data() };

  const programName = p.programName || programId;
  const eventType: string = p.eventType || "single";
  const sDate = fmtDateLong(p.startDate);
  const eDate = p.endDate ? fmtDateLong(p.endDate) : "";
  const timeRange =
    p.timeStart && p.timeEnd ? `${p.timeStart} — ${p.timeEnd}` : p.timeStart || p.timeEnd || "";
  const dateRange = eDate ? `${sDate} — ${eDate}` : sDate;
  const capParticipants = Number(p.participants || 0) || 0;
  const capVolunteers = Number(p.volunteers || 0) || 0;
  const participantDays: number[] = Array.isArray(p.participantDays) ? p.participantDays : [];

  // Workbook + sheets
  const wb = new ExcelJS.Workbook();
  const wsInfo = wb.addWorksheet("Program Info");
  const wsList = wb.addWorksheet("Participants & Volunteers");

  // ======= Sheet 1: Top centered header (3 lines) =======
  wsInfo.mergeCells("A2:F2");
  wsInfo.getCell("A2").value = "BARANGAY FAIRVIEW";
  wsInfo.getCell("A2").font = { name: "Calibri", size: 16, bold: true };
  wsInfo.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };

  wsInfo.mergeCells("A3:F3");
  wsInfo.getCell("A3").value = "PROGRAM SUMMARY REPORT";
  wsInfo.getCell("A3").font = { name: "Calibri", size: 14, bold: true };
  wsInfo.getCell("A3").alignment = { horizontal: "center", vertical: "middle" };

  wsInfo.mergeCells("A4:F4");
  wsInfo.getCell("A4").value = programName;
  wsInfo.getCell("A4").font = { name: "Calibri", size: 13, bold: true };
  wsInfo.getCell("A4").alignment = { horizontal: "center", vertical: "middle" };

  wsInfo.getRow(2).height = 22;
  wsInfo.getRow(3).height = 20;
  wsInfo.getRow(4).height = 18;
  wsInfo.addRow([]);
  wsInfo.addRow([]);

  // Details (wider columns so numbers/labels align nicely)
  wsInfo.columns = [
    { header: "", width: 26 },
    { header: "", width: 64 },
    { header: "", width: 12 },
    { header: "", width: 12 },
    { header: "", width: 12 },
    { header: "", width: 12 },
  ];
  const addInfo = (label: string, value: string) => {
    const r = wsInfo.addRow([label, value]);
    r.getCell(1).font = { bold: true };
    r.alignment = { vertical: "middle", wrapText: true };
  };

  addInfo("Program Name", programName);
  addInfo("Approval Status", safe(p.approvalStatus));
  addInfo("Progress Status", safe(p.progressStatus));
  addInfo("Event Type", String(eventType).toUpperCase());
  addInfo("Location", safe(p.location) || "—");
  addInfo("Date Range", dateRange);
  if (timeRange) addInfo("Time", timeRange);

  // Per-day block or single-day cap
  if (eventType === "multiple" && participantDays.length) {
    wsInfo.addRow([]);
    const hdr = wsInfo.addRow(["Per-day Max Participants"]);
    hdr.font = { bold: true };
    const tableHdr = wsInfo.addRow(["Day", "Max Participants"]);
    tableHdr.font = { bold: true };
    participantDays.forEach((n, i) => {
      wsInfo.addRow([`Day ${i + 1}`, Number(n) || 0]);
    });
  } else {
    addInfo("Max Participants", capParticipants ? String(capParticipants) : "—");
  }
  addInfo("Max Volunteers", capVolunteers ? String(capVolunteers) : "—");

  const description = p.description || p.programDescription || "";
  if (description) {
    wsInfo.addRow([]);
    const dh = wsInfo.addRow(["Description"]);
    dh.font = { bold: true };
    const drow = wsInfo.addRow([description]);
    const rn = drow.number;
    wsInfo.mergeCells(`A${rn}:F${rn}`);
    wsInfo.getCell(`A${rn}`).alignment = { wrapText: true, vertical: "top" };
    drow.height = 80;
  }

  wsInfo.pageSetup = {
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
  };

  // Sheet 2: Participants table (centered headers & cells)
  const isMultiple = String(eventType).toLowerCase() === "multiple";

  const lastCol = isMultiple ? "G" : "F";

  // === Title row FIRST (merged, centered, bordered) ===
  const title2 = wsList.addRow(["Participants / Volunteers (Approved Only)"]);
  wsList.mergeCells(`A${title2.number}:${lastCol}${title2.number}`);
  const tCell = wsList.getCell(`A${title2.number}`);
  tCell.font = { name: "Calibri", size: 14, bold: true };
  tCell.alignment = { horizontal: "center", vertical: "middle" };
  title2.height = 24;

    wsList.columns = isMultiple
    ? [
        { header: "#", width: 6 },
        { header: "Full Name", width: 32 },
        { header: "Address", width: 34 },
        { header: "Contact", width: 18 },
        { header: "Role", width: 16 },
        { header: "Day Chosen", width: 14 },   // multiple only
        { header: "Attendance", width: 14 },
      ]
    : [
        { header: "#", width: 6 },
        { header: "Full Name", width: 32 },
        { header: "Address", width: 34 },
        { header: "Contact", width: 18 },
        { header: "Role", width: 16 },
        { header: "Attendance", width: 14 },
      ];

  const thinBorders = {
    top: { style: "thin" as const },
    bottom: { style: "thin" as const },
    left: { style: "thin" as const },
    right: { style: "thin" as const },
  };

  // === Header row SECOND (same borders as data rows) ===
  const header2 = wsList.addRow(wsList.columns.map((c) => c.header));
  header2.height = 22;
  header2.eachCell((c) => {
    c.font = { name: "Calibri", size: 12, bold: true };
    c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    c.border = thinBorders; // <-- matches data rows
  });



  const all = await fetchProgramParticipants(db, programId);
  const approved = all.filter((r) => String(r.approvalStatus || "").toLowerCase() === "approved");

  const roleOrder = (r: ParticipantRecord) =>
    (String(r.role || "").toLowerCase() === "participant" ? 0 : 1);
  const nameKey = (r: ParticipantRecord) =>
    `${(r.lastName || "").toString().toUpperCase()}|${(r.firstName || "").toString().toUpperCase()}`;
  approved.sort((a, b) => roleOrder(a) - roleOrder(b) || nameKey(a).localeCompare(nameKey(b)));

approved.forEach((rec, i) => {
  const addr = rec.address || rec.location || "—";
  const contact = rec.contactNumber || rec.contact || "—";
  const role = rec.role || "—";
  const attendance = rec.attendance ? "Yes" : "No";

  // Only show Day Chosen for multiple-event programs
  const dayChosenDisplay = isMultiple
    ? (rec.dayChosen) // try a few common keys
    : undefined;

  const dayChosenText = isMultiple
    ? (dayChosenDisplay === 0 || typeof dayChosenDisplay === "number"
        ? `Day ${Number(dayChosenDisplay) + 1}`
        : (dayChosenDisplay ? `Day ${Number(dayChosenDisplay) + 1}` : "—"))
    : undefined;

  const rowValues = isMultiple
    ? [i + 1, safeFullName(rec), addr, contact, role, dayChosenText, attendance]
    : [i + 1, safeFullName(rec), addr, contact, role, attendance];

  const r = wsList.addRow(rowValues);
  r.height = 22;
  r.eachCell((c) => {
    c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    c.font = { name: "Calibri", size: 12 };
    c.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });
});


  wsList.pageSetup = {
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
  };

  // === Attendance Summary (Participants only) ===
  const approvedParticipantsOnly = approved.filter(
    (r) => String(r.role || "").toLowerCase() === "participant"
  );
  const attendedCount = approvedParticipantsOnly.filter((r) => r.attendance === true).length;
  const totalApprovedParticipants = approvedParticipantsOnly.length;
  const attendancePercent =
    totalApprovedParticipants > 0
      ? `${((attendedCount / totalApprovedParticipants) * 100).toFixed(1)}%`
      : "0%";

  // Spacer
  wsList.addRow([]);

  const centerCols = isMultiple ? ["D", "E", "F"] : ["C", "D", "E"]; // center block

  const summaryRowValues = isMultiple
    ? ["", "", "", "Total Participants", `${attendedCount} / ${totalApprovedParticipants}`, attendancePercent, ""]
    : ["", "", "Total Participants", `${attendedCount} / ${totalApprovedParticipants}`, attendancePercent, ""];

  const summaryRow = wsList.addRow(summaryRowValues);

  // Styles
  const thin = { style: "thin" as const };
  centerCols.forEach((col) => {
    const cell = wsList.getCell(`${col}${summaryRow.number}`);
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.font = { name: "Calibri", size: 12, bold: col === centerCols[0] };
    cell.border = { top: thin, bottom: thin, left: thin, right: thin };
  });
  summaryRow.height = 22;

  // Remove borders on the blank cells so only the center block looks like a mini-table
  const allCols = isMultiple ? ["A","B","C","D","E","F","G"] : ["A","B","C","D","E","F"];
  allCols
    .filter((c) => !centerCols.includes(c))
    .forEach((col) => { wsList.getCell(`${col}${summaryRow.number}`).border = {}; });


  // Upload XLSX → return URL
  const safeName = String(programName || programId).replace(/[^\w.-]/g, "_");
  const xlsxRef = ref(storage, `GeneratedReports/Program_Summary_${safeName}.xlsx`);
  const buf = await wb.xlsx.writeBuffer();
  await uploadBytes(xlsxRef, new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const fileUrl = await getDownloadURL(xlsxRef);

  return { fileUrl, programName };
}
