import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faSignInAlt } from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Styles/EmployeeLogin.css";
import CompanyLogo from "../../assets/Nxzen-logo.jpg";
import loginImage from "../../assets/nxzen-image1.jpg";
import { getRedirectRoute } from "../../utils/redirectHelper";

const EmployeeLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const oauthData = new URLSearchParams();
      oauthData.append("username", formData.email);
      oauthData.append("password", formData.password);

      const { data } = await axios.post(`${API_BASE_URL}/users/login`, oauthData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const userData = {
        id: data.employeeId,
        name: data.name,
        role: data.role,
        email: data.email,
        onboarding_status: data.onboarding_status,
        login_status: data.login_status,
      };

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.removeItem("passwordChanged");
      localStorage.setItem("managerId", data.employeeId);//changed
      localStorage.setItem("empID",data.employeeId)//changed
      localStorage.setItem("hrID",data.employeeId)//changed


      toast.success("Login successful!", { autoClose: 2000 });

      const redirectPath = getRedirectRoute(userData);
      setTimeout(() => navigate(redirectPath), 500);

    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid credentials", { autoClose: 2000 });
    }
  };

  return (
    <div className="login-page">
      <ToastContainer position="top-right" />
      <div className="login-left">
        <img src={loginImage} alt="Login Visual" className="login-image" />
      </div>

      <div className="login-right">
        <div className="login-container shadow-lg p-4 rounded">
          <div className="text-center mb-4">
            <img src={CompanyLogo} alt="Company Logo" className="company-logo mb-3" />
            <h2>Login</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3 input-group">
              <span className="input-group-text"><FontAwesomeIcon icon={faEnvelope} /></span>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3 input-group">
              <span className="input-group-text"><FontAwesomeIcon icon={faLock} /></span>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn-login w-100">
              <FontAwesomeIcon icon={faSignInAlt} className="me-2" /> Login
            </button>
          </form>

          <p
            className="forgot-password text-center mt-3"
            style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;
