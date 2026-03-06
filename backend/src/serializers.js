'use strict';

/**
 * Convert a discord.js Message to a plain serialisable object.
 * @param {import('discord.js').Message} msg
 */
function serializeMessage(msg) {
  if (!msg) return null;

  return {
    id: msg.id,
    content: msg.content ?? '',
    channelId: msg.channelId,
    guildId: msg.guildId ?? null,
    author: msg.author
      ? {
          id: msg.author.id,
          username: msg.author.username,
          discriminator: msg.author.discriminator,
          avatar: msg.author.avatar,
          bot: msg.author.bot,
          avatarURL: msg.author.displayAvatarURL({ size: 64 }),
        }
      : null,
    timestamp: msg.createdTimestamp,
    editedTimestamp: msg.editedTimestamp ?? null,
    attachments: [...(msg.attachments?.values() ?? [])].map((a) => ({
      id: a.id,
      url: a.url,
      name: a.name,
      size: a.size,
      contentType: a.contentType ?? null,
    })),
    embeds: (msg.embeds ?? []).map((e) => ({
      title: e.title ?? null,
      description: e.description ?? null,
      url: e.url ?? null,
      color: e.color ?? null,
      image: e.image?.url ?? null,
      thumbnail: e.thumbnail?.url ?? null,
    })),
    mentions: {
      users: [...(msg.mentions?.users?.values() ?? [])].map((u) => ({
        id: u.id,
        username: u.username,
      })),
    },
    type: msg.type,
    system: msg.system ?? false,
  };
}

/**
 * Convert a discord.js GuildChannel to a plain serialisable object.
 * @param {import('discord.js').GuildChannel} ch
 */
function serializeChannel(ch) {
  return {
    id: ch.id,
    name: ch.name,
    type: ch.type,
    position: ch.position ?? 0,
    parentId: ch.parentId ?? null,
    topic: ch.topic ?? null,
    nsfw: ch.nsfw ?? false,
  };
}

/**
 * Convert a discord.js Guild to a plain serialisable object.
 * @param {import('discord.js').Guild} guild
 */
function serializeGuild(guild) {
  return {
    id: guild.id,
    name: guild.name,
    icon: guild.icon,
    iconURL: guild.iconURL({ size: 64 }) ?? null,
    memberCount: guild.memberCount,
    description: guild.description ?? null,
  };
}

module.exports = { serializeMessage, serializeChannel, serializeGuild };
