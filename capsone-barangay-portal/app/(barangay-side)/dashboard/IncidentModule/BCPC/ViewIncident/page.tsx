"use client"
import "@/CSS/ResidentModule/ViewIncident.css";
import type { Metadata } from "next";
import { useState } from "react";
import Link from 'next/link';

const metadata: Metadata = {
  title: "Announcement Page for Residents",
  description: "Stay updated with the latest announcements",
};

export default function ViewIncident() {

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

  const complainantsData = {
    name: "Jonnell Quebal",
    Sex: "Male",
    age: 33,
    civilStatus: "Single",
    contact: "09171218101",
  };

  const respondentsData = {
    name: "Jonnell Quebal",
    Sex: "Male",
    age: 33,
    civilStatus: "Single",
    contact: "09171218101",
  };

  const otherinformation = {
    nature: "Roberry",
    date: "2025-01-03",
    location: "Fairview",
  };


  const complainantsFields = [
    { label: "Name", key: "name" },
    { label: "Age", key: "age" },
    { label: "Sex", key: "sex" },
    { label: "Civil Status", key: "civilStatus" },
    { label: "Contact", key: "contact" },
  ];

  const respondentsFields = [
    { label: "Name", key: "name" },
    { label: "Age", key: "age" },
    { label: "Sex", key: "sex" },
    { label: "Civil Status", key: "civilStatus" },
    { label: "Contact", key: "contact" },
  ];

  const otherinformationFields = [
    { label: "Nature", key: "nature" },
    { label: "Date", key: "date" },
    { label: "Location", key: "location" },
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

        {complainantsFields.map((field) => (
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
