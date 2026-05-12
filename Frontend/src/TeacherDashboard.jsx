import { useState, useEffect } from "react";
import { apiFetch } from "./api";

const S = {
  wrap: { animation: "fadeUp .4s ease both" },
  banner: {
    background: "linear-gradient(120deg,#0f1a12 60%,#111a1a)",
    border: "1px solid #1e3020",
    borderRadius: "16px", padding: "1.5rem",
    marginBottom: "1.25rem",
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", flexWrap: "wrap", gap: "1rem",
  },
  greeting: { fontSize: "13px", color: "#6b8570", marginBottom: "4px" },
  name: { fontSize: "22px", fontWeight: "700", color: "#f0f0f5", marginBottom: "6px" },
  staffBadge: {
    display: "inline-flex", alignItems: "center", gap: "6px",
    background: "#1a2e1a", border: "1px solid #2a5c2a",
    borderRadius: "20px", padding: "4px 12px",
    fontSize: "12px", color: "#4ade80",
  },
  idBox: {
    background: "#0f1117", border: "1px solid #1e3020",
    borderRadius: "10px", padding: "8px 14px", textAlign: "right",
  },
  idLabel: { fontSize: "11px", color: "#4a5e4a" },
  idValue: { fontSize: "14px", fontWeight: "600", color: "#10b981" },
  statsRow: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
    gap: "12px", marginBottom: "1.25rem",
  },
  statCard: {
    background: "#1a1d27", border: "1px solid #2a2d3a",
    borderRadius: "12px", padding: "1rem",
  },
  statValue: { fontSize: "26px", fontWeight: "700", marginBottom: "2px" },
  statLabel: { fontSize: "12px", color: "#6b6f85" },
  statSub: { fontSize: "11px", color: "#4a4e63", marginTop: "2px" },
  sectionHead: {
    fontSize: "11px", fontWeight: "600", color: "#4a4e63",
    letterSpacing: ".06em", textTransform: "uppercase", marginBottom: "10px",
  },
  courseGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
    gap: "12px", marginBottom: "1.25rem",
  },
  courseCard: {
    background: "#1a1d27", border: "1px solid #2a2d3a",
    borderRadius: "12px", padding: "1rem",
  },
  courseName: { fontSize: "14px", fontWeight: "600", color: "#f0f0f5", marginBottom: "4px" },
  courseMeta: { fontSize: "12px", color: "#6b6f85", marginBottom: "8px" },
  pill: {
    display: "inline-block", fontSize: "11px", padding: "2px 8px",
    borderRadius: "20px", background: "#1a2e1a",
    border: "1px solid #2a5c2a", color: "#4ade80",
  },
  changeCard: {
    background: "#1a1d27", border: "1px solid #2a2d3a",
    borderRadius: "12px", overflow: "hidden", marginBottom: "1.25rem",
  },
  changeRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 14px", borderBottom: "1px solid #1e2130",
    flexWrap: "wrap", gap: "6px",
  },
  changeLeft: { fontSize: "13px", color: "#c8cad8" },
  changeSub: { fontSize: "11px", color: "#6b6f85", marginTop: "2px" },
  pendingBadge: {
    fontSize: "11px", padding: "3px 8px", borderRadius: "20px",
    background: "#2a2310", border: "1px solid #4a3a10", color: "#fbbf24",
  },
  empty: { padding: "1.5rem", textAlign: "center", fontSize: "13px", color: "#4a4e63" },
  loading: { padding: "2rem", textAlign: "center", fontSize: "13px", color: "#6b6f85" },
};

export default function TeacherDashboard({ user }) {
  const [assignments, setAssignments] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [aRes, cRes, eRes, pRes] = await Promise.all([
          apiFetch("/course-assignments/"),
          apiFetch("/grade-change-requests/"),
          apiFetch("/enrollments/"),
          apiFetch("/users/me/"),
        ]);
        if (aRes.ok) setAssignments(await aRes.json());
        if (cRes.ok) setChangeRequests(await cRes.json());
        if (eRes.ok) setEnrollments(await eRes.json());
        if (pRes.ok) setProfile(await pRes.json());
      } finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div style={S.loading}>Loading your dashboard…</div>;

  const pending = changeRequests.filter((r) => r.status === "PENDING");
  const totalStudents = new Set(enrollments.map((e) => e.student)).size;

  return (
    <div style={S.wrap}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={S.banner}>
        <div>
          <div style={S.greeting}>Welcome back,</div>
          <div style={S.name}>{profile?.first_name || user?.username} 👋</div>
          <div style={S.staffBadge}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            {profile?.department_name || "Faculty"}
          </div>
        </div>
        <div style={S.idBox}>
          <div style={S.idLabel}>Staff ID</div>
          <div style={S.idValue}>{profile?.staff_id || "—"}</div>
          <div style={{ ...S.idLabel, marginTop: "8px" }}>Role</div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#10b981" }}>Teacher</div>
        </div>
      </div>

      <div style={S.statsRow}>
        {[
          { label: "Assigned courses", value: assignments.length, sub: "This semester", color: "#10b981" },
          { label: "Total students", value: totalStudents, sub: "Across all courses", color: "#6366f1" },
          { label: "Pending changes", value: pending.length, sub: "Grade change requests", color: pending.length > 0 ? "#f59e0b" : "#4a4e63" },
        ].map((s) => (
          <div key={s.label} style={{ ...S.statCard, borderTop: `2px solid ${s.color}` }}>
            <div style={{ ...S.statValue, color: s.color }}>{s.value}</div>
            <div style={S.statLabel}>{s.label}</div>
            <div style={S.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <div style={S.sectionHead}>My assigned courses</div>
        {assignments.length === 0
          ? <div style={{ ...S.courseCard, textAlign: "center" }}><div style={S.empty}>No course assignments found for this semester.</div></div>
          : <div style={S.courseGrid}>
              {assignments.map((a) => {
                const count = enrollments.filter((e) => e.course === a.course).length;
                return (
                  <div key={a.id} style={S.courseCard}>
                    <div style={S.courseName}>{a.course_name || `Course #${a.course}`}</div>
                    <div style={S.courseMeta}>{a.course_code || ""} · {a.teaching_role || "Lecturer"}</div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <span style={S.pill}>{count} student{count !== 1 ? "s" : ""}</span>
                      <span style={{ ...S.pill, background: "#1e2535", border: "1px solid #2a3a5a", color: "#7b9fd4" }}>
                        {a.semester_name || `Semester #${a.semester}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>}
      </div>

      <div>
        <div style={S.sectionHead}>Grade change requests</div>
        <div style={S.changeCard}>
          {changeRequests.length === 0
            ? <div style={S.empty}>No grade change requests.</div>
            : changeRequests.slice(0, 5).map((r) => (
                <div key={r.id} style={S.changeRow}>
                  <div>
                    <div style={S.changeLeft}>Enrollment #{r.enrollment}</div>
                    <div style={S.changeSub}>{r.old_grade} → {r.new_grade} · {r.reason?.slice(0, 50) || "No reason provided"}</div>
                  </div>
                  <span style={{
                    ...S.pendingBadge,
                    background: r.status === "APPROVED" ? "#1a2e1a" : r.status === "REJECTED" ? "#2d1a1a" : "#2a2310",
                    border: `1px solid ${r.status === "APPROVED" ? "#2a5c2a" : r.status === "REJECTED" ? "#5c2a2a" : "#4a3a10"}`,
                    color: r.status === "APPROVED" ? "#4ade80" : r.status === "REJECTED" ? "#f87171" : "#fbbf24",
                  }}>
                    {r.status}
                  </span>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
