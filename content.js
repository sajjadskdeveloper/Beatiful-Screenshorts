// Content script for handling screenshots and area selection
let isSelecting = false;
let selectionBox = null;
let startX, startY;
let isOpenEditor = true;
let isApplySettings = true;

// Global reference for the editor window
let editorWindow = null;

// Listen for messages from popup and background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    console.log('Message details - action:', request.action, 'openEditor:', request.openEditor, 'applySettings:', request.applySettings);
    
    if (request.action === 'takeFullScreenshot') {
        console.log('Taking full screenshot with applySettings:', request.applySettings);
        takeFullScreenshot(request.openEditor, request.applySettings);
    } else if (request.action === 'startAreaSelection') {
        console.log('Starting area selection with applySettings:', request.applySettings);
        // Add a brief visual indicator that the shortcut was triggered
        showShortcutIndicator();
        startAreaSelection(request.openEditor, request.applySettings);
    } else if (request.action === 'processScreenshot') {
        console.log('Processing screenshot with applySettings:', request.applySettings);
        processScreenshot(request.screenshot, request.selectionData, request.openEditor, request.applySettings);
    } else if (request.action === 'testApplySettings') {
        console.log('Testing apply settings functionality');
        testApplySettings();
    } else if (request.action === 'saveTestSettings') {
        console.log('Saving test settings');
        saveTestSettings();
    }
});

function takeFullScreenshot(openEditor = true, applySettings = true) {
    // Send message to background script to capture full screenshot
    chrome.runtime.sendMessage({
        action: 'captureScreenshot',
        data: { type: 'fullscreen' },
        openEditor: openEditor,
        applySettings: applySettings
    });
}

function startAreaSelection(openEditor = true, applySettings = true) {
    cleanupSelection(); // Always cleanup before starting
    if (isSelecting) return;
    
    isSelecting = true;
    isOpenEditor = openEditor; // Store the setting for later use
    isApplySettings = applySettings; // Store the setting for later use
    createSelectionOverlay();
    
    // Add event listeners for mouse events
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    // Prevent text selection during area selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
}

function createSelectionOverlay() {
    // Create overlay for area selection
    const overlay = document.createElement('div');
    overlay.id = 'screenshot-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        z-index: 999999;
        cursor: crosshair;
    `;
    
    // Add instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 1000000;
    `;
    instructions.textContent = 'Click and drag to select an area. Press ESC to cancel.';
    
    document.body.appendChild(overlay);
    document.body.appendChild(instructions);
    
    // Handle ESC key to cancel
    document.addEventListener('keydown', onKeyDown);
}

function onMouseDown(e) {
    if (!isSelecting) return;
    
    startX = e.clientX;
    startY = e.clientY;
    
    // Create selection box
    selectionBox = document.createElement('div');
    selectionBox.style.cssText = `
        position: fixed;
        border: 2px solid #007bff;
        background: rgba(0, 123, 255, 0.1);
        z-index: 1000000;
        pointer-events: none;
    `;
    
    document.body.appendChild(selectionBox);
}

function onMouseMove(e) {
    if (!isSelecting || !selectionBox) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    
    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
}

function onMouseUp(e) {
    if (!isSelecting || !selectionBox) return;
    
    const rect = selectionBox.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Temporarily hide the selection box and overlay before taking screenshot
    if (selectionBox) {
        selectionBox.style.display = 'none';
    }
    const overlay = document.getElementById('screenshot-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    const instructions = document.querySelector('div[style*="z-index: 1000000"]');
    if (instructions) {
        instructions.style.display = 'none';
    }
    
    // Small delay to ensure UI is hidden before screenshot
    setTimeout(() => {
        // Send selection data to background script, adjusted for scroll and DPR
        chrome.runtime.sendMessage({
            action: 'captureScreenshot',
            data: {
                type: 'area',
                x: rect.left * dpr,
                y: rect.top * dpr,
                width: rect.width * dpr,
                height: rect.height * dpr
            },
            openEditor: isOpenEditor,
            applySettings: isApplySettings
        });
        
        // Clean up selection UI after sending the message
        cleanupSelection();
    }, 50);
}

function onKeyDown(e) {
    if (e.key === 'Escape' && isSelecting) {
        cleanupSelection();
    }
}

function cleanupSelection() {
    isSelecting = false;
    
    // Remove event listeners
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('keydown', onKeyDown);
    
    // Remove UI elements
    const overlay = document.getElementById('screenshot-overlay');
    if (overlay) overlay.remove();
    
    if (selectionBox) {
        selectionBox.remove();
        selectionBox = null;
    }
    
    // Remove instructions
    const instructions = document.querySelector('div[style*="z-index: 1000000"]');
    if (instructions) instructions.remove();
    
    // Restore text selection
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
}

function processScreenshot(screenshotDataUrl, selectionData, openEditor = true, applySettings = true) {
    console.log('Processing screenshot with selection data:', selectionData);
    console.log('Screenshot data URL length:', screenshotDataUrl ? screenshotDataUrl.length : 0);
    console.log('Open editor:', openEditor);
    console.log('Apply settings:', applySettings);
    
    // Create a canvas to process the screenshot
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        console.log('Screenshot image loaded, original dimensions:', img.width, 'x', img.height);
        
        if (selectionData.type === 'area') {
            // Crop the screenshot to the selected area
            canvas.width = selectionData.width;
            canvas.height = selectionData.height;
            
            console.log('Cropping to area:', selectionData.x, selectionData.y, selectionData.width, selectionData.height);
            
            ctx.drawImage(img, 
                selectionData.x, selectionData.y, selectionData.width, selectionData.height,
                0, 0, selectionData.width, selectionData.height
            );
        } else {
            // Full screenshot
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        }
        
        const processedDataUrl = canvas.toDataURL('image/png');
        console.log('Processed screenshot data URL length:', processedDataUrl.length);
        
        if (openEditor) {
            // Open the editor with the processed screenshot
            openEditorWindow(processedDataUrl);
        } else {
            // Copy to clipboard with optional background settings
            if (applySettings) {
                applyBackgroundSettingsAndCopy(processedDataUrl);
            } else {
                copyToClipboard(processedDataUrl);
            }
        }
    };
    
    img.onerror = function(error) {
        console.error('Error loading screenshot image:', error);
    };
    
    img.src = screenshotDataUrl;
}

