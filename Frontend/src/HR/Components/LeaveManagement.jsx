import React, { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import "../Styles/LeaveManagement.css";

export default function LeaveManagement() {
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [toast, setToast] = useState({ message: null, isError: false });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
const user = JSON.parse(localStorage.getItem("user"));

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const [pendingRes, allRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/hr/pending-leaves/${user.id}`),
        axios.get(`http://127.0.0.1:8000/hr/leave-requests/${user.id}`),
      ]);
      setPendingLeaves(pendingRes.data);
      setAllRequests(allRes.data);
      
console.log("Pending:", pendingRes.data, "All:", allRes.data);
    } catch (err) {
      console.error("Error fetching leaves:", err);
      setToast({ message: "Failed to fetch leave data", isError: true });
      setTimeout(() => setToast({ message: null, isError: false }), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleAction = async (leaveId, action) => {
    try {
      setActionLoading({ id: leaveId, action });
      const res = await axios.post(
        `http://127.0.0.1:8000/hr/leave-action/${leaveId}`,
        { action }
      );

      if (res.data.success) {
        setToast({ message: res.data.message || "Action successful!", isError: false });
        fetchLeaves();
      } else {
        setToast({ message: res.data.error || "Action failed", isError: true });
      }
    } catch (err) {
      setToast({ message: "Server error", isError: true });
    } finally {
      setActionLoading(null);
      setTimeout(() => setToast({ message: null, isError: false }), 3000);
    }
  };

  return (
    <div className="hr-leave-container container py-4">
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

      <h3 className="text-center mb-4">HR Leave Management</h3>

      <div className="tabs-wrapper mb-4">
        <button
          className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Pending Leaves
        </button>
        <button
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Requests
        </button>
      </div>

      <div className="tab-content">
        {loading ? (
          <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Fetching data, please wait...</p>
          </div>
        ) : (
          <>
            {activeTab === "pending" && (
              <div className="table-responsive">
                {pendingLeaves.length === 0 ? (
                  <p>No pending leave requests.</p>
                ) : (
                  <table className="table table-bordered table-hover">
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Employee Name / Email</th>
                        <th>Leave Type</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Days</th>
                        <th>Reason</th>
                        <th>Action</th>
                       
                      </tr>
                    </thead>
                    <tbody>
                      {pendingLeaves.map((leave) => (
                        <tr key={leave.id}>
                          <td>{leave.employee_id}</td>
                          <td>
                            {leave.employee_name}
                            <br />
                            <small>{leave.email}</small>
                          </td>
                          <td>{leave.leave_type}</td>
                          <td>{leave.start_date}</td>
                          <td>{leave.end_date}</td>
                          <td>{leave.no_of_days}</td>
                          <td>{leave.final_status}</td>
                          <td>
                            <button
                              className="btn btn-success btn-sm me-2"
                              onClick={() => handleAction(leave.id, "Approved")}
                              disabled={actionLoading?.id === leave.id}
                            >
                              {actionLoading?.id === leave.id &&
                              actionLoading?.action === "Approved" ? (
                                <span
                                  className="spinner-border spinner-border-sm me-1"
                                  role="status"
                                />
                              ) : null}
                              Approve
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleAction(leave.id, "Rejected")}
                              disabled={actionLoading?.id === leave.id}
                            >
                              {actionLoading?.id === leave.id &&
                              actionLoading?.action === "Rejected" ? (
                                <span
                                  className="spinner-border spinner-border-sm me-1"
                                  role="status"
                                />
                              ) : null}
                              Reject
                            </button>
                          </td>
                         
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === "all" && (
              <div className="table-responsive">
                {allRequests.length === 0 ? (
                  <p>No processed leave requests.</p>
                ) : (
                  <table className="table table-bordered table-hover">
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Employee Name / Email</th>
                        <th>Leave Type</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Days</th>
                        <th>Reason</th>
                        <th>Status</th>

                      </tr>
                    </thead>
                    <tbody>
                      {allRequests.map((leave) => (
                        <tr key={leave.id}>
                          <td>{leave.employee_id}</td>
                          <td>
                            {leave.employee_name}
                            <br />
                            <small>{leave.email}</small>
                          </td>
                          <td>{leave.leave_type}</td>
                          <td>{leave.start_date}</td>
                          <td>{leave.end_date}</td>
                          <td>{leave.no_of_days}</td>
                          <td>{leave.reason}</td>
                          <td>{leave.final_status}</td>
                          <td>
                            <span
                              className={`badge ${
                                leave.status === "Approved"
                                  ? "bg-success"
                                  : "bg-danger"
                              }`}
                            >
                              {leave.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
