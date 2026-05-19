// Mock data for the TWOWAY admin dashboard. Structured so real API calls
// can replace these arrays with minimal refactoring.

const d = (daysAgo, h = 10) => new Date(Date.now() - daysAgo * 864e5 + h * 36e5).toISOString();

/** Reliable preview URLs (local /img/* paths are not served in dev) */
export const IMG = {
  headphones: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=max&auto=format",
  fitness: "https://images.unsplash.com/photo-1576243345690-4e4b79b6328a?w=400&h=400&fit=crop&auto=format",
  speaker: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e2?w=400&h=400&fit=crop&auto=format",
  charger: "https://images.unsplash.com/photo-1591290619762-dbe58e27b5d0?w=400&h=400&fit=crop&auto=format",
  kurta: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop&auto=format",
  saree: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=400&fit=crop&auto=format",
  shirt: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&auto=format",
  serum: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop&auto=format",
  hairOil: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&h=400&fit=crop&auto=format",
  baskets: "https://images.unsplash.com/photo-1594040226829-7f251ab78f80?w=400&h=400&fit=crop&auto=format",
  teaSet: "https://images.unsplash.com/photo-1563822249360-896e9a949843?w=400&h=400&fit=crop&auto=format",
  bag: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&auto=format",
};

// ─── Categories ───
export const categories = [
  { id: "1", name: "Electronics", slug: "electronics", productCount: 4 },
  { id: "2", name: "Fashion", slug: "fashion", productCount: 3 },
  { id: "3", name: "Beauty", slug: "beauty", productCount: 2 },
  { id: "4", name: "Home & Living", slug: "home-living", productCount: 2 },
  { id: "5", name: "Accessories", slug: "accessories", productCount: 1 },
];

