const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// الحصول على رابط الاتصال بأمان من المتغيرات البيئية في Render
const mongoURI = process.env.MONGO_URI;
const itemsPerPage = 50;

// ======================================
// 1. تعريف نموذج البيانات (Hadith Schema)
// ======================================
const hadithSchema = new mongoose.Schema({
    hadithNumber: String,
    text: String,
    bookId: String,
    bookName: String,
    grades: Array
}, { collection: 'hadiths' }); // تحديد اسم المجموعة التي تم الرفع إليها
const Hadith = mongoose.model('Hadith', hadithSchema);


// ======================================
// 2. الاتصال بقاعدة البيانات
// ======================================
if (mongoURI) {
    mongoose.connect(mongoURI)
        .then(() => console.log('✅ MongoDB Connected Successfully!'))
        .catch(err => console.error('❌ MongoDB Connection Error:', err));
} else {
    console.error('❌ MONGO_URI is not set!');
}


app.use(cors());
app.use(express.json());

// ======================================
// 3. نقطة الوصول الرئيسية (API Endpoint)
// ======================================
// الرابط المتوقع من التطبيق سيكون: /api/hadith/ara-bukhari?page=1&search=كلمة
app.get('/api/hadith/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || '';

        // تحديد شرط البحث
        let query = {};
        if (bookId !== 'all') { // إذا لم يكن البحث شاملاً (سنستخدم 'all' للبحث الشامل لاحقاً)
            query.bookId = bookId;
        }

        // إضافة شرط البحث النصي
        if (search) {
            // البحث عن تطابق جزئي داخل حقل النص ورقم الحديث
            query.$or = [
                { text: { $regex: search, $options: 'i' } }, // i = Case-insensitive
                { hadithNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        // جلب عدد الأحاديث الكلي المطابقة للشرط (للتنقل بين الصفحات)
        const totalItems = await Hadith.countDocuments(query);
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // جلب البيانات للصفحة المطلوبة
        const hadiths = await Hadith.find(query)
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage)
            .select('hadithNumber text grades bookName') // تحديد الحقول المطلوبة فقط
            .lean(); // لتحسين الأداء

        res.json({
            status: 'success',
            page: page,
            totalItems: totalItems,
            totalPages: totalPages,
            data: hadiths
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ status: 'error', message: 'حدث خطأ داخلي في السيرفر' });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
