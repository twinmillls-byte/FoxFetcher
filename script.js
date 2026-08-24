/*
 * Fox Fetcher
 * Random fox image loader
 */

(function () {
  "use strict";

  const API_URL = "https://randomfox.ca/floof/";

  const cardInner = document.getElementById("cardInner");
  const cardState = document.getElementById("cardState");
  const cardStateText = document.getElementById("cardStateText");

  const foxImage = document.getElementById("foxImage");
  const foxCount = document.getElementById("foxCount");
  const foxLink = document.getElementById("foxLink");

  const fetchButton = document.getElementById("fetchButton");
  const fetchButtonText = document.getElementById("fetchButtonText");
  const sessionCounter = document.getElementById("sessionCounter");

  let foxesFetched = 0;
  let isLoading = false;


  // ------------------------------------------------------------
  // Card state
  // ------------------------------------------------------------

  function setCardState(mode, text) {
    cardInner.classList.remove("is-loading", "is-error");

    if (mode === "loading" || mode === "error") {
      cardInner.classList.add("is-" + mode);
    }

    cardStateText.textContent = text;
    cardState.hidden = false;
  }


  // ------------------------------------------------------------
  // Button animation
  // ------------------------------------------------------------

  function playPounce() {
    fetchButton.classList.remove("pounce");

    // Force browser reflow so the animation can restart.
    void fetchButton.offsetWidth;

    fetchButton.classList.add("pounce");
  }


  // ------------------------------------------------------------
  // Get random fox data
  // ------------------------------------------------------------

  async function getRandomFox() {
    const response = await fetch(API_URL + "?t=" + Date.now(), {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        "RandomFox API returned HTTP " + response.status
      );
    }

    const data = await response.json();

    if (!data || typeof data.image !== "string") {
      throw new Error("The API did not return an image URL.");
    }

    return {
      image: data.image,
      link: data.link || data.image
    };
  }


  // ------------------------------------------------------------
  // Fetch and display a fox
  // ------------------------------------------------------------

  async function fetchFox() {
    if (isLoading) {
      return;
    }

    isLoading = true;
    fetchButton.disabled = true;

    playPounce();

    // Completely reset the previous image.
    foxImage.classList.remove("is-visible");
    foxImage.hidden = true;
    foxImage.removeAttribute("src");

    setCardState(
      "loading",
      "Sniffing around for a fox…"
    );

    try {
      const fox = await getRandomFox();

      /*
       * IMPORTANT:
       *
       * Do NOT preload the image with new Image().
       * Just assign the URL directly to the actual <img>.
       *
       * The browser will fire foxImage.onload when it is ready.
       */

      foxImage.onload = function () {
        // Make absolutely sure the HTML hidden attribute is gone.
        foxImage.hidden = false;

        // Make sure CSS cannot keep the image invisible.
        foxImage.style.opacity = "1";
        foxImage.style.visibility = "visible";

        // Hide the loading card.
        cardState.hidden = true;

        // Trigger the visual animation.
        foxImage.classList.remove("is-visible");

        void foxImage.offsetWidth;

        foxImage.classList.add("is-visible");
      };


      foxImage.onerror = function () {
        console.error(
          "The fox image itself failed to load:",
          fox.image
        );

        foxImage.hidden = true;
        foxImage.style.opacity = "";
        foxImage.style.visibility = "";

        setCardState(
          "error",
          "The fox image could not be loaded — try another one."
        );

        isLoading = false;
        fetchButton.disabled = false;
      };


      // Set the source AFTER registering the events.
      foxImage.src = fox.image;


      // Update counter.
      foxesFetched++;

      foxCount.innerHTML =
        '<span class="tag-paw" aria-hidden="true">&#128062;</span>' +
        "No. " +
        String(foxesFetched).padStart(3, "0");


      // Original image/source link.
      foxLink.href = fox.link;
      foxLink.hidden = false;


      // Session counter.
      sessionCounter.textContent =
        foxesFetched === 1
          ? "1 fox found this session"
          : foxesFetched + " foxes found this session";


      // Change button text.
      fetchButtonText.textContent = "Fetch another fox";


      /*
       * Loading is finished here from the API's perspective.
       * The actual image display is handled by foxImage.onload.
       */
      isLoading = false;
      fetchButton.disabled = false;

    } catch (error) {
      console.error("Failed to fetch fox:", error);

      foxImage.hidden = true;
      foxImage.removeAttribute("src");

      setCardState(
        "error",
        "That fox got away — try fetching another."
      );

      isLoading = false;
      fetchButton.disabled = false;
    }
  }


  // ------------------------------------------------------------
  // Events
  // ------------------------------------------------------------

  fetchButton.addEventListener("click", fetchFox);

  fetchButton.addEventListener("animationend", function () {
    fetchButton.classList.remove("pounce");
  });


  // ------------------------------------------------------------
  // Initial fox
  // ------------------------------------------------------------

  fetchFox();

})();

