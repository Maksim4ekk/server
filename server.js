const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json());

const filePath = path.join(__dirname, 'stats.json');

// 🧠 Чтение и сохранение
function readStats() {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
function saveStats(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// 🕒 Формат времени
function getFormattedTime() {
  const t = new Date();
  return [
    String(t.getDate()).padStart(2, '0'),
    String(t.getMonth() + 1).padStart(2, '0'),
    t.getFullYear(),
    String(t.getHours()).padStart(2, '0'),
    String(t.getMinutes()).padStart(2, '0'),
    String(t.getSeconds()).padStart(2, '0')
  ].join(' ');
}

// 📥 POST — добавить статистику
app.post('/stats', (req, res) => {
  const incoming = req.body;
  incoming.time = getFormattedTime();
  const stats = readStats();
  stats.push(incoming);
  saveStats(stats);
  res.json({ status: 'saved', data: incoming });
  console.log("Сохранено: " + incoming)
});

// 📤 GET — получить по дате
app.get('/stats/:date', (req, res) => {
  const date = req.params.date;
  const nickname = req.query.admin;

  const stats = readStats();

  // Фильтруем по дате и нику, если указан
  const found = stats.filter(s => {
    const matchDate = s.date === date;
    const matchAdmin = nickname ? s.admin === nickname : true;
    return matchDate && matchAdmin;
  });

  if (found.length) {
    res.json(found);
    console.log(`Запрошено: дата=${date}, админ=${nickname || 'любой'}`);
  } else {
    res.status(404).json({ error: 'Нет данных за эту дату и админа' });
  }
});

// 🔍 GET — фильтр по администратору
app.get('/stats/admin/:name', (req, res) => {
  const name = req.params.name;
  const stats = readStats();
  const filtered = stats.filter(s => s.admin === name);
  res.json(filtered);
  console.log("Запрошено: " + filtered);
});

// 🔄 PATCH — обновить действия
app.patch('/stats/:date', (req, res) => {
  const date = req.params.date;
  const updates = req.body.actions;
  const stats = readStats();
  const index = stats.findIndex(s => s.date === date);
  if (index === -1) return res.status(404).json({ error: 'Нет данных' });

  Object.entries(updates).forEach(([key, val]) => {
    stats[index].actions[key] = val;
  });

  saveStats(stats);
  res.json({ status: 'updated', data: stats[index] });
  console.log("Обновлено: " + stats[index])
});

// ❌ DELETE — удалить по дате
app.delete('/stats/:date', (req, res) => {
  const date = req.params.date;
  const admin = req.query.admin;

  let stats = readStats();
  const before = stats.length;

  stats = stats.filter(s => !(s.date === date && s.admin === admin));

  saveStats(stats);

  res.json({ deleted: before - stats.length });
});

app.get('/status', (req, res) => {
  const time = new Date();
  let formatted = [
    String(time.getDate()).padStart(2, '0'),
    String(time.getMonth() + 1).padStart(2, '0'),
    time.getFullYear(),
    String(time.getHours()).padStart(2, '0'),
    String(time.getMinutes()).padStart(2, '0'),
    String(time.getSeconds()).padStart(2, '0')
  ].join('');

  res.json({ status: 'ok', time: formatted });
  console.log('Получен запрос из скрипта на подключение.')
});

app.listen(3000, '0.0.0.0', () => console.log('🚀 ViMeLlY‑сервер запущен на порту 3000'));