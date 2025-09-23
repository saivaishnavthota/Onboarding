import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Select from "react-select";
import "../../Employee/Styles/EmployeeAttendence.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

export default function EmployeeAttendence() {


  const colors = [
    "#0d6efd", // blue
    "#198754", // green
    "#dc3545", // red
    "#fd7e14", // orange
    "#6f42c1", // purple
    "#20c997", // teal
    "#ffc107", // yellow
    "#6610f2", // indigo
  ];


  const [activeTab, setActiveTab] = useState("weekly");
  const [attendance, setAttendance] = useState({});
  const [projects, setProjects] = useState([]);
  const [showSubTaskModal, setShowSubTaskModal] = useState(false); // modal toggle
  const [currentDateKey, setCurrentDateKey] = useState(null);
  const [subTaskInput, setSubTaskInput] = useState({});
  const [toast, setToast] = useState({ message: null, isError: false });
  const [editingSubTask, setEditingSubTask] = useState(null); 
  const [dailyData, setDailyData] = useState([]); // store fetched daily attendance
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [disabledDays, setDisabledDays] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
  const fetchProjects = async () => {
    try {
      const empId = localStorage.getItem("empID"); // or employeeId/hrId
      if (!empId) return;

      const res = await axios.get("http://127.0.0.1:8000/attendance/active-projects", {
        headers: { Authorization: `Bearer ${token}` },
        params: { employee_id: parseInt(empId) } // pass the correct ID
      });

      setProjects(
        res.data.map((p) => ({ value: p.project_id, label: p.project_name }))
      );
    } catch (err) {
      console.error(err);
    }
  };
  fetchProjects();
}, []);


useEffect(() => {
  const fetchWeeklyAttendance = async () => {
    try {
      const empId = localStorage.getItem("empID"); // get manager ID
      if (!empId) return;

      const res = await axios.get("http://127.0.0.1:8000/attendance/weekly", {
        headers: { Authorization: `Bearer ${token}` },
        params: { employee_id: parseInt(empId) } // pass as query param
      });

      setAttendance(res.data); // backend returns manager's employees' attendance
    } catch (err) {
      console.error("Error fetching weekly attendance:", err);
      setToast({ message: "Error fetching weekly attendance", isError: true });
    }
  };

  if (activeTab === "weekly" || activeTab === "calendar") {
    fetchWeeklyAttendance();
  }
}, [activeTab]);


