//Local Storage ra ni bai
//Json gamit nato
    const $ = (id) => document.getElementById(id);
    const airportNames = { CEB: 'Cebu', MNL: 'Manila', DVO: 'Davao', ILO: 'Iloilo', SIN: 'Singapore', NRT: 'Tokyo' };
    const stepNames = [
      ['results','Flights'], ['passenger','Passengers'], ['extras','Extras'],
      ['review','Review'], ['payment','Payment'], ['confirmation','Done']
    ];
    const flightTemplates = [
      { airline:'Pacific Skies', code:'PS 214', depart:'06:20', arrive:'07:45', duration:85, stops:'Nonstop', base:2490 },
      { airline:'Island Air', code:'IA 508', depart:'10:15', arrive:'11:50', duration:95, stops:'Nonstop', base:2890 },
      { airline:'Blue Horizon', code:'BH 331', depart:'14:40', arrive:'16:25', duration:105, stops:'Nonstop', base:3190 },
      { airline:'Cloudline Airways', code:'CA 720', depart:'18:30', arrive:'20:10', duration:100, stops:'Nonstop', base:2790 }
    ];
    const extrasPrices = { checkedBag:850, priority:350, insurance:250 };
    const extraLabels = { checkedBag:'Checked baggage', priority:'Priority boarding', insurance:'Demo travel protection' };
    const takenSeats = ['2B','3C','4A','5D'];
    const state = { search:null, flights:[], selectedFlight:null, passengers:[], extras:[], seats:[], booking:null, activeStep:'results' };

    function localDateOffset(days) {
      const d = new Date(); d.setDate(d.getDate() + days);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    $('year').textContent = new Date().getFullYear();
    $('departDate').min = localDateOffset(0);
    $('returnDate').min = localDateOffset(0);
    $('departDate').value = localDateOffset(7);
    $('returnDate').value = localDateOffset(14);

    function money(value) { return '₱' + Number(value).toLocaleString('en-PH'); }
    function formatDate(value) {
      if (!value) return 'Not selected';
      return new Date(value + 'T12:00:00').toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});
    }
    function durationText(minutes) { return `${Math.floor(minutes/60)}h ${minutes%60}m`; }
    function totalFare() {
      if (!state.selectedFlight) return 0;
      const fare = state.selectedFlight.price * Number(state.search.passengers);
      const extras = state.extras.reduce((sum,key)=>sum + extrasPrices[key] * Number(state.search.passengers),0);
      const seatFees = state.seats.filter(Boolean).length * 150;
      return fare + extras + seatFees;
    }
    function baseTotal() { return state.selectedFlight ? state.selectedFlight.price * Number(state.search.passengers) : 0; }
    function extrasTotal() { return state.extras.reduce((sum,key)=>sum + extrasPrices[key] * Number(state.search.passengers),0); }
    function seatTotal() { return state.seats.filter(Boolean).length * 150; }
    function showError(id, message) { $(id).textContent = message; $(id).classList.remove('hidden'); }
    function clearError(id) { $(id).textContent = ''; $(id).classList.add('hidden'); }

    $('tripType').addEventListener('change', () => {
      const oneWay = $('tripType').value === 'oneway';
      $('returnField').classList.toggle('hidden', oneWay);
      $('returnDate').required = !oneWay;
    });
    $('departDate').addEventListener('change', () => {
      $('returnDate').min = $('departDate').value;
      if ($('returnDate').value && $('returnDate').value < $('departDate').value) $('returnDate').value = $('departDate').value;
    });
    $('swapAirports').addEventListener('click', () => {
      const from = $('origin').value; $('origin').value = $('destination').value; $('destination').value = from;
    });

    $('searchForm').addEventListener('submit', (event) => {
      event.preventDefault(); clearError('searchError');
      const origin = $('origin').value, destination = $('destination').value;
      const departDate = $('departDate').value, returnDate = $('returnDate').value;
      if (origin === destination) return showError('searchError','Please choose two different airports.');
      if (!departDate || departDate < localDateOffset(0)) return showError('searchError','Please choose a valid departure date.');
      if ($('tripType').value === 'round' && (!returnDate || returnDate < departDate)) return showError('searchError','Return date must be on or after the departure date.');
      state.search = { origin,destination,departDate,returnDate:$('tripType').value === 'round' ? returnDate : null,tripType:$('tripType').value,passengers:Number($('passengers').value),cabin:$('cabin').value };
      state.selectedFlight = null; state.passengers = []; state.extras = []; state.seats = []; state.booking = null;
      state.flights = flightTemplates.map((f,i) => ({...f, price:Math.round(f.base * routeMultiplier(origin,destination) * cabinMultiplier(state.search.cabin) / 10) * 10, depart:shiftTime(f.depart,i)}));
      $('bookingWorkspace').classList.remove('hidden');
      $('tripSummary').textContent = `${airportNames[origin]} (${origin}) → ${airportNames[destination]} (${destination}) · ${formatDate(departDate)}${state.search.returnDate ? ' – ' + formatDate(state.search.returnDate) : ''} · ${state.search.passengers} passenger(s) · ${state.search.cabin}`;
      renderFlights(); renderProgress(); goStep('results');
      $('bookingWorkspace').scrollIntoView({behavior:'smooth',block:'start'});
    });
    function routeMultiplier(from,to) { return (from === 'SIN' || to === 'SIN' || from === 'NRT' || to === 'NRT') ? 3.1 : (from === 'CEB' && to === 'MNL' || from === 'MNL' && to === 'CEB') ? 1 : 1.35; }
    function cabinMultiplier(cabin) { return {'Economy':1,'Premium Economy':1.45,'Business':2.7,'First Class':4.1}[cabin] || 1; }
    function shiftTime(time,index) { const [h,m]=time.split(':').map(Number); const mins=(h*60+m+index*7)%1440; return `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`; }
    function arrivalTime(depart,duration) { const [h,m]=depart.split(':').map(Number); const mins=(h*60+m+duration)%1440; return `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`; }

    $('sortFlights').addEventListener('change', renderFlights);
    function renderFlights() {
      const sorted = [...state.flights].sort((a,b) => $('sortFlights').value==='duration' ? a.duration-b.duration : $('sortFlights').value==='departure' ? a.depart.localeCompare(b.depart) : a.price-b.price);
      $('flightResults').innerHTML = sorted.map((f) => `
        <article class="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-400 hover:shadow-soft sm:p-5">
          <div class="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div class="flex flex-wrap items-center gap-3">
              <div class="grid h-12 w-12 place-items-center rounded-xl bg-sky text-xl">✈</div>
              <div><p class="font-bold text-ink">${f.airline}</p><p class="text-xs text-slate-500">${f.code} · ${state.search.cabin}</p></div>
            </div>
            <div class="text-left sm:text-right"><p class="text-2xl font-extrabold text-ink">${money(f.price * state.search.passengers)}</p><p class="text-xs text-slate-500">total for ${state.search.passengers} passenger(s)</p></div>
          </div>
          <div class="my-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div><p class="text-xl font-bold text-ink">${f.depart}</p><p class="text-sm font-semibold">${state.search.origin}</p><p class="text-xs text-slate-500">${formatDate(state.search.departDate)}</p></div>
            <div class="min-w-20 text-center"><p class="text-xs text-slate-500">${durationText(f.duration)}</p><div class="relative my-2 h-px bg-slate-300"><span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-1 text-xs text-slate-500">✈</span></div><p class="text-xs font-semibold text-emerald-700">${f.stops}</p></div>
            <div class="text-right"><p class="text-xl font-bold text-ink">${arrivalTime(f.depart,f.duration)}</p><p class="text-sm font-semibold">${state.search.destination}</p><p class="text-xs text-slate-500">${formatDate(state.search.departDate)}</p></div>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><p class="text-xs text-slate-500">Sample fare · Taxes included in demo price</p><button class="select-flight rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700" data-flight="${f.code}">Select flight</button></div>
        </article>`).join('');
      document.querySelectorAll('.select-flight').forEach(btn => btn.addEventListener('click', () => {
        state.selectedFlight = state.flights.find(f => f.code === btn.dataset.flight);
        state.passengers = Array.from({length:state.search.passengers},()=>({first:'',middle:'',last:'',dob:'',nationality:'Filipino'}));
        state.seats = Array(state.search.passengers).fill(null); renderPassengerFields(); renderProgress(); goStep('passenger');
      }));
    }

    function renderProgress() {
      $('progress').innerHTML = stepNames.map(([id,label],i) => {
        const current = stepNames.findIndex(s=>s[0]===state.activeStep);
        const cls = id===state.activeStep ? 'step-active' : (i<current ? 'step-done' : 'border-slate-200 bg-white text-slate-500');
        return `<div class="rounded-xl border px-2 py-3 text-center ${cls}"><span class="block text-[10px] font-bold sm:text-xs">${String(i+1).padStart(2,'0')}</span><span class="mt-1 block text-[10px] font-semibold sm:text-xs">${label}</span></div>`;
      }).join('');
    }
    function goStep(step) {
      state.activeStep=step;
      document.querySelectorAll('.booking-step').forEach(el=>el.classList.add('hidden-step'));
      $('step-'+step).classList.remove('hidden-step');
      $('workspaceTitle').textContent = ({results:'Choose your flight',passenger:'Passenger details',extras:'Customize your journey',review:'Review your booking',payment:'Complete demo payment',confirmation:'Booking confirmation'})[step] || 'Your trip';
      renderProgress();
      if (step==='passenger') renderPassengerSummary();
      if (step==='extras') { renderSeatMap(); renderExtrasSummary(); }
      if (step==='review') renderReview();
      if (step==='payment') renderPaymentSummary();
      $('bookingWorkspace').scrollIntoView({behavior:'smooth',block:'start'});
    }
    document.querySelectorAll('.backStep').forEach(btn=>btn.addEventListener('click',()=>goStep(btn.dataset.target)));

    function renderPassengerFields() {
      $('passengerFields').innerHTML = state.passengers.map((p,i)=>`
        <fieldset class="rounded-xl border border-slate-200 p-4">
          <legend class="px-2 font-bold text-ink">Passenger ${i+1}</legend>
          <div class="grid gap-4 sm:grid-cols-2">
            <div><label class="mb-1 block text-sm font-semibold" for="first${i}">First name *</label><input id="first${i}" required autocomplete="given-name" value="${escapeHtml(p.first)}" class="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm" placeholder="First name" /></div>
            <div><label class="mb-1 block text-sm font-semibold" for="last${i}">Last name *</label><input id="last${i}" required autocomplete="family-name" value="${escapeHtml(p.last)}" class="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm" placeholder="Last name" /></div>
            <div><label class="mb-1 block text-sm font-semibold" for="middle${i}">Middle name (optional)</label><input id="middle${i}" value="${escapeHtml(p.middle)}" class="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm" placeholder="Middle name" /></div>
            <div><label class="mb-1 block text-sm font-semibold" for="dob${i}">Date of birth *</label><input id="dob${i}" type="date" required max="${localDateOffset(0)}" value="${escapeHtml(p.dob)}" class="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm" /></div>
          </div>
        </fieldset>`).join('');
      state.passengers.forEach((p,i)=>['first','last','middle','dob'].forEach(k=> $(''+k+i).addEventListener('input',e=>{p[k]=e.target.value;})));
    }
    function escapeHtml(str) { return String(str||'').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
    $('passengerForm').addEventListener('submit',e=>{
      e.preventDefault(); clearError('passengerError');
      for (let i=0;i<state.passengers.length;i++) {
        const p=state.passengers[i];
        if (!p.first.trim()||!p.last.trim()||!p.dob) return showError('passengerError',`Please complete the required fields for passenger ${i+1}.`);
        if (p.dob>localDateOffset(0)) return showError('passengerError','Date of birth cannot be in the future.');
      }
      goStep('extras');
    });
    function summaryMarkup() {
      return `<h3 class="font-bold text-ink">Trip summary</h3><div class="mt-4 flex items-center justify-between gap-3"><div><p class="text-xl font-extrabold text-ink">${state.search.origin}</p><p class="text-xs text-slate-500">${formatDate(state.search.departDate)}</p></div><span class="text-slate-400">→</span><div class="text-right"><p class="text-xl font-extrabold text-ink">${state.search.destination}</p><p class="text-xs text-slate-500">${state.search.returnDate?formatDate(state.search.returnDate):'One way'}</p></div></div><div class="my-4 border-t border-blue-100"></div><p class="text-sm text-slate-600">${state.selectedFlight.airline} · ${state.selectedFlight.code}</p><p class="mt-1 text-sm text-slate-600">${state.search.passengers} passenger(s) · ${state.search.cabin}</p><div class="mt-4 flex items-center justify-between"><span class="text-sm text-slate-600">Flight total</span><strong class="text-lg text-ink">${money(baseTotal())}</strong></div>`;
    }
    function renderPassengerSummary() { $('passengerSummary').innerHTML=summaryMarkup(); }
    function renderExtrasSummary() { $('extrasSummary').innerHTML=summaryMarkup()+`<div class="mt-4 border-t border-blue-100 pt-4"><div class="flex justify-between text-sm"><span>Selected extras</span><strong>${money(extrasTotal()+seatTotal())}</strong></div><div class="mt-3 flex justify-between"><span class="font-bold text-ink">Estimated total</span><strong class="text-xl text-ink">${money(totalFare())}</strong></div></div>`; }
    function renderSeatMap() {
      const letters=['A','B','C','D']; let html='<div class="mb-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Front of aircraft</div><div class="space-y-2">';
      for(let row=1;row<=5;row++){
        html+='<div class="flex items-center justify-center gap-2"><span class="w-4 text-xs text-slate-400">'+row+'</span>';
        letters.forEach((letter,idx)=>{
          if(idx===2) html+='<span class="w-3"></span>';
          const seat=row+letter, taken=takenSeats.includes(seat), selected=state.seats.includes(seat);
          html+=`<button type="button" class="seat ${taken?'taken':selected?'selected':'available'}" ${taken?'disabled':''} data-seat="${seat}" aria-label="Seat ${seat}${taken?' unavailable':selected?' selected':' available'}">${letter}</button>`;
        });
        html+='</div>';
      }
      html+='</div><div class="mt-4 flex flex-wrap justify-center gap-3 text-xs text-slate-500"><span>□ Available</span><span class="text-navy">■ Selected</span><span class="text-slate-400">■ Unavailable</span></div>';
      $('seatMap').innerHTML=html;
      $('seatMap').querySelectorAll('[data-seat]').forEach(btn=>btn.addEventListener('click',()=>{
        const seat=btn.dataset.seat;
        if(state.seats.includes(seat)) state.seats=state.seats.map(s=>s===seat?null:s);
        else { const empty=state.seats.findIndex(s=>!s); if(empty===-1) state.seats.shift(),state.seats.push(seat); else state.seats[empty]=seat; }
        renderSeatMap(); $('seatMessage').textContent=state.seats.filter(Boolean).length ? 'Selected: '+state.seats.filter(Boolean).join(', ')+' (₱150 each)' : 'No seats selected.';
        renderExtrasSummary();
      }));
      $('seatMessage').textContent=state.seats.filter(Boolean).length ? 'Selected: '+state.seats.filter(Boolean).join(', ')+' (₱150 each)' : 'No seats selected.';
    }
    document.querySelectorAll('.extra-check').forEach(cb=>cb.addEventListener('change',()=>{
      state.extras=[...document.querySelectorAll('.extra-check:checked')].map(el=>el.value); renderExtrasSummary();
    }));
    $('toReview').addEventListener('click',()=>goStep('review'));
    function renderReview() {
      const f=state.selectedFlight;
      $('reviewFlight').innerHTML=`<h3 class="font-bold text-ink">Flight itinerary</h3><div class="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3"><div><p class="text-2xl font-extrabold text-ink">${f.depart}</p><p class="font-bold">${state.search.origin}</p><p class="text-xs text-slate-500">${formatDate(state.search.departDate)}</p></div><div class="text-center text-xs text-slate-500">${durationText(f.duration)}<div class="my-2 h-px w-16 bg-slate-300"></div>Nonstop</div><div class="text-right"><p class="text-2xl font-extrabold text-ink">${arrivalTime(f.depart,f.duration)}</p><p class="font-bold">${state.search.destination}</p><p class="text-xs text-slate-500">${formatDate(state.search.departDate)}</p></div></div><p class="mt-4 text-sm text-slate-500">${f.airline} · ${f.code} · ${state.search.cabin}</p>${state.search.returnDate?`<p class="mt-2 text-sm text-slate-500">Return date: ${formatDate(state.search.returnDate)} (demo fare is shown as a single itinerary estimate).</p>`:''}`;
      $('reviewPassengers').innerHTML='<h3 class="font-bold text-ink">Passengers</h3><div class="mt-3 space-y-2">'+state.passengers.map((p,i)=>`<p class="text-sm">${i+1}. ${escapeHtml(p.first)} ${escapeHtml(p.middle)} ${escapeHtml(p.last)} <span class="text-slate-400">· DOB ${formatDate(p.dob)}</span></p>`).join('')+'</div>';
      $('reviewExtras').innerHTML='<h3 class="font-bold text-ink">Extras and price breakdown</h3><div class="mt-3 space-y-2 text-sm">'+`<div class="flex justify-between"><span>Sample flight fare</span><span>${money(baseTotal())}</span></div>`+state.extras.map(k=>`<div class="flex justify-between"><span>${extraLabels[k]} × ${state.search.passengers}</span><span>${money(extrasPrices[k]*state.search.passengers)}</span></div>`).join('')+`<div class="flex justify-between"><span>Seat selection (${state.seats.filter(Boolean).length})</span><span>${money(seatTotal())}</span></div><div class="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-extrabold text-ink"><span>Demo total</span><span>${money(totalFare())}</span></div></div>`;
      $('reviewSummary').innerHTML=summaryMarkup()+`<div class="mt-4 border-t border-blue-100 pt-4"><p class="text-sm text-slate-600">Extras and seats</p><p class="mt-1 text-lg font-bold text-ink">${money(extrasTotal()+seatTotal())}</p><div class="mt-4 flex justify-between border-t border-blue-100 pt-4"><span class="font-bold text-ink">Total</span><strong class="text-xl text-ink">${money(totalFare())}</strong></div></div>`;
      $('agreeTerms').checked=false; clearError('reviewError');
    }
    $('toPayment').addEventListener('click',()=>{ if(!$('agreeTerms').checked) return showError('reviewError','Please confirm that you reviewed the itinerary and understand this is a demo booking.'); goStep('payment'); });
    function renderPaymentSummary() { $('paymentSummary').innerHTML=summaryMarkup()+`<div class="mt-4 border-t border-blue-100 pt-4"><div class="flex justify-between"><span class="font-bold text-ink">Demo total</span><strong class="text-xl text-ink">${money(totalFare())}</strong></div></div>`; }
    $('paymentForm').addEventListener('submit',e=>{
      e.preventDefault(); clearError('paymentError');
      if(!$('demoPaymentConfirm').checked) return showError('paymentError','Please confirm that you understand this is a simulated payment.');
      const reference='SB-'+Math.random().toString(36).slice(2,6).toUpperCase()+Date.now().toString().slice(-4);
      state.booking={reference,createdAt:new Date().toISOString(),status:'DEMO CONFIRMED',paymentMethod:$('paymentMethod').value,total:totalFare(),search:{...state.search},flight:{...state.selectedFlight},passengers:state.passengers.map(p=>({...p})),extras:[...state.extras],seats:[...state.seats]};
      const bookings=JSON.parse(localStorage.getItem('skybookBookings')||'[]'); bookings.unshift(state.booking); localStorage.setItem('skybookBookings',JSON.stringify(bookings));
      renderConfirmation(); goStep('confirmation');
    });
    function renderConfirmation() {
      const b=state.booking;
      $('confirmationDetails').innerHTML=`<div class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-xs uppercase tracking-widest text-slate-500">Demo booking reference</p><p class="mt-1 text-2xl font-extrabold text-ink">${b.reference}</p></div><span class="rounded-full bg-mint px-3 py-1.5 text-xs font-bold text-navy">DEMO CONFIRMED</span></div><div class="my-5 border-t border-blue-100"></div><div class="grid gap-4 sm:grid-cols-2"><div><p class="text-xs text-slate-500">Route</p><p class="mt-1 font-bold text-ink">${airportNames[b.search.origin]} (${b.search.origin}) → ${airportNames[b.search.destination]} (${b.search.destination})</p></div><div><p class="text-xs text-slate-500">Departure</p><p class="mt-1 font-bold text-ink">${formatDate(b.search.departDate)} · ${b.flight.depart}</p></div><div><p class="text-xs text-slate-500">Passenger(s)</p><p class="mt-1 font-bold text-ink">${b.passengers.map(p=>escapeHtml(p.first+' '+p.last)).join(', ')}</p></div><div><p class="text-xs text-slate-500">Payment</p><p class="mt-1 font-bold text-ink">Simulated · ${escapeHtml(b.paymentMethod)}</p></div><div><p class="text-xs text-slate-500">Airline</p><p class="mt-1 font-bold text-ink">${b.flight.airline} (${b.flight.code})</p></div><div><p class="text-xs text-slate-500">Total (demo)</p><p class="mt-1 text-xl font-extrabold text-ink">${money(b.total)}</p></div></div>`;
    }

    // Demo account modal: deliberately no real authentication or password collection.
    function openModal(title,content) { $('modalTitle').textContent=title; $('modalContent').innerHTML=content; $('modalBackdrop').classList.remove('hidden'); $('modalBackdrop').classList.add('flex'); }
    function closeModal() { $('modalBackdrop').classList.add('hidden'); $('modalBackdrop').classList.remove('flex'); }
    $('closeModal').addEventListener('click',closeModal);
    $('modalBackdrop').addEventListener('click',e=>{if(e.target===$('modalBackdrop'))closeModal();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
    function showBookings() {
      const bookings=JSON.parse(localStorage.getItem('skybookBookings')||'[]');
      const content=bookings.length?bookings.map(b=>`<article class="mb-3 rounded-xl border border-slate-200 p-4"><div class="flex flex-wrap items-start justify-between gap-2"><div><p class="font-bold text-ink">${airportNames[b.search.origin]} → ${airportNames[b.search.destination]}</p><p class="mt-1 text-xs text-slate-500">${formatDate(b.search.departDate)} · ${b.reference}</p></div><span class="rounded-full bg-mint px-2.5 py-1 text-xs font-bold">DEMO</span></div><div class="mt-3 flex items-center justify-between text-sm"><span>${escapeHtml(b.passengers.map(p=>p.first+' '+p.last).join(', '))}</span><strong>${money(b.total)}</strong></div><button class="print-saved mt-3 rounded-lg border px-3 py-2 text-sm font-semibold" data-ref="${b.reference}">Print summary</button></article>`).join(''):'<div class="rounded-xl bg-sky p-5 text-center"><p class="font-bold text-ink">No bookings yet</p><p class="mt-1 text-sm text-slate-500">Search flights and complete the demo flow to see a booking here.</p></div>';
      openModal('My demo bookings',`<p class="mb-4 text-sm text-slate-500">Bookings are stored in this browser using localStorage. They are not airline reservations.</p>${content}<button id="closeBookings" class="mt-2 w-full rounded-xl bg-navy px-4 py-3 font-bold text-white">Close</button>`);
      $('closeBookings').addEventListener('click',closeModal);
      document.querySelectorAll('.print-saved').forEach(btn=>btn.addEventListener('click',()=>{const b=bookings.find(x=>x.reference===btn.dataset.ref);if(!b)return;openModal('Print booking',`<div id="printSavedArea" class="rounded-xl bg-sky p-4"><h3 class="text-lg font-bold">${b.reference}</h3><p class="mt-2">${airportNames[b.search.origin]} → ${airportNames[b.search.destination]}</p><p>${formatDate(b.search.departDate)} · ${b.flight.airline}</p><p class="mt-2 font-bold">${money(b.total)} (demo)</p><p class="mt-3 text-xs">Not a real flight reservation.</p></div><button id="printSavedNow" class="mt-4 w-full rounded-xl bg-navy px-4 py-3 font-bold text-white">Print</button>`);$('printSavedNow').addEventListener('click',()=>window.print());}));
    }
    ['navBookings','mobileBookings','viewBookings'].forEach(id=>$(id).addEventListener('click',()=>{showBookings();}));
    function authDemo(kind) {
      const title=kind==='signup'?'Create a demo account':'Sign in to SkyBook';
      openModal(title,`<div class="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Authentication is not connected in this school demo. Do not enter a real password.</div><form id="demoAuth" class="mt-4 space-y-4"><div><label for="demoEmail" class="mb-1 block text-sm font-semibold">Email address</label><input id="demoEmail" type="email" required placeholder="you@example.com" class="w-full rounded-xl border border-slate-300 px-3 py-3" /></div>${kind==='signup'?'<div><label for="demoName" class="mb-1 block text-sm font-semibold">Full name</label><input id="demoName" required class="w-full rounded-xl border border-slate-300 px-3 py-3" placeholder="Your name" /></div>':''}<button class="w-full rounded-xl bg-navy px-4 py-3 font-bold text-white">${kind==='signup'?'Create demo profile':'Continue as demo user'}</button><p id="authMessage" class="hidden text-sm font-semibold text-emerald-700"></p></form>`);
      $('demoAuth').addEventListener('submit',e=>{e.preventDefault();$('authMessage').textContent='Demo only: authentication is not connected. You can still try the flight booking flow.';$('authMessage').classList.remove('hidden');});
    }
    ['signInBtn','mobileSignIn'].forEach(id=>$(id).addEventListener('click',()=>authDemo('signin')));
    ['signUpBtn','mobileSignUp'].forEach(id=>$(id).addEventListener('click',()=>authDemo('signup')));
    $('aboutDemo').addEventListener('click',()=>openModal('How the demo works','<div class="space-y-3 text-sm leading-6 text-slate-600"><p><strong>1.</strong> Search uses sample airport and flight data.</p><p><strong>2.</strong> Passenger fields are validated in your browser.</p><p><strong>3.</strong> Extras and seat choices update the estimated price.</p><p><strong>4.</strong> Payment is simulated; no money is collected.</p><p><strong>5.</strong> Completed demo bookings are stored in this browser with localStorage.</p><p class="rounded-lg bg-amber-50 p-3 text-amber-900">This is not connected to airlines, live inventory, real authentication, or a payment provider.</p></div>'));
    $('printItinerary').addEventListener('click',()=>window.print());
    $('newSearch').addEventListener('click',()=>{ $('bookingWorkspace').classList.add('hidden'); $('searchForm').scrollIntoView({behavior:'smooth',block:'center'}); });
    $('menuToggle').addEventListener('click',()=>{const isHidden=$('mobileMenu').classList.toggle('hidden');$('menuToggle').setAttribute('aria-expanded',String(!isHidden));});
    $('mobileMenu').querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{$('mobileMenu').classList.add('hidden');$('menuToggle').setAttribute('aria-expanded','false');}));
