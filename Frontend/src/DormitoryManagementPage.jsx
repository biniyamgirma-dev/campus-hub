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
  modal: {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  overflowY: "auto",
  zIndex: 200,
  padding: "2rem 1rem",
},
  modalCard: {
  background: "#1a1d27",
  border: "1px solid #2a2d3a",
  borderRadius: "16px",
  padding: "1.5rem",
  width: "100%",
  maxWidth: "460px",
  maxHeight: "90vh",
  overflowY: "auto",
},
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

export default function DormitoryManagementPage() {
  const [dorms, setDorms]           = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents]     = useState([]);
  const [semesters, setSemesters]   = useState([]);
  const [departments, setDepts]     = useState([]);
  const [tab, setTab]               = useState("dorms");
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState({});
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [toast, setToast]           = useState({ msg: "", isError: false });

  const showToast = (msg, isError = false) => { setToast({ msg, isError }); setTimeout(() => setToast({ msg: "", isError: false }), 4000); };

  const load = async () => {
    const [dRes, aRes, uRes, sRes, depRes] = await Promise.all([
      apiFetch("/dormitories/"), apiFetch("/dormitory-assignments/"),
      apiFetch("/users/"), apiFetch("/semesters/"), apiFetch("/departments/"),
    ]);
    if (dRes.ok) setDorms(await dRes.json());
    if (aRes.ok) setAssignments(await aRes.json());
    if (uRes.ok) { const u = await uRes.json(); setStudents(u.filter(x => x.role === "STUDENT")); }
    if (sRes.ok) setSemesters(await sRes.json());
    if (depRes.ok) setDepts(await depRes.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setError("");
    let res, data;
    if (modal === "dorm") {
      res = await apiFetch("/dormitories/", { method: "POST", body: JSON.stringify(form) });
    } else if (modal === "assign") {
      res = await apiFetch("/dormitory-assignments/", { method: "POST", body: JSON.stringify(form) });
    } else {
      res = await apiFetch(`/dormitories/${modal.id}/`, { method: "PATCH", body: JSON.stringify(form) });
    }
    data = await res.json();
    if (res.ok) { showToast("Saved!"); setModal(null); load(); }
    else setError(data?.detail || data?.non_field_errors?.[0] || JSON.stringify(data));
    setSaving(false);
  };

  const del = async (url, id, setter) => {
    const res = await apiFetch(`${url}${id}/`, { method: "DELETE" });
    if (res.ok || res.status === 204) { setter(p => p.filter(x => x.id !== id)); showToast("Deleted."); }
    else showToast("Cannot delete.", true);
  };

  if (loading) return <div style={S.loading}>Loading dormitories…</div>;

  return (
    <div style={S.wrap}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {toast.msg && <div style={{ ...S.toast, background: toast.isError ? "#2d1a1a" : "#1a2e1a", border: `1px solid ${toast.isError ? "#5c2a2a" : "#2a5c2a"}`, color: toast.isError ? "#f87171" : "#4ade80" }}>{toast.isError ? "⚠️" : "✓"} {toast.msg}</div>}

      {modal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={S.modalCard}>
            <div style={S.modalTitle}>{modal === "dorm" ? "Add dormitory room" : modal === "assign" ? "Assign student to dorm" : "Edit dormitory"}</div>
            {error && <div style={S.error}>{error}</div>}

            {(modal === "dorm" || modal?.id) && (
              <>
                <div style={S.row2}>
                  <div><label style={S.label}>Block</label><input style={S.input} type="number" value={form.block || ""} onChange={e => f("block", e.target.value)} /></div>
                  <div><label style={S.label}>Room</label><input style={S.input} type="number" value={form.room || ""} onChange={e => f("room", e.target.value)} /></div>
                </div>
                <label style={S.label}>Gender</label>
                <select style={S.select} value={form.gender || "MALE"} onChange={e => f("gender", e.target.value)}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
                <label style={S.label}>Capacity</label>
                <input style={S.input} type="number" value={form.capacity || 4} onChange={e => f("capacity", e.target.value)} />
                <label style={S.label}>Department (optional)</label>
                <select style={S.select} value={form.department || ""} onChange={e => f("department", e.target.value)}>
                  <option value="">— No restriction —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </>
            )}

            {modal === "assign" && (
              <>
                <label style={S.label}>Student</label>
                <select style={S.select} value={form.student || ""} onChange={e => f("student", e.target.value)}>
                  <option value="">— Select student —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.gender})</option>)}
                </select>
                <label style={S.label}>Dormitory room</label>
                <select style={S.select} value={form.dormitory || ""} onChange={e => f("dormitory", e.target.value)}>
                  <option value="">— Select room —</option>
                  {dorms.map(d => <option key={d.id} value={d.id}>Block {d.block}, Room {d.room} — {d.gender} (cap: {d.capacity})</option>)}
                </select>
                <label style={S.label}>Semester</label>
                <select style={S.select} value={form.semester || ""} onChange={e => f("semester", e.target.value)}>
                  <option value="">— Select semester —</option>
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name} {s.year}{s.is_active ? " (Active)" : ""}</option>)}
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
        <button style={{ ...S.tab, ...(tab === "dorms" ? S.tabActive : {}) }} onClick={() => setTab("dorms")}>Rooms ({dorms.length})</button>
        <button style={{ ...S.tab, ...(tab === "assignments" ? S.tabActive : {}) }} onClick={() => setTab("assignments")}>Assignments ({assignments.length})</button>
      </div>

      {tab === "dorms" && (
        <>
          <div style={S.topRow}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#f0f0f5" }}>Dormitory rooms</span>
            <button style={S.addBtn} onClick={() => { setForm({ gender: "MALE", capacity: 4 }); setError(""); setModal("dorm"); }}>+ Add room</button>
          </div>
          <div style={S.tableCard}>
            <div style={{ ...S.tableHeader, gridTemplateColumns: "80px 80px 100px 80px 1fr 100px" }}>
              <span>Block</span><span>Room</span><span>Gender</span><span>Capacity</span><span>Department</span><span>Actions</span>
            </div>
            {dorms.length === 0 ? <div style={S.empty}>No dormitory rooms yet.</div>
              : dorms.map(d => (
                <div key={d.id} style={{ ...S.tableRow, gridTemplateColumns: "80px 80px 100px 80px 1fr 100px" }}>
                  <span style={{ color: "#e2e4f0", fontWeight: "600" }}>{d.block}</span>
                  <span>{d.room}</span>
                  <span style={{ color: d.gender === "MALE" ? "#60a5fa" : "#f472b6", fontSize: "12px" }}>{d.gender}</span>
                  <span>{d.capacity}</span>
                  <span style={{ color: "#9ca0b8", fontSize: "12px" }}>{departments.find(dep => dep.id === d.department)?.name || "Any"}</span>
                  <span>
                    <button style={{ ...S.actionBtn, borderColor: "#2a3a5a", color: "#60a5fa" }} onClick={() => { setForm(d); setError(""); setModal(d); }}>Edit</button>
                    <button style={{ ...S.actionBtn, borderColor: "#5c2a2a", color: "#f87171" }} onClick={() => del("/dormitories/", d.id, setDorms)}>Del</button>
                  </span>
                </div>
              ))}
          </div>
        </>
      )}

      {tab === "assignments" && (
        <>
          <div style={S.topRow}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#f0f0f5" }}>Dormitory assignments</span>
            <button style={S.addBtn} onClick={() => { setForm({}); setError(""); setModal("assign"); }}>+ Assign student</button>
          </div>
          <div style={S.tableCard}>
            <div style={{ ...S.tableHeader, gridTemplateColumns: "1fr 120px 120px 80px" }}>
              <span>Student</span><span>Room</span><span>Semester</span><span>Actions</span>
            </div>
            {assignments.length === 0 ? <div style={S.empty}>No assignments yet.</div>
              : assignments.map(a => {
                const student = students.find(s => s.id === a.student);
                const dorm    = dorms.find(d => d.id === a.dormitory);
                const sem     = semesters.find(s => s.id === a.semester);
                return (
                  <div key={a.id} style={{ ...S.tableRow, gridTemplateColumns: "1fr 120px 120px 80px" }}>
                    <span style={{ color: "#e2e4f0" }}>{student ? `${student.first_name} ${student.last_name}` : `Student #${a.student}`}</span>
                    <span style={{ color: "#9ca0b8" }}>{dorm ? `B${dorm.block}·R${dorm.room}` : `Room #${a.dormitory}`}</span>
                    <span style={{ color: "#9ca0b8", fontSize: "12px" }}>{sem ? `${sem.name} ${sem.year}` : `Sem #${a.semester}`}</span>
                    <span><button style={{ ...S.actionBtn, borderColor: "#5c2a2a", color: "#f87171" }} onClick={() => del("/dormitory-assignments/", a.id, setAssignments)}>Del</button></span>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
