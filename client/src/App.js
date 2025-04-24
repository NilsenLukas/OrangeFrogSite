import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import SidebarDemo from "./components/SidebarDemo";
import Login from "./components/pages/login/Login";
import { Toaster } from "sonner";

// Admin Pages
// Dashboard Page
import Dashboard from "./components/pages/admin/adminDashboard";
// Profile Page
import Profile from "./components/pages/admin/AdminProfile";
// Event Pages
import ManageEvents from "./components/pages/admin/event/ManageEvents";
import ManageUsers from "./components/pages/admin/users/ManageUsers";
import CreateEvent from "./components/pages/admin/event/CreateEvent";
import EditEvent from "./components/pages/admin/event/EditEvent";
import EditUser from "./components/pages/admin/users/EditUser";
import EventDetails from "./components/pages/admin/event/EventDetails";
// Correction Report Pages
import ManageCorrections from "./components/pages/admin/corrections/ManageCorrections";
import CorrectionDetails from "./components/pages/admin/corrections/CorrectionDetails";
import AdminEditCorrectionReport from "./components/pages/admin/corrections/EditCorrectionReport";
import UpdateCorrectionReportStatus from "./components/pages/admin/corrections/UpdateCorrectionReportStatus";
// Job Comment Pages
import AdminManageJobComments from "./components/pages/admin/job-comments/ManageJobComments";
import AdminJobCommentDetails from "./components/pages/admin/job-comments/JobCommentDetails";
// Notifications Page
import AdminNotifications from "./components/pages/admin/notifications/ManageNotifications";
// Invoice Page
import AdminInvoices from "./components/pages/invoice/AdminInvoices";


// User Pages
// Dashboard Page
import UserDashboard from "./components/pages/freelancer/UserDashboard";
// Profile Page
import UserProfile from "./components/pages/freelancer/UserProfile";
// Event Pages
import FindJobs from "./components/pages/freelancer/jobs/FindJobs";
import CurrentJobs from "./components/pages/freelancer/jobs/CurrentJobs";
import UserEventDetails from "./components/pages/freelancer/jobs/EventDetails";
// Time Card Page
import TimeCard from "./components/pages/freelancer/timecard/TimeCard";
// Invoice Page
import UserInvoices from "./components/pages/invoice/UserInvoices";
// Correction Report Pages
import CorrectionReport from "./components/pages/freelancer/report/CorrectionReport";
import ViewCorrections from "./components/pages/freelancer/report/ManageCorrections";
import FreelancerCorrectionDetails from "./components/pages/freelancer/report/CorrectionDetails";
import EditCorrectionReport from "./components/pages/freelancer/report/EditCorrectionReport";
// Job Comment Pages
import FreelancerManageJobComments from "./components/pages/freelancer/job-comments/ManageJobComments";
// Notifications
import FreelancerNotifications from "./components/pages/freelancer/notifications/ManageNotifications";

// Invoice Detail Page
import Invoice from "./components/pages/invoice/Invoice";

// Set Profile Pages
import PasswordReset from "./components/pages/setProfile/PasswordReset";
import CompleteProfile from "./components/pages/setProfile/CompleteProfile";

function App() {
  useEffect(() => {
    document.body.classList.add("dark-mode"); // Force dark mode
    return () => {
      document.body.classList.remove("dark-mode");
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          duration={3000}
          toastOptions={{
            className: "sonner-toast",
            style: { background: "#1f1f1f", color: "#fff", border: "1px solid #333" },
          }}
          richColors
        />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <SidebarDemo role="admin" />
              </PrivateRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="manage-users" element={<ManageUsers />} />
            <Route path="users/edit/:id" element={<EditUser />} />
            <Route path="manage-events" element={<ManageEvents />} />
            <Route path="events/create" element={<CreateEvent />} />
            <Route path="events/:eventId" element={<EventDetails />} />
            <Route path="events/edit/:id" element={<EditEvent />} />
            <Route path="manage-corrections" element={<ManageCorrections />} />
            <Route path="corrections/:correctionId" element={<CorrectionDetails />} />
            <Route path="corrections/edit/:id" element={<AdminEditCorrectionReport />} />
            <Route path="corrections/update-status/:id" element={<UpdateCorrectionReportStatus />} />
            <Route path="manage-job-comments" element={<AdminManageJobComments />} />
            <Route path="job-comments/:jobCommentId" element={<AdminJobCommentDetails />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="invoices/:id" element={<Invoice />} />
          </Route>

          {/* User Routes */}
          <Route
            path="/user/*"
            element={
              <PrivateRoute allowedRoles={["user"]}>
                <SidebarDemo role="user" />
              </PrivateRoute>
            }
          >
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="find-jobs" element={<FindJobs />} />
            <Route path="current-jobs" element={<CurrentJobs />} />
            <Route path="events/:eventID" element={<UserEventDetails />} />
            <Route path="time-card" element={<TimeCard />} />
            <Route path="corrections/create" element={<CorrectionReport />} />
            <Route path="manage-corrections" element={<ViewCorrections />} />
            <Route path="invoices" element={<UserInvoices />} />
            <Route path="invoices/new" element={<Invoice />} />
            <Route path="invoices/:id" element={<Invoice />} />
            <Route path="notifications" element={<FreelancerNotifications />} />
            <Route path="corrections/:correctionId" element={<FreelancerCorrectionDetails />} />
            <Route path="corrections/edit/:id" element={<EditCorrectionReport />} />
            <Route path="manage-job-comments" element={<FreelancerManageJobComments />} />
          </Route>

          {/* Profile Setup Routes */}
          <Route
            path="/reset-password"
            element={
              <PrivateRoute>
                <PasswordReset />
              </PrivateRoute>
            }
          />
          <Route
            path="/complete-profile"
            element={
              <PrivateRoute>
                <CompleteProfile />
              </PrivateRoute>
            }
          />

          {/* Catch-all Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
