import React, { useState, useEffect } from "react";
import { FaUpload, FaCheckCircle, FaCheck } from "react-icons/fa";
import axios from "axios";
import "./NewUserDocsUpload.css";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const acceptedFormats = [".pdf", ".doc", ".docx", ".jpg", ".png"];

const user = JSON.parse(localStorage.getItem("user") || "{}");
const employeeId = user.id;

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

export default function NewUserDocsUpload() {
  const [files, setFiles] = useState({});
  const [previewUrls, setPreviewUrls] = useState({});
  const [openSection, setOpenSection] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const showToast = (message, isError = false) => {
    if (isError) {
      toast.error(message, { position: "top-right", autoClose: 3000 });
    } else {
      toast.success(message, { position: "top-right", autoClose: 3000 });
    }
  };

  const isFormValid = () => {
    for (const [, section] of Object.entries(sections)) {
      for (const field of section.fields) {
        if (field.required && !files[field.name]) return false;
      }
    }
    return true;
  };

  const handleDraft = async () => {
    const formData = new FormData();
    formData.append("employeeId", employeeId);

    Object.keys(files).forEach((key) => {
      if (files[key] instanceof File) formData.append(key, files[key]);
    });

    try {
      await axios.post("http://127.0.0.1:8000/onboarding/upload", formData);
      showToast("Draft saved successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to save draft", true);
    }
  };

  const handleSubmitAll = async () => {
    if (!isFormValid()) {
      showToast("Please upload all required documents before submitting!", true);
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("employeeId", employeeId);
    Object.keys(files).forEach((key) => {
      if (files[key] instanceof File) formData.append(key, files[key]);
    });

    try {
      await axios.post("http://127.0.0.1:8000/onboarding/upload", formData);
      showToast("Documents submitted successfully!");
    } catch (err) {
      console.error(err);
      showToast("Error while submitting employee documents.", true);
      setSubmitting(false);
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, [field]: file });
      setPreviewUrls({ ...previewUrls, [field]: URL.createObjectURL(file) });
    }
  };

  const getUploadedCount = (section) =>
    section.fields.filter((f) => files[f.name]).length;

  useEffect(() => {
    async function fetchUploadedDocuments() {
      try {
        setLoading(true);
        const response = await axios.get(`http://127.0.0.1:8000/onboarding/doc/${employeeId}`);
        let documentsData = response.data?.data || response.data;

        const fetchedFiles = {};
        const fetchedPreviews = {};

        Object.keys(documentsData).forEach((field) => {
          if (field === "employeeId" || field === "uploaded_at") return;
          const fieldValue = documentsData[field];
          if (fieldValue === true || (typeof fieldValue === "string" && fieldValue.startsWith("http"))) {
            let fileUrl = fieldValue === true
              ? `http://127.0.0.1:8000/onboarding/doc/${employeeId}/${field}`
              : fieldValue;
            const fileName = fieldValue === true ? `${field}_document.pdf` : fieldValue.split("/").pop();
            fetchedFiles[field] = { name: fileName, url: fileUrl, isExisting: true };
            fetchedPreviews[field] = fileUrl;
          }
        });

        setFiles(fetchedFiles);
        setPreviewUrls(fetchedPreviews);

        if (Object.keys(fetchedFiles).length > 0) {
          showToast(`${Object.keys(fetchedFiles).length} previously uploaded document(s) loaded successfully!`);
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error(err);
          showToast("Error loading previously uploaded documents", true);
        }
      } finally {
        setLoading(false);
      }
    }

    if (employeeId) fetchUploadedDocuments();
    else setLoading(false);
  }, [employeeId]);

  if (loading) return <div className="upload-container"><p>Loading your documents...</p></div>;
  if (submitting) return (
    <div className="thank-you-container">
      <div className="green-circle"><FaCheck className="tick-icon" /></div>
      <h2 className="text-center">Thank You for Completing Onboarding Process</h2> 
     
    </div>
  );

  return (
    <div className="upload-container">
      <ToastContainer />
      <div className="upload-box">
        <h4>Documents Upload</h4>
        <h6><span className="required">*</span> marked documents are mandatory</h6>

        {Object.entries(sections).map(([key, section]) => (
          <div key={key} className="section">
            <div className="section-header" onClick={() => setOpenSection(openSection === key ? null : key)}>
              <h5>{section.title}</h5>
              <span>{getUploadedCount(section)} / {section.fields.length} uploaded</span>
              <span>{openSection === key ? "▲" : "▼"}</span>
            </div>
            {openSection === key && (
              <div className="section-content">
                {section.fields.map((field) => (
                  <div
                    key={field.name}
                    className={`upload-card ${files[field.name] ? "uploaded" : ""}`}
                    onClick={() => document.getElementById(field.name).click()}
                  >
                    <div className="upload-label">{field.label} {field.required && <span className="required">*</span>}</div>
                    <div className="upload-status">
                      {files[field.name] ? <><FaCheckCircle className="icon success" />{files[field.name].isExisting ? "Previously Uploaded" : "Uploaded"}</> : <><FaUpload className="icon" /> Click to upload</>}
                    </div>
                    <input
                      id={field.name}
                      type="file"
                      accept={acceptedFormats.join(",")}
                      style={{ display: "none" }}
                      onChange={(e) => handleFileChange(e, field.name)}
                      disabled={submitting}
                    />
                    {files[field.name] && <a href={previewUrls[field.name]} target="_blank" rel="noopener noreferrer" className="preview-link" onClick={(e) => e.stopPropagation()}>{files[field.name].name || "View File"}</a>}
                  </div>
                ))}
                <p className="note">Accepted formats: {acceptedFormats.join(", ")}</p>
              </div>
            )}
          </div>
        ))}

        <div className="button-group">
          <button type="button" className="btn back" onClick={() => navigate("/new-user-form")} disabled={submitting}>⬅ Back</button>
          <button type="button" className="btn draft" onClick={handleDraft} disabled={submitting}>Save Draft</button>
          <button type="button" className="btn submit" onClick={handleSubmitAll} disabled={submitting}>Submit All</button>
        </div>
      </div>
    </div>
  );
}
