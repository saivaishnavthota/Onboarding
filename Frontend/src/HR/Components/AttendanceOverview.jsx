import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../Employee/Styles/EmployeeAttendence.css";

export default function AttendanceOverview() {
  const [dailyData, setDailyData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedRole, setSelectedRole] = useState(""); // Role filter
  const token = localStorage.getItem("token");
  const hrId = localStorage.getItem("hrID"); // HR sees all managers + employees

  useEffect(() => {
    const fetchDailyData = async () => {
      if (!hrId) return;

      try {
        const res = await axios.get("http://127.0.0.1:8000/attendance/hr-daily", {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            year: selectedYear,
            month: selectedMonth,
            hr_id: parseInt(hrId),
          },
        });

        // Map backend data for frontend display
        const mappedData = res.data.map((entry) => {
          const dateObj = new Date(entry.date);
          return {
            employee_id: entry.employee_id,
            name: entry.name || "N/A",
            email: entry.email || "N/A",
            type: entry.type || "Employee", // Backend can send "Manager" for managers
            day: dateObj.toLocaleDateString("en-US", { weekday: "long" }),
            date: entry.date,
            status: entry.status || "Not Marked",
            hours: entry.hours || "-",
            projects: entry.projects || [],
            subTasks: entry.subTasks || [],
          };
        });

        setDailyData(mappedData);
      } catch (err) {
        console.error("Error fetching daily attendance:", err);
      }
    };

    fetchDailyData();
  }, [hrId, selectedYear, selectedMonth, token]);

  // Filter data by role before rendering
  const filteredData = dailyData.filter(
    (entry) => selectedRole === "" || entry.type === selectedRole
  );

  return (
    <div className="attendance-container container py-4 mt-5">
      <h5 className="text-center">Employee Attendance Details</h5>

      {/* Filter bar */}
      <div className="daily-filter-bar d-flex justify-content-center mb-3 mt-3">
        <div className="filter-item me-3">
          <label><strong>Year:</strong></label>
          <select
            className="form-control form-control-sm"
            style={{ maxWidth: "120px" }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="filter-item me-3">
          <label><strong>Month:</strong></label>
          <select
            className="form-control form-control-sm"
            style={{ maxWidth: "120px" }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {[
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"
            ].map((name, idx) => (
              <option key={idx} value={idx + 1}>{name}</option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label><strong>Role:</strong></label>
          <select
            className="form-control form-control-sm"
            style={{ maxWidth: "120px" }}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">All</option>
            <option value="Manager">Manager</option>
            <option value="Employee">Employee</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive mt-3">
        <table className="table table-bordered text-center">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Day</th>
              <th>Date</th>
              <th>Status</th>
              <th>Hours</th>
              <th>Projects</th>
              <th>Sub Tasks</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={8}>No attendance data found</td>
              </tr>
            ) : (
              filteredData.map((entry, idx) => (
                <tr key={idx}>
                  <td>{entry.name} <br/><span>{entry.email}</span></td>
                  <td>{entry.type}</td>
                  <td>{entry.day}</td>
                  <td>{entry.date}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        entry.status === "Present" ? "status-present" :
                        entry.status === "WFH" ? "status-wfh" :
                        entry.status === "Leave" ? "status-leave" : "status-not-marked"
                      }`}
                    >
                      {entry.status}
                    </span>
                  </td>
                  <td>{entry.hours}</td>
                  <td>
                    {entry.projects?.map((p, i) => (
                      <span key={i}>{p.label || p}<br/></span>
                    ))}
                  </td>
                  <td>
                    {entry.subTasks?.map((st, i) => (
                      <div
                        key={i}
                        className="subtask-item"
                        style={{ borderLeftColor: st.project ? "#6c757d" : "#000" }}
                      >
                        <strong>{st.project}</strong>: {st.subTask}
                      </div>
                    ))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
