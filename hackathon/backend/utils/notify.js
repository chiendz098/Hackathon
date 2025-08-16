const axios = require('axios');

async function sendPushNotification({ title, message, userIds }) {
  const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
  const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) return;

  await axios.post('https://onesignal.com/api/v1/notifications', {
    app_id: ONESIGNAL_APP_ID,
    headings: { en: title },
    contents: { en: message },
    include_external_user_ids: userIds, // hoặc include_player_ids nếu dùng playerId
  }, {
    headers: {
      'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
}

module.exports = { sendPushNotification }; 