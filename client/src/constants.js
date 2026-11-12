export const REPAIR_STATUSES = [
  'received',
  'diagnosing',
  'in_progress',
  'waiting_parts',
  'ready',
  'completed',
  'cancelled',
];

export const STATUS_LABEL = {
  received: 'Received',
  diagnosing: 'Diagnosing',
  in_progress: 'In progress',
  waiting_parts: 'Waiting on parts',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const ACTION_LABEL = {
  AUTH_LOGIN: 'Login',
  AUTH_LOGOUT: 'Logout',
  AUTH_LOGIN_FAILED: 'Failed login',
  USER_ROLE_CHANGE: 'Role change',
  CUSTOMER_CREATE: 'Customer created',
  CUSTOMER_UPDATE: 'Customer updated',
  CUSTOMER_DELETE: 'Customer deleted',
  CUSTOMER_SENSITIVE_ACCESS: 'Sensitive customer access',
  VEHICLE_CREATE: 'Vehicle created',
  VEHICLE_UPDATE: 'Vehicle updated',
  VEHICLE_DELETE: 'Vehicle deleted',
  REPAIR_CREATE: 'Repair created',
  REPAIR_UPDATE: 'Repair updated',
  REPAIR_DELETE: 'Repair deleted',
  REPAIR_STATUS_CHANGE: 'Repair status change',
};

export function actionLabel(action) {
  return ACTION_LABEL[action] || action;
}

export function formatWhen(value) {
  if (!value) return '';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
