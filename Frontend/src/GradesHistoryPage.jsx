import { useState, useEffect } from "react";
import { apiFetch } from "./api";

const S = {
  wrap: { animation: "fadeUp .4s ease both" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: "12px", marginBottom: "1.25rem" },
  statCard: { background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: "12px", padding: "1rem" },
  statValue: { fontSize: "26px", fontWeight: "700", marginBottom: "2px" },
  statLabel: { fontSize: "12px", color: "#6b6f85" },
  sectionHead: { fontSize: "11px", fontWeight: "600", color: "#4a4e63", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: "10px" },
  semCard: { background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: "12px", overflow: "hidden", marginBottom: "1rem" },
  semHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #2a2d3a", background: "#1e2235", flexWrap: "wrap", gap: "8px" },
  semName: { fontSize: "14px", fontWeight: "600", color: "#f0f0f5" },
  gpaChip: (v) => ({ fontSize: "12px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px", background: v >= 3.5 ? "#1a2e1a" : v >= 2.5 ? "#1e2535" : v >= 2.0 ? "#2a2310" : "#2d1a1a", border: `1px solid ${v >= 3.5 ? "#2a5c2a" : v >= 2.5 ? "#2a4060" : v >= 2.0 ? "#4a3a10" : "#5c2a2a"}`, color: v >= 3.5 ? "#4ade80" : v >= 2.5 ? "#60a5fa" : v >= 2.0 ? "#fbbf24" : "#f87171" }),
  tableHeader: { display: "grid", gridTemplateColumns: "1fr 80px 80px", padding: "8px 16px", fontSize: "11px", color: "#4a4e63", fontWeight: "600", borderBottom: "1px solid #2a2d3a" },
  tableRow: { display: "grid", gridTemplateColumns: "1fr 80px 80px", padding: "10px 16px", borderBottom: "1px solid #1e2130", fontSize: "13px", color: "#c8cad8", alignItems: "center" },
  grade: { fontWeight: "700" },
  empty: { padding: "2rem", textAlign: "center", fontSize: "13px", color: "#4a4e63" },
  loading: { padding: "2rem", textAlign: "center", fontSize: "13px", color: "#6b6f85" },
  statusBadge: (s) => ({ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: "500", background: s === "ACTIVE" ? "#1a2e1a" : s === "PROBATION" ? "#2a2310" : "#2d1a1a", border: `1px solid ${s === "ACTIVE" ? "#2a5c2a" : s === "PROBATION" ? "#4a3a10" : "#5c2a2a"}`, color: s === "ACTIVE" ? "#4ade80" : s === "PROBATION" ? "#fbbf24" : "#f87171" }),
};

function gradeColor(g) {
  if (!g) return "#6b6f85";
  if (["A+","A","A-"].includes(g)) return "#4ade80";
  if (["B+","B","B-"].includes(g)) return "#60a5fa";
  if (["C+","C","C-"].includes(g)) return "#fbbf24";
  if (g === "D") return "#fb923c";
  return "#f87171";
}

export default function GradesHistoryPage() {
  const [enrollments, setEnrollments]   = useState([]);
  const [semesters, setSemesters]       = useState([]);
  const [academicStatus, setAcadStatus] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    async function load() {
      const [eRes, sRes, aRes] = await Promise.all([
        apiFetch("/enrollments/"), apiFetch("/semesters/"), apiFetch("/academic-status/"),
      ]);
      if (eRes.ok) setEnrollments(await eRes.json());
      if (sRes.ok) setSemesters(await sRes.json());
      if (aRes.ok) { const d = await aRes.json(); setAcadStatus(Array.isArray(d) ? d : [d]); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div style={S.loading}>Loading your grades…</div>;

  const gradedEnrollments = enrollments.filter(e => e.grade);
  const latestStatus      = academicStatus[0];
  const cumGpa            = latestStatus?.cumulative_gpa;

  // Group enrollments by semester
  const bySemester = semesters.map(sem => ({
    ...sem,
    enrollments: enrollments.filter(e => e.semester === sem.id),
    status: academicStatus.find(a => a.semester === sem.id),
  })).filter(s => s.enrollments.length > 0);

  return (
    <div style={S.wrap}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={S.statsRow}>
        {[
          { label: "Cumulative GPA", value: cumGpa ?? "—",          color: cumGpa >= 3.5 ? "#4ade80" : cumGpa >= 2.0 ? "#60a5fa" : "#f87171" },
          { label: "Courses graded", value: gradedEnrollments.length, color: "#6366f1" },
          { label: "Semesters",      value: bySemester.length,        color: "#f59e0b" },
          { label: "Standing",       value: latestStatus?.status ?? "—", color: latestStatus?.status === "ACTIVE" ? "#4ade80" : latestStatus?.status === "PROBATION" ? "#fbbf24" : "#f87171" },
        ].map(s => (
          <div key={s.label} style={{ ...S.statCard, borderTop: `2px solid ${s.color}` }}>
            <div style={{ ...S.statValue, color: s.color }}>{String(s.value)}</div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={S.sectionHead}>Grade history by semester</div>

      {bySemester.length === 0
        ? <div style={{ background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: "12px", padding: "2rem", textAlign: "center", fontSize: "13px", color: "#4a4e63" }}>
            No grades recorded yet.
          </div>
        : bySemester.map(sem => {
            const gpa    = sem.status?.semester_gpa;
            const status = sem.status?.status;
            return (
              <div key={sem.id} style={S.semCard}>
                <div style={S.semHeader}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={S.semName}>{sem.name} — {sem.year}</span>
                    {status && <span style={S.statusBadge(status)}>{status}</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#6b6f85" }}>Semester GPA:</span>
                    {gpa
                      ? <span style={S.gpaChip(parseFloat(gpa))}>{gpa}</span>
                      : <span style={{ fontSize: "12px", color: "#4a4e63" }}>Not calculated yet</span>
                    }
                  </div>
                </div>
                <div style={S.tableHeader}><span>Course</span><span>Credits</span><span>Grade</span></div>
                {sem.enrollments.map(e => (
                  <div key={e.id} style={S.tableRow}>
                    <span style={{ color: "#e2e4f0" }}>{e.course_name || `Course #${e.course}`}</span>
                    <span style={{ color: "#9ca0b8" }}>—</span>
                    <span style={{ ...S.grade, color: gradeColor(e.grade) }}>{e.grade || <span style={{ color: "#4a4e63" }}>Pending</span>}</span>
                  </div>
                ))}
              </div>
            );
          })}
    </div>
  );
}
