const {
    REST,
    Routes
} = require("discord.js");

const commands = [
    require("./commands/event"),
    require("./commands/bucket"),
    require("./commands/letitout"),
    require("./commands/stats"),
    require("./commands/trivia"),
    require("./commands/countdown"),
    require("./commands/achievements")
];

const rest = new REST({ version: "10" })
    .setToken(process.env.DISCORD_TOKEN);

const commandData =
    commands.map(command => command.data.toJSON());

(async () => {
    try {
        console.log("Registering slash commands...");

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            {
                body: commandData
            }
        );

        console.log("Slash commands registered.");
    } catch (error) {
        console.error(error);
    }
})();
