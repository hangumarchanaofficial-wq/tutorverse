// ====================================
// PRODUCT GENERATOR — 1000+ Products
// ====================================

const CATEGORY_DATA = {
  "Men's Clothing": {
    brands: ["UrbanThread", "ClassicFit", "PrimeWear", "StyleCraft", "ModernMan"],
    items: [
      { t: "Slim Fit Oxford Shirt", img: "photo-1596755094514-f87e34085b2c" },
      { t: "Classic Chino Pants", img: "photo-lFQV2lt7qcw" },
      { t: "Wool Blend Blazer", img: "photo-1507679799987-c73779587ccf" },
      { t: "Crew Neck Cotton T-Shirt", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&h=1200&fit=crop&auto=format&q=80" },
      { t: "Denim Jacket - Washed Blue", img: "photo-1551028719-00167b16eac5" },
      { t: "Casual Linen Shorts", img: "photo-1591195853828-11db59a44f6b" },
      { t: "Merino Wool Sweater", img: "photo-1576566588028-4147f3842f27" },
      { t: "Tailored Dress Pants", img: "photo-T29AcrDfWsY" },
      { t: "Hooded Zip-Up Sweatshirt", img: "photo-1556821840-3a63f95609a7" },
      { t: "Polo Shirt - Pique Cotton", img: "photo-1586363104862-3a5e2ab60d99" },
      { t: "Flannel Plaid Shirt", img: "photo-1589310243389-96a54832213a8" },
      { t: "Lightweight Down Vest", img: "photo-VzBlp8rl5h8" },
    ],
  },
  "Home & Kitchen": {
    brands: ["HomeEssentials", "KitchenPro", "CozyNest", "ArtisanHome", "PureLiving"],
    items: [
      { t: "Non-Stick Cookware Set 10pc", img: "photo-1556909114-f6e7ad7d3136" },
      { t: "Egyptian Cotton Bed Sheet Set", img: "photo-1522771739844-6a9f6d5f14af" },
      { t: "Stainless Steel Knife Block Set", img: "photo-1593618998160-e34014e67546" },
      { t: "Ceramic Dinner Plate Set - 6pc", img: "photo-1603199506016-5596a20e907e" },
      { t: "Memory Foam Pillow - Queen Size", img: "photo-1584100936595-c0654b55a2e9" },
      { t: "Cast Iron Dutch Oven 5.5qt", img: "photo-1585515320310-259814833e62" },
      { t: "Bamboo Cutting Board Set", img: "photo-1606760227091-3dd870d97f1d" },
      { t: "Scented Soy Candle Gift Set", img: "photo-1602607753498-0f4f1c2d4f3b" },
      { t: "Turkish Cotton Bath Towel Set", img: "photo-1620127682229-33388276e540" },
      { t: "Digital Air Fryer 5.8qt", img: "photo-1648455291706-0c82b3189990" },
      { t: "Glass Food Storage Container Set", img: "photo-1584568694244-14fbdf83bd30" },
      { t: "Pour Over Coffee Maker Set", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=1200&fit=crop&auto=format&q=80" },
    ],
  },
  "Women's Clothing": {
    brands: ["EleganceWear", "BellaVita", "ChicMode", "GraceLine", "LuxeFemme"],
    items: [
      { t: "Floral Wrap Midi Dress", img: "photo-1572804013309-59a88b7e92f1" },
      { t: "High-Waist Skinny Jeans", img: "photo-1541099649105-f69ad21f3246" },
      { t: "Cashmere Blend Cardigan", img: "photo-1434389677669-e08b4cda3f5a" },
      { t: "Silk Blouse - V-Neck", img: "photo-1564257631407-4deb1f99d992" },
      { t: "A-Line Pleated Skirt", img: "photo-1583496661160-fb5886a0aaaa" },
      { t: "Tailored Wool Coat", img: "photo-1539533113208-f6df8cc8b543" },
      { t: "Cotton Maxi Dress", img: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&h=1200&fit=crop&auto=format&q=80" },
      { t: "Cropped Wide-Leg Trousers", img: "photo-1594633312681-425c7b97ccd1" },
      { t: "Knit Turtleneck Sweater", img: "photo-1576566588028-4147f3842f27" },
      { t: "Linen Button-Down Shirt", img: "photo-1525507119028-ed4c629a60a3" },
      { t: "Velvet Evening Blazer", img: "photo-1591369822096-ffd140ec948f" },
      { t: "Ribbed Tank Top 3-Pack", img: "photo-1503342217505-b0a15ec3261c" },
    ],
  },
  Electronics: {
    brands: ["TechVault", "DigiCore", "NovaElec", "PulseTech", "SmartEdge"],
    items: [
      { t: "Wireless Noise-Cancelling Headphones", img: "photo-1505740420928-5e560c06d30e" },
      { t: '4K Ultra HD Smart TV 55"', img: "photo-1593359677879-a4bb92f829d1" },
      { t: "Bluetooth Portable Speaker", img: "photo-1608043152269-423dbba4e7e1" },
      { t: "Mechanical Gaming Keyboard RGB", img: "photo-1587829741301-dc798b83add3" },
      { t: "Wireless Ergonomic Mouse", img: "photo-1527864550417-7fd91fc51a46" },
      { t: "USB-C Docking Station 12-in-1", img: "photo-1625842268584-8f3296236761" },
      { t: "Smart Home Security Camera", img: "photo-1585771724684-38269d6639fd" },
      { t: "Portable Power Bank 20000mAh", img: "photo-1609091839311-d5365f9ff1c5" },
      { t: "True Wireless Earbuds Pro", img: "photo-1590658268037-6bf12f032f55" },
      { t: '27" QHD Gaming Monitor 165Hz', img: "photo-1527443224154-c4a3942d3acf" },
      { t: "Webcam 4K with Ring Light", img: "photo-1587826080692-f439cd0b70da" },
      { t: "Laptop Stand Aluminum Adjustable", img: "photo-1611186871348-b1ce696e52c9" },
    ],
  },
  "Beauty & Health": {
    brands: ["GlowLab", "PureSkin", "VitaBloom", "NaturGlow", "SilkTouch"],
    items: [
      { t: "Vitamin C Brightening Serum 30ml", img: "photo-1570172619644-dfd03ed5d881" },
      { t: "Retinol Night Cream - Anti-Aging", img: "photo-1556228578-0d85b1a4d571" },
      { t: "Hyaluronic Acid Moisturizer", img: "photo-1611930022073-b7a4ba5fcccd" },
      { t: "Organic Lip Balm Set - 6 Pack", img: "photo-1586495777744-4413f210062fa" },
      { t: "Jade Facial Roller & Gua Sha Set", img: "photo-1596755389378-c31d21fd1273" },
      { t: "SPF 50 Mineral Sunscreen", img: "photo-1556228720-195a672e8a03" },
      { t: "Hair Growth Biotin Supplements", img: "photo-1584308666744-24d5c9d4d6c0" },
      { t: "Collagen Peptides Powder 500g", img: "photo-1607006344380-b6775a0824a7" },
      { t: "Organic Tea Tree Essential Oil", img: "photo-1608571423902-eed4a5ad8108" },
      { t: "Charcoal Detox Face Mask 5-Pack", img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=1200&fit=crop&auto=format&q=80" },
      { t: "Rose Gold Hair Styling Set", img: "photo-1522338242992-e1a54906a8da" },
      { t: "Aromatherapy Diffuser - Wood Grain", img: "photo-1602928321679-560bb453f190" },
    ],
  },
  "Sports & Outdoors": {
    brands: ["PeakGear", "TrailBlaze", "FitForce", "SummitPro", "ActiveEdge"],
    items: [
      { t: "Yoga Mat - Non-Slip 6mm Thick", img: "photo-1544367567-0f2fcb009e0b" },
      { t: "Adjustable Dumbbell Set 5-25kg", img: "photo-1534438327276-14e5300c3a48" },
      { t: "Hiking Backpack 45L Waterproof", img: "photo-1622260614153-03223fb72052" },
      { t: "Resistance Band Set - 5 Levels", img: "photo-1598289431512-b97b0917affc" },
      { t: "Camping Tent 4-Person Dome", img: "photo-1504280390367-361c6d9f38f4" },
      { t: "Running Shoes - Lightweight Mesh", img: "photo-1542291026-7eec264c27ff" },
      { t: "Insulated Water Bottle 1L", img: "photo-1602143407151-7111542de6e8" },
      { t: "Cycling Helmet - Aero Design", img: "photo-1557803175-2adaf91a1d67" },
      { t: "Foam Roller - Deep Tissue 18in", img: "photo-1571019613454-1cb2f99b2d8b" },
      { t: "Fishing Rod & Reel Combo", img: "photo-1504309092620-4d0ec726efa4" },
      { t: "Jump Rope - Speed Wire Pro", img: "photo-1517836357463-d25dfeac3438" },
      { t: "Compression Leggings - Men's", img: "photo-1571019614242-c5c5dee9f50b" },
    ],
  },
  "Jewelry & Accessories": {
    brands: ["LuxCraft", "GoldenAura", "SilverLine", "GemVault", "AuraJewels"],
    items: [
      { t: "Sterling Silver Pendant Necklace", img: "https://images.unsplash.com/photo-AhIQL2CKq7g?w=1200&h=1200&fit=crop&auto=format&q=80" },
      { t: "Minimalist Gold Hoop Earrings", img: "photo-1535632066927-ab7c9ab60908" },
      { t: "Leather Strap Chronograph Watch", img: "photo-1524592094714-0f0654e20314" },
      { t: "Pearl Strand Bracelet", img: "photo-1611591437281-460bfbe1220a" },
      { t: "Polarized Aviator Sunglasses", img: "photo-1511499767150-a48a237f0083" },
      { t: "Titanium Wedding Band Set", img: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&h=1200&fit=crop&auto=format&q=80" },
      { t: "Silk Scarf - Floral Print", img: "photo-1584917865442-de89df76afd3" },
      { t: "Diamond Stud Earrings 0.5ct", img: "photo-1603561591411-07134e71a2a9" },
      { t: "Genuine Leather Belt - Brown", img: "photo-1553062407-98eeb64c6a62" },
      { t: "Rose Gold Charm Bracelet", img: "photo-1573408301185-9146fe634ad0" },
      { t: "Men's Cufflink Set - Silver", img: "photo-1590548784585-643d2b9f2925" },
      { t: "Beaded Anklet - Boho Style", img: "photo-1611085583191-a3b181a88401" },
    ],
  },
  "Toys & Games": {
    brands: ["FunFactory", "PlaySmart", "KidVenture", "BrainBox", "ToyLand"],
    items: [
      { t: "STEM Building Blocks Set 500pc", img: "photo-1558060370-d644479cb6f7" },
      { t: "Remote Control Racing Car", img: "photo-1581235707960-15fb97b30a42" },
      { t: "Wooden Puzzle Set - Educational", img: "photo-1596461404969-9ae70f2830c1" },
      { t: "Plush Teddy Bear - Giant 36in", img: "photo-1559715541-5daf8a0296d0" },
      { t: "Strategy Board Game - Family Edition", img: "photo-1611371805429-8b5c1b2c34ba" },
      { t: "Art & Craft Supply Kit - 200pc", img: "photo-1513364776144-60967b0f800f" },
      { t: "RC Drone with HD Camera", img: "photo-1507582020474-9a35b7d455d9" },
      { t: "Science Experiment Kit - Chemistry", img: "photo-1532094349884-543bc11b234d" },
      { t: "Magnetic Tiles Building Set 120pc", img: "photo-1596461404969-9ae70f2830c1" },
      { t: "Action Figure Collection Set", img: "photo-1566576912321-d58ddd7a6088" },
      { t: "Kids Karaoke Machine with Mic", img: "photo-1511379938547-c1f69419868d" },
      { t: "Outdoor Water Play Table", img: "https://images.unsplash.com/photo-1472457897821-70d3819a0e24?w=1200&h=1200&fit=crop&auto=format&q=80" },
    ],
  },
  Automotive: {
    brands: ["AutoPrime", "DriveMax", "SpeedWorks", "MotorElite", "RoadMaster"],
    items: [
      { t: "LED Headlight Bulbs H11 Pair", img: "photo-1492144534655-ae79c964c9d7" },
      { t: "All-Season Floor Mats Set", img: "photo-1558981806-ec527fa84c39" },
      { t: "Portable Jump Starter 2000A", img: "photo-1503376780353-7e66927b7b70" },
      { t: "Dash Camera 4K Front & Rear", img: "photo-1580273916550-e323be2ae537" },
      { t: "Car Vacuum Cleaner - Cordless", img: "photo-1549317661-bd32c8ce0afe" },
      { t: "Tire Pressure Monitoring System", img: "https://images.unsplash.com/photo-1606577924006-27d39b132ae2?w=1200&h=1200&fit=crop&auto=format&q=80" },
      { t: "Car Phone Mount - Magnetic", img: "photo-1617704548623-340376564e68" },
      { t: "Microfiber Car Care Kit 8pc", img: "photo-1607860108855-64acf207eed9" },
      { t: "Seat Cover Set - Premium Leather", img: "photo-1489824904134-891ab645332f1" },
      { t: "Bluetooth OBD2 Scanner", img: "photo-1606577924006-27d39b132ae2" },
      { t: "Trunk Organizer - Collapsible", img: "photo-1549317661-bd32c8ce0afe" },
      { t: "Windshield Sun Shade - Universal", img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&h=1200&fit=crop&auto=format&q=80" },
    ],
  },
  "Bags & Luggage": {
    brands: ["TravelPro", "PackSmart", "JourneyGear", "UrbanCarry", "NomadPack"],
    items: [
      { t: "Hardside Spinner Luggage 28in", img: "photo-1565026057447-bc90a3dceb87" },
      { t: "Leather Laptop Messenger Bag", img: "photo-1548036328-c9fa89d128fa" },
      { t: "Travel Backpack 40L - TSA Approved", img: "photo-1553062407-98eeb64c6a62" },
      { t: "Weekender Duffel Bag - Canvas", img: "photo-1590874103328-eac38ef882a7" },
      { t: "Crossbody Sling Bag", img: "photo-1598532163257-ae3c6b2524b6" },
      { t: "Packing Cube Set 6-Piece", img: "photo-1581553680321-4fffae59fccd" },
      { t: "Rolling Carry-On 22in", img: "photo-1565026057447-bc90a3dceb87" },
      { t: "Laptop Sleeve 15.6in - Waterproof", img: "photo-1548036328-c9fa89d128fa" },
      { t: "Fanny Pack - Adjustable", img: "photo-1590874103328-eac38ef882a7" },
      { t: "Garment Bag - Suit Travel", img: "photo-1553062407-98eeb64c6a62" },
      { t: "Toiletry Bag - Hanging Organizer", img: "photo-1581553680321-4fffae59fccd" },
      { t: "Money Belt - RFID Blocking", img: "photo-1598532163257-ae3c6b2524b6" },
    ],
  },
  "Food & Grocery": {
    brands: ["NatureBite", "PurePantry", "FreshHarvest", "GourmetSelect", "OrganicValley"],
    items: [
      { t: "Organic Green Tea Collection 60ct", img: "photo-1556679343-c7306c1976bc" },
      { t: "Artisan Dark Chocolate Gift Box", img: "photo-1549007994-cb92caefdbe4" },
      { t: "Cold Pressed Olive Oil 1L", img: "photo-1474979266404-7eaacbcd87c5" },
      { t: "Mixed Nuts Trail Mix 2lb", img: "photo-1536591375614-39d07a0bf5f5" },
      { t: "Organic Honey - Raw Unfiltered 1kg", img: "photo-1587049352846-4a222e784d38" },
      { t: "Protein Bars Variety Pack 12ct", img: "photo-1622484212850-eb596d769edc" },
      { t: "Gourmet Coffee Beans 1kg", img: "photo-1559056199-641a0ac8b55e" },
      { t: "Dried Fruit & Nut Mix 1.5lb", img: "photo-1536591375614-39d07a0bf5f5" },
      { t: "Matcha Green Tea Powder 100g", img: "photo-1556679343-c7306c1976bc" },
      { t: "Quinoa & Ancient Grains Mix", img: "photo-1474979266404-7eaacbcd87c5" },
      { t: "Sparkling Water Variety 24pk", img: "photo-1622484212850-eb596d769edc" },
      { t: "Vitamin Gummies Multi-Pack", img: "photo-1587049352846-4a222e784d38" },
    ],
  },
};

// ====================================
// GENERATOR FUNCTIONS
// ====================================

const IMG_BASE = "https://images.unsplash.com/";

function buildImageUrl(imgId, w = 400, h = 400) {
  if (!imgId) return "";
  if (/^https?:\/\//.test(imgId)) return imgId;
  return IMG_BASE + imgId + "?w=" + w + "&h=" + h + "&fit=crop&auto=format&q=80";
}

function slugify(str) {
  return str.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateProducts() {
  const products = [];
  let id = 1;

  Object.entries(CATEGORY_DATA).forEach(([category, data]) => {
    const rng = seededRandom(category.length * 31 + 7);

    data.items.forEach((item, itemIndex) => {
      const variations = Math.floor(rng() * 4) + 5;

      for (let v = 0; v < variations; v++) {
        const brandIndex = Math.floor(rng() * data.brands.length);
        const brand = data.brands[brandIndex];

        const basePrice = Math.floor(rng() * 200) + 10;
        const discount = rng() > 0.4 ? Math.floor(rng() * 45) + 5 : 0;
        const originalPrice = discount > 0 ? +(basePrice / (1 - discount / 100)).toFixed(2) : 0;
        const rating = +(3.5 + rng() * 1.5).toFixed(1);
        const reviews = Math.floor(rng() * 2000) + 10;
        const sold = Math.floor(rng() * 5000) + 50;

        const colors = ["Black", "White", "Navy", "Red", "Blue", "Green", "Gray", "Brown", "Beige", "Pink"];
        const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
        const prodColors = [];
        const numColors = Math.floor(rng() * 4) + 1;
        for (let c = 0; c < numColors; c++) {
          const clr = colors[Math.floor(rng() * colors.length)];
          if (!prodColors.includes(clr)) prodColors.push(clr);
        }

        const prodSizes = [];
        if (category.includes("Clothing")) {
          const numSizes = Math.floor(rng() * 4) + 2;
          const startIdx = Math.floor(rng() * 3);
          for (let s = startIdx; s < startIdx + numSizes && s < sizes.length; s++) {
            prodSizes.push(sizes[s]);
          }
        }

        const variantTitle = v === 0 ? item.t : item.t + " - " + (prodColors[0] || "Edition " + (v + 1));

        const daysAgo = Math.floor(rng() * 365);
        const dateAdded = new Date(Date.now() - daysAgo * 86400000).toISOString().split("T")[0];

        products.push({
          id: id++,
          title: variantTitle,
          brand: brand,
          category: category,
          slug: slugify(category),
          price: +basePrice.toFixed(2),
          originalPrice: originalPrice,
          discount: discount,
          rating: rating,
          reviews: reviews,
          sold: sold,
          image: buildImageUrl(item.img),
          images: [
            buildImageUrl(item.img),
            buildImageUrl(item.img, 400, 500),
            buildImageUrl(item.img, 500, 400),
          ],
          colors: prodColors,
          sizes: prodSizes,
          inStock: rng() > 0.08,
          badge: discount >= 30 ? "Hot Deal" : rng() > 0.8 ? "Best Seller" : rng() > 0.85 ? "New" : "",
          description: "Premium quality " + variantTitle.toLowerCase() + " by " + brand + ". Crafted with care using the finest materials for lasting durability and style. Perfect for everyday use.",
          features: [
            "Premium quality materials",
            "Expertly crafted design",
            "Satisfaction guaranteed",
            "Easy care instructions",
          ],
          dateAdded: dateAdded,
        });
      }
    });
  });

  return products;
}

// ====================================
// FLASH DEALS
// ====================================

const flashDealItems = [
  { title: "Wireless Noise-Cancelling Headphones", img: "photo-1505740420928-5e560c06d30e", cat: "Electronics", price: 79.99, orig: 149.99, disc: 47 },
  { title: "Premium Yoga Mat 6mm", img: "photo-1544367567-0f2fcb009e0b", cat: "Sports & Outdoors", price: 24.99, orig: 49.99, disc: 50 },
  { title: "Vitamin C Brightening Serum", img: "photo-1570172619644-dfd03ed5d881", cat: "Beauty & Health", price: 14.99, orig: 34.99, disc: 57 },
  { title: "Stainless Steel Knife Set", img: "photo-1593618998160-e34014e67546", cat: "Home & Kitchen", price: 44.99, orig: 89.99, disc: 50 },
  { title: "Leather Laptop Messenger Bag", img: "photo-1548036328-c9fa89d128fa", cat: "Bags & Luggage", price: 59.99, orig: 119.99, disc: 50 },
  { title: "Floral Wrap Midi Dress", img: "photo-1572804013309-59a88b7e92f1", cat: "Women's Clothing", price: 39.99, orig: 79.99, disc: 50 },
  { title: "Sterling Silver Pendant Necklace", img: "https://images.unsplash.com/photo-AhIQL2CKq7g?w=1200&h=1200&fit=crop&auto=format&q=80", cat: "Jewelry & Accessories", price: 49.99, orig: 99.99, disc: 50 },
  { title: "Portable Power Bank 20000mAh", img: "photo-1609091839311-d5365f9ff1c5", cat: "Electronics", price: 29.99, orig: 59.99, disc: 50 },
];

export const flashDeals = flashDealItems.map((d, i) => ({
  id: 9000 + i,
  title: d.title,
  image: buildImageUrl(d.img),
  category: d.cat,
  price: d.price,
  originalPrice: d.orig,
  discount: d.disc,
  sold: Math.floor(Math.random() * 300) + 100,
  total: 500,
  rating: +(4 + Math.random()).toFixed(1),
  reviews: Math.floor(Math.random() * 500) + 50,
}));

// ====================================
// TESTIMONIALS
// ====================================

export const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    location: "New York, USA",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    rating: 5,
    text: "Absolutely love the quality of products from TwoWay Ceylon! The silk blouse I ordered exceeded my expectations. Will definitely order again.",
    date: "2 weeks ago",
  },
  {
    id: 2,
    name: "James Chen",
    location: "London, UK",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    rating: 5,
    text: "Fast shipping and the electronics are top-notch. The wireless headphones have amazing sound quality for the price. Highly recommend!",
    date: "1 month ago",
  },
  {
    id: 3,
    name: "Amara Perera",
    location: "Colombo, Sri Lanka",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    rating: 5,
    text: "Best online shopping experience in Sri Lanka! Great selection, fair prices, and the customer service team is incredibly helpful.",
    date: "3 weeks ago",
  },
  {
    id: 4,
    name: "Michael Torres",
    location: "Sydney, Australia",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    rating: 4,
    text: "The home & kitchen products are excellent quality. The cookware set I bought works beautifully and looks great in my kitchen.",
    date: "1 month ago",
  },
  {
    id: 5,
    name: "Priya Sharma",
    location: "Mumbai, India",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    rating: 5,
    text: "The jewelry collection is stunning! I ordered the sterling silver pendant and it arrived beautifully packaged. Perfect gift for my sister.",
    date: "2 months ago",
  },
  {
    id: 6,
    name: "David Kim",
    location: "Seoul, South Korea",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    rating: 5,
    text: "Incredible deals during the flash sale! I saved over 40% on electronics. The product quality is consistently high across all categories.",
    date: "3 weeks ago",
  },
];

// ====================================
// GENERATE AND EXPORT
// ====================================

export const allProducts = generateProducts();

export const getProductById = (id) => allProducts.find((p) => p.id === Number(id));

export const getProductsByCategory = (category) =>
  allProducts.filter((p) => p.category === category || p.slug === slugify(category));

export const searchProducts = (query) => {
  const q = query.toLowerCase();
  return allProducts.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
  );
};

export const categories = Object.keys(CATEGORY_DATA).map((name) => ({
  name,
  slug: slugify(name),
  count: allProducts.filter((p) => p.category === name).length,
}));

export const filterBrands = [...new Set(allProducts.map((product) => product.brand).filter(Boolean))].sort();

export const productDetails = allProducts.reduce((acc, product) => {
  acc[product.id] = {
    ...product,
    subtitle: `${product.brand} | ${product.category}`,
    categorySlug: product.slug,
    sku: `TWC-${String(product.id).padStart(4, "0")}`,
    images: product.images?.length ? product.images : [product.image].filter(Boolean),
    specifications: [
      { key: "Brand", value: product.brand || "TWOWAY Ceylon" },
      { key: "Category", value: product.category || "General" },
      { key: "Availability", value: product.inStock ? "In stock" : "Out of stock" },
    ],
    reviewsList: [],
    ratingBreakdown: {
      5: Math.max(0, Math.round((product.reviews || 0) * 0.6)),
      4: Math.max(0, Math.round((product.reviews || 0) * 0.22)),
      3: Math.max(0, Math.round((product.reviews || 0) * 0.1)),
      2: Math.max(0, Math.round((product.reviews || 0) * 0.05)),
      1: Math.max(0, Math.round((product.reviews || 0) * 0.03)),
    },
    deliveryInfo: {
      freeShipping: true,
      freeShippingMin: 50,
      estimatedDays: "3-7 business days",
      returnDays: 30,
    },
  };
  return acc;
}, {});

export const relatedProducts = allProducts.slice(0, 8);

export default allProducts;
