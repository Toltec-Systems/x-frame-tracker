(function(){
function boot(){
  try{
    var DATA = window.DATA;
    if(!DATA){throw new Error("data.js not loaded");}
    var person = DATA.people[0];
    var dayIdx = 0;
    var days=[]; DATA.slots.forEach(function(s){ if(days.indexOf(s.day)<0) days.push(s.day); });

    function top(t){ var m=String(t||"").split("-"); return parseInt(m[m.length-1],10)||0; }

    function slotInfo(p, slot){
      var rows = DATA.logs.filter(function(l){return l.person===p && l.day===slot.day && l.order===slot.order;});
      var machine=""; for(var i=0;i<rows.length;i++){ if(rows[i].machine){machine=rows[i].machine;break;} }
      var byWeek={};
      rows.forEach(function(r){ if(r.set===1 && r.weight!=null && r.reps!=null) byWeek[r.week]=r; });
      var weeks=Object.keys(byWeek).map(Number).sort(function(a,b){return a-b;});
      var T=top(slot.target), latest=null, trg;
      if(weeks.length) latest=byWeek[weeks[weeks.length-1]];
      if(!latest){ trg={cls:"none",txt:"No Set 1 logged yet"}; }
      else if(latest.reps>T){ var inc=5*Math.ceil((latest.reps-T)/2); trg={cls:"add",txt:"⬆ ADD "+inc+" lb → "+(latest.weight+inc)+" lb"}; }
      else { trg={cls:"hold",txt:"Hold "+latest.weight+" lb — beat reps (>"+T+")"}; }
      return {machine:machine, latest:latest, weeks:weeks, byWeek:byWeek, trg:trg};
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
        var info=slotInfo(person,s);
        var mach = info.machine ? '🏋️ '+info.machine : '🏋️ machine TBD';
        var last = info.latest ? 'Last Set 1: <b>'+info.latest.weight+' × '+info.latest.reps+'</b> <span class="wk">(wk '+info.latest.week+')</span>'
                               : '<span style="color:var(--mut)">Last Set 1: —</span>';
        var hist = info.weeks.length>1 ? '<div class="hist">'+info.weeks.map(function(w){return '<span class="w">W'+w+' <b>'+info.byWeek[w].weight+'×'+info.byWeek[w].reps+'</b></span>';}).join("")+'</div>' : '';
        return '<div class="card"><div class="top"><div><p class="ex">'+s.order+'. '+s.exercise+'</p><div class="mach">'+mach+'</div></div>'+
               '<div class="chip">🎯 '+s.target+'</div></div>'+
               '<div class="last">'+last+'</div>'+hist+
               '<div class="trg '+info.trg.cls+'">'+info.trg.txt+'</div></div>';
      }).join("");
      document.getElementById("foot").innerHTML =
        "Set 1 is the trigger — one rep above the top of the range = add weight next week.<br>Auto-updates when new workout transcripts are logged. · "+DATA.logs.length+" sets on file.";
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