import { RepairOrder, publicRepair } from '../models/RepairOrder.js';
import { Vehicle } from '../models/Vehicle.js';
import { User } from '../models/User.js';
import { REPAIR_STATUSES } from '../constants.js';
import { recordAudit } from '../services/auditService.js';
import { HttpError, asyncHandler, changedFields } from '../utils/http.js';

function snapshot(repair) {
  return {
    title: repair.title,
    description: repair.description || '',
    laborCost: repair.laborCost,
    partsCost: repair.partsCost,
    assignedTo: repair.assignedTo ? String(repair.assignedTo) : null,
  };
}

async function load(id) {
  return RepairOrder.findById(id)
    .populate('vehicle', 'year make model plate')
    .populate('customer', 'name')
    .populate('assignedTo', 'name role');
}

export const listRepairs = asyncHandler(async (_req, res) => {
  const repairs = await RepairOrder.find()
    .populate('vehicle', 'year make model plate')
    .populate('customer', 'name')
    .populate('assignedTo', 'name role')
    .sort({ updatedAt: -1 });
  res.json({ repairs: repairs.map(publicRepair) });
});

export const createRepair = asyncHandler(async (req, res) => {
  const title = String(req.body.title || '').trim();
  const vehicle = await Vehicle.findById(req.body.vehicleId);
  if (!title || !vehicle) throw new HttpError(400, 'Title and vehicle are required');

  const status = req.body.status || 'received';
  if (!REPAIR_STATUSES.includes(status)) throw new HttpError(400, 'Invalid status');

  let assignedTo = req.body.assignedToId || null;
  if (assignedTo) {
    const assignee = await User.findById(assignedTo);
    if (!assignee) throw new HttpError(400, 'Assignee not found');
  }

  const repair = await RepairOrder.create({
    vehicle: vehicle._id,
    customer: vehicle.customer,
    title,
    description: String(req.body.description || '').trim(),
    status,
    assignedTo,
    laborCost: Number(req.body.laborCost || 0),
    partsCost: Number(req.body.partsCost || 0),
  });

  await recordAudit(req, {
    action: 'REPAIR_CREATE',
    resourceType: 'repair',
    resourceId: repair._id,
    status: 'success',
    newValue: { title, status, vehicle: vehicle.plate },
  });

  res.status(201).json({ repair: publicRepair(await load(repair._id)) });
});

export const updateRepair = asyncHandler(async (req, res) => {
  const repair = await RepairOrder.findById(req.params.id);
  if (!repair) throw new HttpError(404, 'Repair not found');

  const before = snapshot(repair);
  repair.title = String(req.body.title || '').trim();
  repair.description = String(req.body.description || '').trim();
  repair.laborCost = Number(req.body.laborCost || 0);
  repair.partsCost = Number(req.body.partsCost || 0);
  if (!repair.title) throw new HttpError(400, 'Title is required');
  if (repair.laborCost < 0 || repair.partsCost < 0) throw new HttpError(400, 'Costs cannot be negative');

  const assignedTo = req.body.assignedToId || null;
  if (assignedTo) {
    const assignee = await User.findById(assignedTo);
    if (!assignee) throw new HttpError(400, 'Assignee not found');
  }
  repair.assignedTo = assignedTo;

  const diff = changedFields(before, snapshot(repair), Object.keys(before));
  await repair.save();
  if (diff.changed) {
    await recordAudit(req, {
      action: 'REPAIR_UPDATE',
      resourceType: 'repair',
      resourceId: repair._id,
      status: 'success',
      oldValue: diff.oldValue,
      newValue: diff.newValue,
    });
  }
  res.json({ repair: publicRepair(await load(repair._id)) });
});

export const changeStatus = asyncHandler(async (req, res) => {
  const repair = await RepairOrder.findById(req.params.id).populate('vehicle', 'plate');
  if (!repair) throw new HttpError(404, 'Repair not found');
  const next = String(req.body.status || '');
  if (!REPAIR_STATUSES.includes(next)) throw new HttpError(400, 'Invalid status');

  const assignedToMe = repair.assignedTo && String(repair.assignedTo) === String(req.user._id);
  if (req.user.role === 'technician' && !assignedToMe) {
    await recordAudit(req, {
      action: 'REPAIR_STATUS_CHANGE',
      resourceType: 'repair',
      resourceId: repair._id,
      status: 'failed',
      failureReason: 'Technician tried to update a repair that is not assigned to them',
      oldValue: { status: repair.status, title: repair.title },
      newValue: { status: next },
    });
    throw new HttpError(403, 'You can only update repairs assigned to you. This attempt was logged.');
  }

  if (repair.status === next) {
    return res.json({ repair: publicRepair(await load(repair._id)) });
  }

  const previous = repair.status;
  repair.status = next;
  await repair.save();
  await recordAudit(req, {
    action: 'REPAIR_STATUS_CHANGE',
    resourceType: 'repair',
    resourceId: repair._id,
    status: 'success',
    oldValue: { status: previous, title: repair.title },
    newValue: { status: next, title: repair.title },
  });
  res.json({ repair: publicRepair(await load(repair._id)) });
});

export const deleteRepair = asyncHandler(async (req, res) => {
  const repair = await RepairOrder.findById(req.params.id);
  if (!repair) throw new HttpError(404, 'Repair not found');
  await repair.deleteOne();
  await recordAudit(req, {
    action: 'REPAIR_DELETE',
    resourceType: 'repair',
    resourceId: repair._id,
    status: 'success',
    oldValue: { title: repair.title, status: repair.status },
  });
  res.json({ ok: true });
});
