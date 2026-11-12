// Shared vocabulary for roles, repair states, and audit actions.
// The client keeps a matching copy in client/src/constants.js for labels.

export const ROLES = ['admin', 'manager', 'technician'];

export const REPAIR_STATUSES = [
  'received',
  'diagnosing',
  'in_progress',
  'waiting_parts',
  'ready',
  'completed',
  'cancelled',
];

export const ACTIONS = [
  'AUTH_LOGIN',
  'AUTH_LOGOUT',
  'AUTH_LOGIN_FAILED',
  'USER_ROLE_CHANGE',
  'CUSTOMER_CREATE',
  'CUSTOMER_UPDATE',
  'CUSTOMER_DELETE',
  'CUSTOMER_SENSITIVE_ACCESS',
  'VEHICLE_CREATE',
  'VEHICLE_UPDATE',
  'VEHICLE_DELETE',
  'REPAIR_CREATE',
  'REPAIR_UPDATE',
  'REPAIR_DELETE',
  'REPAIR_STATUS_CHANGE',
];

// A burst of this many failed logins inside the window is treated as an anomaly.
export const FAILED_LOGIN_THRESHOLD = 3;
export const FAILED_LOGIN_WINDOW_MINUTES = 15;
