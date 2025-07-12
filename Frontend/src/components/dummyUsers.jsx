// src/utils/dummyUsers.js
const dummyUsers = [
  {
    id: 1,
    name: "Jane Doe",
    email: "jane.doe@example.com",
    avatar_url: "/api/placeholder/120/120",
    points: 120,
    wallet_balance: 88.5,
    member_since: "2023-01-01T00:00:00Z",
    listings: [
      {
        id: 101,
        title: "Vintage Denim Jacket",
        description: "Classic Levi's, barely worn.",
        category: "Jacket",
        subcategory: "Denim Jacket",
        brand: "Levi's",
        type: "Women",
        size: "M",
        condition: "Excellent",
        tags: ["vintage", "denim", "blue"],
        original_price: 120,
        purchase_date: "2023-02-15",
        final_price: 45,
        status: "Active",
        image_url: "/api/placeholder/300/400",
        created_at: "2023-03-01",
        views: 23
      }
    ]
  },
  {
    id: 2,
    name: "John Smith",
    email: "john.smith@example.com",
    avatar_url: "/api/placeholder/120/121",
    points: 75,
    wallet_balance: 150.0,
    member_since: "2022-11-10T00:00:00Z",
    listings: [
      {
        id: 102,
        title: "Graphic Tee",
        description: "Cool print, never worn.",
        category: "T-Shirt",
        subcategory: "Graphic Tee",
        brand: "Uniqlo",
        type: "Men",
        size: "L",
        condition: "New with Tags",
        tags: ["graphic", "cotton", "white"],
        original_price: 25,
        purchase_date: "2023-06-10",
        final_price: 12,
        status: "Active",
        image_url: "/api/placeholder/300/401",
        created_at: "2023-06-12",
        views: 8
      }
    ]
  },
  {
    id: 3,
    name: "Ava Lee",
    email: "ava.lee@example.com",
    avatar_url: "/api/placeholder/120/122",
    points: 200,
    wallet_balance: 210.75,
    member_since: "2024-01-05T00:00:00Z",
    listings: [
      {
        id: 103,
        title: "Summer Dress",
        description: "Floral, perfect for summer.",
        category: "Dress",
        subcategory: "Summer Dress",
        brand: "Zara",
        type: "Women",
        size: "S",
        condition: "Like New",
        tags: ["floral", "summer", "dress"],
        original_price: 60,
        purchase_date: "2024-02-20",
        final_price: 25,
        status: "Active",
        image_url: "/api/placeholder/300/402",
        created_at: "2024-03-01",
        views: 15
      }
    ]
  }
];

export default dummyUsers;