// ─── Products ───
export const products = [
  { id: "P001", name: "Wireless Noise Cancelling Headphones", slug: "wireless-nc-headphones", sku: "TWO-ELC-001", brand: "SoundMax", categoryId: "1", categoryName: "Electronics", price: 18500, salePrice: 15900, costPrice: 9500, stock: 42, reservedStock: 3, lowStockThreshold: 10, images: [IMG.headphones], isActive: true, isFeatured: true, isBestSeller: true, isNewArrival: false, ratingAvg: 4.6, reviewCount: 28, salesCount: 156, revenue: 2480400, listingQualityScore: 95, description: "Premium wireless headphones with active noise cancelling, 30hr battery.", createdAt: d(120), updatedAt: d(2) },
  { id: "P002", name: "Smart Fitness Band Pro", slug: "smart-fitness-band-pro", sku: "TWO-ELC-002", brand: "FitTech", categoryId: "1", categoryName: "Electronics", price: 8900, salePrice: null, costPrice: 4200, stock: 3, reservedStock: 1, lowStockThreshold: 10, images: [IMG.fitness], isActive: true, isFeatured: false, isBestSeller: false, isNewArrival: true, ratingAvg: 4.2, reviewCount: 14, salesCount: 89, revenue: 792100, listingQualityScore: 88, description: "Track steps, heart rate, sleep, and SpO2 with 14-day battery life.", createdAt: d(90), updatedAt: d(5) },
  { id: "P003", name: "Portable Bluetooth Speaker", slug: "portable-bt-speaker", sku: "TWO-ELC-003", brand: "SoundMax", categoryId: "1", categoryName: "Electronics", price: 6500, salePrice: 5200, costPrice: 2800, stock: 0, reservedStock: 0, lowStockThreshold: 5, images: [IMG.speaker], isActive: true, isFeatured: false, isBestSeller: false, isNewArrival: false, ratingAvg: 4.0, reviewCount: 9, salesCount: 67, revenue: 348400, listingQualityScore: 82, description: "Waterproof 20W speaker with 12hr playtime.", createdAt: d(150), updatedAt: d(10) },
  { id: "P004", name: "USB-C Fast Charger 65W", slug: "usb-c-fast-charger", sku: "TWO-ELC-004", brand: "ChargePro", categoryId: "1", categoryName: "Electronics", price: 3200, salePrice: null, costPrice: 1500, stock: 85, reservedStock: 0, lowStockThreshold: 15, images: [IMG.charger], isActive: true, isFeatured: false, isBestSeller: false, isNewArrival: false, ratingAvg: 4.8, reviewCount: 42, salesCount: 234, revenue: 748800, listingQualityScore: 65, description: "GaN 65W charger with dual ports.", createdAt: d(200), updatedAt: d(1) },
  { id: "P005", name: "Linen Blend Kurta Set", slug: "linen-kurta-set", sku: "TWO-FSH-001", brand: "TWOWAY Collection", categoryId: "2", categoryName: "Fashion", price: 4500, salePrice: 3800, costPrice: 1800, stock: 24, reservedStock: 2, lowStockThreshold: 8, images: [IMG.kurta], isActive: true, isFeatured: true, isBestSeller: false, isNewArrival: true, ratingAvg: 4.4, reviewCount: 16, salesCount: 92, revenue: 349600, listingQualityScore: 90, description: "Comfortable linen blend kurta with pants, ideal for Sri Lankan weather.", createdAt: d(45), updatedAt: d(3) },
  { id: "P006", name: "Cotton Saree - Handloom", slug: "cotton-saree-handloom", sku: "TWO-FSH-002", brand: "Heritage Weaves", categoryId: "2", categoryName: "Fashion", price: 12000, salePrice: null, costPrice: 6500, stock: 7, reservedStock: 0, lowStockThreshold: 5, images: [IMG.saree], isActive: true, isFeatured: true, isBestSeller: true, isNewArrival: false, ratingAvg: 4.9, reviewCount: 31, salesCount: 48, revenue: 576000, listingQualityScore: 92, description: "Traditional handloom cotton saree from Jaffna.", createdAt: d(180), updatedAt: d(7) },
  { id: "P007", name: "Batik Print Casual Shirt", slug: "batik-casual-shirt", sku: "TWO-FSH-003", brand: "TWOWAY Collection", categoryId: "2", categoryName: "Fashion", price: 3200, salePrice: 2600, costPrice: 1200, stock: 35, reservedStock: 0, lowStockThreshold: 10, images: [IMG.shirt], isActive: true, isFeatured: false, isBestSeller: false, isNewArrival: true, ratingAvg: 3.8, reviewCount: 7, salesCount: 43, revenue: 111800, listingQualityScore: 85, description: "Hand-painted Sri Lankan batik casual shirt.", createdAt: d(30), updatedAt: d(4) },
  { id: "P008", name: "Ayurvedic Face Serum", slug: "ayurvedic-face-serum", sku: "TWO-BTY-001", brand: "Ceylon Naturals", categoryId: "3", categoryName: "Beauty", price: 2800, salePrice: null, costPrice: 800, stock: 60, reservedStock: 5, lowStockThreshold: 15, images: [IMG.serum], isActive: true, isFeatured: false, isBestSeller: true, isNewArrival: false, ratingAvg: 4.7, reviewCount: 52, salesCount: 312, revenue: 873600, listingQualityScore: 94, description: "100% natural ayurvedic face serum with turmeric and sandalwood.", createdAt: d(200), updatedAt: d(0) },
  { id: "P009", name: "Coconut Hair Oil Elixir", slug: "coconut-hair-oil", sku: "TWO-BTY-002", brand: "Ceylon Naturals", categoryId: "3", categoryName: "Beauty", price: 1500, salePrice: 1200, costPrice: 400, stock: 120, reservedStock: 0, lowStockThreshold: 20, images: [IMG.hairOil], isActive: true, isFeatured: false, isBestSeller: false, isNewArrival: false, ratingAvg: 4.3, reviewCount: 18, salesCount: 198, revenue: 237600, listingQualityScore: 78, description: "Cold-pressed virgin coconut oil with herbal extracts.", createdAt: d(250), updatedAt: d(15) },
  { id: "P010", name: "Handwoven Basket Set", slug: "handwoven-basket-set", sku: "TWO-HOM-001", brand: "Lanka Craft", categoryId: "4", categoryName: "Home & Living", price: 3800, salePrice: null, costPrice: 1600, stock: 18, reservedStock: 1, lowStockThreshold: 5, images: [IMG.baskets], isActive: true, isFeatured: false, isBestSeller: false, isNewArrival: false, ratingAvg: 4.1, reviewCount: 6, salesCount: 34, revenue: 129200, listingQualityScore: 80, description: "Set of 3 handwoven palm leaf storage baskets.", createdAt: d(100), updatedAt: d(20) },
  { id: "P011", name: "Ceramic Tea Set - Blue Lotus", slug: "ceramic-tea-set", sku: "TWO-HOM-002", brand: "Lanka Craft", categoryId: "4", categoryName: "Home & Living", price: 5500, salePrice: 4800, costPrice: 2200, stock: 5, reservedStock: 0, lowStockThreshold: 5, images: [IMG.teaSet], isActive: false, isFeatured: false, isBestSeller: false, isNewArrival: false, ratingAvg: 4.5, reviewCount: 10, salesCount: 22, revenue: 105600, listingQualityScore: 72, description: "Hand-painted ceramic tea set with blue lotus motif.", createdAt: d(160), updatedAt: d(30) },
  { id: "P012", name: "Leather Messenger Bag", slug: "leather-messenger-bag", sku: "TWO-ACC-001", brand: "TWOWAY Collection", categoryId: "5", categoryName: "Accessories", price: 9800, salePrice: 8500, costPrice: 4500, stock: 12, reservedStock: 2, lowStockThreshold: 5, images: [IMG.bag], isActive: true, isFeatured: true, isBestSeller: false, isNewArrival: true, ratingAvg: 4.6, reviewCount: 19, salesCount: 45, revenue: 382500, listingQualityScore: 91, description: "Full-grain leather messenger bag with brass fittings.", createdAt: d(60), updatedAt: d(1) },
];

