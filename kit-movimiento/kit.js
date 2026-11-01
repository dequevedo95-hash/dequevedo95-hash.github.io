/* ============================================================
   KIT DE COMPONENTES — comportamiento (JS ligero, sin librerías)
   - Barra de navegación con fondo al bajar
   - Animación de entrada (reveal) al hacer scroll
   - Galería con flechas y contador
   - Selector de idioma ES/EN con data-es / data-en
   - Movimiento editorial: titular con máscara, grupos en
     cascada, cifras que cuentan, fondo que se acerca al
     hacer scroll y botón magnético (solo puntero fino)
   - Video del hero: se pausa fuera de pantalla y con
     «reducir movimiento» o ahorro de datos activado
   ============================================================ */
(function () {
  "use strict";
  var reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* — Navegación con fondo al bajar — */
  var nav = document.querySelector(".k-nav");
  if (nav) {
    var alBajar = function () { nav.classList.toggle("con-fondo", window.scrollY > 40); };
    window.addEventListener("scroll", alBajar, { passive: true });
    alBajar();
  }

  /* — Reveal al hacer scroll — */
  var revelables = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reducirMovimiento) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revelables.forEach(function (el) { obs.observe(el); });
  } else {
    revelables.forEach(function (el) { el.classList.add("visible"); });
  }

  /* — Galería con flechas y contador — */
  document.querySelectorAll(".k-gallery").forEach(function (galeria) {
    var slides = Array.prototype.slice.call(galeria.querySelectorAll(".slide"));
    var contador = galeria.querySelector(".contador");
    var indice = 0;
    if (!slides.length) return;
    function mostrar(n) {
      indice = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle("activo", i === indice); });
      if (contador) contador.textContent = (indice + 1) + " / " + slides.length;
    }
    var antes = galeria.querySelector(".antes");
    var despues = galeria.querySelector(".despues");
    if (antes) antes.addEventListener("click", function () { mostrar(indice - 1); });
    if (despues) despues.addEventListener("click", function () { mostrar(indice + 1); });
    mostrar(0);
  });

  /* — Idioma ES/EN —
     Uso: <span data-es="Servicios" data-en="Services"></span>
     y botones .k-lang button[data-lang="es"|"en"]            */
  var botonesLang = document.querySelectorAll(".k-lang button");
  function idioma(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-es][data-en]").forEach(function (el) {
      el.textContent = lang === "en" ? el.getAttribute("data-en") : el.getAttribute("data-es");
    });
    botonesLang.forEach(function (b) {
      var activo = b.getAttribute("data-lang") === lang;
      b.classList.toggle("activo", activo);
      b.setAttribute("aria-pressed", activo ? "true" : "false");
    });
    try { localStorage.setItem("kit-idioma", lang); } catch (e) {}
  }
  if (botonesLang.length) {
    botonesLang.forEach(function (b) {
      b.addEventListener("click", function () { idioma(b.getAttribute("data-lang")); });
    });
    var guardado = "es";
    try { guardado = localStorage.getItem("kit-idioma") || "es"; } catch (e) {}
    idioma(guardado);
  }

  /* — Video del hero —
     En el iPhone, el Modo de bajo consumo bloquea el autoplay:
     si el video no arranca, queda visible la imagen «poster». */
  var video = document.querySelector(".k-hero video.fondo");
  if (video) {
    var conexion = navigator.connection || {};
    if (reducirMovimiento || conexion.saveData) {
      video.removeAttribute("autoplay");
      video.pause();
    } else if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) { video.play().catch(function () {}); }
          else { video.pause(); }
        });
      }, { threshold: 0.15 }).observe(video);
    }
  }

  /* — Movimiento editorial: titular con máscara y grupos en
     cascada. El CSS pone el estado inicial y el escalonado;
     aquí solo se marca .visible al entrar en pantalla.       */
  var bloquesMov = document.querySelectorAll(".k-titular, .k-cascada");
  if (bloquesMov.length) {
    if ("IntersectionObserver" in window && !reducirMovimiento) {
      var obsMov = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("visible"); obsMov.unobserve(e.target); }
        });
      }, { threshold: 0.2 });
      bloquesMov.forEach(function (el) { obsMov.observe(el); });
    } else {
      bloquesMov.forEach(function (el) { el.classList.add("visible"); });
    }
  }

  /* — Cifras que cuentan al entrar en pantalla — */
  document.querySelectorAll(".k-cifras").forEach(function (grupo) {
    var numeros = grupo.querySelectorAll(".num[data-contar]");
    if (!numeros.length) return;
    function contar(el) {
      var meta = parseFloat(el.getAttribute("data-contar")) || 0;
      var sufijo = el.getAttribute("data-sufijo") || "";
      if (reducirMovimiento) { el.textContent = meta + sufijo; return; }
      var t0 = null, duracion = 1500;
      function paso(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / duracion, 1);
        var suave = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(meta * suave) + sufijo;
        if (p < 1) requestAnimationFrame(paso);
      }
      requestAnimationFrame(paso);
    }
    if ("IntersectionObserver" in window && !reducirMovimiento) {
      var obsCifras = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) { numeros.forEach(contar); obsCifras.disconnect(); }
        });
      }, { threshold: 0.35 });
      obsCifras.observe(grupo);
    } else {
      numeros.forEach(contar);
    }
  });

  /* — Fondo que se acerca al hacer scroll (.k-zoom) —
     Escala el .fondo (o la img) de 1 a ~1.14 según la zona
     atraviesa la pantalla; solo actúa cerca del viewport.   */
  var zooms = document.querySelectorAll(".k-zoom");
  if (zooms.length && !reducirMovimiento) {
    var fondosZoom = [];
    zooms.forEach(function (z) {
      var f = z.querySelector(".fondo, img");
      if (f) fondosZoom.push({ caja: z, fondo: f });
    });
    var zoomPendiente = false;
    var acercar = function () {
      zoomPendiente = false;
      var vh = window.innerHeight;
      fondosZoom.forEach(function (o) {
        var r = o.caja.getBoundingClientRect();
        if (r.bottom < -120 || r.top > vh + 120) return;
        var p = (vh - r.top) / (vh + r.height);
        p = Math.max(0, Math.min(1, p));
        o.fondo.style.transform = "scale(" + (1 + p * 0.14).toFixed(4) + ")";
      });
    };
    window.addEventListener("scroll", function () {
      if (!zoomPendiente) { zoomPendiente = true; requestAnimationFrame(acercar); }
    }, { passive: true });
    window.addEventListener("resize", acercar);
    acercar();
  }

  /* — Botón magnético: sigue un poco el cursor —
     Solo puntero fino (ratón/trackpad); en táctil no actúa. */
  if (!reducirMovimiento && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".k-magnetico").forEach(function (btn) {
      btn.addEventListener("mousemove", function (ev) {
        var r = btn.getBoundingClientRect();
        var x = ev.clientX - r.left - r.width / 2;
        var y = ev.clientY - r.top - r.height / 2;
        btn.style.transition = "transform .12s ease-out";
        btn.style.transform = "translate(" + (x * 0.22).toFixed(1) + "px," + (y * 0.3).toFixed(1) + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transition = "transform .45s cubic-bezier(.22,.8,.3,1)";
        btn.style.transform = "";
      });
    });
  }

  /* — Año automático en el pie — */
  document.querySelectorAll("[data-anio]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
