import React, { useState, useEffect } from "react"; 
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Styles/ApplyLeave.css";

export default function ApplyLeave() {
  const [activeTab, setActiveTab] = useState("apply");
  const [formData, setFormData] = useState({
    leaveType: "",
    halfDay: false,
    startDate: "",
    endDate: "",
    reason: ""
  });
  const [pastLeaves, setPastLeaves] = useState([]);
  const [summary, setSummary] = useState({});
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const employee_id = user.id;

  useEffect(() => {
    fetchSummary();
    fetchPastLeaves();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/leave_balances/${employee_id}`);
      
      const mappedSummary = {
        sick_allocated: res.data.sick_leaves || 0,
        casual_allocated: res.data.casual_leaves || 0,
        annual_allocated: res.data.paid_leaves || 0,
        sickApplied: 0,
        casualApplied: 0,
        annualApplied: 0,
      };

      setSummary(mappedSummary);
    } catch (err) {
      toast.error("Failed to fetch summary. Please try again later.");
    }
  };

  const fetchPastLeaves = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/all_leaves/${employee_id}`);
      setPastLeaves(res.data);
    } catch (err) {
      toast.error("Failed to fetch past leaves. Please try again later.");
    }
  };

  const calculateWorkingDays = (start_date, end_date, halfDay = false) => {
    let current = new Date(start_date);
    const endDate = new Date(end_date);
    let days = 0;

    while (current <= endDate) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        days++;
      }
      current.setDate(current.getDate() + 1);
    }

    if (halfDay && days > 0) {
      return days - 0.5;
    }
    return days;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const getRemainingLeaves = (type) => {
    if (type === "Sick") return (summary.sick_allocated || 0) - (summary.sickApplied || 0);
    if (type === "Casual") return (summary.casual_allocated || 0) - (summary.casualApplied || 0);
    if (type === "Annual") return (summary.annual_allocated || 0) - (summary.annualApplied || 0);
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      toast.warn("Please fill in all required fields.");
      return;
    }
  
    const totalDays = calculateWorkingDays(
      formData.startDate,
      formData.endDate,
      formData.halfDay
    );
  
    if (totalDays <= 0) {
      toast.warn("Invalid date range. Please select valid dates.");
      return;
    }
  
    const remaining = getRemainingLeaves(formData.leaveType);
    if (totalDays > remaining) {
      toast.error(`You don't have enough ${formData.leaveType} leaves. Remaining: ${remaining}`);
      return;
    }
  
    try {
      await axios.post("http://127.0.0.1:8000/apply_leave", {
        employee_id,
        leave_type: formData.leaveType,
        half_day: formData.halfDay,
        start_date: formData.startDate,
        end_date: formData.endDate,
        reason: formData.reason,
        no_of_days: totalDays,
      });
  
      toast.success("Leave applied successfully!");
  
      fetchSummary();
      fetchPastLeaves();
      setActiveTab("past");
  
      setFormData({
        leaveType: "",
        halfDay: false,
        startDate: "",
        endDate: "",
        reason: ""
      });
  
    } catch (err) {
      toast.error("Failed to apply leave. Please try again later.");
    }
  };
  
  const totalDays = formData.startDate && formData.endDate
    ? calculateWorkingDays(formData.startDate, formData.endDate, formData.halfDay)
    : 0;

  const remainingLeaves = getRemainingLeaves(formData.leaveType);
  const isDisabled = totalDays > remainingLeaves && formData.leaveType !== "";

  return (
    <div className="apply-leave-container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <div className="heading"><h2>Apply a Leave</h2></div>

      <div className="summary-row">
        <div className="summary-card">
          <h4>Total Applied Leaves</h4>
          <p>{summary.sickApplied + summary.casualApplied + summary.annualApplied || 0}</p>
        </div>
        <div className="summary-card">
          <h4>Total Available Leaves</h4>
          <p>{(summary.sick_allocated + summary.casual_allocated + summary.annual_allocated) || 0}</p>
        </div>
      </div>

      <div className="summary-row">
        <div className="summary-card sick-card">
          <h4>Sick Leave</h4>
          <p>Allocated: {summary.sick_allocated}</p>
          <p>Applied: {summary.sickApplied}</p>
        </div>
        <div className="summary-card casual-card">
          <h4>Casual Leave</h4>
          <p>Allocated: {summary.casual_allocated}</p>
          <p>Applied: {summary.casualApplied}</p>
        </div>
      </div>

      <div className="summary-row center">
        <div className="summary-card annual-card">
          <h4>Annual Leave</h4>
          <p>Allocated: {summary.annual_allocated}</p>
          <p>Applied: {summary.annualApplied}</p>
        </div>
      </div>

      <div className="form-container">
        <div className="apply-tabs">
          <div className={`apply-tab ${activeTab === "apply" ? "active" : ""}`} onClick={() => setActiveTab("apply")}>
            Apply Leave
          </div>
          <div className={`apply-tab ${activeTab === "past" ? "active" : ""}`} onClick={() => setActiveTab("past")}>
            Past Leaves
          </div>
        </div>

        {activeTab === "apply" && (
          <form className="leave-form" onSubmit={handleSubmit}>
            <label>
              Leave Type:
              <select name="leaveType" value={formData.leaveType} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="Sick">Sick Leave</option>
                <option value="Casual">Casual Leave</option>
                <option value="Annual">Annual Leave</option>
              </select>
            </label>

            <div className="halfday-row">
              <label className="halfday-label">
                <input type="checkbox" name="halfDay" checked={formData.halfDay} onChange={handleChange} />
                Half Day
              </label>
            </div>

            <div className="date-row">
              <label>
                Start Date:
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
              </label>

              <label>
                End Date:
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
              </label>
            </div>

            <label>
              Total Days:
              <input type="text" value={totalDays} readOnly />
            </label>

            <label>
              Reason:
              <textarea name="reason" value={formData.reason} onChange={handleChange} required />
            </label>

            <button type="submit">
  Apply Leave
</button>

          </form>
        )}

        {activeTab === "past" && (
          <div className="past-leaves">
            <h3>Past Leaves</h3>
            {pastLeaves.length === 0 ? (
              <p>No past leaves</p>
            ) : (
              <table className="leave-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Total Days</th>
                    <th>Half Day</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pastLeaves.map((leave) => (
                    <tr key={leave.id}>
                      <td>{leave.leave_type}</td>
                      <td>{leave.start_date}</td>
                      <td>{leave.end_date}</td>
                      <td>{leave.no_of_days}</td>
                      <td>{leave.halfDay ? "Yes" : "No"}</td>
                      <td>{leave.reason}</td>
                      <td>
                        <button className={`status-btn ${leave.status.toLowerCase()}`}>
                          {leave.status}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
