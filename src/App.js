import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Home, CreditCard, Zap, DollarSign, X, AlertCircle, Calendar, Wallet, Pencil, Repeat, Layers, PieChart, FileText, Percent, Camera, Eye, TrendingUp, Sparkles, Smile, Download, Upload, Settings, Smartphone, Clock, AlertTriangle, Tag, Receipt, Calculator, LayoutList, ChevronRight, TrendingDown } from 'lucide-react';

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
    const g = localStorage.getItem('finanzas_v16_gastos');
    return g ? JSON.parse(g) : [{ 
      id: 3, 
      concepto: 'Visa Signature', 
      monto: 1500000, 
      fecha: fechaEjemplo(mesSeleccionado), 
      categoria: 'tarjeta', 
      estado: 'pendiente', 
      pagoMinimo: 350000, 
      deudaActual: 1500000, 
      lineaCredito: 15000000,
      deudaTotal: 5000000, 
      gastosTarjeta: 0
    }];
  });
  const [ingresos, setIngresos] = useState(() => {
    const i = localStorage.getItem('finanzas_v16_ingresos');
    return i ? JSON.parse(i) : [{ id: 101, concepto: 'Salario', monto: 5000000, fecha: fechaEjemplo(mesSeleccionado) }];
  });
  const [backupDate, setBackupDate] = useState(localStorage.getItem('finanzas_backup_date') || 'Nunca');

  // UI
  const [modal, setModal] = useState(false);
  const [modalPago, setModalPago] = useState(null);
  const [modalImg, setModalImg] = useState(null);
  const [modalMenu, setModalMenu] = useState(false);
  const [modalAnual, setModalAnual] = useState(false);
  
  const [vistaActual, setVistaActual] = useState('gastos'); 
  const [tab, setTab] = useState('gasto'); 
  const [filtro, setFiltro] = useState('todos');

  // FORMULARIO
  const [form, setForm] = useState({ 
    id:null, concepto:'', monto:'', fecha:'', categoria:'otros', 
    repetir:false, repetirMonto:true, modoEdit:'solo', 
    pagoMinimo:0, deudaActual:0, deudaTotal:0, gastosTarjeta:0, lineaCredito:0 
  });
  const [pagoData, setPagoData] = useState({ fecha: '', metodo: '', comp: '', img: null });
  const fileInput = useRef(null);
  const backupInput = useRef(null);

  // --- PERSISTENCIA ---
  useEffect(() => { localStorage.setItem('finanzas_v16_gastos', JSON.stringify(pagos)); }, [pagos]);
  useEffect(() => { localStorage.setItem('finanzas_v16_ingresos', JSON.stringify(ingresos)); }, [ingresos]);
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
      setModalMenu(false);
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
  
  // DATA TARJETAS
  const tarjetas = pagosMes.filter(p => p.categoria === 'tarjeta');

  const guardar = () => {
    if(!form.concepto) return;
    const base = { concepto:form.concepto, monto:parseFloat(form.monto||0), fecha:form.fecha };
    const list = tab==='ingreso' ? ingresos : pagos;
    const setList = tab==='ingreso' ? setIngresos : setPagos;
    const extra = tab==='ingreso' ? {} : { 
       categoria:form.categoria, estado:'pendiente', 
       pagoMinimo:parseFloat(form.pagoMinimo||0), 
       deudaActual:parseFloat(form.deudaActual||0),
       deudaTotal:parseFloat(form.deudaTotal||0),
       gastosTarjeta:parseFloat(form.gastosTarjeta||0), 
       lineaCredito:parseFloat(form.lineaCredito||0) 
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
      // Compatibilidad con versiones anteriores
      const deudaTot = item.deudaTotal || item.deudaCuotas || ((parseFloat(item.deudaConInteres||0) + parseFloat(item.deudaSinInteres||0))) || 0;
      const gastosT = item.gastosTarjeta || item.interes || 0;

      setForm({
        id: item.id, groupId: item.groupId, concepto: item.concepto, monto: item.monto, fecha: item.fecha, categoria: item.categoria || 'otros',
        repetir: false, repetirMonto: true, modoEdit:'solo',
        pagoMinimo: item.pagoMinimo || 0,
        deudaActual: item.deudaActual || item.monto || 0,
        deudaTotal: deudaTot,
        gastosTarjeta: gastosT,
        lineaCredito: item.lineaCredito || 0
      });
      setModal(true);
  };

  // --- RENDERIZADO DE TARJETAS ---
  const renderTarjetasTab = () => (
    <div className="space-y-4 pb-20">
      {tarjetas.length === 0 && (
        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
          <CreditCard size={48} className="mx-auto mb-2 opacity-20"/>
          <p>No tienes tarjetas registradas este mes.</p>
        </div>
      )}
      
      {tarjetas.map(t => {
        // Adaptación de datos viejos al vuelo
        const linea = parseFloat(t.lineaCredito || 0);
        const deudaTot = parseFloat(t.deudaTotal || t.deudaCuotas || ((parseFloat(t.deudaConInteres||0) + parseFloat(t.deudaSinInteres||0))) || 0);
        const deudaMes = parseFloat(t.deudaActual || t.monto || 0);
        const pago = parseFloat(t.monto || 0);
        const minimo = parseFloat(t.pagoMinimo || 0);
        const gastos = parseFloat(t.gastosTarjeta || t.interes || 0);
        
        const disponible = linea > 0 ? linea - deudaTot : 0;
        const usoPorc = linea > 0 ? (deudaTot / linea) * 100 : 0;
        
        let estadoPago = { color: 'bg-gray-100 text-gray-600', texto: 'Pendiente' };
        if (pago >= deudaMes && deudaMes > 0) estadoPago = { color: 'bg-green-100 text-green-700', texto: 'Pago Total' };
        else if (pago > minimo) estadoPago = { color: 'bg-yellow-100 text-yellow-700', texto: 'Pago Parcial' };
        else if (pago > 0 && pago <= minimo) estadoPago = { color: 'bg-red-100 text-red-700', texto: 'Pago Mínimo' };
        else if (t.estado === 'pagado') estadoPago = { color: 'bg-green-100 text-green-700', texto: 'Pagado' };

        return (
          <div key={t.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
             <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 text-white relative">
                <div className="flex justify-between items-start">
                   <div>
                      <h3 className="font-bold text-lg tracking-wide">{t.concepto}</h3>
                      <div className="text-[10px] text-gray-400 uppercase mt-0.5 flex items-center gap-1">
                        {t.lineaCredito > 0 ? `Línea: ${fmt(linea)}` : 'Sin Límite Definido'}
                      </div>
                   </div>
                   <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${estadoPago.color} bg-opacity-90 backdrop-blur-sm border border-white/20`}>
                      {estadoPago.texto}
                   </div>
                </div>
                {linea > 0 && (
                  <div className="mt-4">
                     <div className="flex justify-between text-[10px] mb-1 text-gray-300">
                        <span>Uso: {Math.round(usoPorc)}%</span>
                        <span>Disp: {fmt(disponible)}</span>
                     </div>
                     <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${usoPorc > 80 ? 'bg-red-500' : usoPorc > 50 ? 'bg-yellow-500' : 'bg-blue-400'}`} style={{width: `${Math.min(usoPorc, 100)}%`}}></div>
                     </div>
                  </div>
                )}
                <button onClick={()=>abrirEditar(t, 'gasto')} className="absolute top-2 right-2 p-2 bg-white/10 rounded-full hover:bg-white/20"><Pencil size={14}/></button>
             </div>

             <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-[10px] text-gray-500 uppercase font-bold block mb-0.5">Deuda del Mes</span><span className="text-lg font-black text-gray-800">{fmt(deudaMes)}</span></div>
                <div className="text-right"><span className="text-[10px] text-gray-500 uppercase font-bold block mb-0.5">Pago Planificado</span><span className={`text-lg font-black ${pago < deudaMes ? 'text-orange-600' : 'text-green-600'}`}>{fmt(pago)}</span></div>
             </div>
             
             <div className="px-4 pb-4 pt-0 flex justify-between items-center text-xs border-t border-gray-50 mt-2 pt-2">
                <div className="text-gray-500">Mínimo: <span className="font-bold text-gray-700">{fmt(minimo)}</span></div>
                {gastos > 0 && <div className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded flex items-center gap-1"><Receipt size={10}/> Gastos: {fmt(gastos)}</div>}
             </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      <div className="bg-white sticky top-0 z-20 border-b border-gray-100 shadow-sm">
        <div className="p-4 pt-3 pb-0">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <button onClick={()=>setModalMenu(true)} className="p-2 bg-gray-100 rounded-full"><Settings size={18}/></button>
              <div className="flex items-center bg-gray-50 rounded-lg px-2 border"><span className="text-[10px] font-bold uppercase mr-1 text-gray-400">Año</span><input type="number" value={anioSeleccionado} onChange={e=>setAnioSeleccionado(Number(e.target.value))} className="w-14 bg-transparent font-black text-center outline-none"/></div>
            </div>
            {vistaActual === 'gastos' && <div className="text-right"><div className="text-[10px] font-bold text-gray-400 uppercase">Proyectado</div><div className={`font-bold ${proy>=0?'text-green-600':'text-red-500'}`}>Gs. {fmt(proy)}</div></div>}
          </div>
          <div className="flex gap-4 border-b border-gray-100 mt-3">
             <button onClick={()=>setVistaActual('gastos')} className={`pb-2 text-sm font-bold flex items-center gap-2 transition-all ${vistaActual==='gastos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}><LayoutList size={16}/> Movimientos</button>
             <button onClick={()=>setVistaActual('tarjetas')} className={`pb-2 text-sm font-bold flex items-center gap-2 transition-all ${vistaActual==='tarjetas' ? 'text-slate-800 border-b-2 border-slate-800' : 'text-gray-400'}`}><CreditCard size={16}/> Mis Tarjetas {tarjetas.length > 0 && <span className="bg-red-100 text-red-600 text-[9px] px-1.5 rounded-full">{tarjetas.length}</span>}</button>
          </div>
          {vistaActual === 'gastos' && <div className="flex overflow-x-auto gap-2 no-scrollbar py-2 mt-1">{meses.map((m,i) => <button key={i} onClick={()=>setMesSeleccionado(i)} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${mesSeleccionado===i?'bg-gray-900 text-white':'bg-gray-100 text-gray-500'}`}>{m}</button>)}</div>}
        </div>
      </div>

      <div className="p-4 space-y-5">
        {vistaActual === 'tarjetas' && renderTarjetasTab()}

        {vistaActual === 'gastos' && (
         <>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
            <Wallet className="absolute top-0 right-0 p-4 opacity-10" size={100}/>
            <div className="relative z-10 flex justify-between items-start">
              <div><div className="text-gray-400 text-xs font-bold uppercase mb-1">Disponible</div><h2 className="text-3xl font-black">Gs. {fmt(disp)}</h2></div>
              <button onClick={()=>{setTab('ingreso'); setForm({id:null, concepto:'', monto:'', fecha:fechaEjemplo(mesSeleccionado)}); setModal(true)}} className="bg-white/10 p-2 rounded-lg"><Plus/></button>
            </div>
            {ingresosMes.length > 0 && <div className="mt-4 space-y-2 relative z-10 border-t border-white/10 pt-2">
                {ingresosMes.map(i => (<div key={i.id} className="flex justify-between text-xs opacity-80"><span>{i.concepto}</span><span className="font-bold">+{fmt(i.monto)}</span></div>))}
            </div>}
          </div>

          <div>
            <div className="flex justify-between items-end mb-2"><h3 className="font-bold flex gap-2 items-center"><Layers size={18}/> Gastos del Mes</h3><div className="text-xs text-gray-500">Pagado: <span className="text-blue-600 font-bold">{porc}%</span></div></div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mb-4"><div className={`h-full rounded-full transition-all duration-500 ${porc===100?'bg-green-500':'bg-blue-600'}`} style={{width:`${porc}%`}}></div></div>
            <div className="flex gap-2 mb-4"><div className="flex gap-2 flex-1 overflow-x-auto no-scrollbar">{['todos','pendientes','pagados'].map(f=><button key={f} onClick={()=>setFiltro(f)} className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${filtro===f?'bg-blue-100 text-blue-700':'bg-white border text-gray-400'}`}>{f}</button>)}</div></div>

             <div className="space-y-3">
               {pagosMes.map(p => {
                  const diff = Math.ceil((new Date(p.fecha+'T00:00:00') - hoy)/86400000);
                  const st = p.estado==='pagado' ? {bg:'bg-gray-50', t:'text-gray-400', l:'Pagado'} : (diff<0?{bg:'bg-red-50', t:'text-red-700', l:`Venció ${Math.abs(diff)}d`}:(diff<=3?{bg:'bg-yellow-50', t:'text-yellow-700', l:`Vence ${diff}d`}:{bg:'bg-green-50', t:'text-green-700', l:'En fecha'}));
                  const isT = p.categoria==='tarjeta';
                  
                  return (
                    <div key={p.id} className={`p-4 rounded-xl border ${isT ? 'border-l-4 border-l-slate-800 border-gray-200' : 'border-gray-100'} shadow-sm relative ${st.bg}`}>
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
                           <div className="text-2xl font-black">Gs. {fmt(p.monto)}</div>
                           {isT && p.pagoMinimo > p.monto && <div className="text-[10px] text-red-500 flex items-center gap-1 mt-1"><AlertTriangle size={10}/> Estás pagando menos del mínimo</div>}
                       </div>
                       {p.estado==='pagado' && p.pagoInfo?.img && <div className="pl-9 mt-2"><button onClick={()=>setModalImg(p.pagoInfo.img)} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold flex gap-1 items-center"><Eye size={10}/> Ver Foto</button></div>}
                    </div>
                  )
               })}
             </div>
          </div>
         </>
        )}
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
               
               {/* FORMULARIO TARJETA MEJORADO */}
               {tab==='gasto' && form.categoria==='tarjeta' ? (
                  <div className="bg-blue-50 p-3 rounded-xl space-y-3 border border-blue-100">
                     <div className="text-xs font-bold text-blue-800 uppercase flex items-center gap-2"><CreditCard size={12}/> Datos de la Tarjeta</div>
                     
                     {/* Línea y Deuda Total */}
                     <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[9px] text-gray-500 uppercase font-bold">Línea de Crédito</label><input type="number" className="w-full p-2 bg-white rounded border text-xs" value={form.lineaCredito} onChange={e=>setForm({...form, lineaCredito:e.target.value})}/></div>
                        <div><label className="text-[9px] text-gray-500 uppercase font-bold">Deuda Total (Global)</label><input type="number" className="w-full p-2 bg-white rounded border text-xs" value={form.deudaTotal} onChange={e=>setForm({...form, deudaTotal:e.target.value})}/></div>
                     </div>

                     {/* Datos del Mes */}
                     <div className="bg-white p-2 rounded border border-blue-200">
                        <label className="text-[10px] text-blue-600 font-bold uppercase mb-1 block">Extracto de este Mes</label>
                        <div className="flex gap-2 mb-2">
                            <div className="flex-1"><label className="text-[9px] text-gray-400">Deuda del Mes</label><input type="number" className="w-full p-1 border-b outline-none font-bold" value={form.deudaActual} onChange={e=>setForm({...form, deudaActual:e.target.value})}/></div>
                            <div className="flex-1"><label className="text-[9px] text-gray-400">Pago Mínimo</label><input type="number" className="w-full p-1 border-b outline-none text-red-500" value={form.pagoMinimo} onChange={e=>setForm({...form, pagoMinimo:e.target.value})}/></div>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1"><label className="text-[9px] text-gray-400">Gastos/Intereses</label><input type="number" className="w-full p-1 border-b outline-none text-orange-600" value={form.gastosTarjeta} onChange={e=>setForm({...form, gastosTarjeta:e.target.value})}/></div>
                            <div className="flex-1"><label className="text-[9px] text-gray-400">Vencimiento</label><input type="date" className="w-full p-1 border-b outline-none" value={form.fecha} onChange={e=>setForm({...form, fecha:e.target.value})}/></div>
                        </div>
                     </div>

                     {/* Tu Pago */}
                     <div><label className="text-[10px] text-gray-500 uppercase font-bold">¿Cuánto vas a pagar?</label><input type="number" placeholder="Monto a pagar" className="w-full p-3 bg-white rounded border-2 border-green-500 font-bold text-lg text-green-700" value={form.monto} onChange={e=>setForm({...form, monto:e.target.value})}/></div>
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
