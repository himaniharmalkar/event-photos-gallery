// upload.js - Handles file uploads for SnapTogether photo gallery
// Dependencies: utils.js

/**
 * Initialize upload functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // Upload button handlers
    document.getElementById('uploadBtn')?.addEventListener('click', openUploadModal);
    document.getElementById('mobileUploadBtn')?.addEventListener('click', openUploadModal);
    document.getElementById('emptyGalleryUploadBtn')?.addEventListener('click', openUploadModal);
    
    // Close modal handler
    document.querySelector('#uploadModal .close-modal')?.addEventListener('click', closeUploadModal);
    
    // Cancel upload button
    document.getElementById('cancelUploadBtn')?.addEventListener('click', resetUploadModal);
    
    // File input change handler
    document.getElementById('fileInput')?.addEventListener('change', handleFileSelection);
    
    // Start upload button
    document.getElementById('startUploadBtn')?.addEventListener('click', startUpload);
    
    // View photos button (after successful upload)
    document.getElementById('viewPhotosBtn')?.addEventListener('click', function() {
        closeUploadModal();
        // Refresh gallery to show newly uploaded photos
        loadGallery();
    });
    
    // Setup drag and drop
    setupDragAndDrop();
});

/**
 * Open the upload modal
 */
function openUploadModal() {
    // Close mobile menu if open
    document.getElementById('mobileActionMenu').style.display = 'none';
    
    const modal = document.getElementById('uploadModal');
    modal.style.display = 'block';
    
    // Reset the modal to initial state
    resetUploadModal();
    
    // Load user's name from local storage if available
    const userName = localStorage.getItem('uploaderName');
    if (userName) {
        document.getElementById('uploaderName').value = userName;
    }
}

/**
 * Close the upload modal
 */
function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    modal.style.display = 'none';
}

/**
 * Reset the upload modal to initial state
 */
function resetUploadModal() {
    // Show upload area, hide preview
    document.getElementById('uploadArea').style.display = 'flex';
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('uploadProgress').style.display = 'none';
    document.getElementById('uploadSuccess').style.display = 'none';
    
    // Clear file input
    document.getElementById('fileInput').value = '';
    
    // Clear preview grid
    document.getElementById('previewGrid').innerHTML = '';
    
    // Reset selected count
    document.getElementById('selectedCount').textContent = '0';
    
    // Reset progress bar
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressStatus').textContent = 'Uploading 0 of 0 photos...';
}

/**
 * Setup drag and drop functionality
 */
function setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    
    if (!uploadArea) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        uploadArea.classList.add('highlight');
    }
    
    function unhighlight() {
        uploadArea.classList.remove('highlight');
    }
    
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            handleFiles(files);
        }
    }
}

/**
 * Handle file selection from input
 */
function handleFileSelection(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFiles(files);
    }
}

/**
 * Process selected files
 */
function handleFiles(files) {
    // Convert FileList to array and filter to images only
    const fileArray = Array.from(files).filter(file => {
        return file.type.startsWith('image/');
    });
    
    // Check file count limit
    if (fileArray.length > 20) {
        alert('You can upload a maximum of 20 photos at once.');
        fileArray.length = 20; // Truncate to 20
    }
    
    // Check file size limit
    const oversizedFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024); // 10MB
    if (oversizedFiles.length > 0) {
        alert('One or more files exceed the 10MB size limit and will be skipped.');
        
        // Remove oversized files
        for (let i = fileArray.length - 1; i >= 0; i--) {
            if (fileArray[i].size > 10 * 1024 * 1024) {
                fileArray.splice(i, 1);
            }
        }
    }
    
    if (fileArray.length === 0) {
        return;
    }
    
    // Update UI to show preview
    document.getElementById('uploadArea').style.display = 'none';
    document.getElementById('uploadPreview').style.display = 'block';
    document.getElementById('selectedCount').textContent = fileArray.length;
    
    // Generate previews for each file
    const previewGrid = document.getElementById('previewGrid');
    previewGrid.innerHTML = '';
    
    fileArray.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            img.setAttribute('data-file-index', index);
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-preview';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.setAttribute('data-file-index', index);
            removeBtn.onclick = function() {
                // Remove this preview item
                this.parentNode.remove();
                
                // Update file count
                const currentCount = parseInt(document.getElementById('selectedCount').textContent);
                document.getElementById('selectedCount').textContent = currentCount - 1;
                
                // If no files left, go back to upload area
                if (currentCount - 1 === 0) {
                    resetUploadModal();
                }
            };
            
            previewItem.appendChild(img);
            previewItem.appendChild(removeBtn);
            previewGrid.appendChild(previewItem);
        };
        
        reader.readAsDataURL(file);
    });
    
    // Store files in a global variable for later use
    window.selectedFiles = fileArray;
}

