const isRolloutEditUrl = (url) => {
  const pattern = /^https:\/\/rollout\.site\/projects\/[^\/]+\/edit\/?$/;
  return pattern.test(url);
}


document.getElementById('api-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length > 0 && !isRolloutEditUrl(tabs[0].url)) {
        alert("Please open a website to use this extension.");
        return;
    }

    const api = document.getElementById('api-text').value;
    // Send a message to the content script
    chrome.tabs.sendMessage(tabs[0].id, { api, action: "addScript" }, function (response) {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
      } else {
        console.log("is success", response.success);
      }
    });
  });
})
