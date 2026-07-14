/**
 * Feedback Pipeline: Slack -> Google Sheets
 * Polls a Slack channel, classifies sentiment, dedupes, and logs to a sheet.
 */

function syncFeedback() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('SLACK_BOT_TOKEN');
  const channelId = CONFIG.CHANNEL_ID;
  const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName('Feedback');

  const messages = fetchSlackMessages(channelId, token);
  const existingIds = getExistingMessageIds(sheet);

  const rowsToAdd = [];

  messages.forEach(function (msg) {
    if (isSystemMessage(msg)) return;

    const uniqueId = channelId + '_' + msg.ts;
    if (existingIds.has(uniqueId)) return;

    const sentiment = classifySentiment(msg.text);

    rowsToAdd.push([
      new Date(parseFloat(msg.ts) * 1000),
      msg.user || 'unknown',
      msg.text,
      sentiment,
      'New',
      uniqueId
    ]);
  });

  if (rowsToAdd.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, rowsToAdd[0].length)
      .setValues(rowsToAdd);
    Logger.log(rowsToAdd.length + ' new feedback item(s) logged.');
  } else {
    Logger.log('No new feedback since last sync.');
  }
}

function fetchSlackMessages(channelId, token) {
  const url = 'https://slack.com/api/conversations.history?channel=' + channelId + '&limit=200';
  const response = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + token }
  });
  const data = JSON.parse(response.getContentText());
  if (!data.ok) {
    throw new Error('Slack API error: ' + data.error);
  }
  return data.messages || [];
}

function isSystemMessage(msg) {
  const systemSubtypes = ['channel_join', 'channel_leave', 'channel_topic', 'channel_purpose', 'bot_message'];
  return !!msg.subtype && systemSubtypes.indexOf(msg.subtype) !== -1;
}

function getExistingMessageIds(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return new Set();
  const ids = sheet.getRange(2, 6, lastRow - 1, 1).getValues().flat();
  return new Set(ids.filter(String));
}

function classifySentiment(text) {
  const lower = (text || '').toLowerCase();

  const negative = ['bug', 'broken', 'crash', 'issue', 'problem', 'confusing', 'slow', 'frustrat', "doesn't work", 'not working'];
  const positive = ['love', 'great', 'awesome', 'thanks', 'nice', 'works well', 'helpful', 'perfect'];

  const hasNegative = negative.some(function (kw) { return lower.indexOf(kw) !== -1; });
  const hasPositive = positive.some(function (kw) { return lower.indexOf(kw) !== -1; });

  if (hasNegative && !hasPositive) return 'Negative';
  if (hasPositive && !hasNegative) return 'Positive';
  if (hasPositive && hasNegative) return 'Mixed';
  return 'Neutral';
}
