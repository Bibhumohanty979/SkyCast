/* =========================================================
   SKYCAST - COMPLETE SCRIPT.JS
   Weather Data: Open-Meteo
   No API Key Required
========================================================= */


/* =========================================================
   DOM ELEMENTS
========================================================= */

const searchForm =
    document.getElementById("searchForm");

const cityInput =
    document.getElementById("cityInput");

const clearSearchBtn =
    document.getElementById("clearSearchBtn");

const heroSearchForm =
    document.getElementById("heroSearchForm");

const heroCityInput =
    document.getElementById("heroCityInput");

const locationBtn =
    document.getElementById("locationBtn");

const heroLocationBtn =
    document.getElementById("heroLocationBtn");

const unitBtn =
    document.getElementById("unitBtn");

const unitText =
    document.getElementById("unitText");

const themeBtn =
    document.getElementById("themeBtn");

const themeIcon =
    document.getElementById("themeIcon");


const welcomeSection =
    document.getElementById("welcomeSection");

const loadingState =
    document.getElementById("loadingState");

const errorState =
    document.getElementById("errorState");

const weatherDashboard =
    document.getElementById("weatherDashboard");

const errorMessage =
    document.getElementById("errorMessage");

const tryAgainBtn =
    document.getElementById("tryAgainBtn");


const locationName =
    document.getElementById("locationName");

const locationDetails =
    document.getElementById("locationDetails");

const localTime =
    document.getElementById("localTime");

const currentDate =
    document.getElementById("currentDate");

const weatherDescription =
    document.getElementById("weatherDescription");

const currentWeatherIcon =
    document.getElementById("currentWeatherIcon");

const currentTemperature =
    document.getElementById("currentTemperature");

const feelsLike =
    document.getElementById("feelsLike");

const todayHigh =
    document.getElementById("todayHigh");

const todayLow =
    document.getElementById("todayLow");

const humidity =
    document.getElementById("humidity");

const windSpeed =
    document.getElementById("windSpeed");

const visibility =
    document.getElementById("visibility");

const pressure =
    document.getElementById("pressure");

const sunrise =
    document.getElementById("sunrise");

const sunset =
    document.getElementById("sunset");


const hourlyForecast =
    document.getElementById("hourlyForecast");

const dailyForecast =
    document.getElementById("dailyForecast");


const recentSection =
    document.getElementById("recentSection");

const recentSearches =
    document.getElementById("recentSearches");

const clearRecentBtn =
    document.getElementById("clearRecentBtn");


const toast =
    document.getElementById("toast");

const toastIcon =
    document.getElementById("toastIcon");

const toastTitle =
    document.getElementById("toastTitle");

const toastMessage =
    document.getElementById("toastMessage");


/* =========================================================
   APP STATE
========================================================= */

let currentUnit =
    localStorage.getItem("skycast-unit") || "celsius";

let currentLocationData = null;

let lastWeatherData = null;

let recentCities =
    JSON.parse(
        localStorage.getItem("skycast-recent")
    ) || [];


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        document.getElementById(
            "currentYear"
        ).textContent =
            new Date().getFullYear();

        initializeTheme();

        updateUnitButton();

        renderRecentSearches();

    }
);


/* =========================================================
   SEARCH EVENTS
========================================================= */

searchForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const city =
            cityInput.value.trim();

        if (!city) {

            showToast(
                "Enter a city",
                "Please type a city name first.",
                "error"
            );

            return;

        }

        searchCity(city);

    }
);


heroSearchForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const city =
            heroCityInput.value.trim();

        if (!city) {

            showToast(
                "Enter a city",
                "Please type a city name first.",
                "error"
            );

            return;

        }

        cityInput.value = city;

        searchCity(city);

    }
);


/* =========================================================
   SEARCH INPUT
========================================================= */

cityInput.addEventListener(
    "input",
    () => {

        clearSearchBtn.classList.toggle(
            "show",
            cityInput.value.length > 0
        );

    }
);


