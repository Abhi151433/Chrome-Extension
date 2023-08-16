// Function to dynamically inject the supabase.js script as a module
function injectSupabaseScript() {
  const script = document.createElement("script");
  script.type = "module";
  script.src = chrome.runtime.getURL("../background.js");
  document.head.appendChild(script);
}

// Inject the supabase.js script as a module
injectSupabaseScript();

const tracking = {};

// Function to start tracking time for a post
function startTrackingTime(postId) {
  console.log("inside strtTime", postId);
  if (!tracking[postId].isTracked) {
    tracking[postId].startTime = new Date();
    tracking[postId].isTracked = true;
    chrome.runtime.sendMessage({
      type: "startTimer",
      payload: {
        postId,
      },
    });
  }
}

// Function to stop tracking time for a post
function stopTrackingTime(postId) {
  if (tracking[postId].isTracked) {
    const endTime = new Date();
    const timeSpent = endTime - tracking[postId].startTime; // Time difference in milliseconds
    const secondsSpent = Math.round(timeSpent / 1000); // Convert to seconds
    chrome.runtime.sendMessage({
      type: "endTimer",
      payload: {
        postId,
      },
    });
    // You can now use 'secondsSpent' to display or send the time spent to a server.
    console.log(`Time spent on Post ${postId}: ${secondsSpent} seconds`);
    tracking[postId].isTracked = false;
  }
}

const observerCallback = (entries) => {
  entries.forEach((entry) => {
    const postId = entry.target.id;
    if (entry.isIntersecting) {
      startTrackingTime(postId);
    } else {
      stopTrackingTime(postId);
    }
  });
};

const observerOptions = {
  root: null,
  threshold: 0, // The percentage of the post element that must be visible to trigger the callback
};

const observer = new IntersectionObserver(observerCallback, observerOptions);

//This function will add the select tags after each post so that the user can select a tag for the post
function addTextToPosts() {
  //Fetching all the posts by the classname
  const postElements = document.querySelectorAll(".feed-shared-update-v2");
  postElements.forEach((postElement) => {
    if (postElement && !tracking.hasOwnProperty(postElement.id)) {
      tracking[postElement.id] = { isTracked: false };
    }
    console.log(tracking);
    //addedExtraDiv is a class that we are adding to make sure that a post does not get repeated in this process
    if (postElement && !postElement.classList.contains("addedExtraDiv")) {
      const extraDiv = document.createElement("select");
      const postId = postElement.id;
      //We are fetching the content of the post using the dir attribute of the span tag of content
      const postContent = postElement.querySelectorAll(
        "span.break-words span[dir=ltr]"
      );
      extraDiv.setAttribute("postId", postId);
      extraDiv.setAttribute("postContent", postContent[0].innerText);
      postElement.classList.add("addedExtraDiv");
      // Create the placeholder option
      const placeholderOption = document.createElement("option");
      placeholderOption.disabled = true;
      placeholderOption.selected = true;
      placeholderOption.text = "Select Tag";

      // Create the useful option
      const usefulOption = document.createElement("option");
      usefulOption.value = "useful";
      usefulOption.text = "Useful";

      // Create the repetitive option
      const repetitiveOption = document.createElement("option");
      repetitiveOption.value = "repetitive";
      repetitiveOption.text = "Repetitive";

      // Create the notUseful option
      const notUsefulOption = document.createElement("option");
      notUsefulOption.value = "not_useful";
      notUsefulOption.text = "Not Useful";

      // Append options to the select element
      extraDiv.appendChild(placeholderOption);
      extraDiv.appendChild(usefulOption);
      extraDiv.appendChild(repetitiveOption);
      extraDiv.appendChild(notUsefulOption);
      postElement.appendChild(extraDiv);
      extraDiv.addEventListener("change", () => {
        const postId = extraDiv.getAttribute("postId");
        const postContent = extraDiv.getAttribute("postContent");
        const tagValue = extraDiv.value;
        if (extraDiv.value === "useful") {
          extraDiv.style.backgroundColor = "#95f98a";
        }
        if (extraDiv.value === "repetitive") {
          extraDiv.style.backgroundColor = "#ffca7e";
        }
        if (extraDiv.value === "not_useful") {
          extraDiv.style.backgroundColor = "#f98a8a";
        }
        //this code will send message which will be received by the code block in background.js
        chrome.runtime.sendMessage({
          type: "updateTag",
          payload: {
            postId,
            tagValue,
            postContent,
          },
        });
      });
      observer.observe(postElement);
    }
  });
}

const postVisibilityStates = {};

// Observe changes in the feed and apply modifications
const feedObserver = new MutationObserver(() => {
  addTextToPosts();
});
const feedContainer = document.querySelector(
  ".scaffold-finite-scroll__content"
);

if (feedContainer) {
  // Initial modification
  addTextToPosts();
  // Observe changes in the feed (e.g., when new posts are loaded)
  feedObserver.observe(feedContainer, { childList: true, subtree: true });
}
