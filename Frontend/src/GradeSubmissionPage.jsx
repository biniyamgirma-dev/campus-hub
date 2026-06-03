import { useState, useEffect } from "react";
import { apiFetch } from "./api";

const S = {
  wrap: { animation: "fadeUp .4s ease both" },
  banner: {
    background: "linear-gradient(120deg,#0f1a12 60%,#111a1a)",
    border: "1px solid #1e3020", borderRadius: "16px",
    padding: "1.5rem", marginBottom: "1.25rem",
  },
  bannerTitle: { fontSize: "18px", fontWeight: "700", color: "#f0f0f5", marginBottom: "4px" },
  bannerSub: { fontSize: "13px", color: "#6b8570" },
  sectionHead: {
    fontSize: "11px", fontWeight: "600", color: "#4a4e63",
    letterSpacing: ".06em", textTransform: "uppercase", marginBottom: "10px",
  },
  courseGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
    gap: "10px", marginBottom: "1.5rem",
  },
  courseCard: {
    background: "#1a1d27", border: "1.5px solid #2a2d3a",
    borderRadius: "12px", padding: "1rem", cursor: "pointer",
    transition: "border-color .15s",
  },
  courseCardActive: { borderColor: "#10b981", background: "#0f1a12" },
  courseName: { fontSize: "14px", fontWeight: "600", color: "#f0f0f5", marginBottom: "4px" },
  courseMeta: { fontSize: "12px", color: "#6b6f85" },
  tableCard: {
    background: "#1a1d27", border: "1px solid #2a2d3a",
    borderRadius: "12px", overflow: "hidden", marginBottom: "1.25rem",
  },
  tableHeader: {
    display: "grid", gridTemplateColumns: "1fr 120px 120px 100px",
    padding: "8px 14px", borderBottom: "1px solid #2a2d3a",
    fontSize: "11px", color: "#4a4e63", fontWeight: "600",
  },
  tableRow: {
    display: "grid", gridTemplateColumns: "1fr 120px 120px 100px",
    padding: "10px 14px", borderBottom: "1px solid #1e2130",
    fontSize: "13px", color: "#c8cad8", alignItems: "center",
  },
  input: {
    background: "#0f1117", border: "1px solid #2a2d3a",
    borderRadius: "6px", padding: "5px 8px",
    color: "#f0f0f5", fontSize: "13px", width: "70px",
    fontFamily: "'DM Sans', sans-serif", outline: "none",
  },
  submitBtn: {
    fontSize: "11px", padding: "4px 12px", borderRadius: "6px",
    border: "1px solid #2a5c2a", color: "#4ade80",
    background: "transparent", cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", fontWeight: "500",
  },
  changeBtn: {
    fontSize: "11px", padding: "4px 12px", borderRadius: "6px",
    border: "1px solid #2a3a5a", color: "#60a5fa",
    background: "transparent", cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", fontWeight: "500",
  },
  graded: { fontSize: "13px", fontWeight: "700" },
  empty: { padding: "1.5rem", textAlign: "center", fontSize: "13px", color: "#4a4e63" },
  loading: { padding: "2rem", textAlign: "center", fontSize: "13px", color: "#6b6f85" },
  modal: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.7)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 200,
  },
  modalCard: {
    background: "#1a1d27", border: "1px solid #2a2d3a",
    borderRadius: "16px", padding: "1.5rem", width: "100%",
    maxWidth: "400px",
  },
  modalTitle: { fontSize: "16px", fontWeight: "700", color: "#f0f0f5", marginBottom: "1rem" },
  modalLabel: { fontSize: "12px", color: "#9ca0b8", marginBottom: "4px" },
  modalInput: {
    background: "#0f1117", border: "1px solid #2a2d3a",
    borderRadius: "8px", padding: "8px 12px",
    color: "#f0f0f5", fontSize: "13px", width: "100%",
    fontFamily: "'DM Sans', sans-serif", outline: "none",
    marginBottom: "12px", boxSizing: "border-box",
  },
  modalTextarea: {
    background: "#0f1117", border: "1px solid #2a2d3a",
    borderRadius: "8px", padding: "8px 12px",
    color: "#f0f0f5", fontSize: "13px", width: "100%",
    fontFamily: "'DM Sans', sans-serif", outline: "none",
    marginBottom: "12px", boxSizing: "border-box",
    minHeight: "80px", resize: "vertical",
  },
  modalBtns: { display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" },
  cancelBtn: {
    fontSize: "13px", padding: "8px 16px", borderRadius: "8px",
    border: "1px solid #2a2d3a", color: "#9ca0b8",
    background: "transparent", cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  confirmBtn: {
    fontSize: "13px", padding: "8px 16px", borderRadius: "8px",
    border: "none", color: "#fff",
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: "600",
  },
  error: {
    background: "#2d1a1a", border: "1px solid #5c2a2a",
    borderRadius: "8px", padding: "8px 12px",
    fontSize: "12px", color: "#f87171", marginBottom: "10px",
  },
  toast: {
    position: "fixed", bottom: "20px", right: "20px",
    borderRadius: "10px", padding: "10px 16px",
    fontSize: "13px", zIndex: 300,
  },
};

function gradeColor(g) {
  if (!g) return "#6b6f85";
  if (["A+","A","A-"].includes(g)) return "#4ade80";
  if (["B+","B","B-"].includes(g)) return "#60a5fa";
  if (["C+","C","C-"].includes(g)) return "#fbbf24";
  if (g === "D") return "#fb923c";
  return "#f87171";
}

export default function GradeSubmissionPage() {
  const [assignments, setAssignments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState({});
  const [toast, setToast] = useState({ msg: "", isError: false });
  const [changeModal, setChangeModal] = useState(null);
  const [changeForm, setChangeForm] = useState({ new_mark: "", reason: "" });
  const [changeError, setChangeError] = useState("");
  const [changeSending, setChangeSending] = useState(false);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast({ msg: "", isError: false }), 4000);
  };

  useEffect(() => {
    async function load() {
      try {
        const [aRes, eRes] = await Promise.all([
          apiFetch("/course-assignments/"),
          apiFetch("/enrollments/"),
        ]);
        if (aRes.ok) {
          const data = await aRes.json();
          setAssignments(data);
          if (data.length > 0) setSelectedCourse(data[0]);
        }
        if (eRes.ok) setEnrollments(await eRes.json());
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const courseEnrollments = selectedCourse
    ? enrollments.filter(e => e.course === selectedCourse.course)
    : [];

  const handleSubmitGrade = async (enrollmentId) => {
    const mark = marks[enrollmentId];
    if (!mark || mark === "") { showToast("Please enter a mark first.", true); return; }
    const num = parseFloat(mark);
    if (isNaN(num) || num < 0 || num > 100) { showToast("Mark must be between 0 and 100.", true); return; }

    setSubmitting(prev => ({ ...prev, [enrollmentId]: true }));
    const res = await apiFetch("/grade-submissions/", {
      method: "POST",
      body: JSON.stringify({ enrollment: enrollmentId, mark: num }),
    });
    const data = await res.json();
    if (res.ok) {
      // Update local enrollment grade
      setEnrollments(prev => prev.map(e =>
        e.id === enrollmentId ? { ...e, grade: data.grade } : e
      ));
      setMarks(prev => ({ ...prev, [enrollmentId]: "" }));
      showToast("Grade submitted successfully!");
    } else {
      showToast(`Error: ${data?.error || data?.detail || JSON.stringify(data)}`, true);
    }
    setSubmitting(prev => ({ ...prev, [enrollmentId]: false }));
  };

  const handleOpenChange = (enrollment) => {
    setChangeModal(enrollment);
    setChangeForm({ new_mark: "", reason: "" });
    setChangeError("");
  };

  const handleSubmitChange = async () => {
    if (!changeForm.new_mark) { setChangeError("Please enter a new mark."); return; }
    if (!changeForm.reason)   { setChangeError("Please enter a reason."); return; }
    const num = parseFloat(changeForm.new_mark);
    if (isNaN(num) || num < 0 || num > 100) { setChangeError("Mark must be between 0 and 100."); return; }

    // Calculate new grade from mark (mirrors Django logic)
    const calcGrade = (m) => {
      if (m >= 90) return "A+"; if (m >= 85) return "A";  if (m >= 80) return "A-";
      if (m >= 75) return "B+"; if (m >= 70) return "B";  if (m >= 65) return "B-";
      if (m >= 60) return "C+"; if (m >= 50) return "C";  if (m >= 45) return "C-";
      if (m >= 40) return "D";  return "F";
    };

    setChangeSending(true);
    const res = await apiFetch("/grade-change-requests/", {
      method: "POST",
      body: JSON.stringify({
        enrollment: changeModal.id,
        new_mark: num,
        new_grade: calcGrade(num),
        reason: changeForm.reason,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast("Grade change request submitted! Waiting for admin approval.");
      setChangeModal(null);
    } else {
      setChangeError(data?.error || data?.detail || data?.non_field_errors?.[0] || JSON.stringify(data));
    }
    setChangeSending(false);
  };

  if (loading) return <div style={S.loading}>Loading grade submission…</div>;

  return (
    <div style={S.wrap}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {toast.msg && (
        <div style={{
          ...S.toast,
          background: toast.isError ? "#2d1a1a" : "#1a2e1a",
          border: `1px solid ${toast.isError ? "#5c2a2a" : "#2a5c2a"}`,
          color: toast.isError ? "#f87171" : "#4ade80",
        }}>
          {toast.isError ? "⚠️" : "✓"} {toast.msg}
        </div>
      )}

      {/* Grade change request modal */}
      {changeModal && (
        <div style={S.modal} onClick={(e) => e.target === e.currentTarget && setChangeModal(null)}>
          <div style={S.modalCard}>
            <div style={S.modalTitle}>Request grade change</div>
            <div style={{ fontSize: "13px", color: "#6b6f85", marginBottom: "1rem" }}>
              Current grade: <strong style={{ color: gradeColor(changeModal.grade) }}>{changeModal.grade}</strong>
            </div>
            {changeError && <div style={S.error}>{changeError}</div>}
            <div style={S.modalLabel}>New mark (0–100)</div>
            <input style={S.modalInput} type="number" min="0" max="100"
              value={changeForm.new_mark}
              onChange={e => setChangeForm(p => ({ ...p, new_mark: e.target.value }))}
              placeholder="e.g. 78" />
            <div style={S.modalLabel}>Reason for change</div>
            <textarea style={S.modalTextarea}
              value={changeForm.reason}
              onChange={e => setChangeForm(p => ({ ...p, reason: e.target.value }))}
              placeholder="Explain why the grade needs to be changed…" />
            <div style={S.modalBtns}>
              <button style={S.cancelBtn} onClick={() => setChangeModal(null)}>Cancel</button>
              <button style={S.confirmBtn} onClick={handleSubmitChange} disabled={changeSending}>
                {changeSending ? "Submitting…" : "Submit request"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={S.banner}>
        <div style={S.bannerTitle}>Grade Submission</div>
        <div style={S.bannerSub}>Select a course, enter marks, and submit. Grades are calculated automatically.</div>
      </div>

      {/* Course selector */}
      <div style={S.sectionHead}>Your courses ({assignments.length})</div>
      {assignments.length === 0
        ? <div style={{ ...S.tableCard, padding: "1.5rem", textAlign: "center", fontSize: "13px", color: "#4a4e63" }}>
            No courses assigned to you this semester.
          </div>
        : <div style={S.courseGrid}>
            {assignments.map(a => (
              <div key={a.id}
                style={{ ...S.courseCard, ...(selectedCourse?.id === a.id ? S.courseCardActive : {}) }}
                onClick={() => setSelectedCourse(a)}>
                <div style={S.courseName}>{a.course_name || `Course #${a.course}`}</div>
                <div style={S.courseMeta}>
                  {a.course_code || ""} · {a.teaching_role || "Lecturer"}
                </div>
                <div style={{ fontSize: "11px", color: "#4a4e63", marginTop: "4px" }}>
                  {enrollments.filter(e => e.course === a.course).length} students enrolled
                </div>
              </div>
            ))}
          </div>
      }

      {/* Student roster for selected course */}
      {selectedCourse && (
        <>
          <div style={S.sectionHead}>
            Students — {selectedCourse.course_name || `Course #${selectedCourse.course}`}
          </div>
          <div style={S.tableCard}>
            <div style={S.tableHeader}>
              <span>Student</span>
              <span>Current grade</span>
              <span>Enter mark</span>
              <span>Action</span>
            </div>
            {courseEnrollments.length === 0
              ? <div style={S.empty}>No students enrolled in this course yet.</div>
              : courseEnrollments.map(e => (
                  <div key={e.id} style={S.tableRow}>
                    <span style={{ color: "#e2e4f0" }}>{e.student_name || `Student #${e.student}`}</span>
                    <span style={{ ...S.graded, color: gradeColor(e.grade) }}>
                      {e.grade || "—"}
                    </span>
                    <span>
                      {!e.grade
                        ? <input style={S.input} type="number" min="0" max="100"
                            placeholder="0–100"
                            value={marks[e.id] || ""}
                            onChange={ev => setMarks(p => ({ ...p, [e.id]: ev.target.value }))} />
                        : <span style={{ fontSize: "12px", color: "#4a4e63" }}>Submitted</span>
                      }
                    </span>
                    <span>
                      {!e.grade
                        ? <button style={S.submitBtn}
                            disabled={submitting[e.id]}
                            onClick={() => handleSubmitGrade(e.id)}>
                            {submitting[e.id] ? "…" : "Submit"}
                          </button>
                        : <button style={S.changeBtn} onClick={() => handleOpenChange(e)}>
                            Request change
                          </button>
                      }
                    </span>
                  </div>
                ))
            }
          </div>
        </>
      )}
    </div>
  );
}