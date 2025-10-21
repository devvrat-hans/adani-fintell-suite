/**
 * Adani-Fintell-Suite - Platform Detection Utility
 * Detects the user's operating system and platform
 */

'use strict';

/**
 * Detect platform information
 */
const detectPlatform = () => {
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();
    
    return {
        // Main platform check
        isMac: platform.includes('mac') || platform.includes('darwin'),
        isWindows: platform.includes('win'),
        isLinux: platform.includes('linux'),
        isIOS: /iphone|ipad|ipod/.test(userAgent),
        isAndroid: /android/.test(userAgent),
        
        // Browser detection
        isChrome: /chrome/.test(userAgent) && !/edg/.test(userAgent),
        isFirefox: /firefox/.test(userAgent),
        isSafari: /safari/.test(userAgent) && !/chrome/.test(userAgent),
        isEdge: /edg/.test(userAgent),
        
        // Device type
        isMobile: /mobile|android|iphone|ipad|phone/i.test(userAgent),
        isTablet: /tablet|ipad/i.test(userAgent),
        isDesktop: !(/mobile|android|iphone|ipad|phone|tablet/i.test(userAgent)),
        
        // Raw values for advanced use
        platformString: navigator.platform,
        userAgentString: navigator.userAgent,
        
        // Helper methods
        getModifierKey: function() {
            return this.isMac ? '⌘' : 'Ctrl';
        },
        
        getModifierKeyName: function() {
            return this.isMac ? 'Command' : 'Control';
        },
        
        getPlatformName: function() {
            if (this.isMac) return 'macOS';
            if (this.isWindows) return 'Windows';
            if (this.isLinux) return 'Linux';
            if (this.isIOS) return 'iOS';
            if (this.isAndroid) return 'Android';
            return 'Unknown';
        },
        
        getBrowserName: function() {
            if (this.isChrome) return 'Chrome';
            if (this.isFirefox) return 'Firefox';
            if (this.isSafari) return 'Safari';
            if (this.isEdge) return 'Edge';
            return 'Unknown';
        },
        
        getDeviceType: function() {
            if (this.isMobile && !this.isTablet) return 'Mobile';
            if (this.isTablet) return 'Tablet';
            if (this.isDesktop) return 'Desktop';
            return 'Unknown';
        }
    };
};

// Create the platform object immediately when the module loads
export const PLATFORM = detectPlatform();

// Log platform information for debugging
console.log('Platform detected:', {
    os: PLATFORM.getPlatformName(),
    browser: PLATFORM.getBrowserName(),
    device: PLATFORM.getDeviceType(),
    modifierKey: PLATFORM.getModifierKey()
});

// Add platform classes to body for CSS targeting
document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    
    // Add OS class
    if (PLATFORM.isMac) body.classList.add('platform-mac');
    if (PLATFORM.isWindows) body.classList.add('platform-windows');
    if (PLATFORM.isLinux) body.classList.add('platform-linux');
    if (PLATFORM.isIOS) body.classList.add('platform-ios');
    if (PLATFORM.isAndroid) body.classList.add('platform-android');
    
    // Add device type class
    if (PLATFORM.isMobile) body.classList.add('device-mobile');
    if (PLATFORM.isTablet) body.classList.add('device-tablet');
    if (PLATFORM.isDesktop) body.classList.add('device-desktop');
    
    // Add browser class
    if (PLATFORM.isChrome) body.classList.add('browser-chrome');
    if (PLATFORM.isFirefox) body.classList.add('browser-firefox');
    if (PLATFORM.isSafari) body.classList.add('browser-safari');
    if (PLATFORM.isEdge) body.classList.add('browser-edge');
});

// Export as default as well for convenience
export default PLATFORM;
