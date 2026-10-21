const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
const PORT = process.env.PORT || 3000;
let articles;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/news', async (req, res) => {
  try { res.json(await articles.find({}).sort({ createdAt: -1 }).toArray()); }
  catch (e) { res.status(500).json({ error: 'Could not load news.' }); }
});

app.post('/api/news', async (req, res) => {
  try {
    const { title, category, content, image } = req.body;
    if (!title?.trim() || !category?.trim() || !content?.trim())
      return res.status(400).json({ error: 'Title, category and story are required.' });
    const article = { title: title.trim(), category: category.trim(), content: content.trim(), image: image?.trim() || '', createdAt: new Date() };
    const result = await articles.insertOne(article);
    res.status(201).json({ ...article, _id: result.insertedId });
  } catch (e) { res.status(500).json({ error: 'Could not save article.' }); }
});

app.put('/api/news/:id', async (req, res) => {
  try {
    const { title, category, content, image } = req.body;
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid article ID.' });
    const result = await articles.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { title: title?.trim(), category: category?.trim(), content: content?.trim(), image: image?.trim() || '' } });
    if (!result.matchedCount) return res.status(404).json({ error: 'Article not found.' });
    res.json({ message: 'Article updated.' });
  } catch (e) { res.status(500).json({ error: 'Could not update article.' }); }
});

app.delete('/api/news/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid article ID.' });
    const result = await articles.deleteOne({ _id: new ObjectId(req.params.id) });
    if (!result.deletedCount) return res.status(404).json({ error: 'Article not found.' });
    res.json({ message: 'Article deleted.' });
  } catch (e) { res.status(500).json({ error: 'Could not delete article.' }); }
});

async function start() {
  try {
    await client.connect();
    articles = client.db('DailyPostDB').collection('Articles');
    await articles.createIndex({ createdAt: -1 });
    app.listen(PORT, '0.0.0.0', () => console.log(`DAILYPOST running at http://localhost:${PORT}`));
  } catch (e) {
    console.error('MongoDB connection failed:', e.message);
    process.exit(1);
  }
}
start();
