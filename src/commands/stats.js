const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const { db } = require("../services/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stats")
        .setDescription("View relationship statistics."),

    async execute(interaction) {
        const messageDoc =
            await db.collection("stats").doc("messages").get();

        const voiceDoc =
            await db.collection("stats").doc("voice").get();

        const messages = messageDoc.exists
            ? messageDoc.data()
            : {};

        const voice = voiceDoc.exists
            ? voiceDoc.data()
            : {};

        const kentaMessages =
            messages["1105394446230638623"]?.count || 0;

        const lemonMessages =
            messages["817058400910573599"]?.count || 0;

        const totalVC =
            voice.totalMilliseconds || 0;

        const totalHours =
            Math.floor(totalVC / 1000 / 60 / 60);

        const totalMinutes =
            Math.floor(totalVC / 1000 / 60) % 60;

        const memories =
            await db.collection("memories").count().get();

        const bucket =
            await db.collection("bucket").get();

        const completedBucket =
            bucket.docs.filter(
                doc => doc.data().completed
            ).length;

        const embed = new EmbedBuilder()
            .setTitle("📊 Kenta × Lemon")
            .setDescription("Your relationship server statistics.")
            .addFields(
                {
                    name: "💬 Kenta",
                    value: String(kentaMessages),
                    inline: true
                },
                {
                    name: "💬 Lemon",
                    value: String(lemonMessages),
                    inline: true
                },
                {
                    name: "🎙️ VC Together",
                    value: `${totalHours}h ${totalMinutes}m`,
                    inline: true
                },
                {
                    name: "🕰️ Memories",
                    value: String(memories.data().count),
                    inline: true
                },
                {
                    name: "🪣 Bucket Completed",
                    value: `${completedBucket}/${bucket.size}`,
                    inline: true
                }
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};
