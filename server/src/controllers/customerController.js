import { Customer, CUSTOMER_FIELDS, publicCustomer } from '../models/Customer.js';
import { Vehicle } from '../models/Vehicle.js';
import { recordAudit } from '../services/auditService.js';
import { HttpError, asyncHandler, changedFields, escapeRegex } from '../utils/http.js';

function readBody(body) {
  return {
    name: String(body.name || '').trim(),
    phone: String(body.phone || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    address: String(body.address || '').trim(),
    notes: String(body.notes || '').trim(),
  };
}

function assertCustomer(input) {
  if (!input.name || !input.phone || !input.email || !input.address) {
    throw new HttpError(400, 'Name, phone, email, and address are required');
  }
}

export const listCustomers = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const filter = q
    ? { name: new RegExp(escapeRegex(q), 'i') }
    : {};
  const customers = await Customer.find(filter).sort({ name: 1 }).lean();
  const counts = await Vehicle.aggregate([
    { $group: { _id: '$customer', count: { $sum: 1 } } },
  ]);
  const byCustomer = new Map(counts.map((row) => [String(row._id), row.count]));
  res.json({
    customers: customers.map((customer) => ({
      ...publicCustomer(customer, false),
      vehicleCount: byCustomer.get(String(customer._id)) || 0,
    })),
  });
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).lean();
  if (!customer) throw new HttpError(404, 'Customer not found');

  // Record that the record was opened. Store field names, not a second copy of the notes.
  await recordAudit(req, {
    action: 'CUSTOMER_SENSITIVE_ACCESS',
    resourceType: 'customer',
    resourceId: customer._id,
    status: 'success',
    newValue: { customer: customer.name, revealed: ['email', 'phone', 'address', 'notes'] },
  });
  res.json({ customer: publicCustomer(customer, true) });
});

export const createCustomer = asyncHandler(async (req, res) => {
  const input = readBody(req.body);
  assertCustomer(input);
  const customer = await Customer.create(input);
  await recordAudit(req, {
    action: 'CUSTOMER_CREATE',
    resourceType: 'customer',
    resourceId: customer._id,
    status: 'success',
    newValue: { name: customer.name, phone: customer.phone, email: customer.email },
  });
  res.status(201).json({ customer: publicCustomer(customer, true) });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const existing = await Customer.findById(req.params.id);
  if (!existing) throw new HttpError(404, 'Customer not found');
  const input = readBody(req.body);
  assertCustomer(input);
  const before = Object.fromEntries(CUSTOMER_FIELDS.map((key) => [key, existing[key]]));
  Object.assign(existing, input);
  const diff = changedFields(before, existing.toObject(), CUSTOMER_FIELDS);
  await existing.save();
  if (diff.changed) {
    await recordAudit(req, {
      action: 'CUSTOMER_UPDATE',
      resourceType: 'customer',
      resourceId: existing._id,
      status: 'success',
      oldValue: diff.oldValue,
      newValue: diff.newValue,
    });
  }
  res.json({ customer: publicCustomer(existing, true) });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const existing = await Customer.findById(req.params.id);
  if (!existing) throw new HttpError(404, 'Customer not found');
  const vehicles = await Vehicle.countDocuments({ customer: existing._id });
  if (vehicles > 0) {
    throw new HttpError(400, 'Remove this customer’s vehicles before deleting the customer');
  }
  await existing.deleteOne();
  await recordAudit(req, {
    action: 'CUSTOMER_DELETE',
    resourceType: 'customer',
    resourceId: existing._id,
    status: 'success',
    oldValue: { name: existing.name, email: existing.email },
  });
  res.json({ ok: true });
});
