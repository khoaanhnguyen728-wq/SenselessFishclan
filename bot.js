require("dotenv").config();

const express = require("express");
const app = express();

// Route để Render kiểm tra
app.get("/", (req, res) => {
  res.send("Bot is running");
});

// Mở port cho Web Service
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Web server running on port " + PORT);
});

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ChannelType
} = require("discord.js");

// Tạo client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Lấy role từ env
const STAFF_ROLES = process.env.STAFF_ROLES.split(","); // array các staff role
const ADMIN_ROLES = process.env.ADMIN_ROLES.split(","); // array các admin role

// =======================
// MESSAGE COMMAND: !botticket
// =======================
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  // Kiểm tra lệnh
  if (message.content.toLowerCase() === "!botticket") {

    // Kiểm tra user có role admin hay không
    const memberRoles = message.member.roles.cache.map(r => r.id);
    const isAdmin = ADMIN_ROLES.some(roleId => memberRoles.includes(roleId));

    if (!isAdmin) {
      return message.reply("❌ Bạn không có quyền sử dụng lệnh này!");
    }

    // Embed và button tạo ticket
    const embed = new EmbedBuilder()
      .setTitle("🎫 Support Ticket")
      .setDescription("Nhấn nút bên dưới để tạo ticket hỗ trợ.")
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("create_ticket")
        .setLabel("Create Ticket")
        .setStyle(ButtonStyle.Success)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }
});

// =======================
// BUTTON INTERACTION
// =======================
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  // CREATE TICKET
  if (interaction.customId === "create_ticket") {
    let perms = [
      { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      {
        id: interaction.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      }
    ];

    STAFF_ROLES.forEach(role => {
      perms.push({
        id: role,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      });
    });

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: perms
    });

    const embed = new EmbedBuilder()
      .setTitle("🎫 Ticket")
      .setDescription("Staff sẽ hỗ trợ bạn sớm.")
      .setColor("Green");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("claim").setLabel("Claim").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("close").setLabel("Close").setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `${interaction.user}`,
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content: `✅ Ticket đã tạo: ${channel}`,
      ephemeral: true
    });
  }

  // CLAIM
  if (interaction.customId === "claim") {
    await interaction.channel.send(`✅ Ticket đã được ${interaction.user} claim`);
    await interaction.reply({ content: "Bạn đã claim ticket", ephemeral: true });
  }

  // CLOSE
  if (interaction.customId === "close") {
    await interaction.reply("🔒 Đang đóng ticket...");
    setTimeout(() => {
      interaction.channel.delete();
    }, 3000);
  }
});

// Login bot
client.login(process.env.BOT_TOKEN);
