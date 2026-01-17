import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { generateToken, syncTime, getSyncedTime } from '../services/totpService';
import { LogOut, Eye, EyeOff, User as UserIcon, QrCode, CheckCircle, Copy, RefreshCw, Clock, AlertTriangle, ArrowRightLeft, ExternalLink, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface UserPanelProps {
  user: User;
  onLogout: () => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({ user, onLogout }) => {
  const [showSecret, setShowSecret] = useState(true); 
  const [showWindow, setShowWindow] = useState(false); // Toggle hiển thị mã Trước/Sau
  const [isSyncing, setIsSyncing] = useState(false);
  const [isNtpActive, setIsNtpActive] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false); // Toggle hướng dẫn, mặc định ẩn
  
  // --- States cho mã ---
  const [defaultCode, setDefaultCode] = useState<string>('------');
  const [defaultTimer, setDefaultTimer] = useState<number>(0);
  
  // Window codes
  const [prevCode, setPrevCode] = useState('------');
  const [nextCode, setNextCode] = useState('------');

  // Tự động đồng bộ giờ chuẩn ngay khi vào trang
  useEffect(() => {
    handleSync();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    const success = await syncTime();
    setIsNtpActive(success);
    updateTick(); 
    setTimeout(() => setIsSyncing(false), 500);
  };

  const updateTick = () => {
    const now = getSyncedTime();
    const period = 30000; // 30s

    // 1. Mã hiện tại (Window 0)
    const data = generateToken(user.secret, now);
    if (data.isValid) {
      setDefaultCode(data.token);
      setDefaultTimer(data.remaining);
    } else {
      setDefaultCode('ERROR');
    }

    // 2. Tính mã Window ±1 (nếu đang hiển thị)
    if (showWindow) {
      const prev = generateToken(user.secret, now - period);
      const next = generateToken(user.secret, now + period);
      setPrevCode(prev.isValid ? prev.token : '---');
      setNextCode(next.isValid ? next.token : '---');
    }
  };

  useEffect(() => {
    updateTick();
    const interval = setInterval(updateTick, 1000);
    return () => clearInterval(interval);
  }, [user.secret, showWindow]);

  const copyCode = (code: string) => {
     if (code && code !== '------' && code !== 'ERROR') {
        navigator.clipboard.writeText(code);
     }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(user.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center px-2">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-slate-800 rounded-lg border border-slate-700 shadow-md">
                 <UserIcon className="w-5 h-5 text-indigo-400" />
               </div>
               <div>
                 <h1 className="text-lg font-bold text-white tracking-wide">{user.username}</h1>
                 <div className="flex items-center gap-1.5">
                    {isNtpActive ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            <Clock className="w-3 h-3" /> NTP SYNCED
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> LOCAL TIME
                        </span>
                    )}
                 </div>
               </div>
             </div>
             <button 
              onClick={onLogout}
              className="px-3 py-1.5 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 rounded-lg transition-all text-xs font-medium border border-slate-700 hover:border-rose-500/30 flex items-center gap-2"
             >
               <LogOut className="w-3 h-3" /> Thoát
             </button>
        </div>

        {/* --- MAIN CARD --- */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-indigo-500/30 overflow-hidden relative">
           <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50"></div>
           
           <div className="p-6 space-y-6">
              
              {/* Secret Key */}
              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50 flex flex-col gap-2">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <QrCode className="w-3 h-3" /> Secret Key
                    </span>
                    <div className="flex gap-2">
                      <button onClick={copySecret} className="text-slate-500 hover:text-white" title="Copy Key">
                        {copiedSecret ? <Check className="w-3 h-3 text-emerald-400"/> : <Copy className="w-3 h-3" />}
                      </button>
                      <button onClick={() => setShowSecret(!showSecret)} className="text-slate-500 hover:text-white">
                        {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                 </div>
                 {showSecret && (
                   <code className="font-mono text-indigo-300 text-sm break-all leading-tight">
                     {user.secret}
                   </code>
                 )}
              </div>

              {/* Display Code */}
              <div className="flex flex-col items-center animate-fade-in relative">
                 <div className="text-[10px] font-bold text-indigo-400 tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
                   <CheckCircle className="w-3 h-3" /> Mã 2FA (Hiện tại)
                 </div>
                 
                 <div className="relative group cursor-pointer" onClick={() => copyCode(defaultCode)} title="Nhấn để sao chép">
                    <div className="text-6xl md:text-7xl font-mono font-bold text-white tracking-widest drop-shadow-[0_0_25px_rgba(99,102,241,0.3)] transition-all group-hover:scale-105 group-active:scale-95 select-none">
                      {defaultCode}
                    </div>
                 </div>

                 {/* Timer */}
                 <div className="w-full max-w-[200px] h-1.5 bg-slate-800 rounded-full mt-6 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ease-linear ${defaultTimer > 5 ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]'}`}
                      style={{ width: `${(defaultTimer / 30) * 100}%` }}
                    />
                 </div>
                 
                 <div className="w-full flex justify-between items-center mt-4 px-4">
                     <div className="text-xs font-mono text-slate-500">
                        Đổi sau: <span className="text-slate-300">{defaultTimer}s</span>
                     </div>
                     
                     <div className="flex gap-2">
                         <button 
                            onClick={() => setShowWindow(!showWindow)}
                            className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded transition-all border ${showWindow ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                            title="Hiện mã Trước/Sau (Window ±1)"
                         >
                            <ArrowRightLeft className="w-3 h-3" /> ±1
                         </button>
                         <button 
                            onClick={handleSync}
                            disabled={isSyncing}
                            className={`text-[10px] flex items-center gap-1.5 px-2 py-1 rounded transition-all ${isSyncing ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                            title="Force Re-Sync"
                         >
                            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> 
                         </button>
                     </div>
                 </div>
              </div>
              
              {/* Window Mode Display */}
              {showWindow && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-4 animate-fade-in">
                      <div className="text-center group cursor-pointer" onClick={() => copyCode(prevCode)}>
                          <div className="text-[10px] text-slate-500 uppercase mb-1">Trước (-30s)</div>
                          <div className="text-xl font-mono text-slate-400 group-hover:text-white font-bold">{prevCode}</div>
                      </div>
                      <div className="text-center group cursor-pointer" onClick={() => copyCode(nextCode)}>
                          <div className="text-[10px] text-slate-500 uppercase mb-1">Sau (+30s)</div>
                          <div className="text-xl font-mono text-slate-400 group-hover:text-white font-bold">{nextCode}</div>
                      </div>
                  </div>
              )}
           </div>
        </div>

        {/* --- INSTRUCTION PANEL (Replacing Scanner) --- */}
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/40 p-5 transition-all">
           <button 
             onClick={() => setShowInstructions(!showInstructions)}
             className={`w-full flex items-center justify-between text-sm font-bold text-slate-300 hover:text-white transition-colors outline-none ${showInstructions ? 'mb-4 border-b border-slate-700/50 pb-2' : ''}`}
           >
             <span>Hướng dẫn lấy mã thủ công:</span>
             {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
           </button>
           
           {showInstructions && (
             <div className="space-y-4 text-sm animate-fade-in">
                
                {/* Step 1: Copy Code (Moved from Step 2) */}
                <div className="flex gap-3">
                   <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">1</div>
                   <div className="w-full text-slate-400">
                      <p className="mb-2">Bước 1: Sao chép code bên dưới</p>
                      <button 
                         onClick={copySecret}
                         className="w-full bg-slate-950/50 border border-slate-700 hover:border-indigo-500/50 rounded-lg p-2.5 flex items-center justify-between group transition-all"
                         title="Nhấn để sao chép"
                      >
                         <code className="font-mono text-indigo-300 text-xs break-all text-left mr-2 line-clamp-1">
                            {user.secret}
                         </code>
                         <div className="bg-slate-800 p-1 rounded group-hover:bg-slate-700 transition-colors">
                            {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />}
                         </div>
                      </button>
                   </div>
                </div>

                {/* Step 2: Visit Website (Moved from Step 1) */}
                <div className="flex gap-3">
                   <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">2</div>
                   <div className="text-slate-400">
                      <p className="mb-1">Bước 2: Truy cập website</p>
                      <a 
                        href="https://2fa.live/" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 flex items-center gap-1"
                      >
                         https://2fa.live/ <ExternalLink className="w-3 h-3" />
                      </a>
                   </div>
                </div>

                {/* Step 3: Custom Text */}
                <div className="flex gap-3 items-start">
                   <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">3</div>
                   <div className="text-slate-400 pt-0.5">
                      <p>Bước 3: Nhấn submit copy 6 số cuối để lấy mã.</p>
                   </div>
                </div>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};