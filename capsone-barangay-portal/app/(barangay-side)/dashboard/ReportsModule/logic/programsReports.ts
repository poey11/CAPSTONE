// app/(barangay-side)/dashboard/ReportsModule/logic/programsReports.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Firestore, collection, getDocs, query, addDoc } from "firebase/firestore"; // addDoc not used here; keep/remove as you prefer
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
  const didAttend = (rec: any) => {
    if (typeof rec.attended === "boolean") return rec.attended;
    if (typeof rec.attendanceCount === "number") return rec.attendanceCount > 0;
    if (rec.attendance && typeof rec.attendance.present === "boolean") return rec.attendance.present;
    return false;
  };

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

    let participantsApproved = 0;
    let participantsMax = 0;

    if ((p.eventType || "").toLowerCase() === "multiple" && Array.isArray(p.participantDays)) {
      participantsMax = (p.participantDays as number[]).reduce((a, b) => a + (Number(b) || 0), 0);
      const perDay: Record<string, number> = {};
      for (const rec of approvedParticipants) {
        const day = String(rec.dayChosen ?? "");
        perDay[day] = (perDay[day] || 0) + 1;
      }
      participantsApproved = Object.values(perDay).reduce((a, b) => a + b, 0);
    } else {
      participantsMax = Number(p.participants || 0) || 0;
      participantsApproved = approvedParticipants.length;
    }

    const volunteersMax = Number(p.volunteers || 0) || 0;
    const volunteersApproved = approvedVolunteers.length;

    let attendancePct = "—";
    if ((p.progressStatus || "") === "Completed") {
      const attended = approvedParticipants.filter(didAttend).length;
      attendancePct =
        participantsApproved > 0 ? `${((attended / participantsApproved) * 100).toFixed(1)}%` : "0%";
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
