const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { FOOTER_LOGO } = require("../config");
const { getCatState, updateCatState, addPendingAction } = require("../catState");
const { generateCatCanvas } = require("../catCanvas");

function registerInteractions(client) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const id = interaction.customId;

    try {
      // Botões do Pomodoro
      if (id.startsWith("pomo_")) {
        const modeMap = { pomo_focus: "focus", pomo_short: "short", pomo_long: "long" };
        const mode = modeMap[id];
        const labels = { focus: "🍅 Foco (25min)", short: "☕ Pausa (5min)", long: "🌿 Descanso (15min)" };

        addPendingAction({ type: "start_pomodoro", mode, timestamp: Date.now(), user: interaction.user.username });

        await interaction.reply({
          content: `✅ **${labels[mode]}** iniciado pelo Discord!\nO timer será sincronizado com o app.`,
          ephemeral: true,
        });
        return;
      }

      // Botão: Alimentar
      if (id === "cat_feed") {
        await interaction.deferReply();
        const state = getCatState();
        updateCatState({
          happiness: Math.min(100, state.happiness + 15),
          energy: Math.min(100, state.energy + 10),
          mood: "eating",
          lastFed: Date.now(),
        });
        addPendingAction({ type: "cat_feed", timestamp: Date.now(), user: interaction.user.username });

        const updated = getCatState();
        const catImage = await generateCatCanvas(updated);
        const attachment = new AttachmentBuilder(catImage, { name: "cat-fed.png" });

        await interaction.editReply({
          content: `🐟 **${interaction.user.username}** alimentou **${updated.name}**!\n❤️ ${updated.happiness}% • ⚡ ${updated.energy}%`,
          files: [attachment],
        });
        return;
      }

      // Botão: Carinho
      if (id === "cat_pet") {
        await interaction.deferReply();
        const state = getCatState();
        updateCatState({
          happiness: Math.min(100, state.happiness + 8),
          mood: "happy",
          lastPet: Date.now(),
        });
        addPendingAction({ type: "cat_pet", timestamp: Date.now(), user: interaction.user.username });

        const updated = getCatState();
        await interaction.editReply({
          content: `🤗 **${interaction.user.username}** fez carinho em **${updated.name}**! Purr~ 💜\n❤️ ${updated.happiness}%`,
        });
        return;
      }

      // Botão: Status
      if (id === "cat_status") {
        await interaction.deferReply({ ephemeral: true });
        const state = getCatState();
        const catImage = await generateCatCanvas(state);
        const attachment = new AttachmentBuilder(catImage, { name: "cat-status.png" });

        const embed = new EmbedBuilder()
          .setTitle(`📊 Status de ${state.name}`)
          .setDescription(
            `❤️ Felicidade: **${state.happiness}%** ${state.happiness > 60 ? "😊" : state.happiness > 30 ? "😐" : "😿"}\n` +
            `⚡ Energia: **${state.energy}%** ${state.energy > 60 ? "⚡" : state.energy > 30 ? "🔋" : "🪫"}\n` +
            `🎭 Humor: **${state.mood}**\n` +
            `🍽️ Última refeição: <t:${Math.floor(state.lastFed / 1000)}:R>`
          )
          .setColor(0x9b87f5)
          .setImage("attachment://cat-status.png")
          .setFooter({ text: "Pet Virtual • Uzzo Solutions", iconURL: FOOTER_LOGO })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed], files: [attachment] });
        return;
      }
    } catch (err) {
      console.error(`❌ Erro na interação "${id}":`, err);
      const replyMethod = interaction.deferred ? "editReply" : "reply";
      await interaction[replyMethod]({
        content: `❌ Ocorreu um erro ao processar a interação. Tente novamente!`,
        ephemeral: true,
      }).catch(() => {});
    }
  });
}

module.exports = { registerInteractions };
