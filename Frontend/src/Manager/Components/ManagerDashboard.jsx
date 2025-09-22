import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Logo from "../../assets/Nxzen-logo.jpg";
import ManagerEmployees from "./ManagerEmployees";
import ManagerApplyLeave from "./ManagerApplyLeave";
import ManagerLeaveManagement from "./ManagerLeaveManagement";
import { Link, Routes, Route, useNavigate } from "react-router-dom";
import ManagerExpenseApproval from "./ManagerExpenseApproval";
import UpdatePassword from "../../Employee/Components/UpdatePassword";
import ManagerEmployeeAttendence from "./ManagerEmployeeAttendence";
import ManagerAttendence from "./ManagerAttendance";
import Profile from "../../Employee/Components/Profile";

import {
  faArrowLeft,
  faArrowRight,
  faCalendarCheck,
  faPaperPlane,
  faKey,
  faUserFriends,
  faCalendarAlt,
  faUserCheck,
  faCoins,
  faCircleUser,
} from "@fortawesome/free-solid-svg-icons";

import "../Styles/ManagerDashboard.css"

export default function ManagerDashboard() {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setIsOpen(false);
      else setIsOpen(true);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [username, setUsername] = useState("");

  useEffect(() => {

    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

  const menuItems = [
    { name: "Employees Attendance", icon: faUserCheck, path: "employees-attendance" },
    { name: "Employees", icon: faUserFriends, path: "employees" },
    { name: "Add Attendence", icon: faCalendarAlt, path: "add-attendance" },
    { name: "Apply Leave", icon: faPaperPlane, path: "apply-leave" },
    { name: "Leave Management", icon: faCalendarCheck, path: "leave-manage" },
    { name: "Expense Management", icon: faCoins, path: "expense-manage" },
    { name: "Change Password", icon: faKey, path: "change-password" },
    { name: "Profile", icon: faCircleUser, path: "profile" }

  ];


  return (
    <div className="dashboard">
      {/* Header */}
      <header className="header">
        <div className="logo" onClick={() => navigate("/")}>
          <img src={Logo} alt="Company Logo" className="logo-img" />
          <h2 className="logo-text">Manager Dashboard</h2>
        </div>
        <div
          className="profile"
          style={{ display: "flex", alignItems: "center", gap: "8px", height: "100%" }}
          onClick={() => navigate("/manager-dashboard/profile")}
        >
          <FontAwesomeIcon icon={faCircleUser} size="2x" />
          <span>{username || "Manager"}</span>
        </div>

      </header>

      <div className="main">
        {/* Toggle Sidebar */}
        <button
          className="toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FontAwesomeIcon icon={isOpen ? faArrowLeft : faArrowRight} />
        </button>

        {/* Sidebar */}
        <aside className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
          <nav>
            {menuItems.map((item, idx) => (
              <div key={idx} className="menu-item">
                <Link
                  to={`/manager-dashboard/${item.path}`}
                  className="menu-link"
                  onClick={() => window.scrollTo(0, 0)}
                >
                  <FontAwesomeIcon icon={item.icon} className="menu-icon" />
                  {isOpen && <span className="menu-text">{item.name}</span>}
                </Link>
                {!isOpen && <span className="tooltip">{item.name}</span>}
              </div>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="content">
          <Routes>
            <Route index element={<h3>Welcome to Manager Dashboard</h3>} />
            <Route path="add-attendance" element={<ManagerAttendence />} />
            <Route path="employees-attendance" element={<ManagerEmployeeAttendence />} />
            <Route path="employees" element={<ManagerEmployees />} />
            <Route path="apply-leave" element={<ManagerApplyLeave />} />
            <Route path="leave-manage" element={<ManagerLeaveManagement />} />
            <Route path="expense-manage" element={<ManagerExpenseApproval />} />
            <Route path="change-password" element={<UpdatePassword />} />
            <Route path="profile" element={<Profile />} />
          </Routes>
        </main>
      </div>

      <footer className={`footer ${isOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
  <div className="footer-content container">
    <span>&copy; {new Date().getFullYear()} Nxzen Company. All rights reserved.</span>
    <div className="footer-links">
      <a href="https://www.nxzen.com" target="_blank" rel="noopener noreferrer">Website</a>
    </div>
  </div>
</footer>
    </div>
  );
}
