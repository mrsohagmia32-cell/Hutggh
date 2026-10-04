const { Telegraf } = require('telegraf');
const cron = require('node-cron');

// ১. আপনার টেলিগ্রাম বটের টোকেন
const BOT_TOKEN = '8823058732:AAHkg90DPjWkSoqC9f8v0uJF7rx5Z_CdPnM';
const bot = new Telegraf(BOT_TOKEN);

// ২. আপনার মেইন গ্রুপের আইডি (কোটেশন বা ' ' এর ভেতরে দিন)
const MAIN_GROUP_ID = '-1004440767818'; 

// ৩. টার্গেট গ্রুপগুলোর আইডি (কোটেশন বা ' ' এর ভেতরে দিন)
const TARGET_GROUPS = [
    '-1004443734371',
    '-1004359495335',
    '-1004443587947',
    '-1004355518055'
];

let postQueue = [];
let intervalMinutes = 5; // ডিফল্ট ৫ মিনিট পর পর পোস্ট যাবে
let currentCronTask = null;

// ৪. ক্রন জব বা শিডিউলার ফাংশন
function setupScheduler(minutes) {
    if (currentCronTask) {
        currentCronTask.stop(); // আগের শিডিউল বন্ধ করা
    }

    const cronExpression = `*/${minutes} * * * *`;
    
    currentCronTask = cron.schedule(cronExpression, async () => {
        if (postQueue.length > 0) {
            const postToShare = postQueue.shift(); 

            console.log(`[${new Date().toLocaleTimeString()}] 🚀 টার্গেট গ্রুপগুলোতে পোস্ট পাঠানো হচ্ছে...`);

            for (const targetGroupId of TARGET_GROUPS) {
                try {
                    await bot.telegram.sendMessage(targetGroupId, postToShare.text);
                    console.log(`✅ সফলভাবে পোস্ট গেছে গ্রুপ আইডি: ${targetGroupId}`);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                } catch (error) {
                    console.error(`❌ গ্রুপ আইডি ${targetGroupId}-তে পাঠাতে সমস্যা হয়েছে:`, error.message);
                }
            }
        } else {
            console.log(`[${new Date().toLocaleTimeString()}] ℹ️ কিউ-তে পাঠানোর মতো কোনো নতুন পোস্ট নেই।`);
        }
    });

    console.log(`⚙️ টাইমার আপডেট করা হয়েছে: প্রতি ${minutes} মিনিট পর পর পোস্ট হবে।`);
}

// ৫. টাইমার সেট করার কমান্ড: /settime 10
bot.command('settime', (ctx) => {
    const args = ctx.message.text.split(' ');
    const minutes = parseInt(args[1]);

    if (isNaN(minutes) || minutes <= 0) {
        return ctx.reply('⚠️ দয়া করে সঠিক মিনিট দিন। যেমন: `/settime 10`', { parse_mode: 'Markdown' });
    }

    intervalMinutes = minutes;
    setupScheduler(intervalMinutes);
    ctx.reply(`✅ সফলভাবে টাইমার সেট করা হয়েছে! এখন থেকে প্রতি *${intervalMinutes}* মিনিট পর পর পোস্ট যাবে।`, { parse_mode: 'Markdown' });
});

// ৬. বর্তমান টাইমার চেক করার কমান্ড: /checktime
bot.command('checktime', (ctx) => {
    ctx.reply(`⏱️ বর্তমান টাইমার সেট করা আছে: প্রতি *${intervalMinutes}* মিনিট পর পর।`, { parse_mode: 'Markdown' });
});

// ৭. মেইন গ্রুপ থেকে মেসেজ ট্র্যাক করা
bot.on('message', (ctx) => {
    try {
        if (ctx.chat && ctx.chat.id.toString() === MAIN_GROUP_ID.toString()) {
            const messageText = ctx.message.text || ctx.message.caption || '';
            
            // মেসেজে টিক চিহ্ন (✅) এবং লিংক (http) থাকতে হবে
            if (messageText.includes('✅') && messageText.includes('http')) {
                postQueue.push({
                    text: messageText
                });
                console.log(`📥 নতুন পোস্ট কিউ-তে যুক্ত হয়েছে। মোট কিউ: ${postQueue.length}`);
            }
        }
    } catch (err) {
        console.error("❌ মেসেজ পড়তে সমস্যা হয়েছে:", err.message);
    }
});

// ৮. বট স্টার্ট করা এবং ডিফল্ট শিডিউল চালু করা
bot.launch().then(() => {
    console.log("🤖 অটো-পোস্টার বট সফলভাবে চালু হয়েছে!");
    setupScheduler(intervalMinutes);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
