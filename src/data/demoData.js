export const roles = [
  { id: "worker", label: "Worker", hint: "Labor, household, farm, repair" },
  { id: "equipment", label: "Equipment Owner", hint: "Tractors, tools, machines" },
  { id: "material", label: "Material Provider", hint: "Paint, cement, marble, tools" },
  { id: "employer", label: "Employer", hint: "Hire people, equipment, materials" }
];

export const skills = [
  "Mason",
  "Painter",
  "Plumber",
  "Farm Labor",
  "Housekeeping",
  "Electrician",
  "Tractor Operator",
  "Harvesting",
  "Tiles",
  "Welding"
];

export const demoUser = {
  id: "user-asha-123",
  name: "Asha Jadhav",
  role: "worker",
  phone: "+91 98765 43210",
  location: "Kolhapur, Maharashtra",
  upi: "asha@upi",
  rating: 4.8,
  completedJobs: 48,
  badges: ["Verified", "Top Rated", "Trusted"],
  skills: ["Painter", "Housekeeping", "Farm Labor"],
  earnings: { today: 1200, week: 8400, month: 34800 },
  wallet: 18650
};

export const demoJobs = [
  {
    id: "job-1",
    title: "10 workers for sugarcane harvesting",
    type: "Labor",
    category: "Harvesting",
    location: "Shirol village, Kolhapur",
    distance: "6 km",
    budget: 18500,
    duration: "3 days",
    employer: "Patil Farms",
    postedBy: "Suresh Patil",
    rating: 4.7,
    applicants: 16,
    status: "Open",
    escrow: "Ready",
    employerId: "user-asha-123",
    description: "Need experienced farm workers for cutting, loading, and field cleanup.",
    bids: [
      { id: "bid-1", amount: 18000, message: "I have a team of 5 workers ready.", workerId: "w1", worker: { name: "Rajesh K.", rating: 4.8, location: "Kolhapur" } },
      { id: "bid-2", amount: 18500, message: "Available immediately.", workerId: "w2", worker: { name: "Sunil M.", rating: 4.5, location: "Sangli" } }
    ]
  },
  {
    id: "job-2",
    title: "Tractor with operator for plowing",
    type: "Equipment",
    category: "Tractor",
    location: "Hatkanangale, Kolhapur",
    distance: "12 km",
    budget: 6200,
    duration: "1 day",
    employer: "More Agro",
    postedBy: "Nitin More",
    rating: 4.6,
    applicants: 5,
    status: "Matching",
    escrow: "Locked",
    employerId: "user-asha-123",
    description: "One 45HP+ tractor required for two-acre plowing before Friday."
  },
  {
    id: "job-3",
    title: "Paint and brushes for 2BHK renovation",
    type: "Material",
    category: "Paint",
    location: "Kothrud, Pune",
    distance: "2 km",
    budget: 14500,
    duration: "Delivery today",
    employer: "Joshi Residence",
    postedBy: "Meera Joshi",
    rating: 4.9,
    applicants: 9,
    status: "Open",
    escrow: "Optional",
    description: "Premium washable paint, primer, rollers, brushes, masking tape."
  },
  {
    id: "job-4",
    title: "Experienced plumber for apartment repair",
    type: "Labor",
    category: "Plumber",
    location: "Indiranagar, Bengaluru",
    distance: "4 km",
    budget: 2400,
    duration: "4 hours",
    employer: "Namma Homes",
    postedBy: "Ravi Kumar",
    rating: 4.8,
    applicants: 11,
    status: "Open",
    escrow: "Ready",
    description: "Kitchen sink leakage and bathroom tap replacement. Materials reimbursed."
  },
  {
    id: "job-5",
    title: "Scaffolding rental for exterior painting",
    type: "Equipment",
    category: "Scaffolding",
    location: "Karveer, Kolhapur",
    distance: "9 km",
    budget: 9000,
    duration: "5 days",
    employer: "Shinde Contractors",
    postedBy: "Vikas Shinde",
    rating: 4.5,
    applicants: 7,
    status: "Open",
    escrow: "Optional",
    description: "Safe scaffolding setup for G+2 house painting project."
  }
];

export const providers = [
  {
    name: "Rahul Pawar",
    role: "Tractor Owner",
    location: "Kolhapur",
    rating: 4.9,
    jobs: 132,
    badges: ["Gold", "Verified"],
    specialty: "Mahindra 575 DI, rotavator, trolley"
  },
  {
    name: "Fatima Shaikh",
    role: "Painter",
    location: "Pune",
    rating: 4.8,
    jobs: 76,
    badges: ["Top Rated"],
    specialty: "Interior painting, waterproofing"
  },
  {
    name: "Lakshmi Hardware",
    role: "Material Provider",
    location: "Bengaluru",
    rating: 4.7,
    jobs: 210,
    badges: ["Trusted", "Verified"],
    specialty: "Cement, tiles, tools, same-day delivery"
  }
];

export const demoTransactions = [
  { id: "txn-1", title: "Harvesting escrow locked", amount: 18500, status: "Locked", date: "Today" },
  { id: "txn-2", title: "Painting job released", amount: 5200, status: "Released", date: "Yesterday" },
  { id: "txn-3", title: "Tractor advance refunded", amount: 1500, status: "Refunded", date: "May 8" },
  { id: "txn-4", title: "Plumbing completion pending", amount: 2400, status: "Auto-release 32h", date: "May 7" }
];

export const testimonials = [
  {
    quote: "I found verified workers for harvesting in one evening. Escrow made both sides confident.",
    name: "Suresh Patil",
    role: "Farmer, Kolhapur"
  },
  {
    quote: "My tractor no longer sits idle. Jeevika sends nearby jobs with clear payment terms.",
    name: "Rahul Pawar",
    role: "Equipment Owner"
  },
  {
    quote: "It feels professional but simple enough for everyday hiring at home.",
    name: "Meera Joshi",
    role: "Homeowner, Pune"
  }
];
