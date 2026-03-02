/**
 * Injected JavaScript to intercept blob URL creation for file downloads.
 * When the web app creates a blob URL for a downloadable file (like CSV export),
 * this script converts the blob to base64 and sends it to the native app
 * via postMessage for proper file handling using expo-file-system and expo-sharing.
 */
export const injectedJavaScript = `
  ;(function() {
    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = function(blob) {
      const url = originalCreateObjectURL.call(URL, blob);

      // Check if this is a downloadable file type
      const downloadableTypes = [
        'text/csv',
        'application/csv',
        'application/octet-stream',
        'text/plain',
        'application/json'
      ];

      if (blob instanceof Blob && downloadableTypes.includes(blob.type)) {
        const reader = new FileReader();
        reader.onloadend = function() {
          if (reader.result && typeof reader.result === 'string') {
            const base64 = reader.result.split(',')[1];
            if (base64 && window.ReactNativeWebView) {
              // Determine filename and extension based on MIME type
              const mimeToExt = {
                'text/csv': '.csv',
                'application/csv': '.csv',
                'application/json': '.json',
                'text/plain': '.txt',
                'application/octet-stream': '.csv' // Default to CSV for history export
              };
              const ext = mimeToExt[blob.type] || '.csv';
              const filename = 'transaction-history' + ext;

              window.ReactNativeWebView.postMessage(JSON.stringify({
                cmd: 'downloadFile',
                data: base64,
                filename: filename,
                mimeType: blob.type || 'application/octet-stream'
              }));
            }
          }
        };
        reader.readAsDataURL(blob);
      }

      return url;
    };
  })();
`
