(function () {
  const DD = window.__DD;

  function extractData(body) {
    try {
      const data = JSON.parse(body);
      const title = data.mediaMetadata && data.mediaMetadata.title;
      const transcodes =
        data.mediaStreamingData &&
        data.mediaStreamingData.formatStreamingData &&
        data.mediaStreamingData.formatStreamingData.progressiveTranscodes;

      if (title && transcodes && transcodes.length > 0) {
        return {
          title: title,
          progressiveTranscodes: transcodes.map(function (item) {
            return {
              url: item.url,
              height: item.transcodeMetadata && item.transcodeMetadata.height,
              contentLength: item.transcodeMetadata && item.transcodeMetadata.contentLength,
            };
          }),
        };
      }
    } catch (_) {}
    return null;
  }

  function sendToExtension(data) {
    window.postMessage({ id: DD.MSG_ID, payload: data }, '*');
  }

  const originalFetch = window.fetch;
  window.fetch = function () {
    const args = arguments;
    return originalFetch.apply(this, args).then(function (response) {
      if (
        response &&
        response.url &&
        response.url.indexOf(DD.TARGET_URL_PATTERN) === 0 &&
        response.ok
      ) {
        response.clone().text().then(function (body) {
          const data = extractData(body);
          if (data) {
            sendToExtension(data);
          }
        });
      }
      return response;
    });
  };

  const XHRProto = XMLHttpRequest.prototype;
  const origOpen = XHRProto.open;
  const origSend = XHRProto.send;

  XHRProto.open = function (method, url) {
    this.__ddUrl = typeof url === 'string' ? url : '';
    return origOpen.apply(this, arguments);
  };

  XHRProto.send = function () {
    const _this = this;
    if (
      _this.__ddUrl &&
      typeof _this.__ddUrl === 'string' &&
      _this.__ddUrl.indexOf(DD.TARGET_URL_PATTERN) === 0
    ) {
      _this.addEventListener('load', function () {
        if (
          _this.status >= DD.HTTP_STATUS_OK.MIN &&
          _this.status < DD.HTTP_STATUS_OK.MAX
        ) {
          const data = extractData(_this.responseText);
          if (data) {
            sendToExtension(data);
          }
        }
      });
    }
    return origSend.apply(_this, arguments);
  };
})();