async function applyBackgroundSettingsAndCopy(screenshotDataUrl) {
    try {
        console.log('Applying background settings to screenshot...');
        
        // Try to get saved background settings from Chrome storage first
        let backgroundSettings = null;
        let settingsSource = 'none';
        
        try {
            const result = await chrome.storage.sync.get(['screenshotEditorSettings']);
            console.log('Chrome storage result:', result);
            
            if (result.screenshotEditorSettings) {
                const settings = JSON.parse(result.screenshotEditorSettings);
                backgroundSettings = settings.backgroundProperties;
                settingsSource = 'chrome_storage';
                console.log('Found saved background settings in Chrome storage:', backgroundSettings);
            }
        } catch (chromeError) {
            console.log('Chrome storage failed, trying localStorage:', chromeError);
        }
        
        // Fallback to localStorage if Chrome storage failed or had no data
        if (!backgroundSettings) {
            try {
                const savedSettings = localStorage.getItem('screenshotEditorSettings');
                console.log('localStorage result:', savedSettings);
                
                if (savedSettings) {
                    const settings = JSON.parse(savedSettings);
                    backgroundSettings = settings.backgroundProperties;
                    settingsSource = 'localStorage';
                    console.log('Found saved background settings in localStorage:', backgroundSettings);
                }
            } catch (localError) {
                console.log('localStorage also failed:', localError);
            }
        }
        
        if (!backgroundSettings) {
            console.log('No saved background settings found in any storage');
            console.log('Copying original screenshot without background');
            copyToClipboard(screenshotDataUrl);
            return;
        }
        
        console.log('Using settings from:', settingsSource);
        console.log('Background settings type:', backgroundSettings.type);
        
        if (backgroundSettings.type !== 'none') {
            console.log('Applying background settings:', backgroundSettings.type);
            // Apply background settings to the screenshot
            const styledScreenshot = await applyBackgroundToScreenshot(screenshotDataUrl, backgroundSettings);
            copyToClipboard(styledScreenshot);
        } else {
            console.log('Background type is "none", copying original screenshot');
            // Background is 'none', copy original
            copyToClipboard(screenshotDataUrl);
        }
    } catch (error) {
        console.error('Error applying background settings:', error);
        // Fallback to copying original screenshot
        copyToClipboard(screenshotDataUrl);
    }
}

