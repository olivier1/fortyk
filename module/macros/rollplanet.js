let tables=["Planet","Planet - Body", "Planet - Gravity", "Orbital features"];

const table = game.tables.getName(tables[1]);
await table.drawMany(1, {});
console.log(table.roll())