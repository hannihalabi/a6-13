// ============================================================
// STRIPE KONFIGURATION
// ------------------------------------------------------------
// 1. Ersätt PUBLISHABLE_KEY med din pk_live_... nyckel från
//    Stripe Dashboard > Developers > API keys
// 2. Skapa en backend-endpoint /create-checkout-session som
//    använder din sk_live_... nyckel (ALDRIG i frontend!)
// ============================================================
const PUBLISHABLE_KEY = 'pk_live_51TD0dkGcQBBi7wtgTGqXyI9GJ5Hgtubz7MAY38xNwc4yrMMiUDhMSdUbcjgGy23Wi1xiVqpWUJwbE0OUS3g3kdNI00sy2XavLd';
const CHECKOUT_ENDPOINT = '/create-checkout-session'; // Din backend-URL

// Ladda Stripe.js dynamiskt
let stripeInstance = null;

async function loadStripe() {
  if (stripeInstance) return stripeInstance;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => {
      stripeInstance = window.Stripe(PUBLISHABLE_KEY);
      resolve(stripeInstance);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Checkout-funktion anropad från HTML
async function checkout(productName, amountInOre) {
  // Om Stripe-nyckeln inte är konfigurerad, visa info-modal
  if (PUBLISHABLE_KEY.includes('ERSÄTT')) {
    openModal();
    return;
  }

  try {
    const stripe = await loadStripe();

    // Skicka till din backend för att skapa en checkout-session
    const response = await fetch(CHECKOUT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product: productName,
        amount: amountInOre,   // i ören (SEK × 100)
        currency: 'sek',
      }),
    });

    if (!response.ok) throw new Error('Serverfel vid skapande av session');

    const { sessionId } = await response.json();
    const { error } = await stripe.redirectToCheckout({ sessionId });

    if (error) alert('Betalningsfel: ' + error.message);

  } catch (err) {
    console.error(err);
    alert('Något gick fel. Försök igen eller kontakta support.');
  }
}

function openModal() {
  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

// Stäng modal på backdrop-klick
document.getElementById('modal').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

// Smooth scroll för navigeringslänkar
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
