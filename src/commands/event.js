const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const { db } = require("../services/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("event")
        .setDescription("Manage relationship memories.")

        .addSubcommand(sub =>
            sub
                .setName("add")
                .setDescription("Save a new relationship memory.")
                .addStringOption(option =>
                    option
                        .setName("date")
                        .setDescription("Memory date — YYYY-MM-DD")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("title")
                        .setDescription("Memory title")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("details")
                        .setDescription("What happened?")
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName("list")
                .setDescription("View saved memories.")
        )

        .addSubcommand(sub =>
            sub
                .setName("show")
                .setDescription("View a specific memory.")
                .addStringOption(option =>
                    option
                        .setName("id")
                        .setDescription("Memory ID")
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub
                .setName("remove")
                .setDescription("Delete a memory.")
                .addStringOption(option =>
                    option
                        .setName("id")
                        .setDescription("Memory ID")
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        // =========================
        // ADD MEMORY
        // =========================

        if (sub === "add") {
            const date =
                interaction.options.getString("date");

            const title =
                interaction.options.getString("title");

            const details =
                interaction.options.getString("details");

            // Basic date validation
            const parsedDate = new Date(`${date}T00:00:00`);

            if (
                Number.isNaN(parsedDate.getTime()) ||
                !/^\d{4}-\d{2}-\d{2}$/.test(date)
            ) {
                return interaction.reply({
                    content:
                        "❌ Invalid date. Please use **YYYY-MM-DD**.",
                    ephemeral: true
                });
            }

            const ref = await db
                .collection("memories")
                .add({
                    date,
                    title,
                    details,
                    createdBy: interaction.user.id,
                    createdAt: new Date()
                });

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🕰️ Memory Saved")
                        .setDescription(
                            `**${title}**\n\n${details}`
                        )
                        .addFields({
                            name: "📅 Date",
                            value: date,
                            inline: true
                        })
                        .setFooter({
                            text: `Memory ID: ${ref.id}`
                        })
                        .setTimestamp()
                ]
            });
        }

        // =========================
        // LIST MEMORIES
        // =========================

        if (sub === "list") {
            const snapshot = await db
                .collection("memories")
                .orderBy("date", "desc")
                .get();

            if (snapshot.empty) {
                return interaction.reply({
                    content:
                        "🕰️ You two haven't saved any memories yet."
                });
            }

            const lines = snapshot.docs.map(doc => {
                const data = doc.data();

                return (
                    `🕰️ **${data.title}**\n` +
                    `📅 ${data.date}\n` +
                    `🆔 \`${doc.id}\``
                );
            });

            const embeds = [];

            for (let i = 0; i < lines.length; i += 10) {
                embeds.push(
                    new EmbedBuilder()
                        .setTitle("🕰️ Kenta × Lemon Memories")
                        .setDescription(
                            lines.slice(i, i + 10).join("\n\n")
                        )
                        .setFooter({
                            text:
                                `Memories: ${snapshot.size}`
                        })
                );
            }

            return interaction.reply({
                embeds
            });
        }

        // =========================
        // SHOW MEMORY
        // =========================

        if (sub === "show") {
            const id =
                interaction.options.getString("id");

            const doc = await db
                .collection("memories")
                .doc(id)
                .get();

            if (!doc.exists) {
                return interaction.reply({
                    content:
                        "❌ I couldn't find that memory.",
                    ephemeral: true
                });
            }

            const data = doc.data();

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`🕰️ ${data.title}`)
                        .setDescription(data.details)
                        .addFields({
                            name: "📅 Date",
                            value: data.date,
                            inline: true
                        })
                        .setFooter({
                            text: `Memory ID: ${doc.id}`
                        })
                        .setTimestamp(
                            data.createdAt?.toDate()
                        )
                ]
            });
        }

        // =========================
        // REMOVE MEMORY
        // =========================

        if (sub === "remove") {
            const id =
                interaction.options.getString("id");

            const doc = await db
                .collection("memories")
                .doc(id)
                .get();

            if (!doc.exists) {
                return interaction.reply({
                    content:
                        "❌ I couldn't find that memory.",
                    ephemeral: true
                });
            }

            const data = doc.data();

            await db
                .collection("memories")
                .doc(id)
                .delete();

            return interaction.reply({
                content:
                    `🗑️ Memory **${data.title}** was deleted.`
            });
        }
    }
};
