import { useState, useEffect } from "react";
import { apiFetch } from "./api";

const S = {
  wrap: { animation: "fadeUp .4s ease both" },
  banner: {
    background: "linear-gradient(120deg,#1a1d27 60%,#1e1530)",
    border: "1px solid #2a2d3a",
    borderRadius: "16px",
    padding: "1.5rem",
    marginBottom: "1.25rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "1rem",
  },
  greeting: { fontSize: "13px", color: "#6b6f85", marginBottom: "4px" },
  name: { fontSize: "22px", fontWeight: "700", color: "#f0f0f5", marginBottom: "6px" },
  semBadge: {
    display: "inline-flex", alignItems: "center", gap: "6px",
    background: "#1e2535", border: "1px solid #2a3a5a",
    borderRadius: "20px", padding: "4px 12px",
    fontSize: "12px", color: "#7b9fd4",
  },
  idBox: {
    background: "#0f1117", border: "1px solid #2a2d3a",
    borderRadius: "10px", padding: "8px 14px", textAlign: "right",
  },
  idLabel: { fontSize: "11px", color: "#4a4e63" },
  idValue: { fontSize: "14px", fontWeight: "600", color: "#8b5cf6" },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
    gap: "12px", marginBottom: "1.25rem",
  },
  statCard: {
    background: "#1a1d27", border: "1px solid #2a2d3a",
    borderRadius: "12px", padding: "1rem",
  },
  statValue: { fontSize: "26px", fontWeight: "700", marginBottom: "2px" },
  statLabel: { fontSize: "12px", color: "#6b6f85" },
  statSub: { fontSize: "11px", color: "#4a4e63", marginTop: "2px" },
  section: { marginBottom: "1.25rem" },
  sectionHead: {
    fontSize: "11px", fontWeight: "600", color: "#4a4e63",
    letterSpacing: ".06em", textTransform: "uppercase", marginBottom: "10px",
  },
  card: {
    background: "#1a1d27", border: "1px solid #2a2d3a",
    borderRadius: "12px", overflow: "hidden",
  },
  tableHeader: {
    display: "grid", gridTemplateColumns: "1fr 80px 100px",
    padding: "8px 14px", borderBottom: "1px solid #2a2d3a",
    fontSize: "11px", color: "#4a4e63", fontWeight: "600",
  },
  tableRow: {
    display: "grid", gridTemplateColumns: "1fr 80px 100px",
    padding: "10px 14px", borderBottom: "1px solid #1e2130",
    fontSize: "13px", color: "#c8cad8", alignItems: "center",
  },
  grade: { fontWeight: "700", color: "#f0f0f5" },
  badge: { fontSize: "11px", padding: "3px 8px", borderRadius: "20px", fontWeight: "500" },
  empty: {
    padding: "2rem", textAlign: "center",
    fontSize: "13px", color: "#4a4e63",
  },
  dismissed: {
    background: "#2d1a1a", border: "1px solid #5c2a2a",
    borderRadius: "12px", padding: "1.25rem",
    textAlign: "center", marginBottom: "1.25rem",
  },
  loading: { padding: "2rem", textAlign: "center", fontSize: "13px", color: "#6b6f85" },
};

function statusColor(s) {
  if (s === "ACTIVE") return { bg: "#1a2e1a", border: "#2a5c2a", color: "#4ade80" };
  if (s === "PROBATION") return { bg: "#2a2310", border: "#4a3a10", color: "#fbbf24" };
  if (s === "DISMISSED") return { bg: "#2d1a1a", border: "#5c2a2a", color: "#f87171" };
  return { bg: "#1e2130", border: "#2a2d3a", color: "#9ca0b8" };
}

function gradeColor(g) {
  if (!g) return "#6b6f85";
  if (["A+", "A", "A-"].includes(g)) return "#4ade80";
  if (["B+", "B", "B-"].includes(g)) return "#60a5fa";
  if (["C+", "C", "C-"].includes(g)) return "#fbbf24";
  if (g === "D") return "#fb923c";
  return "#f87171";
}

