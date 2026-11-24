
// PARIS FOOT BOOKING
// Projet scolaire - version de démonstration

const $ = id => document.getElementById(id);

let registerMode = false;
let currentUser = null;
let selectedTerrain = null;
let pendingBooking = null;

// STOCKAGE LOCAL

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function money(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

function localDate() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

// AUTHENTIFICATION DE DEMONSTRATION

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(salt + password);
  const hash = await crypto.subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(hash))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function switchAuth(register) {
  registerMode = register;

  $('nameField').hidden = !register;
  $('fullName').required = register;

  $('loginTab').classList.toggle('active', !register);
  $('registerTab').classList.toggle('active', register);

  $('authTitle').textContent = register
    ? 'Rejoignez le jeu.'
    : 'Bon retour.';

  $('authSubtitle').textContent = register
    ? 'Créez votre compte de démonstration.'
    : 'Connectez-vous pour accéder à votre espace.';

  $('authSubmit').textContent = register
    ? "S'inscrire"
    : 'Se connecter';

  $('authError').textContent = '';
}

function togglePassword() {
  const input = $('password');

  input.type = input.type === 'password'
    ? 'text'
    : 'password';
}

$('authForm').addEventListener('submit', async event => {
  event.preventDefault();

  const email = $('email').value.trim().toLowerCase();
  const password = $('password').value;
  const name = $('fullName').value.trim();

  const users = readStorage('pfb_users', []);

  $('authError').textContent = '';
  $('authSubmit').disabled = true;

  try {
    if (registerMode) {

      if (!name) {
        throw new Error('Veuillez saisir votre nom.');
      }

      if (users.some(user => user.email === email)) {
        throw new Error('Ce compte existe déjà.');
      }

      const salt = crypto.randomUUID();

      const user = {
        id: crypto.randomUUID(),
        name,
        email,
        salt,
        passwordHash: await hashPassword(password, salt)
      };

      users.push(user);

      saveStorage('pfb_users', users);

      loginUser(user);

    } else {

      const user = users.find(item => item.email === email);

      if (!user) {
        throw new Error('Compte introuvable. Inscrivez-vous.');
      }

      const hash = await hashPassword(password, user.salt);

      if (hash !== user.passwordHash) {
        throw new Error('Mot de passe incorrect.');
      }

      loginUser(user);
    }

  } catch (error) {
    $('authError').textContent = error.message;
  } finally {
    $('authSubmit').disabled = false;
  }
});

function loginUser(user) {
  currentUser = {
    id: user.id,
    name: user.name,
    email: user.email
  };

  sessionStorage.setItem(
    'pfb_session',
    JSON.stringify(currentUser)
  );

  $('authPage').hidden = true;
  $('app').hidden = false;
  $('userDisplay').textContent = currentUser.name;
  $('password').value = '';

  renderTerrains();
  renderBookings();

  window.scrollTo(0, 0);
}

function logout() {
  sessionStorage.removeItem('pfb_session');

  currentUser = null;
  pendingBooking = null;

  closeBooking();

  $('app').hidden = true;
  $('authPage').hidden = false;

  $('authForm').reset();

  switchAuth(false);
  window.scrollTo(0, 0);
}

// BASE DE TERRAINS FICTIFS

const images = [
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=800&q=80'
];

const cities = [
  'Paris',
  'Noisiel',
  'Torcy',
  'Lognes',
  'Créteil',
  'Chelles',
  'Saint-Denis',
  'Boulogne-Billancourt'
];

const complexNames = [
  'Elite Football Arena',
  'Green Five Club',
  'Urban Football Park',
  'Premium Foot Center'
];

const terrains = [];

cities.forEach((city, cityIndex) => {
  complexNames.forEach((name, index) => {

    terrains.push({
      id: cityIndex * 4 + index + 1,
      name: name + ' ' + city,
      city,
      type: index % 2 === 0 ? 'Indoor' : 'Outdoor',
      format: index % 2 === 0 ? '5v5' : '7v7',
      maxPlayers: index % 2 === 0 ? 10 : 14,
      price: 8 + ((cityIndex * 3 + index * 2) % 11),
      image: images[(cityIndex + index) % images.length]
    });

  });
});

// FILTRES

cities.forEach(city => {
  const option = document.createElement('option');

  option.value = city;
  option.textContent = city;

  $('cityFilter').appendChild(option);
});

