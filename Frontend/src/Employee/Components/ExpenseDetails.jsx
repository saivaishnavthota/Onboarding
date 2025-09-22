import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../Styles/ExpenseDetails.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";

export default function ExpenseDetails() {
  const [activeTab, setActiveTab] = useState("submit");
  const [toast, showToast] = useState({ message: null, isError: false });
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    currency: "",
    description: "",
    expense_date: "",
    tax_included: false,
    attachment: null,
  });
  const [expenses, setExpenses] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [expenseDetails, setExpenseDetails] = useState([]);

  // Separate filters for year + month
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);

  const user = JSON.parse(localStorage.getItem("user"));
  const employeeId = user?.id;


  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 16 }, (_, i) => currentYear - 10 + i);

  // Month options
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const statusMap = {
    pending_hr_approval: "Pending HR Approval",
    approved: "Approved",
    acc_mgr_rejected: "Rejected by Manager",
    hr_approved: "Approved by HR",
    hr_rejected: "Rejected by HR",
    pending_manager_approval: "Pending Mgr Approval",
    pending_account_mgr_approval: "Pending AM Approval",
    mgr_rejected: "MGR Rejected"
  };

  // Auto-scroll year dropdown to current year
  const yearSelectRef = useRef(null);
  useEffect(() => {
    if (yearSelectRef.current) {
      const index = years.findIndex((y) => y === currentYear);
      if (index >= 0) {
        yearSelectRef.current.selectedIndex = index;
        yearSelectRef.current.scrollTop = index * 30;
      }
    }
  }, []);

  // Fetch history when tab or filters change
  useEffect(() => {
    if (activeTab === "history") {
      const empID = localStorage.getItem("empID"); // get employee ID
      if (!empID) return;

      let url = `http://localhost:8000/expenses/my-expenses?employee_id=${empID}`;

      if (filterYear) url += `&year=${filterYear}`;
      if (filterMonth) url += `&month=${filterMonth}`;

      axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        .then((res) => setExpenses(res.data))
        .catch((err) => {
          console.error("Error fetching expenses:", err);
          showToast({ message: "Failed to fetch expense history.", isError: true });
        });
    }
  }, [activeTab, filterYear, filterMonth]);


  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const fData = new FormData();
      const employeeId = localStorage.getItem("empID"); // get empID first

      fData.append("employee_id", employeeId);
      fData.append("category", formData.category);
      fData.append("amount", formData.amount);
      fData.append("currency", formData.currency);
      fData.append("description", formData.description || "");
      fData.append("expense_date", formData.expense_date);
      fData.append("tax_included", formData.tax_included);
      fData.append("submit_date", new Date().toISOString().split("T")[0]);

      if (formData.attachment) {
        fData.append("file", formData.attachment);
      }

      await axios.post("http://localhost:8000/expenses/submit-exp", fData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      showToast({ message: "Expense submitted!", isError: false });

      setFormData({
        category: "",
        amount: "",
        currency: "",
        description: "",
        expense_date: "",
        tax_included: false,
        attachment: null,
      });

      setActiveTab("history");
    } catch (err) {
      console.error("Error submitting expense:", err);
      showToast({ message: "Failed to submit expense.", isError: true });
    }
  };


  const handleClear = () => {
    setFormData({
      category: "",
      amount: "",
      currency: "",
      description: "",
      expense_date: "",
      tax_included: false,
      attachment: null,
    });
  };

  const fetchExpenseDetails = async (requestId) => {
    try {
      const res = await axios.get(
        `http://localhost:8000/expenses/details/${requestId}`
      );
      setExpenseDetails(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching expense details:", err);
      showToast("Failed to fetch expense details.", true);
    }
  };

  const toggleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpenseDetails([]);
    } else {
      setExpandedId(id);
      await fetchExpenseDetails(id);
    }
  };

  return (
    <div className="expense-container">
      {toast.message && (
        <div className={`toast-message ${toast.isError ? "error" : "success"}`}>
          <FontAwesomeIcon
            icon={toast.isError ? faTimesCircle : faCheckCircle}
            className="me-2"
          />
          {toast.message}
        </div>
      )}

      <div className="expense-card">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === "submit" ? "active" : ""}`}
            onClick={() => setActiveTab("submit")}
          >
            Submit Expense
          </button>
          <button
            className={`tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Expense History
          </button>
        </div>

        {/* Submit Form */}
        {activeTab === "submit" && (
          <form onSubmit={handleSubmit}>
            <h2>Expense Request</h2>

            <label>Expense Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              <option value="Travel">Travel</option>
              <option value="Food">Food</option>
              <option value="Accommodation">Accommodation</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Training">Training</option>
              <option value="Gifts">Gifts</option>
              <option value="Miscellaneous">Miscellaneous</option>
              <option value="Other">Other</option>
            </select>

            <div className="form-row">
              <div>
                <label>Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Currency</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="INR">INR</option>
                </select>
              </div>
            </div>

            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
            />

            <label>Expense Date</label>
            <input
              type="date"
              name="expense_date"
              value={formData.expense_date}
              onChange={handleChange}
              required
              max={new Date().toISOString().split("T")[0]}
            />

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="tax_included"
                checked={formData.tax_included}
                onChange={handleChange}
              />
              Tax is included in the amount
            </label>

            <label>Attachment (Supported Formats: PDF, JPG, PNG)</label>
            <input type="file" name="attachment" onChange={handleChange} />

            <div className="button-row">
              <button
                type="button"
                className="btn-clear"
                onClick={handleClear}
              >
                Clear Form
              </button>
              <button type="submit" className="btn-submit">
                Submit Request
              </button>
            </div>
          </form>
        )}

        {/* Expense History */}
        {activeTab === "history" && (
          <div className="history">
            <h2>Expense History</h2>
            <button
              className="btn-clear"
              onClick={() => setActiveTab("submit")}
              style={{ marginBottom: "16px" }}
            >
              ← Back
            </button>

            {/* Filters */}
            <div className="filters">
              <div className="filter-group">
                <label htmlFor="year-filter"><strong>Year:</strong></label>
                <select
                  id="year-filter"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                >
                  <option value="">All</option>
                  {Array.from({ length: 6 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="month-filter"><strong>Month:</strong></label>
                <select
                  id="month-filter"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                >
                  <option value="">All</option>
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ].map((month, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {(filterYear || filterMonth) && (
                <button
                  className="btn-clear"
                  onClick={() => {
                    setFilterYear("");
                    setFilterMonth("");
                  }}
                >
                  Reset
                </button>
              )}
            </div>
            <ul className="history-list">
              {expenses.map((exp) => (
                <li key={exp.request_id} className="history-item">
                  <strong>{exp.category}</strong>
                  <div>
                    <button
                      className="btn-hide"
                      onClick={() => toggleExpand(exp.request_id)}
                    >
                      {expandedId === exp.request_id ? "Hide" : "View"}
                    </button>
                    <span
                      className={`status ${exp.status === "approved"
                        ? "status-approved"
                        : exp.status === "rejected"
                          ? "status-rejected"
                          : "status-pending"
                        }`}
                    >
                      {statusMap[exp.status] || "Pending Mgr Approval"}
                    </span>
                  </div>
                  {expandedId === exp.request_id && (
                    <div style={{ marginTop: "10px" }}>
                      <p>
                        <strong>Amount:</strong> {exp.amount} {exp.currency}
                      </p>
                      <p>
                        <strong>Description:</strong> {exp.description}
                      </p>
                      <p>
                        <strong>Date:</strong> {exp.expense_date}
                      </p>
                      <p>
                        <strong>Tax Included:</strong>{" "}
                        {exp.tax_included ? "Yes" : "No"}
                      </p>

                      {exp.attachments &&
                        exp.attachments.map((att) => (
                          <p key={att.attachment_id}>
                            <a
                              href={`http://localhost:8000/${att.file_path}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View Attachment
                            </a>
                          </p>
                        ))}

                      <table className="expense-details-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Reason</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exp.history && exp.history.map((detail, idx) => (
                            <tr key={idx}>
                              <td>{detail.action_by_name}</td>
                              <td>{detail.action_role}</td>
                              <td>{detail.reason || "-"}</td>
                              <td>{detail.action}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}