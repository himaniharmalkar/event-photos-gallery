// auth.js - Authentication and user management functions

/**
 * Store user session information in localStorage
 * @param {string} eventId - The event ID/code
 * @param {string} name - User's name
 * @param {boolean} isCreator - Whether the user is the creator of the event
 */
function saveUserSession(eventId, name, isCreator = false) {
    const session = {
        name: name,
        timestamp: new Date().toISOString(),
        isCreator: isCreator
    };
    
    // Store in localStorage keyed by event ID
    localStorage.setItem(`user_session_${eventId}`, JSON.stringify(session));
}

/**
 * Get user session information from localStorage
 * @param {string} eventId - The event ID/code
 * @returns {Object|null} Session object or null if not found
 */
function getUserSession(eventId) {
    const sessionData = localStorage.getItem(`user_session_${eventId}`);
    
    if (sessionData) {
        try {
            return JSON.parse(sessionData);
        } catch (e) {
            console.error('Error parsing session data:', e);
            return null;
        }
    }
    
    return null;
}

/**
 * Check if the current user is the creator of the event
 * @param {string} eventId - The event ID/code
 * @returns {boolean} True if user is creator
 */
function isEventCreator(eventId) {
    const session = getUserSession(eventId);
    return session && session.isCreator === true;
}

/**
 * Generate a Shared Access Signature (SAS) token for Azure Blob Storage
 * This is a simplified mock version - in production this would be handled by a backend service
 * @param {string} eventId - The event ID/code
 * @returns {string} Mock SAS token
 */
function generateSasToken(eventId) {
    // In a real implementation, this would be a server call to generate a proper SAS token
    // This is just a placeholder that mimics the format of a SAS token
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // Token valid for 1 hour
    
    return `sv=2021-06-08&ss=b&srt=c&sp=rwlac&se=${expiry.toISOString()}&st=${new Date().toISOString()}&spr=https&sig=mockSignature${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Check if an event requires moderation
 * @param {string} eventId - The event ID/code
 * @returns {boolean} True if moderation is required
 */
function eventRequiresModeration(eventId) {
    const events = getStoredEvents();
    const event = events.find(e => e.id === eventId);
    
    return event && event.moderation === 'on';
}

/**
 * Get stored events from localStorage
 * @returns {Array} Array of event objects
 */
function getStoredEvents() {
    try {
        return JSON.parse(localStorage.getItem('events') || '[]');
    } catch (e) {
        console.error('Error loading events:', e);
        return [];
    }
}

/**
 * Find an event by ID/code
 * @param {string} eventId - The event ID/code to find
 * @returns {Object|null} Event object or null if not found
 */
function findEventById(eventId) {
    const events = getStoredEvents();
    return events.find(event => event.id === eventId) || null;
}

/**
 * Update an event in localStorage
 * @param {Object} updatedEvent - The updated event object
 * @returns {boolean} Success status
 */
function updateEvent(updatedEvent) {
    if (!updatedEvent || !updatedEvent.id) {
        return false;
    }
    
    const events = getStoredEvents();
    const index = events.findIndex(e => e.id === updatedEvent.id);
    
    if (index !== -1) {
        events[index] = updatedEvent;
        localStorage.setItem('events', JSON.stringify(events));
        return true;
    }
    
    return false;
}