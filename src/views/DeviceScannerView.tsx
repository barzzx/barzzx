import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Radar, Globe, Chrome, Monitor, Cpu, Network, ShieldCheck } from 'lucide-react';

export default function DeviceScannerView() {
  const [ipData, setIpData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    // Collect Device Info
    const collectDeviceData = () => {
      const ua = navigator.userAgent;
      
      let browserName = "Unknown";
      if (ua.indexOf("Chrome") > -1) browserName = "Google Chrome";
      else if (ua.indexOf("Safari") > -1) browserName = "Apple Safari";
      else if (ua.indexOf("Firefox") > -1) browserName = "Mozilla Firefox";
      else if (ua.indexOf("Edge") > -1) browserName = "Microsoft Edge";
      
      let osName = "Unknown";
      if (ua.indexOf("Win") > -1) osName = "Windows";
      else if (ua.indexOf("Mac") > -1) osName = "MacOS";
      else if (ua.indexOf("Linux") > -1) osName = "Linux";
      else if (ua.indexOf("Android") > -1) osName = "Android";
      else if (ua.indexOf("like Mac") > -1) osName = "iOS";

      const resolution = `${window.screen.width} x ${window.screen.height}`;
      const colorDepth = window.screen.colorDepth;
      const cores = navigator.hardwareConcurrency || "Unknown";
      const memory = (navigator as any).deviceMemory || "Unknown";
      const connection = (navigator as any).connection ? (navigator as any).connection.effectiveType : "Unknown";

      setDeviceInfo({ browserName, osName, resolution, colorDepth, cores, memory, connection });
    };

    const fetchIp = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        setIpData(data.ip);
      } catch (err) {
        setIpData("Hidden / Error");
      } finally {
        setLoading(false);
      }
    };

    collectDeviceData();
    fetchIp();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative z-10 pb-20">
      <div className="bg-[#0f172a]/80 backdrop-blur-md p-6 lg:p-10 rounded-3xl shadow-2xl border border-slate-800">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <Radar className="text-emerald-500 animate-spin-slow" size={28} /> Radar Sistem (Scanner)
            </h2>
            <p className="text-slate-400 text-sm mt-1">Memindai jejak digital, IP Publik, dan Spesifikasi Perangkat Anda.</p>
          </div>
          <ShieldCheck size={24} className="text-emerald-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* IP & Network Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#05050a] border border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(16,185,129,0.1)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10"><Globe size={100} /></div>
            <div className="flex items-center gap-3 mb-4 text-emerald-500">
              <Network size={20} />
              <h3 className="font-bold tracking-widest uppercase text-sm">Jaringan Publik</h3>
            </div>
            
            <div className="space-y-4 relative z-10">
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase">Alamat IP Publik</span>
                <div className="text-2xl md:text-3xl font-black text-white tracking-widest font-mono mt-1">
                  {loading ? <span className="animate-pulse text-slate-600">Scanning...</span> : ipData}
                </div>
              </div>
              
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase">Tipe Koneksi</span>
                <div className="text-lg font-bold text-slate-300 mt-1 capitalize">
                  {deviceInfo?.connection || 'Scanning...'}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Device Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-[#05050a] border border-blue-500/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(37,99,235,0.1)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10"><Monitor size={100} /></div>
            <div className="flex items-center gap-3 mb-4 text-blue-500">
              <Cpu size={20} />
              <h3 className="font-bold tracking-widest uppercase text-sm">Spesifikasi Perangkat</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase block mb-1">Sistem Operasi</span>
                <span className="text-sm font-bold text-white">{deviceInfo?.osName}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase block mb-1">Browser web</span>
                <span className="text-sm font-bold text-white flex items-center gap-1"><Chrome size={14}/> {deviceInfo?.browserName}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase block mb-1">Resolusi Layar</span>
                <span className="text-sm font-mono text-white">{deviceInfo?.resolution}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase block mb-1">CPU Cores</span>
                <span className="text-sm font-mono text-white">{deviceInfo?.cores} Logical</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase block mb-1">Estimasi RAM</span>
                <span className="text-sm font-mono text-white">{deviceInfo?.memory} GB</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase block mb-1">Color Depth</span>
                <span className="text-sm font-mono text-white">{deviceInfo?.colorDepth}-bit</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-500 font-mono break-all leading-relaxed">
            <span className="text-emerald-500">USER_AGENT:</span> {navigator.userAgent}
          </p>
        </div>
      </div>
    </div>
  );
}
