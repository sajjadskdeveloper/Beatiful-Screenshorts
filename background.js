// Background service worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request);
    if (request.action === 'captureScreenshot') {
        console.log('Capturing screenshot with data:', request.data);
        captureAndProcessScreenshot(request.data, request.openEditor, request.applySettings);
    }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
    console.log('Keyboard command received:', command);
    
    if (command === 'take-area-screenshot') {
        try {
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab) {
                console.log('Triggering area selection for tab:', tab.id);
                
                // Get saved settings for editor preference
                const result = await chrome.storage.sync.get(['openEditor', 'applySettings']);
                const openEditor = result.openEditor !== undefined ? result.openEditor : true;
                const applySettings = result.applySettings !== undefined ? result.applySettings : true;
                
                // Send message to content script to start area selection
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'startAreaSelection',
                    openEditor: openEditor,
                    applySettings: applySettings
                });
            }
        } catch (error) {
            console.error('Error handling keyboard shortcut:', error);
        }
    }
});

async function captureAndProcessScreenshot(data, openEditor = true, applySettings = true) {
    try {
        console.log('Starting screenshot capture...');
        console.log('Open editor:', openEditor);
        console.log('Apply settings:', applySettings);
        
        // Capture the visible tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('Active tab:', tab);
        
        // Take screenshot
        const screenshot = await chrome.tabs.captureVisibleTab(null, {
            format: 'png',
            quality: 100
        });
        
        console.log('Screenshot captured, data URL length:', screenshot.length);

        // Send the screenshot data to the content script for processing
        await chrome.tabs.sendMessage(tab.id, {
            action: 'processScreenshot',
            screenshot: screenshot,
            selectionData: data,
            openEditor: openEditor,
            applySettings: applySettings
        });
        
        console.log('Screenshot data sent to content script');

    } catch (error) {
        console.error('Error capturing screenshot:', error);
    }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Beautiful Screenshots extension installed');
}); 