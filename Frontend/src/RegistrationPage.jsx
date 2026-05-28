import { useState, useEffect } from "react";
import { apiFetch } from "./api";

const S = {
  wrap: { animation: "fadeUp .4s ease both" },
  banner: {
    background: "linear-gradient(120deg,#0f1520 60%,#111a2a)",
    border: "1px solid #1e2a3a",
    borderRadius: "16px", padding: "1.5rem",
    marginBottom: "1.25rem",
  },
  bannerTitle: { fontSize: "18px", fontWeight: "700", color: "#f0f0f5", marginBottom: "4px" },
  bannerSub: { fontSize: "13px", color: "#6b7f95" },
  semBadge: {
    display: "inline-flex", alignItems: "center", gap: "6px",
    background: "#1a2535", border: "1px solid #2a4060",
    borderRadius: "20px", padding: "4px 12px",
    fontSize: "12px", color: "#60a5fa", marginTop: "10px",
  },
  sectionHead: {
    fontSize: "11px", fontWeight: "600", color: "#4a4e63",
    letterSpacing: ".06em", textTransform: "uppercase", marginBottom: "10px",
  },
  courseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))",
    gap: "10px", marginBottom: "1.5rem",
  },
  courseCard: {
    background: "#1a1d27", border: "1.5px solid #2a2d3a",
    borderRadius: "12px", padding: "1rem", cursor: "pointer",
    transition: "border-color .15s, background .15s",
    position: "relative",
  },
  courseCardSelected: {
    background: "#1a1f35", borderColor: "#6366f1",
  },
  courseName: { fontSize: "14px", fontWeight: "600", color: "#f0f0f5", marginBottom: "4px" },
  courseMeta: { fontSize: "12px", color: "#6b6f85" },
  checkmark: {
    position: "absolute", top: "10px", right: "10px",
    width: "20px", height: "20px", borderRadius: "50%",
    background: "#6366f1", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontSize: "11px", color: "#fff",
  },
  submitRow: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", flexWrap: "wrap",
    gap: "12px", marginBottom: "1.5rem",
  },
  selectedCount: { fontSize: "13px", color: "#9ca0b8" },
  submitBtn: {
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    border: "none", borderRadius: "10px",
    padding: "10px 24px", color: "#fff",
    fontSize: "14px", fontWeight: "600",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    transition: "opacity .15s",
  },
  disabledBtn: { opacity: 0.4, cursor: "not-allowed" },
  statusCard: {
    background: "#1a1d27", border: "1px solid #2a2d3a",
    borderRadius: "16px", padding: "2rem",
    textAlign: "center", marginBottom: "1.25rem",
  },
  statusIcon: { fontSize: "36px", marginBottom: "12px" },
  statusTitle: { fontSize: "17px", fontWeight: "700", color: "#f0f0f5", marginBottom: "6px" },
  statusSub: { fontSize: "13px", color: "#6b6f85", marginBottom: "1.25rem" },
  courseList: {
    background: "#0f1117", border: "1px solid #2a2d3a",
    borderRadius: "10px", padding: "10px 14px",
    textAlign: "left", marginBottom: "1rem",
  },
  courseListItem: {
    fontSize: "13px", color: "#c8cad8",
    padding: "6px 0", borderBottom: "1px solid #1e2130",
    display: "flex", alignItems: "center", gap: "8px",
  },
  dismissed: {
    background: "#2d1a1a", border: "1px solid #5c2a2a",
    borderRadius: "16px", padding: "2rem", textAlign: "center",
  },
  error: {
    background: "#2d1a1a", border: "1px solid #5c2a2a",
    borderRadius: "10px", padding: "10px 14px",
    fontSize: "13px", color: "#f87171", marginBottom: "1rem",
  },
  success: {
    background: "#1a2e1a", border: "1px solid #2a5c2a",
    borderRadius: "10px", padding: "10px 14px",
    fontSize: "13px", color: "#4ade80", marginBottom: "1rem",
  },
  loading: { padding: "2rem", textAlign: "center", fontSize: "13px", color: "#6b6f85" },
  pill: (color) => ({
    display: "inline-block", fontSize: "11px", padding: "2px 8px",
    borderRadius: "20px", fontWeight: "500",
    background: color === "green" ? "#1a2e1a" : color === "yellow" ? "#2a2310" : color === "red" ? "#2d1a1a" : "#1e2130",
    border: `1px solid ${color === "green" ? "#2a5c2a" : color === "yellow" ? "#4a3a10" : color === "red" ? "#5c2a2a" : "#2a2d3a"}`,
    color: color === "green" ? "#4ade80" : color === "yellow" ? "#fbbf24" : color === "red" ? "#f87171" : "#9ca0b8",
  }),
};

