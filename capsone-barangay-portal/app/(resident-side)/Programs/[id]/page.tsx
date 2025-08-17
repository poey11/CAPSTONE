"use client"
import "@/CSS/Programs/SpecificProgram.css";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Handshake } from "lucide-react";

export default function AnnouncementDetails() {
  const actions = [
    {
      title: "Volunteer",
      description:
        "Join our community efforts and make a direct impact by volunteering.",
      icon: <Users className="icon" />,
    },
    {
      title: "Register",
      description:
        "Attend community events and activities to stay engaged and connected with others.",
      icon: <Handshake className="icon" />,
    },
  ];

  const searchParams = useSearchParams();
  const title = searchParams.get("title");
  const description = searchParams.get("description");
  const date = searchParams.get("date");
  const images = searchParams.getAll("image");
  const Location = searchParams.get("Location");
  const Participants = searchParams.get("Participants");

  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  useEffect(() => {
    if (images.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [images]);

  return (
    <main className="main-container-specific">
      <div className="headerpic-specific">
        <p>ANNOUNCEMENTS</p>
      </div>

      {/* Title + Description Section */}
      <section className="programs-header-specific">
        <h1 className="programs-title-specific">{title}</h1>
        <div className="programs-underline-specific"></div>

        {/* Slideshow */}
        <div className="slideshow-container-specific">
          {images.length > 0 && (
            <div className="slideshow-specific">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Slide ${index + 1}`}
                  className={`slideshow-image-specific ${
                    index === currentSlide ? "active" : ""
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <p className="programs-description-specific">{description}</p>

        {/* Details Section */}
        <div className="programs-details-specific">
          <div className="program-detail-card-specific">
            <h3>Schedule</h3>
            <p>{date}</p>
          </div>

          <div className="program-detail-card-specific">
            <h3>Location</h3>
            <p>{Location}</p>
          </div>

          <div className="program-detail-card-specific">
            <h3>Participants</h3>
            <p>{Participants}</p>
          </div>
        </div>
      </section>

      {/* Actions Section */}
      <section className="get-involved">
        <h2 className="section-title">Get Involved</h2>
        <div className="programs-underline-specific"></div>

        <div className="actions-grid">
          {actions
            .filter(
              (action) =>
                !selectedAction || selectedAction === action.title
            )
            .map((action, index) => (
              <motion.div
                key={index}
                layout
                className={`action-card ${
                  selectedAction === action.title ? "expanded" : ""
                }`}
              >
                {/* Back button (only in expanded mode) */}
                {selectedAction === action.title && (
                  <img
                    src="/images/left-arrow.png"
                    alt="Left Arrow"
                    className="back-btn"
                    onClick={() => setSelectedAction(null)}
                  />
                )}

                <div
                  className="card-content-wrapper"
                  onClick={() => {
                    // Only toggle if not expanded
                    if (!selectedAction) setSelectedAction(action.title);
                  }}
                >
                  <div className="icon">{action.icon}</div>
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>

                {/* Show form when card is selected */}
                {selectedAction === action.title && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.4 }}
                      className="register-form-specific"
                    >
                      <div className="form-group-specific">
                        <label
                          htmlFor="firstname"
                          className="form-label-specific"
                        >
                          First Name <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="firstname"
                          name="firstname"
                          className="form-input-specific"
                          required
                          placeholder="Enter First Name"
                        />
                      </div>

                      <div className="form-group-specific">
                        <label
                          htmlFor="lastname"
                          className="form-label-specific"
                        >
                          Last Name <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="lastname"
                          name="lastname"
                          className="form-input-specific"
                          required
                          placeholder="Enter Last Name"
                        />
                      </div>

                      <div className="form-group-specific">
                        <label
                          htmlFor="contact"
                          className="form-label-specific"
                        >
                          Contact Number <span className="required">*</span>
                        </label>
                        <input
                          type="tel"
                          id="contact"
                          name="contact"
                          className="form-input-specific"
                          required
                          placeholder="Enter Contact Number"
                        />
                      </div>

                      <div className="form-group-specific">
                        <label htmlFor="email" className="form-label-specific">
                          Email Address <span className="required">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className="form-input-specific"
                          required
                          placeholder="Enter Email Address"
                        />
                      </div>

                      <div className="form-group-specific">
                        <label
                          htmlFor="location"
                          className="form-label-specific"
                        >
                          Location <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          className="form-input-specific"
                          required
                          placeholder="Enter Location"
                        />
                      </div>

                      <button
                        type="submit"
                        className="register-button-specific"
                      >
                        {action.title === "Volunteer"
                          ? "Submit Volunteer Form"
                          : "Submit Registration"}
                      </button>
                    </motion.div>
                  </AnimatePresence>
                )}
              </motion.div>
            ))}
        </div>
      </section>
    </main>
  );
}
