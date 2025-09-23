import { useState, useEffect } from "react"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import AccountExpenseApproval from "./AccountExpenseApproval";
import UpdatePassword from "../../Employee/Components/UpdatePassword";
import Logo from "../../assets/Nxzen-logo.jpg"; 
import Profile from "../../Employee/Components/Profile";
import AddProject from "./AddProject";
import {
  faArrowLeft,
  faArrowRight,
  faKey,
  faCircleUser,
  faCoins,
  faProjectDiagram
} from "@fortawesome/free-solid-svg-icons";
import "../../Employee/Styles/EmployeeDashboard.css"


export default function AccountManagerDashboard() {
  const [isOpen, setIsOpen] = useState(true);
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
    if (storedUser) setUsername(storedUser);
  }, []);

  const menuItems = [
    { name: "Add Project", icon: faProjectDiagram, path: "add-project" },
    { name: "Submit Expense", icon: faCoins, path: "submit-expense" },
    { name: "Set Password", icon: faKey, path: "change-password" },
  ];

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="header">
        <div className="logo" onClick={() => navigate("/")}>
          <img src={Logo} alt="Company Logo" className="logo-img" />
          <h2 className="logo-text">Account Manager Dashboard</h2>
        </div>
         <div
    className="profile"
    style={{ display: "flex", alignItems: "center", gap: "8px", height: "100%", cursor: "pointer" }}
    onClick={() => navigate("/employee-dashboard/profile")} 
  >
          <FontAwesomeIcon icon={faCircleUser} size="2x" />
          <span>{username }</span>
        </div>
      </header>

      <div className="main">
        {/* Toggle Sidebar */}
        <button className="toggle-btn" onClick={() => setIsOpen(!isOpen)}>
          <FontAwesomeIcon icon={isOpen ? faArrowLeft : faArrowRight} />
        </button>

        {/* Sidebar */}
        <aside className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
          <nav>
            {menuItems.map((item, idx) => {
              const isActive = location.pathname.endsWith(item.path);
              return (
                <div key={idx} className={`menu-item ${isActive ? "active" : ""}`}>
                  <Link
                    to={`/account-dashboard/${item.path}`}
                    className="menu-link"
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <FontAwesomeIcon icon={item.icon} className="menu-icon" />
                    {isOpen && <span className="menu-text">{item.name}</span>}
                  </Link>
                  {!isOpen && <span className="tooltip">{item.name}</span>}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="content">
          <Routes>
            {/* Redirect default to attendance */}
            <Route index element={<Navigate to="/" replace />} />
            <Route path="add-project" element={<AddProject/>} />
            <Route path="submit-expense" element={<AccountExpenseApproval/>} />
            <Route path="change-password" element={<UpdatePassword />} />
            <Route path="profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
