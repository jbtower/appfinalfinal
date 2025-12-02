import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Home, CreditCard, Zap, DollarSign, X, AlertCircle, Calendar, Wallet, Pencil, Repeat, Layers, PieChart, FileText, Percent, Camera, Eye, TrendingUp, Sparkles, Smile, Download, Upload, Settings, Smartphone, Clock, AlertTriangle, Tag, Receipt, Calculator } from 'lucide-react';

export default function App() {
  
  // --- ESTILOS ---
  useEffect(() => {
    if (!document.getElementById('tailwind-script')) {
      const script = document.createElement('script');
      script.src = "https://cdn.tailwindcss.com";
      script.id = 'tailwind-script';
      document.head.appendChild(script);
    }
  }, []);

  // --- FECHAS ---
  const hoy = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(hoy.getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(hoy.getFullYear());
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const fechaEjemplo = (m) => `${anioSeleccionado}-${String(m+1).padStart(2,'0')}-05`;

  // --- MOTIVACIÓN ---
  const getMotivacion = (porc, saldo) => {
    if (saldo < 0) return { t: "¡Alerta! Gastos > Ingresos 🚨", c: "bg-red-100 text-red-700" };
    if (porc === 100) return { t: "¡Mes Completado! 🎉", c: "bg-green-100 text-green-700" };
    if (porc > 75) return { t: "¡Falta poco! 💪", c: "bg-blue-100 text-blue-700" };
    return { t: "Controla tu dinero ✨", c: "bg-gray-100 text-gray-600" };
  };

  // --- ESTADO ---
  const [pagos, setPagos] = useState(() => {
    const g = localStorage.getItem('finanzas_v15_gastos');
    return g ? JSON.parse(g) : [{ 
      id: 3, 
      concepto: 'Visa Oro', 
      monto: 450000, 
      fecha: fechaEjemplo(mesSeleccionado), 
      categoria: 'tarjeta', 
      estado: 'pendiente', 
      pagoMinimo: 150000, 
      deudaConInteres: 2000000, 
      deudaSinInteres: 1500000,
      gastosTarjeta: 85000 
    }];
  });
  const [ingresos, setIngresos] = useState(() => {
    const i = localStorage.getItem('finanzas_v15_ingresos');
    return i ? JSON.parse(i) : [{ id: 101, concepto: 'Salario', monto: 5000000, fecha: fechaEjemplo(mesSeleccionado) }];
  });
  const [backupDate, setBackupDate] = useState(localStorage.getItem('finanzas_backup_date') || 'Nunca');

  // UI
  const [modal, setModal] = useState(false);
  const [modalPago, setModalPago] = useState(null);
  const [modalImg, setModalImg] = useState(null);
  const [modalMenu, setModalMenu] = useState(false);
  const [modalAnual, setModalAnual] = useState(false); // Nuevo modal resumen anual
  const [vistaCat, setVistaCat] = useState(false);
  const [tab, setTab] = useState('gasto'); 
  const [filtro, setFiltro] = useState('todos');

  // FORMULARIO
  const [form, setForm] = useState({ 
    id:null, concepto:'', monto:'', fecha:'', categoria:'otros', 
    repetir:false, repetirMonto:true, modoEdit:'solo', 
    pagoMinimo:0, deudaConInteres:0, deudaSinInteres:0, gastosTarjeta:0, linea:0 
  });
  const [pagoData, setPagoData] = useState({ fecha: '', metodo: '', comp: '', img: null });
  const fileInput = useRef(null);
  const backupInput = useRef(null);

  // --- PERSISTENCIA ---
  useEffect(() => { localStorage.setItem('finanzas_v15_gastos', JSON.stringify(pagos)); }, [pagos]);
  useEffect(() => { localStorage.setItem('finanzas_v15_ingresos', JSON.stringify(ingresos)); }, [ingresos]);
  useEffect(() => { localStorage.setItem('finanzas_backup_date', backupDate); }, [backupDate]);

  // --- BACKUP ---
  const exportarDatos = () => {
    const data = { gastos: pagos, ingresos: ingresos, date: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `backup_finanzas_${new Date().toLocaleDateString('es-PY').replace(/\//g,'-')}.json`;
    a.click(); setBackupDate(new Date().toLocaleString());
  };

  const restoreBackup = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if(d.gastos && d.ingresos && confirm("⚠️ Se reemplazarán tus datos actuales. ¿Seguro?")) {
          setPagos(d.gastos); setIngresos(d.ingresos); setBackupDate('Recién restaurado'); alert("¡Datos restaurados!");
        }
      } catch(err) { alert("Archivo inválido"); }
      setMenu(false);
    };
    reader.readAsText(file);
  };

  // --- LÓGICA ---
  const filtrados = (list) => list.filter(i => {
    const f = new Date(i.fecha + 'T00:00:00');
    return f.getMonth() === mesSeleccionado && f.getFullYear() === anioSeleccionado;
  });

  const pagosMes = filtrados(pagos).filter(p => filtro==='todos' || (filtro==='pagados' ? p.estado==='pagado' : p.estado==='pendiente')).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
  const ingresosMes = filtrados(ingresos);

  const totalG = pagosMes.reduce((a,b)=>a+(parseFloat(b.monto)||0),0);
  const totalI = ingresosMes.reduce((a,b)=>a+(parseFloat(b.monto)||0),0);
  const pagado = pagosMes.filter(p=>p.estado==='pagado').reduce((a,b)=>a+(parseFloat(b.monto)||0),0);
  const disp = totalI - pagado;
  const proy = totalI - totalG;
  const porc = totalG===0 ? 0 : Math.round((pagado/totalG)*100);
  const mot = getMotivacion(porc, proy);
  const fmt = (n) => new Intl.NumberFormat('es-PY').format(n);
  
  // CÁLCULOS DE DEUDA TC Y GASTOS FINANCIEROS
  const tarjetas = pagosMes.filter(p => p.categoria === 'tarjeta');
  const totalDeudaCon = tarjetas.reduce((a,b) => a + (parseFloat(b.deudaConInteres)||0), 0);
  const totalDeudaSin = tarjetas.reduce((a,b) => a + (parseFloat(b.deudaSinInteres)||0), 0);
  const totalGastosTarjetaMes = tarjetas.reduce((a,b) => a + (parseFloat(b.gastosTarjeta)||parseFloat(b.interes)||0), 0);
  const deudaTotalTC = totalDeudaCon + totalDeudaSin;

  // CÁLCULOS ANUALES
  const calcularResumenAnual = () => {
      const pagosAnio = pagos.filter(p => {
          const f = new Date(p.fecha + 'T00:00:00');
          return f.getFullYear() === anioSeleccionado;
      });
      
      // 1. Gastos Recurrentes (tienen groupId)
      const gastosRecurrentes = pagosAnio.filter(p => p.groupId).reduce((a,b) => a + (parseFloat(b.monto)||0), 0);
      
      // 2. Gastos/Intereses de Tarjetas Anuales
      const gastosTarjetasAnual = pagosAnio.filter(p => p.categoria === 'tarjeta').reduce((a,b) => a + (parseFloat(b.gastosTarjeta)||parseFloat(b.interes)||0), 0);

      return { gastosRecurrentes, gastosTarjetasAnual, totalAnual: pagosAnio.reduce((a,b)=>a+(parseFloat(b.monto)||0),0) };
  };

  const resumenAnual = calcularResumenAnual();

  const guardar = () => {
    if(!form.concepto) return;
    const base = { concepto:form.concepto, monto:parseFloat(form.monto||0), fecha:form.fecha };
    const list = tab==='ingreso' ? ingresos : pagos;
    const setList = tab==='ingreso' ? setIngresos : setPagos;
    const extra = tab==='ingreso' ? {} : { 
       categoria:form.categoria, estado:'pendiente', 
       pagoMinimo:parseFloat(form.pagoMinimo||0), 
       deudaConInteres:parseFloat(form.deudaConInteres||0), 
       deudaSinInteres:parseFloat(form.deudaSinInteres||0),
       gastosTarjeta:parseFloat(form.gastosTarjeta||0), 
       linea:parseFloat(form.linea||0) 
    };

    let newItems = [];
    if(form.repetir && !form.id) {
      const gid = Date.now();
      const fb = new Date(form.fecha+'T00:00:00');
      for(let m=fb.getMonth(); m<=11; m++) {
        const fStr = `${fb.getFullYear()}-${String(m+1).padStart(2,'0')}-${String(fb.getDate()).padStart(2,'0')}`;
        const mont = (m===fb.getMonth() || form.repetirMonto) ? base.monto : 0;
        newItems.push({ ...base, ...extra, fecha:fStr, monto:mont, groupId:gid, id:Date.now()+m });
      }
    } else {
      newItems.push({ ...base, ...extra, id:form.id||Date.now() });
    }

    if(form.id) {
      if(form.groupId && form.modoEdit==='todos') {
        const fOrig = new Date(form.fecha+'T00:00:00');
        setList(list.map(i => (i.groupId === form.groupId && new Date(i.fecha+'T00:00:00') >= fOrig) ? { ...i, ...base, ...extra, fecha:i.fecha } : i));
      } else {
        setList(list.map(i => i.id===form.id ? { ...i, ...base, ...extra } : i));
      }
    } else {
      setList([...list, ...newItems]);
    }
    setModal(false);
  };

  const borrar = (id) => {
    if(confirm("¿Borrar?")) {
      if(tab==='ingreso') setIngresos(ingresos.filter(i=>i.id!==id));
      else setPagos(pagos.filter(p=>p.id!==id));
    }
  };

  const confirmarPago = () => {
    setPagos(pagos.map(p => p.id===modalPago ? { ...p, estado:'pagado', pagoInfo:pagoData } : p));
    setModalPago(null);
  };

  const handleImg = (e) => {
    const f = e.target.files[0];
    if(f) {
      const r = new FileReader();
      r.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas'); const ctx = c.getContext('2d');
          let w=img.width; let h=img.height; if(w>800){ h*=800/w; w=800; }
          c.width=w; c.height=h; ctx.drawImage(img,0,0,w,h);
          setPagoData(d => ({...d, img:c.toDataURL('image/jpeg',0.6)}));
        };
        img.src = ev.target.result;
      };
      r.readAsDataURL(f);
    }
  };

  const getIcon = (c) => {
    if(c==='vivienda') return <Home size={18} className="text-blue-500"/>;
    if(c==='tarjeta') return <CreditCard size={18} className="text-purple-500"/>;
    if(c==='servicios') return <Zap size={18} className="text-yellow-500"/>;
    return <DollarSign size={18} className="text-green-500"/>;
  };

  const abrirEditar = (item, tipo) => {
      setTab(tipo);
      setForm({
        id: item.id, groupId: item.groupId, concepto: item.concepto, monto: item.monto, fecha: item.fecha, categoria: item.categoria || 'otros',
        repetir: false, repetirMonto: true, modoEdit:'solo',
        pagoMinimo: item.pagoMinimo || 0,
        deudaConInteres: item.deudaConInteres !== undefined ? item.deudaConInteres : (item.deudaCuotas || 0),
        deudaSinInteres: item.deudaSinInteres || 0,
        gastosTarjeta: item.gastosTarjeta !== undefined ? item.gastosTarjeta : (item.interes || 0),
        linea: item.linea || 0
      });
      setModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      {/* HEADER */}
      <div className="bg-white sticky top-0 z-20 border-b border-gray-100 shadow-sm">
        <div className={`px-4 py-2 text-xs font-bold text-center flex justify-center gap-2 ${mot.c}`}><Sparkles size={14}/> {mot.t}</div>
        <div className="p-4 pt-3">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <button onClick={()=>setMenu(true)} className="p-2 bg-gray-100 rounded-full"><Settings size={18}/></button>
              <div className="flex items-center bg-gray-50 rounded-lg px-2 border"><span className="text-[10px] font-bold uppercase mr-1 text-gray-400">Año</span><input type="number" value={anioSeleccionado} onChange={e=>setAnioSeleccionado(Number(e.target.value))} className="w-14 bg-transparent font-black text-center outline-none"/></div>
            </div>
            <div className="text-right"><button onClick={()=>setModalAnual(true)} className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded border border-blue-100 flex items-center gap-1"><Calendar size={12}/> Resumen Anual</button></div>
          </div>
          <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
            {meses.map((m,i) => <button key={i} onClick={()=>setMesSeleccionado(i)} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${mesSeleccionado===i?'bg-gray-900 text-white':'bg-gray-100 text-gray-500'}`}>{m}</button>)}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* BILLETERA & DEUDA TC */}
        {!vistaCat && <div className="space-y-3">
          {/* Billetera Azul */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
            <Wallet className="absolute top-0 right-0 p-4 opacity-10" size={100}/>
            <div className="relative z-10 flex justify-between items-start">
              <div><div className="text-gray-400 text-xs font-bold uppercase mb-1">Disponible</div><h2 className="text-3xl font-black">Gs. {fmt(disp)}</h2></div>
              <button onClick={()=>{setTab('ingreso'); setForm({id:null, concepto:'', monto:'', fecha:fechaEjemplo(mesSeleccionado)}); setModal(true)}} className="bg-white/10 p-2 rounded-lg"><Plus/></button>
            </div>
            {ingresosMes.length > 0 && <div className="mt-4 space-y-2 relative z-10 border-t border-white/10 pt-2">
                {ingresosMes.map(i => (
                  <div key={i.id} className="flex justify-between text-xs opacity-80"><span>{i.concepto}</span><span className="font-bold">+{fmt(i.monto)}</span></div>
                ))}
            </div>}
          </div>

          {/* Tarjeta Deuda TC (Naranja) */}
          {deudaTotalTC > 0 && (
             <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex gap-2 items-center text-orange-800 font-bold uppercase text-xs"><CreditCard size={14}/> Deuda Total Tarjetas</div>
                    <div className="font-black text-orange-900 text-lg">Gs. {fmt(deudaTotalTC)}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white/60 p-2 rounded border border-orange-100 flex flex-col justify-between">
                        <div className="text-red-500 font-bold mb-0.5 text-[9px] uppercase">Con Int.</div>
                        <div className="font-bold text-gray-700 text-xs">{fmt(totalDeudaCon)}</div>
                    </div>
                    <div className="bg-white/60 p-2 rounded border border-orange-100 flex flex-col justify-between">
                        <div className="text-green-600 font-bold mb-0.5 text-[9px] uppercase">Sin Int.</div>
                        <div className="font-bold text-gray-700 text-xs">{fmt(totalDeudaSin)}</div>
                    </div>
                    <div className="bg-red-100/50 p-2 rounded border border-red-200 flex flex-col justify-between">
                        <div className="text-red-700 font-bold mb-0.5 text-[9px] uppercase">Gastos Mes</div>
                        <div className="font-black text-red-700 text-xs">{fmt(totalGastosTarjetaMes)}</div>
                    </div>
                </div>
                {totalGastosTarjetaMes > 100000 && <div className="mt-2 text-[10px] text-red-600 font-bold flex items-center gap-1 bg-red-50 p-1 rounded px-2"><AlertTriangle size={10}/> ¡Ojo! Evalúa un préstamo para cancelar.</div>}
             </div>
          )}
        </div>}

        {/* GASTOS */}
        <div>
          <div className="flex justify-between items-end mb-2">
             <h3 className="font-bold flex gap-2 items-center"><Layers size={18}/> Gastos</h3>
             <div className="text-xs text-gray-500">Pagado: <span className="text-blue-600 font-bold">{porc}%</span></div>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mb-4"><div className={`h-full rounded-full transition-all duration-500 ${porc===100?'bg-green-500':'bg-blue-600'}`} style={{width:`${porc}%`}}></div></div>
          
          {!vistaCat && <div className="flex gap-2 mb-4">
             <div className="flex gap-2 flex-1 overflow-x-auto no-scrollbar">{['todos','pendientes','pagados'].map(f=><button key={f} onClick={()=>setFiltro(f)} className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${filtro===f?'bg-blue-100 text-blue-700':'bg-white border text-gray-400'}`}>{f}</button>)}</div>
             <button onClick={()=>setVistaCat(true)} className="bg-white border p-1.5 rounded text-gray-500"><PieChart size={20}/></button>
          </div>}

          {vistaCat ? (
             <div className="space-y-3">
               {['vivienda','tarjeta','servicios','otros'].map(c => {
                  const t = filtrados(pagos).filter(p=>p.categoria===c).reduce((a,b)=>a+(parseFloat(b.monto)||0),0);
                  if(t===0) return null;
                  return <div key={c} className="bg-white p-4 rounded-xl border flex justify-between shadow-sm"><div className="flex gap-2 items-center"><div className="p-2 bg-gray-50 rounded-lg">{getIcon(c)}</div><span className="capitalize font-bold text-gray-700">{c}</span></div><span className="font-bold">Gs. {fmt(t)}</span></div>
               })}
               <button onClick={()=>setVistaCat(false)} className="w-full py-3 bg-blue-50 text-blue-600 font-bold rounded-xl mt-4">Volver</button>
             </div>
          ) : (
             <div className="space-y-3">
               {pagosMes.map(p => {
                  const diff = Math.ceil((new Date(p.fecha+'T00:00:00') - hoy)/86400000);
                  const st = p.estado==='pagado' ? {bg:'bg-gray-50', t:'text-gray-400', l:'Pagado'} : (diff<0?{bg:'bg-red-50', t:'text-red-700', l:`Venció ${Math.abs(diff)}d`}:(diff<=3?{bg:'bg-yellow-50', t:'text-yellow-700', l:`Vence ${diff}d`}:{bg:'bg-green-50', t:'text-green-700', l:'En fecha'}));
                  const isT = p.categoria==='tarjeta';
                  const deudaCon = parseFloat(p.deudaConInteres || p.deudaCuotas || 0);
                  const deudaSin = parseFloat(p.deudaSinInteres || 0);
                  const gastosT = parseFloat(p.gastosTarjeta || p.interes || 0);
                  const totalDeudaItem = deudaCon + deudaSin;

                  return (
                    <div key={p.id} className={`p-4 rounded-xl border ${isT ? 'border-orange-200' : 'border-gray-100'} shadow-sm relative ${st.bg}`}>
                       <div className="flex justify-between items-start">
                          <div className="flex gap-3 items-center">
                             <button onClick={()=>{
                                if(p.estado==='pagado') { setPagos(pagos.map(i=>i.id===p.id?{...i,estado:'pendiente',pagoInfo:null}:i)) }
                                else { setModalPago(p.id); setPagoData({fecha:new Date().toISOString().split('T')[0], metodo:'', comp:'', img:null}); }
                             }}>{p.estado==='pagado'?<CheckCircle className="text-green-600"/>:<Circle className="opacity-50"/>}</button>
                             <div><div className={`font-bold leading-tight ${p.estado==='pagado'?'line-through':''}`}>{p.concepto}</div>
                             <div className="text-[10px] uppercase font-bold opacity-70 mt-1">{p.categoria} | {st.l} | {new Date(p.fecha).toLocaleDateString('es-PY',{day:'numeric',month:'short'})}</div></div>
                          </div>
                          <div className="flex flex-col gap-2">
                             <button onClick={()=>abrirEditar(p, 'gasto')} className="bg-white p-1 rounded border text-blue-400"><Pencil size={14}/></button>
                             <button onClick={()=>borrar(p.id)} className="bg-white p-1 rounded border text-red-300"><Trash2 size={14}/></button>
                          </div>
                       </div>
                       <div className="pl-9 mt-2">
                           {isT ? (
                              <div className="space-y-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs text-gray-500">A Pagar Hoy:</span>
                                    <span className="text-2xl font-black text-gray-800">Gs. {fmt(p.monto)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] bg-white/60 p-2 rounded border border-orange-100">
                                   <div className="flex-1"><span className="block text-gray-400">Mínimo</span><span className="font-bold text-orange-700">{fmt(p.pagoMinimo||0)}</span></div>
                                   <div className="w-px h-6 bg-orange-200"></div>
                                   <div className="flex-1"><span className="block text-gray-400">Deuda Total</span><span className="font-bold text-gray-700">{fmt(totalDeudaItem)}</span></div>
                                </div>
                                <div className="text-[9px] flex justify-between text-gray-500 px-1"><span>C/Int: {fmt(deudaCon)}</span><span>S/Int: {fmt(deudaSin)}</span></div>
                                {gastosT > 0 ? <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold justify-end bg-red-50 px-2 py-1 rounded border border-red-100 w-fit ml-auto"><Receipt size={10}/> Gastos: {fmt(gastosT)}</div> : <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold justify-end bg-green-50 px-2 py-1 rounded border border-green-100 w-fit ml-auto"><Tag size={10}/> Sin Gastos</div>}
                              </div>
                           ) : (<div className="text-2xl font-black">Gs. {fmt(p.monto)}</div>)}
                       </div>
                       {p.estado==='pagado' && p.pagoInfo?.img && <div className="pl-9 mt-2"><button onClick={()=>setModalImg(p.pagoInfo.img)} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold flex gap-1 items-center"><Eye size={10}/> Ver Foto</button></div>}
                    </div>
                  )
               })}
             </div>
          )}
        </div>
      </div>
      
      <button onClick={()=>{setTab('gasto'); setForm({id:null, concepto:'', monto:'', fecha:fechaEjemplo(mesSeleccionado), categoria:'otros', repetir:false, repetirMonto:true}); setModal(true)}} className="fixed bottom-6 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform"><Plus size={28}/></button>

      {/* MODAL EDIT */}
      {modal && <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
         <div className="bg-white w-full max-w-sm rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4"><h3 className="font-bold text-lg">{form.id?'Editar':'Nuevo'}</h3><button onClick={()=>setModal(false)}><X/></button></div>
            {!form.id && <div className="flex bg-gray-100 p-1 rounded-lg mb-4"><button onClick={()=>setTab('gasto')} className={`flex-1 py-1 text-sm font-bold rounded ${tab==='gasto'?'bg-white shadow':''}`}>Gasto</button><button onClick={()=>setTab('ingreso')} className={`flex-1 py-1 text-sm font-bold rounded ${tab==='ingreso'?'bg-white shadow text-green-600':''}`}>Ingreso</button></div>}
            <div className="space-y-3">
               {tab==='gasto' && <div className="grid grid-cols-4 gap-2">{['vivienda','tarjeta','servicios','otros'].map(c=><button key={c} onClick={()=>setForm({...form, categoria:c})} className={`p-2 rounded border text-[10px] font-bold uppercase ${form.categoria===c?'border-blue-500 bg-blue-50 text-blue-600':'border-gray-100 text-gray-400'}`}>{getIcon(c)}</button>)}</div>}
               <input placeholder="Concepto" className="w-full p-3 bg-gray-50 rounded border" value={form.concepto} onChange={e=>setForm({...form, concepto:e.target.value})}/>
               {tab==='gasto' && form.categoria==='tarjeta' ? (
                  <div className="bg-blue-50 p-3 rounded-xl space-y-2 border border-blue-100">
                     <div className="text-xs font-bold text-blue-800 uppercase mb-1">Datos de la Tarjeta</div>
                     <div><label className="text-[10px] text-gray-500">A Pagar Hoy (Total del Mes)</label><input type="number" placeholder="Monto a pagar" className="w-full p-2 bg-white rounded border font-bold" value={form.monto} onChange={e=>setForm({...form, monto:e.target.value})}/></div>
                     <div className="flex gap-2">
                        <div className="flex-1"><label className="text-[10px] text-gray-500">Pago Mínimo</label><input type="number" placeholder="Mínimo" className="w-full p-2 bg-white rounded border text-xs" value={form.pagoMinimo} onChange={e=>setForm({...form, pagoMinimo:e.target.value})}/></div>
                        <div className="flex-1"><label className="text-[10px] text-red-600 font-bold">Gastos/Intereses</label><input type="number" placeholder="0" className="w-full p-2 bg-white rounded border text-xs text-red-600 font-bold" value={form.gastosTarjeta} onChange={e=>setForm({...form, gastosTarjeta:e.target.value})}/></div>
                     </div>
                     <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-100/50">
                        <div><label className="text-[9px] text-gray-500">Deuda C/ Interés</label><input type="number" className="w-full p-2 bg-white rounded border text-xs" value={form.deudaConInteres} onChange={e=>setForm({...form, deudaConInteres:e.target.value})}/></div>
                        <div><label className="text-[9px] text-gray-500">Deuda S/ Interés (0%)</label><input type="number" className="w-full p-2 bg-white rounded border text-xs" value={form.deudaSinInteres} onChange={e=>setForm({...form, deudaSinInteres:e.target.value})}/></div>
                     </div>
                     <div><label className="text-[10px] text-gray-500">Vencimiento</label><input type="date" className="w-full p-2 bg-white rounded border" value={form.fecha} onChange={e=>setForm({...form, fecha:e.target.value})}/></div>
                  </div>
               ) : (
                  <div className="flex gap-2"><input type="number" placeholder="Monto" className="w-full p-3 bg-gray-50 rounded border font-bold" value={form.monto} onChange={e=>setForm({...form, monto:e.target.value})}/><input type="date" className="w-full p-3 bg-gray-50 rounded border" value={form.fecha} onChange={e=>setForm({...form, fecha:e.target.value})}/></div>
               )}
               {!form.id && <div className="pt-2 border-t text-xs"><label className="flex gap-2"><input type="checkbox" checked={form.repetir} onChange={()=>setForm({...form, repetir:!form.repetir})}/> Repetir todo el año</label>{form.repetir && <div className="ml-5 flex gap-3 mt-1"><label><input type="radio" checked={form.repetirMonto} onChange={()=>setForm({...form, repetirMonto:true})}/> Mismo monto</label><label><input type="radio" checked={!form.repetirMonto} onChange={()=>setForm({...form, repetirMonto:false})}/> Monto 0</label></div>}</div>}
               <button onClick={guardar} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl mt-2">Guardar</button>
            </div>
         </div>
      </div>}

      {modalPago && <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
         <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center space-y-4">
            <h3 className="font-bold text-lg">Confirmar Pago</h3>
            <input type="date" className="w-full p-2 border rounded" value={pagoData.fecha} onChange={e=>setPagoData({...pagoData, fecha:e.target.value})}/>
            <input placeholder="Medio" className="w-full p-2 border rounded" value={pagoData.metodo} onChange={e=>setPagoData({...pagoData, metodo:e.target.value})}/>
            <input placeholder="Comprobante" className="w-full p-2 border rounded" value={pagoData.comp} onChange={e=>setPagoData({...pagoData, comp:e.target.value})}/>
            <div onClick={()=>fileInput.current.click()} className="p-4 border-2 border-dashed rounded cursor-pointer text-gray-400">{pagoData.img?<img src={pagoData.img} className="h-20 mx-auto"/>:<Camera className="mx-auto"/>}</div>
            <input type="file" ref={fileInput} hidden onChange={handleImg} accept="image/*"/>
            <div className="flex gap-2"><button onClick={()=>setModalPago(null)} className="flex-1 py-2 bg-gray-100 rounded font-bold">Cancelar</button><button onClick={confirmarPago} className="flex-1 py-2 bg-green-600 text-white rounded font-bold">Pagar</button></div>
         </div>
      </div>}

      {modalAnual && <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={()=>setModalAnual(false)}>
         <div className="bg-white w-full max-w-sm rounded-2xl p-6 space-y-4 animate-in slide-in-from-bottom-5" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-center"><h3 className="font-bold text-xl text-gray-800">Resumen {anioSeleccionado}</h3><button onClick={()=>setModalAnual(false)}><X/></button></div>
            <div className="space-y-3 text-sm">
               <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-blue-800 font-bold text-xs uppercase mb-1">Gastos Fijos/Recurrentes</p>
                  <p className="text-2xl font-black text-gray-800">Gs. {fmt(resumenAnual.gastosRecurrentes)}</p>
                  <p className="text-xs text-gray-500 mt-1">Suma de alquileres, servicios, etc.</p>
               </div>
               <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-red-800 font-bold text-xs uppercase mb-1">Gastos/Intereses Tarjetas</p>
                  <p className="text-2xl font-black text-red-600">Gs. {fmt(resumenAnual.gastosTarjetasAnual)}</p>
                  <p className="text-xs text-gray-500 mt-1">Dinero "perdido" en comisiones.</p>
               </div>
               <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200">
                  <div className="flex items-start gap-2"><Calculator size={16} className="mt-0.5 text-gray-400"/>
                  <p>Si tus reintegros anuales no superan los <strong>Gs. {fmt(resumenAnual.gastosTarjetasAnual)}</strong>, estás perdiendo dinero con tus tarjetas.</p></div>
               </div>
            </div>
            <button onClick={()=>setModalAnual(false)} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl">Entendido</button>
         </div>
      </div>}

      {modalMenu && <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={()=>setModalMenu(false)}>
         <div className="bg-white w-full max-w-sm rounded-2xl p-6 space-y-3" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold text-xl">Configuración</h3>
            <p className="text-xs text-gray-400 mb-4 flex gap-1"><Clock size={12}/> Última copia: {backupDate}</p>
            <button onClick={exportarDatos} className="w-full p-4 bg-blue-50 rounded-xl flex gap-3 items-center"><Download className="text-blue-600"/> <div className="text-left"><div className="font-bold">Guardar Copia</div><div className="text-xs text-gray-500">Descargar mis datos</div></div></button>
            <div className="relative"><input type="file" ref={backupInput} hidden onChange={restoreBackup} accept=".json"/><button onClick={()=>backupInput.current.click()} className="w-full p-4 bg-green-50 rounded-xl flex gap-3 items-center"><Upload className="text-green-600"/> <div className="text-left"><div className="font-bold">Restaurar</div><div className="text-xs text-gray-500">Cargar archivo</div></div></button></div>
            <button onClick={()=>setModalMenu(false)} className="w-full py-3 font-bold text-gray-400 mt-4">Cerrar</button>
         </div>
      </div>}

      {modalImg && <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4" onClick={()=>setModalImg(null)}><button className="absolute top-4 right-4 text-white"><X/></button><img src={modalImg} className="max-h-screen rounded"/></div>}
    </div>
  );
}