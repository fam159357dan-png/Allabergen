// Точка подключения формы: вставьте адрес сервиса приёма заявок (например, Formspree или свой сервер).
// Пока адрес пуст, форма открывает WhatsApp центра с готовым сообщением (посетитель сам нажимает «Отправить»).
const FORM_ENDPOINT = "";
const WA = "77074652726";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

// заголовок: каждое слово выезжает отдельно
const h1 = $("#h1");
h1.innerHTML = h1.textContent.trim().split(/\s+/).map((w, i) => `<span class="w"><span style="--d:${i + 1}">${w}</span></span>`).join(" ");

// шапка: уплотняется после начала прокрутки
const header = $("#header");
new IntersectionObserver(([e]) => header.classList.toggle("is-stuck", !e.isIntersecting)).observe($("#top-sentinel"));

// мобильное меню
const burger = $("#burger"), nav = $("#nav");
const setMenu = (open) => {
  nav.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
  burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
};
burger.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
nav.addEventListener("click", (e) => e.target.tagName === "A" && setMenu(false));
addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

// появление блоков: соседние элементы выходят по очереди
const revealItems = $$("[data-reveal], .chips li");
revealItems.forEach((el) => el.style.setProperty("--i", [...el.parentElement.children].filter((c) => c.matches("[data-reveal], .chips li")).indexOf(el)));
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add("in");
  io.unobserve(e.target);
}), { threshold: .12, rootMargin: "0px 0px -6% 0px" });
revealItems.forEach((el) => io.observe(el));

// счётчики
const fmt = (v, dec) => v.toFixed(dec).replace(".", ",");
const cio = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  cio.unobserve(e.target);
  const el = e.target, end = +el.dataset.count, dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || "";
  if (calm) return;
  const t0 = performance.now(), dur = 1600;
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 4);
    el.textContent = fmt(end * k, dec) + suf;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}), { threshold: .6 });
$$("[data-count]").forEach((el) => cio.observe(el));

// услуги: фото меняется вместе с выбранной строкой
const svcItems = $$(".svc__list li"), svcImgs = $$(".svc__media img");
const pickSvc = (li) => {
  svcItems.forEach((x) => x.classList.toggle("is-on", x === li));
  svcImgs.forEach((img) => img.classList.toggle("is-on", img.dataset.key === li.dataset.img));
};
svcItems.forEach((li) => ["pointerenter", "focus", "click"].forEach((ev) => li.addEventListener(ev, () => pickSvc(li))));

// галерея: стрелки, перетаскивание мышью, просмотр фото
const gal = $("#gal"), lightbox = $("#lightbox");
const step = () => (gal.querySelector("figure").offsetWidth + 18) * (innerWidth < 700 ? 1 : 2);
$("#gal-prev").addEventListener("click", () => gal.scrollBy({ left: -step(), behavior: calm ? "auto" : "smooth" }));
$("#gal-next").addEventListener("click", () => gal.scrollBy({ left: step(), behavior: calm ? "auto" : "smooth" }));
let drag = null, moved = 0;
gal.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") { drag = { x: e.clientX, left: gal.scrollLeft }; moved = 0; } });
addEventListener("pointermove", (e) => {
  if (!drag) return;
  moved = Math.abs(e.clientX - drag.x);
  if (moved > 4) { gal.classList.add("is-drag"); gal.scrollLeft = drag.left - (e.clientX - drag.x); }
});
addEventListener("pointerup", () => { drag = null; gal.classList.remove("is-drag"); });
gal.addEventListener("click", (e) => {
  const btn = e.target.closest(".gal__btn");
  if (!btn || moved > 4) return;
  const src = btn.querySelector("img"), big = lightbox.querySelector("img");
  big.src = src.src; big.alt = src.alt;
  lightbox.showModal();
});
lightbox.addEventListener("click", (e) => e.target.tagName !== "IMG" && lightbox.close());

// галерея: когда она появилась на экране, открываем сразу все фото, чтобы при листании не было пустых мест
new IntersectionObserver(([e], o) => {
  if (!e.isIntersecting) return;
  $$("figure", gal).forEach((f) => f.classList.add("in"));
  o.disconnect();
}, { threshold: .15 }).observe(gal);

// нижняя панель на телефоне появляется после первого экрана
const mbar = $("#mbar");
new IntersectionObserver(([e]) => mbar.classList.toggle("show", !e.isIntersecting)).observe($(".hero__btns"));

// заголовки разделов и надпись в подвале: слова и буквы выезжают по очереди
$$("h2[data-reveal]").forEach((h) => { h.innerHTML = h.textContent.trim().split(/\s+/).map((w, i) => `<span class="w"><span style="--k:${i}">${w}</span></span>`).join(" "); });
const mark = $("#mark");
mark.innerHTML = [...mark.textContent].map((c, i) => `<span style="--k:${i}">${c === " " ? "&nbsp;" : c}</span>`).join("");
io.observe(mark);

