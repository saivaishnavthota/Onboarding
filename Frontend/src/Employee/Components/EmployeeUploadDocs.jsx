import React, { useState, useEffect } from "react";
import { FaUpload, FaCheckCircle } from "react-icons/fa";
import axios from "axios";
import "../Styles/EmployeeUploadDocs.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const acceptedFormats = [".pdf", ".doc", ".docx", ".jpg", ".png"];

const sections = {
  employeeDocs: {
    title: "Employee Documents",
    fields: [
      { name: "updated_resume", label: "Updated Resume", required: false },
      { name: "offer_letter", label: "Offer Letter", required: false },
      { name: "latest_compensation_letter", label: "Latest Compensation Letter", required: false },
      { name: "experience_relieving_letter", label: "Experience & Relieving Letter", required: false },
      { name: "latest_3_months_payslips", label: "Latest 3 months Pay Slips", required: false },
      { name: "form16_or_12b_or_taxable_income", label: "Form 16/ Form 12B / Taxable Income Statement", required: false },
    ],
  },
  educationDocs: {
    title: "Educational Documents",
    fields: [
      { name: "ssc_certificate", label: "SSC Certificate", required: false },
      { name: "hsc_certificate", label: "HSC Certificate", required: false },
      { name: "hsc_marksheet", label: "HSC Marksheet", required: false },
      { name: "graduation_marksheet", label: "Graduation Marksheet", required: false },
      { name: "latest_graduation_certificate", label: "Latest Graduation", required: true },
      { name: "postgraduation_marksheet", label: "Post-Graduation Marksheet", required: false },
      { name: "postgraduation_certificate", label: "Post-Graduation Certificate", required: false },
    ],
  },
  identityDocs: {
    title: "Identity Proof",
    fields: [
      { name: "aadhar", label: "Aadhar", required: true },
      { name: "pan", label: "PAN", required: true },
      { name: "passport", label: "Passport", required: false },
    ],
  },
};

export default function EmployeeUploadDocs() {
  const [files, setFiles] = useState({});
  const [previewUrls, setPreviewUrls] = useState({});
  const [openSection, setOpenSection] = useState(null);
  const [toast, setToast] = useState({ message: null, isError: false });

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const employeeId = user?.employeeId || user?.id;


  const isFormValid = () => {
    for (const [, section] of Object.entries(sections)) {
      for (const field of section.fields) {
        if (field.required && !files[field.name]) return false;
      }
    }
    return true;
  };

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
  };

const handleDraft = async () => {
  const formData = new FormData();
  formData.append("employee_id", employeeId);

  // Send files
  Object.keys(files).forEach((key) => {
    if (files[key] instanceof File) {
      formData.append(key, files[key]);
    }
  });

  // Send status of all fields as booleans
  Object.entries(sections).forEach(([_, section]) => {
    section.fields.forEach((field) => {
      const isUploaded = !!files[field.name]; // true if user uploaded
      formData.append(field.name, isUploaded);
    });
  });

  try {
    await axios.post(`${API_BASE_URL}/documents/save-draft`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    showToast("Draft saved successfully!", false);
  } catch (err) {
    console.error("Draft save error:", err);
    showToast("Error while saving draft.", true);
  }
};

  const handleSubmitAll = async () => {
    if (!isFormValid()) {
      showToast("Please upload all required documents before submitting!", true);
      return;
    }

    const formData = new FormData();
    formData.append("employeeId", employeeId);

    Object.keys(files).forEach((key) => {
      if (files[key] instanceof File) formData.append(key, files[key]);
    });

    try {
      const response = await axios.post(`${API_BASE_URL}/documents/upload`, formData);
      showToast("Documents submitted successfully!", false);
      console.log("Upload result:", response.data);
    } catch (err) {
      console.error("Submission error:", err);
      showToast(`Failed to submit documents: ${err.response?.data?.detail || err.message}`, true);
    }
  };

  useEffect(() => {
  async function fetchData() {
    try {
      const response = await axios.get(`${API_BASE_URL}/documents/emp/${employeeId}`, { withCredentials: true });
      const data = response.data;

      const fetchedFiles = {};
      const fetchedPreviews = {};

      Object.keys(data).forEach((field) => {
        if (field !== "employeeId" && field !== "uploaded_at") {
          if (data[field] === true) {
            // Just mark as uploaded
            fetchedFiles[field] = { name: "Uploaded" };
            fetchedPreviews[field] = null; // No URL yet
          }
        }
      });

      setFiles(fetchedFiles);
      setPreviewUrls(fetchedPreviews);
    } catch (err) {
      console.error("Error fetching uploaded docs:", err);
      showToast("Failed to fetch uploaded documents.", true);
    }
  }

  if (employeeId) {
    fetchData();
  }
}, [API_BASE_URL, employeeId]);

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, [field]: file });
      setPreviewUrls({ ...previewUrls, [field]: URL.createObjectURL(file) });
    }
  };

  const getUploadedCount = (section) => section.fields.filter((f) => files[f.name]).length;

  // 🔹 Toast auto-hide
  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: null, isError: false }), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="upload-container">
      <div className="upload-box">
        <h4>Documents Upload</h4>
        <h6 id="text">
          <span className="required">*</span> marked documents are mandatory to upload
        </h6>

        {toast.message && (
          <div className={`toast-message ${toast.isError ? "error" : "success"}`}>
            <FontAwesomeIcon
                icon={toast.isError ? faTimesCircle : faCheckCircle}
                className="me-2"
              />
            {toast.message}
          </div>
        )}

        {Object.entries(sections).map(([key, section]) => (
          <div key={key} className="section">
            <div className="section-header" onClick={() => setOpenSection(openSection === key ? null : key)}>
              <h5>{section.title}</h5>
              <span className="count">
                {getUploadedCount(section)} / {section.fields.length} uploaded
              </span>
              <span className="arrow">{openSection === key ? "▲" : "▼"}</span>
            </div>

            {openSection === key && (
              <div className="section-content">
                {section.fields.map((field) => (
                  <div
                    key={field.name}
                    className={`upload-card ${files[field.name] ? "uploaded" : ""}`}
                    onClick={() => document.getElementById(field.name).click()}
                  >
                    <div className="upload-label">
                      {field.label} {field.required && <span className="required">*</span>}
                    </div>

                    <div className="upload-status">
                      {files[field.name] ? (
                        <>
                          <FaCheckCircle className="icon success" /> Uploaded
                        </>
                      ) : (
                        <>
                          <FaUpload className="icon" /> Click to upload
                        </>
                      )}
                    </div>

                    <input
                      id={field.name}
                      type="file"
                      accept={acceptedFormats.join(",")}
                      style={{ display: "none" }}
                      onChange={(e) => handleFileChange(e, field.name)}
                    />

                    {files[field.name] && (
                      <a
                        href={previewUrls[field.name]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="preview-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {files[field.name].name || "View File"}
                      </a>
                    )}
                  </div>
                ))}

                <p className="note">Accepted formats: {acceptedFormats.join(", ")}</p>
              </div>
            )}
          </div>
        ))}

        <div className="button-group">
          
          <button type="button" className="btn submit" onClick={handleSubmitAll}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
