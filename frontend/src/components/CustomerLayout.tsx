import { NavLink, Outlet, Navigate } from 'react-router-dom';
import {
  Headset,
  House,
  Ticket,
  UserRound,
  LogOut,
  PlusCircle,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function CustomerLayout() {
  const { user, logout } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="customer-layout">
      <header className="customer-header">
        <div className="customer-header-inner">

          <NavLink to="/dashboard" className="customer-brand">
            <Headset size={30} />
            <span>ConnectCare</span>
          </NavLink>

          <nav className="customer-nav">
            <NavLink to="/dashboard">
              <House size={18} />
              Home
            </NavLink>

            <NavLink to="/tickets" end>
              <Ticket size={18} />
              My Tickets
            </NavLink>

            <NavLink to="/profile">
              <UserRound size={18} />
              My Profile
            </NavLink>
          </nav>

          <div className="customer-account">
            <span>{user.fullName}</span>

            <button onClick={logout} title="Logout">
              <LogOut size={19} />
            </button>
          </div>

        </div>
      </header>

      <main className="customer-main">

        <section className="customer-welcome">
          <div>
            <p>CONNECTCARE CUSTOMER SUPPORT</p>

            <h1>How can we help you?</h1>

            <span>
              Report a concern, track your support tickets,
              and manage your account.
            </span>
          </div>

          <NavLink
            to="/tickets/create"
            className="customer-create-button"
          >
            <PlusCircle size={20} />
            Create Support Ticket
          </NavLink>
        </section>

        <Outlet />

      </main>

      <footer className="customer-footer">
        ConnectCare — Telecom Support System
      </footer>
    </div>
  );
}