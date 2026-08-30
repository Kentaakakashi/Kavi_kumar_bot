
const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const questions = {
    fun: [
        "Who would run first after seeing a cockroach?",
        "Who is more likely to forget where they put their phone?",
        "Who would survive longer in a zombie apocalypse?",
        "Who is more likely to start laughing at the worst possible time?",
        "Who takes longer to choose what movie to watch?"
    ],

    relationship: [
        "Who remembers tiny details about the other better?",
        "Who is more likely to notice that something is wrong first?",
        "Who apologizes first after an argument?",
        "Who is more likely to randomly send a cute message?",
        "Who knows the other's favorite things better?"
    ],

    spicy: [
        "Who gets embarrassed faster after receiving a compliment?",
        "Who is more likely to send a ridiculously cheesy message?",
        "Who gets flustered more easily?",
        "Who would lose a staring contest first?",
        "Who is more likely to randomly say something romantic?"
    ]
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("trivia")
        .setDescription("Play relationship trivia.")
        .addStringOption(option =>
            option
                .setName("category")
                .setDescription("Question category")
                .setRequired(true)
                .addChoices(
                    { name: "😂 Fun", value: "fun" },
                    { name: "💜 Relationship", value: "relationship" },
                    { name: "🌶️ Playful", value: "spicy" }
                )
        ),

    async execute(interaction) {
        const category =
            interaction.options.getString("category");

        const list = questions[category];

        const question =
            list[Math.floor(Math.random() * list.length)];

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `trivia_kenta_${interaction.id}`
                )
                .setLabel("Kenta")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId(
                    `trivia_lemon_${interaction.id}`
                )
                .setLabel("Lemon")
                .setStyle(ButtonStyle.Secondary)
        );

        const embed = new EmbedBuilder()
            .setTitle("🎮 Relationship Trivia")
            .setDescription(
                `**${question}**\n\nChoose your answer below.`
            )
            .setFooter({
                text: `Category: ${category}`
            });

        return interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};
