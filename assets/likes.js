// „Gefällt mir“ für Bilder im Kopf.
// Ob Sie ein Bild markiert haben, merkt sich nur Ihr Browser (localStorage) –
// damit derselbe Klick nicht doppelt zählt. Zum Server geht nur die Bild-Kennung.
(function () {
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.like-btn[data-id]'));
  if (!buttons.length || !window.fetch) return;

  var KEY = 'bik-gefaellt';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }
  var liked = load();

  function render(btn, count) {
    var on = liked.indexOf(btn.dataset.id) > -1;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (typeof count === 'number') {
      btn.querySelector('.like-count').textContent = count;
      btn.setAttribute('aria-label', (on ? 'Gefällt mir nicht mehr' : 'Gefällt mir') + ', ' + count + (count === 1 ? ' Person' : ' Personen'));
    }
  }

  var ids = buttons.map(function (b) { return b.dataset.id; });
  fetch('/api/likes?ids=' + encodeURIComponent(ids.join(',')))
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (counts) {
      buttons.forEach(function (btn) {
        btn.hidden = false;
        render(btn, counts[btn.dataset.id] || 0);
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var id = btn.dataset.id, on = liked.indexOf(id) > -1;
          var countEl = btn.querySelector('.like-count');
          var n = parseInt(countEl.textContent, 10) || 0;
          liked = on ? liked.filter(function (x) { return x !== id; }) : liked.concat(id);
          save(liked);
          render(btn, Math.max(0, n + (on ? -1 : 1)));
          btn.disabled = true;
          fetch('/api/likes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, action: on ? 'unlike' : 'like' })
          })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (d) { if (d) render(btn, d.count); })
            .catch(function () {})
            .then(function () { btn.disabled = false; });
        });
      });
    })
    .catch(function () { /* Zähler nicht erreichbar: Knöpfe bleiben ausgeblendet */ });
})();
