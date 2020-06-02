export const preloadHandlebarsTemplates = async function() {

  // Define template paths to load
  const templatePaths = [

    // Actor Sheet Partials
      "systems/fortyk/templates/actor/actor-main.html",
   "systems/fortyk/templates/actor/actor-skills.html",
    "systems/fortyk/templates/actor/actor-tnt.html",
    "systems/fortyk/templates/actor/actor-exp.html",
    "systems/fortyk/templates/actor/actor-combat.html",
      "systems/fortyk/templates/actor/actor-gear.html",
      "systems/fortyk/templates/actor/actor-corruption.html",
      "systems/fortyk/templates/actor/actor-psykana.html"
      

    // Item Sheet Partials
   
  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};