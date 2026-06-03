import { useState, useEffect } from "react";
import { apiFetch } from "./api";

const S = {
  wrap: { animation: "fadeUp .4s ease both", maxWidth: "600px" },
  banner: {
    background: "linear-gradient(120deg,#0f1117 60%,#1a1520)",
    border: "1px solid #2a2d3a", borderRadius: "16px",
    padding: "1.5rem", marginBottom: "1.25rem",
    display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
  },
  avatar: {
    width: "60px", height: "60px", borderRadius: "50%",
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "22px", fontWeight: "700", color: "#fff", flexShrink: 0,
  },
  fullName: { fontSize: "20px", fontWeight: "700", color: "#f0f0f5", marginBottom: "4px" },
  username: { fontSize: "13px", color: "#6b6f85" },
  roleBadge: {
    fontSize: "11px", padding: "3px 10px", borderRadius: "20px",
    fontWeight: "500", marginTop: "6px", display: "inline-block",
  },
  card: {
    background: "#1a1d27", border: "1px solid #2a2d3a",
    borderRadius: "16px", padding: "1.25rem", marginBottom: "1rem",
  },
  sectionHead: {
    fontSize: "11px", fontWeight: "600", color: "#4a4e63",
    letterSpacing: ".06em", textTransform: "uppercase", marginBottom: "12px",
  },
  row: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", padding: "8px 0",
    borderBottom: "1px solid #1e2130",
  },
  rowLabel: { fontSize: "13px", color: "#6b6f85" },
  rowValue: { fontSize: "13px", color: "#e2e4f0", fontWeight: "500", textAlign: "right" },
  editCard: {
    background: "#1a1d27", border: "1px solid #2a2d3a",
    borderRadius: "16px", padding: "1.25rem", marginBottom: "1rem",
  },
  inputRow: { marginBottom: "12px" },
  label: { fontSize: "12px", color: "#9ca0b8", marginBottom: "4px", display: "block" },
  input: {
    background: "#0f1117", border: "1px solid #2a2d3a",
    borderRadius: "8px", padding: "8px 12px",
    color: "#f0f0f5", fontSize: "13px", width: "100%",
    fontFamily: "'DM Sans', sans-serif", outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    background: "#0f1117", border: "1px solid #2a2d3a",
    borderRadius: "8px", padding: "8px 12px",
    color: "#f0f0f5", fontSize: "13px", width: "100%",
    fontFamily: "'DM Sans', sans-serif", outline: "none",
    boxSizing: "border-box", minHeight: "80px", resize: "vertical",
  },
  btnRow: { display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" },
  cancelBtn: {
    fontSize: "13px", padding: "8px 16px", borderRadius: "8px",
    border: "1px solid #2a2d3a", color: "#9ca0b8",
    background: "transparent", cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  saveBtn: {
    fontSize: "13px", padding: "8px 20px", borderRadius: "8px",
    border: "none", color: "#fff",
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: "600",
  },
  editBtn: {
    fontSize: "12px", padding: "6px 14px", borderRadius: "8px",
    border: "1px solid #2a2d3a", color: "#9ca0b8",
    background: "transparent", cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", marginTop: "10px",
  },
  success: {
    background: "#1a2e1a", border: "1px solid #2a5c2a",
    borderRadius: "8px", padding: "8px 12px",
    fontSize: "12px", color: "#4ade80", marginBottom: "10px",
  },
  error: {
    background: "#2d1a1a", border: "1px solid #5c2a2a",
    borderRadius: "8px", padding: "8px 12px",
    fontSize: "12px", color: "#f87171", marginBottom: "10px",
  },
  loading: { padding: "2rem", textAlign: "center", fontSize: "13px", color: "#6b6f85" },
};

const ROLE_COLOR = {
  STUDENT: { bg: "#1e1f3a", border: "#3a3a8a", color: "#818cf8" },
  TEACHER: { bg: "#1a2e1a", border: "#2a5c2a", color: "#4ade80" },
  ADMIN:   { bg: "#2a1e08", border: "#5a3a10", color: "#f59e0b" },
};

export default function ProfilePage() {
  const [profile, setProfile]   = useState(null);
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    apiFetch("/users/me/")
      .then(r => r.ok && r.json())
      .then(d => { if (d) { setProfile(d); setForm(d); } })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    const res = await apiFetch(`/users/${profile.id}/`, {
      method: "PATCH",
      body: JSON.stringify({
        first_name: form.first_name,
        last_name:  form.last_name,
        email:      form.email,
        bio:        form.bio,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setProfile(data);
      setForm(data);
      setEditing(false);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(data?.detail || JSON.stringify(data));
    }
    setSaving(false);
  };

  if (loading) return <div style={S.loading}>Loading profile…</div>;
  if (!profile) return <div style={S.loading}>Could not load profile.</div>;

  const rc = ROLE_COLOR[profile.role] || ROLE_COLOR.STUDENT;
  const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || profile.username?.[0]?.toUpperCase();

  return (
    <div style={S.wrap}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header banner */}
      <div style={S.banner}>
        <div style={S.avatar}>{initials}</div>
        <div>
          <div style={S.fullName}>{profile.first_name} {profile.last_name}</div>
          <div style={S.username}>@{profile.username}</div>
          <div style={{
            ...S.roleBadge,
            background: rc.bg, border: `1px solid ${rc.border}`, color: rc.color,
          }}>
            {profile.role}
          </div>
        </div>
      </div>

      {success && <div style={S.success}>✓ {success}</div>}

      {/* Account info */}
      <div style={S.card}>
        <div style={S.sectionHead}>Account information</div>
        {[
          { label: "Username",    value: profile.username },
          { label: "Email",       value: profile.email || "—" },
          { label: "Role",        value: profile.role },
          { label: "Department",  value: profile.department_name || "—" },
          { label: "Student ID",  value: profile.student_id || "—" },
          { label: "Staff ID",    value: profile.staff_id || "—" },
          { label: "Gender",      value: profile.gender || "—" },
          { label: "Date of birth", value: profile.date_of_birth || "—" },
          { label: "Bio",         value: profile.bio || "—" },
        ].map(r => (
          <div key={r.label} style={S.row}>
            <span style={S.rowLabel}>{r.label}</span>
            <span style={S.rowValue}>{String(r.value)}</span>
          </div>
        ))}
        {!editing && (
          <button style={S.editBtn} onClick={() => { setEditing(true); setError(""); }}>
            ✎ Edit profile
          </button>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div style={S.editCard}>
          <div style={S.sectionHead}>Edit profile</div>
          {error && <div style={S.error}>{error}</div>}
          {[
            { label: "First name", key: "first_name", type: "text" },
            { label: "Last name",  key: "last_name",  type: "text" },
            { label: "Email",      key: "email",      type: "email" },
          ].map(f => (
            <div key={f.key} style={S.inputRow}>
              <label style={S.label}>{f.label}</label>
              <input style={S.input} type={f.type}
                value={form[f.key] || ""}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
          <div style={S.inputRow}>
            <label style={S.label}>Bio</label>
            <textarea style={S.textarea}
              value={form.bio || ""}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="Tell us a bit about yourself…" />
          </div>
          <div style={S.btnRow}>
            <button style={S.cancelBtn} onClick={() => { setEditing(false); setForm(profile); setError(""); }}>
              Cancel
            </button>
            <button style={S.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}