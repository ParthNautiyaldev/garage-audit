import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
    // Free-text notes can include insurance or personal details, so opening a
    // record is treated as sensitive access and written to the audit log.
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export const Customer = mongoose.model('Customer', customerSchema);

export const CUSTOMER_FIELDS = ['name', 'phone', 'email', 'address', 'notes'];

export function publicCustomer(customer, detailed) {
  const base = {
    id: customer._id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
  };
  if (!detailed) return base;
  return { ...base, address: customer.address, notes: customer.notes || '' };
}
