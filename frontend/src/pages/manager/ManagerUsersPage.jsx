import { useState, useEffect } from "react";

import { useAuth } from "../../context/AuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;
const ROLES = ["member", "caretaker", "manager", "admin"];
const CREATABLE_ROLES = ["caretaker", "manager", "admin"];

export default function ManagerUsersPage() {
  const { user: currentUser } = useAuth();
  const [deletingId, setDeletingId] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New-user form state (for directly creating caretaker/manager/admin accounts)
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "caretaker" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/users`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(account) {
    if (Number(account.id) === Number(currentUser?.id)) return;
    if (!window.confirm(`Permanently delete ${account.name} (${account.email})? Their bookings, booking reviews and submitted issues will also be removed. This cannot be undone.`)) return;
    setError("");
    setDeletingId(account.id);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${account.id}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete user");
      }
      setUsers((previous) => previous.filter((item) => item.id !== account.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRoleChange(userId, newRole) {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");

      setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");

      setUsers((prev) => [data.user, ...prev]);
      setForm({ name: "", email: "", password: "", role: "caretaker" });
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Manage Users</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Create a caretaker/manager/admin account directly */}
      <section className="mb-10 border rounded p-4">
        <h2 className="text-lg font-medium mb-4">Create caretaker, manager or admin account</h2>
        <form onSubmit={handleCreateUser} className="space-y-3">
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="password"
            placeholder="Temporary password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="w-full border rounded px-3 py-2"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            {CREATABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creating}
            className="btn btn-primary btn-action"
          >
            {creating ? "Creating..." : "Create account"}
          </button>
        </form>
      </section>

      {/* Existing users, with role dropdown to promote/demote */}
      <section className="existing-users-panel" aria-labelledby="existing-users-title">
        <h2 id="existing-users-title" className="text-lg font-medium mb-4">Existing users</h2>
        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="existing-users-scroll" role="region" aria-label="Existing users table" tabIndex={0}>
          <table className="existing-users-table">
            <thead>
              <tr className="text-left border-b">
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="py-2">{u.name}</td>
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">
                    <select
                      aria-label={`Role for ${u.name || u.email}`}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2">
                    {Number(u.id) === Number(currentUser?.id) ? (
                      <span className="text-sm text-gray-500">Your account</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u)}
                        disabled={deletingId !== null}
                        className="btn btn-error btn-danger-action btn-compact"
                        aria-label={`Delete user ${u.name || u.email}`}
                      >
                        {deletingId === u.id ? "Deleting..." : "Delete user"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>
    </div>
  );
}
