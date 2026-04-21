import React, { useState, useEffect, useRef } from 'react';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { 
  collection, doc, addDoc, setDoc, getDoc, updateDoc, onSnapshot, query, where, deleteDoc 
} from 'firebase/firestore';
import { toast } from 'sonner';

const servers = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
  ],
  iceCandidatePoolSize: 10,
};

interface CallManagerProps {
  currentUser: any;
  allUsers: any[];
}

// Global variable or context to trigger calls from anywhere
export const CallSignals = {
  triggerCall: (calleeId: string, type: 'video' | 'audio') => {}
};

export const CallManager: React.FC<CallManagerProps> = ({ currentUser, allUsers }) => {
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeCall, setActiveCall] = useState<any>(null);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const pc = useRef<RTCPeerConnection | null>(null);
  const callDocRef = useRef<any>(null);
  
  const unsubCallRef = useRef<() => void>(() => {});
  const unsubIceRef = useRef<() => void>(() => {});

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (unsubCallRef.current) unsubCallRef.current();
      if (unsubIceRef.current) unsubIceRef.current();
      
      pc.current?.close();
      localStream?.getTracks().forEach(track => track.stop());
      remoteStream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    // Listen for incoming calls
    if (!currentUser?.id) return;

    const callsRef = collection(db, 'calls');
    const q = query(callsRef, where('calleeId', '==', currentUser.id), where('status', '==', 'ringing'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          setIncomingCall({ id: change.doc.id, ...change.doc.data() });
        }
        if (change.type === 'removed' || (change.type === 'modified' && change.doc.data().status !== 'ringing')) {
          setIncomingCall((prev: any) => (prev?.id === change.doc.id ? null : prev));
        }
      });
    }, (error) => {
      console.error("Error listening to incoming calls:", error);
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  useEffect(() => {
    // Expose start call globally
    CallSignals.triggerCall = async (calleeId: string, type: 'video' | 'audio') => {
      if (!currentUser?.id) {
        toast.error("You must be logged in to make a call.");
        return;
      }
      try {
        const _stream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
        setLocalStream(_stream);
        setIsVideoOn(type === 'video');

        const callsRef = collection(db, 'calls');
        const callDoc = await addDoc(callsRef, {
          callerId: currentUser.id,
          calleeId,
          type,
          status: 'ringing',
          createdAt: Date.now()
        });
        
        callDocRef.current = callDoc;
        setActiveCall({ id: callDoc.id, callerId: currentUser.id, calleeId, type, role: 'caller' });
        
        setupWebRTC(_stream, callDoc.id, 'caller');
      } catch (e: any) {
        console.error(e);
        toast.error(`Could not access media devices: ${e.message || 'Unknown error'}`);
      }
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activeCall]);

  const setupWebRTC = async (stream: MediaStream, callId: string, role: 'caller' | 'callee') => {
    pc.current = new RTCPeerConnection(servers);
    
    // Create remote stream
    const _remoteStream = new MediaStream();
    setRemoteStream(_remoteStream);

    // Push tracks from local stream to peer connection
    stream.getTracks().forEach((track) => {
      pc.current?.addTrack(track, stream);
    });

    // Pull tracks from remote stream, add to video stream
    pc.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        _remoteStream.addTrack(track);
      });
    };

    const callDoc = doc(db, 'calls', callId);
    callDocRef.current = callDoc;
    
    const offerCandidatesRef = collection(db, 'calls', callId, 'offerCandidates');
    const answerCandidatesRef = collection(db, 'calls', callId, 'answerCandidates');

    // Get candidates for either caller or callee
    pc.current.onicecandidate = async (event) => {
      if (event.candidate) {
        if (role === 'caller') {
          await addDoc(offerCandidatesRef, event.candidate.toJSON());
        } else {
          await addDoc(answerCandidatesRef, event.candidate.toJSON());
        }
      }
    };

    if (role === 'caller') {
      const offerDescription = await pc.current.createOffer();
      await pc.current.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      await updateDoc(callDoc, { offer });

      if (unsubCallRef.current) unsubCallRef.current();
      // Listen for remote answer
      unsubCallRef.current = onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (!pc.current?.currentRemoteDescription && data?.answer) {
          try {
            const answerDescription = new RTCSessionDescription(data.answer);
            pc.current?.setRemoteDescription(answerDescription).catch(e => console.error("setRemote answer error:", e));
          } catch (err) {
            console.error("Invalid answer format:", err);
          }
        }
        if (data?.status === 'ended' || data?.status === 'rejected') {
          endCall();
          toast.info(data.status === 'rejected' ? "Call declined" : "Call ended");
        }
      }, (error) => console.error("Call status snapshot error:", error));

      if (unsubIceRef.current) unsubIceRef.current();
      // Listen for remote ICE candidates
      unsubIceRef.current = onSnapshot(answerCandidatesRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            try {
              const data = change.doc.data();
              if (data && Object.keys(data).length > 0) {
                const candidate = new RTCIceCandidate(data);
                pc.current?.addIceCandidate(candidate);
              }
            } catch (err) {
              console.error("Error adding ice candidate:", err, change.doc.data());
            }
          }
        });
      }, (error) => console.error("Answer candidates snapshot error:", error));
      
    } else {
      const callData = (await getDoc(callDoc)).data();
      if (!callData) return;

      const offerDescription = callData.offer;
      await pc.current.setRemoteDescription(new RTCSessionDescription(offerDescription));

      const answerDescription = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answerDescription);

      const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
      };

      await updateDoc(callDoc, { answer, status: 'answered' });

      if (unsubCallRef.current) unsubCallRef.current();
      // Listen to call doc for end
      unsubCallRef.current = onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (data?.status === 'ended') {
          endCall();
          toast.info("Call ended");
        }
      }, (error) => console.error("Call listen error:", error));

      if (unsubIceRef.current) unsubIceRef.current();
      // Listen for remote ICE candidates
      unsubIceRef.current = onSnapshot(offerCandidatesRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            try {
              const data = change.doc.data();
              if (data && Object.keys(data).length > 0) {
                const candidate = new RTCIceCandidate(data);
                pc.current?.addIceCandidate(candidate);
              }
            } catch (err) {
              console.error("Error adding ice candidate:", err, change.doc.data());
            }
          }
        });
      }, (error) => console.error("Offer candidates error:", error));
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: incomingCall.type === 'video', audio: true });
      setLocalStream(stream);
      setIsVideoOn(incomingCall.type === 'video');
      
      const callId = incomingCall.id;
      setActiveCall({ id: callId, callerId: incomingCall.callerId, calleeId: currentUser.id, type: incomingCall.type, role: 'callee' });
      setIncomingCall(null);
      
      await setupWebRTC(stream, callId, 'callee');
    } catch (e: any) {
      console.error(e);
      toast.error(`Could not access media devices: ${e.message || 'Unknown error'}`);
    }
  };

  const declineCall = async () => {
    if (!incomingCall) return;
    try {
      await updateDoc(doc(db, 'calls', incomingCall.id), { status: 'rejected' });
      setIncomingCall(null);
    } catch (e) {
      console.error(e);
    }
  };

  const endCall = async () => {
    if (callDocRef.current) {
      try {
        await updateDoc(callDocRef.current, { status: 'ended' });
      } catch (e) {
        console.error("Error updating call status", e);
      }
    }
    
    pc.current?.close();
    pc.current = null;
    
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());
    
    setLocalStream(null);
    setRemoteStream(null);
    setActiveCall(null);
    if(unsubCallRef.current) unsubCallRef.current();
    if(unsubIceRef.current) unsubIceRef.current();
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !isMicOn;
      setIsMicOn(!isMicOn);
    }
  };

  const toggleVideo = () => {
    if (localStream && activeCall?.type === 'video') {
      localStream.getVideoTracks()[0].enabled = !isVideoOn;
      setIsVideoOn(!isVideoOn);
    }
  };

  const getOtherUser = (id: string) => allUsers.find(u => u.id === id);

  return (
    <>
      {/* Incoming Call Overlay */}
      <AnimatePresence>
        {incomingCall && !activeCall && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-surface-container-high border border-outline-variant/30 shadow-2xl rounded-3xl p-4 min-w-[300px] flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container flex items-center justify-center shrink-0">
                {getOtherUser(incomingCall.callerId)?.profileImage ? (
                  <img src={getOtherUser(incomingCall.callerId)?.profileImage} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-outline" />
                )}
              </div>
              <div>
                <h3 className="text-on-surface font-black text-sm">{getOtherUser(incomingCall.callerId)?.username || 'Unknown Caller'}</h3>
                <p className="text-xs text-outline font-medium">Incoming {incomingCall.type} call...</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-6">
              <button onClick={declineCall} className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center text-error hover:bg-error hover:text-on-error transition-all active:scale-95">
                <PhoneOff className="w-5 h-5" />
              </button>
              <button onClick={acceptCall} className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-lg shadow-primary-container/20 hover:brightness-110 transition-all active:scale-95">
                {incomingCall.type === 'video' ? <Video className="w-5 h-5 fill-current" /> : <Phone className="w-5 h-5 fill-current" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Call UI */}
      <AnimatePresence>
        {activeCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex flex-col"
          >
            <div className="flex-1 relative flex justify-center items-center">
              {/* Remote Video */}
              {activeCall.type === 'video' ? (
                <video 
                  ref={remoteVideoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover max-h-screen"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-surface-container overflow-hidden border border-outline-variant/30 flex justify-center items-center">
                  {getOtherUser(activeCall.role === 'caller' ? activeCall.calleeId : activeCall.callerId)?.profileImage ? (
                    <img src={getOtherUser(activeCall.role === 'caller' ? activeCall.calleeId : activeCall.callerId)?.profileImage} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-outline" />
                  )}
                </div>
              )}

              {/* Local Video Picture-in-Picture */}
              {activeCall.type === 'video' && (
                <motion.div 
                  drag
                  dragConstraints={{ top: 20, left: 20, right: window.innerWidth - 140, bottom: window.innerHeight - 200 }}
                  className="absolute bottom-24 right-4 w-24 h-36 md:w-32 md:h-48 bg-surface-container border border-outline-variant/30 rounded-2xl overflow-hidden shadow-2xl cursor-move z-20"
                >
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                  />
                  {!isVideoOn && (
                     <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                       <VideoOff className="w-6 h-6 text-white text-opacity-50" />
                     </div>
                  )}
                </motion.div>
              )}
              
              {/* Audio element for remote stream in audio call */}
              {activeCall.type === 'audio' && (
                <audio ref={remoteVideoRef as any} autoPlay playsInline />
              )}
            </div>

            {/* Call Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-surface-container-high/80 backdrop-blur-xl px-6 py-4 rounded-[2rem] border border-outline-variant/20 shadow-2xl">
              <button 
                onClick={toggleMic}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMicOn ? 'bg-surface hover:bg-surface-variant text-on-surface' : 'bg-error/20 text-error hover:bg-error/30'}`}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              
              {activeCall.type === 'video' && (
                <button 
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isVideoOn ? 'bg-surface hover:bg-surface-variant text-on-surface' : 'bg-error/20 text-error hover:bg-error/30'}`}
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              )}

              <button 
                onClick={endCall}
                className="w-14 h-14 rounded-full bg-error flex items-center justify-center text-on-error hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-error/20 ml-2"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
            
            {/* Caller Info overlay */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center text-white drop-shadow-md">
              <h3 className="font-black text-xl tracking-tight">
                {getOtherUser(activeCall.role === 'caller' ? activeCall.calleeId : activeCall.callerId)?.username || 'Unknown'}
              </h3>
              <p className="text-sm font-medium opacity-80 uppercase tracking-widest">{activeCall.type} Call</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
