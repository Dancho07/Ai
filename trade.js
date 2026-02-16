if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    if (window.AppCore?.initTradePage) {
      window.AppCore.initTradePage();
    }
  });
}
