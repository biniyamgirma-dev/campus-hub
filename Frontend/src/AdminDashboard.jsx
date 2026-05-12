import { useState, useEffect } from "react";
import { apiFetch } from "./api";

const S = {
  wrap: { animation: "fadeUp .4s ease both" },
  banner: {
    background: "linear-gradient(120deg,#1a1208 60%,#1a1510)",
    border: "1px solid #3a2e10",
    borderRadius: "16px", padding: "1.5rem",
    marginBottom: "1.25rem",
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", flexWrap: "wrap", gap: "1rem",
  },
  greeting: { fontSize: "13px", color: "#857060", marginBottom: "4px" },
  name: { fontSize: "22px", fontWeight: "700", color: "#f0f0f5", marginBottom: "6px" },
  adminBadge: {
    display: "inline-flex", alignItems: "center", gap: "6px",
    background: "#2a1e08", border: "1px solid #5a3a10",
    borderRadius: "20px", padding: "4px 12px",
    fontSize: "12px", color: "#f59e0b",
  },
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
  tableCard: {
    background: "#1a1d27", border: "1px solid #2a2d3a",
    borderRadius: "12px", overflow: "hidden", marginBottom: "1.25rem",
  },
  tableHeader: {
    display: "grid", padding: "8px 14px",
    borderBottom: "1px solid #2a2d3a",
    fontSize: "11px", color: "#4a4e63", fontWeight: "600",
  },
  tableRow: {
    display: "grid", padding: "10px 14px",
    borderBottom: "1px solid #1e2130",
    fontSize: "13px", color: "#c8cad8", alignItems: "center",
  },
  actionBtn: {
    fontSize: "11px", padding: "4px 10px", borderRadius: "6px",
    border: "1px solid", cursor: "pointer", fontWeight: "500",
    background: "transparent",
  },
  empty: { padding: "1.5rem", textAlign: "center", fontSize: "13px", color: "#4a4e63" },
  loading: { padding: "2rem", textAlign: "center", fontSize: "13px", color: "#6b6f85" },
  toast: {
    position: "fixed", bottom: "20px", right: "20px",
    background: "#1a2e1a", border: "1px solid #2a5c2a",
    borderRadius: "10px", padding: "10px 16px",
    fontSize: "13px", color: "#4ade80", zIndex: 100,
  },
};

