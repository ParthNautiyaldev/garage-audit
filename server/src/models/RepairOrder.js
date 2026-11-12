import mongoose from 'mongoose';
import { REPAIR_STATUSES } from '../constants.js';

const repairSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    status: { type: String, enum: REPAIR_STATUSES, default: 'received' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    laborCost: { type: Number, default: 0, min: 0 },
    partsCost: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

export const RepairOrder = mongoose.model('RepairOrder', repairSchema);

export const REPAIR_EDIT_FIELDS = ['title', 'description', 'laborCost', 'partsCost', 'assignedTo'];

export function publicRepair(repair) {
  const vehicle = repair.vehicle;
  const customer = repair.customer;
  const assignee = repair.assignedTo;
  return {
    id: repair._id,
    title: repair.title,
    description: repair.description || '',
    status: repair.status,
    laborCost: repair.laborCost,
    partsCost: repair.partsCost,
    vehicleId: vehicle?._id || vehicle,
    vehicleLabel: vehicle?.plate
      ? `${vehicle.year} ${vehicle.make} ${vehicle.model} · ${vehicle.plate}`
      : '',
    customerId: customer?._id || customer,
    customerName: customer?.name || '',
    assignedToId: assignee?._id || assignee || null,
    assignedToName: assignee?.name || 'Unassigned',
    updatedAt: repair.updatedAt,
  };
}
