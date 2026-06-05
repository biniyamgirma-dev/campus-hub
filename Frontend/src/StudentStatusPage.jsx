import { useState, useEffect } from "react";
import { apiFetch } from "./api";

const S = {
  wrap: { animation: "fadeUp .4s ease both" },
  sectionHead: { fontSize: "11px", fontWeight: "600", color: "#4a4e63", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: "10px" },
  courseGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "10px", marginBottom: "1.5rem" },
  courseCard: { background: "#1a1d27", border: "1.5px solid #2a2d3a", borderRadius: "12px", padding: "1rem", cursor: "pointer", transition: "border-color .15s" },
  courseCardActive: { borderColor: "#10b981", background: "#0f1a12" },
  courseName: { fontSize: "14px", fontWeight: "600", color: "#f0f0f5", marginBottom: "4px" },
  courseMeta: { fontSize: "12px", color: "#6b6f85" },
  tableCard: { background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: "12px", overflow: "hidden" },
  tableHeader: { display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 100px", padding: "8px 14px", borderBottom: "1px solid #2a2d3a", fontSize: "11px", color: "#4a4e63", fontWeight: "600" },
  tableRow: { display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 100px", padding: "10px 14px", borderBottom: "1px solid #1e2130", fontSize: "13px", color: "#c8cad8", alignItems: "center" },
  gpa: { fontWeight: "700" },
  statusBadge: (s) => ({ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: "500", background: s === "ACTIVE" ? "#1a2e1a" : s === "PROBATION" ? "#2a2310" : "#2d1a1a", border: `1px solid ${s === "ACTIVE" ? "#2a5c2a" : s === "PROBATION" ? "#4a3a10" : "#5c2a2a"}`, color: s === "ACTIVE" ? "#4ade80" : s === "PROBATION" ? "#fbbf24" : "#f87171" }),
  gradeColor: (g) => { if (!g) return "#6b6f85"; if (["A+","A","A-"].includes(g)) return "#4ade80"; if (["B+","B","B-"].includes(g)) return "#60a5fa"; if (["C+","C","C-"].includes(g)) return "#fbbf24"; if (g === "D") return "#fb923c"; return "#f87171"; },
  empty: { padding: "2rem", textAlign: "center", fontSize: "13px", color: "#4a4e63" },
  loading: { padding: "2rem", textAlign: "center", fontSize: "13px", color: "#6b6f85" },
};

export default function StudentStatusPage() {
  const [assignments, setAssignments]     = useState([]);
  const [enrollments, setEnrollments]     = useState([]);
  const [academicStatus, setAcadStatus]   = useState([]);
  const [allUsers, setAllUsers]           = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    async function load() {
      const [aRes, eRes, acRes, uRes] = await Promise.all([
        apiFetch("/course-assignments/"), apiFetch("/enrollments/"),
        apiFetch("/academic-status/"), apiFetch("/users/"),
      ]);
      if (aRes.ok) { const d = await aRes.json(); setAssignments(d); if (d.length > 0) setSelectedCourse(d[0]); }
      if (eRes.ok) setEnrollments(await eRes.json());
      if (acRes.ok) { const d = await acRes.json(); setAcadStatus(Array.isArray(d) ? d : [d]); }
      if (uRes.ok) setAllUsers(await uRes.json());
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div style={S.loading}>Loading student status…</div>;

  const courseEnrollments = selectedCourse
    ? enrollments.filter(e => e.course === selectedCourse.course)
    : [];

  return (
    <div style={S.wrap}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={S.sectionHead}>Your courses ({assignments.length})</div>
      {assignments.length === 0
        ? <div style={{ ...S.tableCard, padding: "2rem", textAlign: "center", fontSize: "13px", color: "#4a4e63" }}>No courses assigned this semester.</div>
        : <div style={S.courseGrid}>
            {assignments.map(a => (
              <div key={a.id}
                style={{ ...S.courseCard, ...(selectedCourse?.id === a.id ? S.courseCardActive : {}) }}
                onClick={() => setSelectedCourse(a)}>
                <div style={S.courseName}>{a.course_name || `Course #${a.course}`}</div>
                <div style={S.courseMeta}>{enrollments.filter(e => e.course === a.course).length} students</div>
              </div>
            ))}
          </div>
      }

      {selectedCourse && (
        <>
          <div style={S.sectionHead}>
            Students — {selectedCourse.course_name || `Course #${selectedCourse.course}`}
          </div>
          <div style={S.tableCard}>
            <div style={S.tableHeader}>
              <span>Student</span>
              <span>Grade</span>
              <span>Sem GPA</span>
              <span>Cum GPA</span>
              <span>Standing</span>
            </div>
            {courseEnrollments.length === 0
              ? <div style={S.empty}>No students enrolled in this course yet.</div>
              : courseEnrollments.map(e => {
                  const acStatus = academicStatus.find(a => a.student === e.student);
                  const user     = allUsers.find(u => u.id === e.student);
                  return (
                    <div key={e.id} style={S.tableRow}>
                      <span style={{ color: "#e2e4f0" }}>{e.student_name || (user ? `${user.first_name} ${user.last_name}` : `Student #${e.student}`)}</span>
                      <span style={{ ...S.gpa, color: S.gradeColor(e.grade) }}>{e.grade || "—"}</span>
                      <span style={{ color: acStatus?.semester_gpa ? "#60a5fa" : "#6b6f85", fontWeight: "600" }}>{acStatus?.semester_gpa ?? "—"}</span>
                      <span style={{ color: acStatus?.cumulative_gpa ? "#818cf8" : "#6b6f85", fontWeight: "600" }}>{acStatus?.cumulative_gpa ?? "—"}</span>
                      <span>{acStatus?.status ? <span style={S.statusBadge(acStatus.status)}>{acStatus.status}</span> : <span style={{ color: "#4a4e63", fontSize: "12px" }}>—</span>}</span>
                    </div>
                  );
                })
            }
          </div>
        </>
      )}
    </div>
  );
}
