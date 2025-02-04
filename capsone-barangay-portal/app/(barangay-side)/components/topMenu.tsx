"use client";

import { useState, useEffect, useRef } from "react";
import "@/CSS/barangaySide/topMenu.css";

export default function TopMenu() {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const toggleDropdown = () => {
        setDropdownOpen((prev) => !prev);
    };

    const handleLogout = () => {
        setDropdownOpen(false); // Close dropdown
        window.location.href = "/logout"; // Redirect to logout page
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && event.target instanceof Node && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="main-container fixed-top">
            <div className="user-container">
                <section className="icon-section">
                    <img src="/images/user.png" alt="User Icon" className="userIcon" />
                </section>
                <section className="user-section">
                    <h1>Justine</h1>
                    <p>Super Admin</p>
                </section>
                <section className="menu-section" ref={dropdownRef}>
                    <img
                        src="/images/down-arrow.png"
                        alt="Menu Icon"
                        className="menuIcon"
                        onClick={toggleDropdown}
                    />
                    <div className={`dropdown ${isDropdownOpen ? "show" : ""}`}>
                        <ul>
                            <li onClick={handleLogout}>Logout</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
}
