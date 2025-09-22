import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../Employee/Styles/EmployeeAttendence.css";

export default function AttendanceDetails() {
  const [dailyData, setDailyData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const token = localStorage.getItem("token");
  const managerId = localStorage.getItem("managerId"); // get managerId from localStorage

  useEffect(() => {
    const fetchDailyData = async () => {
      if (!managerId) return;

      try {
        const res = await axios.get("http://127.0.0.1:8000/attendance/daily", {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            year: selectedYear,
            month: selectedMonth,
            manager_id: parseInt(managerId) // fetch by manager
          }
        });

        const mappedData = res.data.map((entry) => {
          const dateObj = new Date(entry.date);
          return {
            name: entry.name || "N/A",
            email: entry.email || "N/A",
            type: entry.type || "Employee",
            day: dateObj.toLocaleDateString("en-US", { weekday: "long" }),
            date: entry.date,
            status: entry.status || "Not Marked",
            hours: entry.hours || "-",
            projects: entry.projects || [],
            subTasks: entry.subTasks || []
          };
        });

        setDailyData(mappedData);
      } catch (err) {
        console.error("Error fetching daily attendance:", err);
      }
    };

    fetchDailyData();
  }, [managerId, selectedYear, selectedMonth, token]);

  return (
    <div className="attendance-container container py-4 mt-5">
      <h5 className="text-center">Employee Attendance Details</h5>
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

        <div className="filter-item">
          <label><strong>Month:</strong></label>
          <select
            className="form-control form-control-sm"
            style={{ maxWidth: "120px" }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {[
              "January","February","March","April","May","June",
              "July","August","September","October","November","December"
            ].map((name, idx) => (
              <option key={idx} value={idx + 1}>{name}</option>
            ))}
          </select>
        </div>
      </div>

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
            {dailyData.length === 0 ? (
              <tr>
                <td colSpan={8}>No attendance data found</td>
              </tr>
            ) : (
              dailyData.map((entry, idx) => (
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
