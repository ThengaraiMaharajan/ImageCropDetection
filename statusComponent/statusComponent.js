const confirmationMessage = document.getElementById('confirmationMessage');
window.onload = function() {
  const statusCode = getQueryParam('statusCode');
  const decodedStatusCode = decodeURIComponent(statusCode);
  const parsedStatusCode = parseInt(decodedStatusCode)
  const status = getQueryParam('status');
  
  if (parsedStatusCode === 1) {
    confirmationMessage.innerHTML = `
      <p class="text-success text-center">Your file has been ${decodeURIComponent(status)}fully Uploaded</p>
      <p class="text-center">File Upload ID : <strong>${decodeURIComponent(parsedStatusCode)}</strong> </p>
    `;
  } else {
    confirmationMessage.innerHTML = `
      <p class="text-danger">File Upload Failed</p>
      <p class="text-success text-center">File Upload ID : ${decodeURIComponent(status)}</p>
    `;
  }
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}