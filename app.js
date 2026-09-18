const map=L.map('map').setView([46.6,2.5],6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
let selected=null; let tempMarker=null;
const reports=JSON.parse(localStorage.getItem('szf_reports')||'[]');
const labels={danger:'Danger / incident',deal:'Activité suspecte / point sensible',road:'Problème de voirie',lighting:'Éclairage insuffisant',other:'Autre vigilance'};
function markerFor(r){L.marker([r.lat,r.lng]).addTo(map).bindPopup('<b>'+labels[r.category]+'</b><br>'+escapeHtml(r.description));}
reports.forEach(markerFor);
function choose(latlng){selected=latlng;if(tempMarker)map.removeLayer(tempMarker);tempMarker=L.marker(latlng).addTo(map);document.querySelector('#coords').textContent=latlng.lat.toFixed(5)+', '+latlng.lng.toFixed(5);}
map.on('click',e=>choose(e.latlng));
document.querySelector('#locate').onclick=()=>map.locate({setView:true,maxZoom:16});
map.on('locationfound',e=>choose(e.latlng));
document.querySelector('#reportForm').onsubmit=e=>{e.preventDefault();if(!selected){alert('Touchez d’abord la carte pour choisir un emplacement.');return}const r={id:Date.now(),category:category.value,description:description.value.trim(),lat:selected.lat,lng:selected.lng,createdAt:new Date().toISOString(),status:'local'};reports.unshift(r);localStorage.setItem('szf_reports',JSON.stringify(reports));markerFor(r);description.value='';if(tempMarker){map.removeLayer(tempMarker);tempMarker=null}selected=null;coords.textContent='Aucun emplacement choisi';alert('Signalement enregistré sur cet appareil.');};
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
document.querySelector('#showReports').onclick=()=>{reportList.innerHTML=reports.length?reports.map(r=>'<div class="report"><b>'+labels[r.category]+'</b><p>'+escapeHtml(r.description)+'</p><small>'+new Date(r.createdAt).toLocaleString('fr-FR')+'</small></div>').join(''):'<p class="muted">Aucun signalement.</p>';reportsDialog.showModal();};
document.querySelector('#closeReports').onclick=()=>reportsDialog.close();
document.querySelector('#newReport').onclick=()=>document.querySelector('#panel').scrollIntoView({behavior:'smooth'});
