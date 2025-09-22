import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getRedirectRoute } from "../../utils/redirectHelper";
import "../Styles/UpdatePassword.css";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const resetToken = queryParams.get("token");

  const isForgotPassword = true;
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.newPassword !== formData.confirmPassword) {
      toast.warn("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000"}/users/reset-password`,
        { token: resetToken, newPassword: formData.newPassword }
      );

      toast.success("Password reset successfully!", { autoClose: 2000 });

      // Redirect after toast
      setTimeout(() => {
        const redirectPath = getRedirectRoute(user, isForgotPassword);
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
        <h2 className="mb-4 text-center">Reset Password</h2>

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
          {loading ? "Resetting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
