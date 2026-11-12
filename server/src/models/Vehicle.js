import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    year: { type: Number, required: true, min: 1980, max: 2030 },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    plate: { type: String, required: true, unique: true, uppercase: true, trim: true },
    vin: { type: String, default: '', trim: true, uppercase: true },
  },
  { timestamps: true },
);

export const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export const VEHICLE_FIELDS = ['year', 'make', 'model', 'plate', 'vin'];

export function publicVehicle(vehicle) {
  const customer = vehicle.customer;
  return {
    id: vehicle._id,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    plate: vehicle.plate,
    vin: vehicle.vin || '',
    customerId: customer?._id || customer,
    customerName: customer?.name || '',
    label: `${vehicle.year} ${vehicle.make} ${vehicle.model} · ${vehicle.plate}`,
  };
}