export default function StudentDashboard({ user }) {
  const [enrollments, setEnrollments] = useState([]);
  const [academicStatus, setAcademicStatus] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [dormitory, setDormitory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [eRes, aRes, sRes, dRes, pRes] = await Promise.all([
          apiFetch("/enrollments/"),
          apiFetch("/academic-status/"),
          apiFetch("/semesters/"),
          apiFetch("/dormitory-assignments/"),
          apiFetch("/users/me/"),
        ]);
        if (eRes.ok) setEnrollments(await eRes.json());
        if (aRes.ok) { const d = await aRes.json(); setAcademicStatus(Array.isArray(d) ? d[0] : d); }
        if (sRes.ok) setSemesters(await sRes.json());
        if (dRes.ok) { const d = await dRes.json(); setDormitory(Array.isArray(d) ? d[0] : null); }
        if (pRes.ok) setProfile(await pRes.json());
      } finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div style={S.loading}>Loading your dashboard…</div>;

  const activeSemester = semesters.find((s) => s.is_active);
  const myEnrollments = activeSemester
    ? enrollments.filter((e) => e.semester === activeSemester.id)
    : enrollments.slice(0, 5);

  const acStatus = academicStatus?.status || "ACTIVE";
  const sc = statusColor(acStatus);

  if (acStatus === "DISMISSED") {
    return (
      <div style={S.dismissed}>
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>⛔</div>
        <div style={{ fontSize: "16px", fontWeight: "700", color: "#f87171", marginBottom: "6px" }}>
          Academic dismissal
        </div>
        <div style={{ fontSize: "13px", color: "#9ca0b8" }}>
          Your GPA has fallen below 1.75. You are not allowed to register or enroll.<br />
          Please contact the admin office.
        </div>
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={S.banner}>
        <div>
          <div style={S.greeting}>Welcome back,</div>
          <div style={S.name}>{profile?.first_name || user?.username} 👋</div>
          {activeSemester && (
            <div style={S.semBadge}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
              {activeSemester.name} — {activeSemester.year}
            </div>
          )}
        </div>
        <div style={S.idBox}>
          <div style={S.idLabel}>Student ID</div>
          <div style={S.idValue}>{profile?.student_id || "—"}</div>
          <div style={{ ...S.idLabel, marginTop: "8px" }}>Standing</div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: sc.color }}>
            {acStatus}
          </div>
        </div>
      </div>

      {acStatus === "PROBATION" && (
        <div style={{ ...S.dismissed, background: "#2a2310", border: "1px solid #4a3a10", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "13px", color: "#fbbf24" }}>
            ⚠️ You are on academic probation. Improve your GPA above 2.00 to avoid dismissal.
          </div>
        </div>
      )}

      <div style={S.statsRow}>
        {[
          { label: "Semester GPA", value: academicStatus?.semester_gpa ?? "—", sub: "This semester", color: "#6366f1" },
          { label: "Cumulative GPA", value: academicStatus?.cumulative_gpa ?? "—", sub: "All semesters", color: "#8b5cf6" },
          { label: "Courses enrolled", value: myEnrollments.length, sub: activeSemester?.name || "Current", color: "#10b981" },
          { label: "Dormitory", value: dormitory ? `B${dormitory.dormitory_detail?.block ?? "?"}·R${dormitory.dormitory_detail?.room ?? "?"}` : "—", sub: dormitory ? "Assigned" : "Not assigned", color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} style={{ ...S.statCard, borderTop: `2px solid ${s.color}` }}>
            <div style={{ ...S.statValue, color: s.color }}>{String(s.value)}</div>
            <div style={S.statLabel}>{s.label}</div>
            <div style={S.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={S.section}>
        <div style={S.sectionHead}>Your courses this semester</div>
        <div style={S.card}>
          <div style={S.tableHeader}>
            <span>Course</span><span>Grade</span><span>Status</span>
          </div>
          {myEnrollments.length === 0
            ? <div style={S.empty}>No enrollments found. Submit a registration request to get started.</div>
            : myEnrollments.map((e) => {
                const gc = gradeColor(e.grade);
                return (
                  <div key={e.id} style={S.tableRow}>
                    <span style={{ color: "#e2e4f0" }}>{e.course_name || `Course #${e.course}`}</span>
                    <span style={{ ...S.grade, color: gc }}>{e.grade || "—"}</span>
                    <span>
                      <span style={{
                        ...S.badge,
                        background: e.grade ? "#1a2e1a" : "#1e2130",
                        border: `1px solid ${e.grade ? "#2a5c2a" : "#2a2d3a"}`,
                        color: e.grade ? "#4ade80" : "#9ca0b8",
                      }}>
                        {e.grade ? "Graded" : "Pending"}
                      </span>
                    </span>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