// ─── Marketplace sellers (admin Users list). IDs still referenced as customerId on orders for demo. ───
export const customers = [
  { id: "C001", name: "Kasun Perera", storeName: "Kasun Electronics & Co.", email: "kasun.perera@gmail.com", phone: "+94 77 123 4567", ordersCount: 8, totalSpent: 124500, avgOrderValue: 15563, lastOrder: d(2), status: "active", isRepeat: true, joinedAt: d(365) },
  { id: "C002", name: "Nimal De Silva", storeName: "Hill Country Gadgets", email: "nimal.desilva@yahoo.com", phone: "+94 71 234 5678", ordersCount: 3, totalSpent: 34200, avgOrderValue: 11400, lastOrder: d(14), status: "active", isRepeat: true, joinedAt: d(200) },
  { id: "C003", name: "Samanthi Fernando", storeName: "Negombo Weaves", email: "samanthi.f@gmail.com", phone: "+94 76 345 6789", ordersCount: 1, totalSpent: 15900, avgOrderValue: 15900, lastOrder: d(5), status: "active", isRepeat: false, joinedAt: d(30) },
  { id: "C004", name: "Ruwan Jayawardena", storeName: "Colombo Tech Mart", email: "ruwan.j@outlook.com", phone: "+94 77 456 7890", ordersCount: 12, totalSpent: 287600, avgOrderValue: 23967, lastOrder: d(1), status: "active", isRepeat: true, joinedAt: d(400) },
  { id: "C005", name: "Dilini Wickramasinghe", storeName: "Galle Coastal Living", email: "dilini.w@gmail.com", phone: "+94 72 567 8901", ordersCount: 5, totalSpent: 67800, avgOrderValue: 13560, lastOrder: d(7), status: "active", isRepeat: true, joinedAt: d(180) },
  { id: "C006", name: "Ashan Bandara", storeName: "Anuradhapura Batik Studio", email: "ashan.b@hotmail.com", phone: "+94 78 678 9012", ordersCount: 2, totalSpent: 22400, avgOrderValue: 11200, lastOrder: d(45), status: "inactive", isRepeat: true, joinedAt: d(300) },
  { id: "C007", name: "Malini Rajapaksa", storeName: "Park Avenue Beauty", email: "malini.r@gmail.com", phone: "+94 71 789 0123", ordersCount: 1, totalSpent: 8900, avgOrderValue: 8900, lastOrder: d(3), status: "active", isRepeat: false, joinedAt: d(10) },
  { id: "C008", name: "Pradeep Gunasekara", storeName: "Southern Home & Craft", email: "pradeep.g@yahoo.com", phone: "+94 77 890 1234", ordersCount: 6, totalSpent: 156200, avgOrderValue: 26033, lastOrder: d(0), status: "active", isRepeat: true, joinedAt: d(250) },
];

