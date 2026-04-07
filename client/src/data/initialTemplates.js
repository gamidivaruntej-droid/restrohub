export const initialTemplates = [
    // Waiter
    {
        id: 'w1',
        title: 'Take Customer Order',
        description: 'Accurately record food and beverage orders from guests using the POS system.',
        role: 'Waiter',
        priority: 'High',
        estimatedTime: '5 min',
        assignedBy: 'System',
        tables: [4, 7],
        notes: 'Table 4 requested extra napkins.'
    },
    {
        id: 'w2',
        title: 'Serve Food',
        description: 'Deliver prepared dishes to the correct tables promptly and professionally.',
        role: 'Waiter',
        priority: 'High',
        estimatedTime: '3 min',
        assignedBy: 'Manager',
        tables: [12],
        notes: 'Hot plates - use caution.'
    },
    {
        id: 'w3',
        title: 'Serve Beverages',
        description: 'Deliver drinks to guests, ensuring correct temperatures and presentation.',
        role: 'Waiter',
        priority: 'Medium',
        estimatedTime: '2 min',
        assignedBy: 'System',
        tables: [4, 7, 12]
    },
    {
        id: 'w4',
        title: 'Deliver Bill',
        description: 'Present the final bill to guests upon request or after meal completion.',
        role: 'Waiter',
        priority: 'Medium',
        estimatedTime: '2 min',
        assignedBy: 'System',
        tables: [15]
    },
    {
        id: 'w5',
        title: 'Process Payment',
        description: 'Handle cash, card, or mobile payments and provide receipts.',
        role: 'Waiter',
        priority: 'High',
        estimatedTime: '4 min',
        assignedBy: 'System',
        tables: [15]
    },
    {
        id: 'w6',
        title: 'Clear Table',
        description: 'Remove used dishes, glassware, and cutlery once guests have finished.',
        role: 'Waiter',
        priority: 'Low',
        estimatedTime: '3 min',
        assignedBy: 'System',
        tables: [1, 2, 3]
    },
    {
        id: 'w7',
        title: 'Reset Table',
        description: 'Clean surface and set up fresh cutlery and linens for the next guests.',
        role: 'Waiter',
        priority: 'Low',
        estimatedTime: '4 min',
        assignedBy: 'System'
    },
    {
        id: 'w8',
        title: 'Handle Customer Request',
        description: 'Address special needs, extra items, or environment adjustments.',
        role: 'Waiter',
        priority: 'Medium',
        estimatedTime: '3 min',
        assignedBy: 'Manager',
        tables: [8],
        notes: 'Customer requested extra spicy food.'
    },
    {
        id: 'w9',
        title: 'Handle Complaint',
        description: 'Listen to guest concerns and resolve issues or escalate to manager.',
        role: 'Waiter',
        priority: 'High',
        estimatedTime: '10 min',
        assignedBy: 'System'
    },
    {
        id: 'w10',
        title: 'Assist Customer Seating',
        description: 'Welcome guests and guide them to their assigned or preferred tables.',
        role: 'Waiter',
        priority: 'Low',
        estimatedTime: '2 min',
        assignedBy: 'Manager'
    },
    {
        id: 'w11',
        title: 'Provide Menu Explanation',
        description: 'Detail ingredients, preparation methods, and dietary information.',
        role: 'Waiter',
        priority: 'Medium',
        estimatedTime: '5 min',
        assignedBy: 'System'
    },
    {
        id: 'w12',
        title: 'Upsell Special Items',
        description: 'Recommend daily specials, appetizers, or premium beverages.',
        role: 'Waiter',
        priority: 'Low',
        estimatedTime: '2 min',
        assignedBy: 'System'
    },
    {
        id: 'w13',
        title: 'Clean Assigned Section',
        description: 'Maintain tidiness and hygiene in the designated dining area.',
        role: 'Waiter',
        priority: 'Medium',
        estimatedTime: '15 min',
        assignedBy: 'Manager'
    },
    {
        id: 'w14',
        title: 'Report Section Status',
        description: 'Brief the manager on table turnover and any notable incidents.',
        role: 'Waiter',
        priority: 'Low',
        estimatedTime: '5 min',
        assignedBy: 'System'
    },

    // Kitchen Staff
    {
        id: 'k1',
        title: 'Prepare Order',
        description: 'Organize ingredients and equipment for incoming meal orders.',
        role: 'Kitchen Staff',
        priority: 'High',
        estimatedTime: '10 min',
        assignedBy: 'System'
    },
    {
        id: 'k2',
        title: 'Chop Ingredients',
        description: 'Precise cutting of vegetables, meats, and herbs for mise en place.',
        role: 'Kitchen Staff',
        priority: 'Medium',
        estimatedTime: '20 min',
        assignedBy: 'System'
    },
    {
        id: 'k3',
        title: 'Cook Dish',
        description: 'Execute cooking techniques as per standardized recipes.',
        role: 'Kitchen Staff',
        priority: 'High',
        estimatedTime: '15 min',
        assignedBy: 'System'
    },
    {
        id: 'k4',
        title: 'Plate Dish',
        description: 'Arrange food on plates ensuring aesthetic appeal and portion control.',
        role: 'Kitchen Staff',
        priority: 'High',
        estimatedTime: '3 min',
        assignedBy: 'System'
    },
    {
        id: 'k5',
        title: 'Garnish Dish',
        description: 'Add final structural or flavor accents to the completed plate.',
        role: 'Kitchen Staff',
        priority: 'Low',
        estimatedTime: '1 min',
        assignedBy: 'System'
    },
    {
        id: 'k6',
        title: 'Update Order Status',
        description: 'Mark orders as "In Progress" or "Ready" in the kitchen display.',
        role: 'Kitchen Staff',
        priority: 'Medium',
        estimatedTime: '1 min',
        assignedBy: 'System'
    },
    {
        id: 'k7',
        title: 'Handle Special Request',
        description: 'Adjust recipes for allergies, preferences, or dietary restrictions.',
        role: 'Kitchen Staff',
        priority: 'High',
        estimatedTime: '5 min',
        assignedBy: 'Manager',
        notes: 'Gluten-free requirement for Order #402.'
    },
    {
        id: 'k8',
        title: 'Prioritize Urgent Order',
        description: 'Manage workflow to fast-track "Rush" or re-made items.',
        role: 'Kitchen Staff',
        priority: 'High',
        estimatedTime: '5 min',
        assignedBy: 'Manager'
    },
    {
        id: 'k9',
        title: 'Verify Completed Order',
        description: 'Final check for quality, temperature, and order accuracy.',
        role: 'Kitchen Staff',
        priority: 'Medium',
        estimatedTime: '2 min',
        assignedBy: 'System'
    },
    {
        id: 'k10',
        title: 'Check Ingredient Stock',
        description: 'Monitor levels of essential supplies in the immediate station.',
        role: 'Kitchen Staff',
        priority: 'Medium',
        estimatedTime: '10 min',
        assignedBy: 'System'
    },
    {
        id: 'k11',
        title: 'Report Low Inventory',
        description: 'Notify the head chef or manager of items nearing depletion.',
        role: 'Kitchen Staff',
        priority: 'High',
        estimatedTime: '2 min',
        assignedBy: 'System'
    },
    {
        id: 'k12',
        title: 'Clean Cooking Station',
        description: 'Wipe surfaces and clear debris throughout the shift.',
        role: 'Kitchen Staff',
        priority: 'Medium',
        estimatedTime: '10 min',
        assignedBy: 'System'
    },
    {
        id: 'k13',
        title: 'Sanitize Utensils',
        description: 'Wash and disinfect knives, pans, and shared tools.',
        role: 'Kitchen Staff',
        priority: 'High',
        estimatedTime: '15 min',
        assignedBy: 'System'
    },

    // Cleaner
    {
        id: 'c1',
        title: 'Clean Table',
        description: 'Sanitize table surfaces and chair armrests after guests leave.',
        role: 'Cleaner',
        priority: 'Medium',
        estimatedTime: '5 min',
        assignedBy: 'System'
    },
    {
        id: 'c2',
        title: 'Mop Floor',
        description: 'Wet-clean hard floor surfaces to remove stains and spills.',
        role: 'Cleaner',
        priority: 'High',
        estimatedTime: '30 min',
        assignedBy: 'System'
    },
    {
        id: 'c3',
        title: 'Sweep Area',
        description: 'Remove dry debris and dust from floors using brooms or vacuums.',
        role: 'Cleaner',
        priority: 'Low',
        estimatedTime: '15 min',
        assignedBy: 'System'
    },
    {
        id: 'c4',
        title: 'Clean Restrooms',
        description: 'Sanitize toilets, sinks, mirrors, and restock disposables.',
        role: 'Cleaner',
        priority: 'High',
        estimatedTime: '20 min',
        assignedBy: 'Manager'
    },
    {
        id: 'c5',
        title: 'Wash Utensils',
        description: 'Operate industrial dishwasher and hand-wash delicate items.',
        role: 'Cleaner',
        priority: 'High',
        estimatedTime: '45 min',
        assignedBy: 'System'
    },
    {
        id: 'c6',
        title: 'Dispose Garbage',
        description: 'Empty bins and transport waste to the external collection point.',
        role: 'Cleaner',
        priority: 'Medium',
        estimatedTime: '10 min',
        assignedBy: 'System'
    },
    {
        id: 'c7',
        title: 'Clean Spillage',
        description: 'Immediate response to liquid or food spills for safety.',
        role: 'Cleaner',
        priority: 'High',
        estimatedTime: '5 min',
        assignedBy: 'System'
    },
    {
        id: 'c8',
        title: 'Sanitize Area',
        description: 'Broad application of disinfectant to high-touch surfaces.',
        role: 'Cleaner',
        priority: 'High',
        estimatedTime: '15 min',
        assignedBy: 'System'
    },
    {
        id: 'c9',
        title: 'Deep Clean Section',
        description: 'Thorough cleaning of vents, baseboards, and hidden corners.',
        role: 'Cleaner',
        priority: 'Medium',
        estimatedTime: '60 min',
        assignedBy: 'System'
    },
    {
        id: 'c10',
        title: 'Final Floor Inspection',
        description: 'Walkthrough to ensure all areas meet hygiene standards.',
        role: 'Cleaner',
        priority: 'Low',
        estimatedTime: '10 min',
        assignedBy: 'Manager'
    },

    // Cashier
    {
        id: 'ca1',
        title: 'Generate Bill',
        description: 'Consolidate order items into a final invoice for the guest.',
        role: 'Cashier',
        priority: 'High',
        estimatedTime: '2 min',
        assignedBy: 'System'
    },
    {
        id: 'ca2',
        title: 'Process Payment',
        description: 'Securely handle transactions and verify payment authorization.',
        role: 'Cashier',
        priority: 'High',
        estimatedTime: '3 min',
        assignedBy: 'System'
    },
    {
        id: 'ca3',
        title: 'Print Invoice',
        description: 'Provide physical or digital copies of the receipt to the guest.',
        role: 'Cashier',
        priority: 'Medium',
        estimatedTime: '1 min',
        assignedBy: 'System'
    },
    {
        id: 'ca4',
        title: 'Apply Discounts',
        description: 'Process vouchers, loyalty points, or promotional offers.',
        role: 'Cashier',
        priority: 'Low',
        estimatedTime: '2 min',
        assignedBy: 'System'
    },
    {
        id: 'ca5',
        title: 'Handle Cash',
        description: 'Manage drawer intake, provide change, and organize currency.',
        role: 'Cashier',
        priority: 'High',
        estimatedTime: 'Ongoing',
        assignedBy: 'System'
    },
    {
        id: 'ca6',
        title: 'Update POS System',
        description: 'Sync transaction data and update inventory if applicable.',
        role: 'Cashier',
        priority: 'Medium',
        estimatedTime: '5 min',
        assignedBy: 'System'
    },
    {
        id: 'ca7',
        title: 'Close Cash Counter',
        description: 'Final count of drawer and preparation for bank deposit.',
        role: 'Cashier',
        priority: 'High',
        estimatedTime: '20 min',
        assignedBy: 'Manager'
    },
    {
        id: 'ca8',
        title: 'Report Daily Revenue',
        description: 'Summarize total sales and payment methods for management.',
        role: 'Cashier',
        priority: 'High',
        estimatedTime: '15 min',
        assignedBy: 'System'
    },
    {
        id: 'ca9',
        title: 'Resolve Billing Issue',
        description: 'Correct errors, handle double charges, or adjust invoices.',
        role: 'Cashier',
        priority: 'High',
        estimatedTime: '10 min',
        assignedBy: 'System'
    },
    {
        id: 'ca10',
        title: 'Handle Refund Request',
        description: 'Process returns or reversals as per restaurant policy.',
        role: 'Cashier',
        priority: 'High',
        estimatedTime: '10 min',
        assignedBy: 'Manager'
    },

    // Manager
    {
        id: 'm1',
        title: 'Assign Task',
        description: 'Distribute operational duties to staff based on skill and load.',
        role: 'Manager',
        priority: 'High',
        estimatedTime: '15 min',
        assignedBy: 'System'
    },
    {
        id: 'm2',
        title: 'Monitor Staff Status',
        description: 'Oversee performance and wellbeing of the team on duty.',
        role: 'Manager',
        priority: 'High',
        estimatedTime: 'Ongoing',
        assignedBy: 'System'
    },
    {
        id: 'm3',
        title: 'Approve Leave',
        description: 'Review and decide on time-off requests in the system.',
        role: 'Manager',
        priority: 'Medium',
        estimatedTime: '10 min',
        assignedBy: 'System'
    },
    {
        id: 'm4',
        title: 'Modify Shift',
        description: 'Adjust schedule start/end times for operational needs.',
        role: 'Manager',
        priority: 'Medium',
        estimatedTime: '5 min',
        assignedBy: 'System'
    },
    {
        id: 'm5',
        title: 'Review Daily Report',
        description: 'Analyze sales, feedback, and incident logs from the shift.',
        role: 'Manager',
        priority: 'High',
        estimatedTime: '30 min',
        assignedBy: 'System'
    },
    {
        id: 'm6',
        title: 'Check Attendance',
        description: 'Verify check-in/out logs and address tardiness issues.',
        role: 'Manager',
        priority: 'High',
        estimatedTime: '10 min',
        assignedBy: 'System'
    },
    {
        id: 'm7',
        title: 'Handle Escalations',
        description: 'Resolve high-level conflicts or severe customer complaints.',
        role: 'Manager',
        priority: 'High',
        estimatedTime: 'Variable',
        assignedBy: 'System'
    },
    {
        id: 'm8',
        title: 'Manage Default Tasks',
        description: 'Refine the task templates for all roles to optimize operations.',
        role: 'Manager',
        priority: 'Medium',
        estimatedTime: '20 min',
        assignedBy: 'System'
    },
    {
        id: 'm9',
        title: 'Update System Settings',
        description: 'Configure restaurant-wide parameters and permissions.',
        role: 'Manager',
        priority: 'Low',
        estimatedTime: '15 min',
        assignedBy: 'System'
    }
];
