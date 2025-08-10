"use client";
import "@/CSS/ProgramsBrgy/Programs.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProgramsModule() {
  const router = useRouter();

  // Dummy data for programs
  const dummyPrograms = [
    {
      id: "1",
      programName: "Community Clean-up Drive",
      approvalStatus: "Approved",
      progressStatus: "Ongoing",
      activeStatus: "Active",
      dateCreated: "2025-07-20",
    },
    {
      id: "2",
      programName: "Health and Wellness Fair",
      approvalStatus: "Pending",
      progressStatus: "Not Started",
      activeStatus: "Inactive",
      dateCreated: "2025-06-10",
    },
    {
      id: "3",
      programName: "Youth Sports Festival",
      approvalStatus: "Approved",
      progressStatus: "Completed",
      activeStatus: "Active",
      dateCreated: "2025-05-05",
    },
    {
      id: "4",
      programName: "Senior Citizen Support Program",
      approvalStatus: "Rejected",
      progressStatus: "N/A",
      activeStatus: "Inactive",
      dateCreated: "2025-04-12",
    },
    {
      id: "5",
      programName: "Barangay Tree Planting",
      approvalStatus: "Approved",
      progressStatus: "Ongoing",
      activeStatus: "Active",
      dateCreated: "2025-02-18",
    },
  ];

  const [programs, setPrograms] = useState<any[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [showCount, setShowCount] = useState(5);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const programsPerPage = 10;

  // Simulate fetch
  useEffect(() => {
    setTimeout(() => {
      setPrograms(dummyPrograms);
      setLoading(false);
    }, 500);
  }, []);

  // Filtering logic
  useEffect(() => {
    let filtered = [...programs];

    if (searchName) {
      filtered = filtered.filter((program) =>
        program.programName.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (showCount) {
      filtered = filtered.slice(0, showCount);
    }

    setFilteredPrograms(filtered);
  }, [searchName, showCount, programs]);

  // Pagination logic
  const indexOfLast = currentPage * programsPerPage;
  const indexOfFirst = indexOfLast - programsPerPage;
  const currentPrograms = filteredPrograms.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredPrograms.length / programsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

  const getPageNumbers = () => {
    const pageNumbersToShow: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pageNumbersToShow.push(i);
      } else if (
        (i === currentPage - 2 || i === currentPage + 2) &&
        pageNumbersToShow[pageNumbersToShow.length - 1] !== "..."
      ) {
        pageNumbersToShow.push("...");
      }
    }
    return pageNumbersToShow;
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this program?")) {
      setPrograms((prev) => prev.filter((program) => program.id !== id));
      alert("Program deleted successfully!");
    }
  };

  return (
    <main className="programs-module-main-container">
      <div className="programs-module-section-1">
        <button className="add-programs-btn">Add New Program</button>
      </div>

      <div className="programs-module-section-2">
        <input
          type="text"
          className="programs-module-filter"
          placeholder="Search by Program Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
      </div>

      <div className="programs-module-main-section">
        {loading ? (
          <p>Loading programs...</p>
        ) : currentPrograms.length === 0 ? (
          <div className="no-result-card">
            <img src="/images/no-results.png" alt="No results icon" className="no-result-icon" />
            <p className="no-results-department">No Results Found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Program Name</th>
                <th>Approval Status</th>
                <th>Progress Status</th>
                <th>Active/Inactive</th>
                <th>Date Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPrograms.map((program) => (
                <tr key={program.id}>
                  <td>{program.programName}</td>
                  <td>{program.approvalStatus}</td>
                  <td>{program.progressStatus}</td>
                  <td>{program.activeStatus}</td>
                  <td>{program.dateCreated}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="action-view"
                        onClick={() => router.push(`/dashboard/ProgramsModule/ViewProgram?id=${program.id}`)}
                      >
                        View
                      </button>
                      <button
                        className="action-edit"
                        onClick={() => router.push(`/dashboard/ProgramsModule/EditProgram?id=${program.id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="action-delete"
                        onClick={() => handleDelete(program.id)}
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

      <div className="redirection-section">
        <button onClick={prevPage} disabled={currentPage === 1}>
          &laquo;
        </button>
        {getPageNumbers().map((number, index) => (
          <button
            key={index}
            onClick={() => typeof number === "number" && paginate(number)}
            className={currentPage === number ? "active" : ""}
          >
            {number}
          </button>
        ))}
        <button onClick={nextPage} disabled={currentPage === totalPages}>
          &raquo;
        </button>
      </div>
    </main>
  );
}
