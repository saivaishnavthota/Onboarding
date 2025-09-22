import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Logo from "../../assets/Nxzen-logo.jpg";
import CreateEmployee from "./CreateEmployee";
import Employees from "./Employees";
import EmployeeForm from "./EmployeeForm";
import OnboardingDocs from "./OnboardingDocs";
import LeaveManagement from "./LeaveManagement";
import UpdatePassword from "../../Employee/Components/UpdatePassword";
import Profile from "../../Employee/Components/Profile";
import { useLocation, Link, Routes, Route, useNavigate } from "react-router-dom";
import {
  faArrowLeft,
  faArrowRight,
  faCalendarAlt,
  faPaperPlane,
  faUpload,
  faKey,
  faUser,
  faReceipt,
  faCoins,
  faFileAlt,
  faCircleUser,
  faCalendar,
  faUserGroup,
  faCalendarCheck,
  faPlaneCircleCheck,
  faCab
} from "@fortawesome/free-solid-svg-icons";

import "../Styles/Dashboard.css"
import DocumentCollection from "./DocumentCollection";
import HRExpenseApproval from "./HRExpenseApproval";
import AssignLeaveHolidays from "./AssignLeaveHolidays";
import AttendanceOverview from "./AttendanceOverview";


export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(true);
  const [openDropdowns, setOpenDropdowns] = useState({});

  const navigate = useNavigate();
  const location = useLocation();
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

  // Update your menuItems array
  const menuItems = [
    {
      name: "Attendance",
      icon: faCalendarAlt,
      path: "attendance",
      submenus: [
        { name: "Attendance Overview", icon: faUserGroup, path: "employee-attendance-overview" },
        { name: "Employee Attendance", icon: faCalendarCheck, path: "employee-attendance" },
      ]
    },
    { name: "Create Employee", icon: faUser, path: "create-employee" },
    { name: "Employees Form", icon: faReceipt, path: "employees-form" },
    { name: "Onboarded Employees", icon: faUpload, path: "onboard-employees" },
    { name: "Documents Collection", icon: faFileAlt, path: "collect-docs" },
    {
      name: "Leaves & Holidays", icon: faCalendarAlt, path: "leaves",
      submenus: [
        { name: "Assign Leaves/Holidays", icon: faCalendarCheck, path: "assign-leaves" },
        { name: "Leave Management", icon: faPaperPlane, path: "leave-manage" },
      ]
    },

    { name: "Expense Management", icon: faCoins, path: "expense-approval" },
    { name: "Change Password", icon: faKey, path: "change-password" },
  ];

  const [activeItem, setActiveItem] = useState("employee-attendance");

  return (
    <div className="dashboard">

      <header className="header">
        <div className="logo" onClick={() => navigate("/")}>
          <img src={Logo} alt="Company Logo" className="logo-img" />
          <h2 className="logo-text">HR Dashboard</h2>
        </div>
        <div
          className="profile"
          style={{ display: "flex", alignItems: "center", gap: "8px", height: "100%", cursor: "pointer" }}
          onClick={() => navigate("/hr-dashboard/profile")}
        >
          <FontAwesomeIcon icon={faCircleUser} size="2x" />
          <span>
            {username || "Guest"}
          </span>
        </div>
      </header>

      <div className="main">
        <button
          className="toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FontAwesomeIcon icon={isOpen ? faArrowLeft : faArrowRight} />
        </button>
        <aside className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
          <nav>
            {menuItems.map((item, idx) => {
              const hasSubmenu = item.submenus && item.submenus.length > 0;
              const isActive =
                location.pathname.includes(item.path || "") ||
                (hasSubmenu &&
                  item.submenus.some((sub) => location.pathname.endsWith(sub.path)));

              return (
                <div key={idx} className={`menu-item ${isActive ? "active" : ""}`}>
                  <div
                    className="menu-link"
                    onClick={() => {
                      if (hasSubmenu) {
                        setOpenDropdowns((prev) => ({
                          ...prev,
                          [item.name]: !prev[item.name],
                        }));
                      } else if (item.path) {
                        navigate(`/hr-dashboard/${item.path}`);
                      }
                    }}
                  >
                    <FontAwesomeIcon icon={item.icon} className="menu-icon" />
                    {isOpen && <span className="menu-text">{item.name}</span>}
                    {hasSubmenu && isOpen && (
                      <span className="dropdown-arrow">
                        {openDropdowns[item.name] ? "▲" : "▼"}
                      </span>
                    )}
                  </div>

                  {hasSubmenu && openDropdowns[item.name] && (
                    <div className="submenu">
                      {item.submenus.map((sub, subIdx) => (
                        <Link
                          key={subIdx}
                          to={`/hr-dashboard/${sub.path}`}
                          className={`submenu-link ${location.pathname.endsWith(sub.path) ? "active" : ""
                            }`}
                        >
                          <FontAwesomeIcon icon={sub.icon} className="submenu-icon me-2" />
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>




        {/* Content Area */}
        <main className="content">
          <Routes>
            <Route index element={<h3>Welcome to HR Dashboard</h3>} />
            <Route path="create-employee" element={<CreateEmployee />} />
            <Route path="assign-leaves" element={<AssignLeaveHolidays />} />
            <Route path="employee-attendance-overview" element={<AttendanceOverview />} />
            <Route path="employee-attendance" element={<Employees />} />
            <Route path="employees-form" element={<EmployeeForm />} />
            <Route path="onboard-employees" element={<OnboardingDocs />} />
            <Route path="collect-docs" element={<DocumentCollection />} />
            <Route path="leave-manage" element={<LeaveManagement />} />
            <Route path="expense-approval" element={<HRExpenseApproval />} />
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
