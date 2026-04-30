const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getFieldError(field) {
  let error = field.parentElement.querySelector(".field-error");

  if (!error) {
    error = document.createElement("small");
    error.className = "field-error";
    field.parentElement.appendChild(error);
  }

  return error;
}

function clearFieldError(field) {
  field.classList.remove("is-invalid");
  const error = field.parentElement.querySelector(".field-error");

  if (error) {
    error.textContent = "";
  }
}

function showFieldError(field, message) {
  field.classList.add("is-invalid");
  getFieldError(field).textContent = message;
}

function validateForm(form) {
  let isValid = true;
  const requiredFields = form.querySelectorAll("[required]");
  const email = form.querySelector('input[name="email"]');
  const password = form.querySelector('input[name="password"]');
  const confirmPassword = form.querySelector('input[name="confirmPassword"]');

  requiredFields.forEach((field) => {
    clearFieldError(field);

    if (!field.value.trim()) {
      showFieldError(field, "This field is required.");
      isValid = false;
    }
  });

  if (email && email.value.trim() && !emailPattern.test(email.value.trim())) {
    showFieldError(email, "Enter a valid email address.");
    isValid = false;
  }

  if (password && password.value.trim() && password.value.length < 8) {
    showFieldError(password, "Password must be at least 8 characters.");
    isValid = false;
  }

  if (password && confirmPassword && confirmPassword.value && password.value !== confirmPassword.value) {
    showFieldError(confirmPassword, "Passwords do not match.");
    isValid = false;
  }

  return isValid;
}

function setupFormValidation() {
  document.querySelectorAll("form").forEach((form) => {
    if (form.matches("[data-message-form]")) {
      return;
    }

    form.querySelectorAll("input, textarea, select").forEach((field) => {
      field.addEventListener("input", () => clearFieldError(field));
      field.addEventListener("change", () => clearFieldError(field));
    });

    form.addEventListener("submit", (event) => {
      if (!validateForm(form)) {
        event.preventDefault();
      }
    });
  });
}

function setupRating() {
  document.querySelectorAll("[data-rating-group]").forEach((group) => {
    const buttons = group.querySelectorAll("[data-rating-value]");
    const input = group.querySelector('input[name="rating"]');
    const feedback = group.querySelector("[data-rating-feedback]");

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const value = Number(button.dataset.ratingValue);

        if (input) {
          input.value = String(value);
        }

        buttons.forEach((star) => {
          star.classList.toggle("is-active", Number(star.dataset.ratingValue) <= value);
        });

        if (feedback) {
          feedback.textContent = `Thanks. You rated this seller ${value} out of 5.`;
          feedback.className = "form-feedback form-feedback--success";
        }
      });
    });
  });
}

function setupMessaging() {
  const form = document.querySelector("[data-message-form]");
  const thread = document.querySelector("[data-chat-thread]");
  const textarea = form?.querySelector('textarea[name="message"]');
  const feedback = form?.querySelector("[data-form-feedback]");

  document.querySelectorAll("[data-conversation]").forEach((conversation) => {
    conversation.addEventListener("click", () => {
      document.querySelectorAll("[data-conversation]").forEach((item) => item.classList.remove("active"));
      conversation.classList.add("active");

      const title = document.querySelector("[data-chat-title]");
      const name = conversation.querySelector("strong")?.textContent;

      if (title && name) {
        title.textContent = name;
      }
    });
  });

  if (!form || !textarea || !thread) {
    return;
  }

  textarea.addEventListener("input", () => {
    clearFieldError(textarea);
    if (feedback) {
      feedback.textContent = "";
      feedback.className = "form-feedback";
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearFieldError(textarea);

    const message = textarea.value.trim();

    if (!message) {
      showFieldError(textarea, "Message cannot be empty.");
      return;
    }

    const bubble = document.createElement("article");
    bubble.className = "message-bubble message-bubble--outgoing";
    bubble.innerHTML = `<p>${message}</p><span>${new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}</span>`;
    thread.appendChild(bubble);

    textarea.value = "";
    thread.scrollTop = thread.scrollHeight;

    if (feedback) {
      feedback.textContent = "Message sent.";
      feedback.className = "form-feedback form-feedback--success";
    }
  });
}

function setupNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");

  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener("click", () => {
    nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(nav.classList.contains("is-open")));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupFormValidation();
  setupRating();
  setupMessaging();
});
