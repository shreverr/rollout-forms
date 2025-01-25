chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  console.log("Received message from popup:", request);

  if (request.action === "addScript") {
    console.log("Received data from popup:", request.api);
    try {
      const isUpdated = await addAPI(request.api);
      console.log("isUpdated", isUpdated);
      (async () => {
        const response = await chrome.runtime.sendMessage({ success: isUpdated, action: 'status' });
        console.log(response);
      })();
    } catch (error) {
      console.error("Error in addAPI:", error);
      (async () => {
        const response = await chrome.runtime.sendMessage({ success: false, action: 'status' });
        console.log(response);
      })();
    }
  }
});

const BASE_URL = "https://rollout.site";

const getWindowUrl = () => window.location.href;

const getProjectSlug = (url) => url.split('/')[4]

const getAuthToken = () => {
  return localStorage.getItem('token')
}

const getProjectData = async (authToken, projectSlug) => {
  try {
    const response = await fetch(`${BASE_URL}/api/projects/${projectSlug}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Error fetching project data")
    }

    const data = await response.json();
    return data;
  } catch {
    throw new Error("Error fetching project data")
  }
}

const modifyForms = (sections, submitURL) => {
  const updatedSections = sections.map(section => {
    const htmlCode = section.htmlCode;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlCode, 'text/html');

    // Find all <form> elements in the parsed HTML
    const formElements = doc.querySelectorAll('form');

    // Add attributes to each form
    formElements.forEach(form => {
      form.setAttribute('action', submitURL);
      form.setAttribute('method', 'POST');

      const scripts = doc.querySelectorAll('script');
      scripts.forEach(script => {
        // Check if the script contains an event listener for the form's ID
        if (
          script.textContent.includes(`document.getElementById('${form.id}')`) &&
          script.textContent.includes('addEventListener') &&
          script.textContent.includes('submit')
        ) {
          // Remove e.preventDefault() if it exists
          script.textContent = script.textContent.replace(/(\b[a-zA-Z_$][\w$]*\s*\.preventDefault\(\s*\)\s*;?)/g, '');
        }
      });
    });

    // Serialize the updated HTML back to a string
    const updatedHtmlCode = doc.documentElement.innerHTML;

    // Return the section with the updated htmlCode
    return {
      ...section,
      htmlCode: updatedHtmlCode,
    };
  });

  return updatedSections;
}

const updateSections = async (projectId, authToken, sections) => {
  const body = sections.map(section => {
    return {
      id: section.id,
      htmlCode: section.htmlCode,
      order: section.order,
    }
  })

  console.log('updated sections', body);

  try {
    const response = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sections: body,
      }),
    });

    if (!response.ok) {
      throw new Error("Error updating project data")
    }

    const data = await response.json();
    return data;
  } catch {
    throw new Error("Error updating project data")
  }
}

const addAPI = async (apiEndpoint) => {
  const authToken = getAuthToken()
  const projectData = await getProjectData(authToken, getProjectSlug(getWindowUrl()))
  const updatedSections = modifyForms(projectData.Sections, apiEndpoint)
  const updatedData = await updateSections(projectData.id, authToken, updatedSections)

  return updatedData ? true : false
}
