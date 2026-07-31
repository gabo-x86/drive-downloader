const MSG_ID = '__DRIVE_DOWNLOADER_CAPTURE__';
const MSG_VIDEO_CAPTURED = 'VIDEO_CAPTURED';

const constantsScript = document.createElement('script');
constantsScript.src = chrome.runtime.getURL('constants.js');
constantsScript.onload = function () {
  const injectedScript = document.createElement('script');
  injectedScript.src = chrome.runtime.getURL('injected.js');

  injectedScript.onload = function () {
    injectedScript.remove();
  };

  (document.head || document.documentElement).appendChild(injectedScript);
  constantsScript.remove();
};
(document.head || document.documentElement).appendChild(constantsScript);

window.addEventListener('message', function (event) {
  if (event.source !== window) {
    return;
  }
  if (!event.data || event.data.id !== MSG_ID) {
    return;
  }

  chrome.runtime.sendMessage({
    type: MSG_VIDEO_CAPTURED,
    payload: event.data.payload,
  });
});
