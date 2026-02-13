const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { VOICE_CHANNEL_ID, TICKET_CATEGORY_ID, SUPPORT_ROLE_ID, FOOTER_LOGO, VOICE_THUMB, ABSENCE_TIMEOUT_MS } = require("../config");

const activeTickets = new Map();

async function getChannelCategory(guild, channelId) {
  try {
    const channel = await guild.channels.fetch(channelId);
    return channel?.parentId;
  } catch { return null; }
}

async function closeTicketByAbsence(client, guild, userId) {
  const ticket = activeTickets.get(userId);
  if (!ticket) return;
  activeTickets.delete(userId);

  try {
    const ch = await guild.channels.fetch(ticket.ticketChannelId);
    if (ch) { await ch.delete("Ausência."); console.log(`🗑️ Ticket ${ch.name} excluído.`); }
  } catch (err) { console.error("❌ Erro ticket:", err); }

  try {
    const user = await client.users.fetch(userId);
    const embed = new EmbedBuilder()
      .setTitle("<a:y_aviso_cdw:1282771322555994245>  Ticket Encerrado")
      .setDescription("Seu ticket foi **fechado automaticamente** por ausência.\nEntre novamente se precisar de ajuda.")
      .setColor(0xff3333).setThumbnail(FOOTER_LOGO)
      .setFooter({ text: "Atendimento 09:30 - 23:00 • Uzzo Solutions", iconURL: FOOTER_LOGO }).setTimestamp();
    await user.send({ embeds: [embed] });
  } catch (err) { console.error("❌ DM ausência:", err); }
}

function registerVoiceTickets(client) {
  client.on("voiceStateUpdate", async (oldState, newState) => {
    if (newState.member?.user?.bot) return;
    const userId = newState.member.user.id;
    const guild = newState.guild;
    const oldCh = oldState.channelId, newCh = newState.channelId;

    if (newCh === VOICE_CHANNEL_ID && oldCh !== VOICE_CHANNEL_ID) {
      const existing = activeTickets.get(userId);
      if (existing?.timeoutId) { clearTimeout(existing.timeoutId); existing.timeoutId = null; return; }
      if (existing) return;

      const user = newState.member.user;
      const displayName = newState.member.displayName || user.username;

      try {
        const allCh = await guild.channels.fetch();
        const tickets = allCh.filter(ch => ch.parentId === TICKET_CATEGORY_ID && ch.name.match(/・\d{3}$/));
        const num = String(tickets.size + 1).padStart(3, "0");
        const short = user.username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);

        const ticketCh = await guild.channels.create({
          name: `🎟️・${short}・${num}`, type: 0, parent: TICKET_CATEGORY_ID,
          topic: `Ticket — ${displayName}`,
          permissionOverwrites: [
            { id: guild.id, deny: ["ViewChannel"] },
            { id: user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
            { id: SUPPORT_ROLE_ID, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
          ],
        });

        const embed = new EmbedBuilder()
          .setTitle("Mensagem do sistema:")
          .setDescription(`Olá, <@${user.id}>! Nosso sistema avisou a equipe. Em breve você será atendido.`)
          .setColor(0x0033ff).setThumbnail(VOICE_THUMB)
          .setFooter({ text: "Atendimento 09:30 - 23:00 • Uzzo Solutions", iconURL: FOOTER_LOGO }).setTimestamp();

        await ticketCh.send({ content: `<@${user.id}>`, embeds: [embed] });
        activeTickets.set(userId, { ticketChannelId: ticketCh.id, timeoutId: null });
      } catch (err) { console.error("❌ Erro voz:", err); }
      return;
    }

    const ticket = activeTickets.get(userId);
    if (!ticket) return;

    let still = false;
    if (newCh) {
      if (newCh === VOICE_CHANNEL_ID) still = true;
      else { const p = await getChannelCategory(guild, newCh); if (p === TICKET_CATEGORY_ID) still = true; }
    }
    if (still) { if (ticket.timeoutId) { clearTimeout(ticket.timeoutId); ticket.timeoutId = null; } return; }
    if (!ticket.timeoutId) {
      ticket.timeoutId = setTimeout(() => closeTicketByAbsence(client, guild, userId), ABSENCE_TIMEOUT_MS);
    }
  });
}

module.exports = { registerVoiceTickets };
