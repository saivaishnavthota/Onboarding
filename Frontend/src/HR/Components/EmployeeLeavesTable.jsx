import React from "react";
import { toast } from "react-toastify";

const EmployeeLeavesTable = ({
  employees,
  editingRow,
  setEditingRow,
  originalEmployees,
  setEmployees,
  setOriginalEmployees,
}) => {
  
  const handleEmployeeChange = (id, field, value) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, [field]: value } : emp))
    );
  };

 
  const handleCancelEdit = () => {
    if (editingRow !== null) {
      const revertedEmployees = employees.map((emp) =>
        emp.id === editingRow
          ? originalEmployees.find((o) => o.id === emp.id) || emp
          : emp
      );
      setEmployees(revertedEmployees);
      setEditingRow(null);
    }
  };

  // Submit changes for a specific row
  const handleSubmitRow = async (id) => {
    const updatedEmployee = employees.find((emp) => emp.id === id);
    if (!updatedEmployee) return;

    if (
      updatedEmployee.sick_leaves < 0 ||
      updatedEmployee.casual_leaves < 0 ||
      updatedEmployee.paid_leaves < 0
    ) {
      toast.error("Leave values cannot be negative!");
      return;
    }

    try {
      await fetch(`http://127.0.0.1:8000/leave-balance/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: id,
          sick_leaves: updatedEmployee.sick_leaves,
          casual_leaves: updatedEmployee.casual_leaves,
          paid_leaves: updatedEmployee.paid_leaves,
        }),
      });

      toast.success(`Employee ${updatedEmployee.name}'s leaves updated!`);

      // Update originalEmployees after successful save
      setOriginalEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? { ...emp, ...updatedEmployee } : emp))
      );

      setEditingRow(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update leaves.");
    }
  };

  return (
    <div className="section">
      <h3 className="sub-title">Employee Leaves</h3>
      <table className="custom-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Type</th>
            <th>Sick Leaves</th>
            <th>Casual Leaves</th>
            <th>Paid Leaves</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.id}</td>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>{emp.type}</td>

              {["sick_leaves", "casual_leaves", "paid_leaves"].map((field) => (
                <td key={field}>
                  <input
                    type="number"
                    value={emp[field] ?? 0}
                    onChange={(e) =>
                      handleEmployeeChange(emp.id, field, Number(e.target.value))
                    }
                    disabled={editingRow !== emp.id} 
                    className="table-input"
                  />
                </td>
              ))}

              <td>
                {editingRow === emp.id ? (
                  <>
                    <button
                      className="btn submit-btn"
                      onClick={() => handleSubmitRow(emp.id)}
                    >
                      Submit
                    </button>
                    <button
                      className="btn cancel-btn ms-2"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="btn edit-btn"
                    onClick={() => setEditingRow(emp.id)}
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
  );
};

export default EmployeeLeavesTable;