// ─── Orders ───
export const orders = [
  { id: "1", orderNumber: "ORD-2026-001", customerId: "C004", customerName: "Ruwan Jayawardena", customerEmail: "ruwan.j@outlook.com", customerPhone: "+94 77 456 7890", itemCount: 3, totalAmount: 38200, subtotal: 40000, discount: 2300, shipping: 500, paymentMethod: "PAYHERE", paymentStatus: "PAID", orderStatus: "DELIVERED", shippingAddress: "42 Galle Road, Colombo 03", items: [{ productId: "P001", name: "Wireless Noise Cancelling Headphones", qty: 1, price: 15900, image: IMG.headphones }, { productId: "P005", name: "Linen Blend Kurta Set", qty: 1, price: 3800, image: IMG.kurta }, { productId: "P008", name: "Ayurvedic Face Serum", qty: 1, price: 2800, image: IMG.serum }], couponCode: "WELCOME10", createdAt: d(28), updatedAt: d(24) },
  { id: "2", orderNumber: "ORD-2026-002", customerId: "C001", customerName: "Kasun Perera", customerEmail: "kasun.perera@gmail.com", customerPhone: "+94 77 123 4567", itemCount: 1, totalAmount: 15900, subtotal: 15900, discount: 0, shipping: 0, paymentMethod: "COD", paymentStatus: "PENDING", orderStatus: "SHIPPED", shippingAddress: "18 Temple Road, Kandy", items: [{ productId: "P001", name: "Wireless Noise Cancelling Headphones", qty: 1, price: 15900, image: IMG.headphones }], couponCode: null, createdAt: d(5), updatedAt: d(3) },
  { id: "3", orderNumber: "ORD-2026-003", customerId: "C003", customerName: "Samanthi Fernando", customerEmail: "samanthi.f@gmail.com", customerPhone: "+94 76 345 6789", itemCount: 2, totalAmount: 18700, subtotal: 19200, discount: 0, shipping: 500, paymentMethod: "STRIPE", paymentStatus: "PAID", orderStatus: "PROCESSING", shippingAddress: "7 Lake Drive, Negombo", items: [{ productId: "P006", name: "Cotton Saree - Handloom", qty: 1, price: 12000, image: IMG.saree }, { productId: "P009", name: "Coconut Hair Oil Elixir", qty: 1, price: 1200, image: IMG.hairOil }], couponCode: null, createdAt: d(3), updatedAt: d(2) },
  { id: "4", orderNumber: "ORD-2026-004", customerId: "C005", customerName: "Dilini Wickramasinghe", customerEmail: "dilini.w@gmail.com", customerPhone: "+94 72 567 8901", itemCount: 1, totalAmount: 8500, subtotal: 9800, discount: 1300, shipping: 0, paymentMethod: "PAYHERE", paymentStatus: "PAID", orderStatus: "PACKED", shippingAddress: "31 Beach Road, Galle", items: [{ productId: "P012", name: "Leather Messenger Bag", qty: 1, price: 8500, image: IMG.bag }], couponCode: "FESTIVE15", createdAt: d(2), updatedAt: d(1) },
  { id: "5", orderNumber: "ORD-2026-005", customerId: "C008", customerName: "Pradeep Gunasekara", customerEmail: "pradeep.g@yahoo.com", customerPhone: "+94 77 890 1234", itemCount: 4, totalAmount: 29600, subtotal: 30600, discount: 1500, shipping: 500, paymentMethod: "COD", paymentStatus: "PENDING", orderStatus: "PLACED", shippingAddress: "55 Main Street, Matara", items: [{ productId: "P002", name: "Smart Fitness Band Pro", qty: 1, price: 8900, image: IMG.fitness }, { productId: "P005", name: "Linen Blend Kurta Set", qty: 2, price: 3800, image: IMG.kurta }, { productId: "P010", name: "Handwoven Basket Set", qty: 1, price: 3800, image: IMG.baskets }], couponCode: "SAVE500", createdAt: d(1), updatedAt: d(1) },
  { id: "6", orderNumber: "ORD-2026-006", customerId: "C002", customerName: "Nimal De Silva", customerEmail: "nimal.desilva@yahoo.com", customerPhone: "+94 71 234 5678", itemCount: 1, totalAmount: 5200, subtotal: 5200, discount: 0, shipping: 500, paymentMethod: "PAYHERE", paymentStatus: "FAILED", orderStatus: "CANCELLED", shippingAddress: "12 Hill Street, Nuwara Eliya", items: [{ productId: "P003", name: "Portable Bluetooth Speaker", qty: 1, price: 5200, image: IMG.speaker }], couponCode: null, createdAt: d(10), updatedAt: d(9) },
  { id: "7", orderNumber: "ORD-2026-007", customerId: "C007", customerName: "Malini Rajapaksa", customerEmail: "malini.r@gmail.com", customerPhone: "+94 71 789 0123", itemCount: 2, totalAmount: 11700, subtotal: 12200, discount: 0, shipping: 500, paymentMethod: "STRIPE", paymentStatus: "PAID", orderStatus: "CONFIRMED", shippingAddress: "23 Park Avenue, Colombo 07", items: [{ productId: "P008", name: "Ayurvedic Face Serum", qty: 2, price: 2800, image: IMG.serum }, { productId: "P007", name: "Batik Print Casual Shirt", qty: 1, price: 2600, image: IMG.shirt }], couponCode: null, createdAt: d(0, 8), updatedAt: d(0, 8) },
  { id: "8", orderNumber: "ORD-2026-008", customerId: "C004", customerName: "Ruwan Jayawardena", customerEmail: "ruwan.j@outlook.com", customerPhone: "+94 77 456 7890", itemCount: 1, totalAmount: 3200, subtotal: 3200, discount: 0, shipping: 500, paymentMethod: "COD", paymentStatus: "PENDING", orderStatus: "PLACED", shippingAddress: "42 Galle Road, Colombo 03", items: [{ productId: "P004", name: "USB-C Fast Charger 65W", qty: 1, price: 3200, image: "" }], couponCode: null, createdAt: d(0, 6), updatedAt: d(0, 6) },
  { id: "9", orderNumber: "ORD-2026-009", customerId: "C001", customerName: "Kasun Perera", customerEmail: "kasun.perera@gmail.com", customerPhone: "+94 77 123 4567", itemCount: 2, totalAmount: 24500, subtotal: 24500, discount: 0, shipping: 0, paymentMethod: "PAYHERE", paymentStatus: "PAID", orderStatus: "DELIVERED", shippingAddress: "18 Temple Road, Kandy", items: [{ productId: "P006", name: "Cotton Saree - Handloom", qty: 1, price: 12000, image: IMG.saree }, { productId: "P012", name: "Leather Messenger Bag", qty: 1, price: 8500, image: IMG.bag }], couponCode: null, createdAt: d(35), updatedAt: d(30) },
  { id: "10", orderNumber: "ORD-2026-010", customerId: "C006", customerName: "Ashan Bandara", customerEmail: "ashan.b@hotmail.com", customerPhone: "+94 78 678 9012", itemCount: 1, totalAmount: 2600, subtotal: 2600, discount: 0, shipping: 500, paymentMethod: "COD", paymentStatus: "PAID", orderStatus: "DELIVERED", shippingAddress: "9 Station Road, Anuradhapura", items: [{ productId: "P007", name: "Batik Print Casual Shirt", qty: 1, price: 2600, image: IMG.shirt }], couponCode: null, createdAt: d(45), updatedAt: d(40) },
];

// ─── Payments ───
export const payments = [
  { id: "PAY001", orderId: "1", orderNumber: "ORD-2026-001", customerName: "Ruwan Jayawardena", method: "PAYHERE", amount: 38200, status: "PAID", transactionRef: "PH-TXN-88291", gateway: "PayHere", createdAt: d(28) },
  { id: "PAY002", orderId: "2", orderNumber: "ORD-2026-002", customerName: "Kasun Perera", method: "COD", amount: 15900, status: "PENDING", transactionRef: null, gateway: "COD", createdAt: d(5) },
  { id: "PAY003", orderId: "3", orderNumber: "ORD-2026-003", customerName: "Samanthi Fernando", method: "STRIPE", amount: 18700, status: "PAID", transactionRef: "pi_3N2abc123def", gateway: "Stripe", createdAt: d(3) },
  { id: "PAY004", orderId: "4", orderNumber: "ORD-2026-004", customerName: "Dilini Wickramasinghe", method: "PAYHERE", amount: 8500, status: "PAID", transactionRef: "PH-TXN-88345", gateway: "PayHere", createdAt: d(2) },
  { id: "PAY005", orderId: "6", orderNumber: "ORD-2026-006", customerName: "Nimal De Silva", method: "PAYHERE", amount: 5200, status: "FAILED", transactionRef: "PH-TXN-88400", gateway: "PayHere", createdAt: d(10) },
  { id: "PAY006", orderId: "7", orderNumber: "ORD-2026-007", customerName: "Malini Rajapaksa", method: "STRIPE", amount: 11700, status: "PAID", transactionRef: "pi_3N2xyz789abc", gateway: "Stripe", createdAt: d(0) },
];

