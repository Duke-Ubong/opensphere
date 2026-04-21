import React, { useEffect, useRef, useState } from 'react';
import { Search, User, Bell, ChevronRight, UserPlus, Check, X, ShieldCheck, Mail, Users, Plus, Hash, Globe, Lock, MessageCircle, TrendingUp, MoreHorizontal, UserCheck, BarChart2, Video, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as d3 from 'd3';
import { toast } from 'sonner';
import { CallSignals } from './CallManager';

interface NetworkViewProps {
  currentUser: any;
  onNavigateToProfile: () => void;
  onStartDM: (otherUserId: string) => void;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  image: string;
  degree: 1 | 2 | 0; // 0 is self, 1 is direct, 2 is degree 2
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
}

const ConnectionGraph: React.FC<{ currentUser: any }> = ({ currentUser }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 400;

    const nodes: Node[] = [
      { id: 'me', name: 'You', image: currentUser?.profileImage || '', degree: 0 },
      // 1st Degree
      { id: 'sarah', name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', degree: 1 },
      { id: 'marcus', name: 'Marcus Aurelius', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', degree: 1 },
      { id: 'david', name: 'David Sterling', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', degree: 1 },
      // 2nd Degree
      { id: 'elena', name: 'Elena Rodriguez', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', degree: 2 },
      { id: 'julian', name: 'Julian Moss', image: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100', degree: 2 },
      { id: 'sasha', name: 'Sasha Grey', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100', degree: 2 },
      { id: 'aaron', name: 'Aaron Fletcher', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100', degree: 2 },
    ];

    const links: Link[] = [
      { source: 'me', target: 'sarah' },
      { source: 'me', target: 'marcus' },
      { source: 'me', target: 'david' },
      { source: 'sarah', target: 'elena' },
      { source: 'sarah', target: 'julian' },
      { source: 'marcus', target: 'sasha' },
      { source: 'david', target: 'aaron' },
    ];

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.3)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5);

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .on("click", (event, d) => {
        event.stopPropagation();
        toast(`Neural link active: ${d.name}. Accessing credential vault...`);
      })
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    // Node Background
    node.append("circle")
      .attr("r", d => d.degree === 0 ? 30 : d.degree === 1 ? 25 : 20)
      .attr("fill", d => d.degree === 0 ? "#00FFAB" : d.degree === 1 ? "#1a1a1a" : "#1a1a1a")
      .attr("stroke", d => d.degree === 0 ? "#fff" : d.degree === 1 ? "#00FFAB" : "#666")
      .attr("stroke-width", 2);

    // Filter effect for shadows
    const defs = svg.append("defs");
    const filter = defs.append("filter")
      .attr("id", "drop-shadow")
      .attr("height", "130%");
    filter.append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 3)
      .attr("result", "blur");
    filter.append("feOffset")
      .attr("in", "blur")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("result", "offsetBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "offsetBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Node Image
    node.append("clipPath")
      .attr("id", d => `clip-${d.id}`)
      .append("circle")
      .attr("r", d => d.degree === 0 ? 28 : d.degree === 1 ? 23 : 18);

    node.append("image")
      .attr("xlink:href", d => d.image || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100")
      .attr("clip-path", d => `url(#clip-${d.id})`)
      .attr("x", d => d.degree === 0 ? -28 : d.degree === 1 ? -23 : -18)
      .attr("y", d => d.degree === 0 ? -28 : d.degree === 1 ? -23 : -18)
      .attr("width", d => d.degree === 0 ? 56 : d.degree === 1 ? 46 : 36)
      .attr("height", d => d.degree === 0 ? 56 : d.degree === 1 ? 46 : 36);

    // Labels
    node.append("text")
      .text(d => d.name)
      .attr("dy", d => d.degree === 0 ? 45 : d.degree === 1 ? 40 : 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .attr("class", "font-label uppercase tracking-widest");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [currentUser]);

  return (
    <div ref={containerRef} className="w-full h-[400px] bg-surface-container-low rounded-[32px] overflow-hidden border border-outline-variant/10 relative">
      <div className="absolute top-6 left-6 z-10">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary-container mb-1">Neural Graph</h3>
        <p className="text-[10px] text-outline uppercase tracking-tighter">1st & 2nd Degree Clusters</p>
      </div>
      <div className="absolute bottom-6 right-6 z-10 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00FFAB]"></div>
          <span className="text-[8px] font-bold text-outline uppercase tracking-widest">Direct</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#666]"></div>
          <span className="text-[8px] font-bold text-outline uppercase tracking-widest">2nd Degree</span>
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};

const WhatsAppStyleGroups: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'large'>('all');
  const [joinedGroups, setJoinedGroups] = useState<string[]>([]);

  const groups = [
    {
      id: 'g1',
      name: 'Fintech Rebels',
      lastMessage: 'Sarah: The deal flow is looking sharp for Q3',
      time: '12:45',
      members: 156,
      unread: 3,
      activity: 85,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100',
      isVerified: true
    },
    {
      id: 'g2',
      name: 'M&A Deal Room A-1',
      lastMessage: 'Marcus: Review the NDA by EOD please.',
      time: '11:20',
      members: 12,
      unread: 0,
      activity: 40,
      image: 'https://images.unsplash.com/photo-1570126618983-dd752394636a?w=100',
      isLocked: true
    },
    {
      id: 'g3',
      name: 'Quantum Alpha Network',
      lastMessage: 'System: New whitepaper published.',
      time: 'Yesterday',
      members: 842,
      unread: 12,
      activity: 95,
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?w=100',
      isPublic: true
    }
  ];

  const filteredGroups = groups
    .filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(g => {
      if (filter === 'active') return g.activity > 80;
      if (filter === 'large') return g.members > 100;
      return true;
    });

  const handleToggleGroup = (id: string, name: string) => {
    if (joinedGroups.includes(id)) {
      setJoinedGroups(prev => prev.filter(gid => gid !== id));
      toast.error(`Disconnected from ${name}.`);
    } else {
      setJoinedGroups(prev => [...prev, id]);
      toast.success(`Encrypted link established with ${name}.`);
    }
  };

  return (
    <section className="mb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-black tracking-tighter mb-1 font-headline">Pulse Groups</h2>
          <p className="text-xs text-outline font-medium tracking-tight">Real-time tactical communication hubs.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input 
              type="text" 
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/10 rounded-xl text-xs font-bold focus:outline-none focus:border-primary-container/40 transition-all w-full sm:w-48"
            />
          </div>
          <div className="flex gap-2 bg-surface-container-low p-1 rounded-xl border border-outline-variant/10">
            {(['all', 'active', 'large'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-primary-container text-on-primary-fixed shadow-sm' : 'text-outline hover:text-on-surface'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1 bg-surface-container-low border border-outline-variant/10 rounded-[32px] overflow-hidden">
        <AnimatePresence mode="popLayout">
          {filteredGroups.map((group) => (
            <motion.div 
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key={group.id} 
              className="p-4 flex items-center gap-4 hover:bg-surface-container transition-colors cursor-pointer border-b border-outline-variant/5 last:border-0 group/item"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-outline-variant/20 shadow-md transform group-hover/item:scale-105 transition-transform">
                  <img src={group.image} alt={group.name} className="w-full h-full object-cover" />
                </div>
                {group.isLocked && (
                  <div className="absolute -top-1 -right-1 bg-surface-container p-1 rounded-lg border border-outline-variant/30 text-primary-container shadow-sm">
                    <Lock className="w-3 h-3" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="font-bold text-base truncate uppercase tracking-tight">{group.name}</h3>
                    {group.isVerified && <Check className="w-3.5 h-3.5 text-[#00FFAB]" />}
                  </div>
                  <span className="text-[10px] text-outline font-medium">{group.time}</span>
                </div>
                
                <div className="flex justify-between items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-secondary truncate font-medium mb-1">{group.lastMessage}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-outline uppercase tracking-widest">{group.members} nodes</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className={`w-3 h-3 ${group.activity > 80 ? 'text-[#00FFAB]' : 'text-outline'}`} />
                        <span className="text-[10px] font-bold text-outline">{group.activity}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart2 className="w-3 h-3 text-primary-container" />
                        <span className="text-[10px] font-bold text-outline">{(group.members * 12 + group.activity * 5).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {group.unread > 0 && (
                      <span className="bg-[#00FFAB] text-black text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(0,255,171,0.5)]">
                        {group.unread}
                      </span>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleToggleGroup(group.id, group.name); }}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                        joinedGroups.includes(group.id) 
                          ? 'border-[#00FFAB]/20 text-[#00FFAB] bg-[#00FFAB]/5' 
                          : 'border-outline-variant/30 text-on-surface hover:bg-surface-container-highest'
                      }`}
                    >
                      {joinedGroups.includes(group.id) ? 'Joined' : 'Join'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredGroups.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-outline font-bold text-sm">No signals found matching your filter.</p>
          </div>
        )}
      </div>
    </section>
  );
};


const NetworkView: React.FC<NetworkViewProps> = ({ currentUser, onNavigateToProfile, onStartDM }) => {
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [invites, setInvites] = useState([
    {
      id: 'invite-1',
      name: 'Sarah Chen',
      role: 'Design Director at Meta Systems',
      note: '"I\'ve followed your architecture work for years. Would love to sync."',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop'
    },
    {
      id: 'invite-2',
      name: 'Marcus Aurelius',
      role: 'Principal Engineer @ Quantum Labs',
      note: 'Mutual connections: 12',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'
    }
  ]);
  
  const handleConnect = (id: string) => {
    if (!connectedIds.includes(id)) {
      setConnectedIds([...connectedIds, id]);
      toast.success('Connection request synchronized.');
    }
  };

  const handleAcceptInvite = (id: string, name: string) => {
    setInvites(prev => prev.filter(inv => inv.id !== id));
    toast.success(`Access granted to ${name}.`);
    setConnectedIds(prev => [...prev, id]); // Add to connections
  };

  const handleIgnoreInvite = (id: string, name: string) => {
    setInvites(prev => prev.filter(inv => inv.id !== id));
    toast.error(`Identity sync declined for ${name}.`);
  };

  const recommendations = [
    {
      id: 'rec-1',
      name: 'David Sterling',
      role: 'Senior Architect at Urban Theory',
      badge: 'HIRING',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
    },
    {
      id: 'rec-2',
      name: 'Elena Rodriguez',
      role: 'VP of Growth, FinTech Global',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'
    },
    {
      id: 'rec-3',
      name: 'Julian Moss',
      role: 'Creative Lead @ Studio 9',
      image: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop'
    }
  ];

  return (
    <div className="flex-1 bg-surface min-h-screen pb-[100px] overflow-y-auto custom-scrollbar">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center sticky top-0 bg-surface/80 backdrop-blur-xl z-20 border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
           <Globe className="w-5 h-5 text-primary-container animate-pulse" />
           <h1 className="text-xl font-bold tracking-tight">The Neural Network</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input 
              type="text" 
              placeholder="Search nodes..."
              className="pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/10 rounded-full text-xs font-bold focus:outline-none focus:border-primary-container/40 transition-all w-48"
              onFocus={() => toast.info('Neural search active')}
            />
          </div>
          <button 
            onClick={() => toast('No new signal notifications')}
            className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface group relative"
          >
            <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-surface shadow-sm"></div>
          </button>
          <div 
            onClick={onNavigateToProfile}
            className="w-10 h-10 rounded-full bg-surface-container overflow-hidden border border-outline-variant/30 cursor-pointer active:scale-95 transition-transform"
          >
            {currentUser?.profileImage ? (
              <img src={currentUser.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-6 h-6 text-outline" />
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="px-6 py-6 max-w-5xl mx-auto">
        {/* Connection Visualizer Section */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tighter mb-1 font-headline uppercase">Neural Map</h2>
              <p className="text-xs text-outline font-medium tracking-tight">Visualizing secondary and tertiary synergies.</p>
            </div>
            <button 
              onClick={() => toast.info('Recalculating neural weights...')}
              className="p-2 bg-surface-container-low border border-outline-variant/10 rounded-lg hover:text-primary-container transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
          <ConnectionGraph currentUser={currentUser} />
        </section>

        {/* Global Connection Stats */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div 
            onClick={() => toast.info('Accessing global node register...')}
            className="bg-surface-container-low border border-outline-variant/10 p-6 rounded-[32px] group hover:border-[#00FFAB]/30 transition-all cursor-pointer active:scale-[0.98]"
          >
            <TrendingUp className="w-6 h-6 text-[#00FFAB] mb-4 group-hover:translate-y-[-2px] transition-transform" />
            <p className="text-3xl font-black tracking-tighter">8,432</p>
            <p className="text-[10px] text-outline uppercase tracking-widest font-bold">Network Nodes</p>
          </div>
          <div 
            onClick={() => toast.info('Viewing active synergy map...')}
            className="bg-surface-container-low border border-outline-variant/10 p-6 rounded-[32px] group hover:border-primary-container/30 transition-all cursor-pointer active:scale-[0.98]"
          >
            <UserCheck className="w-6 h-6 text-primary-container mb-4 group-hover:translate-y-[-2px] transition-transform" />
            <p className="text-3xl font-black tracking-tighter">114</p>
            <p className="text-[10px] text-outline uppercase tracking-widest font-bold">Direct Synergies</p>
          </div>
        </div>

        {/* Pending Invites */}
        <section className="mb-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-tighter mb-1 font-headline">Pending Access</h2>
              <p className="text-xs text-outline font-medium tracking-tight">Identity synchronization required.</p>
            </div>
            <button 
              onClick={() => toast.info('Accessing full request queue...')}
              className="text-[10px] font-black uppercase tracking-widest text-primary-container hover:opacity-80 transition-opacity"
            >
              Queue ({invites.length + 12})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {invites.map(invite => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={invite.id} 
                  className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 transition-all hover:bg-surface-container shadow-sm group/invite"
                >
                  <div className="flex gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-outline-variant/30 flex-shrink-0 group-hover/invite:scale-105 transition-transform">
                      <img src={invite.image} alt={invite.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg leading-tight mb-0.5 truncate">{invite.name}</h3>
                      <p className="text-xs text-primary-container font-black uppercase tracking-tighter mb-2 truncate">{invite.role}</p>
                      <p className="text-[10px] text-secondary italic leading-tight line-clamp-2">{invite.note}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button 
                      onClick={() => handleIgnoreInvite(invite.id, invite.name)}
                      className="py-2.5 bg-surface-container-high text-on-surface rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-surface-container-highest transition-colors"
                    >
                      Ignore
                    </button>
                    <button 
                      onClick={() => handleAcceptInvite(invite.id, invite.name)}
                      className="py-2.5 bg-on-surface text-surface rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
                    >
                      Accept
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {invites.length === 0 && (
              <div className="col-span-full py-8 text-center bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/20">
                <p className="text-sm font-bold text-outline uppercase tracking-widest">No pending access requests</p>
              </div>
            )}
          </div>
        </section>

        {/* Pulse Groups Section */}
        <WhatsAppStyleGroups />

        {/* Recommended Experts */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-tighter mb-1 font-headline">Recommended Clusters</h2>
              <p className="text-xs text-outline font-medium tracking-tight">Sync-matched profiles for your vertical.</p>
            </div>
            <Plus className="w-6 h-6 text-outline" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map(person => (
              <div key={person.id} className="bg-surface-container-low border border-outline-variant/10 rounded-[40px] p-8 flex flex-col items-center text-center relative group hover:border-primary-container/30 transition-all shadow-sm">
                {person.badge && (
                  <div className="absolute top-6 right-6 px-3 py-1 bg-primary-container/10 border border-primary-container/20 rounded-lg">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-container">{person.badge}</span>
                  </div>
                )}
                <div className="w-24 h-24 rounded-3xl overflow-hidden mb-6 border border-outline-variant/30 group-hover:scale-105 transition-transform duration-500 shadow-xl relative">
                  <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                  {connectedIds.includes(person.id) && (
                    <div className="absolute inset-0 bg-primary-container/40 backdrop-blur-sm flex items-center justify-center">
                      <UserCheck className="w-8 h-8 text-on-primary-fixed" />
                    </div>
                  )}
                </div>
                <h3 className="font-black text-xl mb-1">{person.name}</h3>
                <p className="text-xs text-outline font-medium mb-8 leading-relaxed max-w-[200px] h-10">{person.role}</p>
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => handleConnect(person.id)}
                    disabled={connectedIds.includes(person.id)}
                    className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                      connectedIds.includes(person.id)
                        ? 'bg-[#00FFAB]/10 border border-[#00FFAB]/30 text-[#00FFAB]'
                        : 'bg-surface-container-high border border-outline-variant/20 text-on-surface hover:bg-surface-container-highest'
                    }`}
                  >
                    {connectedIds.includes(person.id) ? (
                      <>
                        <Check className="w-4 h-4" /> Connected
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" /> Connect
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => CallSignals.triggerCall(person.id, 'video')}
                    className="p-4 bg-surface-container-high border border-outline-variant/20 rounded-2xl text-on-surface hover:bg-surface-container-highest transition-all active:scale-[0.98]"
                    title="Video Call"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onStartDM(person.id)}
                    className="p-4 bg-surface-container-high border border-outline-variant/20 rounded-2xl text-primary-container hover:bg-surface-container-highest transition-all active:scale-[0.98]"
                    title="Send Message"
                  >
                    <Mail className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Discover More CTA */}
        <div className="border-2 border-dashed border-outline-variant/20 rounded-[40px] p-12 flex flex-col items-center text-center group cursor-pointer hover:border-primary-container/40 transition-all bg-surface-container-low/30">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
            <Users className="w-8 h-8 text-outline group-hover:text-primary-container transition-colors" />
          </div>
          <h3 className="font-black text-2xl mb-2">Expand Node Network</h3>
          <p className="text-xs text-outline font-medium mb-8 leading-relaxed max-w-[240px]">
            Scale your professional synergies by synchronizing your global contact list with our neural mapping engine.
          </p>
          <button 
            onClick={() => {
              toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
                loading: 'Synchronizing global contact list...',
                success: '842 secondary nodes identified and mapped.',
                error: 'Sync failed: Connection unstable.'
              });
            }}
            className="px-10 py-4 bg-primary-container text-on-primary-fixed rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary-container/20"
          >
            SYNC GLOBAL CONTACTS
          </button>
        </div>
      </div>
    </div>
  );
};

export default NetworkView;
