const rawMenuData = [
    // --- BREAKFAST ---
    { 
        category: "breakfast", 
        name: "Oatmeal Bowl", 
        protein: 18, 
        Kcal : 450,
        image: "images/menu items/oats.png",
        fixed_ingredients: "Oats;Milk", 
        removable_ingredients: "Dark Chocolate;Peanut Butter", 
        choice_title: "Step 1: Milk Type", 
        choice_options: "Oat;Soy;Almond",
        choice_type: "single",
        choice_title_2: "Step 2: Extra Topping", 
        choice_options_2: "Extra Berries;Banana;None / Skip",
        choice_type_2: "multiple" 
    },
    
    { 
        category: "breakfast", 
        name: "Hummus & Crackers", 
        protein: 15, 
        Kcal : 400,
        image: "images/menu items/hummus.png",
        fixed_ingredients: "Crackers;Hummus", 
        removable_ingredients: "Cucumber;Pumpkin Seeds", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "breakfast", 
        name: "Pancakes", 
        protein: 8, 
        Kcal : 400,
        image: "images/menu items/pankakes.png",
        fixed_ingredients: "Vegan Pancakes mix", 
        removable_ingredients: "", 
        choice_title: "Step 1: Spread", 
        choice_options: "Dark Chocolate;Maple;Lotus Spread;Vegan Nutella*",
        choice_type: "single",
        choice_title_2: "Step 2: Fruit", 
        choice_options_2: "Banana;Blueberry",
        choice_type_2: "multiple"
    },
    { 
        category: "breakfast", 
        name: "Avocado Toast", 
        protein: 7, 
        Kcal: 250,
        image: "images/menu items/avocado toast.png",
        fixed_ingredients: "Garlic Infused Toast;Avocado", 
        removable_ingredients: "Sautéed Mushrooms;Herbs", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
        { 
        category: "breakfast", 
        name: "Croissant", 
        protein: 9, 
        Kcal: 400 ,
        image: "images/menu items/croissant1.png",
        fixed_ingredients: "Croissant dough", 
        removable_ingredients: "", 
        choice_title: "Filling", 
        choice_options: "Plain;Chocolat;Zaatar", 
        choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "breakfast", 
        name: "Cornflakes & Milk", 
        protein: 15, 
        Kcal: 400,
        image: "images/menu items/milk.png",
        fixed_ingredients: "Cornflakes;Milk",
        removable_ingredients: "", 
        choice_title: "Milk Type", 
        choice_options: "Oat;Soy;Almond", 
        choice_type: "single",
        choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },

    // --- LUNCH & DINNER ---
     { 
        category: "lunch", 
        name: "Lahm Baajin", 
        protein: 26,
        Kcal: 600, 
        image: "images/menu items/lahm.png",
        fixed_ingredients: "Flat Bread;Soy Chunks;Spices;Pomegranate Molasses;Onions;Lemon;Olive Oil", 
        removable_ingredients: "", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "lunch", 
        name: "Rice & Steamed Veggies with Soy Sauce", 
        protein: 10, 
        Kcal: 380,
        image: "images/menu items/veggies with rice.png",
        fixed_ingredients: "Rice;Soy Sauce", 
        removable_ingredients: "Potato;Carrotss;Broccoli;Zucchini", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "lunch", 
        name: "Quinoa & Veggie Bowl", 
        protein: 15, 
        Kcal: 400,
        image: "images/menu items/quinoa.png",
        fixed_ingredients: "Quinoa", 
        removable_ingredients: "Carrots;Bell Peppers;Zucchini;Potatoes;Chickpeas", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "lunch", 
        name: "Falafel Burger", 
        protein: 21, 
        Kcal : 600,
        image: "images/menu items/burger.png",
        fixed_ingredients: "Bun;Falafel Patty", 
        removable_ingredients: "Tahini;Lettuce;Tomato", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "lunch", 
        name: "Lentil Soup", 
        protein: 22, 
        Kcal: 350,
        image: "images/menu items/lentille soupe.png",
        fixed_ingredients: "Red Lentils;Garlic", 
        removable_ingredients: "Carrots;Potato", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "dinner", 
        name: "Himalayan Dal Bhat Soup", 
        protein: 19,
        Kcal: 450, 
        image: "images/menu items/dal baht.png",
        fixed_ingredients: "Lentils;Rice", 
        removable_ingredients: "potato;carrot;zucchini;Chilly sauce", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "dinner", 
        name: "Veggie Noodles", 
        protein: 12,
        Kcal: 400, 
        image: "images/menu items/pasta noodles.png",
        fixed_ingredients: "Noodles", 
        removable_ingredients: "Carrots;Garlic;BellPepper;Cabbage;Soy Sauce; Seaseme Seeds", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "dinner", 
        name: "Veggie Soup", 
        protein: 6, 
        Kcal : 150,
        image: "images/menu items/veggie soup.png",
        fixed_ingredients: "", 
        removable_ingredients: "Shariyeh;Rice;Zucchini;Carrots;Potato;Broccoli", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "dinner", 
        name: "Fattoush & Grilled Potatoes", 
        protein: 9, 
        Kcal: 450,
        image: "images/menu items/fattoush.png",
        fixed_ingredients: "Fattoush;Grilled Potatoes", 
        removable_ingredients: "Pomegranate Molasses", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "dinner", 
        name: "Tabbouleh & Grilled Potatoes", 
        protein: 8,
        Kcal: 350, 
        image: "images/menu items/tabbouleh.png",
        fixed_ingredients: "Tabbouleh;Grilled Potatoes", 
        removable_ingredients: "", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "dinner", 
        name: "Pasta Salad & Grilled Potatoes", 
        protein: 22,
        Kcal: 650,
        image: "images/menu items/pasta salad.png",
        fixed_ingredients: "Pasta;Grilled Potatoes", 
        removable_ingredients: "Black Beans;Olives;Cucumber;Carrots;Tomato;Corn", 
        choice_title: "Dressing", 
        choice_options: "Mustard-Mayo-Lemon;Lemon-Olive Oil",
        choice_type: "single", 
        choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },

    // --- SNACKS ---
    { 
        category: "snack", 
        name: "Lazy Cake", 
        protein: 5, 
        Kcal: 400,
        image: "images/menu items/lazy cake.png",
        fixed_ingredients: "Cacao;Biscuits,Coconut Oil, Vgean Milk", 
        removable_ingredients: "", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "snack", 
        name: "Fruit Salad", 
        protein: 2,
        Kcal: 130, 
        image: "images/menu items/saladde de fruit.png",
        fixed_ingredients: "Fresh Seasonal Fruits", 
        removable_ingredients: "", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "snack", 
        name: "Oat Cookie Chocolate", 
        protein: 5, 
        Kcal: 190,
        image: "images/menu items/cookies.png",
        fixed_ingredients: "Banana;Oats;Chocolate Flakes", 
        removable_ingredients: "Peanut Butter", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "snack", 
        name: "Fresh Orange Juice", 
        protein: 1, 
        Kcal: 120,
        image: "images/menu items/orange juice.png",
        fixed_ingredients: "Fresh Orange", 
        removable_ingredients: "", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    },
    { 
        category: "snack", 
        name: "Mixed Nuts", 
        protein: 12,
        Kcal : 440,
        image: "images/menu items/nuts.png",
        fixed_ingredients: "Almonds;Pumpkin Seeds;Wallnuts;Raisin", 
        removable_ingredients: "", 
        choice_title: "", choice_options: "", choice_type: "", choice_title_2: "", choice_options_2: "", choice_type_2: "" 
    }, 


    // --- PROTEIN ---
    { 
        category: "protein", 
        name: "Protein Shake Plain 35g + Protein Cookie 15g", 
        protein: 50, 
        Kcal: 600,
        image: "images/menu items/shakes.png",
        fixed_ingredients: "Vegan Protein Blend", 
        removable_ingredients: "", 
        choice_title: "Cookie Flavor", 
        choice_options: "Plain;Chocolate;Berries",
        choice_type: "single"
    },
  { 
        category: "protein", 
        name: "Protein Shake Chocolate 35g + Protein Cookie 15g", 
        protein: 50, 
        Kcal: 600,
        image: "images/menu items/shakes.png",
        fixed_ingredients: "Vegan Protein Blend", 
        removable_ingredients: "", 
        choice_title: "Cookie Flavor", 
        choice_options: "Plain;Chocolate;Berries",
        choice_type: "single"
    },  { 
        category: "protein", 
        name: "Protein Shake Berries 35g + Protein Cookie 15g", 
        protein: 50, 
        Kcal: 600,
        image: "images/menu items/shakes.png",
        fixed_ingredients: "Vegan Protein Blend", 
        removable_ingredients: "", 
        choice_title: "Cookie Flavor", 
        choice_options: "Plain;Chocolate;Berries",
        choice_type: "single"
    },
];