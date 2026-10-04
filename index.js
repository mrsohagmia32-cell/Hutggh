const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ১. বটের টোকেন এবং টার্গেট গ্রুপসমূহ
const BOT_TOKEN = process.env.BOT_TOKEN || '8823058732:AAHkg90DPjWkSoqC9f8v0uJF7rx5Z_CdPnM';
const TARGET_GROUPS = [
    '-1004443734371',
    '-1004359495335',
    '-1004443587947',
    '-1004355518055'
];

const bot = new Telegraf(BOT_TOKEN);

// সার্ভার লাইভ আছে কিনা চেক করার রুট
app.get('/', (req, res) => {
    res.send('🚀 Render Auto-Poster Backend Server is Active!');
});

// PHP থেকে পোস্ট রিসিভ করার এন্ডপয়েন্ট
app.post('/process-post', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ success: false, message: 'Text payload is required.' });
    }

    // PHP-কে সাথে সাথে 200 OK রেসপন্স দিয়ে দেওয়া যেন PHP আটকে না থাকে
    res.json({ success: true, message: 'Message queued on Render server.' });

    // ব্যাকগ্রাউন্ডে ১.৫ সেকেন্ড পরপর ৪টি টার্গেট গ্রুপে পোস্ট পাঠানো
    console.log(`[${new Date().toLocaleTimeString()}] 📥 PHP থেকে নতুন পোস্ট পাওয়া গেছে। পাঠানো শুরু হচ্ছে...`);

    for (const targetGroupId of TARGET_GROUPS) {
        try {
            await bot.telegram.sendMessage(targetGroupId, text);
            console.log(`✅ সফলভাবে পোস্ট গেছে গ্রুপ ID: ${targetGroupId}`);
            // Rate limit এড়াতে ১.৫ সেকেন্ড বিরতি
            await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (error) {
            console.error(`❌ গ্রুপ ID ${targetGroupId}-তে পোস্ট পাঠাতে সমস্যা:`, error.message);
        }
    }
});

// Render-এর পোর্টে সার্ভার লিসেন করানো
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
});
