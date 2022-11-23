require("dotenv").config();
const { Router } = require("express");
const axios = require("axios");
const { Recipe, Diet } = require("../db.js");
const { Op } = require("sequelize");
const { API_KEY } = process.env;

const router = Router();

router.get("/", async (req, res, next) => {
  const { title } = req.query;

  try {
    if (title) {
      const dbData = await Recipe.findAll({
        where: {
          title: {
            [Op.iLike]: `%${title.toLowerCase()}%`
          }
        },
        include: {
          model: Diet,
          through: {
            attributes: []
          }
        }
      }).catch(error => new Error("GET recipes by title from DB: ", error));

      const recipesToShowDb = dbData?.map(recipe => recipe.dataValues);

      const apiData = await axios
        .get(`https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&number=100&addRecipeInformation=true`)
        .catch(error => new Error("GET recipes by title from API: ", error));
      const recipes = apiData?.data.results;

      const recipesSearched = [];
      for (const recipe of recipes) {
        if (recipe.title.toLowerCase().includes(title.toLowerCase())) {
          recipesSearched.push(recipe);
        } else continue;
      }

      const recipesToShowApi = [];
      for (const recipe of recipesSearched) {
        recipesToShowApi.push({
          id: recipe.id,
          title: recipe.title,
          img: recipe.image,
          diets: recipe.diets,
          healthScore: recipe.healthScore
        });
      }

      recipesToShowApi?.length || recipesToShowDb?.length
        ? res.status(200).json(recipesToShowApi.concat(recipesToShowDb))
        : res.status(404).send("There is no recipe with that title");
    } else {
      const dbData = await Recipe.findAll({
        include: {
          model: Diet,
          through: {
            attributes: []
          }
        }
      }).catch(error => new Error("GET all recipes from DB: ", error));

      const apiData = await axios
        .get(`https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&number=100&addRecipeInformation=true`)
        .catch(error => new Error("GET all recipes from API: ", error));
      const recipes = apiData?.data?.results;

      const recipesToShow = [];

      if (recipes) {
        for (const recipe of recipes) {
          recipesToShow.push({
            id: recipe.id,
            title: recipe.title,
            img: recipe.image,
            diets: recipe.diets,
            healthScore: recipe.healthScore
          });
        }
      }

      recipesToShow.length || dbData?.length
        ? res.status(200).json(recipesToShow.concat(dbData))
        : res.status(404).send("Not Found: There was a problem connecting to the REST API or to the DATABASE");
    }
  } catch (error) {
    next(error);
  }
});

router.get("/:recipeId", async (req, res, next) => {
  const { recipeId } = req.params;

  try {
    if (recipeId.length > 10) {
      const dbRecipe = await Recipe.findByPk(recipeId, {
        include: {
          model: Diet,
          through: {
            attributes: []
          }
        }
      }).catch(error => new Error("GET recipe by id from DB: ", error));

      dbRecipe?.dataValues ? res.status(200).json(dbRecipe) : res.status(404).send("There is no recipe with that id");
    } else {
      const apiRecipe = await axios
        .get(`https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${API_KEY}`)
        .catch(error => new Error("GET recipe by id from API: ", error));

      const recipe = apiRecipe?.data;

      if (recipe) {
        const infoToShow = {
          id: recipe.id,
          img: recipe.image,
          title: recipe.title,
          dishTypes: recipe.dishTypes,
          diets: recipe.diets,
          summary: recipe.summary,
          healthScore: recipe.healthScore,
          steps: recipe.analyzedInstructions[0]?.steps
        };

        return res.status(200).json(infoToShow);
      } else {
        return res.status(404).send("There is no recipe with that id");
      }
    }
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  const { img, title, summary, healthScore, steps, diets } = req.body;

  try {
    if (img && typeof img !== "string") {
      return res.status(404).send("The image property must be a string");
    }
    if (!title || typeof title !== "string") {
      return res.status(404).send("The title property is required and must be a string");
    }
    if (!summary || typeof summary !== "string") {
      return res.status(404).send("The summary property is required and must be a string");
    }
    if (healthScore && typeof healthScore !== "number") {
      return res.status(404).send("The healthScore property must be a number");
    }
    if (steps && typeof steps !== "string") {
      return res.status(404).send("The steps property must be a string");
    }
    if (!diets || !Array.isArray(diets)) {
      return res.status(404).send("The diets property is required and must be an array");
    }

    const [newRecipe, created] = await Recipe.findOrCreate({
      where: {
        title: title.toLowerCase()
      },
      defaults: {
        img,
        title: title.toLowerCase(),
        summary: summary.toLowerCase(),
        healthScore,
        steps: steps.toLowerCase()
      }
    }).catch(error => new Error("POST new recipe from Recipe.findOrCreate: ", error));

    const dietsIdDb = await Diet.findAll({
      where: {
        id: {
          [Op.in]: diets.map(dietId => dietId)
        }
      }
    }).catch(error => new Error("POST new recipe from Diet.findAll: ", error));

    const dietsInfo = dietsIdDb.map(diet => diet.dataValues);

    await newRecipe.addDiets(dietsInfo.map(diet => diet.id));

    if (created) return res.status(201).json(newRecipe);
    else return res.status(404).send("There is already a recipe with that title");
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const data = await Recipe.findAll({
      where: {
        title: "Henry"
      }
    });

    if (data.length) return res.status(200).json(data);
    else return res.status(404).send("There is no recipe with that title");
  } catch (error) {
    next(error);
  }
});

module.exports = router;
