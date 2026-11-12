import { Vehicle, VEHICLE_FIELDS, publicVehicle } from '../models/Vehicle.js';
import { Customer } from '../models/Customer.js';
import { RepairOrder } from '../models/RepairOrder.js';
import { recordAudit } from '../services/auditService.js';
import { HttpError, asyncHandler, changedFields } from '../utils/http.js';

function readBody(body) {
  return {
    customer: body.customerId,
    year: Number(body.year),
    make: String(body.make || '').trim(),
    model: String(body.model || '').trim(),
    plate: String(body.plate || '').trim().toUpperCase(),
    vin: String(body.vin || '').trim().toUpperCase(),
  };
}

async function assertVehicle(input) {
  if (!input.customer || !input.make || !input.model || !input.plate) {
    throw new HttpError(400, 'Customer, make, model, and plate are required');
  }
  if (!Number.isInteger(input.year) || input.year < 1980 || input.year > 2030) {
    throw new HttpError(400, 'Year must be between 1980 and 2030');
  }
  const customer = await Customer.findById(input.customer);
  if (!customer) throw new HttpError(400, 'Customer not found');
}

export const listVehicles = asyncHandler(async (_req, res) => {
  const vehicles = await Vehicle.find().populate('customer', 'name').sort({ plate: 1 });
  res.json({ vehicles: vehicles.map(publicVehicle) });
});

export const createVehicle = asyncHandler(async (req, res) => {
  const input = readBody(req.body);
  await assertVehicle(input);
  const vehicle = await Vehicle.create(input);
  const populated = await vehicle.populate('customer', 'name');
  await recordAudit(req, {
    action: 'VEHICLE_CREATE',
    resourceType: 'vehicle',
    resourceId: vehicle._id,
    status: 'success',
    newValue: { plate: vehicle.plate, make: vehicle.make, model: vehicle.model, year: vehicle.year },
  });
  res.status(201).json({ vehicle: publicVehicle(populated) });
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const existing = await Vehicle.findById(req.params.id);
  if (!existing) throw new HttpError(404, 'Vehicle not found');
  const input = readBody(req.body);
  await assertVehicle(input);
  const before = {
    year: existing.year,
    make: existing.make,
    model: existing.model,
    plate: existing.plate,
    vin: existing.vin,
    customer: String(existing.customer),
  };
  Object.assign(existing, input);
  const after = { ...existing.toObject(), customer: String(existing.customer) };
  const diff = changedFields(before, after, [...VEHICLE_FIELDS, 'customer']);
  await existing.save();
  if (diff.changed) {
    await recordAudit(req, {
      action: 'VEHICLE_UPDATE',
      resourceType: 'vehicle',
      resourceId: existing._id,
      status: 'success',
      oldValue: diff.oldValue,
      newValue: diff.newValue,
    });
  }
  const populated = await existing.populate('customer', 'name');
  res.json({ vehicle: publicVehicle(populated) });
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const existing = await Vehicle.findById(req.params.id);
  if (!existing) throw new HttpError(404, 'Vehicle not found');
  const repairs = await RepairOrder.countDocuments({
    vehicle: existing._id,
    status: { $nin: ['completed', 'cancelled'] },
  });
  if (repairs > 0) {
    throw new HttpError(400, 'Finish or cancel open repairs before deleting this vehicle');
  }
  await existing.deleteOne();
  await recordAudit(req, {
    action: 'VEHICLE_DELETE',
    resourceType: 'vehicle',
    resourceId: existing._id,
    status: 'success',
    oldValue: { plate: existing.plate, make: existing.make, model: existing.model },
  });
  res.json({ ok: true });
});
