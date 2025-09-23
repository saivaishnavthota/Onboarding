import React, { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import "../Styles/ManagerEmployees.css";
import Select from "react-select";

export default function ManagerEmployees() {
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [editRow, setEditRow] = useState(null);
  const [projectInput, setProjectInput] = useState({});
  const [toast, setToast] = useState({ message: null, isError: false });
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const token = localStorage.getItem("token");

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast({ message: null, isError: false }), 3000);
  };

  const fetchEmployees = async () => {
  const managerId = localStorage.getItem("managerId"); // get manager ID
  if (!managerId) {
    console.error("Manager ID not found in localStorage");
    return;
  }

  try {
    const res = await axios.get(
      `http://localhost:8000/projects/manager-employees?manager_id=${managerId}`,
      {
        headers: { Authorization: `Bearer ${token}` } // optional if backend no longer validates token
      }
    );

    setEmployees(res.data);

    const initialInput = {};
    res.data.forEach(emp => {
      initialInput[emp.id] = emp.projects || [];
    });
    setProjectInput(initialInput);

  } catch (err) {
    console.error("Error fetching employees:", err);
    showToast("Failed to fetch employees", true);
  }
};


  const fetchProjects = async () => {
    try {
      const res = await axios.get("http://localhost:8000/projects/all-projects", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(res.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      showToast("Failed to fetch projects", true);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchProjects();
  }, []);

  const submitProject = async (empId) => {
  const projectsToSubmit = projectInput[empId];
  const managerId = localStorage.getItem("managerId"); // get manager ID

  if (!projectsToSubmit) return;

  try {
    await axios.post(
      `http://localhost:8000/projects/employees/${empId}/projects`,
      { 
        projects: projectsToSubmit,
        manager_id: managerId // send manager ID
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    showToast("Projects updated successfully!");
    fetchEmployees();
    setProjectInput(prev => ({ ...prev, [empId]: [] }));
    setEditRow(null);
  } catch (err) {
    console.error("Error submitting projects:", err);
    showToast("Failed to assign projects", true);
  }
};



  return (
    <div className="manager-employees">
      {toast.message && (
        <div className={`toast-message ${toast.isError ? "error" : "success"}`}>
          <FontAwesomeIcon
            icon={toast.isError ? faTimesCircle : faCheckCircle}
            className="me-2"
          />
          {toast.message}
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>HR(s)</th>
              <th>Projects</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const isEditing = editRow === emp.id;
              return (
                <tr key={emp.id}>
                  <td>{emp.id}</td>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>
                    {emp.hr && emp.hr.length > 0 ? (
                      emp.hr.map((hr, i) => <div key={i}>{hr}</div>)
                    ) : (
                      <span className="text-muted">Not Assigned</span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <Select
                        isMulti
                        options={projects.map(proj => ({
                          value: proj.project_name,
                          label: proj.project_name
                        }))}
                        value={(projectInput[emp.id] || []).map(p => ({ value: p, label: p }))}
                        onChange={(selectedOptions) => {
                          setProjectInput(prev => ({
                            ...prev,
                            [emp.id]: selectedOptions.map(opt => opt.value)
                          }));
                        }}
                        placeholder="Select Projects"
                      />
                    ) : emp.projects && emp.projects.length > 0 ? (
                      <span>{emp.projects.join(", ")}</span>
                    ) : (
                      <span className="text-muted">No Projects Assigned</span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <>
                        <button className="btn-cancel" onClick={() => setEditRow(null)}>Cancel</button>
                        <button className="btn-submits" onClick={() => submitProject(emp.id)}>Submit</button>
                      </>
                    ) : (
                      <button className="btn-edit" onClick={() => setEditRow(emp.id)}>Edit</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
