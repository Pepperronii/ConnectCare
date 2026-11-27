import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, RefreshCw } from 'lucide-react';

import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import type { Ticket } from '../types/ticket';

export default function Tickets() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTickets = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get<Ticket[]>('/tickets');
      setTickets(response.data);
    } catch {
      setError('Unable to load support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const start = window.setTimeout(loadTickets, 0);
    return () => window.clearTimeout(start);
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      ticket.subject.toLowerCase().includes(keyword) ||
      String(ticket.ticketId).includes(keyword) ||
      ticket.description.toLowerCase().includes(keyword);

    const matchesStatus =
      statusFilter === 'All' ||
      ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1>Support Tickets</h1>
          <p>View and manage telecom support requests.</p>
        </div>

        {user?.role === 'Customer' && (
          <Link
            to="/tickets/create"
            className="action-button"
          >
            <Plus size={18} />
            New Ticket
          </Link>
        )}
      </div>

      <section className="content-card">
        <div className="card-heading">
          <h2>Ticket List</h2>

          <button
            className="secondary-button"
            onClick={loadTickets}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="ticket-toolbar">
          <div className="ticket-search">
            <Search size={19} />

            <input
              type="search"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search tickets"
            />
          </div>

          <select
            className="ticket-filter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            aria-label="Filter by status"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        {loading ? (
          <p className="empty-state">Loading tickets...</p>
        ) : error ? (
          <p className="empty-state">
            Ticket information is unavailable.
          </p>
        ) : filteredTickets.length === 0 ? (
          <p className="empty-state">
            No support tickets found.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.ticketId}>
                    <td>#{ticket.ticketId}</td>

                    <td>{ticket.subject}</td>

                    <td>
                      <span
                        className={`priority-badge ${ticket.priority.toLowerCase()}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${ticket.status
                          .toLowerCase()
                          .replaceAll(' ', '-')}`}
                      >
                        {ticket.status}
                      </span>
                    </td>

                    <td>
                      {new Date(
                        ticket.createdAt,
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      <Link
                        to={`/tickets/${ticket.ticketId}`}
                        className="view-button"
                      >
                        <Eye size={16} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <p className="table-summary">
            Showing {filteredTickets.length} of{' '}
            {tickets.length} tickets
          </p>
        )}
      </section>
    </div>
  );
}