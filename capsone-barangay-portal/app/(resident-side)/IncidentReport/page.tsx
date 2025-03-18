
import Form from "@/app/(resident-side)/components/incidentForm"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Incident Report",
  description: "Incident Report",
};

export default function FileReport() {
  
  return (
    <div>
      <Form />
    </div>  
  );
}
