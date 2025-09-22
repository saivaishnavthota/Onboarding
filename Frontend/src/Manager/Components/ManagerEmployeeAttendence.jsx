import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
// This attaches autoTable to jsPDF prototype

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";

export default function ManagerEmployeeAttendence() {


  const [month, setMonth] = useState("09");
  const [year, setYear] = useState("2025");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [employees, setEmployees] = useState([]);
  const [dailyData, setDailyData] = useState([]); // new state for daily attendance
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ message: null, isError: false });

  const token = localStorage.getItem("token");

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast({ message: null, isError: false }), 3000);
  };

  useEffect(() => {
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const managerId = localStorage.getItem("managerId"); // get manager ID
      if (!managerId) {
        showToast("Manager ID not found!", true);
        setLoading(false);
        return;
      }

      const res = await axios.get(
        "http://127.0.0.1:8000/attendance/mgr-assigned",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            month: parseInt(month),
            year: parseInt(year),
            manager_id: managerId // pass manager ID
          }
        }
      );
      setEmployees(res.data);
      showToast("Employees loaded successfully!");
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError("Failed to load employees");
      showToast("Failed to load employees", true);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyAttendance = async () => {
    try {
      const managerId = localStorage.getItem("managerId"); // optional for daily attendance
      const res = await axios.get(
        "http://127.0.0.1:8000/attendance/daily",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { month, year, employee_id: managerId } // optional
        }
      );
      setDailyData(res.data);
    } catch (err) {
      console.error("Error fetching daily attendance:", err);
      showToast("Failed to load daily attendance", true);
    }
  };

  fetchEmployees();
  fetchDailyAttendance();
}, [month, year]);


const filteredEmployees = employees.filter((emp) => {
  const matchesSearch =
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    emp.email.toLowerCase().includes(search.toLowerCase());
  const matchesType = type === "All" || emp.type === type;
  return matchesSearch && matchesType;
});

const totalEmployees = employees.length;
const totalPresent = employees.reduce((sum, e) => sum + e.present, 0);
const totalWfh = employees.reduce((sum, e) => sum + e.wfh, 0);
const totalLeave = employees.reduce((sum, e) => sum + e.leave, 0);

const getStatusColor = (status) => {
  if (status === "Present") return "green";
  if (status === "WFH") return "blue";
  if (status === "Leave") return "red";
  return "gray";
};

const getProjectColor = (project) => {

  const colors = ["#f6c23e", "#1cc88a", "#36b9cc", "#e74a3b", "#858796"];
  let hash = 0;
  for (let i = 0; i < project.length; i++) hash += project.charCodeAt(i);
  return colors[hash % colors.length];
};

const exportToExcel = () => {
  try {
    const ws = XLSX.utils.json_to_sheet(
      filteredEmployees.map((emp) => ({
        Name: emp.name,
        Email: emp.email,
        Type: emp.type,
        "Present Days": emp.present,
        "WFH Days": emp.wfh,
        "Leave Days": emp.leave,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_${month}-${year}.xlsx`);
    showToast("Excel exported successfully!");
  } catch (err) {
    console.error(err);
    showToast("Failed to export Excel", true);
  }
};

if (loading) return <p>Loading employees...</p>;
if (error) return <p className="text-danger">{error}</p>;

return (
  <div className="container py-4">
    {/* Toast */}
    {toast.message && (
      <div className={`toast-message ${toast.isError ? "error" : "success"}`}>
        <FontAwesomeIcon
          icon={toast.isError ? faTimesCircle : faCheckCircle}
          className="me-2"
        />
        {toast.message}
      </div>
    )}

    <h3 className="text-center mb-4">Manager Attendance Dashboard</h3>

    {/* Month/Year Filters + Export Buttons */}
    <div className="row mb-4">
      <div className="col-md-3">
        <label>Month</label>
        <select
          className="form-select"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          {[
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ].map((name, idx) => (
            <option key={idx} value={(idx + 1).toString().padStart(2, '0')}>{name}</option>
          ))}
        </select>
      </div>
      <div className="col-md-3">
        <label>Year</label>
        <select
          className="form-select"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          {["2025", "2024", "2023"].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <div className="col-md-6 d-flex align-items-end justify-content-end">
        <button className="btn btn-success btn-sm me-2" onClick={exportToExcel}>
          Export Excel
        </button>

      </div>
    </div>

    {/* Summary Cards */}
    <div className="row text-center mb-4">
      <div className="col-md-3">
        <div className="card p-3 shadow-sm">
          <h6>Total Employees</h6>
          <h4>{totalEmployees}</h4>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card p-3 shadow-sm text-success">
          <h6>Total Present</h6>
          <h4>{totalPresent}</h4>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card p-3 shadow-sm text-primary">
          <h6>Work From Home</h6>
          <h4>{totalWfh}</h4>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card p-3 shadow-sm text-danger">
          <h6>Total Leave</h6>
          <h4>{totalLeave}</h4>
        </div>
      </div>
    </div>

    {/* Search & Type Filter */}
    <div className="d-flex mb-3 gap-2 align-items-end">
  <input
    type="text"
    className="form-control form-control-sm"
    placeholder="Search employee..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{ maxWidth: "400px", height: "38px" }}
  />

  <select
    className="form-select form-select-sm"
    value={type}
    onChange={(e) => setType(e.target.value)}
    style={{ maxWidth: "200px", height: "38px" }}
  >
    <option value="All">All Types</option>
    <option value="Full-time">Full-time</option>
    <option value="Contract">Contract</option>
    <option value="Intern">Intern</option>
  </select>

  <button
    className="btn btn-secondary btn-sm"
    style={{ height: "38px" }}
    onClick={() => {
      setSearch("");
      setType("All");
    }}
  >
    Reset
  </button>
</div>


    {/* Daily Attendance Table */}
    <div className="table-responsive">
  <table className="table table-sm table-bordered table-striped text-center">
    <thead>
      <tr>
        <th>S.No</th>
        <th>Employee</th>
        <th>Present Days</th>
        <th>WFH Days</th>
        <th>Leave Days</th>
      </tr>
    </thead>
    <tbody>
      {filteredEmployees.length === 0 ? (
        <tr>
          <td colSpan="5">No employees found</td>
        </tr>
      ) : (
        filteredEmployees.map((emp, index) => (
          <tr key={emp.id}>
            <td>{index + 1}</td>
            <td>
              <strong>{emp.name}</strong>
              <br />
              <small>{emp.email}</small>
            </td>
            <td className="text-success">{emp.present}</td>
            <td className="text-primary">{emp.wfh}</td>
            <td className="text-danger">{emp.leave}</td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>


    <p className="text-muted text-right">
      Showing {filteredEmployees.length} of {employees.length} employees
    </p>
  </div>
);
}
