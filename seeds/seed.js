require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Route = require('../models/Route');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sandip-bus-tracker';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Bus.deleteMany({}),
      Route.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // Create Routes (Nashik area)
    const routes = await Route.insertMany([
      {
        name: 'Route A — Nashik Road → Sandip College',
        startPoint: { name: 'Nashik Road Station', lat: 19.9873, lng: 73.7956 },
        endPoint: { name: 'Sandip College, Trimbak Road', lat: 20.0432, lng: 73.7855 },
        stops: [
          { name: 'Nashik Road Station', lat: 19.9873, lng: 73.7956, order: 1 },
          { name: 'Dwarka Circle', lat: 19.9975, lng: 73.7912, order: 2 },
          { name: 'CBS (Central Bus Stand)', lat: 20.0004, lng: 73.7822, order: 3 },
          { name: 'Panchavati', lat: 20.0124, lng: 73.7811, order: 4 },
          { name: 'Makhmalabad', lat: 20.0289, lng: 73.7845, order: 5 },
          { name: 'Sandip College', lat: 20.0432, lng: 73.7855, order: 6 }
        ]
      },
      {
        name: 'Route B — Gangapur → Sandip College',
        startPoint: { name: 'Gangapur Road', lat: 20.0050, lng: 73.7633 },
        endPoint: { name: 'Sandip College, Trimbak Road', lat: 20.0432, lng: 73.7855 },
        stops: [
          { name: 'Gangapur Road', lat: 20.0050, lng: 73.7633, order: 1 },
          { name: 'College Road', lat: 20.0098, lng: 73.7756, order: 2 },
          { name: 'Sharanpur Road', lat: 20.0145, lng: 73.7834, order: 3 },
          { name: 'Indira Nagar', lat: 20.0234, lng: 73.7867, order: 4 },
          { name: 'Sandip College', lat: 20.0432, lng: 73.7855, order: 5 }
        ]
      },
      {
        name: 'Route C — CIDCO → Sandip College',
        startPoint: { name: 'CIDCO Colony', lat: 19.9756, lng: 73.7589 },
        endPoint: { name: 'Sandip College, Trimbak Road', lat: 20.0432, lng: 73.7855 },
        stops: [
          { name: 'CIDCO Colony', lat: 19.9756, lng: 73.7589, order: 1 },
          { name: 'Pathardi Phata', lat: 19.9834, lng: 73.7701, order: 2 },
          { name: 'Satpur MIDC', lat: 19.9945, lng: 73.7789, order: 3 },
          { name: 'Ambad Link Road', lat: 20.0123, lng: 73.7812, order: 4 },
          { name: 'Sandip College', lat: 20.0432, lng: 73.7855, order: 5 }
        ]
      }
    ]);
    console.log(`✅ Created ${routes.length} routes`);

    // Create Admin
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@sandip.edu',
      password: 'admin123',
      role: 'admin',
      phone: '9876543210'
    });
    console.log('✅ Admin created: admin@sandip.edu / admin123');

    // Create Drivers
    const drivers = await Promise.all([
      User.create({
        name: 'Rajesh Kumar',
        email: 'rajesh@sandip.edu',
        password: 'driver123',
        role: 'driver',
        phone: '9876543211'
      }),
      User.create({
        name: 'Sunil Patil',
        email: 'sunil@sandip.edu',
        password: 'driver123',
        role: 'driver',
        phone: '9876543212'
      }),
      User.create({
        name: 'Amit Sharma',
        email: 'amit@sandip.edu',
        password: 'driver123',
        role: 'driver',
        phone: '9876543213'
      })
    ]);
    console.log(`✅ Created ${drivers.length} drivers`);

    // Create Buses
    const buses = await Promise.all([
      Bus.create({
        busNumber: 'BUS-01',
        licensePlate: 'MH-15-AB-1234',
        capacity: 50,
        route: routes[0]._id,
        driver: drivers[0]._id,
        status: 'inactive'
      }),
      Bus.create({
        busNumber: 'BUS-02',
        licensePlate: 'MH-15-CD-5678',
        capacity: 45,
        route: routes[1]._id,
        driver: drivers[1]._id,
        status: 'inactive'
      }),
      Bus.create({
        busNumber: 'BUS-03',
        licensePlate: 'MH-15-EF-9012',
        capacity: 40,
        route: routes[2]._id,
        driver: drivers[2]._id,
        status: 'inactive'
      })
    ]);
    console.log(`✅ Created ${buses.length} buses`);

    // Update drivers with assigned buses
    await Promise.all([
      User.findByIdAndUpdate(drivers[0]._id, { assignedBus: buses[0]._id }),
      User.findByIdAndUpdate(drivers[1]._id, { assignedBus: buses[1]._id }),
      User.findByIdAndUpdate(drivers[2]._id, { assignedBus: buses[2]._id })
    ]);

    // Create Students
    const students = await Promise.all([
      User.create({
        name: 'Sandip Wagh',
        email: 'sandip@sandip.edu',
        password: 'student123',
        role: 'student',
        erpId: 'ERP001',
        phone: '9876543220',
        assignedBus: buses[0]._id,
        pickupPoint: 'Nashik Road Station',
        dropPoint: 'Sandip College'
      }),
      User.create({
        name: 'Priya Deshmukh',
        email: 'priya@sandip.edu',
        password: 'student123',
        role: 'student',
        erpId: 'ERP002',
        phone: '9876543221',
        assignedBus: buses[0]._id,
        pickupPoint: 'CBS',
        dropPoint: 'Sandip College'
      }),
      User.create({
        name: 'Rahul Jadhav',
        email: 'rahul@sandip.edu',
        password: 'student123',
        role: 'student',
        erpId: 'ERP003',
        phone: '9876543222',
        assignedBus: buses[1]._id,
        pickupPoint: 'Gangapur Road',
        dropPoint: 'Sandip College'
      }),
      User.create({
        name: 'Sneha Kulkarni',
        email: 'sneha@sandip.edu',
        password: 'student123',
        role: 'student',
        erpId: 'ERP004',
        phone: '9876543223',
        assignedBus: buses[1]._id,
        pickupPoint: 'College Road',
        dropPoint: 'Sandip College'
      }),
      User.create({
        name: 'Vikram More',
        email: 'vikram@sandip.edu',
        password: 'student123',
        role: 'student',
        erpId: 'ERP005',
        phone: '9876543224',
        assignedBus: buses[2]._id,
        pickupPoint: 'CIDCO Colony',
        dropPoint: 'Sandip College'
      })
    ]);
    console.log(`✅ Created ${students.length} students`);

    console.log('\n🎉 Seeding complete! Login credentials:');
    console.log('━'.repeat(45));
    console.log('Admin:   admin@sandip.edu   / admin123');
    console.log('Driver:  rajesh@sandip.edu  / driver123');
    console.log('Driver:  sunil@sandip.edu   / driver123');
    console.log('Driver:  amit@sandip.edu    / driver123');
    console.log('Student: sandip@sandip.edu  / student123');
    console.log('Student: priya@sandip.edu   / student123');
    console.log('Student: rahul@sandip.edu   / student123');
    console.log('━'.repeat(45));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
