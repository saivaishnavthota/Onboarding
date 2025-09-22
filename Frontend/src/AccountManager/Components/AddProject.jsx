import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/AddProject.css";

export default function AddProject() {
  const [form, setForm] = useState({
    projectName: "",
    projectObjective: "",
    skillsRequired: "",
    clientRequirements: "",
    budget: "",
    startDate: "",
    endDate: "",
  });

  const [activeTab, setActiveTab] = useState("add");
  const [projects, setProjects] = useState([]);
  const [selectedObjective, setSelectedObjective] = useState(null);
  const [selectedRequirement, setSelectedRequirement] = useState(null);

  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        project_name: form.projectName,
        project_objective: form.projectObjective,
        skills_required: form.skillsRequired,
        client_requirements: form.clientRequirements,
        budget: form.budget,
        start_date: form.startDate,
        end_date: form.endDate,
      };

      const response = await axios.post("http://localhost:8000/projects", payload, { headers: { Authorization: `Bearer ${token}` } });

      alert("Project submitted successfully!");
      console.log("Project submitted:", response.data);
      setForm({
        projectName: "",
        projectObjective: "",
        skillsRequired: "",
        clientRequirements: "",
        budget: "",
        startDate: "",
        endDate: "",
      });
      fetchProjects();
    } catch (error) {
      console.error("Error submitting project:", error);
      alert("Failed to submit project.");
    }
  };

  const handleReset = () => {
    setForm({
      projectName: "",
      projectObjective: "",
      skillsRequired: "",
      clientRequirements: "",
      budget: "",
      startDate: "",
      endDate: "",
    });
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get("http://localhost:8000/projects/get_projects", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };


  useEffect(() => {
    if (activeTab === "view") {
      fetchProjects();
    }
  }, [activeTab]);

  return (
    <div className="add-project-container">
      <div className="add-project-card">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === "add" ? "active" : ""}`}
            onClick={() => setActiveTab("add")}
          >
            Add Project
          </button>
          <button
            className={`tab-btn ${activeTab === "view" ? "active" : ""}`}
            onClick={() => setActiveTab("view")}
          >
            View Projects
          </button>
        </div>

        {activeTab === "add" && (
          <>
            <h2 className="form-title">Add Project</h2>

            <form onSubmit={handleSubmit} className="add-project-form">
              <div>
                <label>Project Name</label>
                <input
                  name="projectName"
                  value={form.projectName}
                  onChange={handleChange}
                  required
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label>Project Objective</label>
                <textarea
                  name="projectObjective"
                  value={form.projectObjective}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="Describe the objective of the project"
                />
              </div>

              <div>
                <label>Technology</label>
                <input
                  name="skillsRequired"
                  value={form.skillsRequired}
                  onChange={handleChange}
                  placeholder="Enter technologies used"
                />
              </div>

              <div>
                <label>Client Requirements</label>
                <textarea
                  name="clientRequirements"
                  value={form.clientRequirements}
                  onChange={handleChange}
                  rows={3}
                  placeholder="List the client's requirements"
                />
              </div>

              <div className="form-row">
                <div>
                  <label>Budget (₹)</label>
                  <input
                    name="budget"
                    value={form.budget}
                    onChange={handleChange}
                    type="number"
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label>Start Date</label>
                  <input
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    type="date"
                  />
                </div>

                <div>
                  <label>End Date</label>
                  <input
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                    type="date"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleReset}
                  className="reset-btn"
                >
                  Reset
                </button>

                <button
                  type="submit"
                  className="submit-btn"
                >
                  Save Project
                </button>
              </div>
            </form>
          </>
        )}

        {activeTab === "view" && (
          <>
            <h2 className="form-title">Project List</h2>
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
                </tr>
              </thead>
              <tbody>
                {projects.length > 0 ? (
                  projects.map((proj, idx) => (
                    <tr key={idx}>
                      <td>{proj.project_name}</td>
                      <td>
                        <button
                          className="view-btn"
                          onClick={() =>
                            setSelectedObjective(
                              selectedObjective === idx ? null : idx
                            )
                          }
                        >
                          {selectedObjective === idx
                            ? "Hide Objective"
                            : "View Objective"}
                        </button>
                        {selectedObjective === idx && (
                          <div className="details-box">{proj.project_objective}</div>
                        )}
                      </td>
                      <td>{proj.skills_required}</td>
                      <td>
                        <button
                          className="view-btn"
                          onClick={() =>
                            setSelectedRequirement(
                              selectedRequirement === idx ? null : idx
                            )
                          }
                        >
                          {selectedRequirement === idx
                            ? "Hide Requirements"
                            : "View Requirements"}
                        </button>
                        {selectedRequirement === idx && (
                          <div className="details-box">{proj.client_requirements}</div>
                        )}
                      </td>
                      <td>{proj.budget}</td>
                      <td>{proj.start_date}</td>
                      <td>{proj.end_date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>
                      No projects found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
