import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Save } from 'lucide-react';
import axios from 'axios';

import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type {
  Ticket,
  TicketHistory,
} from '../types/ticket';

export default function TicketDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const isStaff =
    user?.role === 'Staff' || user?.role === 'Admin';

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<TicketHistory[]>([]);
  const [status, setStatus] = useState('Pending');
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      setError('');
      setSuccess('');
      setTicket(null);
      setHistory([]);

      try {
        const [ticketResponse, historyResponse] =
          await Promise.all([
            api.get<Ticket>(`/tickets/${id}`),
            api.get<TicketHistory[]>(
              `/tickets/${id}/history`,
            ),
          ]);

        setTicket(ticketResponse.data);
        setStatus(ticketResponse.data.status);
        setHistory(historyResponse.data);
      } catch {
        setError('Unable to load ticket details.');
      } finally {
        setLoading(false);
      }
    };

    void loadDetails();
  }, [id]);

  const handleUpdate = async (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (!ticket || !isStaff) return;

    setError('');
    setSuccess('');

    if (status === ticket.status) {
      setError('Please select a different status.');
      return;
    }

    setSaving(true);

    try {
      await api.patch(`/tickets/${id}/status`, {
        status,
        remarks: remarks.trim(),
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;

        setError(
          Array.isArray(message)
            ? message.join(', ')
            : message || 'Unable to update ticket status.',
        );
      } else {
        setError('Something went wrong.');
      }

      setSaving(false);
      return;
    }

    setSuccess('Ticket status updated successfully.');
    setRemarks('');

    try {
      const [ticketResponse, historyResponse] =
        await Promise.all([
          api.get<Ticket>(`/tickets/${id}`),
          api.get<TicketHistory[]>(
            `/tickets/${id}/history`,
          ),
        ]);

      setTicket(ticketResponse.data);
      setStatus(ticketResponse.data.status);
      setHistory(historyResponse.data);
    } catch {
      setTicket(null);
      setError(
        'Status was saved, but the latest details could not be loaded. Please refresh the page.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="empty-state">Loading ticket...</p>;
  }

  if (!ticket) {
    return (
      <section className="content-card">
        {success && (
          <div className="success-message">{success}</div>
        )}

        <div className="error-message">
          {error || 'Ticket not found.'}
        </div>

        <Link to="/tickets" className="secondary-button">
          Back to Tickets
        </Link>
      </section>
    );
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1>Ticket #{ticket.ticketId}</h1>
          <p>View support ticket information and progress.</p>
        </div>

        <Link to="/tickets" className="secondary-button">
          <ArrowLeft size={17} />
          Back
        </Link>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {success && (
        <div className="success-message">{success}</div>
      )}

      <section className="content-card ticket-detail-card">
        <div className="card-heading">
          <h2>{ticket.subject}</h2>

          <span
            className={`status-badge ${ticket.status
              .toLowerCase()
              .replaceAll(' ', '-')}`}
          >
            {ticket.status}
          </span>
        </div>

        <div className="ticket-info-grid">
          <div>
            <small>Ticket ID</small>
            <strong>#{ticket.ticketId}</strong>
          </div>

          <div>
            <small>Category ID</small>
            <strong>{ticket.categoryId}</strong>
          </div>

          <div>
            <small>Priority</small>
            <strong>{ticket.priority}</strong>
          </div>

          <div>
            <small>Assigned Staff</small>
            <strong>
              {ticket.assignedStaffId
                ? `Staff #${ticket.assignedStaffId}`
                : 'Not yet assigned'}
            </strong>
          </div>

          <div>
            <small>Date Created</small>
            <strong>
              {new Date(ticket.createdAt).toLocaleString()}
            </strong>
          </div>

          <div>
            <small>Resolved At</small>
            <strong>
              {ticket.resolvedAt
                ? new Date(
                    ticket.resolvedAt,
                  ).toLocaleString()
                : 'Not yet resolved'}
            </strong>
          </div>
        </div>

        <div className="ticket-description">
          <h3>Description</h3>
          <p>{ticket.description}</p>
        </div>
      </section>

      {isStaff && (
        <section className="content-card ticket-detail-card">
          <div className="card-heading">
            <h2>Update Ticket Status</h2>
          </div>

          <form
            className="dashboard-form"
            onSubmit={handleUpdate}
          >
            <label htmlFor="status">Status</label>

            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <label htmlFor="remarks">Remarks</label>

            <textarea
              id="remarks"
              rows={4}
              maxLength={255}
              placeholder="Enter an update about this concern..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />

            <button
              type="submit"
              className="action-button"
              disabled={saving}
            >
              <Save size={18} />
              {saving ? 'Updating...' : 'Update Status'}
            </button>
          </form>
        </section>
      )}

      <section className="content-card ticket-detail-card">
        <div className="card-heading">
          <h2>Ticket Status History</h2>
        </div>

        {history.length === 0 ? (
          <p className="empty-state">
            No status history available.
          </p>
        ) : (
          <div className="history-timeline">
            {[...history]
              .sort(
                (a, b) =>
                  new Date(a.changedAt).getTime() -
                  new Date(b.changedAt).getTime(),
              )
              .map((item) => (
                <div
                  className="history-item"
                  key={item.historyId}
                >
                  <div className="history-icon">
                    <Clock size={19} />
                  </div>

                  <div className="history-content">
                    <strong>
                      {item.previousStatus
                        ? `${item.previousStatus} → ${item.newStatus}`
                        : `Ticket created — ${item.newStatus}`}
                    </strong>

                    <p>
                      {item.remarks || 'No remarks provided.'}
                    </p>

                    <small>
                      {new Date(
                        item.changedAt,
                      ).toLocaleString()}
                    </small>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}