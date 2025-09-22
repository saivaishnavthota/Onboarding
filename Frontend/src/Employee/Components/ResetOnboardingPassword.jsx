import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Styles/UpdatePassword.css";
import { getRedirectRoute } from "../../utils/redirectHelper";

const ResetOnboardingPassword = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const formatApiError = (error) => {
    if (!error.response?.data) return "Network error. Please try again.";
    const { data } = error.response;
    if (data.detail && Array.isArray(data.detail)) {
      return data.detail.map(err => `${err.loc.join('.')} - ${err.msg}`).join(", ");
    }
    return data.detail || data.error || data.message || "Something went wrong.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.newPassword !== formData.confirmPassword) {
      toast.warn("New password and Confirm password do not match!");
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.warn("Password must be at least 6 characters long!");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        employee_id: user.id,
        new_password: formData.newPassword,
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000"}/users/reset-onboarding-password`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update user in localStorage
      const updatedUser = { ...user, login_status: true };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      localStorage.setItem("passwordChanged", "true");

      toast.success("Password updated successfully!", { autoClose: 2000 });

      // Redirect after toast
      setTimeout(() => navigate(getRedirectRoute(updatedUser, false, true)), 2000);

    } catch (err) {
      toast.error(formatApiError(err), { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <ToastContainer position="top-right" />
      <form onSubmit={handleSubmit} className="form-box p-4 shadow-lg rounded">
        <h2 className="mb-4 text-center">Reset Password for Onboarding</h2>
        <p className="text-center text-muted mb-4">
          Please change your password to continue with the onboarding process
        </p>

        <div className="mb-3">
          <label>New Password</label>
          <input
            type="password"
            name="newPassword"
            className="form-control"
            placeholder="Enter new password (min 6 characters)"
            value={formData.newPassword}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label>Confirm New Password</label>
          <input
            type="password"
            name="confirmPassword"
            className="form-control"
            placeholder="Confirm your new password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Updating Password..." : "Update Password"}
        </button>
      </form>
    </div>
  );
};

export default ResetOnboardingPassword;
