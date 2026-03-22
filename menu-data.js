const rawMenuData = [
    // --- BREAKFAST ---
    { 
        category: "breakfast", 
        name: "Oatmeal Bowl", 
        protein: 12, 
        image: "images/menu items/oats.png",
        fixed_ingredients: "Oats;Milk", 
        removable_ingredients: "Dark Chocolate;Peanut Butter", 
        choice_title: "Step 1: Milk Type", 
        choice_options: "Oat;Soy;Almond",
        choice_type: "single",
        choice_title_2: "Step 2: Extra Topping", 
        choice_options_2: "Extra Berries;Flax Seeds;None / Skip",
        choice_type_2: "multiple" 
    },
    { 
        category: "breakfast", 
        name: "Pancakes", 
        protein: 10, 
        image: "images/menu items/pankakes.png",
        fixed_ingredients: "Vegan Pancakes", 
        removable_ingredients: "Maple Syrup", 
        choice_title: "Step 1: Spread", 
        choice_options: "Dark Chocolate;Maple;Lotus Spread",
        choice_type: "single",
        choice_title_2: "Step 2: Fruit", 
        choice_options_2: "Banana;Strawberry;Blueberry",
        choice_type_2: "multiple"
    },
    { 
        category: "breakfast", 
        name: "Hummus & Crackers", 
        protein: 8, 
        image: "images/menu items/hummus.png",
        fixed_ingredients: "Crackers;Hummus", 
        removable_ingredients: "Cucumber;Pumpkin Seeds", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "breakfast", 
        name: "Avocado Toast", 
        protein: 9, 
        image: "images/menu items/avocado toast.png",
        fixed_ingredients: "Garlic Toast;Avocado", 
        removable_ingredients: "Sautéed Mushrooms", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "breakfast", 
        name: "Cornflakes & Milk", 
        protein: 7, 
        image: "images/menu items/milk.png",
        fixed_ingredients: "Cornflakes", 
        removable_ingredients: "Chocolate Chips", 
        choice_title: "Milk Type", 
        choice_options: "Oat;Soy;Almond", 
        choice_type: "single",
        choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },

    // --- LUNCH & DINNER ---
    { 
        category: "lunch", 
        name: "Lentil Pasta Bolognese", 
        protein: 18, 
        image: "images/menu items/bolo.jpeg",
        fixed_ingredients: "Pasta;Lentils", 
        removable_ingredients: "Bolognese Sauce;Onions;Garlic", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "lunch", 
        name: "Quinoa & Veggie Bowl", 
        protein: 15, 
        image: "images/menu items/QuinoaVeg.png",
        fixed_ingredients: "Quinoa;Chickpeas", 
        removable_ingredients: "Carrots;Bell Peppers;Zucchini;Potatoes", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "lunch", 
        name: "Falafel Burger", 
        protein: 16, 
        image: "images/menu items/Burger.png",
        fixed_ingredients: "Bun;Falafel Patty", 
        removable_ingredients: "Tahini;Lettuce;Tomato", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "lunch", 
        name: "Lentil Soup", 
        protein: 12, 
        image: "images/menu items/lentille soupe.png",
        fixed_ingredients: "Red Lentils;Garlic", 
        removable_ingredients: "Carrots;Potatoes", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "dinner", 
        name: "Dal Bhat Soup", 
        protein: 14, 
        image: "images/menu items/dhal.png",
        fixed_ingredients: "Lentils;Rice", 
        removable_ingredients: "Mixed Vegetables", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "dinner", 
        name: "Pumpkin Soup", 
        protein: 6, 
        image: "images/menu items/pump.png",
        fixed_ingredients: "Roasted Pumpkin", 
        removable_ingredients: "Vegetable Broth", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "dinner", 
        name: "Veggie Soup", 
        protein: 8, 
        image: "images/menu items/oats.png",
        fixed_ingredients: "Mixed Vegetables;Rice", 
        removable_ingredients: "Shariyeh", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "dinner", 
        name: "Fattoush & Grilled Potatoes", 
        protein: 7, 
        image: "images/menu items/oats.png",
        fixed_ingredients: "Fattoush;Grilled Potatoes", 
        removable_ingredients: "Pomegranate Molasses", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "dinner", 
        name: "Tabbouleh & Grilled Potatoes", 
        protein: 6, 
        image: "images/menu items/oats.png",
        fixed_ingredients: "Tabbouleh;Grilled Potatoes", 
        removable_ingredients: "", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "dinner", 
        name: "Pasta Salad & Grilled Potatoes", 
        protein: 11, 
        image: "images/menu items/oats.png",
        fixed_ingredients: "Pasta;Grilled Potatoes", 
        removable_ingredients: "Black Beans;Olives;Vegetables", 
        choice_title: "Dressing", 
        choice_options: "Lemon-Mayo;Olive Oil",
        choice_type: "single", 
        choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },

    // --- SNACKS ---
    { 
        category: "snack", 
        name: "Lazy Cake", 
        protein: 5, 
        image: "images/menu items/lazy cake.png",
        fixed_ingredients: "Banana;Oats", 
        removable_ingredients: "Peanut Butter", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "snack", 
        name: "Fruit Salad", 
        protein: 2, 
        image: "images/menu items/saladedefruit.png",
        fixed_ingredients: "Fresh Seasonal Fruits", 
        removable_ingredients: "", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "snack", 
        name: "Oat Cookie Chocolate", 
        protein: 5, 
        image: "images/menu items/cookies.png",
        fixed_ingredients: "Banana;Oats;Chocolate Flakes", 
        removable_ingredients: "Peanut Butter", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },

    // --- PROTEIN ---
    { 
        category: "protein", 
        name: "Protein Shake Plain + Cookie", 
        protein: 50, 
        image: "images/menu items/shakes.png",
        fixed_ingredients: "Vegan Protein Blend", 
        removable_ingredients: "", 
        choice_title: "Milk Type", 
        choice_options: "Oat;Soy;Almond",
        choice_type: "single",
        choice_title_2: "Cookie Flavor",
        choice_options_2: "Chocolate;Double Choc;Oatmeal",
        choice_type_2: "single"
    },
    { 
        category: "protein", 
        name: "Protein Shake Chocolate + Cookie", 
        protein: 50, 
        image: "images/menu items/shakes.png",
        fixed_ingredients: "Vegan Protein Blend (Choc)", 
        removable_ingredients: "", 
        choice_title: "Milk Type", 
        choice_options: "Oat;Soy;Almond", 
        choice_type: "single",
        choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "protein", 
        name: "Protein Shake Berries + Cookie", 
        protein: 50, 
        image: "images/menu items/shakes.png",
        fixed_ingredients: "Vegan Protein Blend (Berry)", 
        removable_ingredients: "", 
        choice_title: "Milk Type", 
        choice_options: "Oat;Soy;Almond", 
        choice_type: "single",
        choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    }
];