import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function EmployeeForm() {
  const [employees, setEmployees] = useState([]);
  const [managersList, setManagersList] = useState([]);
  const [HRList, setHRList] = useState([]);
  const [locations, setLocations] = useState([]);

  const [selectedEmp, setSelectedEmp] = useState(null);
  const [formData, setFormData] = useState({});

  const showToast = (message, isError = false) => {
    if (isError) toast.error(message, { position: "top-right", autoClose: 2500 });
    else toast.success(message, { position: "top-right", autoClose: 2500 });
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/users/employees");
      setEmployees(res.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
      showToast("Failed to fetch employees.", true);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/users/managers");
      setManagersList(Array.isArray(res.data) ? res.data : res.data.managers || []);
    } catch (err) {
      console.error("Error fetching managers:", err);
      showToast("Failed to fetch managers.", true);
    }
  };

  const fetchHRs = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/users/hrs");
      setHRList(Array.isArray(res.data) ? res.data : res.data.HRs || []);
    } catch (err) {
      console.error("Error fetching HR:", err);
      showToast("Failed to fetch HR list.", true);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/locations");
      setLocations(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("Error fetching locations:", err);
      showToast("Failed to fetch locations.", true);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchManagers();
    fetchHRs();
    fetchLocations();
  }, []);

  const openEditForm = (emp) => {
    setSelectedEmp(emp);
    setFormData({
      doj: "",
      location: "",
      manager1: "",
      manager2: "",
      manager3: "",
      hr1: "",
      hr2: "",
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["location", "manager1", "manager2", "manager3", "hr1", "hr2"].includes(name)
        ? value ? Number(value) : null
        : value,
    }));
  };

  const submitForm = async () => {
    if (!formData.manager1) {
      showToast("Manager1 is required", true);
      return;
    }
    if (!formData.hr1) {
      showToast("HR1 is required", true);
      return;
    }

    try {
      await axios.post("http://127.0.0.1:8000/onboarding/hr/assign", {
        fullname: selectedEmp.name,
        company_email: formData.company_mail,
        to_email: selectedEmp.to_email,
        employee_id: selectedEmp.employeeId,
        doj: formData.doj,
        location_id: formData.location,
        manager1_id: formData.manager1,
        manager2_id: formData.manager2 || null,
        manager3_id: formData.manager3 || null,
        hr1_id: formData.hr1,
        hr2_id: formData.hr2 || null,
      });

      showToast("Assignments updated successfully!");
      setSelectedEmp(null);
      fetchEmployees(); // Refresh table
    } catch (err) {
      console.error("Error submitting:", err);
      showToast("Failed to update assignments.", true);
    }
  };

  // Split employees into assigned and not assigned
  const notAssignedEmployees = employees.filter(emp => emp.hr.length === 0 && emp.managers.length === 0);
  const assignedEmployees = employees.filter(emp => emp.hr.length > 0 || emp.managers.length > 0);

  return (
    <div className="employee-form bg-light">
      <ToastContainer />
      <h3 className="text-center my-4">Employee Management</h3>

      {/* Not Assigned Table */}
      <h5 className="m-4">Not Assigned Employees</h5>
      <div className="table-responsive m-4">
        <table className="table table-sm table-bordered table-striped text-center small-table-text">
          <thead className="thead-dark">
            <tr>
              <th>S.No</th>
              <th>Employee Details</th>
              <th>Type</th>
              <th>Status</th>
              <th>HR(s)</th>
              <th>Manager(s)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {notAssignedEmployees.map((emp, empIndex) => (
              <tr key={emp.employeeId}>
                <td>{empIndex + 1}</td>
                <td>
                  {emp.name}
                  <br />
                  <span style={{ fontSize: "0.85em", color: "#888" }}>{emp.email}</span>
                </td>
                <td>{emp.type}</td>
                <td>Not Assigned</td>
                <td>-</td>
                <td>-</td>
                <td>
                  <button className="btn btn-sm btn-warning" onClick={() => openEditForm(emp)}>
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assigned Table */}
      <h5 className="m-4">Assigned Employees</h5>
      <div className="table-responsive m-4">
        <table className="table table-sm table-bordered table-striped text-center small-table-text">
          <thead className="thead-dark">
            <tr>
              <th>S.No</th>
              <th>Employee Details</th>
              <th>Type</th>
              <th>Status</th>
              <th>HR(s)</th>
              <th>Manager(s)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignedEmployees.map((emp, empIndex) => (
              <tr key={emp.employeeId}>
                <td>{empIndex + 1}</td>
                <td>
                  {emp.name}
                  <br />
                  <span style={{ fontSize: "0.85em", color: "#888" }}>{emp.email}</span>
                </td>
                <td>{emp.type}</td>
                <td>Assigned</td>
                <td>{emp.hr.length > 0 ? emp.hr.join(", ") : "-"}</td>
                <td>{emp.managers.length > 0 ? emp.managers.join(", ") : "-"}</td>
                <td>
                  <button className="btn btn-sm btn-warning" onClick={() => openEditForm(emp)}>
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Popup (unchanged) */}
      {selectedEmp && (
        <div className="modal show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document" style={{ maxWidth: "30%" }}>
            <div className="modal-content p-3">
              <div className="modal-header">
                <h5 className="modal-title">Assign HR/Managers</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedEmp(null)}></button>
              </div>
              <div className="modal-body">
                <div className="col-md-10 mb-2">
                  <label>Full Name</label>
                  <input
                    className="form-control"
                    type="text"
                    value={selectedEmp.name || ""}
                    readOnly
                  />
                </div>

                <div className="col-md-10 mb-2">
                  <label>Company Mail</label>
                  <input
                    className="form-control"
                    type="email"
                    name="company_mail"
                    value={formData.company_mail || ""}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <p><b>Employee ID:</b> Auto-generated after submission</p>

                <div className="col-md-10 mb-2">
                  <label>DOJ</label>
                  <input
                    className="form-control"
                    type="date"
                    name="doj"
                    value={formData.doj || ""}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="mb-2">
                  <label>Location</label>
                  <select
                    className="form-control"
                    name="location"
                    value={formData.location || ""}
                    onChange={handleFormChange}
                  >
                    <option value="">Select Location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-2">
                    <label>Manager 1 (Required)</label>
                    <select
                      className="form-control"
                      name="manager1"
                      value={formData.manager1}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Manager</option>
                      {managersList.map((mgr) => (
                        <option key={mgr.id} value={mgr.id}>{mgr.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-2">
                    <label>Manager 2</label>
                    <select
                      className="form-control"
                      name="manager2"
                      value={formData.manager2}
                      onChange={handleFormChange}
                    >
                      <option value="">Select Manager</option>
                      {managersList.map((mgr) => (
                        <option key={mgr.id} value={mgr.id}>{mgr.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-2">
                    <label>Manager 3</label>
                    <select
                      className="form-control"
                      name="manager3"
                      value={formData.manager3}
                      onChange={handleFormChange}
                    >
                      <option value="">Select Manager</option>
                      {managersList.map((mgr) => (
                        <option key={mgr.id} value={mgr.id}>{mgr.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-2">
                    <label>HR 1 (Required)</label>
                    <select
                      className="form-control"
                      name="hr1"
                      value={formData.hr1}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select HR</option>
                      {HRList.map((hr) => (
                        <option key={hr.id} value={hr.id}>{hr.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-2">
                    <label>HR 2</label>
                    <select
                      className="form-control"
                      name="hr2"
                      value={formData.hr2}
                      onChange={handleFormChange}
                    >
                      <option value="">Select HR</option>
                      {HRList.map((hr) => (
                        <option key={hr.id} value={hr.id}>{hr.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedEmp(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={submitForm}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
