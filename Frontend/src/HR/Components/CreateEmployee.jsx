import React, { useState } from "react";
import axios from "axios";
import "../Styles/CreateEmployee.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CreateEmployee = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    type: "",
  });

  const [loading, setLoading] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/onboarding/hr/create_employee`, formData);
      toast.success(`Employee Created! ID: ${response.data.id}`, { autoClose: 2500 });
      setFormData({ name: "", email: "", role: "", type: "" });
    } catch (error) {
      console.error("Error creating employee:", error);
      toast.error(error.response?.data?.error || "Server error, please try again.", { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <ToastContainer position="top-right" />
      <div className="form-box shadow-lg p-4 rounded">
        <h2 className="text-center mb-4">Registration</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              type="text"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email ID</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Role</label>
            <select
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">-- Select Role --</option>
              <option value="HR">HR</option>
              <option value="Manager">Manager</option>
              <option value="Employee">Employee</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Employment Type</label>
            <select
              name="type"
              className="form-select"
              value={formData.type}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">-- Type --</option>
              <option value="Full-Time">Full time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
            </select>
          </div>

          <div className="center-btn">
            <button type="submit" className="btn btn-primary w-50" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEmployee;
