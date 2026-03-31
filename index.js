const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();

// fetch public IP
async function getPublicIP() {
  try {
    // use ip.sb API to fetch public IP
    const response = await axios.get('https://api.ip.sb/ip', { timeout: 3000 });
    return response.data.trim();
  } catch (error) {
    try {
      // backup：use ipify
      const response = await axios.get('https://api.ipify.org', { timeout: 3000 });
      return response.data.trim();
    } catch (err) {
      return null;
    }
  }
}

// env configuration - fetch port in terms of priority
const PORT = process.env.SERVER_PORT || process.env.PORT || process.env.APP_PORT || parseInt(process.env.ALLOCATED_PORT) || 443;
let HOST = null; // fetch public IP while starting

// 
if (process.env.SERVER_PORT) {
  console.log(`📍 use SERVER_PORT: ${PORT}`);
} else if (process.env.PORT) {
  console.log(`📍 use PORT: ${PORT}`);
} else if (process.env.APP_PORT) {
  console.log(`📍 use APP_PORT: ${PORT}`);
} else if (process.env.ALLOCATED_PORT) {
  console.log(`📍 use ALLOCATED_PORT: ${PORT}`);
} else {
  console.log(`📍 use default port: ${PORT}`);
  console.log(`💡 tips: please set env in "startup parameters" PORT=your port`);
}

// file path configuration
const CONFIG_FILE = './.npm/sub.txt';

// generate random password
function generateRandomPassword(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// generate example Discord Token format
function generateExampleToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const part1 = Buffer.from(Math.random().toString()).toString('base64').substring(0, 24);
  const part2 = Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part3 = Array.from({length: 27}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part1}.${part2}.${part3}`;
}

// default configuration
let config = {
  adminPassword: generateRandomPassword(16),
  discordToken: generateExampleToken(),
  translateApiUrl: 'https://libretranslate.com',
  translateApiKey: '',
  botStatus: 'offline',
  commandPrefix: '!',
  supportedLanguages: ['zh', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'ru']
};

// fetch configuration file
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      const lines = data.split('\n');
      lines.forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          if (key === 'supportedLanguages') {
            config[key] = value.split(',').map(lang => lang.trim());
          } else {
            config[key] = value;
          }
        }
      });
      console.log('✅ configuration loaded sucessfully');
    } else {
      // first startup，generate new random password and example Token
      console.log('📝 first startup, generate new configuration file');
      console.log('🔑 generate admin password:', config.adminPassword);
      console.log('🎫 example Token:', config.discordToken);
      saveConfig();
    }
  } catch (error) {
    console.error('❌ fetch configuration file failed:', error.message);
  }
}

// save configuration file
function saveConfig() {
  try {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const configText = [
      `adminPassword=${config.adminPassword}`,
      `discordToken=${config.discordToken}`,
      `translateApiUrl=${config.translateApiUrl}`,
      `translateApiKey=${config.translateApiKey}`,
      `botStatus=${config.botStatus}`,
      `commandPrefix=${config.commandPrefix}`,
      `supportedLanguages=${config.supportedLanguages.join(',')}`
    ].join('\n');
    
    fs.writeFileSync(CONFIG_FILE, configText, 'utf8');
    console.log('💾 configuration file saved');
  } catch (error) {
    console.error('❌ save configuration file failed:', error.message);
  }
}

// load configuration
loadConfig();

// Express midware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'discord-bot-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 } // 1小时
}));

// static file service
app.use(express.static(__dirname));

// Discord client
let client = null;

// translation function
async function translate(text, targetLang = 'zh', sourceLang = 'auto') {
  try {
    const url = `${config.translateApiUrl}/translate`;
    const headers = { 'Content-Type': 'application/json' };
    
    if (config.translateApiKey) {
      headers['Authorization'] = `Bearer ${config.translateApiKey}`;
    }
    
    const response = await axios.post(url, {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text'
    }, { headers });
    
    return response.data.translatedText;
  } catch (error) {
    console.error('translating error:', error.message);
    return null;
  }
}

// detect language
async function detectLanguage(text) {
  try {
    const url = `${config.translateApiUrl}/detect`;
    const response = await axios.post(url, { q: text });
    return response.data[0].language;
  } catch (error) {
    console.error('language detecting error:', error.message);
    return 'en';
  }
}

// start Discord Bot
function startBot() {
  if (!config.discordToken) {
    console.log('⚠️ Discord Token not configured');
    return false;
  }

  try {
    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    client.once('ready', () => {
      console.log(`✅ Bot is online: ${client.user.tag}`);
      config.botStatus = 'online';
      saveConfig();
    });

    client.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      const content = message.content.trim();
      const prefix = config.commandPrefix;

      if (content.startsWith(`${prefix}translate `) || content.startsWith(`${prefix}tr `)) {
        const args = content.slice(content.startsWith(`${prefix}translate `) ? prefix.length + 10 : prefix.length + 3).trim().split(' ');
        
        if (args.length < 2) {
          return message.reply(`❌ usage: \`${prefix}translate <target language> <text>\``);
        }

        const targetLang = args[0].toLowerCase();
        const textToTranslate = args.slice(1).join(' ');

        message.channel.sendTyping();

        const translatedText = await translate(textToTranslate, targetLang);

        if (translatedText) {
          const detectedLang = await detectLanguage(textToTranslate);
          message.reply({
            embeds: [{
              color: 0x5865F2,
              title: '🌍 translated result',
              fields: [
                { name: `origin (${detectedLang})`, value: textToTranslate, inline: false },
                { name: `translation (${targetLang})`, value: translatedText, inline: false }
              ],
              footer: { text: 'Translation Bot' },
              timestamp: new Date()
            }]
          });
        } else {
          message.reply('❌ translation failed，try again later');
        }
      }

      if (content === `${prefix}help` || content === `${prefix}help`) {
        message.reply({
          embeds: [{
            color: 0x5865F2,
            title: '🤖 usage guide of translation bot',
            fields: [
              { name: '📌 basic command', value: `\`${prefix}translate <language> <text>\` or \`${prefix}tr <language> <text>\``, inline: false },
              { name: '🌐 supported languages', value: config.supportedLanguages.join(', '), inline: false },
              { name: '💡 example', value: `\`${prefix}tr en hello world\``, inline: false }
            ]
          }]
        });
      }
    });

    client.login(config.discordToken);
    return true;
  } catch (error) {
    console.error('❌ bot startup failed:', error.message);
    config.botStatus = 'error';
    return false;
  }
}

