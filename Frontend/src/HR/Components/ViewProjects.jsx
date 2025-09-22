import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../AccountManager/Styles/AddProject.css";

export default function ViewProjects() {
  const [projects, setProjects] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [searchTerm, setSearchTerm] = useState(""); 
  
  const token = localStorage.getItem("token");

  useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/projects/get_projects",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProjects(res.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  fetchData();
}, [token]);


  const toggleExpand = (id, field) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: !prev[id]?.[field],
      },
    }));
  };



  // Filter projects by search term safely
  const filteredProjects = projects.filter((proj) =>
    String(proj.projectName).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="add-project-container">
      <div className="add-project-card">
        <h2 className="form-title">View Projects</h2>

        {/* Search bar */}
        <input
          type="text"
          placeholder="Search by project name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            marginBottom: "15px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            fontSize: "0.95rem",
          }}
        />

        <table className="project-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Objective</th>
              <th>Technology</th>
              <th>Client Requirements</th>
              <th>Budget (₹)</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Employees</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length > 0 ? (
              filteredProjects.map((proj) => (
                <tr key={proj.project_id}>
                  <td>{proj.project_name}</td>

                  {/* Objective */}
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => toggleExpand(proj.project_id, "objective")}
                    >
                      {expanded[proj.project_id]?.objective
                        ? "Hide Objective"
                        : "View Objective"}
                    </button>
                    {expanded[proj.project_id]?.objective && (
                      <div className="details-box">
                        {proj.project_objective}
                      </div>
                    )}
                  </td>

                  {/* Technology (Skills Required) */}
                  <td>{proj.skills_required || "N/A"}</td>

                  {/* Client Requirements */}
                  <td>
                    <button
                      className="view-btn"
                      onClick={() =>
                        toggleExpand(proj.project_id, "requirements")
                      }
                    >
                      {expanded[proj.project_id]?.requirements
                        ? "Hide Requirements"
                        : "View Requirements"}
                    </button>
                    {expanded[proj.project_id]?.requirements && (
                      <div className="details-box">
                        {proj.client_requirements}
                      </div>
                    )}
                  </td>

                  <td>{proj.budget}</td>
                  <td>{proj.start_date}</td>
                  <td>{proj.end_date}</td>

                  {/* Employees */}
                  <td>
                    {proj.assignments && proj.assignments.length > 0 ? (
                      proj.assignments.map((emp, idx) => (
                        <div key={idx} style={{ marginBottom: "4px" }}>
                          {/* <b>{emp.name}</b> – <span>{emp.email}</span> */}
                          {emp.name}
                        </div>
                      ))
                    ) : (
                      <span style={{ fontStyle: "italic", color: "#777" }}>
                        Not assigned
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  No projects found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}