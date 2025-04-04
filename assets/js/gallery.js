// gallery.js - Handles gallery loading, rendering, and interactions

document.addEventListener('DOMContentLoaded', function() {
    // Get event code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventCode = urlParams.get('code');
    
    if (!eventCode) {
        showError("No event code provided. Please check your link or enter an event code.");
        return;
    }
    
    // Initialize gallery
    initGallery(eventCode);
    
    // Setup view toggles
    document.getElementById('gridViewBtn').addEventListener('click', function() {
        document.getElementById('galleryGrid').style.display = 'grid';
        document.getElementById('galleryList').style.display = 'none';
        this.classList.add('active');
        document.getElementById('listViewBtn').classList.remove('active');
    });
    
    document.getElementById('listViewBtn').addEventListener('click', function() {
        document.getElementById('galleryGrid').style.display = 'none';
        document.getElementById('galleryList').style.display = 'block';
        this.classList.add('active');
        document.getElementById('gridViewBtn').classList.remove('active');
    });
    
    // Setup mobile action menu
    document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
        document.getElementById('mobileActionMenu').classList.toggle('show');
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const menu = document.getElementById('mobileActionMenu');
        const menuBtn = document.querySelector('.mobile-menu-btn');
        
        if (!menu.contains(event.target) && !menuBtn.contains(event.target) && menu.classList.contains('show')) {
            menu.classList.remove('show');
        }
    });
    
    // Gallery info button
    document.getElementById('galleryInfoBtn').addEventListener('click', function() {
        showGalleryInfo();
    });
    
    // Share gallery button
    document.getElementById('shareGalleryBtn').addEventListener('click', function() {
        shareGallery();
    });
    
    // Download all button
    document.getElementById('downloadAllBtn').addEventListener('click', function() {
        downloadAllPhotos();
    });
    
    // Search functionality
    document.getElementById('searchGallery').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        filterGallery(searchTerm);
    });
    
    // Sort functionality
    document.getElementById('sortGallery').addEventListener('change', function() {
        sortGallery(this.value);
    });
    
    // Pagination controls
    document.getElementById('prevPageBtn').addEventListener('click', function() {
        if (!this.disabled) {
            currentPage--;
            renderPhotos();
            updatePagination();
        }
    });
    
    document.getElementById('nextPageBtn').addEventListener('click', function() {
        if (!this.disabled) {
            currentPage++;
            renderPhotos();
            updatePagination();
        }
    });
});

// Global variables
let galleryData = null;
let photos = [];
let filteredPhotos = [];
let currentPage = 1;
const photosPerPage = 20;
let currentPhotoIndex = 0;

// Initialize gallery
function initGallery(eventCode) {
    // In a real app, this would fetch from an API
    // For demo, we'll get from localStorage
    const events = JSON.parse(localStorage.getItem('events') || '[]');
    galleryData = events.find(event => event.id === eventCode);
    
    if (!galleryData) {
        showError("Event not found. Please check your event code.");
        return;
    }
    
    // Update gallery header
    document.getElementById('galleryTitle').textContent = galleryData.name;
    
    const eventDate = new Date(galleryData.date);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('galleryDate').textContent = eventDate.toLocaleDateString('en-US', options);
    
    // Load photos (would be an API call in a real app)
    photos = galleryData.photos || [];
    
    // Check if there are any photos
    if (photos.length === 0) {
        document.querySelector('.empty-gallery').style.display = 'flex';
        document.getElementById('emptyGalleryUploadBtn').addEventListener('click', function() {
            showUploadModal();
        });
    } else {
        document.querySelector('.empty-gallery').style.display = 'none';
        filteredPhotos = [...photos];
        updateGalleryStats();
        renderPhotos();
        updatePagination();
    }
    
    // Set up upload buttons
    document.getElementById('uploadBtn').addEventListener('click', function() {
        showUploadModal();
    });
    
    document.getElementById('mobileUploadBtn').addEventListener('click', function() {
        showUploadModal();
        document.getElementById('mobileActionMenu').classList.remove('show');
    });
}

// Update gallery statistics
function updateGalleryStats() {
    document.getElementById('photoCount').textContent = photos.length;
    
    // Count unique contributors
    const contributors = new Set();
    photos.forEach(photo => {
        if (photo.contributor) {
            contributors.add(photo.contributor);
        }
    });
    document.getElementById('contributorCount').textContent = contributors.size;
}

