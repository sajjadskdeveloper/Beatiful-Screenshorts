document.addEventListener('DOMContentLoaded', async function() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const areaBtn = document.getElementById('areaBtn');
    const editorToggle = document.getElementById('editorToggle');
    const applySettingsToggle = document.getElementById('applySettingsToggle');

    // Load saved settings and wait for completion
    await loadSettings();
    console.log('Settings loaded - Editor:', editorToggle.checked, 'Apply Settings:', applySettingsToggle.checked);

    // Save settings when toggles change
    editorToggle.addEventListener('change', function() {
        console.log('Editor toggle changed to:', editorToggle.checked);
        saveSettings();
    });
    
    applySettingsToggle.addEventListener('change', function() {
        console.log('Apply settings toggle changed to:', applySettingsToggle.checked);
        saveSettings();
    });

    // Full screen screenshot
    fullscreenBtn.addEventListener('click', async function() {
        setLoadingState(fullscreenBtn, true);
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const settings = await loadSettings();
            console.log('Taking full screenshot with settings:', settings);
            await chrome.tabs.sendMessage(tab.id, { 
                action: 'takeFullScreenshot',
                openEditor: settings.openEditor,
                applySettings: settings.applySettings
            });
            window.close();
        } catch (error) {
            console.error('Error taking full screenshot:', error);
            setLoadingState(fullscreenBtn, false);
        }
    });

    // Area selection screenshot
    areaBtn.addEventListener('click', async function() {
        setLoadingState(areaBtn, true);
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const settings = await loadSettings();
            console.log('Starting area selection with settings:', settings);
            await chrome.tabs.sendMessage(tab.id, { 
                action: 'startAreaSelection',
                openEditor: settings.openEditor,
                applySettings: settings.applySettings
            });
            window.close();
        } catch (error) {
            console.error('Error starting area selection:', error);
            setLoadingState(areaBtn, false);
        }
    });

    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['openEditor', 'applySettings']);
            console.log('Raw settings from storage:', result);
            
            const openEditor = result.openEditor !== undefined ? result.openEditor : true;
            const applySettings = result.applySettings !== undefined ? result.applySettings : true;
            
            editorToggle.checked = openEditor;
            applySettingsToggle.checked = applySettings;
            
            console.log('Processed settings - Editor:', openEditor, 'Apply Settings:', applySettings);
            return { openEditor, applySettings };
        } catch (error) {
            console.error('Error loading settings:', error);
            return { openEditor: true, applySettings: true };
        }
    }

    async function saveSettings() {
        try {
            const settings = {
                openEditor: editorToggle.checked,
                applySettings: applySettingsToggle.checked
            };
            console.log('Saving settings:', settings);
            await chrome.storage.sync.set(settings);
            console.log('Settings saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    function setLoadingState(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }
}); 