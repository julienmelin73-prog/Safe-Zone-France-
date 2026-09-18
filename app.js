const map=L.map('map').setView([46.6,2.5],6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
const $=id=>document.getElementById(id),RID='44ef4323-1097-48d5-8719-3c544b55d294',API='https://tabular-api.data.gouv.fr/api/resources/'+RID;
const category=$('category'),description=$('description'),coords=$('coords'),reportList=$('reportList'),reportsDialog=$('reportsDialog'),officialFilter=$('officialFilter'),officialStatus=$('officialStatus'),officialResults=$('officialResults');
let selected=null,tempMarker=null,currentOfficial=[];
const reports=JSON.parse(localStorage.getItem('szf_reports')||'[]');
const labels={danger:'Danger / incident',deal:'Activité suspecte / point sensible',road:'Problème de voirie',lighting:'Éclairage insuffisant',other:'Autre vigilance'};
const words={sexual:['sexuel'],violence:['violence physique','intrafamil'],burglary:['cambriol'],theft:['vol'],drugs:['stupéfi'],damage:['dégradation','destruction'],fraud:['escroquer']};
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function markerFor(r){L.marker([r.lat,r.lng]).addTo(map).bindPopup('<b>Signalement communautaire</b><br>'+esc(labels[r.category]||r.category)+'<br>'+esc(r.description));} reports.forEach(markerFor);
function choose(latlng){selected=latlng;if(tempMarker)map.removeLayer(tempMarker);tempMarker=L.marker(latlng).addTo(map);coords.textContent=latlng.lat.toFixed(5)+', '+latlng.lng.toFixed(5);}
map.on('click',e=>choose(e.latlng));$('locate').onclick=()=>map.locate({setView:true,maxZoom:16});map.on('locationfound',e=>choose(e.latlng));
$('reportForm').onsubmit=e=>{e.preventDefault();if(!selected)return alert('Touchez d’abord la carte.');const r={id:Date.now(),category:category.value,description:description.value.trim(),lat:selected.lat,lng:selected.lng,createdAt:new Date().toISOString()};reports.unshift(r);localStorage.setItem('szf_reports',JSON.stringify(reports));markerFor(r);description.value='';if(tempMarker)map.removeLayer(tempMarker);tempMarker=null;selected=null;coords.textContent='Aucun emplacement choisi';alert('Signalement enregistré.');};
$('showReports').onclick=()=>{reportList.innerHTML=reports.length?reports.map(r=>'<div class="report"><b>'+esc(labels[r.category]||r.category)+'</b><p>'+esc(r.description)+'</p></div>').join(''):'<p class="muted">Aucun signalement.</p>';reportsDialog.showModal();}; $('closeReports').onclick=()=>reportsDialog.close();$('newReport').onclick=()=>$('panel').scrollIntoView({behavior:'smooth'});
function findKey(keys,patterns){return keys.find(k=>patterns.some(p=>k.toLowerCase().includes(p)));}
async function loadCommune(name){
 officialStatus.textContent='Recherche de '+name+'…'; officialResults.innerHTML='';
 const gr=await fetch('https://geo.api.gouv.fr/communes?nom='+encodeURIComponent(name)+'&fields=nom,code,centre,population&boost=population&limit=1');
 const gs=await gr.json(); if(!gs.length)throw Error('Commune introuvable');
 const c=gs[0]; if(c.centre?.coordinates)map.setView([c.centre.coordinates[1],c.centre.coordinates[0]],11);
 const pr=await fetch(API+'/profile/'); if(!pr.ok)throw Error('API SSMSI indisponible'); const prof=await pr.json();
 const keys=prof.profile?.header||[]; const codeKey=findKey(keys,['codgeo','code commune','code_commune','code commune insee']);
 if(!codeKey)throw Error('Format SSMSI non reconnu');
 const u=API+'/data/?page_size=100&'+encodeURIComponent(codeKey)+'__exact='+encodeURIComponent(c.code);
 const dr=await fetch(u); if(!dr.ok)throw Error('Lecture SSMSI impossible'); const dj=await dr.json(); currentOfficial=dj.data||[];
 officialStatus.textContent=c.nom+' ('+c.code+') — '+currentOfficial.length+' lignes officielles chargées'; renderOfficial(c.nom);
}
function renderOfficial(commune){
 const f=officialFilter.value, rows=currentOfficial.filter(r=>{if(f==='all')return true;const txt=Object.values(r).join(' ').toLowerCase();return (words[f]||[]).some(w=>txt.includes(w));});
 if(!rows.length){officialResults.innerHTML='<div class="notice">Aucune donnée diffusée pour ce filtre. Cela peut aussi résulter des règles de secret statistique du SSMSI.</div>';return;}
 const keys=Object.keys(rows[0]).filter(k=>k!=='__id'); const indicator=findKey(keys,['indicateur','classe','libellé','libelle']); const year=findKey(keys,['annee','année']); const count=findKey(keys,['nombre','faits','nb_','nb ']); const rate=findKey(keys,['taux']);
 officialResults.innerHTML='<h3>'+esc(commune)+'</h3>'+rows.slice(0,40).map(r=>'<div class="report"><b>'+esc(indicator?r[indicator]:'Indicateur SSMSI')+'</b><br><small>'+(year?'Année '+esc(r[year])+' · ':'')+(count?'Nombre '+esc(r[count])+' · ':'')+(rate?'Taux '+esc(r[rate]):'')+'</small></div>').join('');
}
$('communeForm').onsubmit=async e=>{e.preventDefault();try{await loadCommune($('communeSearch').value.trim())}catch(err){officialStatus.textContent='Erreur : '+err.message;}};
officialFilter.onchange=()=>{if(currentOfficial.length)renderOfficial($('communeSearch').value.trim());};
fetch(API+'/').then(r=>{if(!r.ok)throw 0;officialStatus.textContent='Base nationale SSMSI connectée ✓';}).catch(()=>officialStatus.textContent='Connexion SSMSI temporairement indisponible.');