// Render photos in the gallery
function renderPhotos() {
    const gridContainer = document.getElementById('galleryGrid');
    const listContainer = document.getElementById('galleryList');
    
    // Clear containers
    gridContainer.innerHTML = '';
    listContainer.innerHTML = '';
    
    if (filteredPhotos.length === 0) {
        // No photos match the filter
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-gallery';
        emptyMessage.innerHTML = `
            <div class="empty-gallery-icon">
                <i class="fas fa-search"></i>
            </div>
            <h3>No photos found</h3>
            <p>Try adjusting your search criteria</p>
        `;
        gridContainer.appendChild(emptyMessage);
        
        const listEmptyMessage = emptyMessage.cloneNode(true);
        listContainer.appendChild(listEmptyMessage);
        return;
    }
    
    // Calculate start and end indices for pagination
    const startIndex = (currentPage - 1) * photosPerPage;
    const endIndex = Math.min(startIndex + photosPerPage, filteredPhotos.length);
    
    // Render grid view
    for (let i = startIndex; i < endIndex; i++) {
        const photo = filteredPhotos[i];
        
        // Create grid item
        const gridItem = document.createElement('div');
        gridItem.className = 'gallery-item';
        gridItem.setAttribute('data-index', i);
        
        // For demo purposes, we'll use placeholder images
        // In a real app, we'd use the actual photo URLs
        gridItem.innerHTML = `
            <div class="gallery-item-img" style="background-image: url('/api/placeholder/400/400')">
                <div class="item-overlay">
                    <div class="item-actions">
                        <button class="btn-icon like-btn" title="Like Photo">
                            <i class="far fa-heart"></i>
                            <span>${photo.likes || 0}</span>
                        </button>
                        <button class="btn-icon comment-btn" title="Comment">
                            <i class="far fa-comment"></i>
                            <span>${(photo.comments || []).length}</span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="gallery-item-info">
                <div class="item-contributor">${photo.contributor || 'Anonymous'}</div>
                <div class="item-timestamp">${formatTimestamp(photo.timestamp)}</div>
            </div>
        `;
        
        // Add click event to open photo viewer
        gridItem.addEventListener('click', function() {
            openPhotoViewer(parseInt(this.getAttribute('data-index')));
        });
        
        gridContainer.appendChild(gridItem);
        
        // Create list item
        const listItem = document.createElement('div');
        listItem.className = 'list-item';
        listItem.setAttribute('data-index', i);
        
        listItem.innerHTML = `
            <div class="list-item-img" style="background-image: url('/api/placeholder/100/100')"></div>
            <div class="list-item-info">
                <div class="list-item-contributor">${photo.contributor || 'Anonymous'}</div>
                <div class="list-item-timestamp">${formatTimestamp(photo.timestamp)}</div>
                <div class="list-item-stats">
                    <span><i class="far fa-heart"></i> ${photo.likes || 0}</span>
                    <span><i class="far fa-comment"></i> ${(photo.comments || []).length}</span>
                </div>
            </div>
            <div class="list-item-actions">
                <button class="btn-icon" title="View Photo">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        `;
        
        // Add click event to open photo viewer
        listItem.addEventListener('click', function() {
            openPhotoViewer(parseInt(this.getAttribute('data-index')));
        });
        
        listContainer.appendChild(listItem);
    }
}

// Update pagination controls and info
function updatePagination() {
    const totalPages = Math.ceil(filteredPhotos.length / photosPerPage);
    document.getElementById('paginationInfo').textContent = `Page ${currentPage} of ${totalPages || 1}`;
    
    // Update button states
    document.getElementById('prevPageBtn').disabled = currentPage <= 1;
    document.getElementById('nextPageBtn').disabled = currentPage >= totalPages || totalPages === 0;
}

