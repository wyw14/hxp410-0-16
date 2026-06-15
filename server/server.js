const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 41116;

const DATA_DIR = path.join(__dirname, 'data');
const SECRETS_FILE = path.join(DATA_DIR, 'secrets.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(SECRETS_FILE)) {
  fs.writeFileSync(SECRETS_FILE, JSON.stringify([]));
}

app.use(cors());
app.use(express.json());

function readSecrets() {
  const data = fs.readFileSync(SECRETS_FILE, 'utf8');
  return JSON.parse(data);
}

function writeSecrets(secrets) {
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(secrets, null, 2));
}

const MOODS = ['愧疚', '孤独', '焦虑', '遗憾', '愤怒', '嫉妒', '迷茫', '自责'];

app.post('/api/secrets', (req, res) => {
  try {
    const { content, mood } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: '秘密内容不能为空' });
    }

    const secrets = readSecrets();
    const newSecret = {
      id: uuidv4(),
      content: content.trim(),
      mood: mood || '',
      status: '已宽恕',
      lightCount: 0,
      comfortReplies: [],
      createdAt: new Date().toISOString()
    };

    secrets.push(newSecret);
    writeSecrets(secrets);

    res.json({
      success: true,
      message: '你的秘密已被宽恕',
      secret: newSecret
    });
  } catch (error) {
    console.error('保存秘密时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/secrets/random', (req, res) => {
  try {
    const secrets = readSecrets();
    const forgivenSecrets = secrets.filter(s => s.status === '已宽恕');

    if (forgivenSecrets.length === 0) {
      return res.json({
        hasSecret: false,
        message: '还没有被宽恕的秘密，成为第一个分享的人吧'
      });
    }

    const randomIndex = Math.floor(Math.random() * forgivenSecrets.length);
    const randomSecret = forgivenSecrets[randomIndex];

    res.json({
      hasSecret: true,
      secret: {
        id: randomSecret.id,
        content: randomSecret.content,
        status: randomSecret.status,
        mood: randomSecret.mood || '',
        lightCount: randomSecret.lightCount || 0,
        comfortReplies: randomSecret.comfortReplies || [],
        createdAt: randomSecret.createdAt
      }
    });
  } catch (error) {
    console.error('获取随机秘密时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/secrets/moods', (req, res) => {
  res.json({ moods: MOODS });
});

app.get('/api/secrets/:id', (req, res) => {
  try {
    const secrets = readSecrets();
    const secret = secrets.find(s => s.id === req.params.id);

    if (!secret) {
      return res.status(404).json({ error: '秘密不存在' });
    }

    res.json({ secret });
  } catch (error) {
    console.error('获取秘密详情时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/secrets/:id/related', (req, res) => {
  try {
    const secrets = readSecrets();
    const current = secrets.find(s => s.id === req.params.id);

    if (!current) {
      return res.status(404).json({ error: '秘密不存在' });
    }

    let related = secrets.filter(s =>
      s.id !== current.id &&
      s.status === '已宽恕' &&
      s.mood === current.mood
    );

    if (related.length === 0) {
      related = secrets.filter(s =>
        s.id !== current.id && s.status === '已宽恕'
      );
    }

    related = related.slice(0, 4);

    res.json({ related });
  } catch (error) {
    console.error('获取相关秘密时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.post('/api/secrets/:id/light', (req, res) => {
  try {
    const secrets = readSecrets();
    const secret = secrets.find(s => s.id === req.params.id);

    if (!secret) {
      return res.status(404).json({ error: '秘密不存在' });
    }

    secret.lightCount = (secret.lightCount || 0) + 1;
    writeSecrets(secrets);

    res.json({ success: true, lightCount: secret.lightCount });
  } catch (error) {
    console.error('点亮秘密时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.post('/api/secrets/:id/comfort', (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: '安慰内容不能为空' });
    }

    const secrets = readSecrets();
    const secret = secrets.find(s => s.id === req.params.id);

    if (!secret) {
      return res.status(404).json({ error: '秘密不存在' });
    }

    if (!secret.comfortReplies) {
      secret.comfortReplies = [];
    }

    secret.comfortReplies.push({
      id: uuidv4(),
      content: content.trim(),
      createdAt: new Date().toISOString()
    });

    writeSecrets(secrets);

    res.json({ success: true, comfortReplies: secret.comfortReplies });
  } catch (error) {
    console.error('添加安慰回复时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`忏悔室后端服务运行在 http://localhost:${PORT}`);
});
