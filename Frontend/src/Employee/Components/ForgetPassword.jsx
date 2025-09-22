import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Styles/ForgotPassword.css";

const ForgetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

  // Step 1: Request reset link
  const handleRequestLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/users/forgot-password`, { email });
      toast.success(data.message || "Password reset link sent to your email.", { autoClose: 2000 });
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send reset link.", { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code → navigate to UpdatePassword
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/users/verify-reset-code`, {
        email,
        code: resetCode,
      });
      toast.success(data.message || "Code verified successfully!", { autoClose: 2000 });

      // Redirect to change password page after toast
      setTimeout(() => navigate("/change-password", { state: { isForgotPassword: true } }), 2000);

    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid or expired code.", { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <ToastContainer position="top-right" />
      <div className="forgot-box shadow-lg">
        <h2 className="text-center">Forgot Password?</h2>

        {step === 1 && (
          <form onSubmit={handleRequestLink} className="forgot-form">
            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="forgot-form">
            <input
              type="text"
              placeholder="Enter reset code"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              required
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgetPassword;