async function applyBackgroundToScreenshot(screenshotDataUrl, backgroundSettings) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            try {
                console.log('Processing background settings:', backgroundSettings);
                
                // Calculate dimensions with padding
                const padding = backgroundSettings.padding || 0;
                const bgCornerRadius = backgroundSettings.backgroundCornerRadius || 0;
                const screenshotCornerRadius = backgroundSettings.screenshotCornerRadius || 0;
                
                console.log('Dimensions - Original:', img.width, 'x', img.height, 'Padding:', padding);
                
                canvas.width = img.width + (padding * 2);
                canvas.height = img.height + (padding * 2);
                
                console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
                
                // Draw background
                if (backgroundSettings.type === 'solid') {
                    console.log('Drawing solid background:', backgroundSettings.solidColor);
                    // Solid color background
                    ctx.fillStyle = backgroundSettings.solidColor || '#ffffff';
                    if (bgCornerRadius > 0) {
                        roundRect(ctx, 0, 0, canvas.width, canvas.height, bgCornerRadius);
                        ctx.fill();
                    } else {
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                } else if (backgroundSettings.type === 'gradient' || backgroundSettings.type === 'preset') {
                    console.log('Drawing gradient background:', backgroundSettings.type);
                    // Gradient background
                    const gradient = createGradient(ctx, backgroundSettings, canvas.width, canvas.height);
                    if (bgCornerRadius > 0) {
                        ctx.save();
                        roundRect(ctx, 0, 0, canvas.width, canvas.height, bgCornerRadius);
                        ctx.clip();
                        ctx.fillStyle = gradient;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.restore();
                    } else {
                        ctx.fillStyle = gradient;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                }
                
                // Draw screenshot with corner radius if specified
                if (screenshotCornerRadius > 0) {
                    console.log('Drawing screenshot with corner radius:', screenshotCornerRadius);
                    ctx.save();
                    roundRect(ctx, padding, padding, img.width, img.height, screenshotCornerRadius);
                    ctx.clip();
                    ctx.drawImage(img, padding, padding);
                    ctx.restore();
                } else {
                    console.log('Drawing screenshot without corner radius');
                    ctx.drawImage(img, padding, padding);
                }
                
                const styledDataUrl = canvas.toDataURL('image/png');
                console.log('Styled screenshot created successfully');
                resolve(styledDataUrl);
                
            } catch (error) {
                console.error('Error in applyBackgroundToScreenshot:', error);
                reject(error);
            }
        };
        
        img.onerror = function(error) {
            console.error('Error loading image in applyBackgroundToScreenshot:', error);
            reject(error);
        };
        
        img.src = screenshotDataUrl;
    });
}

function createGradient(ctx, backgroundSettings, width, height) {
    let gradient;
    
    if (backgroundSettings.gradientType === 'radial') {
        gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
    } else {
        // Linear gradient
        const coords = getGradientCoordinates(backgroundSettings.gradientDirection || 'to right', width, height);
        gradient = ctx.createLinearGradient(coords.x1, coords.y1, coords.x2, coords.y2);
    }
    
    // Add color stops
    if (backgroundSettings.colorStops && backgroundSettings.colorStops.length > 0) {
        backgroundSettings.colorStops.forEach(stop => {
            gradient.addColorStop(stop.position / 100, stop.color);
        });
    } else {
        // Default gradient if no color stops
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
    }
    
    return gradient;
}

