import React, { useState, useEffect } from "react";
import axios from "axios";
import "./NewUserDetails.css";
import { useNavigate } from "react-router-dom";

export default function NewUserDetails() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const employeeId = user?.employeeId || user?.id;
  
  const [employee, setEmployee] = useState({
    employee_id: employeeId,
    full_name: "",
    personal_email: "",
    dob: "",
    contact_no: "",
    address: "",
    graduation_year: "",
    work_experience_years: "",
    emergency_contact_name: "",
    emergency_contact_number: "",
    emergency_contact_relation: "",
    gender: "",
  });

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: null, isError: false });
  const [phoneError, setPhoneError] = useState("");
  const [emergencyError, setEmergencyError] = useState("");

  // Fetch existing employee details on component mount
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        setLoading(true);
        console.log("Fetching details for employee ID:", employeeId); // Debug log
        
        // Try to fetch existing employee details by email if employee_id fails
        let response;
        try {
          response = await axios.get(`http://127.0.0.1:8000/onboarding/details/${employeeId}`);
        } catch (firstError) {
          if (user.email) {
            console.log("Trying to fetch by email:", user.email);
            response = await axios.get(`http://127.0.0.1:8000/onboarding/details/email/${user.email}`);
          } else {
            throw firstError;
          }
        }
        console.log("API Response:", response.data); // Debug log
        
        if (response.data && response.data.data) {
          // If data exists, populate the form with existing details
          // Note: API returns nested data: {status: 'success', data: {...}}
          const apiData = response.data.data;
          const fetchedData = {
            employee_id: employeeId,
            full_name: apiData.full_name || "",
            personal_email: apiData.personal_email || user.email || "",
            dob: apiData.dob || "",
            contact_no: apiData.contact_no || "",
            address: apiData.address || "",
            graduation_year: apiData.graduation_year || "",
            work_experience_years: apiData.work_experience_years || "",
            emergency_contact_name: apiData.emergency_contact_name || "",
            emergency_contact_number: apiData.emergency_contact_number || "",
            emergency_contact_relation: apiData.emergency_contact_relation || "",
            gender: apiData.gender || "",
          };
          
          console.log("Setting employee data:", fetchedData); // Debug log
          setEmployee(fetchedData);
          showToast("Existing details loaded successfully!");
        }
      } catch (error) {
        console.log("Error details:", error.response || error); // Debug log
        
        // If no existing data found (404) or other error, use default values
        if (error.response?.status === 404) {
          console.log("No existing details found, starting fresh");
          // Set email from user data if available
          if (user?.email) {
            setEmployee((prev) => ({
              ...prev,
              personal_email: user.email,
            }));
          }
        } else {
          console.error("Error fetching employee details:", error);
          showToast("Error loading existing details", true);
        }
      } finally {
        setLoading(false);
      }
    };

    console.log("Employee ID:", employeeId); // Debug log
    console.log("User data:", user); // Debug log

    if (employeeId) {
      fetchEmployeeDetails();
    } else {
      console.log("No employee ID found");
      setLoading(false);
    }
  }, [employeeId, user.email]);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast({ message: null, isError: false }), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    const { name, value } = e.target;

    setEmployee((prev) => ({ ...prev, [name]: value }));

    if (name === "contact_no") {
      if (value && value === employee.emergency_contact_number) {
        setPhoneError("Contact number and Emergency contact number cannot be the same");
      } else {
        setPhoneError("");
      }
    }

    if (name === "emergency_contact_number") {
      if (value && value === employee.contact_no) {
        setEmergencyError("Emergency contact number cannot be the same as contact number");
      } else {
        setEmergencyError("");
      }
    }
  };

  const handleSaveDraft = async () => {
    if (employee.contact_no === employee.emergency_contact_number) {
      showToast("Contact number and Emergency contact number cannot be the same", true);
      return;
    }
    try {
      await axios.post("http://127.0.0.1:8000/onboarding/details", employee);
      showToast("Draft saved successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to save draft", true);
    }
  };

  const handleGoToDocs = async () => {
    if (employee.contact_no === employee.emergency_contact_number) {
      showToast("Contact number and Emergency contact number cannot be the same", true);
      return;
    }
    try {
      const res = await axios.post("http://127.0.0.1:8000/onboarding/details", employee);
      localStorage.setItem("employeeDetails", JSON.stringify(res.data));
      showToast("Employee details submitted successfully!");
      navigate("/new-user-form/docs");
    } catch (err) {
      console.error(err);
      showToast("Error submitting employee details", true);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="new-container">
        <div className="employee-details">
          <div className="loading-state">
            <p>Loading your details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="new-container">
      {/* Toast Notification */}
      {toast.message && (
        <div className={`toast-message ${toast.isError ? "error" : "success"}`}>
          {toast.message}
        </div>
      )}

      <div className="employee-details">
        <div className="details-form-section">
          <h2>Onboarding Employee Details</h2>
          <h4>Please fill the details below</h4>
          <div className="form-grid">
            <div>
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                value={employee.full_name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                name="personal_email"
                value={employee.personal_email}
                onChange={handleChange}
                readOnly
                required
              />
            </div>

            <div>
              <label>Date Of Birth</label>
              <input
                type="date"
                name="dob"
                value={employee.dob}
                onChange={handleChange}
                required
              />
            </div>

            {/* Contact Number */}
            <div>
              <label>Contact Number</label>
              <div style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="number"
                  name="contact_no"
                  value={employee.contact_no}
                  onChange={handlePhoneChange}
                  required
                  style={{ flex: 1 }}
                />
              </div>
              {phoneError && <small style={{ color: "red" }}>{phoneError}</small>}
            </div>

            <div>
              <label>Gender</label>
              <select
                name="gender"
                className="form-select"
                value={employee.gender}
                onChange={handleChange}
                required
              >
                <option value="">-- Gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label>Latest Graduation Year</label>
              <input
                type="number"
                name="graduation_year"
                value={employee.graduation_year}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label id="star">Work Experience (years)</label>
              <input
                type="number"
                name="work_experience_years"
                value={employee.work_experience_years}
                onChange={handleChange}
              />
            </div>

            {/* Emergency Contact */}
            <div className="form-grid full-width">
              <div>
                <label>Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={employee.emergency_contact_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Emergency Contact Number</label>
                <input
                  type="number"
                  name="emergency_contact_number"
                  value={employee.emergency_contact_number}
                  onChange={handlePhoneChange}
                  required
                />
                {emergencyError && (
                  <small style={{ color: "red" }}>{emergencyError}</small>
                )}
              </div>
              <div>
                <label>Relationship</label>
                <input
                  type="text"
                  name="emergency_contact_relation"
                  value={employee.emergency_contact_relation}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="full-width">
              <label>Address</label>
              <textarea
                name="address"
                value={employee.address}
                onChange={handleChange}
                required
              ></textarea>
            </div>
          </div>
        </div>

        <div className="button-section">
          <button className="new-button" onClick={handleSaveDraft}>
            Save Draft
          </button>
          <button className="new-button" onClick={handleGoToDocs}>
            Documents Upload
          </button>
        </div>
      </div>
    </div>
  );
}