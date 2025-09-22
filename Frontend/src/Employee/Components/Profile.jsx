import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Styles/Profile.css";

export default function Profile() {
  const [employee, setEmployee] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    console.log("User from localStorage:", user);

    const employeeId = user.id;
    console.log("Employee ID:", employeeId);

    if (!employeeId) return;

    axios
      .get(`http://127.0.0.1:8000/users/${employeeId}`)
      .then((res) => {
        console.log("API Response:", res.data);
        setEmployee(res.data);
      })
      .catch((err) => {
        console.error("Error fetching employee:", err);
        toast.error("Failed to fetch profile data.", { autoClose: 3000 });
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast.success("Logged out successfully!", { autoClose: 1500 });
    setTimeout(() => navigate("/"), 1500);
  };

  if (!employee) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <ToastContainer position="top-right" />
      <div className="profile-card">
        <h2 className="profile-title">Employee Profile</h2>

        <div className="profile-grid">
          <p><span>Name:</span> {employee.name}</p>
          <p><span>Email:</span> {employee.company_email}</p>
          <p><span>Employment Type:</span> {employee.employmentType}</p>
          <p><span>Role:</span> {employee.role}</p>
          <p><span>Contact Number:</span> {employee.contactNumber}</p>
          <p><span>Date of Joining:</span> {employee.dateOfJoining}</p>
          <p><span>Location:</span> {employee.location}</p>
          <p><span>Assigned Managers:</span> {employee.managers?.join(", ")}</p>
          <p><span>Assigned HRs:</span> {employee.hrs?.join(", ")}</p>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
