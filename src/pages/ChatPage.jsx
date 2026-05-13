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

export function ChatPage() {
  const { id: jobId } = useParams();
  const { user, updateUser } = useJeevikaStore();
  
  const [messages, setMessages] = useState([]);
  const [jobContext, setJobContext] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [locking, setLocking] = useState(false);
  
  const messagesEndRef = useRef(null);

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
        }
      } catch (err) {
        if (!cancelled) {
          toast.error("Failed to load chat.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadChat();
    return () => { cancelled = true; };
  }, [jobId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const msg = await chatApi.sendMessage(jobId, newMessage);
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
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

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!jobContext) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-black">Chat unavailable</h2>
        <p className="mt-2 text-muted-foreground">The job could not be found.</p>
        <Button as={Link} to="/jobs" className="mt-4">Back to Jobs</Button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[320px_1fr]"
    >
      <Card className="p-5 h-fit">
        <Button variant="ghost" size="sm" as={Link} to="/jobs" className="-ml-3 mb-4 text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Badge tone={jobContext.escrowStatus === "Locked" ? "amber" : "emerald"}>
          <ShieldCheck className="mr-1 h-3 w-3" />
          Escrow {jobContext.escrowStatus || "Optional"}
        </Badge>
        <h1 className="mt-4 text-2xl font-black">{jobContext.employerName}</h1>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{jobContext.title}</p>
        <p className="mt-1 text-sm font-semibold">{jobContext.location} · {formatINR(jobContext.budget)}</p>
        
        <div className="mt-6 grid gap-3">
          {["Verified User", `${jobContext.rating || 4.5} rating`].map((item) => (
            <div key={item} className="rounded-2xl bg-white/5 p-3 text-sm">{item}</div>
          ))}
        </div>
        
        <Button 
          className="mt-6 w-full" 
          onClick={handleLockEscrow}
          disabled={locking || jobContext.escrowStatus === "Locked"}
        >
          {locking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {jobContext.escrowStatus === "Locked" ? "Escrow Locked ✓" : `Lock ${formatINR(jobContext.budget)} in Escrow`}
        </Button>
      </Card>
      
      <Card className="flex min-h-[70vh] flex-col p-0">
        <div className="border-b border-white/10 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">Chat</h2>
            <p className="text-sm text-muted-foreground">Secure messaging</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => toast.success("Marked as complete")}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark done
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[55vh]">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Send a message to start the conversation.
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
                  <div className={`max-w-[78%] rounded-2xl p-4 ${msg.sender === "You" ? "bg-primary text-primary-foreground" : "bg-white/8"}`}>
                    <p className="text-xs font-semibold opacity-75">{msg.sender}</p>
                    <p className="mt-1 text-sm leading-6">{msg.text}</p>
                    <p className="mt-2 text-[10px] opacity-50 text-right">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form className="flex gap-3 border-t border-white/10 p-4" onSubmit={handleSend}>
          <input 
            className="field" 
            placeholder="Type a message..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </Card>
    </motion.div>
  );
}
