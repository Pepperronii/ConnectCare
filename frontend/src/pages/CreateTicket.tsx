import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import api from '../api/axios';
import type { TicketCategory } from '../types/ticket';

export default function CreateTicket() {
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Normal');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get<TicketCategory[]>(
          '/tickets/categories',
        );

        setCategories(response.data);
      } catch {
        setError('Unable to load ticket categories.');
      } finally {
        setLoading(false);
      }
    };

    void loadCategories();
  }, []);

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!categoryId || !subject.trim() || !description.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/tickets', {
        categoryId: Number(categoryId),
        subject: subject.trim(),
        description: description.trim(),
        priority,
      });

      setSuccess('Support ticket created successfully.');

      setCategoryId('');
      setSubject('');
      setDescription('');
      setPriority('Normal');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;

        setError(
          Array.isArray(message)
            ? message.join(', ')
            : message || 'Unable to create support ticket.',
        );
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1>Create Support Ticket</h1>
          <p>
            Submit your telecom concern to our support team.
          </p>
        </div>
      </div>

      <section className="content-card create-ticket-card">
        <div className="card-heading">
          <h2>Ticket Information</h2>

          <Link to="/dashboard" className="secondary-button">
            <ArrowLeft size={17} />
            Back
          </Link>
        </div>

        <p className="form-description">
          Please provide complete information about your concern
          so our support team can assist you.
        </p>

        {error && (
          <div className="error-message">{error}</div>
        )}

        {success && (
          <div className="success-message">{success}</div>
        )}

        <form
          className="dashboard-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="category">Category</label>

          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={loading || categories.length === 0}
            required
          >
            <option value="">
              {loading
                ? 'Loading categories...'
                : 'Select a category'}
            </option>

            {categories.map((category) => (
              <option
                key={category.categoryId}
                value={category.categoryId}
              >
                {category.categoryName}
              </option>
            ))}
          </select>

          <label htmlFor="subject">Subject</label>

          <input
            id="subject"
            type="text"
            placeholder="Enter a short title for your concern"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={150}
            required
          />

          <label htmlFor="description">Description</label>

          <textarea
            id="description"
            placeholder="Describe the problem you are experiencing..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            maxLength={10000}
            aria-describedby="description-length"
            required
          />

          <p id="description-length" className="form-description">
            {description.length.toLocaleString()} / 10,000 characters
          </p>

          <label htmlFor="priority">Priority</label>

          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            required
          >
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
          </select>

          <div className="ticket-notice">
            Your ticket will be marked as Pending until
            it is reviewed by our support team.
          </div>

          <button
            type="submit"
            className="action-button"
            disabled={
              submitting ||
              loading ||
              categories.length === 0
            }
          >
            <Send size={18} />

            {submitting
              ? 'Submitting...'
              : 'Submit Ticket'}
          </button>
        </form>
      </section>
    </div>
  );
}