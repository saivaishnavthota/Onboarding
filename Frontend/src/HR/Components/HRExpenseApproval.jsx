import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../Manager/Styles/ManagerExpenseApproval.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";

export default function HRExpenseApproval() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [editingStatus, setEditingStatus] = useState({});
  const [toast, setToast] = useState({ message: "", isError: false });

  const token = localStorage.getItem("token");

  const statusMap = {
    pending_hr_approval: "Pending HR Approval",
    approved: "Approved",
    acc_mgr_rejected: "Rejected by Manager",
    hr_approved: "Approved by HR",
    hr_rejected: "Rejected by HR",
    pending_manager_approval: "Pending MGR Approval",
    mgr_rejected: "MGR Rejected",
    pending_account_mgr_approval: "Pending AM Approval"
  };


  const [reasonModal, setReasonModal] = useState({
    isOpen: false,
    expenseId: null,
    reason: "",
    status: "",
  });

  const currentDate = new Date();
  const [monthFilter, setMonthFilter] = useState((currentDate.getMonth() + 1).toString()); // 1-12
  const [yearFilter, setYearFilter] = useState(currentDate.getFullYear().toString());

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [monthFilter, yearFilter, expenses]);

  const fetchExpenses = async () => {
  try {
    const hrId = localStorage.getItem("hrID"); // get HR ID from localStorage
    if (!hrId) {
      showToast("HR ID not found!", true);
      return;
    }

    const params = { hr_id: hrId }; // include hr_id
    if (yearFilter) params.year = yearFilter;
    if (monthFilter) params.month = monthFilter;

    const res = await axios.get(
      "http://localhost:8000/expenses/hr-exp-list",
      {
        headers: { Authorization: `Bearer ${token}` },
        params,
      }
    );

    setExpenses(res.data);
    setFilteredExpenses(res.data);
  } catch (err) {
    console.error("Error fetching expenses:", err);
    showToast("Failed to load expenses", true);
  }
};


  const applyFilters = () => {
    let data = [...expenses];

    if (monthFilter) {
      data = data.filter(
        (exp) =>
          new Date(exp.submitted_at).getMonth() + 1 === parseInt(monthFilter)
      );
    }

    if (yearFilter) {
      data = data.filter(
        (exp) => new Date(exp.submitted_at).getFullYear() === parseInt(yearFilter)
      );
    }

    setFilteredExpenses(data);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleStatusChange = (id, newStatus) => {
    setEditingStatus((prev) => ({ ...prev, [id]: newStatus }));
  };

  const saveStatus = async (id) => {
    const status = editingStatus[id];
    if (!status) return;

    if (status === "Rejected" || status === "Approved") {
      setReasonModal({ isOpen: true, expenseId: id, reason: "", status });
      return;
    }

    try {

    const hrId = localStorage.getItem("hrID");
    if (!hrId) throw new Error("Hr ID not found");

    const formData = new FormData();
    formData.append("status", status);
    formData.append("hr_id", hrId);
      await axios.put(
      `http://localhost:8000/expenses/hr-upd-status/${id}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

      fetchExpenses();
      showToast(`Status updated to "${status}"`, false);

      setEditingStatus((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (err) {
      console.error("Error saving Manager status:", err);
      showToast("Failed to update status", true);
    }
  };

  const handleSubmit = async () => {
  // 1️⃣ Validate reason
  if (!reasonModal.reason.trim()) {
    showToast("Please provide a reason", true);
    return;
  }

  // 2️⃣ Get HR ID from localStorage (or wherever you store it)
  const hrId = localStorage.getItem("hrID");
  if (!hrId) {
    showToast("HR ID not found!", true);
    return;
  }

  // 3️⃣ Prepare FormData to send to backend
  const formData = new FormData();
  formData.append("status", reasonModal.status);
  formData.append("reason", reasonModal.reason);
  formData.append("hr_id", hrId); // send HR ID to backend

  try {
    // 4️⃣ Call backend API
    await axios.put(
      `http://localhost:8000/expenses/hr-upd-status/${reasonModal.expenseId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // 5️⃣ Refresh expense list
    fetchExpenses();
    showToast(`Status updated to "${reasonModal.status}"`, false);

    // 6️⃣ Close modal & reset state
    setReasonModal({ isOpen: false, expenseId: null, reason: "", status: "" });
    setEditingStatus((prev) => {
      const updated = { ...prev };
      delete updated[reasonModal.expenseId];
      return updated;
    });

  } catch (err) {
    console.error("Error updating HR status:", err);
    showToast("Failed to update status", true);
  }
};


  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => {
      setToast({ message: "", isError: false });
    }, 2000);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const [year, month, day] = timestamp.split("-");
    return `${day}/${month}/${year}`; 
  };

  // 🔹 get unique years from data for filter
  const years = [
    ...new Set(expenses.map((exp) => new Date(exp.submitted_at).getFullYear())),
  ];

  return (
    <div className="manager-expense-container">
      <h4 className="heading">HR Expense Approvals</h4>

      {/* 🔹 Month & Year Filters */}
      {/* 🔹 Month & Year Filters */}
      <div className="filters" style={{ textAlign: "center", marginBottom: "15px" }}>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          style={{ marginRight: "10px", padding: "8px", width: "150px" }}
        >
          <option value="">All Months</option>
          <option value="1">January</option>
          <option value="2">February</option>
          <option value="3">March</option>
          <option value="4">April</option>
          <option value="5">May</option>
          <option value="6">June</option>
          <option value="7">July</option>
          <option value="8">August</option>
          <option value="9">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          style={{ marginRight: "10px", padding: "8px", width: "120px" }}
        >
          <option value="">All</option>
          {Array.from({ length: 10 }, (_, i) => {
            const year = new Date().getFullYear() - i;
            return (
              <option key={year} value={year}>
                {year}
              </option>
            );
          })}
        </select>

        {/* 🔹 Reset Button */}
        <button
          onClick={() => {
            setMonthFilter("");
            setYearFilter("");
          }}
          style={{
            padding: "8px 12px",
            background: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Reset Filters
        </button>
      </div>


      {toast.message && (
        <div className={`toast-message ${toast.isError ? "error" : "success"}`}>
          <FontAwesomeIcon
            icon={toast.isError ? faTimesCircle : faCheckCircle}
            className="me-2"
          />
          {toast.message}
        </div>
      )}

      <table className="manager-table">
        <thead>
          <tr className="text-center">
            <th>Employee Details</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Details</th>
            <th>Submitted On</th>
            <th>Status</th>
            <th>Action</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.map((exp) => {
            const currentStatus = exp.status || "Pending";
            const selectedStatus = editingStatus[exp.id] || currentStatus;

            return (
              <React.Fragment key={exp.id}>
                <tr className="text-center">
                  <td className="details">
                    <b>{exp.employeeName}</b> <br />
                    <small>{exp.employeeEmail}</small>
                  </td>
                  <td>{exp.category}</td>
                  <td>
                    {exp.amount} {exp.currency}
                  </td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={() => toggleExpand(exp.id)}
                    >
                      {expandedId === exp.id ? "Hide" : "View"}
                    </button>
                  </td>
                  <td>{formatDate(exp.submitted_at)}</td>
                  <td>
                    <span className={`status ${currentStatus.toLowerCase()}`}>
                      {statusMap[currentStatus] || currentStatus}
                    </span>
                  </td>
                  <td>
                    <select
                      className="dropdown-btn"
                      value={selectedStatus}
                      onChange={(e) =>
                        handleStatusChange(exp.id, e.target.value)
                      }
                    >
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    <button
                      className="btn-save"
                      onClick={() => saveStatus(exp.id)}
                      disabled={selectedStatus === currentStatus}
                    >
                      Save
                    </button>
                  </td>
                  <td>{exp.reason || "-"}</td>
                </tr>

                {expandedId === exp.id && (
                  <tr className="expand-row">
                    <td colSpan="8">
                      <div className="details">
                        <p>
                          <strong>Description:</strong> {exp.description}
                        </p>
                        <p>
                          <strong>Date:</strong> {exp.date}
                        </p>
                        <p>
                          <strong>Tax Included:</strong>{" "}
                          {exp.taxIncluded ? "Yes" : "No"}
                        </p>
                        {exp.attachments && exp.attachments.length > 0 && (
                          <p>
                            {exp.attachments.map((att) => (
                              <a
                                key={att.attachment_id}
                                href={att.file_path}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: "block", marginBottom: "5px" }}
                              >
                                View Attachment
                              </a>
                            ))}
                          </p>
                        )}

                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {reasonModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h5>Reason</h5>
            <textarea
              value={reasonModal.reason}
              onChange={(e) =>
                setReasonModal((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
              placeholder="Enter reason..."
            />
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() =>
                  setReasonModal({
                    isOpen: false,
                    expenseId: null,
                    reason: "",
                    status: "",
                  })
                }
              >
                Cancel
              </button>
              <button className="btn-confirm" onClick={handleSubmit}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}