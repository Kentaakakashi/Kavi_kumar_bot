
const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const { db } = require("../services/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("achievements")
        .setDescription("View relationship achievements."),

    async execute(interaction) {
        const memories =
            await db.collection("memories").count().get();

        const bucket =
            await db.collection("bucket").get();

        const completed =
            bucket.docs.filter(
                doc => doc.data().completed
            ).length;

        const voice =
            await db.collection("stats").doc("voice").get();

        const totalHours = voice.exists
            ? Math.floor(
                (voice.data().totalMilliseconds || 0) /
                1000 /
                60 /
                60
            )
            : 0;

        const achievements = [
            {
                unlocked: memories.data().count >= 1,
                text: "🕰️ First Memory"
            },
            {
                unlocked: memories.data().count >= 10,
                text: "🕰️ 10 Memories"
            },
            {
                unlocked: memories.data().count >= 50,
                text: "🏛️ Memory Hoarders"
            },
            {
                unlocked: completed >= 1,
                text: "🪣 First Bucket Item"
            },
            {
                unlocked: completed >= 10,
                text: "🪣 Bucket List Destroyers"
            },
            {
                unlocked: totalHours >= 10,
                text: "🎙️ 10 Hours Together"
            },
            {
                unlocked: totalHours >= 100,
                text: "🎙️ 100 Hours Together"
            }
        ];

        const text = achievements
            .map(a =>
                `${a.unlocked ? "🔓" : "🔒"} ${a.text}`
            )
            .join("\n");

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("🏆 Kenta × Lemon Achievements")
                    .setDescription(text)
            ]
        });
    }
};
