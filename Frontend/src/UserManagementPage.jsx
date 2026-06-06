import { useState, useEffect } from "react";
import { apiFetch } from "./api";

const S = {
  wrap: { animation: "fadeUp .4s ease both" },
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "10px" },
  addBtn: { fontSize: "13px", padding: "8px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: "600" },
  filterRow: { display: "flex", gap: "8px", marginBottom: "1.25rem", flexWrap: "wrap" },
  filterBtn: { fontSize: "12px", padding: "6px 14px", borderRadius: "20px", border: "1px solid #2a2d3a", background: "transparent", color: "#9ca0b8", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  filterBtnActive: { background: "#23273a", color: "#f0f0f5", borderColor: "#4a4e63" },
  tableCard: { background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: "12px", overflow: "hidden", marginBottom: "1.25rem" },
  tableHeader: { display: "grid", gridTemplateColumns: "1fr 100px 120px 100px 120px", padding: "8px 14px", borderBottom: "1px solid #2a2d3a", fontSize: "11px", color: "#4a4e63", fontWeight: "600" },
  tableRow: { display: "grid", gridTemplateColumns: "1fr 100px 120px 100px 120px", padding: "10px 14px", borderBottom: "1px solid #1e2130", fontSize: "13px", color: "#c8cad8", alignItems: "center" },
  roleBadge: (r) => ({ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: "500", background: r === "STUDENT" ? "#1e1f3a" : r === "TEACHER" ? "#1a2e1a" : "#2a1e08", border: `1px solid ${r === "STUDENT" ? "#3a3a8a" : r === "TEACHER" ? "#2a5c2a" : "#5a3a10"}`, color: r === "STUDENT" ? "#818cf8" : r === "TEACHER" ? "#4ade80" : "#f59e0b" }),
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
  marginTop: "1rem",
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
};

const EMPTY_FORM = { username: "", password: "", first_name: "", last_name: "", email: "", role: "STUDENT", student_id: "", staff_id: "", department: "", gender: "MALE", date_of_birth: "" };

export default function UserManagementPage() {
  const [users, setUsers]             = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roleFilter, setRoleFilter]   = useState("ALL");
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [toast, setToast]             = useState({ msg: "", isError: false });

  const showToast = (msg, isError = false) => { setToast({ msg, isError }); setTimeout(() => setToast({ msg: "", isError: false }), 4000); };

  const load = async () => {
    const [uRes, dRes] = await Promise.all([apiFetch("/users/"), apiFetch("/departments/")]);
    if (uRes.ok) setUsers(await uRes.json());
    if (dRes.ok) setDepartments(await dRes.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY_FORM); setError(""); setModal("add"); };
  const openEdit = (u) => { setForm({ ...u, password: "" }); setError(""); setModal(u); };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.username || (!modal?.id && !form.password)) { setError("Username and password are required."); return; }
    setSaving(true); setError("");
    const isEdit = modal !== "add" && modal?.id;
    const body = { ...form };
    if (isEdit && !body.password) delete body.password;
    const res = await apiFetch(isEdit ? `/users/${modal.id}/` : "/users/", { method: isEdit ? "PATCH" : "POST", body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) { showToast(isEdit ? "User updated!" : "User created!"); setModal(null); load(); }
    else setError(data?.detail || data?.username?.[0] || JSON.stringify(data));
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const res = await apiFetch(`/users/${id}/`, { method: "DELETE" });
    if (res.ok || res.status === 204) { setUsers(p => p.filter(u => u.id !== id)); showToast("User deleted."); }
    else showToast("Cannot delete this user.", true);
  };

  const filtered = roleFilter === "ALL" ? users : users.filter(u => u.role === roleFilter);

  if (loading) return <div style={S.loading}>Loading users…</div>;

  return (
    <div style={S.wrap}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {toast.msg && <div style={{ ...S.toast, background: toast.isError ? "#2d1a1a" : "#1a2e1a", border: `1px solid ${toast.isError ? "#5c2a2a" : "#2a5c2a"}`, color: toast.isError ? "#f87171" : "#4ade80" }}>{toast.isError ? "⚠️" : "✓"} {toast.msg}</div>}

      {modal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={S.modalCard}>
            <div style={S.modalTitle}>{modal === "add" ? "Add user" : `Edit — ${modal.username}`}</div>
            {error && <div style={S.error}>{error}</div>}
            <div style={S.row2}>
              <div><label style={S.label}>First name</label><input style={S.input} value={form.first_name || ""} onChange={e => f("first_name", e.target.value)} /></div>
              <div><label style={S.label}>Last name</label><input style={S.input} value={form.last_name || ""} onChange={e => f("last_name", e.target.value)} /></div>
            </div>
            <label style={S.label}>Username *</label>
            <input style={S.input} value={form.username || ""} onChange={e => f("username", e.target.value)} />
            <label style={S.label}>{modal === "add" ? "Password *" : "New password (leave blank to keep)"}</label>
            <input style={S.input} type="password" value={form.password || ""} onChange={e => f("password", e.target.value)} />
            <label style={S.label}>Email</label>
            <input style={S.input} type="email" value={form.email || ""} onChange={e => f("email", e.target.value)} />
            <div style={S.row2}>
              <div>
                <label style={S.label}>Role *</label>
                <select style={S.select} value={form.role || "STUDENT"} onChange={e => f("role", e.target.value)}>
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Gender</label>
                <select style={S.select} value={form.gender || "MALE"} onChange={e => f("gender", e.target.value)}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
            </div>
            <label style={S.label}>Department</label>
            <select style={S.select} value={form.department || ""} onChange={e => f("department", e.target.value)}>
              <option value="">— No department —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <div style={S.row2}>
              <div><label style={S.label}>Student ID</label><input style={S.input} value={form.student_id || ""} onChange={e => f("student_id", e.target.value)} /></div>
              <div><label style={S.label}>Staff ID</label><input style={S.input} value={form.staff_id || ""} onChange={e => f("staff_id", e.target.value)} /></div>
            </div>
            <label style={S.label}>Date of birth</label>
            <input style={S.input} type="date" value={form.date_of_birth || ""} onChange={e => f("date_of_birth", e.target.value)} />
            <div style={S.modalBtns}>
              <button style={S.cancelBtn} onClick={() => setModal(null)}>Cancel</button>
              <button style={S.saveBtn} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      <div style={S.topRow}>
        <span style={{ fontSize: "15px", fontWeight: "600", color: "#f0f0f5" }}>Users ({users.length})</span>
        <button style={S.addBtn} onClick={openAdd}>+ Add user</button>
      </div>

      <div style={S.filterRow}>
        {["ALL", "STUDENT", "TEACHER", "ADMIN"].map(r => (
          <button key={r} style={{ ...S.filterBtn, ...(roleFilter === r ? S.filterBtnActive : {}) }} onClick={() => setRoleFilter(r)}>{r}</button>
        ))}
      </div>

      <div style={S.tableCard}>
        <div style={S.tableHeader}><span>Name</span><span>Username</span><span>Department</span><span>Role</span><span>Actions</span></div>
        {filtered.length === 0
          ? <div style={S.empty}>No users found.</div>
          : filtered.map(u => (
              <div key={u.id} style={S.tableRow}>
                <span style={{ color: "#e2e4f0", fontWeight: "500" }}>{u.first_name} {u.last_name}</span>
                <span style={{ color: "#9ca0b8" }}>@{u.username}</span>
                <span style={{ color: "#9ca0b8", fontSize: "12px" }}>{departments.find(d => d.id === u.department)?.name || "—"}</span>
                <span><span style={S.roleBadge(u.role)}>{u.role}</span></span>
                <span>
                  <button style={{ ...S.actionBtn, borderColor: "#2a3a5a", color: "#60a5fa" }} onClick={() => openEdit(u)}>Edit</button>
                  <button style={{ ...S.actionBtn, borderColor: "#5c2a2a", color: "#f87171" }} onClick={() => handleDelete(u.id)}>Delete</button>
                </span>
              </div>
            ))}
      </div>
    </div>
  );
}
