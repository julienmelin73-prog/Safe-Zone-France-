const map=L.map('map').setView([46.6,2.5],6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
const $=id=>document.getElementById(id);
const category=$('category'),description=$('description'),coords=$('coords'),reportList=$('reportList'),reportsDialog=$('reportsDialog'),officialFilter=$('officialFilter'),officialStatus=$('officialStatus');
let selected=null,tempMarker=null;
const reports=JSON.parse(localStorage.getItem('szf_reports')||'[]');
const labels={danger:'Danger / incident',deal:'Activité suspecte / point sensible',road:'Problème de voirie',lighting:'Éclairage insuffisant',other:'Autre vigilance'};
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function markerFor(r){L.marker([r.lat,r.lng]).addTo(map).bindPopup('<b>Signalement communautaire</b><br>'+escapeHtml(labels[r.category]||r.category)+'<br>'+escapeHtml(r.description));}
reports.forEach(markerFor);
function choose(latlng){selected=latlng;if(tempMarker)map.removeLayer(tempMarker);tempMarker=L.marker(latlng).addTo(map);coords.textContent=latlng.lat.toFixed(5)+', '+latlng.lng.toFixed(5);}
map.on('click',e=>choose(e.latlng));$('locate').onclick=()=>map.locate({setView:true,maxZoom:16});map.on('locationfound',e=>choose(e.latlng));
$('reportForm').onsubmit=e=>{e.preventDefault();if(!selected){alert('Touchez d’abord la carte pour choisir un emplacement.');return}const r={id:Date.now(),category:category.value,description:description.value.trim(),lat:selected.lat,lng:selected.lng,createdAt:new Date().toISOString(),status:'local'};reports.unshift(r);localStorage.setItem('szf_reports',JSON.stringify(reports));markerFor(r);description.value='';if(tempMarker){map.removeLayer(tempMarker);tempMarker=null}selected=null;coords.textContent='Aucun emplacement choisi';alert('Signalement enregistré sur cet appareil.');};
$('showReports').onclick=()=>{reportList.innerHTML=reports.length?reports.map(r=>'<div class="report"><b>'+escapeHtml(labels[r.category]||r.category)+'</b><p>'+escapeHtml(r.description)+'</p><small>'+new Date(r.createdAt).toLocaleString('fr-FR')+'</small></div>').join(''):'<p class="muted">Aucun signalement.</p>';reportsDialog.showModal();};
$('closeReports').onclick=()=>reportsDialog.close();$('newReport').onclick=()=>$('panel').scrollIntoView({behavior:'smooth'});
officialFilter.onchange=()=>{const name=officialFilter.options[officialFilter.selectedIndex].text;officialStatus.textContent='Filtre sélectionné : '+name+'. Import national SSMSI en préparation.';};
fetch('official-data.json').then(r=>r.json()).then(d=>{if(d&&d.length)officialStatus.textContent='Source officielle configurée : Ministère de l’Intérieur / SSMSI. Choisissez un filtre.';}).catch(()=>{});