clearSearchBtn.addEventListener(
    "click",
    () => {

        cityInput.value = "";

        clearSearchBtn.classList.remove("show");

        cityInput.focus();

    }
);


/* =========================================================
   CITY SEARCH
========================================================= */

async function searchCity(city) {

    showLoading();

    try {

        const url =
            `https://geocoding-api.open-meteo.com/v1/search` +
            `?name=${encodeURIComponent(city)}` +
            `&count=1` +
            `&language=en` +
            `&format=json`;

        const response =
            await fetch(url);

        if (!response.ok) {

            throw new Error(
                "Unable to connect to the location service."
            );

        }

        const data =
            await response.json();

        if (
            !data.results ||
            data.results.length === 0
        ) {

            throw new Error(
                `We couldn't find "${city}". Please check the spelling and try again.`
            );

        }

        const place =
            data.results[0];

        currentLocationData = {

            name:
                place.name,

            admin:
                place.admin1 || "",

            country:
                place.country || "",

            latitude:
                place.latitude,

            longitude:
                place.longitude

        };

        await fetchWeather(
            currentLocationData
        );

        addRecentCity(
            currentLocationData.name
        );

    }
    catch (error) {

        showError(error.message);

    }

}


/* =========================================================
   CURRENT LOCATION
========================================================= */

locationBtn.addEventListener(
    "click",
    useCurrentLocation
);

heroLocationBtn.addEventListener(
    "click",
    useCurrentLocation
);


function useCurrentLocation() {

    if (!navigator.geolocation) {

        showError(
            "Geolocation is not supported by your browser."
        );

        return;

    }

    showLoading();

    navigator.geolocation.getCurrentPosition(

        async position => {

            try {

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;


                const place =
                    await reverseGeocode(
                        latitude,
                        longitude
                    );


                currentLocationData = {

                    name:
                        place.name ||
                        "Current Location",

                    admin:
                        place.admin || "",

                    country:
                        place.country || "",

                    latitude,

                    longitude

                };


                await fetchWeather(
                    currentLocationData
                );

            }
            catch (error) {

                showError(
                    "We found your location but couldn't load the weather."
                );

            }

        },

        error => {

            let message =
                "Unable to access your location.";

            if (
                error.code ===
                error.PERMISSION_DENIED
            ) {

                message =
                    "Location permission was denied. Please allow location access or search for a city.";

            }

            showError(message);

        },

        {

            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 300000

        }

    );

}


/* =========================================================
   REVERSE GEOCODING
========================================================= */

async function reverseGeocode(
    latitude,
    longitude
) {

    /*
       Open-Meteo geocoding is primarily name-based,
       so we use BigDataCloud's free client-side
       reverse-geocoding endpoint for the display name.

       If it fails, weather still works and
       "Current Location" is displayed.
    */

    try {

        const url =
            `https://api.bigdatacloud.net/data/reverse-geocode-client` +
            `?latitude=${latitude}` +
            `&longitude=${longitude}` +
            `&localityLanguage=en`;

        const response =
            await fetch(url);

        if (!response.ok) {

            throw new Error();

        }

        const data =
            await response.json();

        return {

            name:
                data.city ||
                data.locality ||
                data.principalSubdivision ||
                "Current Location",

            admin:
                data.principalSubdivision || "",

            country:
                data.countryName || ""

        };

    }
    catch {

        return {

            name:
                "Current Location",

            admin:
                "",

            country:
                ""

        };

    }

}


/* =========================================================
   FETCH WEATHER
========================================================= */

