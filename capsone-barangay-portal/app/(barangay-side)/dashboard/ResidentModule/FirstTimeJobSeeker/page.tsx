"use client";
import "@/CSS/ResidentModule/module.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../db/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import Link from "next/link";

export default function JobSeekerListModule() {
  const [jobSeekers, setJobSeekers] = useState<any[]>([]);
  const [filteredJobSeekers, setFilteredJobSeekers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchName, setSearchName] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const router = useRouter();

  useEffect(() => {
    const fetchJobSeekers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "JobSeekerList"));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setJobSeekers(data);
      } catch (err) {
        setError("Failed to load job seekers");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobSeekers();
  }, []);

  useEffect(() => {
    let filtered = [...jobSeekers];

    if (searchName) {
      filtered = filtered.filter((seeker) => {
        const firstName = seeker.firstName?.toLowerCase() || "";
        const middleName = seeker.middleName?.toLowerCase() || "";
        const lastName = seeker.lastName?.toLowerCase() || "";

        return (
          firstName.includes(searchName.toLowerCase()) ||
          middleName.includes(searchName.toLowerCase()) ||
          lastName.includes(searchName.toLowerCase())
        );
      });
    }

    // Sorting by Date Applied (Newest First by Default)
    filtered.sort((a, b) => {
      const dateA = new Date(a.dateApplied).getTime() || 0;
      const dateB = new Date(b.dateApplied).getTime() || 0;
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    setFilteredJobSeekers(filtered);
  }, [searchName, jobSeekers, sortOrder]);

  const formatDateToMMDDYYYY = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${month}/${day}/${year}`;
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this job seeker?")) {
      try {
        await deleteDoc(doc(db, "JobSeekerList", id));
        setJobSeekers((prev) => prev.filter(seeker => seeker.id !== id));
        alert("Job seeker deleted successfully!");
      } catch (error) {
        console.error("Error deleting job seeker:", error);
        alert("Failed to delete job seeker.");
      }
    }
  };

  return (
    <main className="main-container">
      <div className="section-1">
        <h1>First-Time Job Seeker List</h1>
        <Link href="/dashboard/ResidentModule/FirstTimeJobSeeker/AddFirstTimeJobSeeker">
          <button className="add-announcement-btn">Add New Job Seeker</button>
        </Link>
      </div>

      <div className="section-2">
        <input
          type="text"
          className="search-bar"
          placeholder="Search by Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
      </div>

      <div className="main-section">
        {loading && <p>Loading job seekers...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <table>
            <thead>
              <tr>
                <th>
                  Date Applied
                  <button
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="sort-button"
                  >
                    {sortOrder === "asc" ? "▲" : "▼"}
                  </button>
                </th>
                <th>First Name</th>
                <th>Middle Name</th>
                <th>Last Name</th>
                <th>Date of Birth</th>
                <th>Age</th>
                <th>Sex</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobSeekers.map((seeker) => (
                <tr key={seeker.id}>
                  <td>{formatDateToMMDDYYYY(seeker.dateApplied)}</td>
                  <td>{seeker.firstName}</td>
                  <td>{seeker.middleName}</td>
                  <td>{seeker.lastName}</td>
                  <td>{seeker.dateOfBirth}</td>
                  <td>{seeker.age}</td>
                  <td>{seeker.sex}</td>
                  <td>{seeker.remarks}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="action-view"
                        onClick={() => router.push(`/dashboard/ResidentModule/FirstTimeJobSeeker/ViewFirstTimeJobSeeker?id=${seeker.id}`)}
                      >
                        View
                      </button>
                      <button
                        className="action-edit"
                        onClick={() => router.push(`/dashboard/ResidentModule/FirstTimeJobSeeker/EditFirstTimeJobSeeker?id=${seeker.id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="action-delete"
                        onClick={() => handleDelete(seeker.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}