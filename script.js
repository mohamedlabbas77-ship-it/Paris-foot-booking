let currentBooking = {
  terrain: '',
  pricePerPerson: 0,
  total: 0
};

// 1. فتح نافذة الحجز
function openBookingModal(terrainName, price) {
  currentBooking.terrain = terrainName;
  currentBooking.pricePerPerson = price;
  
  document.getElementById('modalTerrainName').innerText = terrainName;
  
  // تعيين تاريخ اليوم تلقائياً
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('bookDate').value = today;
  
  updateTotalPrice();
  
  document.getElementById('modalStep1').style.display = 'block';
  document.getElementById('modalStep2').style.display = 'none';
  document.getElementById('bookingModal').style.display = 'flex';
}

function closeBookingModal() {
  document.getElementById('bookingModal').style.display = 'none';
}

// 2. تحديث السعر الإجمالي تلقائياً
function updateTotalPrice() {
  const count = document.getElementById('playerCount').value || 1;
  currentBooking.total = count * currentBooking.pricePerPerson;
  document.getElementById('totalAmount').innerText = `${currentBooking.total} €`;
}

// 3. الانتقال إلى خطوة الدفع
function goToPayment(event) {
  event.preventDefault();
  document.getElementById('payAmount').innerText = `${currentBooking.total} €`;
  document.getElementById('modalStep1').style.display = 'none';
  document.getElementById('modalStep2').style.display = 'block';
}

// 4. معالجة وتأكيد الدفع
function processPayment(event) {
  event.preventDefault();
  
  const payBtn = document.getElementById('payBtn');
  payBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Traitement...';
  payBtn.disabled = true;

  setTimeout(() => {
    const name = document.getElementById('userName').value;
    const date = document.getElementById('bookDate').value;
    const time = document.getElementById('bookTime').value;

    alert(`🎉 Réservation Confirmée !\n\nMerci ${name}.\nVotre terrain ${currentBooking.terrain} est réservé pour le ${date} à ${time}.\nMontant payé: ${currentBooking.total} €`);

    // إضافة الحجز للبطاقة أسفل الصفحة
    addBookingToList(name, currentBooking.terrain, date, time, currentBooking.total);

    payBtn.innerHTML = 'Payer & Confirmer <i class="fa-solid fa-check-circle"></i>';
    payBtn.disabled = false;
    closeBookingModal();
  }, 1500);
}

// 5. إضافة الحجز لقائمة "Mes Réservations"
function addBookingToList(name, terrain, date, time, price) {
  const container = document.getElementById('bookingsList');
  const emptyMsg = container.querySelector('.empty-msg');
  if (emptyMsg) emptyMsg.remove();

  const item = document.createElement('div');
  item.className = 'booking-item';
  item.innerHTML = `
    <div>
      <strong><i class="fa-solid fa-futbol" style="color:#10b981;"></i> ${terrain}</strong><br>
      <small style="color:#64748b;">Par: ${name} | Le: ${date} à ${time}</small>
    </div>
    <div>
      <span style="font-weight:bold; color:#059669;">${price} € (Payé ✔️)</span>
    </div>
  `;
  container.prepend(item);
}

// 6. فلترة وتصفية الملاعب أثناء البحث
function filterTerrains() {
  const input = document.getElementById('searchInput').value.toLowerCase();
  const cards = document.querySelectorAll('.card');

  cards.forEach(card => {
    const name = card.getAttribute('data-name');
    if (name.includes(input)) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}
