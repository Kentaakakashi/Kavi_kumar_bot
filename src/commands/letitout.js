const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder
} = require("discord.js");

const { db } = require("../services/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("let-it-out")
        .setDescription("Write or view private feelings.")
        .addSubcommand(sub =>
            sub
                .setName("write")
                .setDescription("Write something you're feeling.")
        )
        .addSubcommand(sub =>
            sub
                .setName("view")
                .setDescription("View available Let-It-Out entries.")
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === "write") {
            const modal = new ModalBuilder()
                .setCustomId("letitout_write")
                .setTitle("💭 Let It Out");

            const feeling = new TextInputBuilder()
                .setCustomId("feeling")
                .setLabel("What's on your mind?")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(2000);

            modal.addComponents(
                new ActionRowBuilder().addComponents(feeling)
            );

            return interaction.showModal(modal);
        }

        if (sub === "view") {
            const snapshot = await db
                .collection("let_it_out")
                .where("expiresAt", ">", new Date())
                .orderBy("expiresAt")
                .get();

            if (snapshot.empty) {
                return interaction.reply({
                    content: "💭 Nothing here right now.",
                    ephemeral: true
                });
            }

            const entries = snapshot.docs.map(doc => {
                const data = doc.data();

                const date = data.createdAt
                    ?.toDate()
                    .toLocaleString("en-IN");

                return {
                    name: `💭 ${date}`,
                    value: `${data.message}\n\nWritten by <@${data.authorId}>`
                };
            });

            const embeds = [];

            for (let i = 0; i < entries.length; i += 5) {
                const chunk = entries.slice(i, i + 5);

                embeds.push(
                    new EmbedBuilder()
                        .setTitle("💭 Let It Out")
                        .setDescription(
                            "These entries disappear automatically after 14 days."
                        )
                        .addFields(chunk)
                );
            }

            return interaction.reply({
                embeds,
                ephemeral: true
            });
        }
    }
};
