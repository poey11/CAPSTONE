export interface ReportProps{
  id: string;
  nature: string;
  address: string;
  concern: string;
  date: string;
  department: string;
  file: string;
  firstname: string;
  lastname: string;
  reportId: string;
  time: string;
  status: string;
}


export interface  reportFormProps {
  firstname: string;
  lastname: string;
  contactNos: string;
  concerns: string;
  date: string;
  time: string;
  address: string;
  file: File | null;
  reportID: string;
  department: string;
  status: string;
}