export default function AdminDashboard({ user }) {
  const [registrations, setRegistrations] = useState([]);
  const [gradeChanges, setGradeChanges] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [rRes, gRes, uRes, dRes, sRes, pRes] = await Promise.all([
          apiFetch("/registrations/"),
          apiFetch("/grade-change-requests/"),
          apiFetch("/users/"),
          apiFetch("/departments/"),
          apiFetch("/semesters/"),
          apiFetch("/users/me/"),
        ]);
        if (rRes.ok) setRegistrations(await rRes.json());
        if (gRes.ok) setGradeChanges(await gRes.json());
        if (uRes.ok) setUsers(await uRes.json());
        if (dRes.ok) setDepartments(await dRes.json());
        if (sRes.ok) setSemesters(await sRes.json());
        if (pRes.ok) setProfile(await pRes.json());
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleAction = async (url, id, action, listSetter) => {
    const res = await apiFetch(`${url}${id}/${action}/`, { method: "POST" });
    if (res.ok) {
      listSetter((prev) => prev.map((r) => r.id === id ? { ...r, status: action === "approve" ? "APPROVED" : "REJECTED" } : r));
      showToast(`${action === "approve" ? "Approved" : "Rejected"} successfully`);
    }
  };

  if (loading) return <div style={S.loading}>Loading admin dashboard…</div>;

  const pending = registrations.filter((r) => r.status === "PENDING");
  const pendingGrades = gradeChanges.filter((r) => r.status === "PENDING");
  const activeSemester = semesters.find((s) => s.is_active);
  const students = users.filter((u) => u.role === "STUDENT");
  const teachers = users.filter((u) => u.role === "TEACHER");

  return (
    <div style={S.wrap}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {toast && <div style={S.toast}>✓ {toast}</div>}

      <div style={S.banner}>
        <div>
          <div style={S.greeting}>Admin panel</div>
          <div style={S.name}>{profile?.first_name || user?.username} 👋</div>
          <div style={S.adminBadge}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
            System Administrator
          </div>
        </div>
        <div style={{ background: "#0f1117", border: "1px solid #3a2e10", borderRadius: "10px", padding: "8px 14px", textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "#6b5030" }}>Active semester</div>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#f59e0b" }}>
            {activeSemester ? `${activeSemester.name} ${activeSemester.year}` : "None active"}
          </div>
          <div style={{ fontSize: "11px", color: "#6b5030", marginTop: "8px" }}>Departments</div>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#f59e0b" }}>{departments.length}</div>
        </div>
      </div>

      <div style={S.statsRow}>
        {[
          { label: "Total students", value: students.length, sub: "Registered", color: "#6366f1" },
          { label: "Teachers", value: teachers.length, sub: "Active staff", color: "#10b981" },
          { label: "Pending registrations", value: pending.length, sub: "Need approval", color: pending.length > 0 ? "#f59e0b" : "#4a4e63" },
          { label: "Grade change requests", value: pendingGrades.length, sub: "Pending review", color: pendingGrades.length > 0 ? "#f59e0b" : "#4a4e63" },
        ].map((s) => (
          <div key={s.label} style={{ ...S.statCard, borderTop: `2px solid ${s.color}` }}>
            <div style={{ ...S.statValue, color: s.color }}>{s.value}</div>
            <div style={S.statLabel}>{s.label}</div>
            <div style={S.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <div style={S.sectionHead}>Pending registration requests</div>
        <div style={S.tableCard}>
          <div style={{ ...S.tableHeader, gridTemplateColumns: "1fr 120px 140px" }}>
            <span>Student</span><span>Semester</span><span>Actions</span>
          </div>
          {pending.length === 0
            ? <div style={S.empty}>No pending registrations. All caught up! ✓</div>
            : pending.map((r) => (
                <div key={r.id} style={{ ...S.tableRow, gridTemplateColumns: "1fr 120px 140px" }}>
                  <span style={{ color: "#e2e4f0" }}>Student #{r.student}</span>
                  <span style={{ color: "#9ca0b8" }}>Sem #{r.semester}</span>
                  <span style={{ display: "flex", gap: "6px" }}>
                    <button style={{ ...S.actionBtn, borderColor: "#2a5c2a", color: "#4ade80" }}
                      onClick={() => handleAction("/registrations/", r.id, "approve", setRegistrations)}>
                      Approve
                    </button>
                    <button style={{ ...S.actionBtn, borderColor: "#5c2a2a", color: "#f87171" }}
                      onClick={() => handleAction("/registrations/", r.id, "reject", setRegistrations)}>
                      Reject
                    </button>
                  </span>
                </div>
              ))}
        </div>
      </div>

      <div>
        <div style={S.sectionHead}>Pending grade change requests</div>
        <div style={S.tableCard}>
          <div style={{ ...S.tableHeader, gridTemplateColumns: "1fr 100px 100px 140px" }}>
            <span>Enrollment</span><span>Change</span><span>Reason</span><span>Actions</span>
          </div>
          {pendingGrades.length === 0
            ? <div style={S.empty}>No pending grade changes. All caught up! ✓</div>
            : pendingGrades.map((r) => (
                <div key={r.id} style={{ ...S.tableRow, gridTemplateColumns: "1fr 100px 100px 140px" }}>
                  <span style={{ color: "#e2e4f0" }}>Enrollment #{r.enrollment}</span>
                  <span style={{ color: "#fbbf24" }}>{r.old_grade} → {r.new_grade}</span>
                  <span style={{ color: "#9ca0b8", fontSize: "11px" }}>{r.reason?.slice(0, 25) || "—"}…</span>
                  <span style={{ display: "flex", gap: "6px" }}>
                    <button style={{ ...S.actionBtn, borderColor: "#2a5c2a", color: "#4ade80" }}
                      onClick={() => handleAction("/grade-change-requests/", r.id, "approve", setGradeChanges)}>
                      Approve
                    </button>
                    <button style={{ ...S.actionBtn, borderColor: "#5c2a2a", color: "#f87171" }}
                      onClick={() => handleAction("/grade-change-requests/", r.id, "reject", setGradeChanges)}>
                      Reject
                    </button>
                  </span>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
