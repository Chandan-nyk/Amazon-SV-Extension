function show_headers(details) {
    let header;
    for (var i = 0; i < details.responseHeaders.length; ++i) {
      name = details.responseHeaders[i].name.toLowerCase();
      if ( name == 'x-frame-options' || name === 'frame-options') {
        details.responseHeaders.splice(i, 1);
        return {
          responseHeaders: details.responseHeaders
        };
//        console.log(details.responseHeaders[i].name.toLowerCase())
      }
    }    
}


browser.webRequest.onHeadersReceived.addListener(
  show_headers,
  {urls: ["<all_urls>"]},
  ["blocking", "responseHeaders"]
);
