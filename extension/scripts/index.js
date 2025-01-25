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
    chrome.tabs.sendMessage(
      tabs[0].id,
      { api, action: "addScript" },
      function (response) {
        // Hide loading spinner
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('add-to-website').classList.remove('hidden');

        if (chrome.runtime.lastError) {
          // Show error message
          document.getElementById('error').classList.remove('hidden');
          console.error("Error sending message:", chrome.runtime.lastError);
        } else if (response && response.success) {
          // Show success message
          document.getElementById('success').classList.remove('hidden');
          console.log("API endpoint added successfully!");
        } else {
          // Show error message
          document.getElementById('error').classList.remove('hidden');
          console.error("Failed to add API endpoint.");
        }
      }
    );
  });
});