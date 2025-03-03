"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import  { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import "@/CSS/barangaySide/topMenu.css";


interface User{
    name: string;
    role: string;
    
}

export default function TopMenu() {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const { data: session } = useSession();
    const currentUser: User = {
        name: session?.user?.fullName || "User",
        role: session?.user?.position || session?.user?.role || "User",
    }

    if( currentUser.name === "undefined undefined"){
        currentUser.name = "User";
    }
    
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

    const router = useRouter();
    const handleSettings = () => {
        router.push("/dashboard/settingsPage");
    };

    return (
        <div className="main-containerB">
            <div className="user-container">
                <section className="icon-section">
                    <img src="/images/user.png" alt="User Icon" className="userIcon" />
                </section>
                <section className="user-section">
                    <h1>{currentUser.name}</h1>
                    <p>{currentUser.role}</p>
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
                        <li className="module" onClick={handleSettings}>
                            Settings
                        </li>
                            <li
                                onClick={() => signOut({callbackUrl: "/"})}
                                className="module">
                                Log Out
                            </li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
}

