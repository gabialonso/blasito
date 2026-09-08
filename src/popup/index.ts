document.querySelector<HTMLButtonElement>("#open-options")?.addEventListener("click", () => {
  void chrome.runtime.openOptionsPage();
});