async function fetchWeather(location) {

    try {

        const temperatureUnit =
            currentUnit === "fahrenheit"
                ? "fahrenheit"
                : "celsius";

        const windUnit =
            "kmh";


        const url =
            `https://api.open-meteo.com/v1/forecast` +

            `?latitude=${location.latitude}` +

            `&longitude=${location.longitude}` +

            `&current=` +
            `temperature_2m,` +
            `relative_humidity_2m,` +
            `apparent_temperature,` +
            `is_day,` +
            `precipitation,` +
            `weather_code,` +
            `surface_pressure,` +
            `wind_speed_10m` +

            `&hourly=` +
            `temperature_2m,` +
            `precipitation_probability,` +
            `weather_code,` +
            `visibility` +

            `&daily=` +
            `weather_code,` +
            `temperature_2m_max,` +
            `temperature_2m_min,` +
            `sunrise,` +
            `sunset,` +
            `precipitation_probability_max` +

            `&temperature_unit=${temperatureUnit}` +

            `&wind_speed_unit=${windUnit}` +

            `&timezone=auto` +

            `&forecast_days=7`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Unable to load weather data."
            );

        }


        const data =
            await response.json();


        lastWeatherData = data;


        renderWeather(
            data,
            location
        );


        showDashboard();


        showToast(
            "Weather updated",
            `Latest forecast for ${location.name}.`
        );

    }
    catch (error) {

        showError(
            error.message ||
            "Unable to load weather data."
        );

    }

}


/* =========================================================
   RENDER WEATHER
========================================================= */

