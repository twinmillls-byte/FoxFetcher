/*
 * Fox Fetcher — lógica de busca de fotos de raposa
 *
 * Fonte principal: randomfox.ca/floof  -> { image, link }
 * Fonte reserva:    some-random-api.com/animal/fox -> { image, fact }
 * Se a fonte principal falhar (rede, CORS, resposta ruim), a reserva
 * entra em ação automaticamente antes de mostrar erro ao usuário.
 */

(function () {
  "use strict";

  const PRIMARY_API = "https://randomfox.ca/floof/";
  const FALLBACK_API = "https://some-random-api.com/animal/fox";

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

  function setCardState(mode, text) {
    cardInner.classList.remove("is-loading", "is-error");
    if (mode === "loading" || mode === "error") {
      cardInner.classList.add("is-" + mode);
    }
    cardStateText.textContent = text;
    cardState.hidden = false;
  }

  function playPounce() {
    fetchButton.classList.remove("pounce");
    // força reflow para poder reiniciar a animação em cliques seguidos
    void fetchButton.offsetWidth;
    fetchButton.classList.add("pounce");
  }

  async function requestJSON(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("resposta " + response.status + " de " + url);
    }
    return response.json();
  }

  async function getRandomFox() {
    try {
      const data = await requestJSON(PRIMARY_API);
      if (!data || !data.image) throw new Error("sem imagem na fonte principal");
      return { image: data.image, link: data.link || null };
    } catch (primaryError) {
      const data = await requestJSON(FALLBACK_API);
      if (!data || !data.image) throw new Error("sem imagem na fonte reserva");
      return { image: data.image, link: null };
    }
  }

  function preloadImage(src) {
    return new Promise((resolve, reject) => {
      const probe = new Image();
      probe.onload = () => resolve(src);
      probe.onerror = () => reject(new Error("a imagem não carregou"));
      probe.src = src;
    });
  }

  async function fetchFox() {
    if (isLoading) return;
    isLoading = true;
    fetchButton.disabled = true;
    playPounce();

    foxImage.classList.remove("is-visible");
    //setCardState("loading", "farejando uma raposa por aí…");

    try {
      const fox = await getRandomFox();
      await preloadImage(fox.image);

      foxImage.src = fox.image;
      cardState.hidden = true;
      foxImage.hidden = false;
      // reflow antes de animar a entrada da imagem
      void foxImage.offsetWidth;
      foxImage.classList.add("is-visible");

      foxesFetched += 1;
      foxCount.innerHTML =
        '<span class="tag-paw" aria-hidden="true">&#128062;</span>Nº ' +
        String(foxesFetched).padStart(3, "0");

      if (fox.link) {
        foxLink.href = fox.link;
        foxLink.hidden = false;
      } else {
        foxLink.hidden = true;
      }

      sessionCounter.textContent =
        foxesFetched === 1
          ? "1 raposa encontrada nesta sessão"
          : foxesFetched + " raposas encontradas nesta sessão";

      fetchButtonText.textContent = "Buscar outra raposa";
    } catch (error) {
      foxImage.hidden = true;
      setCardState("error", "essa raposa fugiu — tente buscar outra");
    } finally {
      isLoading = false;
      fetchButton.disabled = false;
    }
  }

  fetchButton.addEventListener("click", fetchFox);
  fetchButton.addEventListener("animationend", () => {
    fetchButton.classList.remove("pounce");
  });

  // busca a primeira raposa assim que a página carrega
  fetchFox();
})();
