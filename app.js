document.getElementById("year").textContent = new Date().getFullYear();

const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", isOpen);
});
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .15 });
  revealEls.forEach((element) => observer.observe(element));
} else {
  revealEls.forEach((element) => element.classList.add("is-visible"));
}

const weatherButton = document.getElementById("weatherButton");
const weatherStatus = document.getElementById("weatherStatus");
const weatherReading = document.getElementById("weatherReading");
const weatherEmoji = document.getElementById("weatherEmoji");
const weatherTemp = document.getElementById("weatherTemp");
const weatherCondition = document.getElementById("weatherCondition");

const weatherDetails = (code, isDay) => {
  if (code === 0) return { emoji: isDay ? "☀️" : "🌙", label: "Clear sky" };
  if ([1, 2].includes(code)) return { emoji: isDay ? "🌤️" : "☁️", label: "Partly cloudy" };
  if (code === 3) return { emoji: "☁️", label: "Overcast" };
  if ([45, 48].includes(code)) return { emoji: "🌫️", label: "Foggy" };
  if ([51, 53, 55, 56, 57].includes(code)) return { emoji: "🌦️", label: "Drizzle" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { emoji: "🌧️", label: "Rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { emoji: "🌨️", label: "Snow" };
  if ([95, 96, 99].includes(code)) return { emoji: "⛈️", label: "Thunderstorm" };
  return { emoji: "🌡️", label: "Current conditions" };
};

const showWeatherError = (message) => {
  weatherStatus.textContent = message;
  weatherButton.disabled = false;
  weatherButton.textContent = "Try again";
};

weatherButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showWeatherError("Location is not supported by this browser.");
    return;
  }

  weatherButton.disabled = true;
  weatherButton.textContent = "Finding you...";
  weatherStatus.textContent = "Waiting for location permission...";

  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    weatherStatus.textContent = "Checking the sky...";
    try {
      const query = new URLSearchParams({
        latitude: coords.latitude.toFixed(4),
        longitude: coords.longitude.toFixed(4),
        current: "temperature_2m,weather_code,is_day",
        temperature_unit: "fahrenheit"
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`);
      if (!response.ok) throw new Error("Weather service unavailable");
      const data = await response.json();
      if (!data.current) throw new Error("Weather data unavailable");

      const details = weatherDetails(data.current.weather_code, data.current.is_day === 1);
      weatherEmoji.textContent = details.emoji;
      weatherEmoji.setAttribute("aria-label", details.label);
      weatherTemp.textContent = `${Math.round(data.current.temperature_2m)}°F`;
      weatherCondition.textContent = details.label;
      weatherStatus.textContent = "Current conditions near you";
      weatherReading.classList.add("is-visible");
      weatherReading.setAttribute("aria-hidden", "false");
      weatherButton.hidden = true;
    } catch (error) {
      showWeatherError("The weather could not be loaded right now.");
    }
  }, (error) => {
    const message = error.code === error.PERMISSION_DENIED
      ? "Location access was declined. You can enable it in your browser settings."
      : "Your location could not be found. Please try again.";
    showWeatherError(message);
  }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
});
