import { useEffect, useState } from 'react';
import { Search, RefreshCw, Users } from 'lucide-react';

import api from '../api/axios';
import type { CustomerProfile } from '../types/ticket';

interface CustomerRecord extends CustomerProfile {
  user?: {
    userId: number;
    fullName: string;
    email: string;
  };
}

export default function Customers() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCustomers = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get<CustomerRecord[]>('/customers');
      setCustomers(response.data);
    } catch {
      setError('Unable to load customer records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const start = window.setTimeout(loadCustomers, 0);
    return () => window.clearTimeout(start);
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const keyword = search.trim().toLowerCase();

    return [
      customer.customerId,
      customer.user?.fullName,
      customer.user?.email,
      customer.phoneNumber,
      customer.serviceAddress,
    ].some((value) =>
      String(value ?? '').toLowerCase().includes(keyword),
    );
  });

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1>Customers</h1>
          <p>View registered customer profiles and service information.</p>
        </div>
      </div>

      <div className="customer-summary">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Users size={24} />
          </div>

          <div>
            <p>Total Customer Profiles</p>
            <h2>{loading || error ? '—' : customers.length}</h2>
          </div>
        </div>
      </div>

      <section className="content-card">
        <div className="card-heading">
          <h2>Customer List</h2>

          <button
            className="secondary-button"
            onClick={loadCustomers}
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
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search customers"
            />
          </div>
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        {loading ? (
          <p className="empty-state">Loading customers...</p>
        ) : error ? (
          <p className="empty-state">
            Customer information is unavailable.
          </p>
        ) : filteredCustomers.length === 0 ? (
          <p className="empty-state">No customers found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th>Service Address</th>
                  <th>Registered Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.customerId}>
                    <td>#{customer.customerId}</td>

                    <td>
                      {customer.user?.fullName || 'Unavailable'}
                    </td>

                    <td>
                      {customer.user?.email || 'Unavailable'}
                    </td>

                    <td>{customer.phoneNumber}</td>

                    <td>{customer.serviceAddress}</td>

                    <td>
                      {new Date(
                        customer.createdAt,
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <p className="table-summary">
            Showing {filteredCustomers.length} of{' '}
            {customers.length} customers
          </p>
        )}
      </section>
    </div>
  );
}