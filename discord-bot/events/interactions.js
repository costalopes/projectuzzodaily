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

        await interaction.reply({
          content: `✅ **${labels[mode]}** iniciado pelo Discord!\nO timer será sincronizado com o app.`,
          ephemeral: true,
        });
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
