// utils.js - Utility functions for SnapTogether photo gallery

/**
 * Format date to a user-friendly string
 * @param {string} dateString - ISO date string
 * @param {boolean} includeTime - Whether to include time in the output
 * @returns {string} Formatted date string
 */
function formatDate(dateString, includeTime = false) {
    const date = new Date(dateString);
    
    if (isNaN(date)) {
        return 'Invalid date';
    }
    
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('en-US', options);
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string
 */
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    
    if (isNaN(date)) {
        return 'Invalid date';
    }
    
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
        return formatDate(dateString);
    }
}

/**
 * Truncate text to a certain length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if necessary
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    
    if (text.length <= maxLength) {
        return text;
    }
    
    return text.substring(0, maxLength) + '...';
}

/**
 * Generate a random UUID
 * @returns {string} UUID string
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Display a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Notification type: 'success', 'error', or 'info'
 * @param {number} duration - How long to show the notification in ms
 */
function showToast(message, type = 'info', duration = 3000) {
    // Check if a toast container exists, create if not
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create the toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add icon based on type
    const icon = document.createElement('i');
    
    switch (type) {
        case 'success':
            icon.className = 'fas fa-check-circle';
            break;
        case 'error':
            icon.className = 'fas fa-exclamation-circle';
            break;
        default:
            icon.className = 'fas fa-info-circle';
    }
    
    toast.insertBefore(icon, toast.firstChild);
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Show the toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove the toast after duration
    setTimeout(() => {
        toast.classList.remove('show');
        
        // Remove from DOM after animation
        setTimeout(() => {
            toastContainer.removeChild(toast);
            
            // Remove container if empty
            if (toastContainer.children.length === 0) {
                document.body.removeChild(toastContainer);
            }
        }, 300);
    }, duration);
}

/**
 * Simple image compression using canvas
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width for the compressed image
 * @param {number} maxHeight - Maximum height for the compressed image
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Blob>} - Promise that resolves with compressed image blob
 */
function compressImage(file, maxWidth = 1600, maxHeight = 1600, quality = 0.8) {
    return new Promise((resolve, reject) => {
        // Create image element
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = () => {
            // Calculate new dimensions
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round(height * maxWidth / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round(width * maxHeight / height);
                    height = maxHeight;
                }
            }
            
            // Create canvas and draw image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to blob
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas to Blob conversion failed'));
                    }
                },
                'image/jpeg',
                quality
            );
            
            // Clean up
            URL.revokeObjectURL(img.src);
        };
        
        img.onerror = () => {
            reject(new Error('Image loading failed'));
            URL.revokeObjectURL(img.src);
        };
    });
}

/**
 * Add lazy loading to images
 * @param {string} selector - CSS selector for images to lazy load
 */
function setupLazyLoading(selector = '.lazy-load') {
    // Check for IntersectionObserver support
    if ('IntersectionObserver' in window) {
        const lazyImageObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const lazyImage = entry.target;
                    lazyImage.src = lazyImage.dataset.src;
                    lazyImage.classList.remove('lazy-load');
                    lazyImageObserver.unobserve(lazyImage);
                }
            });
        });
        
        // Observe all lazy images
        const lazyImages = document.querySelectorAll(selector);
        lazyImages.forEach((lazyImage) => {
            lazyImageObserver.observe(lazyImage);
        });
    } else {
        // Fallback for browsers without IntersectionObserver
        const lazyImages = document.querySelectorAll(selector);
        
        function lazyLoad() {
            if (lazyLoadTimeout) {
                clearTimeout(lazyLoadTimeout);
            }
            
            lazyLoadTimeout = setTimeout(() => {
                const scrollTop = window.pageYOffset;
                
                lazyImages.forEach((lazyImage) => {
                    if (lazyImage.offsetTop < window.innerHeight + scrollTop) {
                        lazyImage.src = lazyImage.dataset.src;
                        lazyImage.classList.remove('lazy-load');
                    }
                });
                
                if (lazyImages.length === 0) {
                    document.removeEventListener('scroll', lazyLoad);
                    window.removeEventListener('resize', lazyLoad);
                    window.removeEventListener('orientationChange', lazyLoad);
                }
            }, 20);
        }
        
        let lazyLoadTimeout;
        
        // Add event listeners for scrolling
        document.addEventListener('scroll', lazyLoad);
        window.addEventListener('resize', lazyLoad);
        window.addEventListener('orientationChange', lazyLoad);
        
        // Initial load
        lazyLoad();
    }
}

/**
 * Create a modal dialog
 * @param {object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {string} options.content - Modal content HTML
 * @param {Array} options.buttons - Array of button objects with text and callback
 * @returns {HTMLElement} - The modal DOM element
 */
function createModal(options) {
    // Create modal elements
    const modal = document.createElement('div');
    modal.className = 'modal custom-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const title = document.createElement('h2');
    title.textContent = options.title || 'Modal';
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-modal';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => {
        document.body.removeChild(modal);
    };
    
    modalHeader.appendChild(title);
    modalHeader.appendChild(closeBtn);
    
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.innerHTML = options.content || '';
    
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    
    // Add buttons
    if (options.buttons && Array.isArray(options.buttons)) {
        options.buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `btn ${btn.className || 'btn-secondary'}`;
            button.textContent = btn.text || 'Button';
            button.onclick = () => {
                if (typeof btn.callback === 'function') {
                    btn.callback();
                }
                document.body.removeChild(modal);
            };
            modalFooter.appendChild(button);
        });
    }
    
    // Assemble modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modal.appendChild(modalContent);
    
    // Add to body
    document.body.appendChild(modal);
    
    // Show modal
    setTimeout(() => {
        modal.style.display = 'block';
    }, 10);
    
    // Close when clicking outside
    window.onclick = (event) => {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    };
    
    return modal;
}

/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - Function to debounce
 * @param {number} wait - Time to wait in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if a date is in the past
 * @param {string} dateString - ISO date string to check
 * @returns {boolean} - True if date is in the past
 */
function isExpired(dateString) {
    const date = new Date(dateString);
    return date < new Date();
}

/**
 * Calculate days remaining until a date
 * @param {string} dateString - ISO date string
 * @returns {number} - Days remaining, negative if date is in the past
 */
function daysUntil(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

/**
 * Format file size into human-readable string
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted file size (e.g., "2.5 MB")
 */
function formatFileSize(bytes, decimals = 1) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Export utility functions
window.utils = {
    formatDate,
    formatRelativeTime,
    truncateText,
    generateUUID,
    showToast,
    compressImage,
    setupLazyLoading,
    createModal,
    debounce,
    isExpired,
    daysUntil,
    formatFileSize
};