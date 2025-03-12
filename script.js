document.addEventListener("DOMContentLoaded", () => {
  const API_URL =
    "https://api.spoonacular.com/recipes/random?number=102&include-tags=vegetarian&apiKey=76c7e57bf79245a0a12a395c3fdb2f0b";
  const recipesGrid = document.querySelector(".recipes-grid");
  const filterDropdown = document.querySelector(".filter-dropdown");
  const sortDropdown = document.querySelector(".sort-dropdown");
  const getRandomRecipe = document.querySelector(".random-btn");
  const randomButtonContainer = document.querySelector(
    ".random-button-container"
  );
  let activeRecipes = [];
  let allRecipes = [];
  let isLoading = false;

  getRandomRecipe.addEventListener("click", () => {
    if (activeRecipes.length === 0) return;
    // if this is true stop here
    const randomIndex = Math.floor(Math.random() * activeRecipes.length);
    const randomRecipe = activeRecipes[randomIndex];
    displayRecipes([randomRecipe]);
  });

  window.addEventListener("scroll", async () => {
    if (isLoading) return;

    if (
      window.innerHeight + window.scrollY >=
      document.body.offsetHeight - 50
    ) {
      isLoading = true;
      await loadMoreRecipes();
      isLoading = false;
    }
  });

  const loadMoreRecipes = async () => {
    const loader = document.getElementById("loader");
    loader.style.display = "block"; // Show the spinner while loading

    const newRecipes = await fetchRecipes();

    if (newRecipes.length > 0) {
      activeRecipes = [...activeRecipes, ...newRecipes]; // Append new recipes
      displayRecipes(activeRecipes);
    }

    loader.style.display = "none"; // Hide the spinner after fetching
  };

  document.querySelectorAll(".dropdown-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
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

      if (response.status === 402) {
        showQuotaExceededMessage();
        return;
      }

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
      recipesGrid.classList.add("no-recipes-active");
      randomButtonContainer.classList.add("hidden");
      recipesGrid.innerHTML = `<div class="no-recipes">
    <img src="computersaysno.gif" alt="No recipes match your filters.">
    <p>No recipes match the filters. Sorry ♥️! </p>
    <button class="reset-filters-btn">Reset Filters</button>
      </div>
      `;

      document
        .querySelector(".reset-filters-btn")
        .addEventListener("click", resetFilters);

      return;
    }
    recipesGrid.classList.remove("no-recipes-active");
    randomButtonContainer.classList.remove("hidden");
    randomButtonContainer.style.display = "flex";

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

  const resetFilters = () => {
    // Uncheck all checkboxes
    document
      .querySelectorAll('input[type="checkbox"], input[type="radio"]')
      .forEach((input) => {
        input.checked = false;
      });

    // Show all recipes again
    displayRecipes(allRecipes);
  };

  const showQuotaExceededMessage = () => {
    // Hide the loader in case it's still visible
    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";

    // Replace recipe grid content with the quota message
    recipesGrid.innerHTML = "";

    const quotaMessage = document.querySelector(".quota-message");
    if (quotaMessage) {
      quotaMessage.classList.add("show");
    }
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
    const loader = document.getElementById("loader");
    loader.style.display = "block"; // Show the spinner
    randomButtonContainer.style.display = "none";

    try {
      if (allRecipes.length === 0) {
        allRecipes = await fetchRecipes();
      }
      const recipes = allRecipes;
      const filteredRecipes = filterRecipes(recipes);
      const sortedRecipes = sortRecipes(filteredRecipes);
      activeRecipes = sortedRecipes;

      displayRecipes(sortedRecipes);
    } catch (error) {
      console.error("Error updating recipes:", error);
    } finally {
      loader.style.display = "none"; // Hide the spinner after fetching
    }
  };

  filterDropdown.addEventListener("change", updateRecipes);
  sortDropdown.addEventListener("change", updateRecipes);

  console.log("Update Recipes:", activeRecipes.length);

  updateRecipes();
});
