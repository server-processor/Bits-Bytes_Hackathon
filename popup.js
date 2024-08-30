document.getElementById('start-recognition').addEventListener('click', async () => {
    const activeTab = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTabId = activeTab[0].id;
    chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        files: ["content.js"]
    });
});



// Variable to track speech pause state
let isSpeechPaused = false;

// Variable to track speech synthesis
let currentSpeech;

// Function to play chime sound
function playChime() {
    const chimeAudio = new Audio('hello.mp3'); // Replace 'path/to/chime.mp3' with the actual path to your chime sound file
    chimeAudio.play();
}

document.addEventListener('keydown', function (event) {
    if (event.code === 'Space') {
            if (isSpeechPaused) {
                window.speechSynthesis.resume();
            } else {
                window.speechSynthesis.pause();
            }
            isSpeechPaused = !isSpeechPaused;
    }
});

document.addEventListener('keydown', async function (event) {
    if (event.code === 'Enter') { // Check for the "Enter" key
        // Cancel speech synthesis
        isSpeechPaused = false; // Reset the speech pause state
        if (currentSpeech) {
            window.speechSynthesis.cancel();
            currentSpeech = null;
        }

        // Execute Chrome extension script
        const activeTab = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTabId = activeTab[0].id;
        chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            files: ["content.js"]
        });
    }
});


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // if (request.action === "consolelog") {
    // // Display the message in the #console-log element
    // var consoleLogElement = document.getElementById('console-log');
    // consoleLogElement.innerHTML += request.message + '<br>';
    // // Update UI based on the message
    // } else if (request.action === "consoleerror") {
    // console.error(request.message);
    // }
    if (request.action === 'captureVisibleTab') {

        console.log("Capture tab received");
        const speechResult = request.speechResult;

        chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (imageUrl) {
            if (chrome.runtime.lastError) {
                alert('Error capturing screenshot: ' + chrome.runtime.lastError.message);
                return;
            }

            // Convert the data URL to a Blob for uploading
            fetch(imageUrl)
                .then(res => res.blob())
                .then(blob => {
                    const formData = new FormData();
                    formData.append('image', blob);
                    formData.append('key', '7f6e15ba900a9760626037ab4946451c'); // Replace with your ImgBB API key

                    // POST request to ImgBB API
                    return fetch('https://api.imgbb.com/1/upload', {
                        method: 'POST',
                        body: formData
                    });
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        const uploadedImageUrl = result.data.url;

                        // Copy the URL to the clipboard
                        navigator.clipboard.writeText(uploadedImageUrl).then(() => {
                            console.log('Image URL copied to clipboard');
                        });

                        // Prepare the body for the second API call
                        const body = JSON.stringify({
                            image_url: uploadedImageUrl,
                            speech_prompt: speechResult
                        });

                        // Make the second API call within this scope
                        return fetch('https://still-lowlands-42660-f33a7feb5e1b.herokuapp.com/run', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json' // Set the correct content type
                            },
                            body: body
                        });
                    } else {
                        throw new Error('Error uploading image: ' + JSON.stringify(result));
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`API request failed with status ${response.status}`);
                    }
                    return response.json(); // Parse the JSON response
                })
                .then(data => {
                    console.log('API response:', data);

                    // Assuming 'data' contains a property 'result' with text to speak
                    const speechText = data.result; // Replace 'result' with the property name from your API response

                    // Speech synthesis
                    if ('speechSynthesis' in window) {
                        // Stop any ongoing speech
                        if (currentSpeech) {
                            window.speechSynthesis.cancel();
                            currentSpeech = null;
                        }
                        playChime()

                        const speech = new SpeechSynthesisUtterance(speechText);
                        speech.lang = 'en-US'; // Set language if needed
                        speech.volume = 1; // Set volume (0 to 1)
                        speech.rate = 1; // Set rate (0.1 to 10)

                        // Speak the response
                        window.speechSynthesis.speak(speech);
                        currentSpeech = speech;
                    } else {
                        console.error('Speech synthesis not supported');
                    }
                    playChime()
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        });
    }
});