function renderTerrains() {

  const search = $('searchInput').value.toLowerCase().trim();
  const city = $('cityFilter').value;
  const type = $('typeFilter').value;
  const price = Number($('priceFilter').value);

  const filtered = terrains.filter(terrain => {

    const matchesSearch =
      (terrain.name + ' ' + terrain.city)
      .toLowerCase()
      .includes(search);

    return matchesSearch
      && (!city || terrain.city === city)
      && (!type || terrain.type === type)
      && (!price || terrain.price <= price);

  });

  $('resultCount').textContent =
    `${filtered.length} terrain(s) de démonstration`;

  if (!filtered.length) {
    $('terrainsGrid').innerHTML = `
      <div class="empty">
        <i class="fa-solid fa-magnifying-glass"></i>
        Aucun terrain trouvé.
      </div>
    `;
    return;
  }

  $('terrainsGrid').innerHTML = filtered.map(terrain => `

    <article class="terrain-card">

      <div class="terrain-image"
        style="background-image:url('${terrain.image}')">

        <span class="terrain-tag">
          ${terrain.type} · Démo
        </span>

      </div>

      <div class="terrain-body">

        <p class="terrain-location">
          <i class="fa-solid fa-location-dot"></i>
          ${escapeHTML(terrain.city)}
        </p>

        <h3>${escapeHTML(terrain.name)}</h3>

        <div class="terrain-details">

          <span>
            <i class="fa-solid fa-users"></i>
            ${terrain.format}
          </span>

          <span>
            <i class="fa-solid fa-clock"></i>
            Dès 1 heure
          </span>

        </div>

        <div class="terrain-bottom">

          <div class="price">
            <strong>${terrain.price} €</strong>
            <small>/ pers / h</small>
          </div>

          <button class="btn primary"
            onclick="openBooking(${terrain.id})">

            Réserver
            <i class="fa-solid fa-arrow-right"></i>

          </button>

        </div>

      </div>

    </article>

  `).join('');
}

// RESERVATION

function openBooking(id) {

  if (!currentUser) return;

  selectedTerrain = terrains.find(terrain => terrain.id === id);

  if (!selectedTerrain) return;

  pendingBooking = null;

  $('selectedTerrain').textContent = selectedTerrain.name;

  $('selectedLocation').textContent =
    `${selectedTerrain.city} · ${selectedTerrain.format}`;

  $('bookDate').min = localDate();
  $('bookDate').value = localDate();

  $('playerCount').max = selectedTerrain.maxPlayers;
  $('playerCount').value = selectedTerrain.maxPlayers;

  $('duration').value = '1';
  $('bookingError').textContent = '';

  $('bookingStep').hidden = false;
  $('paymentStep').hidden = true;
  $('successStep').hidden = true;

  $('bookingModal').hidden = false;

  document.body.style.overflow = 'hidden';

  updateTotal();
}

function closeBooking() {

  $('bookingModal').hidden = true;

  document.body.style.overflow = '';

  pendingBooking = null;
}

function updateTotal() {

  if (!selectedTerrain) return;

  const players = Number($('playerCount').value) || 1;
  const duration = Number($('duration').value);

  const total = players * duration * selectedTerrain.price;

  $('totalAmount').textContent = money(total);
}

function getBookings() {
  return readStorage('pfb_bookings', []);
}

function isSlotTaken(booking) {

  const start = new Date(
    `${booking.date}T${booking.time}`
  ).getTime();

  const end = start + booking.duration * 3600000;

  return getBookings().some(item => {

    if (
      item.terrainId !== booking.terrainId ||
      item.status === 'cancelled'
    ) {
      return false;
    }

    const itemStart = new Date(
      `${item.date}T${item.time}`
    ).getTime();

    const itemEnd =
      itemStart + item.duration * 3600000;

    return start < itemEnd && end > itemStart;

  });
}

$('bookingForm').addEventListener('submit', event => {

  event.preventDefault();

  if (!selectedTerrain || !currentUser) return;

  const date = $('bookDate').value;
  const time = $('bookTime').value;
  const players = Number($('playerCount').value);
  const duration = Number($('duration').value);

  const matchDate = new Date(`${date}T${time}`);

  $('bookingError').textContent = '';

  if (
    !Number.isFinite(matchDate.getTime()) ||
    matchDate <= new Date()
  ) {
    $('bookingError').textContent =
      'Veuillez choisir un créneau futur.';
    return;
  }

  if (
    !Number.isInteger(players) ||
    players < 1 ||
    players > selectedTerrain.maxPlayers
  ) {
    $('bookingError').textContent =
      'Nombre de joueurs incorrect.';
    return;
  }

  if (![1, 1.5, 2].includes(duration)) return;

  pendingBooking = {
    id: 'PFB-' + crypto.randomUUID().slice(0, 8).toUpperCase(),
    userId: currentUser.id,
    terrainId: selectedTerrain.id,
    terrain: selectedTerrain.name,
    city: selectedTerrain.city,
    date,
    time,
    players,
    duration,
    total: players * duration * selectedTerrain.price,
    status: 'confirmed'
  };

  if (isSlotTaken(pendingBooking)) {

    $('bookingError').textContent =
      'Ce créneau est déjà réservé sur cet appareil.';

    pendingBooking = null;

    return;
  }

  $('paymentSummary').innerHTML = `

    <strong>${escapeHTML(pendingBooking.terrain)}</strong>
    <br>

    Date : ${escapeHTML(date)}<br>
    Heure : ${escapeHTML(time)}<br>
    Joueurs : ${players}<br>
    Durée : ${duration} h<br>

    <strong>Total : ${money(pendingBooking.total)}</strong>

  `;

  $('bookingStep').hidden = true;
  $('paymentStep').hidden = false;

});

