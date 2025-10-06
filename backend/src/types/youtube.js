/**
 * YouTube 相關類型定義
 */

/**
 * @typedef {Object} LiveStream
 * @property {string} id - 影片 ID
 * @property {string} title - 直播標題
 * @property {string} description - 直播描述
 * @property {string} channelId - 頻道 ID
 * @property {string} channelTitle - 頻道名稱
 * @property {string} thumbnailUrl - 縮圖網址
 * @property {number} viewerCount - 觀看人數
 * @property {string} startTime - 開始時間
 * @property {string} chatId - 聊天室 ID
 */

/**
 * @typedef {Object} YouTubeCredentials
 * @property {string} access_token - 存取令牌
 * @property {string} refresh_token - 刷新令牌
 * @property {string} scope - 權限範圍
 * @property {string} token_type - 令牌類型
 * @property {number} expiry_date - 過期時間
 */

/**
 * @typedef {Object} CrawlerSession
 * @property {string} streamerId - 直播主 ID
 * @property {string} videoId - 影片 ID
 * @property {string} chatId - 聊天室 ID
 * @property {boolean} isActive - 是否啟用
 * @property {string} [nextPageToken] - 下一頁令牌
 * @property {number} pollingInterval - 輪詢間隔
 * @property {Date} lastMessageTime - 最後訊息時間
 * @property {number} errorCount - 錯誤計數
 * @property {Date} startTime - 開始時間
 */

module.exports = {};
