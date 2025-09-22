import { Routes, Route } from "react-router-dom";
import EmployeeLogin from "./Employee/Components/EmployeeLogin";
import Dashboard from "./HR/Components/Dashboard";
import ManagerDashboard from "./Manager/Components/ManagerDashboard";
import EmployeeDashboard from "./Employee/Components/EmployeeDashboard";
import NewUserDetails from "./OnboardingEmployee/NewUserDetails";
import NewUserDocsUpload from "./OnboardingEmployee/NewUserDocsUpload";
import ApplyLeave from "./Employee/Components/ApplyLeave";
import ManagerApplyLeave from "./Manager/Components/ManagerApplyLeave";
import { FaSortAlphaUpAlt } from "react-icons/fa";
import LeaveManagement from "./HR/Components/LeaveManagement";
import ManagerLeaveManagement from "./Manager/Components/ManagerLeaveManagement";
import EmployeeAttendence from "./Employee/Components/EmployeeAttendence";
import Employees from "./HR/Components/Employees";
import OnboardingDocs from "./HR/Components/OnboardingDocs";
import ManagerEmployees from "./Manager/Components/ManagerEmployees";
import ManagerEmployeeAttendence from "./Manager/Components/ManagerEmployeeAttendence";
import EmployeeUploadDocs from "./Employee/Components/EmployeeUploadDocs";
import ExpenseDetails from "./Employee/Components/ExpenseDetails";
import EmployeeForm from "./HR/Components/EmployeeForm";
import HRExpenseApproval from "./HR/Components/HRExpenseApproval";
import ManagerAttendance from "./Manager/Components/ManagerAttendance";
import ManagerExpenseApproval from "./Manager/Components/ManagerExpenseApproval";
import AccountExpenseApproval from "./AccountManager/Components/AccountExpenseApproval";
import AccountManagerDashboard from "./AccountManager/Components/AccountManagerDashboard";
import DocumentCollection from "./HR/Components/DocumentCollection";
import UpdatePassword from "./Employee/Components/UpdatePassword";
import ForgetPassword from "./Employee/Components/ForgetPassword";
import ResetOnboardingPassword from "./Employee/Components/ResetOnboardingPassword";
function App() {
  return (
    <Routes>
      <Route path="/" element={<EmployeeLogin />} />  
      <Route path="/change-onboarding-password" element={<ResetOnboardingPassword />} />    
      <Route path="/change-password" element={<UpdatePassword />} />
       <Route path="/forgot-password" element={<ForgetPassword/>} /> 
      <Route path="/new-user-form" element={  < NewUserDetails/> } />
      <Route path="/new-user-form/docs" element={<NewUserDocsUpload />} />
    <Route
        path="/hr-dashboard/*"
        element={  
            <Dashboard />
        }
      />
      <Route
        path="/manager-dashboard/*"
        element={
            <ManagerDashboard /> 
        }
      /> 

      <Route
        path="/employee-dashboard/*"
        element={
          
            <EmployeeDashboard />
          
        }
      />
      <Route
        path="/account-dashboard/*"
        element={
          
            <AccountManagerDashboard />
          
        }
      />
  </Routes>

  


  )
}


export default App;