// Filter gallery by search term
function filterGallery(searchTerm) {
    if (!searchTerm) {
        filteredPhotos = [...photos];
    } else {
        filteredPhotos = photos.filter(photo => {
            return (
                (photo.contributor && photo.contributor.toLowerCase().includes(searchTerm)) ||
                (photo.tags && photo.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        });
    }
    
    currentPage = 1;
    renderPhotos();
    updatePagination();
}

// Sort gallery by the specified option
function sortGallery(sortOption) {
    switch (sortOption) {
        case 'newest':
            filteredPhotos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            break;
        case 'oldest':
            filteredPhotos.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            break;
        case 'popular':
            filteredPhotos.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            break;
        case 'contributors':
            filteredPhotos.sort((a, b) => {
                const contribA = (a.contributor || 'Anonymous').toLowerCase();
                const contribB = (b.contributor || 'Anonymous').toLowerCase();
                return contribA.localeCompare(contribB);
            });
            break;
    }
    
    currentPage = 1;
    renderPhotos();
    updatePagination();
}

// Open photo viewer modal
function openPhotoViewer(index) {
    currentPhotoIndex = index;
    const photo = filteredPhotos[index];
    
    // Set up photo viewer content
    const photoContainer = document.getElementById('photoContainer');
    photoContainer.innerHTML = `<img src="/api/placeholder/800/600" alt="Event photo">`;
    
    // Update photo information
    document.getElementById('photoContributor').textContent = photo.contributor || 'Anonymous';
    document.getElementById('photoTimestamp').textContent = formatTimestamp(photo.timestamp);
    document.getElementById('likeCount').textContent = photo.likes || 0;
    document.getElementById('commentCount').textContent = (photo.comments || []).length;
    
    // Update comments
    updateComments(photo);
    
    // Like button state
    const likeBtn = document.getElementById('likePhotoBtn');
    if (photo.liked) {
        likeBtn.innerHTML = `<i class="fas fa-heart"></i><span>${photo.likes || 0}</span>`;
    } else {
        likeBtn.innerHTML = `<i class="far fa-heart"></i><span>${photo.likes || 0}</span>`;
    }
    
    // Setup navigation buttons
    document.getElementById('prevPhotoBtn').disabled = index === 0;
    document.getElementById('nextPhotoBtn').disabled = index === filteredPhotos.length - 1;
    
    // Setup event listeners for actions
    setupPhotoViewerActions(photo, index);
    
    // Show modal
    document.getElementById('photoViewerModal').style.display = 'block';
}

// Update comments section in the photo viewer
function updateComments(photo) {
    const commentsList = document.getElementById('commentsList');
    commentsList.innerHTML = '';
    
    const comments = photo.comments || [];
    
    if (comments.length === 0) {
        commentsList.innerHTML = `
            <div class="no-comments">
                <p>No comments yet. Be the first to comment!</p>
            </div>
        `;
        return;
    }
    
    // Sort comments by newest first
    comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${comment.name || 'Anonymous'}</span>
                <span class="comment-timestamp">${formatTimestamp(comment.timestamp)}</span>
            </div>
            <div class="comment-text">${comment.text}</div>
        `;
        commentsList.appendChild(commentElement);
    });
}

// Setup photo viewer action buttons
function setupPhotoViewerActions(photo, index) {
    // Close button
    document.querySelector('#photoViewerModal .close-modal').addEventListener('click', function() {
        document.getElementById('photoViewerModal').style.display = 'none';
    });
    
    // Navigation buttons
    document.getElementById('prevPhotoBtn').addEventListener('click', function() {
        if (currentPhotoIndex > 0) {
            openPhotoViewer(currentPhotoIndex - 1);
        }
    });
    
    document.getElementById('nextPhotoBtn').addEventListener('click', function() {
        if (currentPhotoIndex < filteredPhotos.length - 1) {
            openPhotoViewer(currentPhotoIndex + 1);
        }
    });
    
    // Like button
    document.getElementById('likePhotoBtn').addEventListener('click', function() {
        toggleLike(photo, index, this);
    });
    
    // Download button
    document.getElementById('downloadPhotoBtn').addEventListener('click', function() {
        downloadPhoto(photo);
    });
    
    // Share button
    document.getElementById('sharePhotoBtn').addEventListener('click', function() {
        sharePhoto(photo, window.location.href + '&photo=' + index);
    });
    
    // Comment button
    document.getElementById('commentPhotoBtn').addEventListener('click', function() {
        document.querySelector('.comment-form').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('commentText').focus();
    });
    
    // Submit comment
    document.getElementById('submitCommentBtn').addEventListener('click', function() {
        submitComment(photo, index);
    });
}

// Toggle like on a photo
function toggleLike(photo, index, button) {
    if (!photo.liked) {
        photo.likes = (photo.likes || 0) + 1;
        photo.liked = true;
        button.innerHTML = `<i class="fas fa-heart"></i><span>${photo.likes}</span>`;
    } else {
        photo.likes = Math.max(0, (photo.likes || 1) - 1);
        photo.liked = false;
        button.innerHTML = `<i class="far fa-heart"></i><span>${photo.likes}</span>`;
    }
    
    // Update photo in the array
    photos[photos.indexOf(filteredPhotos[index])] = photo;
    filteredPhotos[index] = photo;
    
    // Save to local storage
    saveGalleryData();
    
    // Update like count in the viewer
    document.getElementById('likeCount').textContent = photo.likes;
}

// Submit a comment on a photo
function submitComment(photo, index) {
    const nameInput = document.getElementById('commentName');
    const textInput = document.getElementById('commentText');
    
    const name = nameInput.value.trim();
    const text = textInput.value.trim();
    
    if (!text) {
        alert('Please enter a comment.');
        return;
    }
    
    // Create comment object
    const comment = {
        name: name || 'Anonymous',
        text: text,
        timestamp: new Date().toISOString()
    };
    
    // Initialize comments array if it doesn't exist
    if (!photo.comments) {
        photo.comments = [];
    }
    
    // Add the comment
    photo.comments.push(comment);
    
    // Update photo in the array
    photos[photos.indexOf(filteredPhotos[index])] = photo;
    filteredPhotos[index] = photo;
    
    // Save to local storage
    saveGalleryData();
    
    // Update comments display
    updateComments(photo);
    
    // Update comment count
    document.getElementById('commentCount').textContent = photo.comments.length;
    
    // Clear the form
    textInput.value = '';
    
    // Store the name in local storage for future use
    if (name) {
        localStorage.setItem('commentName', name);
    }
}

// Show gallery info modal
function showGalleryInfo() {
    if (!galleryData) return;
    
    // Update modal with gallery info
    document.getElementById('infoGalleryName').textContent = galleryData.name;
    
    const eventDate = new Date(galleryData.date);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('infoGalleryDate').textContent = eventDate.toLocaleDateString('en-US', options);
    
    document.getElementById('infoGalleryDescription').textContent = galleryData.description || 'No description provided.';
    document.getElementById('infoEventCode').textContent = galleryData.id;
    
    const eventLink = `${window.location.origin}/event-gallery.html?code=${galleryData.id}`;
    document.getElementById('infoEventLink').value = eventLink;
    
    // Count statistics
    document.getElementById('infoPhotoCount').textContent = photos.length;
    
    const contributors = new Set();
    let totalLikes = 0;
    let totalComments = 0;
    
    photos.forEach(photo => {
        if (photo.contributor) {
            contributors.add(photo.contributor);
        }
        totalLikes += (photo.likes || 0);
        totalComments += (photo.comments || []).length;
    });
    
    document.getElementById('infoContributorCount').textContent = contributors.size;
    document.getElementById('infoLikeCount').textContent = totalLikes;
    document.getElementById('infoCommentCount').textContent = totalComments;
    
    // Creator info
    document.getElementById('infoCreatorName').textContent = galleryData.creator?.name || 'Anonymous';
    
    const creationDate = new Date(galleryData.created);
    document.getElementById('infoCreationDate').textContent = creationDate.toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    
    // Set up copy buttons
    document.getElementById('infoCopyCode').addEventListener('click', function() {
        navigator.clipboard.writeText(galleryData.id)
            .then(() => {
                showToast('Event code copied to clipboard!');
            });
    });
    
    document.getElementById('infoCopyLink').addEventListener('click', function() {
        navigator.clipboard.writeText(eventLink)
            .then(() => {
                showToast('Event link copied to clipboard!');
            });
    });
    
    // Set up share button
    document.getElementById('infoShareGalleryBtn').addEventListener('click', function() {
        shareGallery();
    });
    
    // Show the modal
    document.getElementById('galleryInfoModal').style.display = 'block';
    
    // Close modal on X click
    document.querySelector('#galleryInfoModal .close-modal').addEventListener('click', function() {
        document.getElementById('galleryInfoModal').style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('galleryInfoModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Share gallery
function shareGallery() {
    if (!galleryData) return;
    
    const eventLink = `${window.location.origin}/event-gallery.html?code=${galleryData.id}`;
    
    if (navigator.share) {
        navigator.share({
            title: `${galleryData.name} Photo Gallery`,
            text: `Check out photos from ${galleryData.name}. Event code: ${galleryData.id}`,
            url: eventLink
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(eventLink)
            .then(() => {
                showToast('Gallery link copied to clipboard!');
            });
    }
}

// Download a photo
function downloadPhoto(photo) {
    // In a real app, this would download the actual image
    // For demo purposes, we'll just show a toast
    showToast('Photo download started...');
}

// Download all photos
function downloadAllPhotos() {
    // In a real app, this would prepare a zip file of all images
    // For demo purposes, we'll just show a toast
    showToast(`Preparing ${photos.length} photos for download...`);
}

// Show error message
function showError(message) {
    const headerContainer = document.querySelector('.gallery-container .container');
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerHTML = `
        <div class="error-icon">
            <i class="fas fa-exclamation-circle"></i>
        </div>
        <h3>Error Loading Gallery</h3>
        <p>${message}</p>
        <a href="index.html" class="btn btn-primary">Return to Home</a>
    `;
    
    headerContainer.innerHTML = '';
    headerContainer.appendChild(errorElement);
}

// Format timestamp for display
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
        return 'Just now';
    } else if (diffMin < 60) {
        return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHour < 24) {
        return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDay < 7) {
        return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', month: 'short', day: 'numeric' 
        });
    }
}

// Save gallery data to local storage
function saveGalleryData() {
    if (!galleryData) return;
    
    // Update photos in gallery data
    galleryData.photos = photos;
    
    // Get all events
    let events = JSON.parse(localStorage.getItem('events') || '[]');
    
    // Find and update the current event
    const eventIndex = events.findIndex(event => event.id === galleryData.id);
    if (eventIndex !== -1) {
        events[eventIndex] = galleryData;
        localStorage.setItem('events', JSON.stringify(events));
    }
}

// Show toast notification
function showToast(message) {
    // Create toast element if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Show the toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto-hide the toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300); // Match the CSS transition time
    }, 3000);
}