function getGradientCoordinates(direction, width, height) {
    switch (direction) {
        case 'to right':
            return { x1: 0, y1: 0, x2: width, y2: 0 };
        case 'to bottom':
            return { x1: 0, y1: 0, x2: 0, y2: height };
        case 'to bottom right':
            return { x1: 0, y1: 0, x2: width, y2: height };
        case '45deg':
            return { x1: 0, y1: height, x2: width, y2: 0 };
        case '135deg':
            return { x1: 0, y1: 0, x2: width, y2: height };
        default:
            return { x1: 0, y1: 0, x2: width, y2: 0 };
    }
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function openEditorWindow(screenshotDataUrl) {
    // Close previous editor window if open
    if (editorWindow && !editorWindow.closed) {
        editorWindow.close();
    }
    const editorUrl = chrome.runtime.getURL('editor.html');
    const encodedScreenshot = encodeURIComponent(screenshotDataUrl);
    const editorUrlWithData = `${editorUrl}?screenshot=${encodedScreenshot}`;
    editorWindow = window.open(editorUrlWithData, 'screenshot-editor', 
        'width=1200,height=800,resizable=yes,scrollbars=yes');
    // Store the screenshot data globally so the editor can access it
    window.screenshotDataUrl = screenshotDataUrl;
    // Send screenshot data to editor with a delay to ensure window is loaded
    setTimeout(() => {
        if (editorWindow && !editorWindow.closed) {
            try {
                editorWindow.postMessage({
                    type: 'screenshot-data',
                    dataUrl: screenshotDataUrl
                }, '*');
                console.log('Screenshot data sent to editor via postMessage');
            } catch (error) {
                console.error('Error sending screenshot data via postMessage:', error);
            }
        }
    }, 500);
    // Also try sending the message when the window loads
    editorWindow.addEventListener('load', () => {
        setTimeout(() => {
            try {
                editorWindow.postMessage({
                    type: 'screenshot-data',
                    dataUrl: screenshotDataUrl
                }, '*');
                console.log('Screenshot data sent to editor after load event');
            } catch (error) {
                console.error('Error sending screenshot data after load:', error);
            }
        }, 100);
    });
}

async function copyToClipboard(dataUrl) {
    try {
        // Convert data URL to blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        // Copy to clipboard using Clipboard API
        await navigator.clipboard.write([
            new ClipboardItem({
                'image/png': blob
            })
        ]);
        
        // Show success notification
        showClipboardNotification('Screenshot copied to clipboard!', 'success');
        console.log('Screenshot copied to clipboard successfully');
        
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        
        // Fallback: try to copy as data URL
        try {
            await navigator.clipboard.writeText(dataUrl);
            showClipboardNotification('Screenshot data URL copied to clipboard!', 'info');
        } catch (fallbackError) {
            console.error('Fallback clipboard copy failed:', fallbackError);
            showClipboardNotification('Failed to copy screenshot to clipboard', 'error');
        }
    }
}

function showClipboardNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000002;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
        font-family: Arial, sans-serif;
        font-size: 14px;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #dc3545 0%, #e74c3c 100%)';
            break;
        case 'info':
        default:
            notification.style.background = 'linear-gradient(135deg, #17a2b8 0%, #20c997 100%)';
            break;
    }
    
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function showShortcutIndicator() {
    // Create a brief visual indicator that the shortcut was triggered
    const indicator = document.createElement('div');
    indicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-family: Arial, sans-serif;
        font-size: 16px;
        font-weight: 600;
        z-index: 1000001;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        animation: fadeInOut 1s ease-in-out;
        pointer-events: none;
    `;
    indicator.textContent = '📸 Area Selection Mode';
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(indicator);
    
    // Remove after animation completes
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }, 1000);
}

// Test function to debug settings loading
async function testSettingsLoading() {
    console.log('Testing settings loading...');
    
    try {
        // Test Chrome storage
        const result = await chrome.storage.sync.get(['screenshotEditorSettings']);
        console.log('Chrome storage result:', result);
        
        if (result.screenshotEditorSettings) {
            const settings = JSON.parse(result.screenshotEditorSettings);
            console.log('Parsed settings:', settings);
            console.log('Background properties:', settings.backgroundProperties);
        } else {
            console.log('No settings found in Chrome storage');
        }
        
        // Test localStorage
        const localSettings = localStorage.getItem('screenshotEditorSettings');
        console.log('localStorage result:', localSettings);
        
        if (localSettings) {
            const parsedLocal = JSON.parse(localSettings);
            console.log('Parsed localStorage settings:', parsedLocal);
        }
        
    } catch (error) {
        console.error('Error testing settings loading:', error);
    }
}

// Test function to manually test apply settings
async function testApplySettings() {
    console.log('=== TESTING APPLY SETTINGS ===');
    
    // Test 1: Check current toggle settings
    const result = await chrome.storage.sync.get(['openEditor', 'applySettings']);
    console.log('Current toggle settings:', result);
    
    // Test 2: Check saved background settings
    const bgResult = await chrome.storage.sync.get(['screenshotEditorSettings']);
    console.log('Saved background settings from Chrome storage:', bgResult);
    
    // Test 3: Check localStorage
    const localSettings = localStorage.getItem('screenshotEditorSettings');
    console.log('Saved background settings from localStorage:', localSettings);
    
    // Test 4: Parse and display settings
    if (bgResult.screenshotEditorSettings) {
        const settings = JSON.parse(bgResult.screenshotEditorSettings);
        console.log('Parsed background properties:', settings.backgroundProperties);
        console.log('Background type:', settings.backgroundProperties?.type);
        console.log('Background color:', settings.backgroundProperties?.solidColor);
        console.log('Background padding:', settings.backgroundProperties?.padding);
    }
    
    // Test 5: Create a test image and apply settings
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    console.log('Testing with applySettings = true');
    await applyBackgroundSettingsAndCopy(testImage);
    
    console.log('=== TEST COMPLETE ===');
}

// Function to force save test settings
async function saveTestSettings() {
    console.log('=== SAVING TEST SETTINGS ===');
    
    const testSettings = {
        backgroundProperties: {
            type: 'solid',
            solidColor: '#ff0000',
            padding: 50,
            backgroundCornerRadius: 10,
            screenshotCornerRadius: 5
        },
        textProperties: {
            text: 'Test Text',
            fontSize: 24,
            fontColor: '#ffffff',
            fontFamily: 'Arial',
            bold: false,
            italic: false,
            underline: false
        },
        drawingProperties: {
            brushSize: 5,
            brushColor: '#ff0000'
        },
        timestamp: new Date().toISOString()
    };
    
    try {
        // Save to Chrome storage
        await chrome.storage.sync.set({ 'screenshotEditorSettings': JSON.stringify(testSettings) });
        console.log('Test settings saved to Chrome storage');
        
        // Save to localStorage
        localStorage.setItem('screenshotEditorSettings', JSON.stringify(testSettings));
        console.log('Test settings saved to localStorage');
        
        console.log('=== TEST SETTINGS SAVED ===');
    } catch (error) {
        console.error('Error saving test settings:', error);
    }
}

// Call test function when content script loads
testSettingsLoading(); 