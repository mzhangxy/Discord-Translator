# 🌍 Discord Universal Translator

> A powerful Discord translation bot with a beautiful web management panel

## ✨ Features

- 🤖 **Discord Bot Integration** - Seamless translation commands in Discord servers
- 🌐 **Multi-language Support** - Supports 8+ languages (Chinese, English, Japanese, Korean, French, German, Spanish, Russian)
- 🎨 **Beautiful Web Panel** - User-friendly management interface
- 🔐 **Secure Authentication** - Password-protected admin panel
- ⚙️ **Flexible Configuration** - Customizable command prefix, API endpoints, and more
- 🚀 **Easy Deployment** - Simple setup with environment variables
- 📝 **Auto-save Config** - Persistent configuration storage
- 🔄 **Real-time Bot Control** - Start/stop bot from web interface

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Discord Bot Token ([Get one here](https://discord.com/developers/applications))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/discord-universal-translator.git
cd discord-universal-translator
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the application**
```bash
node index.js
```

4. **Access the web panel**
```
http://localhost:25572
```

5. **Login with generated password**
   - Check console output for the admin password
   - Configure your Discord Bot Token in the panel
   - Click "Start Bot" to activate

### Environment Variables

You can customize the host and port using environment variables:

```bash
HOST=de1.eknodes.es PORT=25583 node index.js
```

Or create a `.env` file:
```env
HOST=your-domain.com
PORT=25583
```

## 🎮 Discord Commands

### Basic Translation
```
!translate <target_language> <text>
!tr <target_language> <text>
```

**Example:**
```
!tr en 你好世界
!translate zh Hello world
```

### Help Command
```
!help
!翻译帮助
```

### Supported Languages
- `zh` - Chinese
- `en` - English
- `ja` - Japanese
- `ko` - Korean
- `fr` - French
- `de` - German
- `es` - Spanish
- `ru` - Russian

## ⚙️ Configuration

### Web Panel Settings

**Bot Configuration:**
- Discord Bot Token
- Command Prefix (default: `!`)
- Supported Languages

**Translation API:**
- API URL (default: LibreTranslate)
- API Key (optional)

**Security:**
- Change admin password
- Session management

### Config File

Configuration is automatically saved to `.npm/sub.txt`:
```
adminPassword=your_password
discordToken=your_bot_token
translateApiUrl=https://libretranslate.com
translateApiKey=
botStatus=offline
commandPrefix=!
supportedLanguages=zh,en,ja,ko,fr,de,es,ru
```

## 🔧 API Endpoints

### Authentication
- `GET /api/auth/check` - Check login status
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/change-password` - Change password

### Configuration
- `GET /api/config` - Get current config
- `POST /api/config` - Update config

### Bot Control
- `POST /api/bot/start` - Start Discord bot
- `POST /api/bot/stop` - Stop Discord bot

## 📦 Dependencies

```json
{
  "discord.js": "^14.x",
  "express": "^4.x",
  "axios": "^1.x",
  "body-parser": "^1.x",
  "express-session": "^1.x"
}
```

## 🛠️ Development

### Project Structure
```
discord-universal-translator/
├── index.js              # Main application file
├── panel.html            # Web panel interface
├── package.json          # Project dependencies
├── .npm/
│   └── sub.txt          # Configuration file
└── README.md            # This file
```

### Running in Development
```bash
npm run dev
```

### Building for Production
```bash
npm start
```

## 🌐 Translation API

By default, the bot uses [LibreTranslate](https://libretranslate.com), a free and open-source translation API.

**Alternative APIs:**
- Google Translate API
- DeepL API
- Microsoft Translator
- Any LibreTranslate-compatible API

Configure your preferred API in the web panel.

## 🔒 Security

- Admin panel protected by password authentication
- Session-based authentication (1-hour timeout)
- Secure token storage
- Password change functionality
- No tokens exposed in logs

**Best Practices:**
1. Change the default admin password immediately
2. Keep your Discord Bot Token private
3. Use HTTPS in production
4. Regular security updates

## 🐛 Troubleshooting

### Bot not connecting?
- Verify Discord Bot Token is correct
- Check bot has proper intents enabled (Guilds, GuildMessages, MessageContent)
- Ensure bot is invited to your server

### Translation not working?
- Check translation API URL is accessible
- Verify API key if required
- Test with different languages

### Web panel not accessible?
- Check PORT is not in use
- Verify firewall settings
- Check HOST environment variable

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 💡 Support

- 📧 Email: support@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/discord-universal-translator/issues)
- 💬 Discord: [Join our server](https://discord.gg/example)

## 🙏 Acknowledgments

- [Discord.js](https://discord.js.org/) - Discord API wrapper
- [LibreTranslate](https://libretranslate.com/) - Free translation API
- [Express](https://expressjs.com/) - Web framework

## 📊 Roadmap

- [ ] Multi-server support
- [ ] Custom translation models
- [ ] Auto-detect and translate
- [ ] Translation history
- [ ] User preferences
- [ ] Docker support
- [ ] Database integration
- [ ] REST API for external apps

---

⭐ **Star this repo if you find it helpful!**

Made with ❤️ by [Your Name]
