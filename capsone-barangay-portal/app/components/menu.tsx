"use client"
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from 'next/link';

const Menu:React.FC = () => {
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const loginMenuRef = useRef<HTMLDivElement | null>(null);

  const toggleLoginOptions = () => {
    setShowLoginOptions((prev) => !prev);
  };

  const toggleLoginOptionsOff = () => {
    setShowLoginOptions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (loginMenuRef.current && !loginMenuRef.current.contains(event.target as Node)) {
        setShowLoginOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const pathname = usePathname();
  const noTopNavPages = [''];

  if (noTopNavPages.includes(pathname)) {
    return null; 
  }

  return (
    <>
      {/* Add new links as we go */}
      <div className="flex bg-slate-400 justify-center space-x-8">
        <Link
          href="/"
          className="hover:text-[white] cursor-pointer"
          onClick={toggleLoginOptionsOff}
        >
          Home
        </Link>
        <div className="relative" ref={loginMenuRef}>
          <p
            id="login-link"
            className="hover:text-[white] cursor-pointer"
            onClick={toggleLoginOptions}
          >
            Login
          </p>
          {showLoginOptions && (
            <div className="absolute w-40 bg-slate-300 rounded-md py-1 px-3">
              <div className="flex flex-col">
                <Link
                  href={"/official"}
                  onClick={toggleLoginOptions}
                  className="hover:text-[white] cursor-pointer"
                >
                  Login For Official
                </Link>
                <Link
                  href={"/resident"}
                  onClick={toggleLoginOptions}
                  className="hover:text-[white] cursor-pointer"
                >
                  Login For Resident
                </Link>
                <Link
                  href={"/register"}
                  onClick={toggleLoginOptions}
                  className="hover:text-[white] cursor-pointer"
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Menu;