// ─── Stock Logs ───
export const stockLogs = [
  { id: "SL001", productId: "P003", productName: "Portable Bluetooth Speaker", sku: "TWO-ELC-003", type: "SOLD", quantity: -2, previousStock: 2, newStock: 0, reason: "Order ORD-2026-006", adminName: "System", createdAt: d(10) },
  { id: "SL002", productId: "P001", productName: "Wireless Noise Cancelling Headphones", sku: "TWO-ELC-001", type: "ADDED", quantity: 50, previousStock: 0, newStock: 50, reason: "Supplier restock - Invoice SR-2201", adminName: "Admin", createdAt: d(15) },
  { id: "SL003", productId: "P008", productName: "Ayurvedic Face Serum", sku: "TWO-BTY-001", type: "ADJUSTED", quantity: -5, previousStock: 70, newStock: 65, reason: "Inventory audit - damaged units", adminName: "Admin", createdAt: d(8) },
  { id: "SL004", productId: "P005", productName: "Linen Blend Kurta Set", sku: "TWO-FSH-001", type: "RETURNED", quantity: 1, previousStock: 23, newStock: 24, reason: "Return RET-001 restocked", adminName: "System", createdAt: d(6) },
  { id: "SL005", productId: "P002", productName: "Smart Fitness Band Pro", sku: "TWO-ELC-002", type: "SOLD", quantity: -1, previousStock: 4, newStock: 3, reason: "Order ORD-2026-005", adminName: "System", createdAt: d(1) },
];

// ─── Reviews ───
export const reviews = [
  { id: "R001", productId: "P001", productName: "Wireless Noise Cancelling Headphones", customerId: "C004", customerName: "Ruwan Jayawardena", rating: 5, comment: "Best headphones I've owned. Noise cancelling is superb, perfect for WFH in Colombo traffic noise!", status: "approved", createdAt: d(22) },
  { id: "R002", productId: "P006", productName: "Cotton Saree - Handloom", customerId: "C001", customerName: "Kasun Perera", rating: 5, comment: "Bought for my wife's birthday. Exceptional quality, authentic Jaffna handloom work. She loved it.", status: "approved", createdAt: d(30) },
  { id: "R003", productId: "P008", productName: "Ayurvedic Face Serum", customerId: "C005", customerName: "Dilini Wickramasinghe", rating: 4, comment: "Good product, noticed results after 2 weeks. Smells natural. Would repurchase.", status: "approved", createdAt: d(12) },
  { id: "R004", productId: "P007", productName: "Batik Print Casual Shirt", customerId: "C006", customerName: "Ashan Bandara", rating: 2, comment: "Color faded after first wash. Disappointed with quality for the price.", status: "pending", createdAt: d(3) },
  { id: "R005", productId: "P012", productName: "Leather Messenger Bag", customerId: "C005", customerName: "Dilini Wickramasinghe", rating: 5, comment: "Stunning craftsmanship. The leather smells amazing and brass fittings are solid.", status: "pending", createdAt: d(1) },
];

// ─── Coupons ───
export const coupons = [
  { id: "CP001", code: "WELCOME10", type: "percentage", value: 10, minOrder: 5000, maxDiscount: 3000, usageLimit: 100, usedCount: 34, startDate: d(60), expiryDate: d(-30), isActive: true, createdAt: d(60) },
  { id: "CP002", code: "FESTIVE15", type: "percentage", value: 15, minOrder: 8000, maxDiscount: 5000, usageLimit: 50, usedCount: 12, startDate: d(20), expiryDate: d(-5), isActive: true, createdAt: d(20) },
  { id: "CP003", code: "SAVE500", type: "fixed", value: 500, minOrder: 3000, maxDiscount: 500, usageLimit: 200, usedCount: 87, startDate: d(90), expiryDate: d(-60), isActive: true, createdAt: d(90) },
  { id: "CP004", code: "FREESHIP", type: "free_delivery", value: 0, minOrder: 2000, maxDiscount: 500, usageLimit: 500, usedCount: 156, startDate: d(180), expiryDate: d(10), isActive: false, createdAt: d(180) },
];

