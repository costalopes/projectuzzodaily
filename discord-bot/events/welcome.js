const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { WELCOME_CHANNEL_ID, FOOTER_LOGO } = require("../config");

function registerWelcome(client) {
  client.on("guildMemberAdd", async (member) => {
    if (member.user.bot) return;
    const guild = member.guild;

    try {
      const embed = new EmbedBuilder()
        .setTitle("Bem-vindo(a) ao Uzzo Solutions ®!")
        .setDescription(
          `<:ios_hearthands:1261374708436304034> Olá <@${member.id}>! Que bom ter você!\n\n` +
          `Conheça <#1193519922345689118>. Ajuda? <#1260202900442058803>. 💙`
        )
        .setColor(0x0033ff)
        .setFooter({ text: "Atendimento 09:30 - 23:00 • Uzzo Solutions", iconURL: FOOTER_LOGO }).setTimestamp();

      if (WELCOME_CHANNEL_ID) {
        const ch = await guild.channels.fetch(WELCOME_CHANNEL_ID);
        if (ch) {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("Ver onboarding").setStyle(ButtonStyle.Link).setURL("https://royal-art-glow.lovable.app/discord/onboarding").setEmoji("📋")
          );
          await ch.send({ content: `<@${member.id}>`, embeds: [embed], components: [row] });
        }
      }
      try { await member.send({ embeds: [embed] }); } catch {}
    } catch (err) { console.error("❌ Welcome:", err); }
  });
}

module.exports = { registerWelcome };
