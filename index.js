const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: "مرحباً بك في سيرفر الأحاديث!", status: "Running" });
});

// هذا الرابط التجريبي سنستخدمه لاحقاً للتأكد من العمل
app.get('/api/test', (req, res) => {
    res.json({ data: "API يعمل بنجاح" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
