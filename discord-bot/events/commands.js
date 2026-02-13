const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { PREFIX, FOOTER_LOGO } = require("../config");
const { getCatState, updateCatState, addPendingAction } = require("../catState");
const { generateCatCanvas } = require("../catCanvas");

function registerCommands(client) {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    if (command === "alimentar" || command === "feed") {
      const state = getCatState();
      updateCatState({
        happiness: Math.min(100, state.happiness + 15),
        energy: Math.min(100, state.energy + 10),
        mood: "eating",
        lastFed: Date.now(),
      });
      addPendingAction({ type: "cat_feed", timestamp: Date.now(), user: message.author.username });

      const updated = getCatState();
      const catImage = await generateCatCanvas(updated);
      const attachment = new AttachmentBuilder(catImage, { name: "cat-fed.png" });

      await message.reply({
        content: `🐟 **${updated.name}** foi alimentado(a)! Nhom nhom~\n❤️ ${updated.happiness}% • ⚡ ${updated.energy}%`,
        files: [attachment],
      });
      return;
    }

    if (command === "gato" || command === "cat" || command === "status") {
      const state = getCatState();
      const catImage = await generateCatCanvas(state);
      const attachment = new AttachmentBuilder(catImage, { name: "cat-status.png" });

      const embed = new EmbedBuilder()
        .setTitle(`🐱 ${state.name}`)
        .setDescription(
          `❤️ Felicidade: **${state.happiness}%**\n` +
          `⚡ Energia: **${state.energy}%**\n` +
          `🎭 Humor: **${state.mood}**\n` +
          `🍽️ Última refeição: <t:${Math.floor(state.lastFed / 1000)}:R>`
        )
        .setColor(0x9b87f5)
        .setImage("attachment://cat-status.png")
        .setFooter({ text: "Pet Virtual • Uzzo Solutions", iconURL: FOOTER_LOGO })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("cat_feed").setLabel("🐟 Alimentar").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("cat_pet").setLabel("🤗 Carinho").setStyle(ButtonStyle.Primary),
      );

      await message.reply({ embeds: [embed], files: [attachment], components: [row] });
      return;
    }

    if (command === "carinho" || command === "pet") {
      const state = getCatState();
      updateCatState({
        happiness: Math.min(100, state.happiness + 8),
        mood: "happy",
        lastPet: Date.now(),
      });
      addPendingAction({ type: "cat_pet", timestamp: Date.now(), user: message.author.username });

      const updated = getCatState();
      await message.reply(`🤗 Você fez carinho em **${updated.name}**! Purr~ 💜\n❤️ ${updated.happiness}%`);
      return;
    }

    if (command === "help" || command === "ajuda") {
      const embed = new EmbedBuilder()
        .setTitle("📖 Comandos Disponíveis")
        .setDescription(
          `**🐱 Pet Virtual:**\n` +
          `\`${PREFIX}gato\` — Ver status do gatinho com canvas\n` +
          `\`${PREFIX}alimentar\` — Dar comida ao gatinho\n` +
          `\`${PREFIX}carinho\` — Fazer carinho no gatinho\n\n` +
          `**ℹ️ Outros:**\n` +
          `\`${PREFIX}ajuda\` — Esta mensagem`
        )
        .setColor(0x9b87f5)
        .setFooter({ text: "Uzzo Solutions", iconURL: FOOTER_LOGO });

      await message.reply({ embeds: [embed] });
      return;
    }
  });
}

module.exports = { registerCommands };
