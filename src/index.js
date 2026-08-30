
const {
    Client,
    GatewayIntentBits,
    Collection,
    Events
} = require("discord.js");

const { db } = require("./services/database");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();

const commands = [
    require("./commands/event"),
    require("./commands/bucket"),
    require("./commands/letitout"),
    require("./commands/stats"),
    require("./commands/trivia"),
    require("./commands/countdown"),
    require("./commands/achievements")
];

for (const command of commands) {
    client.commands.set(command.data.name, command);
}

const ALLOWED_USERS = [
    "1105394446230638623",
    "817058400910573599"
];

const ALLOWED_GUILD = "1375673500206895275";

function isAllowed(interaction) {
    return (
        interaction.guildId === ALLOWED_GUILD &&
        ALLOWED_USERS.includes(interaction.user.id)
    );
}

client.once(Events.ClientReady, async readyClient => {
    console.log(`Logged in as ${readyClient.user.tag}`);
    console.log("Kenta × Lemon bot is online 💜");

    try {
        await db.collection("system").doc("status").set({
            online: true,
            lastOnline: new Date()
        });

        console.log("Firebase connected.");
    } catch (error) {
        console.error("Firebase error:", error);
    }
});

client.on(Events.InteractionCreate, async interaction => {
     if (interaction.isModalSubmit()) {
    if (interaction.customId === "letitout_write") {
        const message = interaction.fields.getTextInputValue("feeling");

        await db.collection("let_it_out").add({
            authorId: interaction.user.id,
            message,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        });

        return interaction.reply({
            content:
                "💭 Your thoughts have been saved privately. They'll disappear automatically after 14 days.",
            ephemeral: true
        });
    }

    return;
     }
    if (!interaction.isChatInputCommand()) return;

    if (!isAllowed(interaction)) {
        return interaction.reply({
            content: "❌ You aren't allowed to use this bot.",
            ephemeral: true
        });
    }

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);

        const response = {
            content: "❌ Something went wrong.",
            ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(response);
        } else {
            await interaction.reply(response);
        }
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    if (message.guildId !== ALLOWED_GUILD) return;
    if (!ALLOWED_USERS.includes(message.author.id)) return;

    try {
        const ref = db.collection("stats").doc("messages");

        await ref.set(
            {
                [message.author.id]: {
                    count: require("firebase-admin").firestore.FieldValue.increment(1),
                    lastMessage: new Date()
                }
            },
            { merge: true }
        );
    } catch (error) {
        console.error("Message tracking error:", error);
    }
});

const voiceSessions = new Map();

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    const userId = newState.id;

    if (!ALLOWED_USERS.includes(userId)) return;

    const guild = newState.guild;

    const otherUserId = ALLOWED_USERS.find(id => id !== userId);

    const userChannel = newState.channelId;
    const otherMember = guild.members.cache.get(otherUserId);

    const otherChannel = otherMember?.voice?.channelId;

    const currentlyTogether =
        userChannel &&
        otherChannel &&
        userChannel === otherChannel;

    const wasTogether =
        oldState.channelId &&
        otherChannel &&
        oldState.channelId === otherChannel;

    const sessionKey = guild.id;

    if (currentlyTogether && !voiceSessions.has(sessionKey)) {
        voiceSessions.set(sessionKey, {
            startedAt: Date.now()
        });

        console.log("Kenta and Lemon entered VC together.");
    }

    if (!currentlyTogether && voiceSessions.has(sessionKey)) {
        const session = voiceSessions.get(sessionKey);

        const duration = Date.now() - session.startedAt;

        try {
            const ref = db.collection("stats").doc("voice");

            await ref.set(
                {
                    totalMilliseconds:
                        require("firebase-admin")
                            .firestore
                            .FieldValue.increment(duration),

                    sessions:
                        require("firebase-admin")
                            .firestore
                            .FieldValue.increment(1),

                    lastSession: new Date()
                },
                { merge: true }
            );
        } catch (error) {
            console.error("VC tracking error:", error);
        }

        voiceSessions.delete(sessionKey);

        console.log(
            `VC session ended: ${Math.round(duration / 1000)} seconds`
        );
    }
});

setInterval(async () => {
    const now = new Date();

    try {
        const snapshot = await db
            .collection("let_it_out")
            .where("expiresAt", "<=", now)
            .get();

        if (snapshot.empty) return;

        const batch = db.batch();

        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        console.log(`Deleted ${snapshot.size} expired Let-It-Out entries.`);
    } catch (error) {
        console.error("Cleanup error:", error);
    }
}, 60 * 60 * 1000);

client.login(process.env.DISCORD_TOKEN);
