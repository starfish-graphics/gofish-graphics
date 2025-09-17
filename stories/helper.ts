export const initializeContainer = () => {
  const container = document.createElement("div");
  container.style.margin = "20px";
  document.body.appendChild(container);

  return container;
};
