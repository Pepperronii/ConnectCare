import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { UserRound, Save } from 'lucide-react';
import axios from 'axios';

import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import type { CustomerProfile } from '../types/ticket';

export default function Profile() {
  const { user } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get<CustomerProfile>(
          '/customers/profile',
        );

        setPhoneNumber(response.data.phoneNumber);
        setServiceAddress(response.data.serviceAddress);
        setHasProfile(true);
      } catch (err) {
        if (
          axios.isAxiosError(err) &&
          err.response?.status === 404
        ) {
          setHasProfile(false);
        } else {
          setError('Unable to load customer profile.');
          setLoadFailed(true);
        }
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setSaving(true);

    const data = {
      phoneNumber: phoneNumber.trim(),
      serviceAddress: serviceAddress.trim(),
    };

    try {
      if (hasProfile) {
        await api.patch('/customers/profile', data);
        setSuccess('Profile updated successfully.');
      } else {
        await api.post('/customers/profile', data);
        setHasProfile(true);
        setSuccess('Profile created successfully.');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;

        setError(
          Array.isArray(message)
            ? message.join(', ')
            : message || 'Unable to save profile.',
        );
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1>My Profile</h1>
          <p>Manage your personal and service information.</p>
        </div>
      </div>

      <section className="content-card profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <UserRound size={32} />
          </div>

          <div>
            <h2>{user?.fullName}</h2>
            <p>{user?.role}</p>
          </div>
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        {success && (
          <div className="success-message">{success}</div>
        )}

        {loading ? (
          <p>Loading profile...</p>
        ) : (
          <form
            className="dashboard-form"
            onSubmit={handleSubmit}
          >
            <label>Full name</label>

            <input
              type="text"
              value={user?.fullName || ''}
              disabled
            />

            <label>Email address</label>

            <input
              type="email"
              value={user?.email || ''}
              disabled
            />

            <label htmlFor="phoneNumber">
              Phone number
            </label>

            <input
              id="phoneNumber"
              type="tel"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) =>
                setPhoneNumber(e.target.value)
              }
              maxLength={20}
              required
            />

            <label htmlFor="serviceAddress">
              Service address
            </label>

            <textarea
              id="serviceAddress"
              placeholder="Enter your service address"
              value={serviceAddress}
              onChange={(e) =>
                setServiceAddress(e.target.value)
              }
              rows={4}
              maxLength={255}
              required
            />

            <button
              type="submit"
              className="action-button"
              disabled={saving || loadFailed}
            >
              <Save size={18} />

              {saving
                ? 'Saving...'
                : hasProfile
                  ? 'Save Changes'
                  : 'Create Profile'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}