const toggleDayDisable = (date) => {
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" }); // e.g. "Monday"
  setDisabledDays((prev) => {
    if (!prev.includes(dayName)) {
      if (prev.length >= 2) return prev; // still restrict to 2 selections
      return [...prev, dayName];
    } else {
      return prev.filter((d) => d !== dayName);
    }
  });
};


  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getWeekDates = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (today.getDay() === 0 ? 7 : today.getDay() - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates();

  const handleFieldChange = (date, field, value) => {
    const key = formatDate(date);

    setAttendance((prev) => {
      let updated = {
        ...prev,
        [key]: {
          ...prev[key],
          [field]: value,
          status: field === "action" ? value : prev[key]?.status,
        },
      };

      if (field === "projects") {
        const selectedProjects = value.map((p) => p.label);
        updated[key].subTasks = (updated[key].subTasks || []).filter((st) =>
          selectedProjects.includes(st.project)
        );
      }


      return updated;
    });
  };

  const getStatusColor = (status) => {
    if (status === "Present") return "green";
    if (status === "WFH") return "blue";
    if (status === "Leave") return "red";
    return "black";
  };

  const handleAddSubTask = (dateKey, project_name) => {
    setCurrentDateKey(dateKey);
    setSubTaskInput({ project: project_name, subTask: "" });
    setShowSubTaskModal(true);
  };

  const submitSubTask = () => {
    if (editingSubTask) {

      const { dateKey, index } = editingSubTask;
      const updatedSubTasks = [...(attendance[dateKey]?.subTasks || [])];
      updatedSubTasks[index] = { ...subTaskInput };

      handleFieldChange(new Date(dateKey), "subTasks", updatedSubTasks);
      setEditingSubTask(null);
    } else {
      const existing = (attendance[currentDateKey]?.subTasks || []).filter(
        (st) => st.project !== subTaskInput.project
      );

      handleFieldChange(new Date(currentDateKey), "subTasks", [
        ...existing,
        { project: subTaskInput.project, subTask: subTaskInput.subTask },
      ]);
    }

    setShowSubTaskModal(false);
    setSubTaskInput({});
  };


  const deleteSubTask = () => {
    if (!editingSubTask) return;
    const { dateKey, index } = editingSubTask;
    const updatedSubTasks = [...(attendance[dateKey]?.subTasks || [])];
    updatedSubTasks.splice(index, 1);
    handleFieldChange(new Date(dateKey), "subTasks", updatedSubTasks);

    setEditingSubTask(null);
    setShowSubTaskModal(false);
    setSubTaskInput({});
  };

  const getProjectColor = (project) => {
    if (!project) return "#6c757d";
    const index = project
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  useEffect(() => {
  const fetchWeekoffs = async () => {
    try {
      const empId = localStorage.getItem("empID");
      if (!empId) return;

      const res = await axios.get(
        `http://127.0.0.1:8000/weekoffs/${empId}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // res.data is an array of weekoffs
      // Map all saved off_days into disabledDays
      const savedDisabledDays = res.data.flatMap((weekoff) => weekoff.off_days);
      setDisabledDays(savedDisabledDays);
    } catch (err) {
      console.error("Error fetching weekoffs:", err);
    }
  };

  fetchWeekoffs();
}, []); // run once on mount


  useEffect(() => {
    if (activeTab === "daily") {
      fetchDailyData();
    }
  }, [selectedYear, selectedMonth, activeTab]);

  const fetchDailyData = async () => {
  try {
    const empId = localStorage.getItem("empID"); 
    if (!empId) return;

    const res = await axios.get("http://127.0.0.1:8000/attendance/daily", {
      headers: { Authorization: `Bearer ${token}` },
      params: { 
        year: selectedYear, 
        month: selectedMonth, 
        employee_id: parseInt(empId) 
      },
    });

    // Map backend data to table format
    const mappedData = res.data.map((entry) => {
      const dateObj = new Date(entry.date);
      return {
        day: dateObj.toLocaleDateString("en-US", { weekday: "long" }),
        date: formatDate(dateObj),
        status: entry.status || "Not Marked",
        hours: entry.hours || "-",
        projects: entry.projects || [],
        subTasks: entry.subTasks || [],
      };
    });

    setDailyData(mappedData);
  } catch (err) {
    console.error("Error fetching daily attendance", err);
    setToast({ message: "Error fetching daily attendance", isError: true });
  }
};





const fetchSavedAttendance = async () => {
  try {
    const empId = localStorage.getItem("empID"); 
    if (!empId) return;

    const res = await axios.get("http://127.0.0.1:8000/attendance/daily", {
      headers: { Authorization: `Bearer ${token}` },
      params: { employee_id: parseInt(empId) } 
    });

    setDailyData(res.data);
  } catch (err) {
    console.error("Error fetching saved attendance:", err);
    setToast({ message: "Error fetching saved attendance", isError: true });
  }
};
  

const handleSubmit = async () => {
  try {
    const empId = parseInt(localStorage.getItem("empID"));
    if (!empId) {
      setToast({ message: "Employee ID not found", isError: true });
      return;
    }

    // Weekoffs submission (unchanged)
    if (disabledDays && disabledDays.length > 0) {
      const weekStart = formatDate(weekDates[0]);
      const weekEnd = formatDate(weekDates[weekDates.length - 1]);
 const weekoffPayload = {
  employee_id: empId,
  week_start: weekStart,
  week_end: weekEnd,
  off_days: disabledDays, // now contains ["Monday", "Sunday"] instead of ["2025-09-22", "2025-09-28"]
};


      console.log("Weekoffs payload:", weekoffPayload);

      await axios.post(
        "http://127.0.0.1:8000/weekoffs/",
        weekoffPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }

    // Attendance payload as a dict keyed by date
    const attendancePayload = Object.fromEntries(
      Object.entries(attendance)
        // .filter(([_, entry]) => entry.action)
        .map(([date, entry]) => [
          date,
          {
            date,
            action: entry.action,
            hours: Number(entry.hours) || 0,
            project_ids: (entry.projects || [])
              .map(p => projects.find(prj => prj.label === p.label)?.value)
              .filter(Boolean),
            sub_tasks: (entry.subTasks || []).map(st => st.subTask).filter(Boolean),
          },
        ])
    );

    if (Object.keys(attendancePayload).length === 0) {
      setToast({ message: "No valid attendance records to submit", isError: true });
      return;
    }

    console.log("Attendance payload:", attendancePayload);

    await axios.post(
      `http://127.0.0.1:8000/attendance/?employee_id=${empId}`,
      attendancePayload, // send dict directly
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setToast({
      message: `Attendance${disabledDays && disabledDays.length > 0 ? " and weekoffs" : ""} submitted!`,
      isError: false,
    });
  } catch (err) {
    console.error("Error submitting data:", err.response?.data || err);
    setToast({ message: "Error submitting data", isError: true });
  }
};







  return (
    <div className="attendance-container container py-4">
      <h3 className="text-center">Employee Attendance</h3>
      {toast.message && (
        <div
          className={`toast-message ${toast.isError ? "error" : "success"}`}
        >
          <FontAwesomeIcon
            icon={toast.isError ? faTimesCircle : faCheckCircle}
            className="me-2"
          />
          {toast.message}
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "weekly" ? "active" : ""}`}
            onClick={() => setActiveTab("weekly")}
          >
            Weekly View
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "calendar" ? "active" : ""}`}
            onClick={() => setActiveTab("calendar")}
          >
            Calendar View
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "daily" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("daily");
              fetchDailyData(); // fetch when tab is selected
            }}
          >
            Daily View
          </button>
        </li>
      </ul>



      <div className="tab-content p-3 border border-top-0">
        {/* Weekly Table */}
        {activeTab === "weekly" && (
          <>
            {/* Week Off Selector */}
<div className="d-flex justify-content-center align-items-center mb-3">
  <strong className="me-3">Select your week off:</strong>
  {weekDates.map((date, idx) => {
    const key = formatDate(date);
    return (
      <div key={idx} className="mx-2">
        <input
  type="checkbox"
  id={`disable-${key}`}
  checked={disabledDays.includes(date.toLocaleDateString("en-US", { weekday: "long" }))}
  onChange={() => toggleDayDisable(date)}
/>

        <label htmlFor={`disable-${key}`} className="ms-1">
          {date.toLocaleDateString("en-US", { weekday: "short" })}
        </label>
      </div>
    );
  })}
</div>


            <table className="table table-bordered text-center">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th>Hours</th>
                  <th>Projects</th>
                  <th>Sub Tasks</th>
                </tr>
              </thead>
              <tbody>
                {weekDates.map((date) => {
                  const key = formatDate(date);
                  const entry = attendance[key] || { projects: [], subTasks: [] };
                  const isDisabled = disabledDays.includes(key);

                  return (
                    <tr key={key}  className={isDisabled ? "table-secondary" : ""}>
                      <td>
                        {date.toLocaleDateString("en-US", { weekday: "long" })}
                      </td>
                      <td>
                        {date.getDate()}-
                        {date.toLocaleDateString("en-US", { month: "short" })}
                      </td>
                      <td>
                        <select
                          className="form-control"
                          value={entry.action || ""}
                          disabled={isDisabled}
                          onChange={(e) =>
                            handleFieldChange(date, "action", e.target.value)   
                          }
                         
                        >
                          <option value="">-- Select --</option>
                          <option value="Present">Present</option>
                          <option value="WFH">WFH</option>
                          <option value="Leave">Leave</option>
                        </select>
                      </td>
                      <td style={{ color: getStatusColor(entry.action) }}>
                        {entry.action || "Not Marked"}
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          value={entry.hours || ""}
                          disabled={isDisabled}
                          onChange={(e) =>
                            handleFieldChange(date, "hours", e.target.value)
                          }
                        
                        />
                      </td>
                      <td>
                        <Select
                          options={projects}
                          isMulti
                          value={entry.projects}     
                          disabled={isDisabled}
                          onChange={(vals) =>
                            handleFieldChange(date, "projects", vals)
                          }
                        
                          classNamePrefix="multi-select"  
                        />
                      </td>
                      <td>
                        <div className="subtask-container">
                          {entry.subTasks?.map((st, i) => (
                            <div
                              key={i}
                              className="subtask-item"
                              style={{ borderLeftColor: getProjectColor(st.project) }}
                             onClick={() => {
                  if (!isDisabled) {
                    setCurrentDateKey(key);
                    setEditingSubTask({ dateKey: key, index: i });
                    setSubTaskInput({ project: st.project, subTask: st.subTask });
                    setShowSubTaskModal(true);
                  }
                }}
                            >
                              <strong>{st.project}</strong>: {st.subTask}
                            </div>
                          ))}
                        </div>

                        <button
                          className="btn btn-sm btn-info mt-2"
                          onClick={() =>
                            handleAddSubTask(
                              key,
                              entry.projects?.[entry.projects.length - 1]?.label || ""
                            )
                          }
                          disabled={
                           isDisabled ||
                           !entry.projects?.length ||
                           entry.subTasks?.some(
                             (st) =>
                               st.project === entry.projects?.[entry.projects.length - 1]?.label
                           )
                         }
                           >
                          Add Task
                        </button>
                      </td>



                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="text-center mt-3">
              <button className="btn btn-primary" onClick={handleSubmit}>
                Submit Attendance
              </button>
            </div>
          </>
        )}




        {/* Calendar */}
        {activeTab === "calendar" && (
          <Calendar
            value={null}
            tileContent={({ date }) => {
              const key = formatDate(date);
              const entry = attendance[key];
              return entry?.action ? (
                <div
                  style={{
                    fontSize: "0.7rem",
                    marginTop: "3px",
                    color: getStatusColor(entry.action),
                  }}
                >
                  {entry.action} ({entry.hours || "-"}h)
                </div>
              ) : null;
            }}
          />
        )}

        {/* SubTask Modal */}
        {showSubTaskModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h5>{editingSubTask ? "Edit Subtask" : "Add Subtask"}</h5>

              <div className="mb-2">
                <label>Project</label>
                <input
                  type="text"
                  className="form-control"
                  value={subTaskInput.project}
                  readOnly
                />
              </div>

              <div className="mb-2">
                <label>Sub Task</label>
                <input
                  type="text"
                  className="form-control"
                  value={subTaskInput.subTask}
                  onChange={(e) =>
                    setSubTaskInput((prev) => ({
                      ...prev,
                      subTask: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="d-flex justify-content-between">
                {editingSubTask && (
                  <button className="btn btn-danger" onClick={deleteSubTask}>
                    Remove
                  </button>
                )}

                <div>
                  <button
                    className="btn btn-secondary me-2"
                    onClick={() => setShowSubTaskModal(false)}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={submitSubTask}>
                    {editingSubTask ? "Update" : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "daily" && (
          <div> {/* Root wrapper */}
            {/* Filter Bar */}
            <div className="daily-filter-bar">
              <div className="filter-item">
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
                  style={{ maxWidth: "120px" }}
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ].map((name, index) => (
                    <option key={index} value={index + 1}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="table-responsive mt-3">
              <table className="table table-bordered text-center">
                <thead>
                  <tr>
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
                      <td colSpan={6}>No attendance data submitted</td>
                    </tr>
                  ) : (
                    dailyData.map((entry, idx) => (
                      <tr key={idx}>
                        <td>{entry.day}</td>
                        <td>{entry.date}</td>
                        <td>
                          {entry.status ? (
                            <span
                              className={`status-pill ${entry.status === "Present" ? "status-present" :
                                  entry.status === "WFH" ? "status-wfh" :
                                    entry.status === "Leave" ? "status-leave" :
                                      "status-not-marked"
                                }`}
                            >
                              {entry.status}
                            </span>
                          ) : (
                            <span className="status-pill status-not-marked">Not Marked</span>
                          )}
                        </td>

                        <td>{entry.hours || "-"}</td>
                        <td>
                          {entry.projects?.map((p, i) => (
                            <span key={i}>{p.label || p}  <br /></span>
                          ))}
                        </td>
                        <td>
                          {entry.subTasks?.map((st, i) => (
                            <div
                              key={i}
                              className="subtask-item"
                              style={{ borderLeftColor: getProjectColor(st.project) }}
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
        )}
      </div>
    </div>
  );
}