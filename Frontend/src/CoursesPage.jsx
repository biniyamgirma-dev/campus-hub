import { useState, useEffect } from "react";
import { apiFetch } from "./api";

const S = {
  wrap: { animation: "fadeUp .4s ease both" },
  banner: {
    background: "linear-gradient(120deg,#0f1117 60%,#1a1520)",
    border: "1px solid #2a2d3a", borderRadius: "16px",
    padding: "1.5rem", marginBottom: "1.25rem",
  },
  bannerTitle: { fontSize: "18px", fontWeight: "700", color: "#f0f0f5", marginBottom: "4px" },
  bannerSub: { fontSize: "13px", color: "#6b6f85" },
  searchRow: {
    display: "flex", gap: "10px", marginBottom: "1.25rem", flexWrap: "wrap",
  },
  searchInput: {
    background: "#1a1d27", border: "1px solid #2a2d3a",
    borderRadius: "10px", padding: "8px 14px",
    color: "#f0f0f5", fontSize: "13px", flex: 1, minWidth: "200px",
    fontFamily: "'DM Sans', sans-serif", outline: "none",
  },
  filterBtn: {
    fontSize: "12px", padding: "8px 16px", borderRadius: "20px",
    border: "1px solid #2a2d3a", background: "transparent",
    color: "#9ca0b8", cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  filterBtnActive: {
    background: "#23273a", color: "#f0f0f5",
    borderColor: "#4a4e63",
  },
  sectionHead: {
    fontSize: "11px", fontWeight: "600", color: "#4a4e63",
    letterSpacing: ".06em", textTransform: "uppercase", marginBottom: "10px",
  },
  deptSection: { marginBottom: "1.75rem" },
  deptHeader: {
    display: "flex", alignItems: "center", gap: "10px",
    marginBottom: "10px",
  },
  deptName: { fontSize: "15px", fontWeight: "600", color: "#f0f0f5" },
  deptCode: {
    fontSize: "11px", padding: "2px 8px", borderRadius: "20px",
    background: "#23273a", border: "1px solid #2a2d3a", color: "#6b6f85",
  },
  courseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))",
    gap: "10px",
  },
  courseCard: {
    background: "#1a1d27", border: "1px solid #2a2d3a",
    borderRadius: "12px", padding: "1rem",
  },
  courseName: { fontSize: "14px", fontWeight: "600", color: "#f0f0f5", marginBottom: "4px" },
  courseMeta: { fontSize: "12px", color: "#6b6f85", marginBottom: "6px" },
  creditBadge: {
    display: "inline-block", fontSize: "11px", padding: "2px 8px",
    borderRadius: "20px", background: "#1e2535",
    border: "1px solid #2a3a5a", color: "#60a5fa",
  },
  activeBadge: {
    display: "inline-block", fontSize: "11px", padding: "2px 8px",
    borderRadius: "20px", background: "#1a2e1a",
    border: "1px solid #2a5c2a", color: "#4ade80", marginLeft: "6px",
  },
  inactiveBadge: {
    display: "inline-block", fontSize: "11px", padding: "2px 8px",
    borderRadius: "20px", background: "#2d1a1a",
    border: "1px solid #5c2a2a", color: "#f87171", marginLeft: "6px",
  },
  empty: {
    padding: "2rem", textAlign: "center",
    fontSize: "13px", color: "#4a4e63",
    background: "#1a1d27", border: "1px solid #2a2d3a",
    borderRadius: "12px",
  },
  loading: { padding: "2rem", textAlign: "center", fontSize: "13px", color: "#6b6f85" },
  statsRow: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
    gap: "10px", marginBottom: "1.25rem",
  },
  statCard: {
    background: "#1a1d27", border: "1px solid #2a2d3a",
    borderRadius: "12px", padding: "1rem",
  },
  statValue: { fontSize: "24px", fontWeight: "700", marginBottom: "2px" },
  statLabel: { fontSize: "12px", color: "#6b6f85" },
};

export default function CoursesPage({ role }) {
  const [courses, setCourses]         = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch]           = useState("");
  const [deptFilter, setDeptFilter]   = useState("all");
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cRes, dRes] = await Promise.all([
          apiFetch("/courses/"),
          apiFetch("/departments/"),
        ]);
        if (cRes.ok) setCourses(await cRes.json());
        if (dRes.ok) setDepartments(await dRes.json());
      } finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div style={S.loading}>Loading courses…</div>;

  // Filter by search and department
  const filtered = courses.filter(c => {
    const matchSearch = search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "all" || c.department === parseInt(deptFilter);
    return matchSearch && matchDept;
  });

  // Group by department
  const grouped = departments.map(d => ({
    ...d,
    courses: filtered.filter(c => c.department === d.id),
  })).filter(d => d.courses.length > 0);

  const activeCourses = courses.filter(c => c.is_active).length;

  return (
    <div style={S.wrap}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={S.banner}>
        <div style={S.bannerTitle}>Courses & Departments</div>
        <div style={S.bannerSub}>
          {role === "STUDENT" && "Browse courses available in your department."}
          {role === "TEACHER" && "Courses offered across all departments."}
          {role === "ADMIN"   && "All courses grouped by department."}
        </div>
      </div>

      {/* Stats */}
      <div style={S.statsRow}>
        {[
          { label: "Total courses",   value: courses.length,      color: "#6366f1" },
          { label: "Active courses",  value: activeCourses,        color: "#10b981" },
          { label: "Departments",     value: departments.length,   color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} style={{ ...S.statCard, borderTop: `2px solid ${s.color}` }}>
            <div style={{ ...S.statValue, color: s.color }}>{s.value}</div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={S.searchRow}>
        <input
          style={S.searchInput}
          placeholder="Search by course name or code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          style={{ ...S.filterBtn, ...(deptFilter === "all" ? S.filterBtnActive : {}) }}
          onClick={() => setDeptFilter("all")}>
          All
        </button>
        {departments.map(d => (
          <button key={d.id}
            style={{ ...S.filterBtn, ...(deptFilter === String(d.id) ? S.filterBtnActive : {}) }}
            onClick={() => setDeptFilter(String(d.id))}>
            {d.code}
          </button>
        ))}
      </div>

      {/* Courses grouped by department */}
      {grouped.length === 0
        ? <div style={S.empty}>No courses found matching your search.</div>
        : grouped.map(dept => (
            <div key={dept.id} style={S.deptSection}>
              <div style={S.deptHeader}>
                <span style={S.deptName}>{dept.name}</span>
                <span style={S.deptCode}>{dept.code}</span>
                <span style={{ fontSize: "12px", color: "#4a4e63" }}>
                  {dept.courses.length} course{dept.courses.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div style={S.courseGrid}>
                {dept.courses.map(c => (
                  <div key={c.id} style={S.courseCard}>
                    <div style={S.courseName}>{c.name}</div>
                    <div style={S.courseMeta}>{c.code}</div>
                    <span style={S.creditBadge}>
                      {c.credit_hours} credit{c.credit_hours !== 1 ? "s" : ""}
                    </span>
                    <span style={c.is_active ? S.activeBadge : S.inactiveBadge}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
      }
    </div>
  );
}