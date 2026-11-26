
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Pencil, Trash2, Users as UsersIcon } from 'lucide-react';
import axios from 'axios';

import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface UserRecord {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
}

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'Customer',
};

export default function Users() {
  const { user } = useAuth();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const limit = 10;

  const getError = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      const message = err.response?.data?.message;

      return Array.isArray(message)
        ? message.join(', ')
        : message || 'Request failed.';
    }

    return 'Something went wrong.';
  };

  const loadUsers = async (currentPage: number) => {
    setLoading(true);

    try {
      const response = await api.get('/api/v1/users', {
        params: {
          page: currentPage,
          limit,
        },
      });

      setUsers(response.data.data);
      setTotal(response.data.total);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Admin') {
      void loadUsers(page);
    }
  }, [page, user?.role]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const openEdit = (record: UserRecord) => {
    setEditing(record);

    setForm({
      fullName: record.fullName,
      email: record.email,
      password: '',
      role: record.role,
    });

    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(initialForm);
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editing) {
        const payload = {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          ...(form.password
            ? { password: form.password }
            : {}),
        };

        await api.patch(
          `/api/v1/users/${editing.userId}`,
          payload,
        );

        setSuccess('User updated successfully.');
      } else {
        await api.post('/api/v1/users', {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        });

        setSuccess('User created successfully.');
      }

      closeForm();

      if (!editing && page !== 1) {
        setPage(1);
      } else {
        await loadUsers(page);
      }
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: UserRecord) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${record.fullName}?`,
      )
    ) {
      return;
    }

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await api.delete(`/api/v1/users/${record.userId}`);

      setSuccess('User deleted successfully.');

      if (users.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await loadUsers(page);
      }
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((record) => {
    const keyword = search.toLowerCase();

    return (
      record.fullName.toLowerCase().includes(keyword) ||
      record.email.toLowerCase().includes(keyword) ||
      record.role.toLowerCase().includes(keyword)
    );
  });

  if (user?.role !== 'Admin') {
    return (
      <div className="error-message">
        Admin access required.
      </div>
    );
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1>User Management</h1>
          <p>Manage ConnectCare user accounts.</p>
        </div>

        <button
          className="action-button"
          onClick={openCreate}
          disabled={saving}
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {success && (
        <div className="success-message">{success}</div>
      )}

      <div className="customer-summary">
        <div className="stat-card">
          <div className="stat-icon blue">
            <UsersIcon size={24} />
          </div>
          <p>Total Users</p>
          <h2>{total}</h2>
        </div>
      </div>

      {showForm && (
        <section className="content-card ticket-detail-card">
          <div className="card-heading">
            <h2>{editing ? 'Edit User' : 'Add New User'}</h2>

            <button
              className="secondary-button"
              onClick={closeForm}
              disabled={saving}
            >
              Cancel
            </button>
          </div>

          <form
            className="dashboard-form"
            onSubmit={handleSubmit}
          >
            <label>Full Name</label>
            <input
              value={form.fullName}
              onChange={(e) =>
                setForm({
                  ...form,
                  fullName: e.target.value,
                })
              }
              maxLength={100}
              required
            />

            <label>Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              maxLength={150}
              required
            />

            <label>
              {editing
                ? 'New Password (Optional)'
                : 'Password'}
            </label>

            <input
              type="password"
              value={form.password}
              autoComplete="new-password"
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
              minLength={8}
              maxLength={72}
              required={!editing}
              placeholder={
                editing
                  ? 'Leave blank to keep current password'
                  : 'Minimum 8 characters'
              }
            />

            <label>Role</label>
            <select
              value={form.role}
              disabled={!!editing}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value,
                })
              }
            >
              <option value="Customer">Customer</option>
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>

            <button
              type="submit"
              className="action-button"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : editing
                  ? 'Save Changes'
                  : 'Create User'}
            </button>
          </form>
        </section>
      )}

      <section className="content-card">
        <div className="card-heading">
          <h2>User Accounts</h2>
        </div>

        <div className="ticket-toolbar">
          <div className="ticket-search">
            <input
              placeholder="Search users on this page..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="empty-state">Loading users...</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Date Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((record) => (
                  <tr key={record.userId}>
                    <td>#{record.userId}</td>
                    <td>{record.fullName}</td>
                    <td>{record.email}</td>
                    <td>
                      <span className="header-role">
                        {record.role}
                      </span>
                    </td>
                    <td>
                      {new Date(
                        record.createdAt,
                      ).toLocaleDateString()}
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                        }}
                      >
                        <button
                          className="secondary-button"
                          onClick={() => openEdit(record)}
                          disabled={saving}
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        {record.role !== 'Admin' && (
                          <button
                            className="secondary-button"
                            style={{ color: '#b91c1c' }}
                            disabled={saving}
                            onClick={() =>
                              void handleDelete(record)
                            }
                          >
                            <Trash2 size={15} />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <p className="empty-state">
                        No users found.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="ticket-toolbar">
          <p className="table-summary">
            Page {page} of{' '}
            {Math.max(1, Math.ceil(total / limit))}
          </p>

          <button
            className="secondary-button"
            disabled={page === 1 || loading || saving}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>

          <button
            className="secondary-button"
            disabled={
              page * limit >= total ||
              loading ||
              saving
            }
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
