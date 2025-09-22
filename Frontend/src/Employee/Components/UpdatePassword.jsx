import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Styles/UpdatePassword.css";
import { getRedirectRoute } from "../../utils/redirectHelper";

const UpdatePassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isForgotPassword = location.state?.isForgotPassword || false;

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.newPassword !== formData.confirmPassword) {
      toast.warn("New password and Confirm password do not match!");
      setLoading(false);
      return;
    }

    try {
      const payload = isForgotPassword
        ? { newPassword: formData.newPassword }
        : { 
            email: user.email,
            currentPassword: formData.currentPassword,
            new_password: formData.newPassword,
          };

      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000"}/users/reset-password`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update user login_status
      const updatedUser = { ...user, login_status: true };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Password updated successfully!", { autoClose: 2000 });

      // Redirect after toast
      setTimeout(() => {
        const redirectPath = getRedirectRoute(updatedUser, isForgotPassword, true);
        navigate(redirectPath);
      }, 2000);

    } catch (err) {
      toast.error(err.response?.data?.error || "Something went wrong.", { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <ToastContainer position="top-right" />
      <form onSubmit={handleSubmit} className="form-box p-4 shadow-lg rounded">
        <h2 className="mb-4 text-center">Change Password</h2>

        {!isForgotPassword && (
          <div className="mb-3">
            <label>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              className="form-control"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        )}

        <div className="mb-3">
          <label>New Password</label>
          <input
            type="password"
            name="newPassword"
            className="form-control"
            value={formData.newPassword}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>
        <div className="mb-3">
          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            className="form-control"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Updating..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default UpdatePassword;
