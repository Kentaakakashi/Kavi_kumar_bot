const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const { db } = require("../services/database");

const categories = [
    "movie",
    "date",
    "couple-goal",
    "travel",
    "food",
    "game",
    "other"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bucket")
        .setDescription("Manage your couple bucket list.")
        .addSubcommand(sub =>
            sub
                .setName("add")
                .setDescription("Add something to the bucket list.")
                .addStringOption(option =>
                    option
                        .setName("category")
                        .setDescription("Category")
                        .setRequired(true)
                        .addChoices(
                            ...categories.map(c => ({
                                name: c,
                                value: c
                            }))
                        )
                )
                .addStringOption(option =>
                    option
                        .setName("item")
                        .setDescription("What do you want to do?")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName("list")
                .setDescription("View your bucket list.")
        )
        .addSubcommand(sub =>
            sub
                .setName("done")
                .setDescription("Mark an item as completed.")
                .addStringOption(option =>
                    option
                        .setName("id")
                        .setDescription("Bucket item ID")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName("remove")
                .setDescription("Remove an item.")
                .addStringOption(option =>
                    option
                        .setName("id")
                        .setDescription("Bucket item ID")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName("random")
                .setDescription("Pick a random bucket-list item.")
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === "add") {
            const category = interaction.options.getString("category");
            const item = interaction.options.getString("item");

            const ref = await db.collection("bucket").add({
                category,
                item,
                completed: false,
                addedBy: interaction.user.id,
                createdAt: new Date()
            });

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🪣 Added to Bucket List")
                        .setDescription(`**${item}**`)
                        .addFields(
                            { name: "Category", value: category },
                            { name: "ID", value: ref.id }
                        )
                ]
            });
        }

        if (sub === "list") {
            const snapshot = await db
                .collection("bucket")
                .orderBy("createdAt", "desc")
                .get();

            if (snapshot.empty) {
                return interaction.reply({
                    content: "🪣 Bucket list is empty."
                });
            }

            const grouped = {};

            for (const doc of snapshot.docs) {
                const data = doc.data();

                if (!grouped[data.category]) {
                    grouped[data.category] = [];
                }

                grouped[data.category].push(
                    `${data.completed ? "✅" : "⬜"} ${data.item} — \`${doc.id}\``
                );
            }

            const description = Object.entries(grouped)
                .map(
                    ([category, items]) =>
                        `### ${category}\n${items.join("\n")}`
                )
                .join("\n\n");

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🪣 Kenta × Lemon Bucket List")
                        .setDescription(description)
                ]
            });
        }

        if (sub === "done") {
            const id = interaction.options.getString("id");

            const ref = db.collection("bucket").doc(id);
            const doc = await ref.get();

            if (!doc.exists) {
                return interaction.reply({
                    content: "❌ Item not found.",
                    ephemeral: true
                });
            }

            await ref.update({
                completed: true,
                completedBy: interaction.user.id,
                completedAt: new Date()
            });

            return interaction.reply({
                content: "✅ BUCKET LIST ITEM COMPLETED. LET'S FUCKING GOOO 💜"
            });
        }

        if (sub === "remove") {
            const id = interaction.options.getString("id");

            await db.collection("bucket").doc(id).delete();

            return interaction.reply({
                content: "🗑️ Bucket item removed.",
                ephemeral: true
            });
        }

        if (sub === "random") {
            const snapshot = await db
                .collection("bucket")
                .where("completed", "==", false)
                .get();

            if (snapshot.empty) {
                return interaction.reply({
                    content: "🎉 YOU TWO COMPLETED EVERYTHING."
                });
            }

            const docs = snapshot.docs;
            const selected =
                docs[Math.floor(Math.random() * docs.length)];

            const item = selected.data();

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🎲 RANDOM MISSION")
                        .setDescription(`**${item.item}**`)
                        .addFields({
                            name: "Category",
                            value: item.category
                        })
                ]
            });
        }
    }
};
