import "@/CSS/ResidentModule/module.css";
import type { Metadata } from "next";
import Link from "next/link";

const metadata: Metadata = {
  title: "Announcement Page for Residents",
  description: "Stay updated with the latest announcements",
};

export default function ResidentManagementModule() {
  const residentData = [
    {
      name: "Jonnell Quebal",
      address: "123 East Fairview",
      birthday: "1990-02-14",
      placeOfBirth: "Quezon City",
      age: 33,
      sex: "Male",
      civilStatus: "Single",
      occupation: "Software Developer",
      contact: "09171218101",
      email: "jonnell@example.com",
      precinct: "101",
      isVoter: "true",
    },
    {
        name: "Jonnell Quebal",
        address: "123 East Fairview",
        birthday: "1990-02-14",
        placeOfBirth: "Quezon City",
        age: 33,
        sex: "Male",
        civilStatus: "Single",
        occupation: "Software Developer",
        contact: "09171218101",
        email: "jonnell@example.com",
        precinct: "101",
        isVoter: "true",
      },
      {
        name: "Jonnell Quebal",
        address: "123 East Fairview",
        birthday: "1990-02-14",
        placeOfBirth: "Quezon City",
        age: 33,
        sex: "Male",
        civilStatus: "Single",
        occupation: "Software Developer",
        contact: "09171218101",
        email: "jonnell@example.com",
        precinct: "101",
        isVoter: "true",
      },
      {
        name: "Jonnell Quebal",
        address: "123 East Fairview",
        birthday: "1990-02-14",
        placeOfBirth: "Quezon City",
        age: 33,
        sex: "Male",
        civilStatus: "Single",
        occupation: "Software Developer",
        contact: "09171218101",
        email: "jonnell@example.com",
        precinct: "101",
        isVoter: "true",
      },
      {
        name: "Jonnell Quebal",
        address: "123 East Fairview",
        birthday: "1990-02-14",
        placeOfBirth: "Quezon City",
        age: 33,
        sex: "Male",
        civilStatus: "Single",
        occupation: "Software Developer",
        contact: "09171218101",
        email: "jonnell@example.com",
        precinct: "101",
        isVoter: "true",
      },
      {
        name: "Jonnell Quebal",
        address: "123 East Fairview",
        birthday: "1990-02-14",
        placeOfBirth: "Quezon City",
        age: 33,
        sex: "Male",
        civilStatus: "Single",
        occupation: "Software Developer",
        contact: "09171218101",
        email: "jonnell@example.com",
        precinct: "101",
        isVoter: "true",
      },
      {
        name: "Jonnell Quebal",
        address: "123 East Fairview",
        birthday: "1990-02-14",
        placeOfBirth: "Quezon City",
        age: 33,
        sex: "Male",
        civilStatus: "Single",
        occupation: "Software Developer",
        contact: "09171218101",
        email: "jonnell@example.com",
        precinct: "101",
        isVoter: "true",
      },
      {
        name: "Jonnell Quebal",
        address: "123 East Fairview",
        birthday: "1990-02-14",
        placeOfBirth: "Quezon City",
        age: 33,
        sex: "Male",
        civilStatus: "Single",
        occupation: "Software Developer",
        contact: "09171218101",
        email: "jonnell@example.com",
        precinct: "101",
        isVoter: "false",
      },
      {
        name: "Jonnell Quebal",
        address: "123 East Fairview",
        birthday: "1990-02-14",
        placeOfBirth: "Quezon City",
        age: 33,
        sex: "Male",
        civilStatus: "Single",
        occupation: "Software Developer",
        contact: "09171218101",
        email: "jonnell@example.com",
        precinct: "101",
        isVoter: "false",
      },
  ];

  // Filter to show only voters
  const votersData = residentData.filter((resident) => resident.isVoter === "true");

  return (
    <main className="main-container">
      <div className="section-1">
        <h1>Registered Voter List</h1>

        <Link href="/dashboard/ResidentModule/AddResident">
          <button className="add-announcement-btn">Add New Resident</button>
        </Link>
      </div>

      <div className="section-2">
        <input type="text" className="search-bar" placeholder="Enter Name" />

        <select id="featuredStatus" name="featuredStatus" className="featuredStatus" required defaultValue="">
          <option value="" disabled>
            Location
          </option>
          <option value="east-fairview">East Fairview</option>
          <option value="west-fairview">West Fairview</option>
          <option value="south-fairview">South Fairview</option>
        </select>

        <select id="residentType" name="residentType" className="featuredStatus" required defaultValue="">
          <option value="" disabled>
            Resident Type
          </option>
          <option value="senior-citizen">Senior Citizen</option>
          <option value="student">Student</option>
          <option value="pwd">PWD</option>
          <option value="single-mom">Single Mom</option>
        </select>

        <select id="showCount" name="showCount" className="featuredStatus" required defaultValue="">
          <option value="" disabled>
            Show...
          </option>
          <option value="5">Show 5</option>
          <option value="10">Show 10</option>
        </select>
      </div>

      <div className="main-section">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Birthday</th>
              <th>Place of Birth</th>
              <th>Age</th>
              <th>Sex</th>
              <th>Civil Status</th>
              <th>Occupation</th>
              <th>Contact</th>
              <th>Email Address</th>
              <th>Precinct #</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {votersData.map((resident, index) => (
              <tr key={index}>
                <td>{resident.name}</td>
                <td>{resident.address}</td>
                <td>{resident.birthday}</td>
                <td>{resident.placeOfBirth}</td>
                <td>{resident.age}</td>
                <td>{resident.sex}</td>
                <td>{resident.civilStatus}</td>
                <td>{resident.occupation}</td>
                <td>{resident.contact}</td>
                <td>{resident.email}</td>
                <td>{resident.precinct}</td>
                <td>
                  <div className="actions">
                    <button className="action-view">View</button>
                    <button className="action-edit">Edit</button>
                    <button className="action-delete">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
