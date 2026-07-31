const MSG_VIDEO_CAPTURED = 'VIDEO_CAPTURED';
const MSG_CLEAR_VIDEOS = 'CLEAR_VIDEOS';
const STORAGE_KEY = 'capturedVideos';

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === MSG_VIDEO_CAPTURED) {
    chrome.storage.local.get(STORAGE_KEY, function (result) {
      const videos = result[STORAGE_KEY] || [];
      videos.push({
        timestamp: Date.now(),
        title: message.payload.title,
        qualities: message.payload.progressiveTranscodes,
      });
      const obj = {};
      obj[STORAGE_KEY] = videos;
      chrome.storage.local.set(obj);
    });
  }

  if (message.type === MSG_CLEAR_VIDEOS) {
    chrome.storage.local.remove(STORAGE_KEY, function () {
      sendResponse({ success: true });
    });
    return true;
  }
});
