document.addEventListener("DOMContentLoaded", () => {
  const API_URL =
    "https://api.spoonacular.com/recipes/random?number=10&include-tags=vegetarian&apiKey=76c7e57bf79245a0a12a395c3fdb2f0b";
  const recipesGrid = document.querySelector(".recipes-grid");
  const filterDropdown = document.querySelector(".filter-dropdown");
  const sortDropdown = document.querySelector(".sort-dropdown");
  let activeRecipes = [];
  const getRandomRecipe = document.querySelector(".random-btn");
  let allRecipes = [];

  getRandomRecipe.addEventListener("click", () => {
    if (activeRecipes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * activeRecipes.length);
    const randomRecipe = activeRecipes[randomIndex];
    displayRecipes([randomRecipe]);
  });

  document.querySelectorAll(".dropdown-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Close any other open dropdown before opening this one
      document.querySelectorAll(".dropdown-content").forEach((content) => {
        if (content !== btn.nextElementSibling) {
          content.style.display = "none"; // Close other dropdowns
        }
      });

      document.querySelectorAll(".dropdown-btn").forEach((otherBtn) => {
        if (otherBtn !== btn) {
          otherBtn.classList.remove("active"); // Remove active state from other buttons
        }
      });

      btn.classList.toggle("active");
      const content = btn.nextElementSibling;
      content.style.display =
        content.style.display === "block" ? "none" : "block";
    });
  });

  document.addEventListener("click", (e) => {
    if (
      !e.target.matches(".dropdown-btn") &&
      !e.target.closest(".dropdown-content")
    ) {
      document.querySelectorAll(".dropdown-content").forEach((content) => {
        content.style.display = "none";
      });
      document.querySelectorAll(".dropdown-btn").forEach((btn) => {
        btn.classList.remove("active");
      });
    }
  });

  const fetchRecipes = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      return data.recipes;
    } catch (error) {
      console.error("Error fetching recipes:", error);
      return [];
    }
  };

  const displayRecipes = (recipes) => {
    recipesGrid.innerHTML = "";
    // recipes = [{}, {}, {}, {}]
    if (recipes.length === 0) {
      recipesGrid.innerHTML =
        '<img src="notamatch.gif" alt="No recipes match your filters.">';
      return;
    }

    recipes.forEach((recipe) => {
      // {
      //   extendedIngredients [
      //     { name }
      //   ]
      // }

      const card = document.createElement("div");
      card.classList.add("recipe-card");
      card.innerHTML = `
        <img src="${recipe.image}" alt="${recipe.title}">
        <div class="recipe-content">
          <h3 class="recipe-title">${recipe.title}</h3>
          <p class="recipe-meta">Cuisine: ${
            recipe.cuisines.join(", ") || "Not specified"
          }</p>
          <p class="recipe-meta">Time: ${recipe.readyInMinutes} min</p>

          <h4 class="recipe-subtitle">Ingredients</h4>
          <ul class="ingredient-list">
            ${recipe.extendedIngredients
              .slice(0, 4)
              .map(
                (ingredient) =>
                  `<li class="ingredient-list-item">${ingredient.name}</li>`
              )
              .join("")}
          </ul>
        </div>
      `;
      recipesGrid.appendChild(card);
    });
  };

  const filterRecipes = (recipes) => {
    const filters = {
      diet: Array.from(
        document.querySelectorAll('input[name="diet"]:checked')
      ).map((el) => el.value),
      cuisine: Array.from(
        document.querySelectorAll('input[name="cuisine"]:checked')
      ).map((el) => el.value),
      time: Array.from(
        document.querySelectorAll('input[name="time"]:checked')
      ).map((el) => el.value),
    };

    return recipes.filter((recipe) => {
      const dietMatch =
        filters.diet.length === 0 ||
        filters.diet.some((diet) => recipe.diets.includes(diet));
      const cuisineMatch =
        filters.cuisine.length === 0 ||
        filters.cuisine.some((cuisine) => recipe.cuisines.includes(cuisine));
      const timeMatch =
        filters.time.length === 0 ||
        filters.time.includes(getTimeCategory(recipe.readyInMinutes));
      return dietMatch && cuisineMatch && timeMatch;
    });
  };

  const sortRecipes = (recipes) => {
    const sortMethod = document.querySelector(
      'input[name="sort"]:checked'
    )?.value;
    if (!sortMethod) return recipes;

    const [property, direction] = sortMethod.split("-");
    return recipes.sort((a, b) => {
      let valueA, valueB;
      switch (property) {
        case "time":
          valueA = a.readyInMinutes;
          valueB = b.readyInMinutes;
          break;
        case "popularity":
          valueA = a.aggregateLikes;
          valueB = b.aggregateLikes;
          break;
        case "price":
          valueA = a.pricePerServing;
          valueB = b.pricePerServing;
          break;
        default:
          return 0;
      }
      return direction === "asc" ? valueA - valueB : valueB - valueA;
    });
  };

  const getTimeCategory = (time) => {
    if (time < 15) return "under15";
    if (time >= 15 && time <= 30) return "15-30";
    if (time > 30 && time <= 60) return "30-60";
    return "over60";
  };

  const updateRecipes = async () => {
    if (allRecipes.length === 0) {
      allRecipes = await fetchRecipes();
    }
    const recipes = allRecipes;
    const filteredRecipes = filterRecipes(recipes);
    const sortedRecipes = sortRecipes(filteredRecipes);
    activeRecipes = sortedRecipes;
    displayRecipes(sortedRecipes);
  };

  filterDropdown.addEventListener("change", updateRecipes);
  sortDropdown.addEventListener("change", updateRecipes);

  updateRecipes();
});
