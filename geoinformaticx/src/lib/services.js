const services = [
  {
    name: "Home Cleaning Service", slug: "home-cleaning-service", seller: "Clean Pro", price: 499, rating: 4.8, reviews: 85, distance: "1.2 km away", badge: "New", category: "Cleaning", verified: true,
    img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80",
    description: "Professional home cleaning covering kitchens, bathrooms, living areas and bedrooms. Eco-friendly products used on request.",
    included: ["Dusting & mopping all rooms", "Kitchen deep clean", "Bathroom sanitization", "Window sills & ledges"],
  },
  {
    name: "Plumbing Repair", slug: "plumbing-repair", seller: "Fix It Local", price: 299, rating: 4.7, reviews: 60, distance: "2.0 km away", badge: null, category: "Repair", verified: true,
    img: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80",
    description: "Fast, reliable plumbing repairs for leaks, clogs, and fittings — licensed local plumbers with same-day availability.",
    included: ["Leak detection & repair", "Pipe fitting/replacement", "Drain unclogging", "Tap & faucet fixes"],
  },
  {
    name: "Tailoring & Stitching", slug: "tailoring-stitching", seller: "Stitch Craft", price: 199, rating: 4.9, reviews: 110, distance: "1.5 km away", badge: "Bestseller", category: "Fashion", verified: true,
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    description: "Custom tailoring and alterations for all garment types, done by experienced local tailors with quick turnaround.",
    included: ["Custom stitching", "Alterations & resizing", "Hemming", "Zipper/button repair"],
  },
  {
    name: "Photography Service", slug: "photography-service", seller: "Lens Local", price: 1499, rating: 4.8, reviews: 42, distance: "3.0 km away", badge: "New", category: "Creative", verified: false,
    img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80",
    description: "Professional photography for events, portraits, and product shoots with edited high-resolution deliverables.",
    included: ["2 hours coverage", "Edited photo set", "Digital delivery", "Print-ready files"],
  },
  {
    name: "Catering Service", slug: "catering-service", seller: "Food Craft", price: 2999, rating: 4.6, reviews: 73, distance: "2.5 km away", badge: null, category: "Food", verified: true,
    img: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80",
    description: "Full-service catering for events of all sizes, with customizable menus featuring local and regional cuisine.",
    included: ["Menu customization", "Serving staff", "Setup & cleanup", "Dietary options available"],
  },
  {
    name: "Tutoring Service", slug: "tutoring-service", seller: "Edu Local", price: 399, rating: 4.9, reviews: 95, distance: "1.8 km away", badge: "Bestseller", category: "Education", verified: true,
    img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
    description: "One-on-one and group tutoring across subjects and grade levels, taught by qualified local educators.",
    included: ["Personalized lesson plans", "Progress tracking", "Flexible scheduling", "In-person or online"],
  },
  {
    name: "Electrical Repair", slug: "electrical-repair", seller: "Spark Fix", price: 349, rating: 4.7, reviews: 58, distance: "2.1 km away", badge: null, category: "Repair", verified: false,
    img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80",
    description: "Licensed electrical repair and maintenance for homes and small businesses, including wiring and fixture installs.",
    included: ["Wiring inspection & repair", "Switch/socket installation", "Fixture mounting", "Safety compliance check"],
  },
  {
    name: "Yoga Classes", slug: "yoga-classes", seller: "Wellness Hub", price: 599, rating: 4.9, reviews: 130, distance: "0.8 km away", badge: "New", category: "Wellness", verified: true,
    img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    description: "Guided yoga sessions for all skill levels, focused on flexibility, strength, and mindfulness.",
    included: ["Certified instructor", "Mats provided", "Beginner to advanced", "Small group sizes"],
  },
  {
    name: "AC Repair & Service", slug: "ac-repair-service", seller: "Cool Tech", price: 450, rating: 4.6, reviews: 67, distance: "2.3 km away", badge: null, category: "Repair", verified: true,
    img: "https://images.unsplash.com/photo-1563351672-62b74891a28a?w=800&q=80",
    description: "AC servicing, gas refills, and repairs for split and window units, done by trained local technicians.",
    included: ["Full unit servicing", "Gas refill (if needed)", "Filter cleaning", "Performance check"],
  },
  {
    name: "Beauty & Makeup", slug: "beauty-makeup", seller: "Glam Studio", price: 799, rating: 4.8, reviews: 92, distance: "1.4 km away", badge: "Bestseller", category: "Beauty", verified: true,
    img: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80",
    description: "Professional makeup and beauty services for events, occasions, and everyday glam — at your location or studio.",
    included: ["Full face makeup", "Hair styling add-on available", "Premium products", "Trial session option"],
  },
  {
    name: "Carpenter Work", slug: "carpenter-work", seller: "Wood Craft", price: 699, rating: 4.5, reviews: 48, distance: "3.2 km away", badge: null, category: "Repair", verified: false,
    img: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",
    description: "Custom carpentry, furniture repair, and installation services from skilled local woodworkers.",
    included: ["Furniture repair", "Custom builds", "Door/window fitting", "Polishing & finishing"],
  },
  {
    name: "Painting Service", slug: "painting-service", seller: "Color Works", price: 1999, rating: 4.7, reviews: 55, distance: "2.8 km away", badge: "New", category: "Cleaning", verified: true,
    img: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800&q=80",
    description: "Interior and exterior painting services with quality finishes, done by experienced local painters.",
    included: ["Surface prep", "Premium paint options", "Interior & exterior", "Cleanup included"],
  },
  {
    name: "Event Management", slug: "event-management", seller: "Event Pro", price: 4999, rating: 4.8, reviews: 38, distance: "4.0 km away", badge: null, category: "Creative", verified: true,
    img: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
    description: "End-to-end event planning and coordination for weddings, corporate events, and celebrations.",
    included: ["Venue coordination", "Vendor management", "Day-of coordination", "Custom themes"],
  },
  {
    name: "Cooking Classes", slug: "cooking-classes", seller: "Chef Local", price: 899, rating: 4.9, reviews: 76, distance: "1.6 km away", badge: "Bestseller", category: "Food", verified: true,
    img: "https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=800&q=80",
    description: "Hands-on cooking classes covering local and international cuisine, led by experienced home chefs.",
    included: ["Ingredients provided", "Small batch sessions", "Recipe booklet", "Take-home leftovers"],
  },
  {
    name: "Dance Classes", slug: "dance-classes", seller: "Rhythm Studio", price: 699, rating: 4.7, reviews: 84, distance: "2.2 km away", badge: "New", category: "Wellness", verified: false,
    img: "https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80",
    description: "Group and private dance lessons across styles, for beginners through advanced dancers.",
    included: ["Certified instructors", "Multiple dance styles", "Group or private sessions", "Studio space included"],
  },
  {
    name: "Pet Grooming", slug: "pet-grooming", seller: "Pet Care Local", price: 399, rating: 4.8, reviews: 62, distance: "1.9 km away", badge: null, category: "Beauty", verified: true,
    img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",
    description: "Full grooming services for pets, including bathing, trimming, and nail care by experienced groomers.",
    included: ["Bath & blow-dry", "Nail trimming", "Ear cleaning", "Coat trimming"],
  },
  {
    name: "Music Lessons", slug: "music-lessons", seller: "Tune Local", price: 549, rating: 4.6, reviews: 45, distance: "3.5 km away", badge: null, category: "Education", verified: true,
    img: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80",
    description: "Private music lessons across instruments and skill levels, taught by experienced local musicians.",
    included: ["Personalized curriculum", "Flexible scheduling", "Beginner to advanced", "In-person or online"],
  },
  {
    name: "Laundry Service", slug: "laundry-service", seller: "Fresh Clean", price: 249, rating: 4.7, reviews: 118, distance: "0.6 km away", badge: "Bestseller", category: "Cleaning", verified: true,
    img: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&q=80",
    description: "Pickup and delivery laundry service with wash, dry, and fold — quick turnaround for busy schedules.",
    included: ["Pickup & delivery", "Wash & fold", "Stain treatment", "24-48hr turnaround"],
  },
];

export const getServiceBySlug = (slug) => services.find((s) => s.slug === slug);

export const getRelatedServices = (currentSlug, category, limit = 4) =>
  services.filter((s) => s.slug !== currentSlug && s.category === category).slice(0, limit);

export default services;