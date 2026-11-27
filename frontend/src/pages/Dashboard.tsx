import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket as TicketIcon,
  Clock,
  LoaderCircle,
  CheckCircle,
  Plus,
} from 'lucide-react';

import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import type { Ticket } from '../types/ticket';

export default function Dashboard() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const response = await api.get<Ticket[]>('/tickets');
        setTickets(response.data);
      } catch {
        setError('Unable to load support tickets.');
      } finally {
        setLoading(false);
      }
    };

    void loadTickets();
  }, []);

  const statistics = [
    {
      label: 'Total Tickets',
      value: tickets.length,
      icon: TicketIcon,
      color: 'blue',
    },
    {
      label: 'Pending',
      value: tickets.filter(
        (ticket) => ticket.status === 'Pending',
      ).length,
      icon: Clock,
      color: 'orange',
    },
    {
      label: 'In Progress',
      value: tickets.filter(
        (ticket) => ticket.status === 'In Progress',
      ).length,
      icon: LoaderCircle,
      color: 'cyan',
    },
    {
      label: 'Resolved',
      value: tickets.filter(
        (ticket) => ticket.status === 'Resolved',
      ).length,
      icon: CheckCircle,
      color: 'green',
    },
  ];

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1>Welcome, {user?.fullName}!</h1>
          <p>
            Manage and track telecom support requests.
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="stats-grid">
        {statistics.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className={`stat-icon ${stat.color}`}>
              <stat.icon size={24} />
            </div>

            <p>{stat.label}</p>
            <h2>
              {loading || error ? '—' : stat.value}
            </h2>
          </div>
        ))}
      </div>

      <section className="content-card">
        <div className="card-heading">
          <h2>Recent Support Tickets</h2>

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

        {loading ? (
          <p className="empty-state">Loading tickets...</p>
        ) : error ? (
          <p className="empty-state">
            Ticket information is unavailable.
          </p>
        ) : tickets.length === 0 ? (
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
                </tr>
              </thead>

              <tbody>
                {tickets.slice(0, 5).map((ticket) => (
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