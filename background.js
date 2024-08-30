chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "consolelog") {
    console.log(request.message);
  }
  if (request.action === "consoleerror") {
    console.error(request.message);
  }
  
});