function renderWeather(
    data,
    location
) {

    const current =
        data.current;

    const daily =
        data.daily;


    const weatherInfo =
        getWeatherInfo(
            current.weather_code,
            current.is_day
        );


    locationName.textContent =
        location.name;


    const details = [

        location.admin,

        location.country

    ]
    .filter(Boolean)
    .join(", ");


    locationDetails.textContent =
        details ||
        `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;


    currentDate.textContent =
        formatCurrentDate();


    weatherDescription.textContent =
        weatherInfo.description;


    currentWeatherIcon.textContent =
        weatherInfo.icon;


    currentTemperature.textContent =
        formatTemperature(
            current.temperature_2m
        );


    feelsLike.textContent =
        formatTemperature(
            current.apparent_temperature
        );


    todayHigh.textContent =
        formatTemperature(
            daily.temperature_2m_max[0]
        );


    todayLow.textContent =
        formatTemperature(
            daily.temperature_2m_min[0]
        );


    humidity.textContent =
        `${Math.round(
            current.relative_humidity_2m
        )}%`;


    windSpeed.textContent =
        `${Math.round(
            current.wind_speed_10m
        )} km/h`;


    pressure.textContent =
        `${Math.round(
            current.surface_pressure
        )} hPa`;


    sunrise.textContent =
        formatTime(
            daily.sunrise[0]
        );


    sunset.textContent =
        formatTime(
            daily.sunset[0]
        );


    visibility.textContent =
        getCurrentVisibility(
            data
        );


    localTime.textContent =
        getLocationTime(
            data.utc_offset_seconds
        );


    renderHourlyForecast(data);

    renderDailyForecast(data);

}


/* =========================================================
   CURRENT VISIBILITY
========================================================= */

function getCurrentVisibility(data) {

    if (
        !data.hourly ||
        !data.hourly.time ||
        !data.hourly.visibility
    ) {

        return "-- km";

    }


    const currentTime =
        new Date(
            data.current.time
        ).getTime();


    let closestIndex = 0;

    let smallestDifference =
        Infinity;


    data.hourly.time.forEach(
        (time, index) => {

            const difference =
                Math.abs(
                    new Date(time).getTime() -
                    currentTime
                );

            if (
                difference <
                smallestDifference
            ) {

                smallestDifference =
                    difference;

                closestIndex =
                    index;

            }

        }
    );


    const meters =
        data.hourly.visibility[
            closestIndex
        ];


    if (
        meters === null ||
        meters === undefined
    ) {

        return "-- km";

    }


    return `${(
        meters / 1000
    ).toFixed(1)} km`;

}


/* =========================================================
   HOURLY FORECAST
========================================================= */

function renderHourlyForecast(data) {

    hourlyForecast.innerHTML = "";


    const times =
        data.hourly.time;

    const temperatures =
        data.hourly.temperature_2m;

    const weatherCodes =
        data.hourly.weather_code;

    const rain =
        data.hourly.precipitation_probability;


    const currentTime =
        new Date(
            data.current.time
        );


    let startIndex =
        times.findIndex(
            time =>
                new Date(time) >=
                currentTime
        );


    if (startIndex === -1) {

        startIndex = 0;

    }


    const endIndex =
        Math.min(
            startIndex + 8,
            times.length
        );


    for (
        let i = startIndex;
        i < endIndex;
        i++
    ) {

        const weather =
            getWeatherInfo(
                weatherCodes[i],
                true
            );


        const card =
            document.createElement(
                "article"
            );


        card.className =
            `hour-card ${
                i === startIndex
                    ? "current"
                    : ""
            }`;


        card.innerHTML = `

            <span class="hour-time">

                ${
                    i === startIndex
                        ? "Now"
                        : formatHour(
                            times[i]
                        )
                }

            </span>

            <div class="hour-icon">

                ${weather.icon}

            </div>

            <strong class="hour-temp">

                ${formatTemperature(
                    temperatures[i]
                )}

            </strong>

            <span class="hour-rain">

                <i class="fa-solid fa-droplet"></i>

                ${
                    rain[i] ?? 0
                }%

            </span>

        `;


        hourlyForecast.appendChild(
            card
        );

    }

}


/* =========================================================
   DAILY FORECAST
========================================================= */

function renderDailyForecast(data) {

    dailyForecast.innerHTML = "";


    data.daily.time.forEach(
        (date, index) => {

            const weather =
                getWeatherInfo(
                    data.daily.weather_code[
                        index
                    ],
                    true
                );


            const dateObject =
                new Date(
                    `${date}T12:00:00`
                );


            const dayName =
                index === 0
                    ? "Today"
                    : dateObject.toLocaleDateString(
                        "en-US",
                        {
                            weekday:
                                "short"
                        }
                    );


            const formattedDate =
                dateObject.toLocaleDateString(
                    "en-US",
                    {
                        month:
                            "short",

                        day:
                            "numeric"
                    }
                );


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "day-card";


            card.innerHTML = `

                <span class="day-name">

                    ${dayName}

                </span>

                <span class="day-date">

                    ${formattedDate}

                </span>

                <div class="day-icon">

                    ${weather.icon}

                </div>

                <p class="day-description">

                    ${weather.description}

                </p>

                <div class="day-temperature">

                    <span class="day-high">

                        ${formatTemperature(
                            data.daily
                                .temperature_2m_max[
                                    index
                                ]
                        )}

                    </span>

                    <span class="day-low">

                        ${formatTemperature(
                            data.daily
                                .temperature_2m_min[
                                    index
                                ]
                        )}

                    </span>

                </div>

            `;


            dailyForecast.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   WEATHER CODE MAPPING
========================================================= */

function getWeatherInfo(
    code,
    isDay = true
) {

    const weatherMap = {

        0: {
            description:
                "Clear Sky",

            dayIcon:
                "☀️",

            nightIcon:
                "🌙"
        },

        1: {
            description:
                "Mainly Clear",

            dayIcon:
                "🌤️",

            nightIcon:
                "🌙"
        },

        2: {
            description:
                "Partly Cloudy",

            dayIcon:
                "⛅",

            nightIcon:
                "☁️"
        },

        3: {
            description:
                "Overcast",

            dayIcon:
                "☁️",

            nightIcon:
                "☁️"
        },

        45: {
            description:
                "Foggy",

            dayIcon:
                "🌫️",

            nightIcon:
                "🌫️"
        },

        48: {
            description:
                "Rime Fog",

            dayIcon:
                "🌫️",

            nightIcon:
                "🌫️"
        },

        51: {
            description:
                "Light Drizzle",

            dayIcon:
                "🌦️",

            nightIcon:
                "🌧️"
        },

        53: {
            description:
                "Drizzle",

            dayIcon:
                "🌦️",

            nightIcon:
                "🌧️"
        },

        55: {
            description:
                "Heavy Drizzle",

            dayIcon:
                "🌧️",

            nightIcon:
                "🌧️"
        },

        61: {
            description:
                "Light Rain",

            dayIcon:
                "🌦️",

            nightIcon:
                "🌧️"
        },

        63: {
            description:
                "Moderate Rain",

            dayIcon:
                "🌧️",

            nightIcon:
                "🌧️"
        },

        65: {
            description:
                "Heavy Rain",

            dayIcon:
                "🌧️",

            nightIcon:
                "🌧️"
        },

        71: {
            description:
                "Light Snow",

            dayIcon:
                "🌨️",

            nightIcon:
                "🌨️"
        },

        73: {
            description:
                "Snow",

            dayIcon:
                "❄️",

            nightIcon:
                "❄️"
        },

        75: {
            description:
                "Heavy Snow",

            dayIcon:
                "❄️",

            nightIcon:
                "❄️"
        },

        80: {
            description:
                "Rain Showers",

            dayIcon:
                "🌦️",

            nightIcon:
                "🌧️"
        },

        81: {
            description:
                "Rain Showers",

            dayIcon:
                "🌧️",

            nightIcon:
                "🌧️"
        },

        82: {
            description:
                "Heavy Showers",

            dayIcon:
                "⛈️",

            nightIcon:
                "⛈️"
        },

        95: {
            description:
                "Thunderstorm",

            dayIcon:
                "⛈️",

            nightIcon:
                "⛈️"
        },

        96: {
            description:
                "Thunderstorm with Hail",

            dayIcon:
                "⛈️",

            nightIcon:
                "⛈️"
        },

        99: {
            description:
                "Severe Thunderstorm",

            dayIcon:
                "⛈️",

            nightIcon:
                "⛈️"
        }

    };


    const weather =
        weatherMap[code] ||
        weatherMap[0];


    return {

        description:
            weather.description,

        icon:
            isDay
                ? weather.dayIcon
                : weather.nightIcon

    };

}


/* =========================================================
   TEMPERATURE UNIT
========================================================= */

unitBtn.addEventListener(
    "click",
    async () => {

        currentUnit =
            currentUnit === "celsius"
                ? "fahrenheit"
                : "celsius";


        localStorage.setItem(
            "skycast-unit",
            currentUnit
        );


        updateUnitButton();


        if (currentLocationData) {

            showLoading();

            await fetchWeather(
                currentLocationData
            );

        }

    }
);


function updateUnitButton() {

    unitText.textContent =
        currentUnit === "celsius"
            ? "°C"
            : "°F";

}


function formatTemperature(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "--°";

    }

    return `${Math.round(value)}°`;

}


/* =========================================================
   THEME
========================================================= */

themeBtn.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark"
        );


        const darkMode =
            document.body.classList.contains(
                "dark"
            );


        localStorage.setItem(
            "skycast-theme",
            darkMode
                ? "dark"
                : "light"
        );


        updateThemeIcon();

    }
);


function initializeTheme() {

    const savedTheme =
        localStorage.getItem(
            "skycast-theme"
        );


    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark"
        );

    }


    updateThemeIcon();

}


function updateThemeIcon() {

    const darkMode =
        document.body.classList.contains(
            "dark"
        );


    themeIcon.className =
        darkMode
            ? "fa-solid fa-sun"
            : "fa-solid fa-moon";

}


/* =========================================================
   RECENT SEARCHES
========================================================= */

function addRecentCity(city) {

    recentCities =
        recentCities.filter(
            item =>
                item.toLowerCase() !==
                city.toLowerCase()
        );


    recentCities.unshift(city);


    recentCities =
        recentCities.slice(0, 6);


    localStorage.setItem(
        "skycast-recent",
        JSON.stringify(
            recentCities
        )
    );


    renderRecentSearches();

}


function renderRecentSearches() {

    recentSearches.innerHTML = "";


    if (recentCities.length === 0) {

        recentSection.classList.add(
            "hidden"
        );

        return;

    }


    recentSection.classList.remove(
        "hidden"
    );


    recentCities.forEach(
        city => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "recent-city";


            button.innerHTML = `

                <i class="fa-solid fa-clock-rotate-left"></i>

                ${escapeHTML(city)}

            `;


            button.addEventListener(
                "click",
                () => {

                    cityInput.value =
                        city;

                    searchCity(city);

                    window.scrollTo({

                        top: 0,

                        behavior:
                            "smooth"

                    });

                }
            );


            recentSearches.appendChild(
                button
            );

        }
    );

}


clearRecentBtn.addEventListener(
    "click",
    () => {

        recentCities = [];


        localStorage.removeItem(
            "skycast-recent"
        );


        renderRecentSearches();


        showToast(
            "History cleared",
            "Recent searches have been removed."
        );

    }
);


/* =========================================================
   VIEW STATES
========================================================= */

function showLoading() {

    welcomeSection.classList.add(
        "hidden"
    );

    weatherDashboard.classList.add(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    loadingState.classList.remove(
        "hidden"
    );

}


function showDashboard() {

    welcomeSection.classList.add(
        "hidden"
    );

    loadingState.classList.add(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    weatherDashboard.classList.remove(
        "hidden"
    );

}


function showError(message) {

    welcomeSection.classList.add(
        "hidden"
    );

    loadingState.classList.add(
        "hidden"
    );

    weatherDashboard.classList.add(
        "hidden"
    );

    errorState.classList.remove(
        "hidden"
    );


    errorMessage.textContent =
        message;


    showToast(
        "Something went wrong",
        message,
        "error"
    );

}


tryAgainBtn.addEventListener(
    "click",
    () => {

        errorState.classList.add(
            "hidden"
        );

        welcomeSection.classList.remove(
            "hidden"
        );

        heroCityInput.focus();

    }
);


/* =========================================================
   TIME / DATE HELPERS
========================================================= */

function formatCurrentDate() {

    return new Date().toLocaleDateString(
        "en-US",
        {

            weekday:
                "long",

            month:
                "long",

            day:
                "numeric"

        }
    );

}


function formatTime(dateString) {

    if (!dateString) {

        return "--:--";

    }


    const timePart =
        dateString.split("T")[1];


    if (!timePart) {

        return "--:--";

    }


    const [
        hour,
        minute
    ] =
        timePart
            .split(":")
            .map(Number);


    const period =
        hour >= 12
            ? "PM"
            : "AM";


    const formattedHour =
        hour % 12 || 12;


    return `${formattedHour}:${String(
        minute
    ).padStart(
        2,
        "0"
    )} ${period}`;

}


function formatHour(dateString) {

    const timePart =
        dateString.split("T")[1];


    if (!timePart) {

        return "";

    }


    const hour =
        Number(
            timePart.split(":")[0]
        );


    const period =
        hour >= 12
            ? "PM"
            : "AM";


    const formattedHour =
        hour % 12 || 12;


    return `${formattedHour} ${period}`;

}


function getLocationTime(
    utcOffsetSeconds
) {

    const now =
        new Date();


    const utcMilliseconds =
        now.getTime() +
        now.getTimezoneOffset() *
        60000;


    const locationDate =
        new Date(
            utcMilliseconds +
            utcOffsetSeconds *
            1000
        );


    return locationDate.toLocaleTimeString(
        "en-US",
        {

            hour:
                "numeric",

            minute:
                "2-digit"

        }
    );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer;


function showToast(
    title,
    message,
    type = "success"
) {

    clearTimeout(
        toastTimer
    );


    toastTitle.textContent =
        title;


    toastMessage.textContent =
        message;


    toast.classList.toggle(
        "error",
        type === "error"
    );


    toastIcon.innerHTML =
        type === "error"

            ? `<i class="fa-solid fa-xmark"></i>`

            : `<i class="fa-solid fa-check"></i>`;


    toast.classList.add(
        "show"
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
   SECURITY HELPER
========================================================= */

function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}