function backToBooking() {

  $('paymentStep').hidden = true;
  $('bookingStep').hidden = false;

}

// PAIEMENT FICTIF

function confirmBooking() {

  if (!pendingBooking || !currentUser) return;

  if (isSlotTaken(pendingBooking)) {

    backToBooking();

    $('bookingError').textContent =
      'Ce créneau est désormais indisponible.';

    return;
  }

  const booking = { ...pendingBooking };

  const bookings = getBookings();

  bookings.unshift(booking);

  saveStorage('pfb_bookings', bookings);

  pendingBooking = null;

  $('paymentStep').hidden = true;
  $('successStep').hidden = false;

  $('ticket').innerHTML = `

    <strong>${escapeHTML(booking.id)}</strong><br>

    ${escapeHTML(booking.terrain)}<br>

    ${escapeHTML(booking.date)} à
    ${escapeHTML(booking.time)}<br>

    ${booking.players} joueurs<br>

    ${money(booking.total)}<br>

    Paiement simulé

  `;

  renderBookings();

  showToast('Réservation de démonstration confirmée !');

}

// HISTORIQUE

function renderBookings() {

  if (!currentUser) return;

  const bookings = getBookings().filter(
    item => item.userId === currentUser.id
  );

  if (!bookings.length) {

    $('bookingsList').innerHTML = `

      <div class="empty">

        <i class="fa-regular fa-calendar"></i>

        <h3>Aucune réservation</h3>

        <p>Votre prochain match vous attend.</p>

      </div>

    `;

    return;
  }

  $('bookingsList').innerHTML = bookings.map(booking => `

    <div class="booking-item">

      <div>

        <span class="booking-status">
          ${booking.status === 'cancelled'
            ? 'ANNULÉE'
            : 'CONFIRMÉE · DÉMO'}
        </span>

        <h3>${escapeHTML(booking.terrain)}</h3>

        <p>
          ${escapeHTML(booking.date)} à
          ${escapeHTML(booking.time)}
          · ${booking.players} joueurs
          · ${booking.duration} h
        </p>

        <p>Ticket : ${escapeHTML(booking.id)}</p>

      </div>

      <div>
        <strong>${money(booking.total)}</strong>
      </div>

      ${booking.status !== 'cancelled' ? `

        <button class="cancel-btn"
          data-booking-id="${escapeHTML(booking.id)}">

          Annuler

        </button>

      ` : ''}

    </div>

  `).join('');

  $('bookingsList')
    .querySelectorAll('[data-booking-id]')
    .forEach(button => {

      button.addEventListener('click', () => {
        cancelBooking(button.dataset.bookingId);
      });

    });

}

function cancelBooking(id) {

  if (!currentUser) return;

  if (!confirm('Annuler cette réservation ?')) return;

  const bookings = getBookings();

  const booking = bookings.find(item =>
    item.id === id &&
    item.userId === currentUser.id
  );

  if (!booking) return;

  booking.status = 'cancelled';

  saveStorage('pfb_bookings', bookings);

  renderBookings();

  showToast('Réservation annulée.');

}

// NOTIFICATIONS

let toastTimer;

function showToast(message) {

  clearTimeout(toastTimer);

  $('toast').textContent = message;
  $('toast').hidden = false;

  toastTimer = setTimeout(() => {
    $('toast').hidden = true;
  }, 3500);

}

// FERMETURE DU MODAL

$('bookingModal').addEventListener('click', event => {

  if (event.target === $('bookingModal')) {
    closeBooking();
  }

});

document.addEventListener('keydown', event => {

  if (event.key === 'Escape') {
    closeBooking();
  }

});

// RESTAURATION DE LA SESSION LOCALE

try {

  const session = JSON.parse(
    sessionStorage.getItem('pfb_session')
  );

  const users = readStorage('pfb_users', []);

  if (session) {

    const user = users.find(item =>
      item.id === session.id
    );

    if (user) {
      loginUser(user);
    }

  }

} catch {

  sessionStorage.removeItem('pfb_session');

}
