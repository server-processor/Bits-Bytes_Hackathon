chrome.runtime.sendMessage({ action: "consolelog", message: "This is a log from content.js" });

navigator.mediaDevices.getUserMedia({ audio: true })
.then(stream => {
    chrome.runtime.sendMessage({ action: "consolelog", message: "Microphone permission granted" });
    //console.log('Microphone permission granted');
    
    chrome.runtime.sendMessage({ action: "consolelog", message: "Started Listening:" });
    //console.log('Started Listening:');
  
    const recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.continuous = true; // Set to true to keep listening even after a result is returned
    recognition.interimResults = true;
    
    let commandBuffer = [];
    let isListeningForCommand = false;
    let result = "";
    
    recognition.onresult = function(event) {
        
        //chrome.runtime.sendMessage({ action: "consolelog", message: "Recognized" });
        
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript.trim();
        
        //chrome.runtime.sendMessage({ action: "consolelog", message: transcript });
        
        if (transcript.toLowerCase().includes('delta')) {
            chrome.runtime.sendMessage({ action: "consolelog", message: "Delta found" });
            isListeningForCommand = true;
            commandBuffer = []; // Clear the buffer to start a new command
          }
          
        if (isListeningForCommand) {
            commandBuffer.push(transcript);
          }
          
             // Check for a pause in speech and process the buffered command
      if (event.results[current].isFinal) {
        if (isListeningForCommand) {
          result = commandBuffer;
          chrome.runtime.sendMessage({ action: "consolelog", message: "Final transcript i.e. result" });
          chrome.runtime.sendMessage({ action: "consolelog", message: result });
          captureAndProcess(result);
          isListeningForCommand = false; // Reset listening state
          commandBuffer = []; // Clear the command buffer
        }
      }
        //const result = event.results[event.results.length - 1][0].transcript.toLowerCase();
        
        //console.log('Recognized speech:', result);

        /*if (result.includes('delta')) {
            //recognition.stop(); // Stop listening once the phrase is recognized
            captureAndProcess(result); // Trigger the main function
        }*/
    };

    recognition.onerror = function(event) {
        chrome.runtime.sendMessage({ action: "consoleerror", message: event.error });
        console.error('Speech recognition error:', event.error);
    };

    recognition.onend = function() {
        chrome.runtime.sendMessage({ action: "consolelog", message: "Speech recognition ended" });
        console.log('Speech recognition ended');
        // Optionally restart listening or handle the end of speech recognition
    };

    //chrome.runtime.sendMessage({ action: "consolelog", message: "Started Listening again:" });
    recognition.start();
    
})
.catch(err => {
    console.error('Error accessing microphone:', err);
      console.error('Error accessing microphone:', err.message);
      console.error('Error accessing microphone:', err.name);
    })

function captureAndProcess(result) {
    chrome.runtime.sendMessage({ action: "consolelog", message: "Capture start" });
    chrome.runtime.sendMessage({ action: 'captureVisibleTab', speechResult: result });
    chrome.runtime.sendMessage({ action: "consolelog", message: "Capture end" });
}