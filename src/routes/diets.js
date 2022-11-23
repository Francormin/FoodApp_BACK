require("dotenv").config();
const { Router } = require("express");
const axios = require("axios");
const { Diet } = require("../db.js");
const { API_KEY } = process.env;

const router = Router();

router.get("/", async (req, res, next) => {
  const dietsDb = await Diet.findAll().catch(error => new Error("GET diets from Diet.findAll(ext): ", error));

  try {
    if (dietsDb.length < 1) {
      Diet.bulkCreate([
        { name: "gluten free" },
        { name: "ketogenic" },
        { name: "vegetarian" },
        { name: "lacto ovo vegetarian" },
        { name: "vegan" },
        { name: "pescatarian" },
        { name: "paleolithic" },
        { name: "primal" },
        { name: "fodmap friendly" },
        { name: "whole 30" }
      ]).catch(error => new Error("GET diets from Diet.bulkCreate: ", error));

      res.status(200).send("The diet types have been successfully preloaded into the database");
    } else {
      const apiData = await axios
        .get(`https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&addRecipeInformation=true`)
        .catch(error => new Error("GET diets from API: ", error));
      const results = apiData?.data?.results;

      const dietsArray = [];
      for (const result of results) {
        result.vegetarian ? result.diets.push("vegetarian") : null;
        result.vegan && !result.diets.includes("vegan") ? result.diets.push("vegan") : null;
        result.glutenFree && !result.diets.includes("gluten free") ? result.diets.push("gluten free") : null;
        dietsArray.push(result.diets);
      }

      const apiDiets = [];
      for (const diet of dietsArray) {
        for (const string of diet) {
          if (!apiDiets.includes(string)) {
            apiDiets.push(string);
          }
          continue;
        }
      }

      for (const diet of apiDiets) {
        const [,] = await Diet.findOrCreate({
          where: {
            name: diet
          },
          defaults: {
            name: diet
          }
        }).catch(error => new Error("GET diets from Diet.findOrCreate: ", error));
      }

      const diets = await Diet.findAll().catch(error => new Error("GET diets from Diet.findAll(int): ", error));

      res.status(200).json(diets);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
