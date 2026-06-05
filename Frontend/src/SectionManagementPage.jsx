import { useState, useEffect } from "react";
import { apiFetch } from "./api";

const S = {
  wrap: { animation: "fadeUp .4s ease both" },
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "10px" },
  addBtn: { fontSize: "13px", padding: "8px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: "600" },
  tableCard: { background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: "12px", overflow: "hidden", marginBottom: "1.25rem" },
  tableHeader: { display: "grid", padding: "8px 14px", borderBottom: "1px solid #2a2d3a", fontSize: "11px", color: "#4a4e63", fontWeight: "600" },
  tableRow: { display: "grid", padding: "10px 14px", borderBottom: "1px solid #1e2130", fontSize: "13px", color: "#c8cad8", alignItems: "center" },
  actionBtn: { fontSize: "11px", padding: "3px 8px", borderRadius: "6px", border: "1px solid", cursor: "pointer", fontWeight: "500", background: "transparent", fontFamily: "'DM Sans', sans-serif", marginRight: "4px" },
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" },
  modalCard: { background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: "16px", padding: "1.5rem", width: "100%", maxWidth: "440px", maxHeight: "90vh", overflowY: "auto" },
  modalTitle: { fontSize: "16px", fontWeight: "700", color: "#f0f0f5", marginBottom: "1.25rem" },
  label: { fontSize: "12px", color: "#9ca0b8", marginBottom: "4px", display: "block" },
  input: { background: "#0f1117", border: "1px solid #2a2d3a", borderRadius: "8px", padding: "8px 12px", color: "#f0f0f5", fontSize: "13px", width: "100%", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", marginBottom: "12px" },
  select: { background: "#0f1117", border: "1px solid #2a2d3a", borderRadius: "8px", padding: "8px 12px", color: "#f0f0f5", fontSize: "13px", width: "100%", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", marginBottom: "12px" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  modalBtns: { display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" },
  cancelBtn: { fontSize: "13px", padding: "8px 16px", borderRadius: "8px", border: "1px solid #2a2d3a", color: "#9ca0b8", background: "transparent", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  saveBtn: { fontSize: "13px", padding: "8px 20px", borderRadius: "8px", border: "none", color: "#fff", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: "600" },
  error: { background: "#2d1a1a", border: "1px solid #5c2a2a", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "#f87171", marginBottom: "12px" },
  toast: { position: "fixed", bottom: "20px", right: "20px", borderRadius: "10px", padding: "10px 16px", fontSize: "13px", zIndex: 300 },
  empty: { padding: "2rem", textAlign: "center", fontSize: "13px", color: "#4a4e63" },
  loading: { padding: "2rem", textAlign: "center", fontSize: "13px", color: "#6b6f85" },
  tabRow: { display: "flex", gap: "8px", marginBottom: "1.25rem" },
  tab: { fontSize: "13px", padding: "7px 16px", borderRadius: "8px", border: "1px solid #2a2d3a", background: "transparent", color: "#9ca0b8", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  tabActive: { background: "#23273a", color: "#f0f0f5", borderColor: "#4a4e63" },
};

const EMPTY_SEC = { name: "", department: "", entry_year: "", program_year: "", capacity: 40, is_active: true };
const EMPTY_ASSIGN = { student: "", semester: "", section: "" };

export default function SectionManagementPage() {
  const [sections, setSections]     = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [departments, setDepts]     = useState([]);
  const [students, setStudents]     = useState([]);
  const [semesters, setSemesters]   = useState([]);
  const [tab, setTab]               = useState("sections");
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState(EMPTY_SEC);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [toast, setToast]           = useState({ msg: "", isError: false });

  const showToast = (msg, isError = false) => { setToast({ msg, isError }); setTimeout(() => setToast({ msg: "", isError: false }), 4000); };

  const load = async () => {
    const [secRes, assignRes, dRes, uRes, sRes] = await Promise.all([
      apiFetch("/sections/"), apiFetch("/section-assignments/"),
      apiFetch("/departments/"), apiFetch("/users/"), apiFetch("/semesters/"),
    ]);
    if (secRes.ok) setSections(await secRes.json());
    if (assignRes.ok) setAssignments(await assignRes.json());
    if (dRes.ok) setDepts(await dRes.json());
    if (uRes.ok) { const u = await uRes.json(); setStudents(u.filter(x => x.role === "STUDENT")); }
    if (sRes.ok) setSemesters(await sRes.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openAddSection = () => { setForm(EMPTY_SEC); setError(""); setModal("section"); };
  const openAddAssign  = () => { setForm(EMPTY_ASSIGN); setError(""); setModal("assign"); };
  const openEditSection = (s) => { setForm(s); setError(""); setModal({ type: "editSection", ...s }); };

  const handleSave = async () => {
    setSaving(true); setError("");
    let res, data;
    if (modal === "section") {
      res = await apiFetch("/sections/", { method: "POST", body: JSON.stringify(form) });
    } else if (modal === "assign") {
      res = await apiFetch("/section-assignments/", { method: "POST", body: JSON.stringify(form) });
    } else {
      res = await apiFetch(`/sections/${modal.id}/`, { method: "PATCH", body: JSON.stringify(form) });
    }
    data = await res.json();
    if (res.ok) { showToast("Saved successfully!"); setModal(null); load(); }
    else setError(data?.detail || data?.non_field_errors?.[0] || JSON.stringify(data));
    setSaving(false);
  };

  const handleDelete = async (url, id, setter, key) => {
    const res = await apiFetch(`${url}${id}/`, { method: "DELETE" });
    if (res.ok || res.status === 204) { setter(p => p.filter(x => x.id !== id)); showToast("Deleted."); }
    else showToast("Cannot delete.", true);
  };

  if (loading) return <div style={S.loading}>Loading sections…</div>;

  return (
    <div style={S.wrap}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {toast.msg && <div style={{ ...S.toast, background: toast.isError ? "#2d1a1a" : "#1a2e1a", border: `1px solid ${toast.isError ? "#5c2a2a" : "#2a5c2a"}`, color: toast.isError ? "#f87171" : "#4ade80" }}>{toast.isError ? "⚠️" : "✓"} {toast.msg}</div>}

      {modal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={S.modalCard}>
            <div style={S.modalTitle}>
              {modal === "section" ? "Add section" : modal === "assign" ? "Assign student to section" : `Edit section — ${modal.name}`}
            </div>
            {error && <div style={S.error}>{error}</div>}

            {(modal === "section" || modal?.type === "editSection") && (
              <>
                <label style={S.label}>Section name (A, B, C…)</label>
                <input style={S.input} value={form.name || ""} onChange={e => f("name", e.target.value)} />
                <label style={S.label}>Department</label>
                <select style={S.select} value={form.department || ""} onChange={e => f("department", e.target.value)}>
                  <option value="">— Select —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <div style={S.row2}>
                  <div><label style={S.label}>Entry year</label><input style={S.input} type="number" value={form.entry_year || ""} onChange={e => f("entry_year", e.target.value)} placeholder="e.g. 2023" /></div>
                  <div><label style={S.label}>Program year</label><input style={S.input} type="number" value={form.program_year || ""} onChange={e => f("program_year", e.target.value)} placeholder="1–5" /></div>
                </div>
                <label style={S.label}>Capacity</label>
                <input style={S.input} type="number" value={form.capacity || 40} onChange={e => f("capacity", e.target.value)} />
              </>
            )}

            {modal === "assign" && (
              <>
                <label style={S.label}>Student</label>
                <select style={S.select} value={form.student || ""} onChange={e => f("student", e.target.value)}>
                  <option value="">— Select student —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} (@{s.username})</option>)}
                </select>
                <label style={S.label}>Semester</label>
                <select style={S.select} value={form.semester || ""} onChange={e => f("semester", e.target.value)}>
                  <option value="">— Select semester —</option>
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name} {s.year}{s.is_active ? " (Active)" : ""}</option>)}
                </select>
                <label style={S.label}>Section</label>
                <select style={S.select} value={form.section || ""} onChange={e => f("section", e.target.value)}>
                  <option value="">— Select section —</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{departments.find(d => d.id === s.department)?.name} — Section {s.name} (Year {s.program_year})</option>)}
                </select>
              </>
            )}

            <div style={S.modalBtns}>
              <button style={S.cancelBtn} onClick={() => setModal(null)}>Cancel</button>
              <button style={S.saveBtn} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      <div style={S.tabRow}>
        <button style={{ ...S.tab, ...(tab === "sections" ? S.tabActive : {}) }} onClick={() => setTab("sections")}>Sections ({sections.length})</button>
        <button style={{ ...S.tab, ...(tab === "assignments" ? S.tabActive : {}) }} onClick={() => setTab("assignments")}>Assignments ({assignments.length})</button>
      </div>

      {tab === "sections" && (
        <>
          <div style={S.topRow}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#f0f0f5" }}>All sections</span>
            <button style={S.addBtn} onClick={openAddSection}>+ Add section</button>
          </div>
          <div style={S.tableCard}>
            <div style={{ ...S.tableHeader, gridTemplateColumns: "1fr 100px 80px 80px 80px 120px" }}>
              <span>Department</span><span>Section</span><span>Entry yr</span><span>Year</span><span>Capacity</span><span>Actions</span>
            </div>
            {sections.length === 0 ? <div style={S.empty}>No sections yet.</div>
              : sections.map(s => (
                <div key={s.id} style={{ ...S.tableRow, gridTemplateColumns: "1fr 100px 80px 80px 80px 120px" }}>
                  <span style={{ color: "#e2e4f0" }}>{departments.find(d => d.id === s.department)?.name || `Dept #${s.department}`}</span>
                  <span style={{ fontWeight: "600", color: "#818cf8" }}>Section {s.name}</span>
                  <span>{s.entry_year}</span>
                  <span>Year {s.program_year}</span>
                  <span>{s.capacity}</span>
                  <span>
                    <button style={{ ...S.actionBtn, borderColor: "#2a3a5a", color: "#60a5fa" }} onClick={() => openEditSection(s)}>Edit</button>
                    <button style={{ ...S.actionBtn, borderColor: "#5c2a2a", color: "#f87171" }} onClick={() => handleDelete("/sections/", s.id, setSections)}>Del</button>
                  </span>
                </div>
              ))}
          </div>
        </>
      )}

      {tab === "assignments" && (
        <>
          <div style={S.topRow}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#f0f0f5" }}>Student section assignments</span>
            <button style={S.addBtn} onClick={openAddAssign}>+ Assign student</button>
          </div>
          <div style={S.tableCard}>
            <div style={{ ...S.tableHeader, gridTemplateColumns: "1fr 120px 120px 80px" }}>
              <span>Student</span><span>Section</span><span>Semester</span><span>Actions</span>
            </div>
            {assignments.length === 0 ? <div style={S.empty}>No assignments yet.</div>
              : assignments.map(a => {
                const student = students.find(s => s.id === a.student);
                const section = sections.find(s => s.id === a.section);
                const semester = semesters.find(s => s.id === a.semester);
                return (
                  <div key={a.id} style={{ ...S.tableRow, gridTemplateColumns: "1fr 120px 120px 80px" }}>
                    <span style={{ color: "#e2e4f0" }}>{student ? `${student.first_name} ${student.last_name}` : `Student #${a.student}`}</span>
                    <span style={{ color: "#818cf8" }}>Section {section?.name || a.section}</span>
                    <span style={{ color: "#9ca0b8", fontSize: "12px" }}>{semester ? `${semester.name} ${semester.year}` : `Sem #${a.semester}`}</span>
                    <span>
                      <button style={{ ...S.actionBtn, borderColor: "#5c2a2a", color: "#f87171" }} onClick={() => handleDelete("/section-assignments/", a.id, setAssignments)}>Del</button>
                    </span>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
