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

// нижняя панель на телефоне появляется после первого экрана
const mbar = $("#mbar");
new IntersectionObserver(([e]) => mbar.classList.toggle("show", !e.isIntersecting)).observe($(".hero__btns"));

// видео Instagram: подгружаем только по клику
$$(".vid").forEach((v) => $("button", v).addEventListener("click", () => {
  const f = document.createElement("iframe");
  f.src = v.dataset.src; f.title = "Видео из Instagram"; f.allowFullscreen = true; f.loading = "lazy";
  v.replaceChildren(f);
}));

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