// ─── Returns ───
export const returns = [
  { id: "RET001", orderId: "9", orderNumber: "ORD-2026-009", customerId: "C001", customerName: "Kasun Perera", productId: "P012", productName: "Leather Messenger Bag", reason: "Strap buckle defective", condition: "Damaged", refundAmount: 8500, status: "REFUNDED", requestedAt: d(28), resolvedAt: d(20) },
  { id: "RET002", orderId: "1", orderNumber: "ORD-2026-001", customerId: "C004", customerName: "Ruwan Jayawardena", productId: "P005", productName: "Linen Blend Kurta Set", reason: "Size too small", condition: "Good", refundAmount: 3800, status: "INSPECTED", requestedAt: d(22), resolvedAt: null },
  { id: "RET003", orderId: "10", orderNumber: "ORD-2026-010", customerId: "C006", customerName: "Ashan Bandara", productId: "P007", productName: "Batik Print Casual Shirt", reason: "Color faded after wash", condition: "Used", refundAmount: 2600, status: "REQUESTED", requestedAt: d(2), resolvedAt: null },
  { id: "RET004", orderId: "3", orderNumber: "ORD-2026-003", customerId: "C003", customerName: "Samanthi Fernando", productId: "P009", productName: "Coconut Hair Oil Elixir", reason: "Wrong product received", condition: "Unopened", refundAmount: 1200, status: "APPROVED", requestedAt: d(1), resolvedAt: null },
  { id: "RET005", orderId: "2", orderNumber: "ORD-2026-002", customerId: "C001", customerName: "Kasun Perera", productId: "P001", productName: "Wireless Noise Cancelling Headphones", reason: "Audio cuts out intermittently", condition: "Damaged", refundAmount: 15900, status: "RETURN_RECEIVED", requestedAt: d(8), resolvedAt: null },
  { id: "RET006", orderId: "4", orderNumber: "ORD-2026-004", customerId: "C005", customerName: "Dilini Wickramasinghe", productId: "P012", productName: "Leather Messenger Bag", reason: "Changed mind before shipping", condition: "Unopened", refundAmount: 8500, status: "REJECTED", requestedAt: d(15), resolvedAt: d(12) },
  { id: "RET007", orderId: "5", orderNumber: "ORD-2026-005", customerId: "C008", customerName: "Pradeep Gunasekara", productId: "P002", productName: "Smart Fitness Band Pro", reason: "Does not pair with phone", condition: "Good", refundAmount: 8900, status: "APPROVED", requestedAt: d(4), resolvedAt: null },
  { id: "RET008", orderId: "6", orderNumber: "ORD-2026-006", customerId: "C002", customerName: "Nimal De Silva", productId: "P003", productName: "Portable Bluetooth Speaker", reason: "Order cancelled after payment attempt", condition: "Unopened", refundAmount: 5200, status: "REQUESTED", requestedAt: d(9), resolvedAt: null },
  { id: "RET009", orderId: "7", orderNumber: "ORD-2026-007", customerId: "C007", customerName: "Malini Rajapaksa", productId: "P008", productName: "Ayurvedic Face Serum", reason: "Allergic reaction reported", condition: "Used", refundAmount: 2800, status: "INSPECTED", requestedAt: d(6), resolvedAt: null },
  { id: "RET010", orderId: "8", orderNumber: "ORD-2026-008", customerId: "C004", customerName: "Ruwan Jayawardena", productId: "P004", productName: "USB-C Fast Charger 65W", reason: "Not compatible with device", condition: "Good", refundAmount: 3200, status: "REFUNDED", requestedAt: d(18), resolvedAt: d(14) },
  { id: "RET011", orderId: "1", orderNumber: "ORD-2026-001", customerId: "C004", customerName: "Ruwan Jayawardena", productId: "P008", productName: "Ayurvedic Face Serum", reason: "Duplicate order by mistake", condition: "Unopened", refundAmount: 2800, status: "RETURN_RECEIVED", requestedAt: d(12), resolvedAt: null },
  { id: "RET012", orderId: "9", orderNumber: "ORD-2026-009", customerId: "C001", customerName: "Kasun Perera", productId: "P006", productName: "Cotton Saree - Handloom", reason: "Weaving defect on border", condition: "Damaged", refundAmount: 12000, status: "REQUESTED", requestedAt: d(0, 4), resolvedAt: null },
];

// ─── Invoices ───
export const invoices = [
  { id: "INV001", invoiceNumber: "TWO-INV-2026-001", orderId: "1", orderNumber: "ORD-2026-001", customerName: "Ruwan Jayawardena", amount: 38200, paymentMethod: "PAYHERE", status: "paid", createdAt: d(28) },
  { id: "INV002", invoiceNumber: "TWO-INV-2026-002", orderId: "3", orderNumber: "ORD-2026-003", customerName: "Samanthi Fernando", amount: 18700, paymentMethod: "STRIPE", status: "sent", createdAt: d(3) },
  { id: "INV003", invoiceNumber: "TWO-INV-2026-003", orderId: "9", orderNumber: "ORD-2026-009", customerName: "Kasun Perera", amount: 24500, paymentMethod: "PAYHERE", status: "paid", createdAt: d(35) },
  { id: "INV004", invoiceNumber: "TWO-INV-2026-004", orderId: "10", orderNumber: "ORD-2026-010", customerName: "Ashan Bandara", amount: 2600, paymentMethod: "COD", status: "generated", createdAt: d(45) },
  { id: "INV005", invoiceNumber: "TWO-INV-2026-005", orderId: "2", orderNumber: "ORD-2026-002", customerName: "Kasun Perera", amount: 15900, paymentMethod: "COD", status: "overdue", createdAt: d(20) },
  { id: "INV006", invoiceNumber: "TWO-INV-2026-006", orderId: "4", orderNumber: "ORD-2026-004", customerName: "Dilini Wickramasinghe", amount: 8500, paymentMethod: "PAYHERE", status: "sent", createdAt: d(2) },
  { id: "INV007", invoiceNumber: "TWO-INV-2026-007", orderId: "5", orderNumber: "ORD-2026-005", customerName: "Pradeep Gunasekara", amount: 29600, paymentMethod: "COD", status: "generated", createdAt: d(1) },
  { id: "INV008", invoiceNumber: "TWO-INV-2026-008", orderId: "6", orderNumber: "ORD-2026-006", customerName: "Nimal De Silva", amount: 5200, paymentMethod: "PAYHERE", status: "cancelled", createdAt: d(10) },
  { id: "INV009", invoiceNumber: "TWO-INV-2026-009", orderId: "7", orderNumber: "ORD-2026-007", customerName: "Malini Rajapaksa", amount: 11700, paymentMethod: "STRIPE", status: "paid", createdAt: d(0, 8) },
  { id: "INV010", invoiceNumber: "TWO-INV-2026-010", orderId: "8", orderNumber: "ORD-2026-008", customerName: "Ruwan Jayawardena", amount: 3200, paymentMethod: "COD", status: "overdue", createdAt: d(14) },
  { id: "INV011", invoiceNumber: "TWO-INV-2026-011", orderId: "1", orderNumber: "ORD-2026-001", customerName: "Ruwan Jayawardena", amount: 2800, paymentMethod: "PAYHERE", status: "generated", createdAt: d(12) },
  { id: "INV012", invoiceNumber: "TWO-INV-2026-012", orderId: "9", orderNumber: "ORD-2026-009", customerName: "Kasun Perera", amount: 12000, paymentMethod: "STRIPE", status: "sent", createdAt: d(8) },
];

