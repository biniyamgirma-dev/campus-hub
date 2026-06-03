import { useState, useEffect } from "react";
import { parseToken, apiFetch } from "./api";
import Login from "./Login";
import StudentDashboard from "./StudentDashboard";
import TeacherDashboard from "./TeacherDashboard";
import AdminDashboard from "./AdminDashboard";
import RegistrationPage from "./RegistrationPage";
import GradeSubmissionPage from "./GradeSubmissionPage";
import CoursesPage from "./CoursesPage";
import ProfilePage from "./ProfilePage";
import SemesterManagementPage from "./SemesterManagementPage";

const NAV = {
  STUDENT: [
    { key: "dashboard",    label: "Dashboard",        icon: "⊞" },
    { key: "courses",      label: "Courses",          icon: "◈" },
    { key: "registration", label: "Registration",     icon: "✎" },
    { key: "profile",      label: "My profile",       icon: "◉" },
  ],
  TEACHER: [
    { key: "dashboard",    label: "Dashboard",        icon: "⊞" },
    { key: "grades",       label: "Grade Submission", icon: "✎" },
    { key: "courses",      label: "Courses",          icon: "◈" },
    { key: "profile",      label: "My profile",       icon: "◉" },
  ],
  ADMIN: [
    { key: "dashboard",  label: "Dashboard",    icon: "⊞" },
    { key: "semesters",  label: "Semesters",    icon: "◫" },
    { key: "courses",    label: "Courses",      icon: "◈" },
    { key: "profile",    label: "My profile",   icon: "◉" },
  ],
};

const ROLE_COLOR = {
  STUDENT: "#6366f1",
  TEACHER: "#10b981",
  ADMIN: "#f59e0b",
};

const S = {
  app: { display: "flex", minHeight: "100vh", background: "#0f1117", fontFamily: "'DM Sans', sans-serif", color: "#f0f0f5" },
  sidebar: {
    width: "220px", flexShrink: 0,
    background: "#1a1d27", borderRight: "1px solid #2a2d3a",
    display: "flex", flexDirection: "column",
    padding: "0",
  },
  sideTop: {
    padding: "1.25rem 1rem",
    borderBottom: "1px solid #2a2d3a",
    display: "flex", alignItems: "center", gap: "10px",
  },
  logoMark: {
    width: "32px", height: "32px", borderRadius: "8px",
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: "700", fontSize: "15px", flexShrink: 0,
  },
  brandName: { fontWeight: "600", fontSize: "15px", color: "#f0f0f5" },
  nav: { flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "2px" },
  navItem: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "8px 10px", borderRadius: "8px",
    fontSize: "13px", color: "#9ca0b8", cursor: "pointer",
    border: "none", background: "transparent", width: "100%", textAlign: "left",
    transition: "background .15s, color .15s",
  },
  navItemActive: {
    background: "#23273a", color: "#f0f0f5",
  },
  navIcon: { fontSize: "14px", width: "18px", textAlign: "center" },
  sideBottom: {
    padding: "0.75rem", borderTop: "1px solid #2a2d3a",
  },
  userRow: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "8px 10px", borderRadius: "8px",
  },
  avatar: {
    width: "30px", height: "30px", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "12px", fontWeight: "700", flexShrink: 0,
  },
  userName: { fontSize: "12px", fontWeight: "500", color: "#f0f0f5", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  userRole: { fontSize: "10px", color: "#6b6f85" },
  logoutBtn: {
    background: "none", border: "none", color: "#4a4e63",
    cursor: "pointer", fontSize: "16px", padding: "4px", lineHeight: 1,
  },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topbar: {
    padding: "0.875rem 1.5rem",
    borderBottom: "1px solid #2a2d3a",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  pageTitle: { fontSize: "16px", fontWeight: "600", color: "#f0f0f5" },
  roleBadge: {
    fontSize: "11px", padding: "3px 10px", borderRadius: "20px",
    fontWeight: "500",
  },
  content: { flex: 1, padding: "1.5rem", overflowY: "auto" },
};

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [page, setPage] = useState("dashboard");
  const [profile, setProfile] = useState(null);

  const payload = token ? parseToken(token) : null;
  const role = payload?.role || "STUDENT";

  useEffect(() => {
    if (token) {
      apiFetch("/users/me/").then((r) => r.ok && r.json()).then((d) => d && setProfile(d));
    }
  }, [token]);

  if (!token) return <Login onLogin={(t) => setToken(t)} />;

  const navItems = NAV[role] || NAV.STUDENT;
  const roleColor = ROLE_COLOR[role] || "#6366f1";
  const initials = profile ? `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}` : "?";

  const pageTitles = { dashboard: "Dashboard", registration: "Course Registration", grades: "Grade Submission", courses: "Courses & Departments", profile: "My profile" , semesters: "Semester Management"};
  return (
    <div style={S.app}>
      <div style={S.sidebar}>
        <div style={S.sideTop}>
          <div style={S.logoMark}>C</div>
          <span style={S.brandName}>Campus Hub</span>
        </div>

        <nav style={S.nav}>
          {navItems.map((item) => (
            <button key={item.key}
              style={{ ...S.navItem, ...(page === item.key ? S.navItemActive : {}) }}
              onClick={() => setPage(item.key)}>
              <span style={S.navIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={S.sideBottom}>
          <div style={S.userRow}>
            <div style={{ ...S.avatar, background: `${roleColor}22`, color: roleColor }}>
              {initials}
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={S.userName}>{profile?.username || payload?.username}</div>
              <div style={S.userRole}>{role}</div>
            </div>
            <button style={S.logoutBtn} title="Sign out"
              onClick={() => { localStorage.clear(); setToken(null); }}>
              ⏻
            </button>
          </div>
        </div>
      </div>

      <div style={S.main}>
        <div style={S.topbar}>
          <span style={S.pageTitle}>{pageTitles[page] || "Page"}</span>
          <span style={{ ...S.roleBadge, background: `${roleColor}18`, color: roleColor, border: `1px solid ${roleColor}44` }}>
            {role}
          </span>
        </div>

        <div style={S.content}>
          {page === "dashboard" && role === "STUDENT" && <StudentDashboard user={payload} />}
          {page === "dashboard" && role === "TEACHER" && <TeacherDashboard user={payload} />}
          {page === "dashboard" && role === "ADMIN"   && <AdminDashboard user={payload} />}
          {page === "registration" && role === "STUDENT" && <RegistrationPage />}
          {page === "profile" && <ProfilePage />}
          {page === "grades" && role === "TEACHER" && <GradeSubmissionPage />}
          {page === "courses" && <CoursesPage role={role} />}
          {page === "semesters" && role === "ADMIN" && <SemesterManagementPage />}
        </div>
      </div>
    </div>
  );
}
