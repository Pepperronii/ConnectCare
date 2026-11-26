export interface Ticket {
  ticketId: number;
  customerId: number;
  categoryId: number;
  assignedStaffId: number | null;
  subject: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  priority: 'Low' | 'Normal' | 'High';
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface TicketCategory {
  categoryId: number;
  categoryName: string;
  description: string | null;
}

export interface TicketHistory {
  historyId: number;
  ticketId: number;
  updatedByUserId: number;
  previousStatus: string | null;
  newStatus: string;
  remarks: string | null;
  changedAt: string;
}

export interface CustomerProfile {
  customerId: number;
  userId: number;
  phoneNumber: string;
  serviceAddress: string;
  createdAt: string;
}