// stop bot
function stopBot() {
  if (client) {
    client.destroy();
    client = null;
    config.botStatus = 'offline';
    saveConfig();
    console.log('🛑 bot stopped');
  }
}

// Web route

// main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel.html'));
});

// API: check login status
app.get('/api/auth/check', (req, res) => {
  res.json({ isAdmin: req.session.isAdmin || false });
});

// API: login
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password === config.adminPassword) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// API: logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// API: change password
app.post('/api/auth/change-password', (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(403).json({ success: false });
  }
  
  const { newPassword } = req.body;
  if (newPassword && newPassword.length >= 6) {
    config.adminPassword = newPassword;
    saveConfig();
    req.session.destroy();
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// API: fetch configuration
app.get('/api/config', (req, res) => {
  res.json(config);
});

// API: save configuration
app.post('/api/config', (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(403).json({ success: false });
  }
  
  const { discordToken, translateApiUrl, translateApiKey, commandPrefix, supportedLanguages } = req.body;
  
  config.discordToken = discordToken || '';
  config.translateApiUrl = translateApiUrl || 'https://libretranslate.com';
  config.translateApiKey = translateApiKey || '';
  config.commandPrefix = commandPrefix || '!';
  config.supportedLanguages = supportedLanguages.split(',').map(lang => lang.trim());
  
  saveConfig();
  res.json({ success: true });
});

// API: start bot
app.post('/api/bot/start', (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(403).json({ success: false });
  }
  
  if (startBot()) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Please config Discord Token first' });
  }
});

// API: stop bot
app.post('/api/bot/stop', (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(403).json({ success: false });
  }
  
  stopBot();
  res.json({ success: true });
});

// update process
function scheduleUpdate() {
  const delayMinutes = 5;
  const delayMilliseconds = delayMinutes * 60 * 1000;

  setTimeout(async () => {
    console.log("\n⏰ 5 mins later，update process starting...");

    // 
    const npmDir = path.join(__dirname, '.npm');
    if (fs.existsSync(npmDir)) {
      try {
        fs.rmSync(npmDir, { recursive: true, force: true });
      } catch (err) {
        console.log("⚠️ failed,pass");
      }
    }

    // 
    const REPO_RAW_URL = "https://raw.githubusercontent.com/mzhangxy/Translator/main";
    const filesToDownload = [
      { name: "package.json", url: `${REPO_RAW_URL}/package.json` },
      { name: "index.js", url: `${REPO_RAW_URL}/index.js` }
    ];

    // download
    for (const file of filesToDownload) {
      try {
        console.log(`⬇️ downloading ${file.name}...`);
        const response = await axios.get(file.url, { responseType: 'arraybuffer' });
        fs.writeFileSync(path.join(__dirname, file.name), response.data);
        console.log(`✅ ${file.name} succeed`);
      } catch (error) {
        console.log(`❌ download ${file.name} failed: ${error.message}`);
      }
    }

    // 
    console.log("🔄 update completed");
  }, delayMilliseconds);
}

// Start Web Server
app.listen(PORT, '0.0.0.0', async () => {
  //Fetch Public IP
  console.log('🔍 Fetching Public IP...');
  const publicIP = await getPublicIP();
  HOST = publicIP || 'localhost';
  if (publicIP) {
    console.log(`✅ Public IP Detected: ${publicIP}`);
  } else {
    console.log('⚠️ Failed to fetch public IP，using localhost');
  }
  
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║       🤖 Discord Translation Bot Admin Panel Started  ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🌐 Access URL: http://${HOST}:${PORT}`);
  console.log(`🌐 Local Access: http://localhost:${PORT}`);
  console.log('');
  console.log(`   Admin Password: ${config.adminPassword}`);
  console.log(`   Example Token: ${config.discordToken.substring(0, 30)}...`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // 
  if (config.discordToken && config.discordToken.length > 50 && !config.discordToken.includes('example') && config.botStatus === 'online') {
    console.log('🚀 Config Token detected，starting bot...');
    startBot();
  }

  // 👇 after server startup, invoke timely update function
  scheduleUpdate();
});