// видео: карточка с пометкой data-ready показывает свой плеер с файлом из папки videos/.
// Без пометки карточка остаётся ссылкой на ролик в Instagram.
$$(".vcard[data-ready]").forEach((card) => {
  const link = $(".vcard__media", card), v = document.createElement("video");
  Object.assign(v, { src: card.dataset.file, poster: $("img", link).src, controls: true, playsInline: true, preload: "none", className: "vcard__media" });
  link.replaceWith(v);
});

// только для мыши: кнопки тянутся к курсору, фото первого экрана наклоняется, подсветка следует за указателем
if (!calm && matchMedia("(hover: hover) and (pointer: fine)").matches) {
  $$(".btn--lg, .header__cta").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty("--mx", ((e.clientX - r.left) / r.width - .5) * 14 + "px");
      b.style.setProperty("--my", ((e.clientY - r.top) / r.height - .5) * 10 + "px");
    });
    b.addEventListener("pointerleave", () => { b.style.setProperty("--mx", "0px"); b.style.setProperty("--my", "0px"); });
  });
  const photo = $(".hero__photo");
  photo.addEventListener("pointermove", (e) => {
    const r = photo.getBoundingClientRect();
    photo.style.setProperty("--ry", ((e.clientX - r.left) / r.width - .5) * 7 + "deg");
    photo.style.setProperty("--rx", (.5 - (e.clientY - r.top) / r.height) * 7 + "deg");
  });
  photo.addEventListener("pointerleave", () => { photo.style.setProperty("--rx", "0deg"); photo.style.setProperty("--ry", "0deg"); });
  $$(".spec__card, .form").forEach((el) => el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--sx", e.clientX - r.left + "px");
    el.style.setProperty("--sy", e.clientY - r.top + "px");
  }));
}

// форма
const form = $("#form"), status = $("#status"), F = form.elements;
const setErr = (id, msg) => { $("#" + id + "-err").textContent = msg; $("#" + id).setAttribute("aria-invalid", !!msg); return !msg; };

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  status.className = "form__status"; status.textContent = "";
  const digits = F.phone.value.replace(/\D/g, "");
  const ok = [
    setErr("name", F.name.value.trim().length >= 2 ? "" : "Введите имя (минимум 2 символа)."),
    setErr("phone", digits.length >= 10 && digits.length <= 12 ? "" : "Введите телефон полностью, например +7 707 123-45-67."),
    setErr("agree", F.agree.checked ? "" : "Нужно согласие на обработку данных."),
  ].every(Boolean);
  if (!ok) { form.querySelector("[aria-invalid=true]").focus(); return; }

  if (!FORM_ENDPOINT) {
    const text = `Здравствуйте! Хочу записаться. Имя: ${F.name.value.trim()}. Телефон: ${F.phone.value.trim()}.` +
      (F.service.value ? ` Интересует: ${F.service.value}.` : "") + (F.time.value.trim() ? ` Удобное время: ${F.time.value.trim()}.` : "");
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    status.classList.add("ok");
    status.textContent = "Открыли WhatsApp с готовым сообщением. Нажмите там «Отправить» или позвоните: +7 707 465-27-26.";
    return;
  }
  try {
    const r = await fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name: F.name.value.trim(), phone: F.phone.value.trim(), service: F.service.value, time: F.time.value.trim() }) });
    if (!r.ok) throw new Error(r.status);
    form.reset();
    status.classList.add("ok");
    status.textContent = "Спасибо! Заявка отправлена, мы перезвоним вам.";
  } catch {
    status.classList.add("bad");
    status.textContent = "Не удалось отправить заявку. Позвоните: +7 707 465-27-26.";
  }
});

// отзывы едут сами: дублируем карточки, чтобы лента замыкалась без шва
$$(".rv__row").forEach((row) => [...row.children].forEach((li) => {
  const copy = li.cloneNode(true);
  copy.setAttribute("aria-hidden", "true");
  row.append(copy);
}));

// позвоночник-навигатор: каждый позвонок ведёт к разделу, изгиб выпрямляется по мере прокрутки
const spine = $("#spine");
const parts = [["top", "Начало"], ["services", "Услуги"], ["course", "Курс"], ["help", "С чем приходят"], ["center", "Центр"], ["specialist", "Специалист"],
  ["history", "Путь центра"], ["steps", "Приём"], ["video", "Видео"], ["reviews", "Отзывы"], ["faq", "Вопросы"], ["booking", "Запись"], ["contacts", "Контакты"]];
spine.innerHTML = parts.map(([id, label], i) =>
  `<a href="#${id}" style="--off:${(Math.sin(i / (parts.length - 1) * Math.PI * 2) * 13).toFixed(1)}"><span>${label}</span></a>`).join("");
const vertebrae = $$("a", spine);
const sio = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) vertebrae.forEach((a) => a.classList.toggle("is-on", a.getAttribute("href") === "#" + e.target.id));
}), { rootMargin: "-45% 0px -50% 0px" });
parts.forEach(([id]) => sio.observe(document.getElementById(id)));