function statusInfo(s) {
  if (s === "PENDING")  return { icon: "⏳", color: "yellow", label: "Pending approval", msg: "Your registration request has been submitted. Waiting for admin approval." };
  if (s === "APPROVED") return { icon: "✅", color: "green",  label: "Approved",         msg: "Your registration was approved! You are now enrolled in the courses below." };
  if (s === "REJECTED") return { icon: "❌", color: "red",    label: "Rejected",         msg: "Your registration was rejected. Please contact the admin office." };
  if (s === "CANCELLED")return { icon: "🚫", color: "grey",   label: "Cancelled",        msg: "This registration was cancelled." };
  return { icon: "❓", color: "grey", label: s, msg: "" };
}

export default function RegistrationPage() {
  const [courses, setCourses]          = useState([]);
  const [semesters, setSemesters]      = useState([]);
  const [myRegistration, setMyReg]     = useState(null);
  const [academicStatus, setAcaStatus] = useState(null);
  const [selected, setSelected]        = useState([]);
  const [loading, setLoading]          = useState(true);
  const [submitting, setSubmitting]    = useState(false);
  const [showForm, setShowForm]        = useState(false);  // FIX: keeps myReg ref while showing form
  const [error, setError]              = useState("");
  const [success, setSuccess]          = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [cRes, sRes, rRes, aRes] = await Promise.all([
          apiFetch("/courses/"),
          apiFetch("/semesters/"),
          apiFetch("/registrations/"),
          apiFetch("/academic-status/"),
        ]);
        if (cRes.ok) setCourses(await cRes.json());
        if (sRes.ok) setSemesters(await sRes.json());
        if (rRes.ok) {
          const regs = await rRes.json();
          const semRes = await apiFetch("/semesters/");
          const sems = await semRes.json();
          const activeSem = sems.find(s => s.is_active);
          if (activeSem) {
            const existing = regs.find(r => r.semester === activeSem.id);
            setMyReg(existing || null);
          }
        }
        if (aRes.ok) {
          const d = await aRes.json();
          setAcaStatus(Array.isArray(d) ? d[0] : d);
        }
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const activeSemester = semesters.find(s => s.is_active);
  const isDismissed = academicStatus?.status === "DISMISSED";

  const toggleCourse = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) { setError("Please select at least one course."); return; }
    if (!activeSemester) { setError("No active semester found."); return; }
    setSubmitting(true); setError(""); setSuccess("");
    try {
      let res, data;

      // FIX: if a rejected registration exists, PATCH it instead of POSTing a new one
      if (myRegistration && myRegistration.status === "REJECTED") {
        res = await apiFetch(`/registrations/${myRegistration.id}/`, {
          method: "PATCH",
          body: JSON.stringify({ courses: selected }),
        });
      } else {
        res = await apiFetch("/registrations/", {
          method: "POST",
          body: JSON.stringify({ semester: activeSemester.id, courses: selected }),
        });
      }

      data = await res.json();
      if (!res.ok) {
        setError(data?.error || data?.detail || data?.non_field_errors?.[0] || JSON.stringify(data));
        return;
      }
      setMyReg(data);
      setShowForm(false);
      setSelected([]);
      setSuccess("Registration submitted! Waiting for admin approval.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={S.loading}>Loading registration page…</div>;

  if (isDismissed) {
    return (
      <div style={S.dismissed}>
        <div style={{ fontSize: "36px", marginBottom: "12px" }}>⛔</div>
        <div style={{ fontSize: "16px", fontWeight: "700", color: "#f87171", marginBottom: "6px" }}>Registration blocked</div>
        <div style={{ fontSize: "13px", color: "#9ca0b8" }}>
          Your academic status is DISMISSED. You are not allowed to register.<br />
          Please contact the admin office.
        </div>
      </div>
    );
  }

  if (!activeSemester) {
    return (
      <div style={S.statusCard}>
        <div style={S.statusIcon}>📅</div>
        <div style={S.statusTitle}>No active semester</div>
        <div style={S.statusSub}>Registration is currently closed. Please check back later.</div>
      </div>
    );
  }

  // FIX: show status screen only if registered AND not clicking "submit new request"
  if (myRegistration && !showForm) {
    const info = statusInfo(myRegistration.status);
    return (
      <div style={S.wrap}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={S.statusCard}>
          <div style={S.statusIcon}>{info.icon}</div>
          <div style={S.statusTitle}>Registration {info.label}</div>
          <div style={S.statusSub}>{info.msg}</div>
          <span style={S.pill(info.color)}>{myRegistration.status}</span>
        </div>

        <div style={S.sectionHead}>Courses in this registration</div>
        <div style={S.courseList}>
          {(myRegistration.courses || []).length === 0
            ? <div style={{ fontSize: "13px", color: "#4a4e63", padding: "8px 0" }}>No courses found.</div>
            : (myRegistration.courses || []).map(c => (
                <div key={c} style={S.courseListItem}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6366f1", display: "inline-block", flexShrink: 0 }} />
                  {courses.find(cr => cr.id === c)?.name || `Course #${c}`}
                </div>
              ))
          }
        </div>

        {myRegistration.status === "REJECTED" && (
          // FIX: keep myRegistration in state, just show the form
          <button style={S.submitBtn} onClick={() => { setShowForm(true); setError(""); setSuccess(""); }}>
            Submit a new request
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={S.banner}>
        <div style={S.bannerTitle}>Course Registration</div>
        <div style={S.bannerSub}>Select the courses you want to enroll in this semester.</div>
        <div style={S.semBadge}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#60a5fa", display: "inline-block" }} />
          {activeSemester.name} — {activeSemester.year}
        </div>
      </div>

      {error   && <div style={S.error}>⚠️ {error}</div>}
      {success && <div style={S.success}>✓ {success}</div>}

      <div style={S.sectionHead}>Available courses ({courses.length})</div>
      {courses.length === 0
        ? <div style={{ ...S.statusCard, padding: "1.5rem" }}>
            <div style={{ fontSize: "13px", color: "#4a4e63" }}>No courses available for your department.</div>
          </div>
        : <div style={S.courseGrid}>
            {courses.map(c => {
              const isSelected = selected.includes(c.id);
              return (
                <div key={c.id}
                  style={{ ...S.courseCard, ...(isSelected ? S.courseCardSelected : {}) }}
                  onClick={() => toggleCourse(c.id)}>
                  {isSelected && <div style={S.checkmark}>✓</div>}
                  <div style={S.courseName}>{c.name}</div>
                  <div style={S.courseMeta}>{c.code} · {c.credit_hours} credit{c.credit_hours !== 1 ? "s" : ""}</div>
                  {c.description && (
                    <div style={{ fontSize: "12px", color: "#4a4e63", marginTop: "6px" }}>
                      {c.description.slice(0, 60)}{c.description.length > 60 ? "…" : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
      }

      <div style={S.submitRow}>
        <div style={S.selectedCount}>
          {selected.length === 0
            ? "No courses selected"
            : `${selected.length} course${selected.length > 1 ? "s" : ""} selected`}
        </div>
        <button
          style={{ ...S.submitBtn, ...(selected.length === 0 || submitting ? S.disabledBtn : {}) }}
          onClick={handleSubmit}
          disabled={selected.length === 0 || submitting}>
          {submitting ? "Submitting…" : "Submit registration"}
        </button>
      </div>
    </div>
  );
}