// ─── Notifications ───
export const notifications = [
  { id: "N001", type: "order", message: "New order ORD-2026-008 placed by Ruwan Jayawardena", relatedId: "8", priority: "high", isRead: false, createdAt: d(0, 6) },
  { id: "N002", type: "order", message: "New order ORD-2026-007 placed by Malini Rajapaksa", relatedId: "7", priority: "high", isRead: false, createdAt: d(0, 8) },
  { id: "N003", type: "low_stock", message: "Smart Fitness Band Pro is running low (3 units left)", relatedId: "P002", priority: "critical", isRead: false, createdAt: d(1) },
  { id: "N004", type: "low_stock", message: "Portable Bluetooth Speaker is out of stock", relatedId: "P003", priority: "critical", isRead: true, createdAt: d(2) },
  { id: "N005", type: "payment_failed", message: "Payment failed for order ORD-2026-006", relatedId: "6", priority: "high", isRead: true, createdAt: d(10) },
  { id: "N006", type: "review", message: "New review pending approval for Batik Print Casual Shirt", relatedId: "R004", priority: "normal", isRead: false, createdAt: d(3) },
  { id: "N007", type: "review", message: "New review pending approval for Leather Messenger Bag", relatedId: "R005", priority: "normal", isRead: false, createdAt: d(1) },
  { id: "N008", type: "return", message: "Return request RET-003 from Ashan Bandara needs action", relatedId: "RET003", priority: "high", isRead: false, createdAt: d(2) },
  { id: "N009", type: "return", message: "Return request RET-004 from Samanthi Fernando needs action", relatedId: "RET004", priority: "high", isRead: false, createdAt: d(1) },
  { id: "N010", type: "invoice", message: "Invoice TWO-INV-2026-002 generated successfully", relatedId: "INV002", priority: "low", isRead: true, createdAt: d(3) },
];

// ─── Admin Inbox (demo mail-style UI) ───
export const inboxLabels = [
  { id: "L1", name: "Orders", color: "#60a5fa" },
  { id: "L2", name: "Support", color: "#f87171" },
  { id: "L3", name: "Reviews", color: "#d8b84f" },
  { id: "L4", name: "Wholesale", color: "#a78bfa" },
];

export const inboxMessages = [
  { id: "M1", from: "Ruwan Jayawardena", initials: "RJ", subject: "Delivery estimate for ORD-2026-001", snippet: "Hi team — could you confirm whether Galle Road dispatch is still on track for Tuesday?", starred: true, unread: true, labelIds: ["L1"], date: d(0, 9), hasAttachment: false },
  { id: "M2", from: "Heritage Weaves", initials: "HW", subject: "Bulk saree restock inquiry", snippet: "We're preparing 40 units of the handloom line. Please advise on warehouse receiving hours.", starred: false, unread: true, labelIds: ["L4", "L1"], date: d(1, 14), hasAttachment: true },
  { id: "M3", from: "Malini Rajapaksa", initials: "MR", subject: "Ayurvedic serum — ingredient list", snippet: "Can you share the full INCI list for the face serum batch you shipped last month?", starred: false, unread: false, labelIds: ["L2"], date: d(2, 11), hasAttachment: false },
  { id: "M4", from: "Ceylon Naturals", initials: "CN", subject: "Payout statement Q1", snippet: "Attached is our reconciliation for January–March marketplace settlements.", starred: true, unread: false, labelIds: ["L3"], date: d(5, 16), hasAttachment: true },
  { id: "M5", from: "Kasun Perera", initials: "KP", subject: "Return label for ORD-2026-002", snippet: "I've printed the label — should I drop the parcel at your Negombo partner locker?", starred: false, unread: true, labelIds: ["L1", "L2"], date: d(0, 7), hasAttachment: false },
  { id: "M6", from: "Dilini Wickramasinghe", initials: "DW", subject: "Leather bag care instructions", snippet: "Do you recommend a specific conditioner for the brass fittings on the messenger bag?", starred: false, unread: false, labelIds: ["L3"], date: d(12, 10), hasAttachment: false },
  { id: "M7", from: "Southern Home & Craft", initials: "SC", subject: "Weekend market stall partnership", snippet: "We're interested in a featured placement for Matara fair next month.", starred: false, unread: true, labelIds: ["L4"], date: d(3, 9), hasAttachment: true },
  { id: "M8", from: "Anuradhapura Batik Studio", initials: "AB", subject: "Listing photos update", snippet: "New lifestyle shots are ready — please replace the hero image on P007.", starred: false, unread: false, labelIds: ["L3"], date: d(8, 15), hasAttachment: true },
];

/** Sidebar badge (derived once from demo inbox) */
export const inboxUnreadBadgeCount = inboxMessages.filter((m) => m.unread).length;

