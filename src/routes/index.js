const { Router } = require("express");
// Importar todos los routers;
const recipesRoute = require("./recipes");
const dietsRoute = require("./diets");

const router = Router();

// Configurar los routers
router.use("/recipes", recipesRoute);
router.use("/diets", dietsRoute);

module.exports = router;
