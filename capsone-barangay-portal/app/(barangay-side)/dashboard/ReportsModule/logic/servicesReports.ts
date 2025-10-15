// app/(barangay-side)/dashboard/ReportsModule/logic/servicesReports.ts
import { Firestore, collection, getDocs, query } from "firebase/firestore";
import { FirebaseStorage, ref, getDownloadURL, uploadBytes } from "firebase/storage";
import ExcelJS from "exceljs";

// If you already defined these in another logic file, delete these and import instead.
export type GeneratedXlsx = { fileUrl: string; fileName: string };

async function loadTemplateFromStorage(storage: FirebaseStorage, path: string): Promise<ArrayBuffer> {
  const tRef = ref(storage, path);
  const url = await getDownloadURL(tRef);
  const res = await fetch(url);
  return await res.arrayBuffer();
}
async function uploadWorkbook(storage: FirebaseStorage, wb: ExcelJS.Workbook, fileName: string): Promise<GeneratedXlsx> {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const outRef = ref(storage, `GeneratedReports/${fileName}`);
  await uploadBytes(outRef, blob);
  const fileUrl = await getDownloadURL(outRef);
  return { fileUrl, fileName };
}

// --- tiny helpers (duplicate-ok) ---
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

function buildReportLabel(
  startMonth: number, startYear: number, endMonth: number, endYear: number, allTime: boolean
) {
  if (allTime) return "ALL TIME";
  if (startMonth === endMonth && startYear === endYear) return `${monthNameUpper(endYear, endMonth)} ${endYear}`;
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

// ———————————————————————————————————
// PUBLIC API
// ———————————————————————————————————
export async function generateServiceRequestXlsx(params: {
  db: Firestore;
  storage: FirebaseStorage;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  allTime: boolean;
  docType: string; // "All" or specific
  status: string;  // "All" or exact status
}): Promise<GeneratedXlsx & { labelFile: string; labelHuman: string; docTypeForName: string }> {
  const { db, storage, startMonth, startYear, endMonth, endYear, allTime, docType, status } = params;

  const reportLabel = buildReportLabel(startMonth, startYear, endMonth, endYear, allTime);
  const reportTitle = allTime ? `AS OF ALL TIME` : `AS OF ${reportLabel}`;
  const labelFile = buildFileLabel(startMonth, startYear, endMonth, endYear, allTime);
  const docTypeDisplay = (docType || "All").toUpperCase();

  // Fetch
  const qSnap = await getDocs(query(collection(db, "ServiceRequests")));
  const rangeStart = startOfMonth(startYear, startMonth);
  const rangeEndExclusive = endExclusiveOfMonth(endYear, endMonth);

  const requests = qSnap.docs
    .map(d => d.data() as any)
    .filter(req => {
      const created = toJSDate(req.createdAt);
      if (!created) return false;

      const matchesTime = allTime || (created >= rangeStart && created < rangeEndExclusive);
      const matchesDocType = docType === "All" || (req.docType?.toLowerCase() || "").includes(docType.toLowerCase());
      const matchesStatus = status === "All" || (req.status?.toLowerCase() || "") === status.toLowerCase();

      return matchesTime && matchesDocType && matchesStatus;
    })
    .sort((a, b) => {
      const aDate = toJSDate(a.createdAt) ?? new Date(0);
      const bDate = toJSDate(b.createdAt) ?? new Date(0);
      return bDate.getTime() - aDate.getTime();
    });

  if (requests.length === 0) {
    const err = new Error("No service requests found for the selected criteria.");
    (err as any).code = "NO_DATA";
    throw err;
  }

  // Template
  const arr = await loadTemplateFromStorage(storage, "ReportsModule/AdminStaff/Barangay Requests_Template.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arr);
  const ws = wb.worksheets[0];

  // Title
  const titleText = allTime
    ? (docType === "All"
        ? "BARANGAY FAIRVIEW\nALL TIME SUMMARY OF ALL SERVICE REQUESTS"
        : `BARANGAY FAIRVIEW\nALL TIME SUMMARY OF ${docTypeDisplay} SERVICE REQUESTS`)
    : (docType === "All"
        ? `BARANGAY FAIRVIEW\nSUMMARY OF ALL SERVICE REQUESTS\n${reportTitle}`
        : `BARANGAY FAIRVIEW\nSUMMARY OF\n${docTypeDisplay} SERVICE REQUESTS\n${reportTitle}`);

  ws.getCell("A1").value = titleText;
  ws.getCell("A1").alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  ws.getCell("A1").font = { name: "Calibri", size: 14, bold: true };

  // Data
  const startRow = 4;
  requests.forEach((req, idx) => {
    const row = ws.getRow(startRow + idx);
    row.height = 45;

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = req.requestId || "";
    row.getCell(3).value = req.requestor || "";
    row.getCell(4).value = req.purpose || "";
    row.getCell(5).value = req.address || "";
    row.getCell(6).value = req.contact || "";
    row.getCell(7).value = (toJSDate(req.createdAt) ?? new Date()).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    row.getCell(8).value = req.status || "";

    for (let i = 1; i <= 8; i++) {
      const c = row.getCell(i);
      c.font = { name: "Calibri", size: 12 };
      c.alignment = { horizontal: "center", wrapText: true };
      c.border = { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } };
    }
    row.commit();
  });

  // Shift footer/signatures (if present)
  const footerImgs = (ws as any).getImages?.().filter((img: any) => img.range?.tl?.nativeRow >= 20) ?? [];
  footerImgs.forEach((d: any) => {
    const offset = requests.length;
    if (d.range?.tl) d.range.tl.nativeRow += offset;
    if (d.range?.br) d.range.br.nativeRow += offset;
  });

  // Date row below data + signatures
  const lastFooterStart = 24 + requests.length; // assumes default footer starts at row 24
  const newDateRow = lastFooterStart + 3;

  ws.insertRow(newDateRow, []);
  ws.mergeCells(`C${newDateRow}:D${newDateRow}`);
  ws.mergeCells(`E${newDateRow}:F${newDateRow}`);

  const currentDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  ws.getCell(`C${newDateRow}`).value = `${currentDate}\nDate`;
  ws.getCell(`C${newDateRow}`).alignment = { wrapText: true, horizontal: "left" };
  ws.getCell(`C${newDateRow}`).font = { name: "Calibri", size: 11, italic: true, bold: true };

  ws.getCell(`E${newDateRow}`).value = `${currentDate}\nDate`;
  ws.getCell(`E${newDateRow}`).alignment = { wrapText: true, horizontal: "left" };
  ws.getCell(`E${newDateRow}`).font = { name: "Calibri", size: 11, italic: true, bold: true };

  // Page setup + upload
  ws.pageSetup = { horizontalCentered: true, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const fileName = `Service Request Report_${labelFile}.xlsx`;
  const out = await uploadWorkbook(storage, wb, fileName);

  return { ...out, labelFile, labelHuman: reportLabel, docTypeForName: docTypeDisplay };
}
