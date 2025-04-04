// app.js - Core application functions
document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile menu functionality across all pages
    initMobileMenu();
    
    // Check for and handle URL parameters
    handleUrlParams();
    
    // Initialize modals
    initModals();
});

/**
 * Initialize mobile menu toggle functionality
 */
function initMobileMenu() {
    const menuBtns = document.querySelectorAll('.mobile-menu-btn');
    
    menuBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Toggle mobile menu on regular pages
            const mainNav = document.querySelector('.main-nav');
            if (mainNav) {
                mainNav.classList.toggle('active');
            }
            
            // Toggle action menu on gallery page
            const actionMenu = document.getElementById('mobileActionMenu');
            if (actionMenu) {
                actionMenu.classList.toggle('active');
            }
        });
    });
    
    // Close mobile menus when clicking outside
    document.addEventListener('click', function(event) {
        const isMenuBtn = event.target.closest('.mobile-menu-btn');
        const isMenuContent = event.target.closest('.main-nav') || event.target.closest('#mobileActionMenu');
        
        if (!isMenuBtn && !isMenuContent) {
            const mainNav = document.querySelector('.main-nav');
            const actionMenu = document.getElementById('mobileActionMenu');
            
            if (mainNav && mainNav.classList.contains('active')) {
                mainNav.classList.remove('active');
            }
            
            if (actionMenu && actionMenu.classList.contains('active')) {
                actionMenu.classList.remove('active');
            }
        }
    });
}

/**
 * Parse URL parameters and handle accordingly
 */
function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventCode = urlParams.get('code');
    
    // If we're on the gallery page and have an event code
    if (eventCode && window.location.pathname.includes('event-gallery.html')) {
        loadGallery(eventCode);
    }
}

/**
 * Initialize all modal functionality
 */
function initModals() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        // Close button functionality
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        }
        
        // Close modal when clicking outside content
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

/**
 * Format a date object into a human-readable string
 * @param {Date|string} date - Date object or date string
 * @param {boolean} includeTime - Whether to include the time
 * @returns {string} Formatted date string
 */
function formatDate(date, includeTime = false) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    };
    
    if (includeTime) {
        options.hour = 'numeric';
        options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('en-US', options);
}

/**
 * Generate random alphanumeric code of specified length
 * @param {number} length - Length of code to generate
 * @returns {string} Random code
 */
function generateRandomCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Show a modal by ID
 * @param {string} modalId - The ID of the modal to show
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

/**
 * Hide a modal by ID
 * @param {string} modalId - The ID of the modal to hide
 */
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Copy text to clipboard and show feedback
 * @param {string} text - Text to copy
 * @param {string} message - Message to show in alert
 */
function copyToClipboard(text, message = 'Copied to clipboard!') {
    navigator.clipboard.writeText(text)
        .then(() => {
            alert(message);
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy to clipboard');
        });
}

/**
 * Share content using Web Share API or fallback to clipboard
 * @param {Object} shareData - Data to share (title, text, url)
 */
function shareContent(shareData) {
    if (navigator.share) {
        navigator.share(shareData)
            .catch(err => {
                console.warn('Error sharing:', err);
                copyToClipboard(shareData.url, 'Link copied to clipboard for sharing!');
            });
    } else {
        copyToClipboard(shareData.url, 'Link copied to clipboard for sharing!');
    }
}