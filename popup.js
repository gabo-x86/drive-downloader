const STORAGE_KEY = 'capturedVideos';
const MSG_CLEAR_VIDEOS = 'CLEAR_VIDEOS';
const EL_VIDEO_LIST = 'video-list';
const EL_EMPTY_STATE = 'empty-state';
const EL_STATUS = 'status';
const EL_CLEAR_BTN = 'clear-btn';
const TXT_EMPTY = 'Open a video in Google Drive first';
const TXT_CLEARED = 'List cleared';
const TXT_DOWNLOADING = 'Downloading: ';
const TXT_ERROR = 'Error: ';
const FILENAME_SUFFIX = 'p.mp4';
const SIZE_UNITS = ['B', 'KB', 'MB', 'GB'];
const SIZE_DIVISOR = 1024;
const SIZE_DECIMALS = 1;
const DECIMAL_RADIX = 10;
const LABEL_SEPARATOR = ' \u2022 ';

(function () {
  const container = document.getElementById(EL_VIDEO_LIST);
  const empty = document.getElementById(EL_EMPTY_STATE);
  const status = document.getElementById(EL_STATUS);

  function formatBytes(bytes) {
    if (bytes === 0 || !bytes) {
      return '0 B';
    }
    const i = Math.floor(Math.log(bytes) / Math.log(SIZE_DIVISOR));
    return (
      parseFloat((bytes / Math.pow(SIZE_DIVISOR, i)).toFixed(SIZE_DECIMALS)) +
      ' ' +
      SIZE_UNITS[i]
    );
  }

  function sanitizeFilename(name) {
    return name.replace(/[<>:"\/\\|?*\x00-\x1f]/g, '_').trim();
  }

  function downloadVideo(title, quality) {
    const base = sanitizeFilename(title);
    const filename = base + '_' + quality.height + FILENAME_SUFFIX;

    chrome.downloads.download(
      { url: quality.url, filename: filename },
      function (id) {
        if (chrome.runtime.lastError) {
          status.textContent = TXT_ERROR + chrome.runtime.lastError.message;
        } else {
          status.textContent = TXT_DOWNLOADING + filename;
        }
      }
    );
  }

  function render() {
    chrome.storage.local.get(STORAGE_KEY, function (result) {
      const videos = result[STORAGE_KEY] || [];

      if (videos.length === 0) {
        empty.style.display = 'block';
        container.innerHTML = '';
        return;
      }

      empty.style.display = 'none';
      container.innerHTML = '';

      videos.forEach(function (video) {
        video.qualities.forEach(function (q) {
          const size = formatBytes(parseInt(q.contentLength, DECIMAL_RADIX));
          const label =
            video.title + LABEL_SEPARATOR + q.height + 'p' + LABEL_SEPARATOR + size;

          const item = document.createElement('div');
          item.className = 'quality-item';
          item.textContent = label;
          item.addEventListener('click', function () {
            downloadVideo(video.title, q);
          });
          container.appendChild(item);
        });
      });
    });
  }

  document.getElementById(EL_CLEAR_BTN).addEventListener('click', function () {
    chrome.runtime.sendMessage({ type: MSG_CLEAR_VIDEOS }, function () {
      render();
      status.textContent = TXT_CLEARED;
    });
  });

  render();
})();