/**
 * Start the upload process
 */
function startUpload() {

    const sasUrl = "https://eventphotosgallery.blob.core.windows.net/?sv=2024-11-04&ss=b&srt=o&sp=rwdctfx&se=2026-06-03T20:42:12Z&st=2025-04-04T12:42:12Z&sip=192.168.1.35&spr=https&sig=dJutmHea2imexLrkxOHnZlu9s9MDW1RAv8SOzz%2B9kpE%3D";

    // Get the event code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventCode = urlParams.get('code');
    
    if (!eventCode) {
        alert('Event code not found. Please try again.');
        return;
    }
    
    // Get uploader name
    const uploaderName = document.getElementById('uploaderName').value.trim();
    if (!uploaderName) {
        alert('Please enter your name.');
        document.getElementById('uploaderName').focus();
        return;
    }
    
    // Save uploader name to local storage
    localStorage.setItem('uploaderName', uploaderName);
    
    // Check if files were selected
    if (!window.selectedFiles || window.selectedFiles.length === 0) {
        alert('Please select at least one photo to upload.');
        return;
    }
    
    // Show upload progress
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('uploadProgress').style.display = 'block';
    
    // Get event data from local storage
    const events = JSON.parse(localStorage.getItem('events') || '[]');
    const eventData = events.find(event => event.id === eventCode);
    
    if (!eventData) {
        alert('Event not found. Please check the event code and try again.');
        return;
    }
    
    // In a real application, we would get SAS tokens for Azure Blob Storage here
    // For this demo, we'll simulate uploading to local storage


    window.selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        
        reader.onload = async (e) => {
            // Generate unique filename
            const fileName = `${Date.now()}-${file.name}`;
            //const uploadUrl = `${sasUrl}/${fileName}`;
            const uploadUrl = `https://eventphotosgallery.blob.core.windows.net/event-images/${fileName}?<sv=2024-11-04&ss=b&srt=o&sp=rwdctfx&se=2026-06-03T20:42:12Z&st=2025-04-04T12:42:12Z&sip=192.168.1.35&spr=https&sig=dJutmHea2imexLrkxOHnZlu9s9MDW1RAv8SOzz%2B9kpE%3D>`;
            
            try {
                // Upload to Azure Blob Storage
                const response = await fetch(uploadUrl, {
                    method: "PUT",
                    headers: {
                        "x-ms-blob-type": "BlockBlob",
                        "Content-Type": file.type
                    },
                    body: e.target.result
                });
    
                if (response.ok) {
                    uploadedCount++;
                    const blobUrl = uploadUrl.split("?")[0]; // Remove SAS token from URL
    
                    uploadedPhotos.push({
                        id: generateUUID(),
                        url: blobUrl, // Store the public URL
                        contributor: uploaderName,
                        uploadDate: new Date().toISOString(),
                        likes: 0,
                        comments: []
                    });
    
                    // Update progress UI
                    const progress = Math.round((uploadedCount / totalFiles) * 100);
                    document.getElementById('progressBar').style.width = `${progress}%`;
                    document.getElementById('progressStatus').textContent = `Uploading ${uploadedCount} of ${totalFiles} photos...`;
    
                    // If all uploads are done, update localStorage
                    if (uploadedCount === totalFiles) {
                        eventData.photos = (eventData.photos || []).concat(uploadedPhotos);
                        localStorage.setItem('events', JSON.stringify(events));
    
                        // Show success message
                        setTimeout(() => {
                            document.getElementById('uploadProgress').style.display = 'none';
                            document.getElementById('uploadSuccess').style.display = 'flex';
                        }, 500);
                    }
                } else {
                    console.error("Upload failed for file:", fileName);
                    alert(`Failed to upload ${file.name}.`);
                }
            } catch (error) {
                console.error("Upload error:", error);
                alert(`Error uploading ${file.name}.`);
            }
        };
    });
    }

try {
        const response = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "x-ms-blob-type": "BlockBlob",
                "Content-Type": file.type
            },
            body: file
        });
    
        if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
    } catch (error) {
        console.error("Upload error:", error);
        alert(`Upload error: ${error.message}`);
}
    


/**
 * Generate a random UUID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}