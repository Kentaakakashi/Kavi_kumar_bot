const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const { db } = require("../services/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("countdown")
        .setDescription("Manage important countdowns.")
        .addSubcommand(sub =>
            sub
                .setName("add")
                .setDescription("Add a countdown.")
                .addStringOption(option =>
                    option
                        .setName("name")
                        .setDescription("Countdown name")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("date")
                        .setDescription("YYYY-MM-DD")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName("list")
                .setDescription("View countdowns.")
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === "add") {
            const name =
                interaction.options.getString("name");

            const date =
                interaction.options.getString("date");

            const target = new Date(`${date}T00:00:00`);

            if (Number.isNaN(target.getTime())) {
                return interaction.reply({
                    content: "❌ Invalid date.",
                    ephemeral: true
                });
            }

            const ref =
                await db.collection("countdowns").add({
                    name,
                    date,
                    target,
                    createdBy: interaction.user.id,
                    createdAt: new Date()
                });

            return interaction.reply({
                content:
                    `⏳ Countdown created: **${name}**\nID: \`${ref.id}\``
            });
        }

        if (sub === "list") {
            const snapshot =
                await db.collection("countdowns").get();

            if (snapshot.empty) {
                return interaction.reply({
                    content: "⏳ No countdowns."
                });
            }

            const now = Date.now();

            const lines = snapshot.docs.map(doc => {
                const data = doc.data();

                const target =
                    data.target.toDate().getTime();

                const diff =
                    Math.max(0, target - now);

                const days =
                    Math.floor(
                        diff / (1000 * 60 * 60 * 24)
                    );

                return `⏳ **${data.name}** — ${days} days\n📅 ${data.date}`;
            });

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("⏳ Countdowns")
                        .setDescription(lines.join("\n\n"))
                ]
            });
        }
    }
};
