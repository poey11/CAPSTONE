"use client"
import "@/CSS/ResidentModule/viewresident.css";
import type { Metadata } from "next";
import { useState } from "react";
import Link from 'next/link';

const metadata: Metadata = {
  title: "Announcement Page for Residents",
  description: "Stay updated with the latest announcements",
};

export default function ViewResident() {

  const residentData = {
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
  };

  const residentFields = [
    { label: "Name", key: "name" },
    { label: "Address", key: "address" },
    { label: "Birthday", key: "birthday" },
    { label: "Place of Birth", key: "placeOfBirth" },
    { label: "Age", key: "age" },
    { label: "Sex", key: "sex" },
    { label: "Civil Status", key: "civilStatus" },
    { label: "Occupation", key: "occupation" },
    { label: "Contact", key: "contact" },
    { label: "Email", key: "email" },
    { label: "Precinct", key: "precinct" },
    { label: "Voter", key: "isVoter" }
  ];

  return (
    <main className="main-container">
      <div className="main-content">
        <div className="section-1">
          <Link href="/dashboard/ResidentModule">    
            <button type="submit" className="back-button"></button>
          </Link>
          <p>Resident Details</p>
        </div>

        {residentFields.map((field) => (
          <div className="details-section" key={field.key}>
            <div className="title">
              <p>{field.label}</p>
            </div>
            <div className="description">
              <p>{residentData[field.key as keyof typeof residentData]}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
