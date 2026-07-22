(function(){
function boot(){
  try{
    var DATA = window.DATA;
    if(!DATA){throw new Error("data.js not loaded");}
    var person = DATA.people[0];
    var dayIdx = 0;
    var days=[]; DATA.slots.forEach(function(s){ if(days.indexOf(s.day)<0) days.push(s.day); });

    function top(t){ var m=String(t||"").split("-"); return parseInt(m[m.length-1],10)||0; }

    // One "track" per machine used for this person+exercise slot. Weights aren't
    // comparable across machines, so each machine keeps its own week-over-week
    // ladder and its own add-weight trigger. The benchmark set for a given week
    // is the FIRST set performed on that machine that week (lowest set number) —
    // sets are numbered continuously across machines, so global "Set 1" won't do.
    function machineTracks(p, slot){
      var rows = DATA.logs.filter(function(l){return l.person===p && l.day===slot.day && l.order===slot.order;});
      var byMachine={};
      rows.forEach(function(r){ var m=r.machine||"machine TBD"; (byMachine[m]=byMachine[m]||[]).push(r); });
      var T=top(slot.target);
      var tracks=Object.keys(byMachine).map(function(m){
        var byWeek={};
        byMachine[m].forEach(function(r){
          if(r.weight==null||r.reps==null) return;
          if(!(r.week in byWeek) || r.set < byWeek[r.week].set) byWeek[r.week]=r; // first set that week
        });
        var weeks=Object.keys(byWeek).map(Number).sort(function(a,b){return a-b;});
        var latest = weeks.length ? byWeek[weeks[weeks.length-1]] : null, trg;
        if(!latest){ trg={cls:"none",txt:"No sets logged yet"}; }
        else if(latest.reps>T){ var inc=5*Math.ceil((latest.reps-T)/2); trg={cls:"add",txt:"⬆ ADD "+inc+" lb → "+(latest.weight+inc)+" lb"}; }
        else { trg={cls:"hold",txt:"Hold "+latest.weight+" lb — beat reps (>"+T+")"}; }
        return {machine:m, byWeek:byWeek, weeks:weeks, latest:latest, trg:trg, e1:(latest?latest.est1rm:null)};
      });
      // most-recently-used machine first, then strongest
      tracks.sort(function(a,b){
        var aw=a.weeks.length?a.weeks[a.weeks.length-1]:0, bw=b.weeks.length?b.weeks[b.weeks.length-1]:0;
        return bw!==aw ? bw-aw : (b.e1||0)-(a.e1||0);
      });
      // flag the machine with the highest est. 1RM (only meaningful when comparing 2+)
      var best=null; tracks.forEach(function(t){ if(t.e1!=null && (best===null||t.e1>best)) best=t.e1; });
      tracks.forEach(function(t){ t.best = (best!==null && t.e1===best && tracks.length>1); });
      return tracks;
    }

    function render(){
      document.getElementById("tabs").innerHTML =
        DATA.people.map(function(p){return '<div class="tab '+(p===person?'on':'')+'" data-p="'+p+'">'+p+'</div>';}).join("");
      document.getElementById("days").innerHTML =
        days.map(function(d,i){return '<div class="day '+(i===dayIdx?'on':'')+'" data-d="'+i+'">'+d.split("—")[0].trim()+'</div>';}).join("");
      var day=days[dayIdx];
      document.getElementById("daytitle").textContent=day;
      var slots=DATA.slots.filter(function(s){return s.day===day;});
      document.getElementById("wrap").innerHTML = slots.map(function(s){
        var tracks=machineTracks(person,s);
        var head='<div class="top"><div><p class="ex">'+s.order+'. '+s.exercise+'</p></div><div class="chip">🎯 '+s.target+'</div></div>';
        var body;
        if(!tracks.length){
          body='<div class="trg none">No sets logged yet</div>';
        } else {
          body=tracks.map(function(t){
            var last = t.latest ? 'Last: <b>'+t.latest.weight+' × '+t.latest.reps+'</b> <span class="wk">(wk '+t.latest.week+')</span>'
                                : '<span style="color:var(--mut)">Last: —</span>';
            var e1 = t.e1!=null ? '<span class="e1'+(t.best?' top':'')+'">1RM '+t.e1+(t.best?' ★':'')+'</span>' : '';
            var hist = t.weeks.length>1 ? '<div class="hist">'+t.weeks.map(function(w){return '<span class="w">W'+w+' <b>'+t.byWeek[w].weight+'×'+t.byWeek[w].reps+'</b></span>';}).join("")+'</div>' : '';
            return '<div class="mtrack'+(t.best?' bestrack':'')+'"><div class="mname">🏋️ '+t.machine+' '+e1+'</div>'+
                   '<div class="last">'+last+'</div>'+hist+
                   '<div class="trg '+t.trg.cls+'">'+t.trg.txt+'</div></div>';
          }).join("");
        }
        return '<div class="card">'+head+body+'</div>';
      }).join("");
      document.getElementById("foot").innerHTML =
        "Each machine tracks its own weight & add-weight trigger (weights aren't comparable across machines).<br>★ = your highest est. 1RM for that lift. First set on a machine is the trigger — one rep above the top of the range = add weight next week.<br>Auto-updates when new workout transcripts are logged. · "+DATA.logs.length+" sets on file.";
    }

    document.getElementById("tabs").addEventListener("click",function(e){var t=e.target.getAttribute("data-p"); if(t){person=t; render();}});
    document.getElementById("days").addEventListener("click",function(e){var d=e.target.getAttribute("data-d"); if(d!==null && d!==undefined){dayIdx=+d; render();}});
    render();
  }catch(err){
    document.getElementById("wrap").innerHTML='<pre style="color:#ff6b6b;white-space:pre-wrap">'+err.message+"\n"+(err.stack||"")+'</pre>';
  }
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
})();