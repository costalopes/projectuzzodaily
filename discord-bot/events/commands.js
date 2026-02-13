const { EmbedBuilder } = require("discord.js");
const { PREFIX, FOOTER_LOGO } = require("../config");

function registerCommands(client) {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    try {
      if (command === "help" || command === "ajuda") {
        const embed = new EmbedBuilder()
          .setTitle("📖 Comandos Disponíveis")
          .setDescription(
            `**ℹ️ Comandos:**\n` +
            `\`${PREFIX}ajuda\` — Esta mensagem`
          )
          .setColor(0x9b87f5)
          .setFooter({ text: "Uzzo Solutions", iconURL: FOOTER_LOGO });

        await message.reply({ embeds: [embed] });
        return;
      }
    } catch (err) {
      console.error(`❌ Erro no comando "${command}":`, err);
      await message.reply(`❌ Ocorreu um erro ao executar o comando. Tente novamente!`).catch(() => {});
    }
  });
}

module.exports = { registerCommands };
