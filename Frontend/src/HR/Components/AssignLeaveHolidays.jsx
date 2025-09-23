import React, { useEffect, useState } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSyncAlt } from "@fortawesome/free-solid-svg-icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Styles/AssignLeaveHolidays.css";

export default function AssignLeaveHolidays() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [formData, setFormData] = useState({ date: "", reason: "" });
  const [holidays, setHolidays] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [showHolidaysTable, setShowHolidaysTable] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [editMode, setEditMode] = useState({});
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

  // Fetch locations
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/locations`)
      .then((res) => {
        if (Array.isArray(res.data.data)) setLocations(res.data.data);
      })
      .catch((err) => console.error("Locations fetch error:", err));
  }, []);

  // Fetch employees and leave balances
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/users/employees`)
      .then(async (res) => {
        const employeesData = res.data;

        const leavePromises = employeesData.map(async (emp) => {
          try {
            const leaveRes = await axios.get(
              `${API_BASE_URL}/leave_balances/${emp.employeeId}`
            );
            return {
              ...emp,
              sickLeave: leaveRes.data.sick_leaves || 0,
              casualLeave: leaveRes.data.casual_leaves || 0,
              annualLeave: leaveRes.data.paid_leaves || 0,
              maternity: leaveRes.data.maternity_leaves || 0,
              paternity: leaveRes.data.paternity_leaves || 0,
            };
          } catch {
            return {
              ...emp,
              sickLeave: 0,
              casualLeave: 0,
              annualLeave: 0,
              maternity: 0,
              paternity: 0,
            };
          }
        });

        const employeesWithLeaves = await Promise.all(leavePromises);
        setEmployees(employeesWithLeaves);
      })
      .catch((err) => console.error("Employees fetch error:", err));
  }, []);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddHoliday = () => {
    if (!selectedLocation) return toast.error("Please select a location!");
    if (!formData.date || !formData.reason) return toast.warn("Date & reason required!");

    const newHoliday = { date: formData.date, reason: formData.reason };
    setHolidays((prev) => [...prev, newHoliday]);
    setFormData({ date: "", reason: "" });
    toast.success("Holiday added successfully!");
  };

  const handleViewHolidays = () => {
    if (!selectedLocation) return toast.error("Select a location first!");
    axios
      .get(`${API_BASE_URL}/calendar/by-location/${selectedLocation}`)
      .then((res) => {
        setHolidays(res.data.data || []);
        setShowHolidaysTable(true);
        setShowCalendar(false);
        toast.info("Showing holidays table!");
      })
      .catch((err) => console.error("Holidays fetch error:", err));
  };

  const handleViewCalendar = () => {
    if (!selectedLocation) return toast.error("Select a location first!");
    axios
      .get(`${API_BASE_URL}/calendar/by-location/${selectedLocation}`)
      .then((res) => {
        setHolidays(res.data || []);
        setShowCalendar(true);
        setShowHolidaysTable(false);
        toast.info("Showing holiday calendar!");
      })
      .catch((err) => console.error("Holidays fetch error:", err));
  };

  const handleRefresh = () => {
    setSelectedLocation("");
    setFormData({ date: "", reason: "" });
    setHolidays([]);
    setShowHolidaysTable(false);
    setShowCalendar(false);
    toast.success("Section reset!");
  };

  const handleEditRow = (employeeId) => {
    setEditingRow(employeeId);
    setEditMode((prev) => ({ ...prev, [employeeId]: "custom" })); // default to custom
  };

  const handleEditModeChange = (employeeId, value) => {
    setEditMode((prev) => ({ ...prev, [employeeId]: value }));
  
    if (value === "default") {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.employeeId === employeeId
            ? { ...emp, sickLeave: 6, casualLeave: 6, annualLeave: 15 }
            : emp
        )
      );
    }
  };

  const handleEmployeeChange = (employeeId, field, value) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.employeeId === employeeId ? { ...emp, [field]: Number(value) } : emp
      )
    );
  };

  const handleSubmitRow = async (employeeId) => {
    const updatedEmployee = employees.find((emp) => emp.employeeId === employeeId);
    if (!updatedEmployee) return toast.error("Employee not found!");

    if (
      updatedEmployee.sickLeave < 0 ||
      updatedEmployee.casualLeave < 0 ||
      updatedEmployee.annualLeave < 0
    ) {
      return toast.error("Leave values cannot be negative!");
    }
    const emp = employees.find((e) => e.employeeId === employeeId);
    try {
      const response = await axios.put(`${API_BASE_URL}/leave-balance/${emp.employeeId}`, {
        
        sick_leaves: Number(updatedEmployee.sickLeave),
        casual_leaves: Number(updatedEmployee.casualLeave),
        paid_leaves: Number(updatedEmployee.annualLeave),
      });

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.employeeId === employeeId
            ? {
                ...emp,
                sickLeave: response.data.sick_leaves,
                casualLeave: response.data.casual_leaves,
                annualLeave: response.data.paid_leaves,
              }
            : emp
        )
      );

      toast.success(`Employee ${updatedEmployee.name}'s leaves updated!`);
      setEditingRow(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update leave balance!");
    }
  };

  return (
    <div className="assign-container">
      <ToastContainer position="top-right" autoClose={2000} />
      <h2 className="page-title">Assign Leave & Holidays</h2>

      {/* Section 1: Location & Holidays */}
      <div className="section">
        <h3 className="sub-title">Location & Public Holidays</h3>
        <div className="form-section">
          <label className="label">Location:</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="dropdown"
          >
            <option value="">-- Select Location --</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-section">
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleFormChange}
            className="input"
          />
          <input
            type="text"
            name="reason"
            value={formData.reason}
            onChange={handleFormChange}
            placeholder="Reason"
            className="input"
          />
          <button onClick={handleAddHoliday} className="btn add-btn">
            Add
          </button>
          <button onClick={handleViewHolidays} className="btn view-btn">
            View
          </button>
          <button onClick={handleViewCalendar} className="btn calendar-btn">
            Calendar
          </button>
          <button onClick={handleRefresh} className="btn refresh-btn">
            <FontAwesomeIcon icon={faSyncAlt} />
          </button>
        </div>

        {showHolidaysTable && (
          <div className="table-wrapper">
            <h5 className="text-center">
              Public Holidays for{" "}
              {selectedLocation
                ? locations.find((loc) => loc.id === selectedLocation)?.name
                : ""}
            </h5>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reason</th>
                </tr>
              </thead>
            <tbody>
  {Array.isArray(holidays) && holidays.map((h, i) => (
    <tr key={i}>
      <td>{h.holiday_date || h.date}</td>
      <td>{h.holiday_name || h.reason}</td>
    </tr>
  ))}
</tbody>

            </table>
          </div>
        )}

        {showCalendar && (
          <div className="calendar-wrapper">
            <h5 className="text-center">
              Public Holidays for{" "}
              {selectedLocation
                ? locations.find((loc) => loc.id === selectedLocation)?.name
                : ""}
            </h5>
            <Calendar
              tileClassName={({ date, view }) => {
                if (view === "month") {
                  const localDate = date.toISOString().split("T")[0];
                  if (holidays.some((h) => h.holiday_date === localDate || h.date === localDate))
                    return "holiday-date";
                }
                return null;
              }}
            />
          </div>
        )}
      </div>

      {/* Section 2: Employees */}
      <div className="section">
        <h3 className="sub-title">Employee Leaves</h3>
        <table className="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Sick</th>
              <th>Casual</th>
              <th>Annual</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
  {employees.map((emp) => (
    <tr key={emp.employeeId}>
      <td>{emp.employeeId}</td>
      <td>{emp.name}</td>
      <td>{emp.company_email || emp.email}</td>
      <td>{emp.role}</td>

      {["sickLeave", "casualLeave", "annualLeave"].map((field) => (
        <td key={field}>
          <input
            type="number"
            value={emp[field] ?? 0}
            onChange={(e) =>
              handleEmployeeChange(emp.employeeId, field, e.target.value)
            }
            disabled={
              editingRow !== emp.employeeId ||
              (editMode[emp.employeeId] === "default" &&
                ["sickLeave", "casualLeave", "annualLeave"].includes(field))
            }
            className="table-input"
          />
        </td>
      ))}

      <td>
        {editingRow === emp.employeeId ? (
          <div className="edit-dropdown-wrapper" style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <select
              value={editMode[emp.employeeId] || "custom"}
              onChange={(e) => handleEditModeChange(emp.employeeId, e.target.value)}
              className="edit-mode-dropdown"
            >
              <option value="default">Default</option>
              <option value="custom">Custom</option>
            </select>
            <button
              className="btn submit-btn"
              onClick={() => handleSubmitRow(emp.employeeId)}
            >
              Submit
            </button>
          </div>
        ) : (
          <button
            className="btn edit-btn"
            onClick={() => handleEditRow(emp.employeeId)}
          >
            Edit
          </button>
        )}
      </td>
    </tr>
  ))}
</tbody>

        </table>
      </div>
    </div>
  );
}
