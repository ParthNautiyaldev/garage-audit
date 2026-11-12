import bcrypt from 'bcryptjs';
import { connectDb } from '../config/db.js';
import { User } from '../models/User.js';
import { Customer } from '../models/Customer.js';
import { Vehicle } from '../models/Vehicle.js';
import { RepairOrder } from '../models/RepairOrder.js';
import { AuditLog } from '../models/AuditLog.js';
import mongoose from 'mongoose';

// Replaces shop data with a small demo set, including a failed-login burst
// so the anomaly highlight is visible the first time the dashboard opens.

const ACCOUNTS = [
  ['Avery Quinn', 'admin@northline.shop', 'Admin123!', 'admin'],
  ['Jordan Hale', 'manager@northline.shop', 'Manager123!', 'manager'],
  ['Sam Rivera', 'sam@northline.shop', 'Tech123!', 'technician'],
  ['Riley Cho', 'riley@northline.shop', 'Tech123!', 'technician'],
];

await connectDb();

await Promise.all([
  User.deleteMany({}),
  Customer.deleteMany({}),
  Vehicle.deleteMany({}),
  RepairOrder.deleteMany({}),
  AuditLog.deleteMany({}),
]);

const users = {};
for (const [name, email, password, role] of ACCOUNTS) {
  users[role === 'technician' ? email : role] = await User.create({
    name,
    email,
    role,
    passwordHash: await bcrypt.hash(password, 10),
  });
}
const admin = users.admin;
const manager = users.manager;
const sam = users['sam@northline.shop'];
const riley = users['riley@northline.shop'];

const maya = await Customer.create({
  name: 'Maya Chen',
  phone: '555-0142',
  email: 'maya.chen@example.com',
  address: '418 Market Street',
  notes: 'Prefers text updates after 5pm.',
});
const luis = await Customer.create({
  name: 'Luis Ortega',
  phone: '555-0190',
  email: 'luis.ortega@example.com',
  address: '22 Bay Road',
  notes: 'Fleet account. Bill the shop card on file.',
});
const priya = await Customer.create({
  name: 'Priya Shah',
  phone: '555-0177',
  email: 'priya.shah@example.com',
  address: '9 Cedar Lane',
  notes: 'Insurance claim 4412 is waiting on approval. Do not discuss the estimate at the counter.',
});
const owen = await Customer.create({
  name: 'Owen Blake',
  phone: '555-0118',
  email: 'owen.blake@example.com',
  address: '77 West Avenue',
  notes: '',
});

const civic = await Vehicle.create({ customer: maya._id, year: 2018, make: 'Honda', model: 'Civic', plate: 'NL-1842', vin: '1HGCIVIC184200001' });
const transit = await Vehicle.create({ customer: luis._id, year: 2021, make: 'Ford', model: 'Transit', plate: 'NL-2201', vin: '1FTTRANSIT2201001' });
const camry = await Vehicle.create({ customer: luis._id, year: 2016, make: 'Toyota', model: 'Camry', plate: 'NL-2202', vin: '4T1CAMRY220200002' });
const outback = await Vehicle.create({ customer: priya._id, year: 2020, make: 'Subaru', model: 'Outback', plate: 'NL-3090', vin: '4S3OUTBACK3090003' });
const wrangler = await Vehicle.create({ customer: owen._id, year: 2014, make: 'Jeep', model: 'Wrangler', plate: 'NL-1188', vin: '1C4WRANGLER118804' });

await RepairOrder.create([
  { vehicle: civic._id, customer: maya._id, title: 'Front brake job', description: 'Pulsing pedal. Replace pads and rotors.', status: 'in_progress', assignedTo: sam._id, laborCost: 180, partsCost: 240 },
  { vehicle: transit._id, customer: luis._id, title: 'Oil leak diagnosis', description: 'Spotting under the van after highway trips.', status: 'diagnosing', assignedTo: riley._id, laborCost: 95, partsCost: 0 },
  { vehicle: camry._id, customer: luis._id, title: 'Starter replacement', description: 'Intermittent no-crank. Starter is on order.', status: 'waiting_parts', assignedTo: sam._id, laborCost: 160, partsCost: 210 },
  { vehicle: outback._id, customer: priya._id, title: 'Rear bumper repair', description: 'Insurance estimate. Hold work until approval.', status: 'received', assignedTo: riley._id, laborCost: 0, partsCost: 0 },
  { vehicle: wrangler._id, customer: owen._id, title: 'Alignment and tire rotation', description: 'Customer reports a pull to the right.', status: 'ready', assignedTo: sam._id, laborCost: 120, partsCost: 0 },
]);

const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60 * 1000);
const failed = (minutes) => ({
  userId: admin._id,
  userName: admin.name,
  userRole: 'admin',
  action: 'AUTH_LOGIN_FAILED',
  resourceType: 'auth',
  resourceId: admin._id.toString(),
  ip: '198.51.100.23',
  userAgent: 'Mozilla/5.0 (demo seed)',
  oldValue: null,
  newValue: { email: admin.email },
  status: 'failed',
  failureReason: 'Invalid password',
  createdAt: minutesAgo(minutes),
  updatedAt: minutesAgo(minutes),
});

await AuditLog.collection.insertMany([
  {
    userId: null,
    userName: 'nobody@example.com',
    userRole: null,
    action: 'AUTH_LOGIN_FAILED',
    resourceType: 'auth',
    resourceId: null,
    ip: '203.0.113.50',
    userAgent: 'Mozilla/5.0 (demo seed)',
    oldValue: null,
    newValue: { email: 'nobody@example.com' },
    status: 'failed',
    failureReason: 'Unknown email',
    createdAt: minutesAgo(60 * 26),
    updatedAt: minutesAgo(60 * 26),
  },
  failed(8),
  failed(6),
  failed(4),
  failed(2),
  {
    userId: admin._id,
    userName: admin.name,
    userRole: 'admin',
    action: 'AUTH_LOGIN',
    resourceType: 'auth',
    resourceId: admin._id.toString(),
    ip: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (demo seed)',
    oldValue: null,
    newValue: null,
    status: 'success',
    failureReason: null,
    createdAt: minutesAgo(50),
    updatedAt: minutesAgo(50),
  },
  {
    userId: manager._id,
    userName: manager.name,
    userRole: 'manager',
    action: 'CUSTOMER_SENSITIVE_ACCESS',
    resourceType: 'customer',
    resourceId: priya._id.toString(),
    ip: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (demo seed)',
    oldValue: null,
    newValue: { customer: priya.name, revealed: ['email', 'phone', 'address', 'notes'] },
    status: 'success',
    failureReason: null,
    createdAt: minutesAgo(35),
    updatedAt: minutesAgo(35),
  },
  {
    userId: sam._id,
    userName: sam.name,
    userRole: 'technician',
    action: 'REPAIR_STATUS_CHANGE',
    resourceType: 'repair',
    resourceId: null,
    ip: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (demo seed)',
    oldValue: { status: 'diagnosing', title: 'Front brake job' },
    newValue: { status: 'in_progress', title: 'Front brake job' },
    status: 'success',
    failureReason: null,
    createdAt: minutesAgo(20),
    updatedAt: minutesAgo(20),
  },
]);

console.log('Seed complete. Demo accounts:');
for (const [, email, password, role] of ACCOUNTS) {
  console.log(`  ${role.padEnd(11)} ${email.padEnd(28)} ${password}`);
}

await mongoose.disconnect();