/** Single rich thread for the Conversation view */
export const inboxDemoThread = {
  id: "T1",
  subject: "[Marketplace] Message regarding Cotton Saree — handloom batch",
  tags: [
    { label: "TWOWAY / Fashion", className: "bg-[#60a5fa]/15 text-[#7dd3fc]" },
    { label: "Support Request", className: "bg-[#f87171]/15 text-[#fca5a5]" },
  ],
  messages: [
    {
      id: "TM1",
      from: "Envato Market",
      role: "System",
      dateLabel: "5 Oct 2020",
      collapsed: true,
      body: "You have a new buyer message via your seller profile.",
    },
    {
      id: "TM2",
      from: "Konstantin Veselovsky",
      role: "Buyer",
      dateLabel: "7 Oct 2020",
      collapsed: false,
      body: "Hello,\n\nWe're following up on the Cotton Saree handloom batch. Could you confirm shrinkage after the first cold wash and whether indigo dye is colour-fast?\n\nWe need the details for our retail compliance checklist.\n\nThanks,",
      meta: {
        item: "Cotton Saree - Handloom",
        sender: "kos9",
        purchased: "26/10/2020",
        supportEnds: "26/04/2021",
        verifyUrl: "https://themeforest.net/user/twoway/portfolio",
      },
    },
    {
      id: "TM3",
      from: "Envato Market",
      role: "System",
      dateLabel: "12 Oct 2020",
      collapsed: true,
      body: "This thread was updated — seller replied.",
    },
  ],
  attachments: [
    { name: "Documentation.pdf", size: "2.34 MB", icon: "pdf" },
    { name: "README.md", size: "768 B", icon: "file" },
  ],
};

// ─── SMS Logs ───
export const smsLogs = [
  { id: "SMS001", customerId: "C004", customerName: "Ruwan Jayawardena", phone: "+94 77 456 7890", messageType: "Order Placed", status: "delivered", createdAt: d(0, 6) },
  { id: "SMS002", customerId: "C007", customerName: "Malini Rajapaksa", phone: "+94 71 789 0123", messageType: "Order Confirmed", status: "delivered", createdAt: d(0, 8) },
  { id: "SMS003", customerId: "C001", customerName: "Kasun Perera", phone: "+94 77 123 4567", messageType: "Order Shipped", status: "delivered", createdAt: d(3) },
  { id: "SMS004", customerId: "C005", customerName: "Dilini Wickramasinghe", phone: "+94 72 567 8901", messageType: "Order Packed", status: "failed", createdAt: d(1) },
];

// ─── Revenue chart (deterministic; stable between refreshes) ───
const DAY_MS = 864e5;

function deterministicRevenue(dayOffsetFromToday) {
  const phase = (dayOffsetFromToday * 13 + 7) % 100;
  const wave = Math.sin(dayOffsetFromToday / 4.2) * 0.32 + 1;
  return Math.round((12500 + phase * 240) * wave);
}

/** Last `numDays` days ending today (1–90). */
export function getRevenueChartData(numDays) {
  const n = Math.min(Math.max(numDays, 1), 90);
  return Array.from({ length: n }, (_, i) => {
    const dayAgo = n - 1 - i;
    const date = new Date(Date.now() - dayAgo * DAY_MS);
    const weekday = date.getDay();
    const mult = weekday === 0 || weekday === 6 ? 1.35 : 1;
    const revenue = Math.round(deterministicRevenue(dayAgo) * mult);
    return {
      date: date.toISOString().slice(0, 10),
      revenue,
      orders: 2 + ((dayAgo * 5 + revenue) % 7),
    };
  });
}

/** @deprecated use getRevenueChartData(30) */
export const revenuByDay = getRevenueChartData(30);

// ─── Computed Aggregates ───
export function getOrdersByStatus(orderList = orders) {
  const map = {};
  orderList.forEach((o) => {
    map[o.orderStatus] = (map[o.orderStatus] || 0) + 1;
  });
  return map;
}

export function getCategorySales() {
  const map = {};
  products.forEach((p) => {
    if (!map[p.categoryName]) map[p.categoryName] = { name: p.categoryName, revenue: 0, sales: 0 };
    map[p.categoryName].revenue += p.revenue;
    map[p.categoryName].sales += p.salesCount;
  });
  return Object.values(map).sort((a, b) => b.revenue - a.revenue);
}

export function getPaymentMethodBreakdown() {
  const map = {};
  payments.forEach((p) => {
    if (!map[p.method]) map[p.method] = { method: p.method, amount: 0, count: 0 };
    map[p.method].amount += p.amount;
    map[p.method].count += 1;
  });
  return Object.values(map).sort((a, b) => b.amount - a.amount);
}

export const dashboardKPIs = {
  grossRevenue: orders.reduce((s, o) => s + o.totalAmount, 0),
  netRevenue: orders.filter((o) => o.paymentStatus === "PAID").reduce((s, o) => s + o.totalAmount, 0),
  todayRevenue: orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString()).reduce((s, o) => s + o.totalAmount, 0),
  totalOrders: orders.length,
  totalCustomers: customers.length,
  repeatCustomers: customers.filter((c) => c.isRepeat).length,
  lowStockItems: products.filter((p) => p.isActive && p.stock > 0 && p.stock <= p.lowStockThreshold).length,
  outOfStockItems: products.filter((p) => p.isActive && p.stock === 0).length,
  pendingReviews: reviews.filter((r) => r.status === "pending").length,
  pendingReturns: returns.filter((r) => r.status === "REQUESTED" || r.status === "APPROVED").length,
  failedPayments: payments.filter((p) => p.status === "FAILED").length,
};
