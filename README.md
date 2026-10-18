# SkyBook Flight Booking Demo

A responsive school-project prototype built with HTML, Tailwind CSS (CDN), and vanilla JavaScript. No database is required. Sample flights, payment, and reservations are simulated.

## Run it
1. Extract the ZIP.
2. Open the folder in Visual Studio Code.
3. Install/use the **Live Server** extension.
4. Right-click `index.html` and choose **Open with Live Server**.

Because the page is divided into HTML partials and loaded with `fetch()`, do not open `index.html` directly with a `file://` URL.

## Where to edit things
- `index.html` — page shell, Tailwind CDN and theme colors.
- `partials/navigation.html` — logo, navigation links, mobile menu, sign-in/sign-up buttons.
- `partials/hero.html` — top banner and main headline.
- `partials/search-form.html` — trip type, airports, dates, passenger count, search button.
- `partials/booking-workflow.html` — flight results, passenger form, seats/extras, review, demo payment, confirmation.
- `partials/features.html` — feature cards.
- `partials/about.html` — About SkyBook section.
- `partials/footer.html` — footer text.
- `partials/modal.html` — sign-in/sign-up and My Bookings dialog container.
- `js/load-pages.js` — loads the HTML partials, then starts the app.
- `js/app.js` — behavior, validation, sample flight data, fare calculations, seat selection, simulated payment, and localStorage bookings.
- `assets/images/` — place any image assets here.

## Tailwind theme
Edit the color names in `index.html` inside `tailwind.config` (`navy`, `sky`, `mint`, `ink`). Most styling is done directly with Tailwind utility classes in the partial HTML files. There is no separate CSS file.

## Important
This is a demo only. It does not connect to airlines, process real payments, or create real tickets. Do not enter real card details.
