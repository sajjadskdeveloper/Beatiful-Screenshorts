// Screenshot Editor JavaScript
class ScreenshotEditor {
    constructor() {
        this.canvas = document.getElementById('screenshotCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.textOverlay = document.getElementById('textOverlay');
        
        this.currentTool = 'text';
        this.isDrawing = false;
        this.selectedElement = null;
        this.textElements = [];
        this.undoStack = [];
        this.redoStack = [];
        
        this.textProperties = {
            text: 'Sample Text',
            fontSize: 24,
            fontColor: '#ffffff',
            fontFamily: 'Arial',
            bold: false,
            italic: false,
            underline: false
        };
        
        this.drawingProperties = {
            brushSize: 5,
            brushColor: '#ff0000'
        };
        
        this.backgroundProperties = {
            type: 'none',
            solidColor: '#ffffff',
            gradientType: 'linear',
            gradientDirection: 'to right',
            colorStops: [
                { color: '#667eea', position: 0 },
                { color: '#764ba2', position: 100 }
            ],
            preset: 'ocean',
            padding: 50,
            backgroundCornerRadius: 0,
            screenshotCornerRadius: 0
        };
        
        this.presetGradients = {
            sunset: {
                type: 'linear',
                direction: '135deg',
                colorStops: [
                    { color: '#ff6b6b', position: 0 },
                    { color: '#feca57', position: 50 },
                    { color: '#ff9ff3', position: 100 }
                ]
            },
            ocean: {
                type: 'linear',
                direction: '135deg',
                colorStops: [
                    { color: '#667eea', position: 0 },
                    { color: '#764ba2', position: 100 }
                ]
            },
            forest: {
                type: 'linear',
                direction: '135deg',
                colorStops: [
                    { color: '#56ab2f', position: 0 },
                    { color: '#a8e6cf', position: 100 }
                ]
            },
            aurora: {
                type: 'linear',
                direction: '135deg',
                colorStops: [
                    { color: '#a8edea', position: 0 },
                    { color: '#fed6e3', position: 50 },
                    { color: '#ffecd2', position: 100 }
                ]
            },
            fire: {
                type: 'linear',
                direction: '135deg',
                colorStops: [
                    { color: '#ff416c', position: 0 },
                    { color: '#ff4b2b', position: 100 }
                ]
            },
            'sunset-orange': {
                type: 'linear',
                direction: '135deg',
                colorStops: [
                    { color: '#ff9a9e', position: 0 },
                    { color: '#fecfef', position: 50 },
                    { color: '#fecfef', position: 100 }
                ]
            },
            golden: {
                type: 'linear',
                direction: '135deg',
                colorStops: [
                    { color: '#ffecd2', position: 0 },
                    { color: '#fcb69f', position: 100 }
                ]
            },
            coral: {
                type: 'linear',
                direction: '135deg',
                colorStops: [
                    { color: '#ff9a9e', position: 0 },
                    { color: '#fad0c4', position: 100 }
                ]
            },
            lavender: {
                type: 'linear',
                direction: '135deg',
                colorStops: [
                    { color: '#a8edea', position: 0 },
                    { color: '#fed6e3', position: 100 }
                ]
            },
            midnight: {
                type: 'linear',
                direction: '135deg',
                colorStops: [
                    { color: '#2c3e50', position: 0 },
                    { color: '#34495e', position: 100 }
                ]
            },
            ice: {
                type: 'linear',
                direction: '135deg',
                colorStops: [
                    { color: '#74b9ff', position: 0 },
                    { color: '#0984e3', position: 100 }
                ]
            },
            sky: {
                type: 'linear',
                direction: '135deg',
                colorStops: [
                    { color: '#81ecec', position: 0 },
                    { color: '#74b9ff', position: 100 }
                ]
            },
            neon: {
                type: 'linear',
                direction: '135deg',
                colorStops: [
                    { color: '#00b894', position: 0 },
                    { color: '#00cec9', position: 50 },
                    { color: '#6c5ce7', position: 100 }
                ]
            },
            cyber: {
                type: 'linear',
                direction: '135deg',
                colorStops: [
                    { color: '#fd79a8', position: 0 },
                    { color: '#fdcb6e', position: 50 },
                    { color: '#e17055', position: 100 }
                ]
            },
            glass: {
                type: 'linear',
                direction: '135deg',
                colorStops: [
                    { color: 'rgba(255,255,255,0.3)', position: 0 },
                    { color: 'rgba(255,255,255,0.1)', position: 100 }
                ]
            },
            holographic: {
                type: 'linear',
                direction: '135deg',
                colorStops: [
                    { color: '#ff6b6b', position: 0 },
                    { color: '#4ecdc4', position: 25 },
                    { color: '#45b7d1', position: 50 },
                    { color: '#96ceb4', position: 75 },
                    { color: '#ffeaa7', position: 100 }
                ]
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadScreenshot();
        this.loadSettings(true); // Auto-load saved settings silently
        this.updateUI();
        this.setupColorStops();
    }
    
    setupEventListeners() {
        // Tool buttons
        document.getElementById('textTool').addEventListener('click', () => this.setTool('text'));
        document.getElementById('drawTool').addEventListener('click', () => this.setTool('draw'));
        document.getElementById('shapeTool').addEventListener('click', () => this.setTool('shape'));
        
        // Action buttons
        document.getElementById('saveBtn').addEventListener('click', () => this.saveScreenshot());
        document.getElementById('closeBtn').addEventListener('click', () => window.close());
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        
        // Settings buttons
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('loadSettingsBtn').addEventListener('click', () => this.loadSettings());
        
        // Background controls
        document.getElementById('backgroundType').addEventListener('change', (e) => this.updateBackgroundType(e.target.value));
        document.getElementById('solidColor').addEventListener('input', (e) => this.updateSolidColor(e.target.value));
        document.getElementById('gradientType').addEventListener('change', (e) => this.updateGradientType(e.target.value));
        document.getElementById('gradientDirection').addEventListener('change', (e) => this.updateGradientDirection(e.target.value));
        document.getElementById('backgroundPadding').addEventListener('input', (e) => this.updateBackgroundPadding(parseInt(e.target.value)));
        document.getElementById('backgroundCornerRadius').addEventListener('input', (e) => this.updateBackgroundCornerRadius(parseInt(e.target.value)));
        document.getElementById('screenshotCornerRadius').addEventListener('input', (e) => this.updateScreenshotCornerRadius(parseInt(e.target.value)));
        
        // Color stops
        document.getElementById('addColorStop').addEventListener('click', () => this.addColorStop());
        
        // Random gradient
        document.getElementById('randomGradient').addEventListener('click', () => this.selectRandomGradient());
        
        // Gradient library clicks
        document.querySelectorAll('.gradient-item').forEach(item => {
            item.addEventListener('click', () => this.selectPresetGradient(item.dataset.gradient));
        });
        
        // Text properties
        document.getElementById('textInput').addEventListener('input', (e) => {
            this.textProperties.text = e.target.value;
            this.updateSelectedText();
        });
        
        document.getElementById('fontSize').addEventListener('input', (e) => {
            this.textProperties.fontSize = parseInt(e.target.value);
            document.getElementById('fontSizeValue').textContent = e.target.value + 'px';
            this.updateSelectedText();
        });
        
        document.getElementById('fontColor').addEventListener('input', (e) => {
            this.textProperties.fontColor = e.target.value;
            this.updateSelectedText();
        });
        
        document.getElementById('fontFamily').addEventListener('change', (e) => {
            this.textProperties.fontFamily = e.target.value;
            this.updateSelectedText();
        });
        
        // Style buttons
        document.getElementById('boldBtn').addEventListener('click', () => this.toggleStyle('bold'));
        document.getElementById('italicBtn').addEventListener('click', () => this.toggleStyle('italic'));
        document.getElementById('underlineBtn').addEventListener('click', () => this.toggleStyle('underline'));
        
        // Drawing properties
        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.drawingProperties.brushSize = parseInt(e.target.value);
            document.getElementById('brushSizeValue').textContent = e.target.value + 'px';
        });
        
        document.getElementById('brushColor').addEventListener('input', (e) => {
            this.drawingProperties.brushColor = e.target.value;
        });
        
        // Canvas events
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Listen for screenshot data from content script
        window.addEventListener('message', (e) => {
            console.log('Editor received message:', e.data);
            if (e.data.type === 'screenshot-data') {
                console.log('Loading screenshot data...');
                this.loadScreenshotData(e.data.dataUrl);
            }
        });
        
        // Also check for screenshot data in URL parameters or localStorage
        this.checkForScreenshotData();
    }
    
    setupColorStops() {
        this.updateColorStopsUI();
        this.setupColorStopListeners();
    }
    
    updateColorStopsUI() {
        const container = document.getElementById('colorStopsContainer');
        container.innerHTML = '';
        
        this.backgroundProperties.colorStops.forEach((stop, index) => {
            const colorStop = document.createElement('div');
            colorStop.className = 'color-stop';
            colorStop.innerHTML = `
                <input type="color" class="gradient-color" value="${stop.color}">
                <input type="range" class="color-position" min="0" max="100" value="${stop.position}">
                <span class="position-value">${stop.position}%</span>
                <button class="remove-color" ${index === 0 ? 'style="display: none;"' : ''}>×</button>
            `;
            container.appendChild(colorStop);
        });
        
        this.setupColorStopListeners();
    }
    
    setupColorStopListeners() {
        const colorStops = document.querySelectorAll('.color-stop');
        colorStops.forEach((stop, index) => {
            const colorInput = stop.querySelector('.gradient-color');
            const positionInput = stop.querySelector('.color-position');
            const positionValue = stop.querySelector('.position-value');
            const removeBtn = stop.querySelector('.remove-color');
            
            colorInput.addEventListener('input', (e) => {
                this.backgroundProperties.colorStops[index].color = e.target.value;
                this.renderCanvas();
            });
            
            positionInput.addEventListener('input', (e) => {
                this.backgroundProperties.colorStops[index].position = parseInt(e.target.value);
                positionValue.textContent = e.target.value + '%';
                this.renderCanvas();
            });
            
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    this.removeColorStop(index);
                });
            }
        });
    }
    
    addColorStop() {
        const newStop = {
            color: '#' + Math.floor(Math.random()*16777215).toString(16),
            position: 50
        };
        
        this.backgroundProperties.colorStops.push(newStop);
        this.backgroundProperties.colorStops.sort((a, b) => a.position - b.position);
        
        this.updateColorStopsUI();
        this.renderCanvas();
    }
    
    removeColorStop(index) {
        if (this.backgroundProperties.colorStops.length > 2) {
            this.backgroundProperties.colorStops.splice(index, 1);
            this.updateColorStopsUI();
            this.renderCanvas();
        }
    }
    
    selectRandomGradient() {
        const gradientNames = Object.keys(this.presetGradients);
        const randomGradient = gradientNames[Math.floor(Math.random() * gradientNames.length)];
        this.selectPresetGradient(randomGradient);
    }
    
    updateBackgroundType(type) {
        this.backgroundProperties.type = type;
        
        // Hide all background groups
        document.querySelectorAll('.background-group').forEach(group => {
            group.style.display = 'none';
        });
        
        // Show relevant group
        if (type === 'solid') {
            document.getElementById('solidColorGroup').style.display = 'block';
        } else if (type === 'gradient') {
            document.getElementById('gradientGroup').style.display = 'block';
        } else if (type === 'preset') {
            document.getElementById('presetGroup').style.display = 'block';
        }
        
        this.renderCanvas();
    }
    
    updateSolidColor(color) {
        this.backgroundProperties.solidColor = color;
        this.renderCanvas();
    }
    
    updateGradientType(type) {
        this.backgroundProperties.gradientType = type;
        this.renderCanvas();
    }
    
    updateGradientDirection(direction) {
        this.backgroundProperties.gradientDirection = direction;
        this.renderCanvas();
    }
    
    updateBackgroundPadding(padding) {
        this.backgroundProperties.padding = padding;
        document.getElementById('backgroundPaddingValue').textContent = padding + 'px';
        this.renderCanvas();
    }
    
    updateBackgroundCornerRadius(radius) {
        this.backgroundProperties.backgroundCornerRadius = radius;
        document.getElementById('backgroundCornerRadiusValue').textContent = radius + 'px';
        this.renderCanvas();
    }
    
    updateScreenshotCornerRadius(radius) {
        this.backgroundProperties.screenshotCornerRadius = radius;
        document.getElementById('screenshotCornerRadiusValue').textContent = radius + 'px';
        this.renderCanvas();
    }
    
    selectPresetGradient(presetName) {
        this.backgroundProperties.preset = presetName;
        this.backgroundProperties.type = 'preset';
        
        const preset = this.presetGradients[presetName];
        if (preset) {
            this.backgroundProperties.gradientType = preset.type;
            this.backgroundProperties.gradientDirection = preset.direction;
            this.backgroundProperties.colorStops = JSON.parse(JSON.stringify(preset.colorStops));
            
            // Update UI
            document.getElementById('gradientType').value = preset.type;
            document.getElementById('gradientDirection').value = preset.direction;
            this.updateColorStopsUI();
        }
        
        // Update selected state
        document.querySelectorAll('.gradient-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelector(`[data-gradient="${presetName}"]`).classList.add('selected');
        
        this.renderCanvas();
    }
    
    renderCanvas() {
        if (!this.originalScreenshotData) return;
        
        const img = new Image();
        img.onload = () => {
            // Calculate new canvas size with padding
            const padding = this.backgroundProperties.padding;
            const newWidth = img.width + (padding * 2);
            const newHeight = img.height + (padding * 2);
            
            // Set canvas size
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;
            
            // Clear canvas
            this.ctx.clearRect(0, 0, newWidth, newHeight);
            
            // Draw background with corner radius
            this.drawBackgroundWithRoundedCorners();
            
            // Draw screenshot with rounded corners
            this.drawScreenshotWithRoundedCorners(img, padding);
            
            // Redraw text elements
            this.renderTextElements();
        };
        img.src = this.originalScreenshotData;
    }
    
    drawBackgroundWithRoundedCorners() {
        const { type, solidColor, gradientType, gradientDirection, colorStops, backgroundCornerRadius } = this.backgroundProperties;
        
        if (type === 'none') return;
        
        // Create rounded rectangle path for background
        if (backgroundCornerRadius > 0) {
            this.ctx.save();
            this.ctx.beginPath();
            this.roundRect(0, 0, this.canvas.width, this.canvas.height, backgroundCornerRadius);
            this.ctx.clip();
        }
        
        if (type === 'solid') {
            this.ctx.fillStyle = solidColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else if (type === 'gradient' || type === 'preset') {
            let gradient;
            
            if (gradientType === 'linear') {
                const [x1, y1, x2, y2] = this.getGradientCoordinates(gradientDirection);
                gradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
            } else {
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                const radius = Math.max(this.canvas.width, this.canvas.height) / 2;
                gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            }
            
            // Add color stops
            colorStops.forEach(stop => {
                gradient.addColorStop(stop.position / 100, stop.color);
            });
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        if (backgroundCornerRadius > 0) {
            this.ctx.restore();
        }
    }
    
    getGradientCoordinates(direction) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        switch (direction) {
            case 'to right':
                return [0, 0, width, 0];
            case 'to bottom':
                return [0, 0, 0, height];
            case 'to bottom right':
                return [0, 0, width, height];
            case '45deg':
                return [0, height, width, 0];
            case '135deg':
                return [0, 0, width, height];
            default:
                return [0, 0, width, 0];
        }
    }
    
    drawScreenshotWithRoundedCorners(img, padding) {
        const radius = this.backgroundProperties.screenshotCornerRadius;
        
        if (radius > 0) {
            // Create rounded rectangle path
            this.ctx.save();
            this.ctx.beginPath();
            this.roundRect(padding, padding, img.width, img.height, radius);
            this.ctx.clip();
        }
        
        // Draw the screenshot
        this.ctx.drawImage(img, padding, padding);
        
        if (radius > 0) {
            this.ctx.restore();
        }
    }
    
    roundRect(x, y, width, height, radius) {
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
    
    checkForScreenshotData() {
        // Check if there's screenshot data in the opener window
        if (window.opener && window.opener.screenshotDataUrl) {
            console.log('Found screenshot data in opener window');
            this.loadScreenshotData(window.opener.screenshotDataUrl);
        }
        
        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const screenshotData = urlParams.get('screenshot');
        if (screenshotData) {
            console.log('Found screenshot data in URL');
            this.loadScreenshotData(screenshotData);
        }
    }
    
    loadScreenshot() {
        // Create a default placeholder if no screenshot is loaded
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#666';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Screenshot will appear here', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText('If you took a screenshot, it should load automatically', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
    
    loadScreenshotData(dataUrl) {
        console.log('Loading screenshot data URL:', dataUrl ? dataUrl.substring(0, 50) + '...' : 'null');
        
        if (!dataUrl) {
            console.error('No screenshot data URL provided');
            return;
        }
        
        this.originalScreenshotData = dataUrl;
        this.renderCanvas();
        console.log('Screenshot loaded successfully');
    }
    
    setTool(tool) {
        this.currentTool = tool;
        
        // Update active tool button
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(tool + 'Tool').classList.add('active');
        
        // Update cursor
        if (tool === 'text') {
            this.canvas.style.cursor = 'text';
        } else if (tool === 'draw') {
            this.canvas.style.cursor = 'crosshair';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }
    
    handleCanvasClick(e) {
        if (this.currentTool === 'text') {
            this.addTextElement(e.offsetX, e.offsetY);
        }
    }
    
    handleMouseDown(e) {
        if (this.currentTool === 'draw') {
            this.isDrawing = true;
            this.ctx.beginPath();
            this.ctx.moveTo(e.offsetX, e.offsetY);
            this.ctx.strokeStyle = this.drawingProperties.brushColor;
            this.ctx.lineWidth = this.drawingProperties.brushSize;
            this.ctx.lineCap = 'round';
        }
    }
    
    handleMouseMove(e) {
        if (this.currentTool === 'draw' && this.isDrawing) {
            this.ctx.lineTo(e.offsetX, e.offsetY);
            this.ctx.stroke();
        }
    }
    
    handleMouseUp(e) {
        if (this.currentTool === 'draw' && this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }
    
    addTextElement(x, y) {
        const textElement = {
            id: Date.now(),
            x: x,
            y: y,
            text: this.textProperties.text,
            fontSize: this.textProperties.fontSize,
            fontColor: this.textProperties.fontColor,
            fontFamily: this.textProperties.fontFamily,
            bold: this.textProperties.bold,
            italic: this.textProperties.italic,
            underline: this.textProperties.underline
        };
        
        this.textElements.push(textElement);
        this.renderTextElements();
        this.selectElement(textElement);
        this.saveState();
    }
    
    renderTextElements() {
        this.textOverlay.innerHTML = '';
        
        this.textElements.forEach(element => {
            const textDiv = document.createElement('div');
            textDiv.className = 'text-element';
            textDiv.dataset.id = element.id;
            
            if (this.selectedElement && this.selectedElement.id === element.id) {
                textDiv.classList.add('selected');
            }
            
            textDiv.style.left = element.x + 'px';
            textDiv.style.top = element.y + 'px';
            
            const textContent = document.createElement('div');
            textContent.className = 'text-content';
            textContent.textContent = element.text;
            textContent.style.cssText = `
                color: ${element.fontColor};
                font-size: ${element.fontSize}px;
                font-family: ${element.fontFamily};
                font-weight: ${element.bold ? 'bold' : 'normal'};
                font-style: ${element.italic ? 'italic' : 'normal'};
                text-decoration: ${element.underline ? 'underline' : 'none'};
                white-space: nowrap;
            `;
            
            textDiv.appendChild(textContent);
            
            // Add resize handles
            const handles = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
            handles.forEach(pos => {
                const handle = document.createElement('div');
                handle.className = `resize-handle ${pos}`;
                textDiv.appendChild(handle);
            });
            
            // Add event listeners
            textDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectElement(element);
            });
            
            this.textOverlay.appendChild(textDiv);
        });
    }
    
    selectElement(element) {
        this.selectedElement = element;
        this.updateTextProperties();
        this.renderTextElements();
    }
    
    updateTextProperties() {
        if (this.selectedElement) {
            document.getElementById('textInput').value = this.selectedElement.text;
            document.getElementById('fontSize').value = this.selectedElement.fontSize;
            document.getElementById('fontSizeValue').textContent = this.selectedElement.fontSize + 'px';
            document.getElementById('fontColor').value = this.selectedElement.fontColor;
            document.getElementById('fontFamily').value = this.selectedElement.fontFamily;
            
            document.getElementById('boldBtn').classList.toggle('active', this.selectedElement.bold);
            document.getElementById('italicBtn').classList.toggle('active', this.selectedElement.italic);
            document.getElementById('underlineBtn').classList.toggle('active', this.selectedElement.underline);
        }
    }
    
    updateSelectedText() {
        if (this.selectedElement) {
            this.selectedElement.text = this.textProperties.text;
            this.selectedElement.fontSize = this.textProperties.fontSize;
            this.selectedElement.fontColor = this.textProperties.fontColor;
            this.selectedElement.fontFamily = this.textProperties.fontFamily;
            this.selectedElement.bold = this.textProperties.bold;
            this.selectedElement.italic = this.textProperties.italic;
            this.selectedElement.underline = this.textProperties.underline;
            
            this.renderTextElements();
        }
    }
    
    toggleStyle(style) {
        this.textProperties[style] = !this.textProperties[style];
        document.getElementById(style + 'Btn').classList.toggle('active', this.textProperties[style]);
        this.updateSelectedText();
    }
    
    saveScreenshot() {
        // Create a temporary canvas to combine screenshot and text
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        
        // Draw the current canvas (with background and screenshot)
        tempCtx.drawImage(this.canvas, 0, 0);
        
        // Draw all text elements
        this.textElements.forEach(element => {
            tempCtx.fillStyle = element.fontColor;
            tempCtx.font = `${element.bold ? 'bold' : 'normal'} ${element.italic ? 'italic' : 'normal'} ${element.fontSize}px ${element.fontFamily}`;
            tempCtx.fillText(element.text, element.x, element.y + element.fontSize);
            
            if (element.underline) {
                tempCtx.strokeStyle = element.fontColor;
                tempCtx.lineWidth = 1;
                tempCtx.beginPath();
                tempCtx.moveTo(element.x, element.y + element.fontSize + 2);
                tempCtx.lineTo(element.x + tempCtx.measureText(element.text).width, element.y + element.fontSize + 2);
                tempCtx.stroke();
            }
        });
        
        // Convert to blob and download
        tempCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `screenshot-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    }
    
    saveState() {
        const state = {
            textElements: JSON.parse(JSON.stringify(this.textElements)),
            canvasData: this.canvas.toDataURL(),
            backgroundProperties: JSON.parse(JSON.stringify(this.backgroundProperties))
        };
        
        this.undoStack.push(state);
        this.redoStack = []; // Clear redo stack when new action is performed
    }
    
    undo() {
        if (this.undoStack.length > 0) {
            const currentState = {
                textElements: JSON.parse(JSON.stringify(this.textElements)),
                canvasData: this.canvas.toDataURL(),
                backgroundProperties: JSON.parse(JSON.stringify(this.backgroundProperties))
            };
            
            this.redoStack.push(currentState);
            
            const previousState = this.undoStack.pop();
            this.restoreState(previousState);
        }
    }
    
    redo() {
        if (this.redoStack.length > 0) {
            const currentState = {
                textElements: JSON.parse(JSON.stringify(this.textElements)),
                canvasData: this.canvas.toDataURL(),
                backgroundProperties: JSON.parse(JSON.stringify(this.backgroundProperties))
            };
            
            this.undoStack.push(currentState);
            
            const nextState = this.redoStack.pop();
            this.restoreState(nextState);
        }
    }
    
    restoreState(state) {
        this.textElements = state.textElements;
        this.backgroundProperties = state.backgroundProperties || this.backgroundProperties;
        
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            this.renderTextElements();
        };
        img.src = state.canvasData;
    }
    
    clearAll() {
        if (confirm('Are you sure you want to clear all text elements?')) {
            this.textElements = [];
            this.selectedElement = null;
            this.renderTextElements();
            this.saveState();
        }
    }
    
    updateUI() {
        // Update property displays
        document.getElementById('fontSizeValue').textContent = this.textProperties.fontSize + 'px';
        document.getElementById('brushSizeValue').textContent = this.drawingProperties.brushSize + 'px';
        document.getElementById('backgroundPaddingValue').textContent = this.backgroundProperties.padding + 'px';
        document.getElementById('backgroundCornerRadiusValue').textContent = this.backgroundProperties.backgroundCornerRadius + 'px';
        document.getElementById('screenshotCornerRadiusValue').textContent = this.backgroundProperties.screenshotCornerRadius + 'px';
    }
    
    saveSettings() {
        const settings = {
            backgroundProperties: JSON.parse(JSON.stringify(this.backgroundProperties)),
            textProperties: JSON.parse(JSON.stringify(this.textProperties)),
            drawingProperties: JSON.parse(JSON.stringify(this.drawingProperties)),
            timestamp: new Date().toISOString()
        };
        
        try {
            // Save to both localStorage (for editor) and Chrome storage (for content script)
            localStorage.setItem('screenshotEditorSettings', JSON.stringify(settings));
            
            // Also save to Chrome storage for content script access
            chrome.storage.sync.set({ 'screenshotEditorSettings': JSON.stringify(settings) }, () => {
                console.log('Settings synced to Chrome storage');
            });
            
            // Show success message
            this.showNotification('Settings saved successfully!', 'success');
            console.log('Settings saved:', settings);
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Error saving settings. Please try again.', 'error');
        }
    }
    
    // Function to sync settings from Chrome storage to localStorage
    syncSettingsFromChrome() {
        try {
            chrome.storage.sync.get(['screenshotEditorSettings'], (result) => {
                if (result.screenshotEditorSettings) {
                    const settings = JSON.parse(result.screenshotEditorSettings);
                    localStorage.setItem('screenshotEditorSettings', JSON.stringify(settings));
                    console.log('Settings synced from Chrome storage to localStorage');
                }
            });
        } catch (error) {
            console.error('Error syncing settings from Chrome storage:', error);
        }
    }
    
    loadSettings(silent = false) {
        try {
            // Try to load from localStorage first (for editor)
            let savedSettings = localStorage.getItem('screenshotEditorSettings');
            let settingsSource = 'localStorage';
            
            // If no localStorage settings, try Chrome storage
            if (!savedSettings) {
                try {
                    // Note: We can't use await here in this context, so we'll use a callback approach
                    chrome.storage.sync.get(['screenshotEditorSettings'], (result) => {
                        if (result.screenshotEditorSettings) {
                            const chromeSettings = JSON.parse(result.screenshotEditorSettings);
                            this.applySettingsToUI(chromeSettings, silent);
                            console.log('Settings loaded from Chrome storage');
                        } else {
                            if (!silent) {
                                this.showNotification('No saved settings found.', 'info');
                            }
                        }
                    });
                    return; // Exit early since we're using async callback
                } catch (error) {
                    console.log('Chrome storage not available, using localStorage only');
                }
            }
            
            if (!savedSettings) {
                if (!silent) {
                    this.showNotification('No saved settings found.', 'info');
                }
                return;
            }
            
            const settings = JSON.parse(savedSettings);
            this.applySettingsToUI(settings, silent);
            console.log('Settings loaded from localStorage');
            
        } catch (error) {
            console.error('Error loading settings:', error);
            if (!silent) {
                this.showNotification('Error loading settings. Please try again.', 'error');
            }
        }
    }
    
    applySettingsToUI(settings, silent = false) {
        // Load background properties
        if (settings.backgroundProperties) {
            this.backgroundProperties = { ...this.backgroundProperties, ...settings.backgroundProperties };
            
            // Update UI elements
            document.getElementById('backgroundType').value = this.backgroundProperties.type;
            document.getElementById('solidColor').value = this.backgroundProperties.solidColor;
            document.getElementById('gradientType').value = this.backgroundProperties.gradientType;
            document.getElementById('gradientDirection').value = this.backgroundProperties.gradientDirection;
            document.getElementById('backgroundPadding').value = this.backgroundProperties.padding;
            document.getElementById('backgroundCornerRadius').value = this.backgroundProperties.backgroundCornerRadius;
            document.getElementById('screenshotCornerRadius').value = this.backgroundProperties.screenshotCornerRadius;
            
            // Update color stops
            this.updateColorStopsUI();
            
            // Show/hide appropriate background groups
            this.updateBackgroundType(this.backgroundProperties.type);
            
            // Update display values
            this.updateUI();
            
            // Re-render canvas with new settings
            this.renderCanvas();
        }
        
        // Load text properties
        if (settings.textProperties) {
            this.textProperties = { ...this.textProperties, ...settings.textProperties };
            
            // Update UI elements
            document.getElementById('textInput').value = this.textProperties.text;
            document.getElementById('fontSize').value = this.textProperties.fontSize;
            document.getElementById('fontColor').value = this.textProperties.fontColor;
            document.getElementById('fontFamily').value = this.textProperties.fontFamily;
            
            // Update style buttons
            document.getElementById('boldBtn').classList.toggle('active', this.textProperties.bold);
            document.getElementById('italicBtn').classList.toggle('active', this.textProperties.italic);
            document.getElementById('underlineBtn').classList.toggle('active', this.textProperties.underline);
            
            // Update display values
            this.updateUI();
        }
        
        // Load drawing properties
        if (settings.drawingProperties) {
            this.drawingProperties = { ...this.drawingProperties, ...settings.drawingProperties };
            
            // Update UI elements
            document.getElementById('brushSize').value = this.drawingProperties.brushSize;
            document.getElementById('brushColor').value = this.drawingProperties.brushColor;
            
            // Update display values
            this.updateUI();
        }
        
        if (!silent) {
            this.showNotification('Settings loaded successfully!', 'success');
        }
        
        console.log('Settings applied to UI:', settings);
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
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
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ScreenshotEditor();
}); 