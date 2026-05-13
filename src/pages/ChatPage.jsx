import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Send, ShieldCheck, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "../components/ui/Button.jsx";
import { Badge, Card } from "../components/ui/Card.jsx";
import { chatApi, walletApi } from "../lib/api.js";
import { formatINR } from "../lib/utils.js";
import { useJeevikaStore } from "../lib/store.js";
import { Link } from "react-router-dom";
import { getSocket } from "../lib/socket.js";

export function ChatPage() {
  const { id: jobId } = useParams();
  const { user, updateUser } = useJeevikaStore();
  
  const [messages, setMessages] = useState([]);
  const [jobContext, setJobContext] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [locking, setLocking] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    let cancelled = false;
    async function loadChat() {
      try {
        const data = await chatApi.getMessages(jobId);
        if (!cancelled) {
          setJobContext(data.job);
          setMessages(data.messages);
          
          // Initial presence check
          const socket = getSocket();
          if (socket && user) {
            const recipientId = user.id === data.job.employerId ? data.job.workerId : data.job.employerId;
            if (recipientId) {
              socket.emit("check_online", recipientId, (online) => {
                setIsOnline(online);
              });
            }
          }
        }
      } catch (err) {
        if (!cancelled) toast.error("Failed to load chat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadChat();
    return () => { cancelled = true; };
  }, [jobId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !jobContext || !user) return;

    const recipientId = user.id === jobContext.employerId ? jobContext.workerId : jobContext.employerId;

    const handleNewMessage = (data) => {
      if (data.jobId === jobId) {
        setMessages((prev) => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    };

    const handleUserOnline = (userId) => {
      if (userId === recipientId) setIsOnline(true);
    };

    const handleUserOffline = (userId) => {
      if (userId === recipientId) setIsOnline(false);
    };

    const handleUserTyping = (data) => {
      if (data.jobId === jobId && data.senderId === recipientId) {
        setIsTyping(true);
      }
    };

    const handleUserStopTyping = (data) => {
      if (data.jobId === jobId && data.senderId === recipientId) {
        setIsTyping(false);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
    };
  }, [jobId, jobContext, user.id]);

  const handleTyping = () => {
    const socket = getSocket();
    if (!socket || !jobContext || !user) return;

    const recipientId = user.id === jobContext.employerId ? jobContext.workerId : jobContext.employerId;
    if (!recipientId) return;

    socket.emit("typing", { recipientId, jobId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { recipientId, jobId });
    }, 3000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const msg = await chatApi.sendMessage(jobId, newMessage);
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
      
      const socket = getSocket();
      if (socket && jobContext && user) {
        const recipientId = user.id === jobContext.employerId ? jobContext.workerId : jobContext.employerId;
        socket.emit("stop_typing", { recipientId, jobId });
      }
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleLockEscrow = async () => {
    if (!jobContext) return;
    setLocking(true);
    try {
      const txn = await walletApi.lockEscrow({
        jobId: jobContext.id,
        amount: jobContext.budget,
        title: `Escrow locked for: ${jobContext.title}`
      });
      setJobContext({ ...jobContext, escrowStatus: "Locked" });
      updateUser({ wallet: txn.updatedBalance });
      toast.success(`Successfully locked ${formatINR(jobContext.budget)} in escrow.`);
    } catch (err) {
      toast.error(err.message || "Failed to lock escrow.");
    } finally {
      setLocking(false);
    }
  };

  if (loading) return <div className="grid h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[340px_1fr]">
      {/* Sidebar: Context */}
      <Card className="p-6 h-fit space-y-6">
        <Button variant="ghost" size="sm" as={Link} to="/active-contracts" className="-ml-3 text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />Back to Contracts
        </Button>
        
        <div>
          <Badge tone={jobContext.escrowStatus === "Locked" ? "emerald" : "amber"} className="mb-4">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            Escrow {jobContext.escrowStatus || "Pending"}
          </Badge>
          <h1 className="text-2xl font-black leading-tight">{jobContext.employerName}</h1>
          <div className="mt-2 flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-white/20"}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {isOnline ? "Online Now" : "Offline"}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Job Details</p>
          <p className="text-sm font-bold">{jobContext.title}</p>
          <p className="text-sm text-muted-foreground">{jobContext.location} · {formatINR(jobContext.budget)}</p>
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-primary to-violet-600 shadow-xl shadow-primary/20" 
          onClick={handleLockEscrow}
          disabled={locking || jobContext.escrowStatus === "Locked"}
        >
          {locking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {jobContext.escrowStatus === "Locked" ? "Escrow Locked ✓" : "Secure with Escrow"}
        </Button>
      </Card>
      
      {/* Main: Chat View */}
      <Card className="flex h-[75vh] flex-col p-0 overflow-hidden border-white/10">
        <div className="border-b border-white/10 p-5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center text-lg font-black">{jobContext.employerName?.charAt(0)}</div>
             <div>
               <h2 className="text-lg font-black">Messages</h2>
               {isTyping && (
                 <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-black uppercase tracking-tighter text-emerald-400 animate-pulse">
                   typing...
                 </motion.p>
               )}
             </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !isTyping ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground space-y-2 opacity-50">
              <div className="h-12 w-12 rounded-full border-2 border-dashed border-white/20" />
              <p className="text-sm">No messages yet. Say hello!</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  key={msg.id} 
                  className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[75%] space-y-1 ${msg.sender === "You" ? "items-end" : "items-start"}`}>
                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                      msg.sender === "You" 
                        ? "bg-primary text-slate-950 font-medium rounded-tr-none" 
                        : "bg-white/10 border border-white/5 rounded-tl-none"
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-start">
                  <div className="bg-white/5 px-4 py-2 rounded-2xl rounded-tl-none flex gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" />
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form className="p-4 bg-slate-950/50 backdrop-blur-md border-t border-white/10 flex gap-3" onSubmit={handleSend}>
          <input 
            className="field bg-white/5 border-white/10 focus:bg-white/10 transition-all h-12" 
            placeholder="Type your message..." 
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !newMessage.trim()} className="h-12 w-12 rounded-xl p-0">
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </Card>
    </motion.div>
  );
}
