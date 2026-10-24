// Menü auf dem Handy auf- und zuklappen.
(function () {
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("nav");
  if (!btn || !nav) return;
  btn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.textContent = open ? "Schließen" : "Menü";
  });
})();

// Kein Kontextmenü („Bild speichern“) auf dem Porträtfoto.
document.querySelectorAll(".protected").forEach(function (el) {
  el.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  el.addEventListener("dragstart", function (e) { e.preventDefault(); });
});
