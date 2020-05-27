export const preloadHandlebarsTemplates = async function() {

  // Define template paths to load
  const templatePaths = [

    // Actor Sheet Partials
   "systems/fortyk/templates/actors/actor-skills.html",
    "systems/fortyk/templates/actor/actor-tnt.html",
    "systems/fortyk/templates/actor/actor-exp.html",
    "systems/fortyk/templates/actor/actor-weapons.html",
      "systems/fortyk/templates/actor/actor-gear.html",
      "systems/fortyk/templates/actor/actor-corruption.html",
      "systems/fortyk/templates/actor/actor-psykana.html"

    // Item Sheet Partials
   
  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};