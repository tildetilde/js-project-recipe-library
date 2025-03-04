document.addEventListener("DOMContentLoaded", () => {
  // Spoonacular API URL to fetch 10 random vegetarian recipes
  const API_URL =
    "https://api.spoonacular.com/recipes/random?number=10&include-tags=vegetarian&apiKey=e5ce814e5cdb4cd8b978bc195ddda335";

  // Selects the container where recipes will be displayed
  const recipesGrid = document.querySelector(".recipes-grid");

  // Selects all buttons for filtering and sorting
  const kitchenBtns = document.querySelectorAll(".kitchen-btn");
  const sortBtns = document.querySelectorAll(".sort-btn");

  /**
   * Fetch recipes from Spoonacular API
   * - Uses `fetch` to get 10 random vegetarian recipes
   * - Converts the response to JSON format
   * - Calls `displayRecipes()` to show the recipes on the page
   */
  const fetchRecipes = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      console.log("API Response", data);

      displayRecipes(data.recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  };

  /**
   * Display fetched recipes in the UI
   * - Clears the existing recipes
   * - Creates a new `.recipe-card` for each fetched recipe
   * - Adds necessary data attributes for filtering and sorting
   */
  const displayRecipes = (recipes) => {
    recipesGrid.innerHTML = ""; // Clears old recipes before adding new ones

    recipes.forEach((recipe) => {
      const card = document.createElement("div");
      card.classList.add("recipe-card");

      // Store sorting and filtering attributes
      card.dataset.time = recipe.readyInMinutes ?? 0; // Cooking time
      card.dataset.popularity = recipe.spoonacularScore ?? 0; // Popularity
      card.dataset.price = recipe.pricePerServing ?? 0; // Price per serving
      card.dataset.ingredients = recipe.extendedIngredients
        ? recipe.extendedIngredients.length
        : 0; // Ingredient count
      card.dataset.cuisine = recipe.cuisines ? recipe.cuisines[0] : "unknown"; // First cuisine type
      card.dataset.diet = recipe.diets ? recipe.diets.join(", ") : "none"; // Store all diets as a string

      // Add content to the recipe card
      card.innerHTML = `
      <img src="${recipe.image}" alt="${recipe.title}">
      <h3>${recipe.title}</h3>
      <p><strong>Diet:</strong> ${
        recipe.diets ? recipe.diets.join(", ") : "None"
      }</p>
      <p><strong>Time:</strong> ${recipe.readyInMinutes} minutes</p>
      <hr>
      <h4>Ingredients:</h4>
      <ul class="ingredient-list">
        ${recipe.extendedIngredients
          .slice(0, 4) // Limits to 4 ingredients
          .map((ingredient) => `<li>${ingredient.name}</li>`)
          .join("")}
      </ul>
    `;

      recipesGrid.appendChild(card);
    });
  };

  /**
   * Filter recipes based on selected cuisine
   * - Hides recipes that do not match the selected filter
   * - Uses the `data-cuisine` attribute set in `displayRecipes()`
   */
  const filterRecipes = (filterType, filterValue) => {
    const recipeCards = document.querySelectorAll(".recipe-card");

    recipeCards.forEach((card) => {
      let shouldShow = true;

      // Filter by diet
      if (filterType === "diet" && !card.dataset.diet.includes(filterValue)) {
        shouldShow = false;
      }

      // Filter by cuisine
      if (filterType === "cuisine" && card.dataset.cuisine !== filterValue) {
        shouldShow = false;
      }

      // Filter by cooking time
      const cookingTime = parseInt(card.dataset.time);
      if (filterType === "time") {
        if (
          (filterValue === "under15" && cookingTime >= 15) ||
          (filterValue === "15-30" && (cookingTime < 15 || cookingTime > 30)) ||
          (filterValue === "30-60" && (cookingTime < 30 || cookingTime > 60)) ||
          (filterValue === "over60" && cookingTime <= 60)
        ) {
          shouldShow = false;
        }
      }

      // Filter by ingredient amount
      const ingredientsCount = parseInt(card.dataset.ingredients);
      if (filterType === "ingredients") {
        if (
          (filterValue === "under5" && ingredientsCount >= 5) ||
          (filterValue === "6-10" &&
            (ingredientsCount < 6 || ingredientsCount > 10)) ||
          (filterValue === "11-15" &&
            (ingredientsCount < 11 || ingredientsCount > 15)) ||
          (filterValue === "over16" && ingredientsCount <= 16)
        ) {
          shouldShow = false;
        }
      }

      // Show or hide based on filtering results
      if (shouldShow) {
        card.classList.remove("hidden");
      } else {
        card.classList.add("hidden");
      }
    });
  };

  /**
   * Sort recipes based on cooking time
   * - Converts `.recipe-card` elements into an array
   * - Sorts based on `data-time` (cooking time)
   * - Removes all existing recipe cards from the DOM
   * - Re-adds them in the new order
   */
  const sortRecipes = (direction, type) => {
    const recipeCards = document.querySelectorAll(".recipe-card");
    const cards = Array.from(recipeCards);

    cards.sort((a, b) => {
      const valueA = parseFloat(a.dataset[type]) || 0;
      const valueB = parseFloat(b.dataset[type]) || 0;

      if (direction === "ascending") {
        return valueA - valueB;
      } else {
        return valueB - valueA;
      }
    });

    cards.forEach((card) => card.remove());
    cards.forEach((card) => recipesGrid.appendChild(card));
  };

  /**
   * Add event listeners to filter buttons
   * - Removes "active" class from all buttons
   * - Adds "active" to the clicked button
   * - Calls `filterRecipes()` with the button's `data-cuisine` value
   */
  // kitchenBtns.forEach((btn) => {
  //   btn.addEventListener("click", () => {
  //     kitchenBtns.forEach((b) => b.classList.remove("active"));
  //     btn.classList.add("active");
  //     filterRecipes(btn.dataset.cuisine);
  //   });
  // });
  const filterBtns = document.querySelectorAll(".filter-btn");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const isActive = btn.classList.contains("active");

      // Remove active class from only buttons of the same type
      filterBtns.forEach((b) => {
        if (b.dataset.filterType === btn.dataset.filterType) {
          b.classList.remove("active");
        }
      });

      // If the button was already active, reset the filter
      if (isActive) {
        displayRecipes(currentRecipes); // Reset to show all recipes
      } else {
        // Add active class to the clicked button
        btn.classList.add("active");

        // Get filter type & value and apply filtering
        const filterType = btn.dataset.filterType;
        const filterValue = btn.dataset.filterValue;
        filterRecipes(filterType, filterValue);
      }
    });
  });
  /**
   * Add event listeners to sort buttons
   * - Removes "active" class from all buttons
   * - Adds "active" to the clicked button
   * - Calls `sortRecipes()` with the button's `data-sort` value
   */
  sortBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all sort buttons before applying to the clicked one
      sortBtns.forEach((b) => b.classList.remove("active"));

      // Add active class to clicked button
      btn.classList.add("active");

      const sortType = btn.dataset.sort; // Get sorting type (time, popularity, price, ingredients)
      const direction = btn.dataset.direction; // Get direction (ascending/descending)

      sortRecipes(direction, sortType);
    });
  });

  // Fetch recipes when the page loads
  fetchRecipes();
});
