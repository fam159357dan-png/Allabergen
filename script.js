// Точка подключения формы: вставьте адрес сервиса приёма заявок (например, Formspree или свой сервер).
// Пока адрес пуст — заявки НИКУДА не отправляются, посетителю показывается просьба позвонить.
const FORM_ENDPOINT = "";

const $ = (s) => document.querySelector(s);

// мобильное меню
const burger = $("#burger"), nav = $("#nav");
burger.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  burger.setAttribute("aria-expanded", open);
  burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
});
nav.addEventListener("click", (e) => { if (e.target.tagName === "A") { nav.classList.remove("open"); burger.setAttribute("aria-expanded", false); } });

// появление блоков
const items = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .15 });
  items.forEach((i) => io.observe(i));
} else items.forEach((i) => i.classList.add("in"));

// форма
const form = $("#form"), status = $("#status"), F = form.elements;
const setErr = (id, msg) => { $("#" + id + "-err").textContent = msg; const f = $("#" + id); f.setAttribute("aria-invalid", !!msg); return !msg; };

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
    status.classList.add("bad");
    status.textContent = "Приём заявок с сайта пока не подключён. Пожалуйста, позвоните: +7 707 465-27-26.";
    return;
  }
  try {
    const r = await fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name: F.name.value.trim(), phone: F.phone.value.trim(), time: F.time.value.trim() }) });
    if (!r.ok) throw new Error(r.status);
    form.reset();
    status.classList.add("ok");
    status.textContent = "Спасибо! Заявка отправлена, мы перезвоним вам.";
  } catch {
    status.classList.add("bad");
    status.textContent = "Не удалось отправить заявку. Позвоните: +7 707 465-27-26.";
  }
});
