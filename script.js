(() => {
  "use strict";

  const CART_KEY = "malhionete-cart";
  let cart = readCart();
  let previousFocus = null;
  let toastTimer;

  function readCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(saved) ? saved.filter(item =>
        item && typeof item.id === "string" &&
        typeof item.name === "string" &&
        Number.isFinite(Number(item.price)) &&
        Number.isFinite(Number(item.qty)) && Number(item.qty) > 0
      ).map(item => ({...item, price: Number(item.price), qty: Math.floor(Number(item.qty))})) : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCart();
  }

  function money(value) {
    return Number(value).toLocaleString("pt-BR", {style: "currency", currency: "BRL"});
  }

  function totalItems() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }

  function renderCart() {
    document.querySelectorAll("[data-cart-count]").forEach(el => el.textContent = totalItems());
    const itemsContainer = document.querySelector("[data-cart-items]");
    const emptyMessage = document.querySelector("[data-cart-empty]");
    const totalElement = document.querySelector("[data-cart-total]");
    if (!itemsContainer || !emptyMessage || !totalElement) return;

    itemsContainer.innerHTML = "";
    emptyMessage.hidden = cart.length > 0;

    cart.forEach(item => {
      const row = document.createElement("article");
      row.className = "cart-row";

      const details = document.createElement("div");
      const name = document.createElement("h3");
      name.textContent = item.name;
      const unit = document.createElement("p");
      unit.textContent = `${money(item.price)} cada`;
      details.append(name, unit);

      const side = document.createElement("div");
      side.className = "cart-row-side";
      const subtotal = document.createElement("strong");
      subtotal.textContent = money(item.price * item.qty);

      const controls = document.createElement("div");
      controls.className = "quantity-controls";
      controls.setAttribute("aria-label", `Quantidade de ${item.name}`);

      const minus = document.createElement("button");
      minus.type = "button";
      minus.textContent = "−";
      minus.setAttribute("aria-label", `Diminuir quantidade de ${item.name}`);
      minus.addEventListener("click", () => changeQuantity(item.id, -1));

      const quantity = document.createElement("span");
      quantity.textContent = item.qty;

      const plus = document.createElement("button");
      plus.type = "button";
      plus.textContent = "+";
      plus.setAttribute("aria-label", `Aumentar quantidade de ${item.name}`);
      plus.addEventListener("click", () => changeQuantity(item.id, 1));

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-item";
      remove.textContent = "Remover";
      remove.addEventListener("click", () => removeItem(item.id));

      controls.append(minus, quantity, plus);
      side.append(subtotal, controls, remove);
      row.append(details, side);
      itemsContainer.append(row);
    });

    totalElement.textContent = money(cart.reduce((sum, item) => sum + item.price * item.qty, 0));
  }

  function changeQuantity(id, delta) {
    const item = cart.find(product => product.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(product => product.id !== id);
    saveCart();
  }

  function removeItem(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    showToast("Produto removido do carrinho.");
  }

  function showToast(message) {
    const toast = document.querySelector("[data-toast]");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function openCart() {
    const modal = document.querySelector("[data-cart-modal]");
    if (!modal) return;
    previousFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    modal.querySelector("[data-close-cart]")?.focus();
  }

  function closeCart() {
    const modal = document.querySelector("[data-cart-modal]");
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    previousFocus?.focus();
  }

  document.querySelectorAll("[data-add]").forEach(button => {
    button.addEventListener("click", () => {
      const {id, name, price} = button.dataset;
      const existing = cart.find(item => item.id === id);
      if (existing) existing.qty += 1;
      else cart.push({id, name, price: Number(price), qty: 1});
      saveCart();
      showToast(`${name} adicionado ao carrinho!`);
    });
  });

  document.querySelectorAll("[data-open-cart]").forEach(button => button.addEventListener("click", openCart));
  document.querySelectorAll("[data-close-cart]").forEach(button => button.addEventListener("click", closeCart));
  document.querySelectorAll("[data-cart-modal]").forEach(modal => {
    modal.addEventListener("click", event => {
      if (event.target === modal) closeCart();
    });
  });

  document.addEventListener("keydown", event => {
    const modal = document.querySelector("[data-cart-modal]");
    if (event.key === "Escape" && modal && !modal.hidden) closeCart();
    if (event.key === "Tab" && modal && !modal.hidden) {
      const focusable = [...modal.querySelectorAll('button:not([disabled]), a[href], input:not([disabled])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  });

  document.querySelectorAll("[data-accessibility]").forEach(button => {
    const enabled = document.body.classList.contains("high-contrast");
    button.setAttribute("aria-pressed", String(enabled));
    button.addEventListener("click", () => {
      const active = document.body.classList.toggle("high-contrast");
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", active ? "Desativar alto contraste" : "Ativar alto contraste");
      showToast(active ? "Alto contraste ativado." : "Alto contraste desativado.");
    });
  });

  document.querySelectorAll("[data-checkout]").forEach(button => {
    button.addEventListener("click", () => {
      if (!cart.length) {
        showToast("Adicione algum produto antes de continuar.");
        return;
      }
      showToast("Carrinho pronto! Integre aqui seu canal de pedidos.");
    });
  });

  renderCart();
})();