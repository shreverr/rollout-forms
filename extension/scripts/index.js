const isRolloutEditUrl = (url) => {
  const pattern = /^https:\/\/rollout\.site\/projects\/[^\/]+\/edit\/?$/;
  return pattern.test(url);
};

document.getElementById('api-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length > 0 && !isRolloutEditUrl(tabs[0].url)) {
      alert("Please open a website to use this extension.");
      document.getElementById('loading').classList.add('hidden');
      return;

    }
    document.getElementById('add-to-website').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('error').classList.add('hidden');
    document.getElementById('success').classList.add('hidden');

    const api = document.getElementById('api-text').value;

    // Send a message to the content script
    (async () => {
      try {
        const response = await chrome.tabs.sendMessage(tabs[0].id, { api, action: "addScript" });
        console.log('script: ', response);
      } catch (error) {
        console.error("Error in sending message:", error);
        document.getElementById('error').classList.remove('hidden');
      }
    })();
  });
});

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  console.log("Received message from content:", request);

  if (request.action === "status") {
    console.log("Received data from content:", request.success);

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('add-to-website').classList.remove('hidden');

    if (chrome.runtime.lastError) {
      document.getElementById('error').classList.remove('hidden');
      console.error("Error sending message:", chrome.runtime.lastError);
    } else if (request && request.success) {
      document.getElementById('success').classList.remove('hidden');
      console.log("API endpoint added successfully!");
    } else {
      document.getElementById('error').classList.remove('hidden');
      console.error("Failed to add API endpoint.");
    }
  }
});